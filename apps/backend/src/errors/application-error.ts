import type { ApiErrorCode } from "@repo/shared-types";

/**
 * Base class for errors that carry a documented public error code and HTTP
 * status. Services throw these; the transport-layer error mapper is the only
 * place that turns them into the public envelope.
 */
export abstract class ApplicationError extends Error {
  abstract readonly code: ApiErrorCode;
  abstract readonly statusCode: number;
}

export class NotFoundError extends ApplicationError {
  readonly code = "NOT_FOUND" as const;
  readonly statusCode = 404;
}

export class SkillMismatchError extends ApplicationError {
  readonly code = "SKILL_MISMATCH" as const;
  readonly statusCode = 409;
}

export class SubtasksIncompleteError extends ApplicationError {
  readonly code = "SUBTASKS_INCOMPLETE" as const;
  readonly statusCode = 409;
}

export class CompletedAncestorError extends ApplicationError {
  readonly code = "COMPLETED_ANCESTOR" as const;
  readonly statusCode = 409;
}

export class InUseError extends ApplicationError {
  readonly code = "IN_USE" as const;
  readonly statusCode = 409;
}

export class AgentUnavailableError extends ApplicationError {
  readonly code = "AGENT_UNAVAILABLE" as const;
  readonly statusCode = 503;
}
