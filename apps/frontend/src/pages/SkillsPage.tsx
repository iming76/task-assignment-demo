import { type FormEvent, useState } from "react";

import type { Skill } from "@repo/shared-types";
import {
  Badge,
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
import { useCategories } from "../hooks/categories";
import { useCreateSkill, useDeleteSkill, useSkills } from "../hooks/skills";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? error.message : fallback;
}

export function SkillsPage() {
  const skillsQuery = useSkills();
  const categoriesQuery = useCategories();
  const createSkill = useCreateSkill();
  const deleteSkill = useDeleteSkill();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Skill | null>(null);

  const categories = categoriesQuery.data ?? [];

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!categoryId) {
      return;
    }
    createSkill.mutate(
      { name, description, categoryId },
      {
        onSuccess: () => {
          setName("");
          setDescription("");
          setCategoryId("");
        },
      },
    );
  }

  if (skillsQuery.isLoading) {
    return <LoadingState label="Loading skills…" />;
  }

  if (skillsQuery.isError) {
    return (
      <ErrorState
        description={errorMessage(skillsQuery.error, "Unable to load skills.")}
      />
    );
  }

  const skills = skillsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Add a skill</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleCreate}>
            <Field>
              <FieldLabel htmlFor="skill-name">Name</FieldLabel>
              <Input
                id="skill-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="skill-description">Description</FieldLabel>
              <textarea
                id="skill-description"
                className="min-h-20 w-full rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="skill-category">Category</FieldLabel>
              {categoriesQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading categories…
                </p>
              ) : (
                <Select value={categoryId} onValueChange={setCategoryId}>
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
            {createSkill.isError ? (
              <FieldError>
                {errorMessage(createSkill.error, "Unable to create skill.")}
              </FieldError>
            ) : null}
            <Button
              type="submit"
              disabled={createSkill.isPending || !categoryId}
            >
              {createSkill.isPending ? "Adding…" : "Add skill"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {skills.length === 0 ? (
        <EmptyState
          title="No skills yet"
          description="Skills you add will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {skills.map((skill) => {
            const category = categories.find((c) => c.id === skill.categoryId);
            return (
              <Card key={skill.id}>
                <CardContent className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle>{skill.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      {category ? (
                        <Badge variant="secondary">{category.name}</Badge>
                      ) : null}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          deleteSkill.reset();
                          setDeleteTarget(skill);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {skill.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            deleteSkill.reset();
          }
        }}
        title={`Delete ${deleteTarget?.name ?? "skill"}?`}
        description="This can't be undone. The skill must not be required by a task or held by a developer."
        isPending={deleteSkill.isPending}
        error={
          deleteSkill.isError
            ? errorMessage(deleteSkill.error, "Unable to delete skill.")
            : null
        }
        onConfirm={() => {
          if (!deleteTarget) {
            return;
          }
          deleteSkill.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
          });
        }}
      />
    </div>
  );
}
