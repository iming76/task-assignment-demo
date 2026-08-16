export interface Env {
  port: number;
  nodeEnv: string;
}

export function loadEnv(): Env {
  const parsedPort = Number.parseInt(process.env.PORT ?? "5000", 10);
  return {
    port: Number.isNaN(parsedPort) ? 5000 : parsedPort,
    nodeEnv: process.env.NODE_ENV ?? "development",
  };
}
