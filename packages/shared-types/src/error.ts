export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "SKILL_MISMATCH"
  | "SUBTASKS_INCOMPLETE"
  | "COMPLETED_ANCESTOR"
  | "IN_USE"
  | "AGENT_UNAVAILABLE"
  | "INTERNAL_ERROR";

export interface ApiError {
  code: ApiErrorCode;
  message: string;
}

export interface ApiErrorResponse {
  error: ApiError;
}
