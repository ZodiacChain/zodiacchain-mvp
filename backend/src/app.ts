import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";

import { drawRoutes } from "./routes/draws.js";
import { healthRoutes } from "./routes/health.js";

type BuildAppOptions = {
  logger?: boolean;
};

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? false,
  });

  await app.register(cors, {
    methods: ["GET"],
    origin: true,
  });

  await app.register(healthRoutes);
  await app.register(drawRoutes, { prefix: "/api/v1" });

  return app;
}
