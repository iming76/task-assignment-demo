import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithQueryClient } from "../test/render";
import { DEFAULT_API_BASE_URL } from "../api/http";
import { TasksPage } from "./TasksPage";

interface MockResponse {
  status: number;
  body: unknown;
}

function mockApi(
  responses: Record<string, MockResponse | (() => Promise<MockResponse>)>,
) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const path = url.replace(DEFAULT_API_BASE_URL, "");
      const key = `${init?.method ?? "GET"} ${path}`;
      const entry =
        responses[key] ??
        (key === "GET /categories" ? { status: 200, body: [] } : undefined);
      if (!entry) {
        throw new Error(`Unhandled request: ${key}`);
      }
      const resolved = typeof entry === "function" ? await entry() : entry;
      return {
        ok: resolved.status < 400,
        status: resolved.status,
        json: async () => resolved.body,
      } as Response;
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const noDevelopers = { "GET /developers": { status: 200, body: [] } };
const noSkills = { "GET /skills": { status: 200, body: [] } };

const root = {
  id: "root",
  title: "Root",
  description: "Root task.",
  status: "TODO",
  depth: 1,
  assigneeId: null,
  parentTaskId: null,
  requiredSkillIds: [],
};
const child = {
  id: "child",
  title: "Child",
  description: "Child task.",
  status: "TODO",
  depth: 2,
  assigneeId: null,
  parentTaskId: "root",
  requiredSkillIds: [],
};
const grandchild = {
  id: "grandchild",
  title: "Grandchild",
  description: "Grandchild task.",
  status: "TODO",
  depth: 3,
  assigneeId: null,
  parentTaskId: "child",
  requiredSkillIds: [],
};

