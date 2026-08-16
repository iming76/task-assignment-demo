import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithQueryClient } from "../test/render";
import { DevelopersPage } from "./DevelopersPage";

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

describe("DevelopersPage", () => {
  it("shows a loading state before data arrives", async () => {
    mockApi({
      "GET /developers": () => new Promise(() => {}),
      "GET /skills": { status: 200, body: [] },
    });

    renderWithQueryClient(<DevelopersPage />);

    expect(screen.getByText("Loading developers…")).toBeInTheDocument();
  });

  it("shows an error state when the developer list fails to load", async () => {
    mockApi({
      "GET /developers": {
        status: 500,
        body: {
          error: { code: "INTERNAL_ERROR", message: "Server exploded." },
        },
      },
      "GET /skills": { status: 200, body: [] },
    });

    renderWithQueryClient(<DevelopersPage />);

    expect(await screen.findByText("Server exploded.")).toBeInTheDocument();
  });

  it("shows the empty state and creates a developer", async () => {
    const user = userEvent.setup();
    mockApi({
      "GET /developers": { status: 200, body: [] },
      "GET /skills": {
        status: 200,
        body: [
          { id: "s1", name: "React", description: "UI", categoryId: "c1" },
        ],
      },
      "POST /developers": {
        status: 201,
        body: { id: "d1", name: "Ada", skillIds: ["s1"] },
      },
    });

    renderWithQueryClient(<DevelopersPage />);

    expect(await screen.findByText("No developers yet")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Name"), "Ada");
    await user.click(screen.getByRole("checkbox", { name: "React" }));
    await user.click(screen.getByRole("button", { name: "Add developer" }));

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/developers",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Ada", skillIds: ["s1"] }),
      }),
    );
  });

  it("cancels a delete without sending a request", async () => {
    const user = userEvent.setup();
    mockApi({
      "GET /developers": {
        status: 200,
        body: [{ id: "d1", name: "Ada", skillIds: [] }],
      },
      "GET /skills": { status: 200, body: [] },
    });

    renderWithQueryClient(<DevelopersPage />);

    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.queryByRole("button", { name: "Cancel" }),
    ).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalledWith(
      "http://localhost:3000/developers/d1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("prevents duplicate delete submissions while pending", async () => {
    const user = userEvent.setup();
    let resolveDelete: (() => void) | undefined;
    mockApi({
      "GET /developers": {
        status: 200,
        body: [{ id: "d1", name: "Ada", skillIds: [] }],
      },
      "GET /skills": { status: 200, body: [] },
      "DELETE /developers/d1": () =>
        new Promise((resolve) => {
          resolveDelete = () => resolve({ status: 204, body: null });
        }),
    });

    renderWithQueryClient(<DevelopersPage />);

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
      expect(screen.queryByText("Delete Ada?")).not.toBeInTheDocument(),
    );
  });

  it("shows the authoritative IN_USE explanation when delete is rejected", async () => {
    const user = userEvent.setup();
    mockApi({
      "GET /developers": {
        status: 200,
        body: [{ id: "d1", name: "Ada", skillIds: [] }],
      },
      "GET /skills": { status: 200, body: [] },
      "DELETE /developers/d1": {
        status: 409,
        body: {
          error: {
            code: "IN_USE",
            message: "Developer is assigned to a task.",
          },
        },
      },
    });

    renderWithQueryClient(<DevelopersPage />);

    await user.click(await screen.findByRole("button", { name: "Delete" }));
    const dialog = screen.getByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(
      await screen.findByText("Developer is assigned to a task."),
    ).toBeInTheDocument();
  });
});
