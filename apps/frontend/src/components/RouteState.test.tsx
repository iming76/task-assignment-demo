import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  EmptyState,
  ErrorState,
  LoadingState,
  NotFoundState,
} from "./RouteState";

describe("RouteState", () => {
  it("renders the loading state", () => {
    render(<LoadingState label="Loading tasks" />);

    expect(screen.getByText("Loading tasks")).toBeInTheDocument();
  });

  it("renders the empty state", () => {
    render(
      <EmptyState title="No tasks yet" description="Create your first task." />,
    );

    expect(screen.getByText("No tasks yet")).toBeInTheDocument();
    expect(screen.getByText("Create your first task.")).toBeInTheDocument();
  });

  it("renders the error state", () => {
    render(<ErrorState description="The request failed." />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("The request failed.")).toBeInTheDocument();
  });

  it("renders the not-found state", () => {
    render(<NotFoundState />);

    expect(screen.getByText("Page not found")).toBeInTheDocument();
  });
});
