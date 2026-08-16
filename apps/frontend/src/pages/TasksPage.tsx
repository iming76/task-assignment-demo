import { EmptyState } from "../components/RouteState";

export function TasksPage() {
  return (
    <EmptyState
      title="No tasks yet"
      description="Tasks you create will appear here."
    />
  );
}
