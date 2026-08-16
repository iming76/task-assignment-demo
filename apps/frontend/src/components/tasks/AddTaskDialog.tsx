import type { FormEvent } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Field,
  FieldError,
  FieldLabel,
  Input,
} from "@repo/ui";

import {
  type TaskAssignmentValue,
  TaskAssignmentFields,
} from "../TaskAssignmentFields";

export function AddTaskDialog({
  open,
  onOpenChange,
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  assignment,
  onAssignmentChange,
  isPending,
  isTitleError,
  titleErrorMessage,
  isAssignError,
  assignErrorMessage,
  submitDisabled,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onTitleChange: (title: string) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  assignment: TaskAssignmentValue;
  onAssignmentChange: (value: TaskAssignmentValue) => void;
  isPending: boolean;
  isTitleError: boolean;
  titleErrorMessage: string;
  isAssignError: boolean;
  assignErrorMessage: string;
  submitDisabled: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a task</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <Field>
            <FieldLabel htmlFor="task-title">Title</FieldLabel>
            <Input
              id="task-title"
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="task-description">Description</FieldLabel>
            <textarea
              id="task-description"
              className="min-h-20 w-full rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              required
            />
          </Field>
          <TaskAssignmentFields
            idPrefix="new-task"
            value={assignment}
            onChange={onAssignmentChange}
          />
          {isTitleError ? <FieldError>{titleErrorMessage}</FieldError> : null}
          {isAssignError ? (
            <FieldError>
              The task was created, but its assignee could not be saved.{" "}
              {assignErrorMessage}
            </FieldError>
          ) : null}
          <Button type="submit" disabled={submitDisabled}>
            {isPending ? "Adding…" : "Add task"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
