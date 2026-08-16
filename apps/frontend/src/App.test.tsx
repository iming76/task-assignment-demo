import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App routing", () => {
  it("navigates between routes without a full page reload", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText("Welcome to Task Assignment")).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Developers" }));

    expect(await screen.findByText("No developers yet")).toBeInTheDocument();
    expect(
      screen.queryByText("Welcome to Task Assignment"),
    ).not.toBeInTheDocument();
  });

  it("renders the not-found frame for unmatched routes", () => {
    render(
      <MemoryRouter initialEntries={["/unknown"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText("Page not found")).toBeInTheDocument();
  });
});
