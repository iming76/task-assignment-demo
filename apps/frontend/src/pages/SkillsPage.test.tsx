import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithQueryClient } from "../test/render";
import { SkillsPage } from "./SkillsPage";

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
      const path = url.replace("http://localhost:3000", "");
      const key = `${init?.method ?? "GET"} ${path}`;
      const entry = responses[key];
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

describe("SkillsPage", () => {
  it("shows a loading state before data arrives", () => {
    mockApi({
      "GET /skills": () => new Promise(() => {}),
      "GET /categories": { status: 200, body: [] },
    });

    renderWithQueryClient(<SkillsPage />);

    expect(screen.getByText("Loading skills…")).toBeInTheDocument();
  });

  it("shows an error state when the skill list fails to load", async () => {
    mockApi({
      "GET /skills": {
        status: 500,
        body: {
          error: { code: "INTERNAL_ERROR", message: "Server exploded." },
        },
      },
      "GET /categories": { status: 200, body: [] },
    });

    renderWithQueryClient(<SkillsPage />);

    expect(await screen.findByText("Server exploded.")).toBeInTheDocument();
  });

  it("shows the empty state and creates a skill with an API-provided category", async () => {
    const user = userEvent.setup();
    mockApi({
      "GET /skills": { status: 200, body: [] },
      "GET /categories": {
        status: 200,
        body: [{ id: "c1", name: "Backend" }],
      },
      "POST /skills": {
        status: 201,
        body: {
          id: "s1",
          name: "Node.js",
          description: "Runtime",
          categoryId: "c1",
        },
      },
    });

    renderWithQueryClient(<SkillsPage />);

    expect(await screen.findByText("No skills yet")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Name"), "Node.js");
    await user.type(screen.getByLabelText("Description"), "Runtime");
    await user.click(screen.getByRole("combobox", { name: "Category" }));
    await user.click(await screen.findByRole("option", { name: "Backend" }));
    await user.click(screen.getByRole("button", { name: "Add skill" }));

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/skills",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Node.js",
          description: "Runtime",
          categoryId: "c1",
        }),
      }),
    );
  });

  it("cancels a delete without sending a request", async () => {
    const user = userEvent.setup();
    mockApi({
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

    renderWithQueryClient(<SkillsPage />);

    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.queryByRole("button", { name: "Cancel" }),
    ).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalledWith(
      "http://localhost:3000/skills/s1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("prevents duplicate delete submissions while pending", async () => {
    const user = userEvent.setup();
    let resolveDelete: (() => void) | undefined;
    mockApi({
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
      "DELETE /skills/s1": () =>
        new Promise((resolve) => {
          resolveDelete = () => resolve({ status: 204, body: null });
        }),
    });

    renderWithQueryClient(<SkillsPage />);

    await user.click(await screen.findByRole("button", { name: "Delete" }));
    const dialog = screen.getByRole("alertdialog");
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
      expect(screen.queryByText("Delete React?")).not.toBeInTheDocument(),
    );
  });

  it("shows the authoritative IN_USE explanation when delete is rejected", async () => {
    const user = userEvent.setup();
    mockApi({
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
      "DELETE /skills/s1": {
        status: 409,
        body: {
          error: { code: "IN_USE", message: "Skill is required by a task." },
        },
      },
    });

    renderWithQueryClient(<SkillsPage />);

    await user.click(await screen.findByRole("button", { name: "Delete" }));
    const dialog = screen.getByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(
      await screen.findByText("Skill is required by a task."),
    ).toBeInTheDocument();
  });
});
