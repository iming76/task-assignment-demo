import type { ApiErrorCode, ApiErrorResponse } from "@repo/shared-types";

const DEFAULT_BASE_URL = "http://localhost:3000";

export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BASE_URL;
}

export type ApiClientErrorCode = ApiErrorCode | "NETWORK_ERROR";

/**
 * Thrown for every failed request. `status` is null for network failures,
 * which never reach the server and so never carry a documented error code.
 */
export class ApiClientError extends Error {
  readonly code: ApiClientErrorCode;
  readonly status: number | null;

  constructor(
    code: ApiClientErrorCode,
    message: string,
    status: number | null = null,
  ) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
  }
}

function isApiErrorResponse(payload: unknown): payload is ApiErrorResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof (payload as { error: unknown }).error === "object" &&
    (payload as { error: unknown }).error !== null &&
    "code" in (payload as { error: { code: unknown } }).error &&
    "message" in (payload as { error: { message: unknown } }).error
  );
}

interface RequestOptions {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  /** Omitted properties on this object are never sent (JSON.stringify drops `undefined`). */
  body?: unknown;
}

export async function request<T>({
  method,
  path,
  body,
}: RequestOptions): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiClientError(
      "NETWORK_ERROR",
      "Unable to reach the server. Check your connection and try again.",
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    if (isApiErrorResponse(payload)) {
      throw new ApiClientError(
        payload.error.code,
        payload.error.message,
        response.status,
      );
    }
    throw new ApiClientError(
      "INTERNAL_ERROR",
      "An unexpected server error occurred.",
      response.status,
    );
  }

  return payload as T;
}
