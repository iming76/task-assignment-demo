export interface AgentPlanningConfig {
  /** Selects the provider adapter; only "openai" resolves to a real endpoint today. */
  provider: string;
  /** null when no key is configured; orchestration fails safely with AGENT_UNAVAILABLE. */
  apiKey: string | null;
  model: string;
  timeoutMs: number;
}

export interface SkillInferenceConfig {
  /** Selects the provider adapter; only "openai" resolves to a real endpoint today. */
  provider: string;
  /** null when no key is configured; task creation falls back to an untagged task without it. */
  apiKey: string | null;
  model: string;
  timeoutMs: number;
}

export interface Env {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  agentPlanning: AgentPlanningConfig;
  skillInference: SkillInferenceConfig;
}

export function loadEnv(): Env {
  const parsedPort = Number.parseInt(process.env.PORT ?? "3100", 10);
  const parsedTimeout = Number.parseInt(
    process.env.AGENT_PLANNING_TIMEOUT_MS ?? "15000",
    10,
  );
  const parsedSkillInferenceTimeout = Number.parseInt(
    process.env.SKILL_INFERENCE_TIMEOUT_MS ?? "5000",
    10,
  );
  return {
    port: Number.isNaN(parsedPort) ? 3100 : parsedPort,
    nodeEnv: process.env.NODE_ENV ?? "development",
    corsOrigin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    agentPlanning: {
      provider: process.env.AI_PROVIDER ?? "openai",
      apiKey: process.env.OPENAI_API_KEY || null,
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      timeoutMs: Number.isNaN(parsedTimeout) ? 15000 : parsedTimeout,
    },
    skillInference: {
      provider: process.env.AI_PROVIDER ?? "openai",
      apiKey: process.env.OPENAI_API_KEY || null,
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      timeoutMs: Number.isNaN(parsedSkillInferenceTimeout)
        ? 5000
        : parsedSkillInferenceTimeout,
    },
  };
}
