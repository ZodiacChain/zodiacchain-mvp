import type { FastifyPluginAsync, FastifyReply } from "fastify";

import type { ApiError } from "../domain.js";
import {
  findDrawById,
  getActiveDraw,
  getDrawFairness,
  getDrawRandomness,
  listDrawEvents,
  listDrawSummaries,
} from "../mock-data.js";

type DrawParams = {
  drawId: string;
};

function sendDrawNotFound(reply: FastifyReply, drawId: string): FastifyReply {
  const payload: ApiError = {
    error: {
      code: "DRAW_NOT_FOUND",
      drawId,
      message: `Draw '${drawId}' was not found in the mock API.`,
    },
  };

  return reply.code(404).send(payload);
}

export const drawRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/draws", async () => ({
    data: listDrawSummaries(),
  }));

  fastify.get("/draws/active", async () => ({
    data: getActiveDraw(),
  }));

  fastify.get<{ Params: DrawParams }>("/draws/:drawId", async (request, reply) => {
    const draw = findDrawById(request.params.drawId);

    if (!draw) {
      return sendDrawNotFound(reply, request.params.drawId);
    }

    return { data: draw };
  });

  fastify.get<{ Params: DrawParams }>("/draws/:drawId/events", async (request, reply) => {
    const draw = findDrawById(request.params.drawId);

    if (!draw) {
      return sendDrawNotFound(reply, request.params.drawId);
    }

    return { data: listDrawEvents(draw.id) };
  });

  fastify.get<{ Params: DrawParams }>("/draws/:drawId/randomness", async (request, reply) => {
    const draw = findDrawById(request.params.drawId);

    if (!draw) {
      return sendDrawNotFound(reply, request.params.drawId);
    }

    return { data: getDrawRandomness(draw.id) ?? null };
  });

  fastify.get<{ Params: DrawParams }>("/draws/:drawId/fairness", async (request, reply) => {
    const draw = findDrawById(request.params.drawId);

    if (!draw) {
      return sendDrawNotFound(reply, request.params.drawId);
    }

    return { data: getDrawFairness(draw.id) ?? null };
  });
};
