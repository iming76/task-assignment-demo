import { type FormEvent, useState } from "react";

import type { Developer } from "@repo/shared-types";
import {
  Badge,
  Button,
  Card,
  CardContent,
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
  useCreateDeveloper,
  useDeleteDeveloper,
  useDevelopers,
  usePatchDeveloper,
} from "../hooks/developers";
import { useSkills } from "../hooks/skills";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? error.message : fallback;
}

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Developers</h1>
        <Button
          onClick={() => {
            createDeveloper.reset();
            setIsAddOpen(true);
          }}
        >
          Add developer
        </Button>
      </div>

      <Dialog
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) {
            createDeveloper.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a developer</DialogTitle>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={handleCreate}>
            <Field>
              <FieldLabel htmlFor="developer-name">Name</FieldLabel>
              <Input
                id="developer-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel>Skills</FieldLabel>
              {skillsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading skills…</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {skills.map((skill) => (
                    <label
                      key={skill.id}
                      className="flex items-center gap-1.5 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={skillIds.includes(skill.id)}
                        onChange={() =>
                          setSkillIds((current) => toggleId(current, skill.id))
                        }
                      />
                      {skill.name}
                    </label>
                  ))}
                </div>
              )}
            </Field>
            {createDeveloper.isError ? (
              <FieldError>
                {errorMessage(
                  createDeveloper.error,
                  "Unable to create developer.",
                )}
              </FieldError>
            ) : null}
            <Button type="submit" disabled={createDeveloper.isPending}>
              {createDeveloper.isPending ? "Adding…" : "Add developer"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {developers.length === 0 ? (
        <EmptyState
          title="No developers yet"
          description="Developers you add will appear here."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {developers.map((developer) => (
            <Card key={developer.id}>
              <CardContent className="flex flex-col gap-3">
                {editingId === developer.id ? (
                  <form
                    className="flex flex-col gap-3"
                    onSubmit={(event) => handleEditSubmit(event, developer.id)}
                  >
                    <Field>
                      <FieldLabel htmlFor={`edit-name-${developer.id}`}>
                        Name
                      </FieldLabel>
                      <Input
                        id={`edit-name-${developer.id}`}
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Skills</FieldLabel>
                      <div className="flex flex-wrap gap-3">
                        {skills.map((skill) => (
                          <label
                            key={skill.id}
                            className="flex items-center gap-1.5 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={editSkillIds.includes(skill.id)}
                              onChange={() =>
                                setEditSkillIds((current) =>
                                  toggleId(current, skill.id),
                                )
                              }
                            />
                            {skill.name}
                          </label>
                        ))}
                      </div>
                    </Field>
                    {patchDeveloper.isError ? (
                      <FieldError>
                        {errorMessage(
                          patchDeveloper.error,
                          "Unable to update developer.",
                        )}
                      </FieldError>
                    ) : null}
                    <div className="flex gap-2">
                      <Button type="submit" disabled={patchDeveloper.isPending}>
                        {patchDeveloper.isPending ? "Saving…" : "Save"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={patchDeveloper.isPending}
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle>{developer.name}</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(developer)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            deleteDeveloper.reset();
                            setDeleteTarget(developer);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {developer.skillIds.length === 0 ? (
                        <span className="text-sm text-muted-foreground">
                          No skills
                        </span>
                      ) : (
                        developer.skillIds.map((skillId) => {
                          const skill = skills.find((s) => s.id === skillId);
                          return (
                            <Badge key={skillId} variant="secondary">
                              {skill?.name ?? skillId}
                            </Badge>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
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
