import { Link } from "react-router-dom";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui";

import { ApiClientError } from "../api";
import { ErrorState, LoadingState } from "../components/RouteState";
import { useDevelopers } from "../hooks/developers";
import { useTasks } from "../hooks/tasks";

const LATEST_TASKS_LIMIT = 10;

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
  const latestTasks = [...tasks]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, LATEST_TASKS_LIMIT);

  return (
    <div className="flex flex-col gap-6">
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

      {hasNoTasks ? null : (
        <Card>
          <CardHeader>
            <CardTitle>Latest tasks</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {latestTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between gap-3 border-b pb-3 last:border-b-0 last:pb-0"
              >
                <div className="flex flex-col">
                  <Link
                    to="/task"
                    className="text-sm font-medium hover:underline"
                  >
                    {task.title}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {new Date(task.createdAt).toLocaleString()}
                  </span>
                </div>
                <Badge
                  variant={task.status === "DONE" ? "default" : "secondary"}
                >
                  {task.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
