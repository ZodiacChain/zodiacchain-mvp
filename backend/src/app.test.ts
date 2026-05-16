import assert from "node:assert/strict";
import test from "node:test";

import type { FastifyInstance } from "fastify";

import { buildApp } from "./app.js";
import type { CelestialResult, RandomnessWords, TerrestrialResult } from "./domain.js";
import { deriveDrawResult } from "./result-derivation.js";

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
    const draw = await app.inject({
      method: "GET",
      url: "/api/v1/draws/AMOY-DEMO-042",
    });
    const fairness = await app.inject({
      method: "GET",
      url: "/api/v1/draws/AMOY-DEMO-042/fairness",
    });

    assert.equal(events.statusCode, 200);
    assert.equal(randomness.statusCode, 200);
    assert.equal(draw.statusCode, 200);
    assert.equal(fairness.statusCode, 200);
    assert.equal(events.json<{ data: unknown[] }>().data.length > 0, true);
    const randomnessBody = randomness.json<{
      data: {
        randomWords: RandomnessWords;
        requestId: string;
        value: string;
      };
    }>();
    const drawBody = draw.json<{
      data: {
        celestialResult: CelestialResult;
        terrestrialResult: TerrestrialResult;
      };
    }>();
    const reconstructedResult = deriveDrawResult(randomnessBody.data.randomWords);

    assert.equal(randomnessBody.data.requestId, "req-demo-2026-05-16-042");
    assert.equal(randomnessBody.data.value, "0x10");
    assert.equal(randomnessBody.data.randomWords.celestial, "0x10");
    assert.equal(randomnessBody.data.randomWords.terrestrial, "0x04");
    assert.deepEqual(reconstructedResult.celestialResult, drawBody.data.celestialResult);
    assert.deepEqual(reconstructedResult.terrestrialResult, drawBody.data.terrestrialResult);
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
