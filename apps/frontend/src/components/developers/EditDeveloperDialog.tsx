import type { FormEvent } from "react";

import type { Developer, Skill } from "@repo/shared-types";
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

export function EditDeveloperDialog({
  developer,
  onOpenChange,
  name,
  onNameChange,
  skillIds,
  onSkillIdsChange,
  skills,
  isPending,
  isError,
  errorMessage,
  onSubmit,
  onCancel,
}: {
  developer: Developer | null;
  onOpenChange: (open: boolean) => void;
  name: string;
  onNameChange: (name: string) => void;
  skillIds: string[];
  onSkillIdsChange: (ids: string[]) => void;
  skills: Skill[];
  isPending: boolean;
  isError: boolean;
  errorMessage: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={developer !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit developer</DialogTitle>
        </DialogHeader>
        {developer ? (
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <Field>
              <FieldLabel htmlFor={`edit-name-${developer.id}`}>
                Name
              </FieldLabel>
              <Input
                id={`edit-name-${developer.id}`}
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel>Skills</FieldLabel>
              <SkillCheckboxGroup
                idPrefix={`edit-developer-${developer.id}`}
                skills={skills}
                selectedSkillIds={skillIds}
                onChange={onSkillIdsChange}
              />
            </Field>
            {isError ? <FieldError>{errorMessage}</FieldError> : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={onCancel}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
