import type { Task } from "@repo/shared-types";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@repo/ui";

export function OrphanedTasksCard({
  orphans,
  onRequestDelete,
}: {
  orphans: Task[];
  onRequestDelete: (task: Task) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orphaned tasks</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          These tasks reference a parent that no longer resolves. They are shown
          here so nothing is silently hidden.
        </p>
        {orphans.map((task) => (
          <Card key={task.id}>
            <CardContent className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>{task.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {task.description}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onRequestDelete(task)}
              >
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
