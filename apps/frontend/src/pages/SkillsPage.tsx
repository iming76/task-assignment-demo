import { type FormEvent, useState } from "react";

import type { Skill } from "@repo/shared-types";
import { Button } from "@repo/ui";

import { ConfirmDeleteDialog } from "../components/ConfirmDeleteDialog";
import { EmptyState, ErrorState, LoadingState } from "../components/RouteState";
import { AddSkillDialog } from "../components/skills/AddSkillDialog";
import { SkillCategoryGroups } from "../components/skills/SkillCategoryGroups";
import { useCategories } from "../hooks/categories";
import { useCreateSkill, useDeleteSkill, useSkills } from "../hooks/skills";
import { errorMessage } from "../lib/error-message";

export function SkillsPage() {
  const skillsQuery = useSkills();
  const categoriesQuery = useCategories();
  const createSkill = useCreateSkill();
  const deleteSkill = useDeleteSkill();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Skill | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

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
          setIsAddOpen(false);
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
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Skills</h1>
        <Button
          onClick={() => {
            createSkill.reset();
            setIsAddOpen(true);
          }}
        >
          Add skill
        </Button>
      </div>

      <AddSkillDialog
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) {
            createSkill.reset();
          }
        }}
        name={name}
        onNameChange={setName}
        description={description}
        onDescriptionChange={setDescription}
        categoryId={categoryId}
        onCategoryIdChange={setCategoryId}
        categories={categories}
        categoriesLoading={categoriesQuery.isLoading}
        isPending={createSkill.isPending}
        isError={createSkill.isError}
        errorMessage={errorMessage(
          createSkill.error,
          "Unable to create skill.",
        )}
        onSubmit={handleCreate}
      />

      {skills.length === 0 ? (
        <EmptyState
          title="No skills yet"
          description="Skills you add will appear here."
        />
      ) : (
        <SkillCategoryGroups
          skills={skills}
          categories={categories}
          onRequestDelete={(skill) => {
            deleteSkill.reset();
            setDeleteTarget(skill);
          }}
        />
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
