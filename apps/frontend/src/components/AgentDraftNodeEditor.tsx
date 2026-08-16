import type { Developer, Skill } from "@repo/shared-types";
import {
  Card,
  CardContent,
  Field,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";

import type { DraftFieldPatch, KeyedDraft } from "../lib/agent-draft";
import { SkillCheckboxGroup } from "./SkillCheckboxGroup";

const UNASSIGNED = "__unassigned__";

interface AgentDraftNodeEditorProps {
  node: KeyedDraft;
  skills: Skill[];
  developers: Developer[];
  onFieldChange: (localId: string, patch: DraftFieldPatch) => void;
}

export function AgentDraftNodeEditor({
  node,
  skills,
  developers,
  onFieldChange,
}: AgentDraftNodeEditorProps) {
  const eligibleDevelopers = developers.filter((developer) =>
    node.requiredSkillIds.every((skillId) =>
      developer.skillIds.includes(skillId),
    ),
  );
  const hasNoEligibleDeveloper =
    node.requiredSkillIds.length > 0 && eligibleDevelopers.length === 0;
  const assigneeIneligible =
    node.assigneeId !== null &&
    !eligibleDevelopers.some((d) => d.id === node.assigneeId);
  const assigneeOptions =
    assigneeIneligible && node.assigneeId
      ? [
          ...eligibleDevelopers,
          developers.find((d) => d.id === node.assigneeId),
        ].filter((d): d is Developer => d !== undefined)
      : eligibleDevelopers;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <Field>
          <FieldLabel htmlFor={`draft-name-${node.localId}`}>Name</FieldLabel>
          <Input
            id={`draft-name-${node.localId}`}
            value={node.name}
            onChange={(event) =>
              onFieldChange(node.localId, { name: event.target.value })
            }
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`draft-description-${node.localId}`}>
            Description
          </FieldLabel>
          <textarea
            id={`draft-description-${node.localId}`}
            className="min-h-16 w-full rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={node.description}
            onChange={(event) =>
              onFieldChange(node.localId, { description: event.target.value })
            }
            required
          />
        </Field>
        <Field>
          <FieldLabel>Required skills</FieldLabel>
          <SkillCheckboxGroup
            skills={skills}
            selectedSkillIds={node.requiredSkillIds}
            onChange={(ids) =>
              onFieldChange(node.localId, { requiredSkillIds: ids })
            }
            idPrefix={`draft-${node.localId}`}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`draft-assignee-${node.localId}`}>
            Assignee
          </FieldLabel>
          <Select
            value={node.assigneeId ?? UNASSIGNED}
            onValueChange={(value) =>
              onFieldChange(node.localId, {
                assigneeId: value === UNASSIGNED ? null : value,
              })
            }
          >
            <SelectTrigger
              id={`draft-assignee-${node.localId}`}
              className="w-full"
            >
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
              {assigneeOptions.map((developer) => (
                <SelectItem key={developer.id} value={developer.id}>
                  {developer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasNoEligibleDeveloper ? (
            <p className="text-sm text-muted-foreground">
              No developer currently covers every required skill.
            </p>
          ) : assigneeIneligible ? (
            <p className="text-sm text-muted-foreground">
              The selected assignee no longer covers every required skill.
            </p>
          ) : null}
        </Field>

        {node.subtasks.length > 0 ? (
          <div className="flex flex-col gap-3 border-l border-border pl-4">
            {node.subtasks.map((child) => (
              <AgentDraftNodeEditor
                key={child.localId}
                node={child}
                skills={skills}
                developers={developers}
                onFieldChange={onFieldChange}
              />
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
