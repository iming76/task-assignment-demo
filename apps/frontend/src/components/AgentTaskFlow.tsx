import { type FormEvent, useState } from "react";
import type {
  AgentTaskCreatedResponse,
  AgentTaskMessage,
} from "@repo/shared-types";
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
} from "@repo/ui";
import { ApiClientError } from "../api";
import { useOrchestrateAgentTask } from "../hooks/agent-task";
import { useDevelopers } from "../hooks/developers";
import { useSkills } from "../hooks/skills";

function orchestrationErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError && error.code === "AGENT_UNAVAILABLE") {
    return "Agent-assisted planning isn't available right now. You can still create tasks manually from the Tasks page.";
  }
  return error instanceof ApiClientError
    ? error.message
    : "Unable to plan and create the requested work.";
}

export function AgentTaskFlow({
  onCreated,
  onClose,
}: {
  onCreated?: () => void;
  onClose?: () => void;
}) {
  const orchestrate = useOrchestrateAgentTask();
  const developersQuery = useDevelopers();
  const skillsQuery = useSkills();
  const developers = developersQuery.data ?? [];
  const skills = skillsQuery.data ?? [];
  const skillName = (skillId: string) =>
    skills.find((skill) => skill.id === skillId)?.name ?? skillId;
  const assigneeName = (assigneeId: string) =>
    developers.find((developer) => developer.id === assigneeId)?.name ??
    assigneeId;
  const [messages, setMessages] = useState<AgentTaskMessage[]>([]);
  const [input, setInput] = useState("");
  const [created, setCreated] = useState<AgentTaskCreatedResponse | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const userMessage: AgentTaskMessage = {
      role: "user",
      content: input.trim(),
    };
    if (!userMessage.content) return;
    const nextMessages = [...messages, userMessage];
    orchestrate.mutate(
      { messages: nextMessages },
      {
        onSuccess: (response) => {
          setInput("");
          setMessages(nextMessages);
          setCreated(response);
          onCreated?.();
        },
      },
    );
  }

  if (created) {
    return (
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tasks created</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">{created.message}</p>
            <ul className="space-y-3">
              {created.tasks.map((task) => (
                <li
                  key={task.id}
                  className="rounded-md border p-3"
                  style={{ marginLeft: `${(task.depth - 1) * 16}px` }}
                >
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {task.description}
                  </p>
                  {task.requiredSkillIds.length > 0 ? (
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {task.requiredSkillIds.map((skillId) => (
                        <Badge key={skillId} variant="secondary">
                          {skillName(skillId)}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {task.assigneeId
                      ? `Assigned: ${assigneeName(task.assigneeId)}`
                      : "Unassigned"}
                  </p>
                </li>
              ))}
            </ul>
            {created.staffingGaps.length > 0 ? (
              <div
                className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3"
                role="status"
              >
                <p className="font-medium">Staffing required</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {created.staffingGaps.map((gap) => (
                    <li key={gap.taskId}>
                      {gap.taskTitle} requires {gap.requiredRole}
                      {gap.requiredSkillIds.length > 0
                        ? ` (${gap.requiredSkillIds.map(skillName).join(", ")})`
                        : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <Field>
        <FieldLabel htmlFor="agent-input">
          Describe the work you need done
        </FieldLabel>
        <textarea
          id="agent-input"
          className="min-h-[50vh] w-full rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          required
        />
      </Field>
      {orchestrate.isError ? (
        <FieldError>{orchestrationErrorMessage(orchestrate.error)}</FieldError>
      ) : null}
      <Button type="submit" disabled={orchestrate.isPending}>
        {orchestrate.isPending ? "Planning…" : "Create tasks"}
      </Button>
    </form>
  );
}
