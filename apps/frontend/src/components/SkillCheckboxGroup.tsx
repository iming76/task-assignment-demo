import type { Skill } from "@repo/shared-types";

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}

interface SkillCheckboxGroupProps {
  skills: Skill[];
  selectedSkillIds: string[];
  onChange: (skillIds: string[]) => void;
  idPrefix: string;
}

export function SkillCheckboxGroup({
  skills,
  selectedSkillIds,
  onChange,
  idPrefix,
}: SkillCheckboxGroupProps) {
  if (skills.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No skills defined yet.</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {skills.map((skill) => (
        <label
          key={skill.id}
          htmlFor={`${idPrefix}-skill-${skill.id}`}
          className="flex items-center gap-1.5 text-sm"
        >
          <input
            id={`${idPrefix}-skill-${skill.id}`}
            type="checkbox"
            checked={selectedSkillIds.includes(skill.id)}
            onChange={() => onChange(toggleId(selectedSkillIds, skill.id))}
          />
          {skill.name}
        </label>
      ))}
    </div>
  );
}
