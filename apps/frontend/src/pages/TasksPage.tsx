import { type FormEvent, useState } from "react";

import type { Task } from "@repo/shared-types";
import { Button } from "@repo/ui";

import { AgentTaskModal } from "../components/AgentTaskModal";
import { ConfirmDeleteDialog } from "../components/ConfirmDeleteDialog";
import { EmptyState, ErrorState, LoadingState } from "../components/RouteState";
import {
  emptyTaskAssignment,
  isTaskAssignmentComplete,
} from "../components/TaskAssignmentFields";
import { AddTaskDialog } from "../components/tasks/AddTaskDialog";
import { OrphanedTasksCard } from "../components/tasks/OrphanedTasksCard";
import { TaskListWithPagination } from "../components/tasks/TaskListWithPagination";
import { useDevelopers } from "../hooks/developers";
import { useSkills } from "../hooks/skills";
import {
  useCreateTask,
  useDeleteTask,
  usePatchTask,
  useTasks,
} from "../hooks/tasks";
import { errorMessage } from "../lib/error-message";
import { buildTaskTree } from "../lib/task-tree";

const TASKS_PER_PAGE = 20;

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
  const [isAgentOpen, setIsAgentOpen] = useState(false);
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
  const hasNoDevelopers = !developersQuery.isLoading && developers.length === 0;

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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={hasNoDevelopers}
            onClick={() => setIsAgentOpen(true)}
          >
            Add task using agent
          </Button>
          <Button
            disabled={hasNoDevelopers}
            onClick={() => {
              createTask.reset();
              assignCreatedTask.reset();
              setIsAddOpen(true);
            }}
          >
            Add task
          </Button>
        </div>
      </div>

      {hasNoDevelopers ? (
        <p className="text-sm text-muted-foreground">
          You need at least one developer before you can add a task.
        </p>
      ) : null}

      <AgentTaskModal open={isAgentOpen} onOpenChange={setIsAgentOpen} />

      <AddTaskDialog
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) {
            createTask.reset();
            assignCreatedTask.reset();
          }
        }}
        title={title}
        onTitleChange={setTitle}
        description={description}
        onDescriptionChange={setDescription}
        assignment={assignment}
        onAssignmentChange={setAssignment}
        isPending={isCreating}
        isTitleError={createTask.isError}
        titleErrorMessage={errorMessage(
          createTask.error,
          "Unable to create task.",
        )}
        isAssignError={assignCreatedTask.isError}
        assignErrorMessage={errorMessage(
          assignCreatedTask.error,
          "Edit the task to assign it.",
        )}
        submitDisabled={isCreating || !isTaskAssignmentComplete(assignment)}
        onSubmit={handleCreate}
      />

      {tree.roots.length === 0 && tree.orphans.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description="Tasks you create will appear here."
        />
      ) : (
        <TaskListWithPagination
          pagedRoots={pagedRoots}
          skills={skills}
          developers={developers}
          currentPage={currentPage}
          pageCount={pageCount}
          onPageChange={setPage}
          onRequestDelete={(task) => {
            deleteTask.reset();
            setDeleteTarget(task);
          }}
        />
      )}

      {tree.orphans.length > 0 ? (
        <OrphanedTasksCard
          orphans={tree.orphans}
          onRequestDelete={(task) => {
            deleteTask.reset();
            setDeleteTarget(task);
          }}
        />
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
