import { Link } from "react-router-dom";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@repo/ui";

import { ApiClientError } from "../api";
import { ErrorState, LoadingState } from "../components/RouteState";
import { useDevelopers } from "../hooks/developers";
import { useTasks } from "../hooks/tasks";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? error.message : fallback;
}

export function DashboardPage() {
  const tasksQuery = useTasks();
  const developersQuery = useDevelopers();

  if (tasksQuery.isLoading || developersQuery.isLoading) {
    return <LoadingState label="Loading dashboard…" />;
  }

  if (tasksQuery.isError) {
    return (
      <ErrorState
        description={errorMessage(tasksQuery.error, "Unable to load tasks.")}
      />
    );
  }

  if (developersQuery.isError) {
    return (
      <ErrorState
        description={errorMessage(
          developersQuery.error,
          "Unable to load developers.",
        )}
      />
    );
  }

  const tasks = tasksQuery.data ?? [];
  const developers = developersQuery.data ?? [];
  const hasNoTasks = tasks.length === 0;
  const hasNoDevelopers = developers.length === 0;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Task Assignment</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {hasNoTasks || hasNoDevelopers ? (
            <p className="text-sm text-muted-foreground">
              Create a developer, a skill, or a task to get started.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {tasks.length} task{tasks.length === 1 ? "" : "s"} and{" "}
              {developers.length} developer
              {developers.length === 1 ? "" : "s"} on record.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {hasNoTasks ? (
              <Button asChild>
                <Link to="/task">Create your first task</Link>
              </Button>
            ) : null}
            {hasNoDevelopers ? (
              <Button asChild variant="outline">
                <Link to="/developer">Create your first developer</Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
