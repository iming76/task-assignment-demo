import type { FormEvent } from "react";

import type { Skill } from "@repo/shared-types";
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

import { SkillCheckboxGroup } from "../SkillCheckboxGroup";

export function AddDeveloperDialog({
  open,
  onOpenChange,
  name,
  onNameChange,
  skillIds,
  onSkillIdsChange,
  skills,
  skillsLoading,
  isPending,
  isError,
  errorMessage,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  onNameChange: (name: string) => void;
  skillIds: string[];
  onSkillIdsChange: (ids: string[]) => void;
  skills: Skill[];
  skillsLoading: boolean;
  isPending: boolean;
  isError: boolean;
  errorMessage: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a developer</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <Field>
            <FieldLabel htmlFor="developer-name">Name</FieldLabel>
            <Input
              id="developer-name"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              required
            />
          </Field>
          <Field>
            <FieldLabel>Skills</FieldLabel>
            {skillsLoading ? (
              <p className="text-sm text-muted-foreground">Loading skills…</p>
            ) : (
              <SkillCheckboxGroup
                idPrefix="new-developer"
                skills={skills}
                selectedSkillIds={skillIds}
                onChange={onSkillIdsChange}
              />
            )}
          </Field>
          {isError ? <FieldError>{errorMessage}</FieldError> : null}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Adding…" : "Add developer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
