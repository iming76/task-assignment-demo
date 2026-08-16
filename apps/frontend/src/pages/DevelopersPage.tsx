import { type FormEvent, useState } from "react";

import type { Developer } from "@repo/shared-types";
import { Button } from "@repo/ui";

import { ConfirmDeleteDialog } from "../components/ConfirmDeleteDialog";
import { AddDeveloperDialog } from "../components/developers/AddDeveloperDialog";
import { DeveloperGrid } from "../components/developers/DeveloperGrid";
import { EditDeveloperDialog } from "../components/developers/EditDeveloperDialog";
import { EmptyState, ErrorState, LoadingState } from "../components/RouteState";
import {
  useCreateDeveloper,
  useDeleteDeveloper,
  useDevelopers,
  usePatchDeveloper,
} from "../hooks/developers";
import { useSkills } from "../hooks/skills";
import { errorMessage } from "../lib/error-message";

export function DevelopersPage() {
  const developersQuery = useDevelopers();
  const skillsQuery = useSkills();
  const createDeveloper = useCreateDeveloper();
  const patchDeveloper = usePatchDeveloper();
  const deleteDeveloper = useDeleteDeveloper();

  const [name, setName] = useState("");
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSkillIds, setEditSkillIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Developer | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const skills = skillsQuery.data ?? [];

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createDeveloper.mutate(
      { name, skillIds },
      {
        onSuccess: () => {
          setName("");
          setSkillIds([]);
          setIsAddOpen(false);
        },
      },
    );
  }

  function startEdit(developer: Developer) {
    setEditingId(developer.id);
    setEditName(developer.name);
    setEditSkillIds(developer.skillIds);
    patchDeveloper.reset();
  }

  function handleEditSubmit(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    patchDeveloper.mutate(
      { id, input: { name: editName, skillIds: editSkillIds } },
      { onSuccess: () => setEditingId(null) },
    );
  }

  const editingDeveloper =
    developersQuery.data?.find((developer) => developer.id === editingId) ??
    null;

  if (developersQuery.isLoading) {
    return <LoadingState label="Loading developers…" />;
  }

  if (developersQuery.isError) {
    return (
      <ErrorState
        description={errorMessage(
          developersQuery.error,
          "Unable to load developers.",
        )}
      />
    );
  }

  const developers = developersQuery.data ?? [];
  const hasNoSkills = !skillsQuery.isLoading && skills.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Developers</h1>
        <div className="flex items-center gap-2">
          <Button
            disabled={hasNoSkills}
            onClick={() => {
              createDeveloper.reset();
              setIsAddOpen(true);
            }}
          >
            Add developer
          </Button>
        </div>
      </div>
      {hasNoSkills ? (
        <p className="text-sm text-muted-foreground">
          You need at least one skill before you can add a developer.
        </p>
      ) : null}

      <AddDeveloperDialog
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) {
            createDeveloper.reset();
          }
        }}
        name={name}
        onNameChange={setName}
        skillIds={skillIds}
        onSkillIdsChange={setSkillIds}
        skills={skills}
        skillsLoading={skillsQuery.isLoading}
        isPending={createDeveloper.isPending}
        isError={createDeveloper.isError}
        errorMessage={errorMessage(
          createDeveloper.error,
          "Unable to create developer.",
        )}
        onSubmit={handleCreate}
      />

      <EditDeveloperDialog
        developer={editingDeveloper}
        onOpenChange={(open) => {
          if (!open) {
            setEditingId(null);
            patchDeveloper.reset();
          }
        }}
        name={editName}
        onNameChange={setEditName}
        skillIds={editSkillIds}
        onSkillIdsChange={setEditSkillIds}
        skills={skills}
        isPending={patchDeveloper.isPending}
        isError={patchDeveloper.isError}
        errorMessage={errorMessage(
          patchDeveloper.error,
          "Unable to update developer.",
        )}
        onSubmit={(event) =>
          editingDeveloper && handleEditSubmit(event, editingDeveloper.id)
        }
        onCancel={() => setEditingId(null)}
      />

      {developers.length === 0 ? (
        <EmptyState
          title="No developers yet"
          description="Developers you add will appear here."
        />
      ) : (
        <DeveloperGrid
          developers={developers}
          skills={skills}
          onEdit={startEdit}
          onRequestDelete={(developer) => {
            deleteDeveloper.reset();
            setDeleteTarget(developer);
          }}
        />
      )}

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            deleteDeveloper.reset();
          }
        }}
        title={`Delete ${deleteTarget?.name ?? "developer"}?`}
        description="This can't be undone. The developer must not be assigned to any task."
        isPending={deleteDeveloper.isPending}
        error={
          deleteDeveloper.isError
            ? errorMessage(deleteDeveloper.error, "Unable to delete developer.")
            : null
        }
        onConfirm={() => {
          if (!deleteTarget) {
            return;
          }
          deleteDeveloper.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
          });
        }}
      />
    </div>
  );
}
