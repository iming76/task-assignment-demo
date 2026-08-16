import { type FormEvent, useState } from "react";

import {
  MAX_TASK_DEPTH,
  type Developer,
  type Skill,
  type Task,
} from "@repo/shared-types";
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
} from "@repo/ui";

import { ApiClientError } from "../api";
import { useCreateTask, usePatchTask } from "../hooks/tasks";
import type { TaskTreeNode as TaskTreeNodeModel } from "../lib/task-tree";
import {
  emptyTaskAssignment,
  isTaskAssignmentComplete,
  TaskAssignmentFields,
  taskAssignmentFromTask,
} from "./TaskAssignmentFields";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? error.message : fallback;
}

const STATUS_CONFLICT_GUIDANCE: Record<string, string> = {
  SUBTASKS_INCOMPLETE:
    "Complete its subtasks first, starting from the leaves and working up.",
  COMPLETED_ANCESTOR:
    "Reopen the ancestor tasks first, starting from the root and working down.",
};

function statusErrorMessage(error: unknown): string {
  if (!(error instanceof ApiClientError)) {
    return "Unable to update task status.";
  }
  const guidance = STATUS_CONFLICT_GUIDANCE[error.code];
  return guidance ? `${error.message} ${guidance}` : error.message;
}

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
  const assignCreatedTask = usePatchTask();
  const statusPatch = usePatchTask();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description);
  const [editAssignment, setEditAssignment] = useState(() =>
    taskAssignmentFromTask(task, skills),
  );

  const [isAddingChild, setIsAddingChild] = useState(false);
  const [childTitle, setChildTitle] = useState("");
  const [childDescription, setChildDescription] = useState("");
  const [childAssignment, setChildAssignment] = useState(emptyTaskAssignment);

  const skillName = (skillId: string) =>
    skills.find((skill) => skill.id === skillId)?.name ?? skillId;
  const assigneeName = (assigneeId: string | null) =>
    developers.find((developer) => developer.id === assigneeId)?.name ??
    assigneeId;

  function startEdit() {
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditAssignment(taskAssignmentFromTask(task, skills));
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
          requiredSkillIds: editAssignment.requiredAssignee
            ? editAssignment.skillIds
            : [],
          assigneeId: editAssignment.requiredAssignee
            ? editAssignment.assigneeId
            : null,
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
        ...(childAssignment.requiredAssignee
          ? { requiredSkillIds: childAssignment.skillIds }
          : {}),
      },
      {
        onSuccess: (createdTask) => {
          if (childAssignment.requiredAssignee && childAssignment.assigneeId) {
            assignCreatedTask.mutate({
              id: createdTask.id,
              input: { assigneeId: childAssignment.assigneeId },
            });
          }
          setChildTitle("");
          setChildDescription("");
          setChildAssignment(emptyTaskAssignment());
          setIsAddingChild(false);
        },
      },
    );
  }

  function toggleStatus() {
    statusPatch.mutate({
      id: task.id,
      input: { status: task.status === "DONE" ? "TODO" : "DONE" },
    });
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
            <TaskAssignmentFields
              idPrefix={`edit-${task.id}`}
              value={editAssignment}
              onChange={setEditAssignment}
            />
            {patchTask.isError ? (
              <FieldError>
                {errorMessage(patchTask.error, "Unable to update task.")}
              </FieldError>
            ) : null}
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={
                  patchTask.isPending ||
                  !isTaskAssignmentComplete(editAssignment)
                }
              >
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
                <Button
                  variant="outline"
                  size="sm"
                  disabled={statusPatch.isPending}
                  onClick={toggleStatus}
                >
                  {statusPatch.isPending
                    ? "Updating…"
                    : task.status === "DONE"
                      ? "Reopen"
                      : "Mark done"}
                </Button>
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
            {statusPatch.isError ? (
              <FieldError>{statusErrorMessage(statusPatch.error)}</FieldError>
            ) : null}
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

        {task.depth >= MAX_TASK_DEPTH ? null : isAddingChild ? (
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
            <TaskAssignmentFields
              idPrefix={`child-${task.id}`}
              value={childAssignment}
              onChange={setChildAssignment}
            />
            {createTask.isError ? (
              <FieldError>
                {errorMessage(createTask.error, "Unable to create subtask.")}
              </FieldError>
            ) : null}
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={
                  createTask.isPending ||
                  assignCreatedTask.isPending ||
                  !isTaskAssignmentComplete(childAssignment)
                }
              >
                {createTask.isPending || assignCreatedTask.isPending
                  ? "Adding…"
                  : "Add subtask"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={createTask.isPending || assignCreatedTask.isPending}
                onClick={() => {
                  setIsAddingChild(false);
                  setChildTitle("");
                  setChildDescription("");
                  setChildAssignment(emptyTaskAssignment());
                  createTask.reset();
                  assignCreatedTask.reset();
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
              assignCreatedTask.reset();
              setChildAssignment(emptyTaskAssignment());
              setIsAddingChild(true);
            }}
          >
            Add subtask
          </Button>
        )}
        {assignCreatedTask.isError ? (
          <FieldError>
            The subtask was created, but its assignee could not be saved.{" "}
            {errorMessage(
              assignCreatedTask.error,
              "Edit the subtask to assign it.",
            )}
          </FieldError>
        ) : null}
      </CardContent>
    </Card>
  );
}
