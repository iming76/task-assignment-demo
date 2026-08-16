import type { FormEvent } from "react";

import type { Category } from "@repo/shared-types";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";

export function AddSkillDialog({
  open,
  onOpenChange,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  categoryId,
  onCategoryIdChange,
  categories,
  categoriesLoading,
  isPending,
  isError,
  errorMessage,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  onNameChange: (name: string) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  categoryId: string;
  onCategoryIdChange: (categoryId: string) => void;
  categories: Category[];
  categoriesLoading: boolean;
  isPending: boolean;
  isError: boolean;
  errorMessage: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a skill</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <Field>
            <FieldLabel htmlFor="skill-name">Name</FieldLabel>
            <Input
              id="skill-name"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="skill-description">Description</FieldLabel>
            <textarea
              id="skill-description"
              className="min-h-20 w-full rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="skill-category">Category</FieldLabel>
            {categoriesLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading categories…
              </p>
            ) : (
              <Select value={categoryId} onValueChange={onCategoryIdChange}>
                <SelectTrigger id="skill-category" className="w-full">
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
          </Field>
          {isError ? <FieldError>{errorMessage}</FieldError> : null}
          <Button type="submit" disabled={isPending || !categoryId}>
            {isPending ? "Adding…" : "Add skill"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
