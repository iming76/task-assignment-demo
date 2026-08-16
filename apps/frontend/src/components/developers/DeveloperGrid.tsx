import type { Developer, Skill } from "@repo/shared-types";
import { Badge, Button, Card, CardContent, CardTitle } from "@repo/ui";

export function DeveloperGrid({
  developers,
  skills,
  onEdit,
  onRequestDelete,
}: {
  developers: Developer[];
  skills: Skill[];
  onEdit: (developer: Developer) => void;
  onRequestDelete: (developer: Developer) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {developers.map((developer) => (
        <Card key={developer.id}>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle>{developer.name}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(developer)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onRequestDelete(developer)}
                >
                  Delete
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {developer.skillIds.length === 0 ? (
                <span className="text-sm text-muted-foreground">No skills</span>
              ) : (
                developer.skillIds.map((skillId) => {
                  const skill = skills.find((s) => s.id === skillId);
                  return (
                    <Badge key={skillId} variant="secondary">
                      {skill?.name ?? skillId}
                    </Badge>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
