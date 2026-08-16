import { type FormEvent, useState } from "react";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  FieldError,
  FieldLabel,
} from "@repo/ui";

import { ApiClientError } from "../api";
import { AgentDraftNodeEditor } from "../components/AgentDraftNodeEditor";
import { useDevelopers } from "../hooks/developers";
import { useApplyAgentTask, useProposeAgentTask } from "../hooks/agent-task";
import { useSkills } from "../hooks/skills";
import {
  attachLocalIds,
  stripLocalIds,
  updateDraftNode,
  type KeyedDraft,
} from "../lib/agent-draft";

function proposeErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError && error.code === "AGENT_UNAVAILABLE") {
    return "Agent-assisted planning isn't available right now. You can still create tasks manually from the Tasks page.";
  }
  return error instanceof ApiClientError
    ? error.message
    : "Unable to generate a plan.";
}

function applyErrorMessage(error: unknown): string {
  return error instanceof ApiClientError
    ? error.message
    : "Unable to apply this plan.";
}

export function AgentTaskPage() {
  const developersQuery = useDevelopers();
  const skillsQuery = useSkills();
  const propose = useProposeAgentTask();
  const apply = useApplyAgentTask();

  const [description, setDescription] = useState("");
  const [drafts, setDrafts] = useState<KeyedDraft[] | null>(null);

  const developers = developersQuery.data ?? [];
  const skills = skillsQuery.data ?? [];

  function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    apply.reset();
    propose.mutate(
      { description },
      { onSuccess: (response) => setDrafts(attachLocalIds(response.tasks)) },
    );
  }

  function handleDiscard() {
    setDrafts(null);
    setDescription("");
    propose.reset();
    apply.reset();
  }

  function handleApply() {
    if (!drafts) return;
    apply.mutate(
      { tasks: stripLocalIds(drafts) },
      {
        onSuccess: () => {
          setDrafts(null);
          setDescription("");
        },
      },
    );
  }

  function updateNode(
    localId: string,
    patch: Parameters<typeof updateDraftNode>[2],
  ) {
    setDrafts((current) =>
      current ? updateDraftNode(current, localId, patch) : current,
    );
  }

  if (!drafts) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Agent-assisted planning</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleGenerate}>
              <Field>
                <FieldLabel htmlFor="agent-description">
                  Describe the work you need done
                </FieldLabel>
                <textarea
                  id="agent-description"
                  className="min-h-24 w-full rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  required
                />
              </Field>
              {propose.isError ? (
                <FieldError>{proposeErrorMessage(propose.error)}</FieldError>
              ) : null}
              <Button type="submit" disabled={propose.isPending}>
                {propose.isPending ? "Generating…" : "Generate plan"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Review the generated plan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Nothing is saved yet. Edit the plan below, then apply it or discard
            it.
          </p>
          {drafts.map((node) => (
            <AgentDraftNodeEditor
              key={node.localId}
              node={node}
              skills={skills}
              developers={developers}
              onFieldChange={updateNode}
            />
          ))}
          {apply.isError ? (
            <FieldError>{applyErrorMessage(apply.error)}</FieldError>
          ) : null}
          <div className="flex gap-2">
            <Button onClick={handleApply} disabled={apply.isPending}>
              {apply.isPending ? "Applying…" : "Apply plan"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={apply.isPending}
              onClick={handleDiscard}
            >
              Discard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
