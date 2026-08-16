import { type FormEvent, useState } from "react";

import type { Task } from "@repo/shared-types";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Field,
  FieldError,
  FieldLabel,
  Input,
} from "@repo/ui";

import { ApiClientError } from "../api";
import { ConfirmDeleteDialog } from "../components/ConfirmDeleteDialog";
import { EmptyState, ErrorState, LoadingState } from "../components/RouteState";
import {
  emptyTaskAssignment,
  isTaskAssignmentComplete,
  TaskAssignmentFields,
} from "../components/TaskAssignmentFields";
import { TaskTreeNodeView } from "../components/TaskTreeNode";
import { useDevelopers } from "../hooks/developers";
import { useSkills } from "../hooks/skills";
import {
  useCreateTask,
  useDeleteTask,
  usePatchTask,
  useTasks,
} from "../hooks/tasks";
import { buildTaskTree } from "../lib/task-tree";

const TASKS_PER_PAGE = 20;

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? error.message : fallback;
}

export function TasksPage() {
  const tasksQuery = useTasks();
  const developersQuery = useDevelopers();
  const skillsQuery = useSkills();
  const createTask = useCreateTask();
  const assignCreatedTask = usePatchTask();
  const deleteTask = useDeleteTask();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignment, setAssignment] = useState(emptyTaskAssignment);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [page, setPage] = useState(1);

  const skills = skillsQuery.data ?? [];
  const developers = developersQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    assignCreatedTask.reset();
    createTask.mutate(
      {
        title,
        description,
        ...(assignment.requiredAssignee
          ? { requiredSkillIds: assignment.skillIds }
          : {}),
      },
      {
        onSuccess: (createdTask) => {
          if (assignment.requiredAssignee && assignment.assigneeId) {
            assignCreatedTask.mutate({
              id: createdTask.id,
              input: { assigneeId: assignment.assigneeId },
            });
          }
          setTitle("");
          setDescription("");
          setAssignment(emptyTaskAssignment());
          setIsAddOpen(false);
        },
      },
    );
  }

  if (tasksQuery.isLoading) {
    return <LoadingState label="Loading tasks…" />;
  }

  if (tasksQuery.isError) {
    return (
      <ErrorState
        description={errorMessage(tasksQuery.error, "Unable to load tasks.")}
      />
    );
  }

  const tree = buildTaskTree(tasks);
  const isCreating = createTask.isPending || assignCreatedTask.isPending;

  const pageCount = Math.max(1, Math.ceil(tree.roots.length / TASKS_PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const pagedRoots = tree.roots.slice(
    (currentPage - 1) * TASKS_PER_PAGE,
    currentPage * TASKS_PER_PAGE,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Tasks</h1>
        <Button
          onClick={() => {
            createTask.reset();
            assignCreatedTask.reset();
            setIsAddOpen(true);
          }}
        >
          Add task
        </Button>
      </div>

      <Dialog
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) {
            createTask.reset();
            assignCreatedTask.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a task</DialogTitle>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={handleCreate}>
            <Field>
              <FieldLabel htmlFor="task-title">Title</FieldLabel>
              <Input
                id="task-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="task-description">Description</FieldLabel>
              <textarea
                id="task-description"
                className="min-h-20 w-full rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
              />
            </Field>
            <TaskAssignmentFields
              idPrefix="new-task"
              value={assignment}
              onChange={setAssignment}
            />
            {createTask.isError ? (
              <FieldError>
                {errorMessage(createTask.error, "Unable to create task.")}
              </FieldError>
            ) : null}
            {assignCreatedTask.isError ? (
              <FieldError>
                The task was created, but its assignee could not be saved.{" "}
                {errorMessage(
                  assignCreatedTask.error,
                  "Edit the task to assign it.",
                )}
              </FieldError>
            ) : null}
            <Button
              type="submit"
              disabled={isCreating || !isTaskAssignmentComplete(assignment)}
            >
              {isCreating ? "Adding…" : "Add task"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {tree.roots.length === 0 && tree.orphans.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description="Tasks you create will appear here."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {pagedRoots.map((node) => (
            <TaskTreeNodeView
              key={node.task.id}
              node={node}
              skills={skills}
              developers={developers}
              onRequestDelete={(task) => {
                deleteTask.reset();
                setDeleteTarget(task);
              }}
            />
          ))}
          {pageCount > 1 ? (
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= pageCount}
                onClick={() => setPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </div>
      )}

      {tree.orphans.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Orphaned tasks</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              These tasks reference a parent that no longer resolves. They are
              shown here so nothing is silently hidden.
            </p>
            {tree.orphans.map((task) => (
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
                    onClick={() => {
                      deleteTask.reset();
                      setDeleteTarget(task);
                    }}
                  >
                    Delete
                  </Button>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            deleteTask.reset();
          }
        }}
        title={`Delete ${deleteTarget?.title ?? "task"}?`}
        description="This can't be undone. The task must not have any subtasks."
        isPending={deleteTask.isPending}
        error={
          deleteTask.isError
            ? errorMessage(deleteTask.error, "Unable to delete task.")
            : null
        }
        onConfirm={() => {
          if (!deleteTarget) {
            return;
          }
          deleteTask.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
          });
        }}
      />
    </div>
  );
}
