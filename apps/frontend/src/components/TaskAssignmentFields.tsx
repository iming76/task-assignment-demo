import { useEffect } from "react";

import type { Skill, Task } from "@repo/shared-types";
import {
  Field,
  FieldError,
  FieldLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";

import { ApiClientError } from "../api";
import { useCategories } from "../hooks/categories";
import { useDevelopers } from "../hooks/developers";
import { useSkills } from "../hooks/skills";
import { useTasks } from "../hooks/tasks";
import { SkillCheckboxGroup } from "./SkillCheckboxGroup";

export interface TaskAssignmentValue {
  requiredAssignee: boolean;
  categoryId: string;
  skillIds: string[];
  assigneeId: string | null;
}

export function emptyTaskAssignment(): TaskAssignmentValue {
  return {
    requiredAssignee: false,
    categoryId: "",
    skillIds: [],
    assigneeId: null,
  };
}

export function taskAssignmentFromTask(
  task: Task,
  skills: Skill[],
): TaskAssignmentValue {
  const categoryId =
    skills.find((skill) => task.requiredSkillIds.includes(skill.id))
      ?.categoryId ?? "";

  return {
    requiredAssignee:
      task.requiredSkillIds.length > 0 || task.assigneeId !== null,
    categoryId,
    skillIds: task.requiredSkillIds,
    assigneeId: task.assigneeId,
  };
}

export function isTaskAssignmentComplete(value: TaskAssignmentValue): boolean {
  return (
    !value.requiredAssignee ||
    (value.categoryId !== "" &&
      value.skillIds.length > 0 &&
      value.assigneeId !== null)
  );
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? error.message : fallback;
}

function incompleteTaskCount(tasks: Task[], developerId: string): number {
  return tasks.filter(
    (task) => task.assigneeId === developerId && task.status !== "DONE",
  ).length;
}

function workloadLabel(count: number): string {
  return `${count} incomplete ${count === 1 ? "task" : "tasks"}`;
}

interface TaskAssignmentFieldsProps {
  idPrefix: string;
  value: TaskAssignmentValue;
  onChange: (value: TaskAssignmentValue) => void;
}

export function TaskAssignmentFields({
  idPrefix,
  value,
  onChange,
}: TaskAssignmentFieldsProps) {
  const tasksQuery = useTasks();
  const developersQuery = useDevelopers();
  const categoriesQuery = useCategories();
  const skillsQuery = useSkills();

  const tasks = tasksQuery.data ?? [];
  const developers = developersQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const skills = skillsQuery.data ?? [];
  const developerSkillIds = new Set(
    developers.flatMap((developer) => developer.skillIds),
  );
  const categorySkills = value.categoryId
    ? skills.filter(
        (skill) =>
          skill.categoryId === value.categoryId &&
          developerSkillIds.has(skill.id),
      )
    : [];
  const eligibleDevelopers = developers
    .filter((developer) =>
      value.skillIds.every((skillId) => developer.skillIds.includes(skillId)),
    )
    .sort(
      (left, right) =>
        incompleteTaskCount(tasks, left.id) -
          incompleteTaskCount(tasks, right.id) ||
        left.id.localeCompare(right.id),
    );

  useEffect(() => {
    if (
      value.requiredAssignee &&
      value.categoryId === "" &&
      value.skillIds.length > 0
    ) {
      const inferredCategoryId = skillsQuery.data?.find((skill) =>
        value.skillIds.includes(skill.id),
      )?.categoryId;
      if (inferredCategoryId) {
        onChange({ ...value, categoryId: inferredCategoryId });
      }
    }
  }, [onChange, skillsQuery.data, value]);

  const toggleLabelId = `${idPrefix}-required-assignee-label`;
  const categoryId = `${idPrefix}-category`;
  const assigneeId = `${idPrefix}-assignee`;

  return (
    <>
      <Field>
        <div className="flex min-h-11 items-center justify-between gap-4 rounded-md border border-input px-3 py-2">
          <div>
            <FieldLabel id={toggleLabelId}>Required assignee</FieldLabel>
            <p className="text-sm text-muted-foreground">
              Match this task to an available developer.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={value.requiredAssignee}
            aria-labelledby={toggleLabelId}
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={() =>
              onChange({
                ...emptyTaskAssignment(),
                requiredAssignee: !value.requiredAssignee,
              })
            }
          >
            <span
              aria-hidden="true"
              className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors duration-200 motion-reduce:transition-none ${
                value.requiredAssignee ? "bg-primary" : "bg-muted-foreground/40"
              }`}
            >
              <span
                className={`size-5 rounded-full bg-background shadow-xs transition-transform duration-200 motion-reduce:transition-none ${
                  value.requiredAssignee ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </span>
          </button>
        </div>
      </Field>

      {value.requiredAssignee ? (
        <Field>
          <FieldLabel htmlFor={categoryId}>Category</FieldLabel>
          {categoriesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading categories…</p>
          ) : categoriesQuery.isError ? (
            <FieldError>
              {errorMessage(
                categoriesQuery.error,
                "Unable to load categories.",
              )}
            </FieldError>
          ) : (
            <Select
              value={value.categoryId}
              onValueChange={(nextCategoryId) =>
                onChange({
                  ...value,
                  categoryId: nextCategoryId,
                  skillIds: [],
                  assigneeId: null,
                })
              }
            >
              <SelectTrigger id={categoryId} className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <p className="text-sm text-muted-foreground">
            Choose a category to see its skills.
          </p>
        </Field>
      ) : null}

      {value.requiredAssignee && value.categoryId ? (
        <Field>
          <FieldLabel>Required skills</FieldLabel>
          {skillsQuery.isLoading || developersQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading skills…</p>
          ) : skillsQuery.isError ? (
            <FieldError>
              {errorMessage(skillsQuery.error, "Unable to load skills.")}
            </FieldError>
          ) : developersQuery.isError ? (
            <FieldError>
              {errorMessage(
                developersQuery.error,
                "Unable to load developers.",
              )}
            </FieldError>
          ) : (
            <>
              <SkillCheckboxGroup
                skills={categorySkills}
                selectedSkillIds={value.skillIds}
                onChange={(nextSkillIds) => {
                  const nextEligibleDevelopers = developers
                    .filter((developer) =>
                      nextSkillIds.every((skillId) =>
                        developer.skillIds.includes(skillId),
                      ),
                    )
                    .sort(
                      (left, right) =>
                        incompleteTaskCount(tasks, left.id) -
                          incompleteTaskCount(tasks, right.id) ||
                        left.id.localeCompare(right.id),
                    );
                  onChange({
                    ...value,
                    skillIds: nextSkillIds,
                    assigneeId: nextEligibleDevelopers[0]?.id ?? null,
                  });
                }}
                idPrefix={idPrefix}
              />
              <p className="text-sm text-muted-foreground">
                Only skills held by at least one developer are shown.
              </p>
            </>
          )}
        </Field>
      ) : null}

      {value.requiredAssignee && value.skillIds.length > 0 ? (
        <Field>
          <FieldLabel htmlFor={assigneeId}>Assignee</FieldLabel>
          {developersQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading developers…</p>
          ) : developersQuery.isError ? (
            <FieldError>
              {errorMessage(
                developersQuery.error,
                "Unable to load developers.",
              )}
            </FieldError>
          ) : (
            <>
              <Select
                value={value.assigneeId ?? undefined}
                onValueChange={(nextAssigneeId) =>
                  onChange({ ...value, assigneeId: nextAssigneeId })
                }
              >
                <SelectTrigger id={assigneeId} className="w-full">
                  <SelectValue placeholder="Select an assignee" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleDevelopers.map((developer) => {
                    const workload = incompleteTaskCount(tasks, developer.id);
                    return (
                      <SelectItem key={developer.id} value={developer.id}>
                        {developer.name} ({workloadLabel(workload)})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {eligibleDevelopers.length === 0
                  ? "No developer has all selected skills. Choose different skills or turn off Required assignee."
                  : "Qualified developers are ordered by the fewest incomplete tasks."}
              </p>
            </>
          )}
        </Field>
      ) : null}
    </>
  );
}