describe("TasksPage", () => {
  it("shows a loading state before data arrives", async () => {
    mockApi({
      "GET /tasks": () => new Promise(() => {}),
      ...noDevelopers,
      ...noSkills,
    });

    renderWithQueryClient(<TasksPage />);

    expect(screen.getByText("Loading tasks…")).toBeInTheDocument();
  });

  it("shows an error state when the task list fails to load", async () => {
    mockApi({
      "GET /tasks": {
        status: 500,
        body: {
          error: { code: "INTERNAL_ERROR", message: "Server exploded." },
        },
      },
      ...noDevelopers,
      ...noSkills,
    });

    renderWithQueryClient(<TasksPage />);

    expect(await screen.findByText("Server exploded.")).toBeInTheDocument();
  });

  it("shows the empty state when there are no tasks", async () => {
    mockApi({
      "GET /tasks": { status: 200, body: [] },
      ...noDevelopers,
      ...noSkills,
    });

    renderWithQueryClient(<TasksPage />);

    expect(await screen.findByText("No tasks yet")).toBeInTheDocument();
  });

  it("renders a three-level hierarchy from the flat task response", async () => {
    mockApi({
      "GET /tasks": { status: 200, body: [root, child, grandchild] },
      ...noDevelopers,
      ...noSkills,
    });

    renderWithQueryClient(<TasksPage />);

    expect(await screen.findByText("Root")).toBeInTheDocument();
    expect(screen.getByText("Child")).toBeInTheDocument();
    expect(screen.getByText("Grandchild")).toBeInTheDocument();
  });

  it("omits requiredSkillIds when the create form's skills are never touched", async () => {
    const user = userEvent.setup();
    mockApi({
      "GET /tasks": { status: 200, body: [] },
      "GET /developers": {
        status: 200,
        body: [{ id: "d1", name: "Frontend Dev", skillIds: [] }],
      },
      ...noSkills,
      "POST /tasks": { status: 201, body: root },
    });

    renderWithQueryClient(<TasksPage />);
    await screen.findByText("No tasks yet");

    await user.click(screen.getByRole("button", { name: "Add task" }));
    await user.type(screen.getByLabelText("Title"), "Root");
    await user.type(screen.getByLabelText("Description"), "Root task.");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        `${DEFAULT_API_BASE_URL}/tasks`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ title: "Root", description: "Root task." }),
        }),
      ),
    );
  });

  it("requires complete assignment choices when an assignee is required", async () => {
    const user = userEvent.setup();
    mockApi({
      "GET /tasks": { status: 200, body: [] },
      "GET /developers": {
        status: 200,
        body: [{ id: "d1", name: "Frontend Dev", skillIds: ["s1"] }],
      },
      "GET /skills": {
        status: 200,
        body: [
          { id: "s1", name: "React", description: "UI", categoryId: "c1" },
        ],
      },
      "GET /categories": {
        status: 200,
        body: [{ id: "c1", name: "Frontend" }],
      },
    });

    renderWithQueryClient(<TasksPage />);
    await screen.findByText("No tasks yet");

    await user.click(screen.getByRole("button", { name: "Add task" }));
    const addButton = screen.getByRole("button", { name: "Add task" });
    expect(screen.queryByLabelText("Category")).not.toBeInTheDocument();

    await user.click(screen.getByRole("switch", { name: "Required assignee" }));
    expect(addButton).toBeDisabled();
    await user.click(screen.getByLabelText("Category"));
    await user.click(screen.getByRole("option", { name: "Frontend" }));
    const checkbox = await screen.findByRole("checkbox", { name: "React" });
    await user.click(checkbox);
    await user.click(checkbox);
    expect(addButton).toBeDisabled();
  });

  it("filters skills by category and recommends an eligible developer with the lowest incomplete workload", async () => {
    const user = userEvent.setup();
    const busyTask = {
      ...root,
      id: "busy-task",
      title: "Busy task",
      assigneeId: "d-busy",
    };
    const completedTask = {
      ...root,
      id: "completed-task",
      title: "Completed task",
      status: "DONE",
      assigneeId: "d-available",
    };
    const createdTask = {
      ...root,
      id: "created-task",
      title: "Build form",
      requiredSkillIds: ["s-react"],
    };

    mockApi({
      "GET /tasks": {
        status: 200,
        body: [busyTask, completedTask],
      },
      "GET /categories": {
        status: 200,
        body: [
          { id: "c-frontend", name: "Frontend" },
          { id: "c-backend", name: "Backend" },
        ],
      },
      "GET /skills": {
        status: 200,
        body: [
          {
            id: "s-react",
            name: "React",
            description: "UI",
            categoryId: "c-frontend",
          },
          {
            id: "s-node",
            name: "Node.js",
            description: "API",
            categoryId: "c-backend",
          },
          {
            id: "s-unowned",
            name: "Vue",
            description: "UI",
            categoryId: "c-frontend",
          },
        ],
      },
      "GET /developers": {
        status: 200,
        body: [
          { id: "d-busy", name: "Busy Dev", skillIds: ["s-react"] },
          {
            id: "d-available",
            name: "Available Dev",
            skillIds: ["s-react"],
          },
          { id: "d-backend", name: "Backend Dev", skillIds: ["s-node"] },
        ],
      },
      "POST /tasks": { status: 201, body: createdTask },
      "PATCH /tasks/created-task": {
        status: 200,
        body: { ...createdTask, assigneeId: "d-available" },
      },
    });

    renderWithQueryClient(<TasksPage />);
    await screen.findByText("Busy task");

    await user.click(screen.getByRole("button", { name: "Add task" }));
    expect(
      screen.queryByRole("checkbox", { name: "React" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Category")).not.toBeInTheDocument();
    await user.click(screen.getByRole("switch", { name: "Required assignee" }));
    await user.click(screen.getByLabelText("Category"));
    await user.click(screen.getByRole("option", { name: "Frontend" }));

    expect(
      await screen.findByRole("checkbox", { name: "React" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "Node.js" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "Vue" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "React" }));
    expect(screen.getByLabelText("Assignee")).toHaveTextContent(
      "Available Dev (0 incomplete tasks)",
    );

    await user.click(screen.getByLabelText("Assignee"));
    expect(
      screen.getByRole("option", {
        name: "Available Dev (0 incomplete tasks)",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Busy Dev (1 incomplete task)" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /Backend Dev/ }),
    ).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.type(screen.getByLabelText("Title"), "Build form");
    await user.type(screen.getByLabelText("Description"), "Create task form.");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        `${DEFAULT_API_BASE_URL}/tasks/created-task`,
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ assigneeId: "d-available" }),
        }),
      ),
    );
  });

  it("creates a grandchild with the second-level task as parentTaskId", async () => {
    const user = userEvent.setup();
    mockApi({
      "GET /tasks": { status: 200, body: [root, child] },
      ...noDevelopers,
      ...noSkills,
      "POST /tasks": { status: 201, body: grandchild },
    });

    renderWithQueryClient(<TasksPage />);
    await screen.findByText("Child");

    const childCard = screen
      .getByText("Child")
      .closest('[data-slot="card"]') as HTMLElement;
    await user.click(
      within(childCard).getByRole("button", { name: "Add subtask" }),
    );
    expect(
      within(childCard).getByRole("switch", { name: "Required assignee" }),
    ).toBeInTheDocument();

    await user.type(within(childCard).getByLabelText("Title"), "Grandchild");
    await user.type(
      within(childCard).getByLabelText("Description"),
      "Grandchild task.",
    );
    await user.click(
      within(childCard).getByRole("button", { name: "Add subtask" }),
    );

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        `${DEFAULT_API_BASE_URL}/tasks`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            title: "Grandchild",
            description: "Grandchild task.",
            parentTaskId: "child",
          }),
        }),
      ),
    );
  });

  it("uses the shared assignment fields when creating a subtask", async () => {
    const user = userEvent.setup();
    const assignedChild = {
      ...child,
      requiredSkillIds: ["s1"],
    };
    mockApi({
      "GET /tasks": { status: 200, body: [root] },
      "GET /categories": {
        status: 200,
        body: [{ id: "c1", name: "Frontend" }],
      },
      "GET /skills": {
        status: 200,
        body: [
          { id: "s1", name: "React", description: "UI", categoryId: "c1" },
        ],
      },
      "GET /developers": {
        status: 200,
        body: [{ id: "d1", name: "Frontend Dev", skillIds: ["s1"] }],
      },
      "POST /tasks": { status: 201, body: assignedChild },
      "PATCH /tasks/child": {
        status: 200,
        body: { ...assignedChild, assigneeId: "d1" },
      },
    });

    renderWithQueryClient(<TasksPage />);
    const rootCard = (await screen.findByText("Root")).closest(
      '[data-slot="card"]',
    ) as HTMLElement;
    await user.click(
      within(rootCard).getByRole("button", { name: "Add subtask" }),
    );
    await user.type(within(rootCard).getByLabelText("Title"), "Child");
    await user.type(
      within(rootCard).getByLabelText("Description"),
      "Child task.",
    );
    await user.click(
      within(rootCard).getByRole("switch", { name: "Required assignee" }),
    );
    await user.click(within(rootCard).getByLabelText("Category"));
    await user.click(screen.getByRole("option", { name: "Frontend" }));
    await user.click(
      await within(rootCard).findByRole("checkbox", { name: "React" }),
    );

    expect(within(rootCard).getByLabelText("Assignee")).toHaveTextContent(
      "Frontend Dev (0 incomplete tasks)",
    );
    await user.click(
      within(rootCard).getByRole("button", { name: "Add subtask" }),
    );

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        `${DEFAULT_API_BASE_URL}/tasks`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            title: "Child",
            description: "Child task.",
            parentTaskId: "root",
            requiredSkillIds: ["s1"],
          }),
        }),
      ),
    );
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        `${DEFAULT_API_BASE_URL}/tasks/child`,
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ assigneeId: "d1" }),
        }),
      ),
    );
  });

  it("does not offer subtask creation beneath a third-level task", async () => {
    mockApi({
      "GET /tasks": { status: 200, body: [root, child, grandchild] },
      ...noDevelopers,
      ...noSkills,
    });

    renderWithQueryClient(<TasksPage />);
    const grandchildCard = (await screen.findByText("Grandchild")).closest(
      '[data-slot="card"]',
    ) as HTMLElement;

    expect(
      within(grandchildCard).queryByRole("button", { name: "Add subtask" }),
    ).not.toBeInTheDocument();
  });

  it("only offers eligible developers as assignees and submits the assignment", async () => {
    const user = userEvent.setup();
    mockApi({
      "GET /tasks": {
        status: 200,
        body: [{ ...root, requiredSkillIds: ["s1"] }],
      },
      "GET /developers": {
        status: 200,
        body: [
          { id: "d1", name: "Eligible Dev", skillIds: ["s1"] },
          { id: "d2", name: "Ineligible Dev", skillIds: [] },
        ],
      },
      "GET /skills": {
        status: 200,
        body: [
          { id: "s1", name: "React", description: "UI", categoryId: "c1" },
        ],
      },
      "PATCH /tasks/root": {
        status: 200,
        body: { ...root, requiredSkillIds: ["s1"], assigneeId: "d1" },
      },
    });

    renderWithQueryClient(<TasksPage />);
    await screen.findByText("Root");

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByLabelText("Assignee"));

    expect(
      screen.getByRole("option", {
        name: "Eligible Dev (0 incomplete tasks)",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Ineligible Dev" }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("option", {
        name: "Eligible Dev (0 incomplete tasks)",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        `${DEFAULT_API_BASE_URL}/tasks/root`,
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            title: "Root",
            description: "Root task.",
            requiredSkillIds: ["s1"],
            assigneeId: "d1",
          }),
        }),
      ),
    );
  });

  it("corrects required skills through the edit form", async () => {
    const user = userEvent.setup();
    mockApi({
      "GET /tasks": { status: 200, body: [root] },
      "GET /developers": {
        status: 200,
        body: [{ id: "d1", name: "Frontend Dev", skillIds: ["s1"] }],
      },
      "GET /categories": {
        status: 200,
        body: [{ id: "c1", name: "Frontend" }],
      },
      "GET /skills": {
        status: 200,
        body: [
          { id: "s1", name: "React", description: "UI", categoryId: "c1" },
        ],
      },
      "PATCH /tasks/root": {
        status: 200,
        body: { ...root, requiredSkillIds: ["s1"] },
      },
    });

    renderWithQueryClient(<TasksPage />);
    const rootCard = (await screen.findByText("Root")).closest(
      '[data-slot="card"]',
    ) as HTMLElement;

    await user.click(within(rootCard).getByRole("button", { name: "Edit" }));
    await user.click(
      within(rootCard).getByRole("switch", { name: "Required assignee" }),
    );
    await user.click(within(rootCard).getByLabelText("Category"));
    await user.click(screen.getByRole("option", { name: "Frontend" }));
    await user.click(
      await within(rootCard).findByRole("checkbox", { name: "React" }),
    );
    await user.click(within(rootCard).getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        `${DEFAULT_API_BASE_URL}/tasks/root`,
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            title: "Root",
            description: "Root task.",
            requiredSkillIds: ["s1"],
            assigneeId: "d1",
          }),
        }),
      ),
    );
  });

  it("cancels a delete without sending a request", async () => {
    const user = userEvent.setup();
    mockApi({
      "GET /tasks": { status: 200, body: [root] },
      ...noDevelopers,
      ...noSkills,
    });

    renderWithQueryClient(<TasksPage />);
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.queryByRole("button", { name: "Cancel" }),
    ).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalledWith(
      `${DEFAULT_API_BASE_URL}/tasks/root`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("prevents duplicate delete submissions while pending", async () => {
    let resolveDelete: (() => void) | undefined;
    mockApi({
      "GET /tasks": { status: 200, body: [root] },
      ...noDevelopers,
      ...noSkills,
      "DELETE /tasks/root": () =>
        new Promise((resolve) => {
          resolveDelete = () => resolve({ status: 204, body: null });
        }),
    });

    renderWithQueryClient(<TasksPage />);

    const deleteButton = await screen.findByRole("button", { name: "Delete" });
    fireEvent.click(deleteButton);
    const dialog = await screen.findByRole("alertdialog");
    const confirmButton = within(dialog).getByRole("button", {
      name: "Delete",
    });
    fireEvent.click(confirmButton);
    await waitFor(() => expect(confirmButton).toBeDisabled());
    fireEvent.click(confirmButton);

    const deleteCalls = vi
      .mocked(fetch)
      .mock.calls.filter(
        ([, init]) => (init as RequestInit | undefined)?.method === "DELETE",
      );
    expect(deleteCalls).toHaveLength(1);

    resolveDelete?.();
    await waitFor(() =>
      expect(screen.queryByText("Delete Root?")).not.toBeInTheDocument(),
    );
  });

  it("shows the authoritative IN_USE explanation when delete is rejected", async () => {
    const user = userEvent.setup();
    mockApi({
      "GET /tasks": { status: 200, body: [root] },
      ...noDevelopers,
      ...noSkills,
      "DELETE /tasks/root": {
        status: 409,
        body: {
          error: { code: "IN_USE", message: "Task still has subtasks." },
        },
      },
    });

    renderWithQueryClient(<TasksPage />);

    await user.click(await screen.findByRole("button", { name: "Delete" }));
    const dialog = screen.getByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(
      await screen.findByText("Task still has subtasks."),
    ).toBeInTheDocument();
  });

  it("marks a task done and reflects the successful status change", async () => {
    const user = userEvent.setup();
    let currentRoot = root;
    mockApi({
      "GET /tasks": () => Promise.resolve({ status: 200, body: [currentRoot] }),
      ...noDevelopers,
      ...noSkills,
      "PATCH /tasks/root": () => {
        currentRoot = { ...root, status: "DONE" };
        return Promise.resolve({ status: 200, body: currentRoot });
      },
    });

    renderWithQueryClient(<TasksPage />);
    await screen.findByText("Root");

    await user.click(screen.getByRole("button", { name: "Mark done" }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        `${DEFAULT_API_BASE_URL}/tasks/root`,
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ status: "DONE" }),
        }),
      ),
    );
    expect(
      await screen.findByRole("button", { name: "Reopen" }),
    ).toBeInTheDocument();
  });

  it("shows leaf-up guidance and keeps the previous status when SUBTASKS_INCOMPLETE is returned", async () => {
    const user = userEvent.setup();
    mockApi({
      "GET /tasks": { status: 200, body: [root] },
      ...noDevelopers,
      ...noSkills,
      "PATCH /tasks/root": {
        status: 409,
        body: {
          error: {
            code: "SUBTASKS_INCOMPLETE",
            message:
              "Task child is still TODO; cannot complete a task while a descendant is incomplete",
          },
        },
      },
    });

    renderWithQueryClient(<TasksPage />);
    await screen.findByText("Root");

    await user.click(screen.getByRole("button", { name: "Mark done" }));

    expect(
      await screen.findByText(
        "Task child is still TODO; cannot complete a task while a descendant is incomplete Complete its subtasks first, starting from the leaves and working up.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mark done" }),
    ).toBeInTheDocument();
    expect(screen.getByText("TODO")).toBeInTheDocument();
    expect(screen.queryByText("DONE")).not.toBeInTheDocument();
  });

  it("shows root-down guidance when COMPLETED_ANCESTOR is returned", async () => {
    const user = userEvent.setup();
    const doneChild = { ...child, status: "DONE" };
    mockApi({
      "GET /tasks": { status: 200, body: [root, doneChild] },
      ...noDevelopers,
      ...noSkills,
      "PATCH /tasks/child": {
        status: 409,
        body: {
          error: {
            code: "COMPLETED_ANCESTOR",
            message:
              "Task root is already DONE; cannot reopen a task beneath it",
          },
        },
      },
    });

    renderWithQueryClient(<TasksPage />);
    await screen.findByText("Child");

    const childCard = screen
      .getByText("Child")
      .closest('[data-slot="card"]') as HTMLElement;
    await user.click(within(childCard).getByRole("button", { name: "Reopen" }));

    expect(
      await screen.findByText(
        "Task root is already DONE; cannot reopen a task beneath it Reopen the ancestor tasks first, starting from the root and working down.",
      ),
    ).toBeInTheDocument();
    expect(
      within(childCard).getByRole("button", { name: "Reopen" }),
    ).toBeInTheDocument();
    expect(within(childCard).getByText("DONE")).toBeInTheDocument();
  });

  it("allows retrying a status update after a failure", async () => {
    const user = userEvent.setup();
    let attempts = 0;
    let currentRoot = root;
    mockApi({
      "GET /tasks": () => Promise.resolve({ status: 200, body: [currentRoot] }),
      ...noDevelopers,
      ...noSkills,
      "PATCH /tasks/root": () => {
        attempts += 1;
        if (attempts === 1) {
          return Promise.resolve({
            status: 409,
            body: {
              error: {
                code: "SUBTASKS_INCOMPLETE",
                message: "Task child is still TODO.",
              },
            },
          });
        }
        currentRoot = { ...root, status: "DONE" };
        return Promise.resolve({
          status: 200,
          body: currentRoot,
        });
      },
    });

    renderWithQueryClient(<TasksPage />);
    await screen.findByText("Root");

    await user.click(screen.getByRole("button", { name: "Mark done" }));
    await screen.findByText(
      "Task child is still TODO. Complete its subtasks first, starting from the leaves and working up.",
    );

    await user.click(screen.getByRole("button", { name: "Mark done" }));

    await waitFor(() => expect(attempts).toBe(2));
    expect(
      await screen.findByRole("button", { name: "Reopen" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Task child is still TODO. Complete its subtasks first, starting from the leaves and working up.",
      ),
    ).not.toBeInTheDocument();
  });

  it("shows orphaned tasks in a visible recovery section instead of hiding them", async () => {
    const orphan = {
      ...root,
      id: "lost",
      title: "Lost",
      parentTaskId: "ghost",
    };
    mockApi({
      "GET /tasks": { status: 200, body: [orphan] },
      ...noDevelopers,
      ...noSkills,
    });

    renderWithQueryClient(<TasksPage />);

    expect(await screen.findByText("Orphaned tasks")).toBeInTheDocument();
    expect(screen.getByText("Lost")).toBeInTheDocument();
  });
});
