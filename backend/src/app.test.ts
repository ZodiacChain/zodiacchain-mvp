import assert from "node:assert/strict";
import test from "node:test";

import type { FastifyInstance } from "fastify";

import { buildApp } from "./app.js";
import type {
  CelestialResult,
  DrawClosingState,
  DrawEvent,
  DrawLifecycleRecord,
  RandomnessRecord,
  ResultDerivationRecord,
  TerrestrialResult,
  TestEntryFixture,
} from "./domain.js";
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
    const eventBody = events.json<{ data: DrawEvent[] }>();

    assert.deepEqual(
      eventBody.data.map((event) => event.type),
      [
        "DrawScheduled",
        "DrawOpened",
        "BetPlaced",
        "DrawClosed",
        "RandomnessRequested",
        "RandomnessFulfilled",
        "DrawResolved",
        "DrawArchived",
      ],
    );
    assert.equal(eventBody.data[2]?.payload.entryId, "entry-demo-042-reviewer-a17");
    assert.equal(
      eventBody.data[2]?.payload.entryHash,
      "0xe170000000000000000000000000000000000000000000000000000000000042",
    );
    assert.equal(eventBody.data[4]?.payload.requestId, "req-demo-2026-05-16-042");
    assert.equal(eventBody.data[5]?.payload.terrestrialWord, "0x04");
    assert.equal(eventBody.data[5]?.payload.celestialWord, "0x10");
    assert.equal(eventBody.data[6]?.payload.terrestrialResult, "04");
    assert.equal(eventBody.data[6]?.payload.celestialNumber, "17");
    assert.equal(eventBody.data[6]?.payload.celestialAnimalName, "Dragon");
    assert.equal(eventBody.data[6]?.payload.celestialElementName, "Fire");
    const randomnessBody = randomness.json<{ data: RandomnessRecord }>();
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
    assert.equal(randomnessBody.data.fulfilledAt, "2026-05-16T18:12:00.000Z");
    assert.equal(
      randomnessBody.data.callbackTransactionHash,
      "0x0000000000000000000000000000000000000000000000000000000000042012",
    );
    assert.deepEqual(reconstructedResult.celestialResult, drawBody.data.celestialResult);
    assert.deepEqual(reconstructedResult.terrestrialResult, drawBody.data.terrestrialResult);
    assert.equal(fairness.json<{ data: { checks: unknown[] } }>().data.checks.length > 0, true);
  });
});

test("draw lifecycle fixtures expose test entry, closing state, lifecycle, and derivation", async () => {
  await withApp(async (app) => {
    const testEntry = await app.inject({
      method: "GET",
      url: "/api/v1/draws/AMOY-DEMO-042/test-entry",
    });
    const closingState = await app.inject({
      method: "GET",
      url: "/api/v1/draws/AMOY-DEMO-042/closing-state",
    });
    const lifecycle = await app.inject({
      method: "GET",
      url: "/api/v1/draws/AMOY-DEMO-042/lifecycle",
    });
    const result = await app.inject({
      method: "GET",
      url: "/api/v1/draws/AMOY-DEMO-042/result",
    });
    const derivation = await app.inject({
      method: "GET",
      url: "/api/v1/draws/AMOY-DEMO-042/result-derivation",
    });

    assert.equal(testEntry.statusCode, 200);
    assert.equal(closingState.statusCode, 200);
    assert.equal(lifecycle.statusCode, 200);
    assert.equal(result.statusCode, 200);
    assert.equal(derivation.statusCode, 200);

    const testEntryBody = testEntry.json<{ data: TestEntryFixture }>();
    const closingStateBody = closingState.json<{ data: DrawClosingState }>();
    const lifecycleBody = lifecycle.json<{ data: DrawLifecycleRecord }>();
    const resultBody = result.json<{ data: ResultDerivationRecord }>();
    const derivationBody = derivation.json<{ data: ResultDerivationRecord }>();

    assert.equal(testEntryBody.data.drawId, "AMOY-DEMO-042");
    assert.equal(testEntryBody.data.demoOnly, true);
    assert.equal(testEntryBody.data.accepted, true);
    assert.deepEqual(testEntryBody.data.selectedNumbers, ["04", "11", "16", "23", "35"]);
    assert.equal(closingStateBody.data.status, "entry_locked");
    assert.equal(closingStateBody.data.nextStatus, "randomness_requested");
    assert.equal(
      closingStateBody.data.entryRoot,
      "0x7c1e00000000000000000000000000000000000000000000000000000000a90d",
    );
    assert.equal(lifecycleBody.data.requestId, "req-demo-2026-05-16-042");
    assert.equal(lifecycleBody.data.currentStatus, "published");
    assert.equal(
      lifecycleBody.data.steps.every((step) => step.status === "complete"),
      true,
    );
    assert.equal(derivationBody.data.requestId, "req-demo-2026-05-16-042");
    assert.equal(derivationBody.data.source, "mock-result-derivation");
    assert.equal(derivationBody.data.terrestrialResult.displayValue, "04");
    assert.equal(derivationBody.data.terrestrialResult.value, 4);
    assert.equal(derivationBody.data.celestialResult.displayValue, "17");
    assert.equal(derivationBody.data.celestialResult.value, 17);
    assert.equal(derivationBody.data.celestialResult.animalName, "Dragon");
    assert.equal(derivationBody.data.celestialResult.elementName, "Fire");
    assert.equal(derivationBody.data.celestialResult.label, "Dragon / Fire");
    assert.deepEqual(resultBody.data, derivationBody.data);
  });
});

test("draw endpoints return a consistent 404 payload for unknown draw ids", async () => {
  await withApp(async (app) => {
    const urls = [
      "/api/v1/draws/UNKNOWN",
      "/api/v1/draws/UNKNOWN/test-entry",
      "/api/v1/draws/UNKNOWN/closing-state",
      "/api/v1/draws/UNKNOWN/lifecycle",
      "/api/v1/draws/UNKNOWN/events",
      "/api/v1/draws/UNKNOWN/randomness",
      "/api/v1/draws/UNKNOWN/result",
      "/api/v1/draws/UNKNOWN/result-derivation",
      "/api/v1/draws/UNKNOWN/fairness",
    ];

    for (const url of urls) {
      const response = await app.inject({ method: "GET", url });
      const body = response.json<{ error: { code: string; drawId: string } }>();

      assert.equal(response.statusCode, 404, url);
      assert.equal(body.error.code, "DRAW_NOT_FOUND", url);
      assert.equal(body.error.drawId, "UNKNOWN", url);
    }
  });
});
