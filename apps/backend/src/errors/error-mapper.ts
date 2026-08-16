import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import type { ApiErrorResponse } from "@repo/shared-types";
import { ApplicationError } from "./application-error.js";

/**
 * Single mapping point from any thrown error (documented application
 * errors, Fastify/OpenAPI request-validation failures, or unexpected
 * failures) to the public error envelope. No other code may write an error
 * response body, so internal details never leak.
 */
export function mapErrorToResponse(error: unknown): {
  statusCode: number;
  body: ApiErrorResponse;
} {
  if (error instanceof ApplicationError) {
    return {
      statusCode: error.statusCode,
      body: { error: { code: error.code, message: error.message } },
    };
  }

  if (isRequestValidationError(error)) {
    return {
      statusCode: 400,
      body: {
        error: {
          code: "VALIDATION_ERROR",
          message: "The request did not match the documented API contract.",
        },
      },
    };
  }

  return {
    statusCode: 500,
    body: {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected server error occurred.",
      },
    },
  };
}

function isRequestValidationError(error: unknown): boolean {
  const fastifyError = error as Partial<FastifyError>;
  return (
    Array.isArray(fastifyError.validation) ||
    fastifyError.code === "FST_ERR_VALIDATION"
  );
}

export function registerErrorHandler(app: {
  setErrorHandler: (
    handler: (
      error: FastifyError,
      request: FastifyRequest,
      reply: FastifyReply,
    ) => void,
  ) => void;
}): void {
  app.setErrorHandler((error, request, reply) => {
    const { statusCode, body } = mapErrorToResponse(error);
    if (statusCode >= 500) {
      request.log.error({ err: error }, "unhandled request error");
    }
    reply.status(statusCode).send(body);
  });
}
