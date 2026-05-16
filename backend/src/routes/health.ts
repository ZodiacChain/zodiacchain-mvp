import type { FastifyPluginAsync } from "fastify";

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/health", async () => ({
    service: "@zodiacchain/backend",
    status: "ok",
    timestamp: new Date().toISOString(),
  }));
};
