import type { HealthService } from "../../services/health-service.js";

/**
 * Translates the validated request into a service call and returns the
 * documented response body. routes.ts binds this object's methods to
 * their Fastify routes.
 */
export function createHealthHandlers(service: HealthService) {
  return {
    async getHealth() {
      return service.check();
    },
  };
}
