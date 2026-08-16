import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";

function mockEmptyListResponses(): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    } as Response),
  );
}

function renderApp(initialEntries: string[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("App routing", () => {
  beforeEach(() => {
    mockEmptyListResponses();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("navigates between routes without a full page reload", async () => {
    const user = userEvent.setup();
    renderApp(["/"]);

    expect(
      await screen.findByText("Welcome to Task Assignment"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Developers" }));

    expect(await screen.findByText("No developers yet")).toBeInTheDocument();
    expect(
      screen.queryByText("Welcome to Task Assignment"),
    ).not.toBeInTheDocument();
  });

  it("renders the not-found frame for unmatched routes", () => {
    renderApp(["/unknown"]);

    expect(screen.getByText("Page not found")).toBeInTheDocument();
  });
});
