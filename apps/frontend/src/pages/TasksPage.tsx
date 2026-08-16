import { type FormEvent, useState } from "react";

import type { Task } from "@repo/shared-types";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
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
import { ConfirmDeleteDialog } from "../components/ConfirmDeleteDialog";
import { EmptyState, ErrorState, LoadingState } from "../components/RouteState";
import { SkillCheckboxGroup } from "../components/SkillCheckboxGroup";
import { TaskTreeNodeView } from "../components/TaskTreeNode";
import { useCategories } from "../hooks/categories";
import { useDevelopers } from "../hooks/developers";
import { useSkills } from "../hooks/skills";
import {
  useCreateTask,
  useDeleteTask,
  usePatchTask,
  useTasks,
} from "../hooks/tasks";
import { buildTaskTree } from "../lib/task-tree";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? error.message : fallback;
}

const UNASSIGNED = "__unassigned__";

function incompleteTaskCount(tasks: Task[], developerId: string): number {
  return tasks.filter(
    (task) => task.assigneeId === developerId && task.status !== "DONE",
  ).length;
}

function workloadLabel(count: number): string {
  return `${count} incomplete ${count === 1 ? "task" : "tasks"}`;
}

export function TasksPage() {
  const tasksQuery = useTasks();
  const developersQuery = useDevelopers();
  const categoriesQuery = useCategories();
  const skillsQuery = useSkills();
  const createTask = useCreateTask();
  const assignCreatedTask = usePatchTask();
  const deleteTask = useDeleteTask();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requiredAssignee, setRequiredAssignee] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [skillsTouched, setSkillsTouched] = useState(false);
  const [assigneeId, setAssigneeId] = useState(UNASSIGNED);
  const [assigneeWasChosen, setAssigneeWasChosen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const categories = categoriesQuery.data ?? [];
  const skills = skillsQuery.data ?? [];
  const developers = developersQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];
  const categorySkills = categoryId
    ? skills.filter((skill) => skill.categoryId === categoryId)
    : [];
  const eligibleDevelopers = developers
    .filter((developer) =>
      skillIds.every((skillId) => developer.skillIds.includes(skillId)),
    )
    .sort(
      (left, right) =>
        incompleteTaskCount(tasks, left.id) -
          incompleteTaskCount(tasks, right.id) ||
        left.id.localeCompare(right.id),
    );
  const selectedAssigneeId = assigneeWasChosen
    ? assigneeId
    : (eligibleDevelopers[0]?.id ?? UNASSIGNED);

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    assignCreatedTask.reset();
    createTask.mutate(
      {
        title,
        description,
        ...(skillsTouched ? { requiredSkillIds: skillIds } : {}),
      },
      {
        onSuccess: (createdTask) => {
          if (requiredAssignee && selectedAssigneeId !== UNASSIGNED) {
            assignCreatedTask.mutate({
              id: createdTask.id,
              input: { assigneeId: selectedAssigneeId },
            });
          }
          setTitle("");
          setDescription("");
          setRequiredAssignee(false);
          setCategoryId("");
          setSkillIds([]);
          setSkillsTouched(false);
          setAssigneeId(UNASSIGNED);
          setAssigneeWasChosen(false);
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

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Add a task</CardTitle>
        </CardHeader>
        <CardContent>
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
            <Field>
              <div className="flex min-h-11 items-center justify-between gap-4 rounded-md border border-input px-3 py-2">
                <div>
                  <FieldLabel id="required-assignee-label">
                    Required assignee
                  </FieldLabel>
                  <p className="text-sm text-muted-foreground">
                    Match this task to an available developer.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={requiredAssignee}
                  aria-labelledby="required-assignee-label"
                  className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  onClick={() => {
                    setRequiredAssignee((current) => !current);
                    setSkillIds([]);
                    setSkillsTouched(false);
                    setCategoryId("");
                    setAssigneeId(UNASSIGNED);
                    setAssigneeWasChosen(false);
                  }}
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors duration-200 motion-reduce:transition-none ${
                      requiredAssignee ? "bg-primary" : "bg-muted-foreground/40"
                    }`}
                  >
                    <span
                      className={`size-5 rounded-full bg-background shadow-xs transition-transform duration-200 motion-reduce:transition-none ${
                        requiredAssignee ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </span>
                </button>
              </div>
            </Field>
            {requiredAssignee ? (
              <Field>
                <FieldLabel htmlFor="task-category">Category</FieldLabel>
                {categoriesQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Loading categories…
                  </p>
                ) : categoriesQuery.isError ? (
                  <FieldError>
                    {errorMessage(
                      categoriesQuery.error,
                      "Unable to load categories.",
                    )}
                  </FieldError>
                ) : (
                  <Select
                    value={categoryId}
                    onValueChange={(value) => {
                      setCategoryId(value);
                      setSkillIds([]);
                      setSkillsTouched(false);
                      setAssigneeId(UNASSIGNED);
                      setAssigneeWasChosen(false);
                    }}
                  >
                    <SelectTrigger id="task-category" className="w-full">
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
            {requiredAssignee && categoryId ? (
              <Field>
                <FieldLabel>Required skills</FieldLabel>
                {skillsQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Loading skills…
                  </p>
                ) : skillsQuery.isError ? (
                  <FieldError>
                    {errorMessage(skillsQuery.error, "Unable to load skills.")}
                  </FieldError>
                ) : (
                  <SkillCheckboxGroup
                    skills={categorySkills}
                    selectedSkillIds={skillIds}
                    onChange={(ids) => {
                      setSkillsTouched(true);
                      setSkillIds(ids);
                      setAssigneeId(UNASSIGNED);
                      setAssigneeWasChosen(false);
                    }}
                    idPrefix="new-task"
                  />
                )}
              </Field>
            ) : null}
            {requiredAssignee && skillIds.length > 0 ? (
              <Field>
                <FieldLabel htmlFor="task-assignee">Assignee</FieldLabel>
                {developersQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Loading developers…
                  </p>
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
                      value={
                        selectedAssigneeId === UNASSIGNED
                          ? undefined
                          : selectedAssigneeId
                      }
                      onValueChange={(value) => {
                        setAssigneeId(value);
                        setAssigneeWasChosen(true);
                      }}
                    >
                      <SelectTrigger id="task-assignee" className="w-full">
                        <SelectValue placeholder="Select an assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleDevelopers.map((developer) => {
                          const workload = incompleteTaskCount(
                            tasks,
                            developer.id,
                          );
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
              disabled={
                isCreating ||
                (requiredAssignee &&
                  (!categoryId ||
                    skillIds.length === 0 ||
                    selectedAssigneeId === UNASSIGNED))
              }
            >
              {isCreating ? "Adding…" : "Add task"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {tree.roots.length === 0 && tree.orphans.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description="Tasks you create will appear here."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {tree.roots.map((node) => (
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
