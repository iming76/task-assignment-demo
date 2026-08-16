import { type FormEvent, useState } from "react";

import type { Developer, Skill, Task } from "@repo/shared-types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardTitle,
  Field,
  FieldError,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";

import { ApiClientError } from "../api";
import { useCreateTask, usePatchTask } from "../hooks/tasks";
import type { TaskTreeNode as TaskTreeNodeModel } from "../lib/task-tree";
import { SkillCheckboxGroup } from "./SkillCheckboxGroup";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? error.message : fallback;
}

const UNASSIGNED = "__unassigned__";

interface TaskTreeNodeProps {
  node: TaskTreeNodeModel;
  skills: Skill[];
  developers: Developer[];
  onRequestDelete: (task: Task) => void;
}

export function TaskTreeNodeView({
  node,
  skills,
  developers,
  onRequestDelete,
}: TaskTreeNodeProps) {
  const { task, children } = node;
  const patchTask = usePatchTask();
  const createTask = useCreateTask();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description);
  const [editSkillIds, setEditSkillIds] = useState<string[]>(
    task.requiredSkillIds,
  );
  const [editAssigneeId, setEditAssigneeId] = useState<string>(
    task.assigneeId ?? UNASSIGNED,
  );

  const [isAddingChild, setIsAddingChild] = useState(false);
  const [childTitle, setChildTitle] = useState("");
  const [childDescription, setChildDescription] = useState("");
  const [childSkillIds, setChildSkillIds] = useState<string[]>([]);
  const [childSkillsTouched, setChildSkillsTouched] = useState(false);

  const skillName = (skillId: string) =>
    skills.find((skill) => skill.id === skillId)?.name ?? skillId;
  const assigneeName = (assigneeId: string | null) =>
    developers.find((developer) => developer.id === assigneeId)?.name ??
    assigneeId;

  const eligibleForEdit = developers.filter((developer) =>
    editSkillIds.every((skillId) => developer.skillIds.includes(skillId)),
  );
  const assigneeOptions =
    task.assigneeId && !eligibleForEdit.some((d) => d.id === task.assigneeId)
      ? [
          ...eligibleForEdit,
          developers.find((d) => d.id === task.assigneeId),
        ].filter((d): d is Developer => d !== undefined)
      : eligibleForEdit;

  function startEdit() {
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditSkillIds(task.requiredSkillIds);
    setEditAssigneeId(task.assigneeId ?? UNASSIGNED);
    patchTask.reset();
    setIsEditing(true);
  }

  function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    patchTask.mutate(
      {
        id: task.id,
        input: {
          title: editTitle,
          description: editDescription,
          requiredSkillIds: editSkillIds,
          assigneeId: editAssigneeId === UNASSIGNED ? null : editAssigneeId,
        },
      },
      { onSuccess: () => setIsEditing(false) },
    );
  }

  function handleChildSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createTask.mutate(
      {
        title: childTitle,
        description: childDescription,
        parentTaskId: task.id,
        ...(childSkillsTouched ? { requiredSkillIds: childSkillIds } : {}),
      },
      {
        onSuccess: () => {
          setChildTitle("");
          setChildDescription("");
          setChildSkillIds([]);
          setChildSkillsTouched(false);
          setIsAddingChild(false);
        },
      },
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        {isEditing ? (
          <form className="flex flex-col gap-3" onSubmit={handleEditSubmit}>
            <Field>
              <FieldLabel htmlFor={`edit-title-${task.id}`}>Title</FieldLabel>
              <Input
                id={`edit-title-${task.id}`}
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`edit-description-${task.id}`}>
                Description
              </FieldLabel>
              <textarea
                id={`edit-description-${task.id}`}
                className="min-h-16 w-full rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel>Required skills</FieldLabel>
              <SkillCheckboxGroup
                skills={skills}
                selectedSkillIds={editSkillIds}
                onChange={setEditSkillIds}
                idPrefix={`edit-${task.id}`}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`edit-assignee-${task.id}`}>
                Assignee
              </FieldLabel>
              <Select value={editAssigneeId} onValueChange={setEditAssigneeId}>
                <SelectTrigger
                  id={`edit-assignee-${task.id}`}
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
            </Field>
            {patchTask.isError ? (
              <FieldError>
                {errorMessage(patchTask.error, "Unable to update task.")}
              </FieldError>
            ) : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={patchTask.isPending}>
                {patchTask.isPending ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={patchTask.isPending}
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>{task.title}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge
                  variant={task.status === "DONE" ? "default" : "secondary"}
                >
                  {task.status}
                </Badge>
                <Button variant="outline" size="sm" onClick={startEdit}>
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onRequestDelete(task)}
                >
                  Delete
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{task.description}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {task.requiredSkillIds.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                  No required skills
                </span>
              ) : (
                task.requiredSkillIds.map((skillId) => (
                  <Badge key={skillId} variant="secondary">
                    {skillName(skillId)}
                  </Badge>
                ))
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Assignee:{" "}
              {task.assigneeId ? assigneeName(task.assigneeId) : "Unassigned"}
            </p>
          </>
        )}

        {children.length > 0 ? (
          <div className="flex flex-col gap-3 border-l border-border pl-4">
            {children.map((child) => (
              <TaskTreeNodeView
                key={child.task.id}
                node={child}
                skills={skills}
                developers={developers}
                onRequestDelete={onRequestDelete}
              />
            ))}
          </div>
        ) : null}

        {isAddingChild ? (
          <form
            className="flex flex-col gap-3 border-l border-border pl-4"
            onSubmit={handleChildSubmit}
          >
            <Field>
              <FieldLabel htmlFor={`child-title-${task.id}`}>Title</FieldLabel>
              <Input
                id={`child-title-${task.id}`}
                value={childTitle}
                onChange={(event) => setChildTitle(event.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`child-description-${task.id}`}>
                Description
              </FieldLabel>
              <textarea
                id={`child-description-${task.id}`}
                className="min-h-16 w-full rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={childDescription}
                onChange={(event) => setChildDescription(event.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel>Required skills</FieldLabel>
              <SkillCheckboxGroup
                skills={skills}
                selectedSkillIds={childSkillIds}
                onChange={(ids) => {
                  setChildSkillsTouched(true);
                  setChildSkillIds(ids);
                }}
                idPrefix={`child-${task.id}`}
              />
            </Field>
            {createTask.isError ? (
              <FieldError>
                {errorMessage(createTask.error, "Unable to create subtask.")}
              </FieldError>
            ) : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={createTask.isPending}>
                {createTask.isPending ? "Adding…" : "Add subtask"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={createTask.isPending}
                onClick={() => {
                  setIsAddingChild(false);
                  setChildTitle("");
                  setChildDescription("");
                  setChildSkillIds([]);
                  setChildSkillsTouched(false);
                  createTask.reset();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => {
              createTask.reset();
              setIsAddingChild(true);
            }}
          >
            Add subtask
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
