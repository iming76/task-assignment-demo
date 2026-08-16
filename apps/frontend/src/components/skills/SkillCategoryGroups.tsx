import type { Category, Skill } from "@repo/shared-types";
import { Badge, Button, Card, CardContent, CardTitle } from "@repo/ui";

export function groupSkillsByCategory(
  skills: Skill[],
  categories: Category[],
): { category: Category | null; skills: Skill[] }[] {
  const groups = new Map<string | null, Skill[]>();
  for (const skill of skills) {
    const key = categories.some((c) => c.id === skill.categoryId)
      ? skill.categoryId
      : null;
    const existing = groups.get(key);
    if (existing) {
      existing.push(skill);
    } else {
      groups.set(key, [skill]);
    }
  }

  const orderedCategoryIds = categories
    .map((c) => c.id)
    .filter((id) => groups.has(id));
  const keys = groups.has(null)
    ? [...orderedCategoryIds, null]
    : orderedCategoryIds;

  return keys.map((key) => ({
    category: key === null ? null : categories.find((c) => c.id === key)!,
    skills: groups.get(key)!,
  }));
}

export function SkillCategoryGroups({
  skills,
  categories,
  onRequestDelete,
}: {
  skills: Skill[];
  categories: Category[];
  onRequestDelete: (skill: Skill) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      {groupSkillsByCategory(skills, categories).map(
        ({ category, skills: categorySkills }) => (
          <div
            key={category?.id ?? "uncategorized"}
            className="flex flex-col gap-3 mb-6"
          >
            <h2 className="text-sm font-semibold text-muted-foreground">
              {category?.name ?? "Uncategorized"}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categorySkills.map((skill) => (
                <Card key={skill.id}>
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle>{skill.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        {category ? (
                          <Badge variant="secondary">{category.name}</Badge>
                        ) : null}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onRequestDelete(skill)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {skill.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ),
      )}
    </div>
  );
}
