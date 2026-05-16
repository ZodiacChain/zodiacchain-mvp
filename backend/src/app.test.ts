import assert from "node:assert/strict";
import test from "node:test";

import type { FastifyInstance } from "fastify";

import { buildApp } from "./app.js";

async function withApp(assertions: (app: FastifyInstance) => Promise<void>): Promise<void> {
  const app = await buildApp();

  try {
    await assertions(app);
  } finally {
    await app.close();
  }
}

test("GET /health returns service status", async () => {
  await withApp(async (app) => {
    const response = await app.inject({ method: "GET", url: "/health" });
    const body = response.json<{ service: string; status: string }>();

    assert.equal(response.statusCode, 200);
    assert.equal(body.service, "@zodiacchain/backend");
    assert.equal(body.status, "ok");
  });
});

test("GET /api/v1/draws/active returns the reviewer demo draw", async () => {
  await withApp(async (app) => {
    const response = await app.inject({ method: "GET", url: "/api/v1/draws/active" });
    const body = response.json<{ data: { demoOnly: boolean; id: string; network: string } }>();

    assert.equal(response.statusCode, 200);
    assert.equal(body.data.id, "AMOY-DEMO-042");
    assert.equal(body.data.network, "Polygon Amoy");
    assert.equal(body.data.demoOnly, true);
  });
});

test("draw subresources expose events, randomness, and fairness records", async () => {
  await withApp(async (app) => {
    const events = await app.inject({
      method: "GET",
      url: "/api/v1/draws/AMOY-DEMO-042/events",
    });
    const randomness = await app.inject({
      method: "GET",
      url: "/api/v1/draws/AMOY-DEMO-042/randomness",
    });
    const fairness = await app.inject({
      method: "GET",
      url: "/api/v1/draws/AMOY-DEMO-042/fairness",
    });

    assert.equal(events.statusCode, 200);
    assert.equal(randomness.statusCode, 200);
    assert.equal(fairness.statusCode, 200);
    assert.equal(events.json<{ data: unknown[] }>().data.length > 0, true);
    assert.equal(
      randomness.json<{ data: { requestId: string } }>().data.requestId,
      "req-demo-2026-05-16-042",
    );
    assert.equal(fairness.json<{ data: { checks: unknown[] } }>().data.checks.length > 0, true);
  });
});

test("draw endpoints return a consistent 404 payload for unknown draw ids", async () => {
  await withApp(async (app) => {
    const response = await app.inject({ method: "GET", url: "/api/v1/draws/UNKNOWN" });
    const body = response.json<{ error: { code: string; drawId: string } }>();

    assert.equal(response.statusCode, 404);
    assert.equal(body.error.code, "DRAW_NOT_FOUND");
    assert.equal(body.error.drawId, "UNKNOWN");
  });
});
