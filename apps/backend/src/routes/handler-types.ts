import type { FastifyReply, FastifyRequest } from "fastify";

/**
 * Shape every route handler must implement: it receives the validated
 * request/reply and returns the response body (or throws, which the central
 * error mapper in src/errors turns into the documented envelope).
 * Per-resource handler interfaces below name the operations a resource's
 * handler module must implement; concrete implementations land with each
 * resource's own change. Until then, each resource's registerXRoutes falls
 * back to notImplementedHandler, so the route still validates and answers
 * through the public error envelope.
 */
export type RouteHandler = (
  request: FastifyRequest,
  reply: FastifyReply,
) => unknown | Promise<unknown>;

export function notImplementedHandler(): never {
  throw new Error("No handler is registered for this operation yet.");
}
