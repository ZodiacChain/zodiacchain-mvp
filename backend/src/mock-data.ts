import type {
  DrawDetail,
  DrawEvent,
  DrawSummary,
  FairnessRecord,
  RandomnessRecord,
} from "./domain.js";

const activeDraw: DrawDetail = {
  celestialResult: "Virgo Ascendant",
  contractAddress: "0x0000000000000000000000000000000000000042",
  demoOnly: true,
  entriesCount: 128,
  entryWindow: {
    closesAt: "2026-05-17T18:00:00.000Z",
    opensAt: "2026-05-16T18:00:00.000Z",
  },
  evidence: [
    { label: "Chain", value: "Polygon Amoy Testnet" },
    { label: "Draw contract", value: "0x0000000000000000000000000000000000000042" },
    { label: "VRF request", value: "req-demo-2026-05-16-042" },
    {
      label: "Entry root",
      value: "0x7c1e00000000000000000000000000000000000000000000000000000000a90d",
    },
    {
      label: "Result digest",
      value: "0xf3a80000000000000000000000000000000000000000000000000000000022c1",
    },
  ],
  id: "AMOY-DEMO-042",
  lifecycle: [
    {
      detail: "Test draw announced for reviewer validation.",
      label: "Opened",
      order: 1,
      status: "complete",
    },
    {
      detail: "Entry list will be frozen before randomness is requested.",
      label: "Locked",
      order: 2,
      status: "queued",
    },
    {
      detail: "Mock VRF request reference is prepared for the demo flow.",
      label: "Requested",
      order: 3,
      status: "queued",
    },
    {
      detail: "Randomness response will be captured as a mock fulfillment.",
      label: "Fulfilled",
      order: 4,
      status: "queued",
    },
    {
      detail: "Results are mapped deterministically from the mocked randomness value.",
      label: "Derived",
      order: 5,
      status: "queued",
    },
    {
      detail: "Evidence is exposed for dashboard verification.",
      label: "Published",
      order: 6,
      status: "queued",
    },
  ],
  maxEntries: 500,
  network: "Polygon Amoy",
  status: "entry_open",
  terrestrialResult: [4, 11, 16, 23, 35],
  title: "Reviewer test draw",
};

const drawEventsByDrawId: Record<string, DrawEvent[]> = {
  "AMOY-DEMO-042": [
    {
      blockNumber: 8421001,
      drawId: "AMOY-DEMO-042",
      id: "evt-demo-042-opened",
      occurredAt: "2026-05-16T18:00:00.000Z",
      payload: {
        entriesCount: 0,
        network: "Polygon Amoy",
      },
      transactionHash: "0x0000000000000000000000000000000000000000000000000000000000042001",
      type: "draw.opened",
    },
    {
      blockNumber: null,
      drawId: "AMOY-DEMO-042",
      id: "evt-demo-042-entry-snapshot",
      occurredAt: "2026-05-16T18:05:00.000Z",
      payload: {
        entriesCount: 128,
        source: "safe mock placeholder",
      },
      transactionHash: null,
      type: "entries.locked",
    },
  ],
};

const randomnessByDrawId: Record<string, RandomnessRecord> = {
  "AMOY-DEMO-042": {
    callbackTransactionHash: null,
    fulfilledAt: null,
    provider: "Chainlink VRF mock",
    requestId: "req-demo-2026-05-16-042",
    requestedAt: "2026-05-16T18:10:00.000Z",
    seedDigest: "0x9a420000000000000000000000000000000000000000000000000000000018ef",
    value: null,
  },
};

const fairnessByDrawId: Record<string, FairnessRecord> = {
  "AMOY-DEMO-042": {
    checks: [
      {
        detail: "Mock entries are represented by a deterministic root, not private user data.",
        label: "Entries locked before randomness",
        passed: true,
      },
      {
        detail: "Randomness reference uses a safe placeholder until VRF integration exists.",
        label: "Randomness reference available",
        passed: true,
      },
      {
        detail: "Result digest is a non-secret testnet placeholder for dashboard wiring.",
        label: "Result digest published",
        passed: true,
      },
    ],
    drawId: "AMOY-DEMO-042",
    entryRoot: "0x7c1e00000000000000000000000000000000000000000000000000000000a90d",
    publicNotes:
      "Demo-only fairness record for frontend and reviewer validation. No secrets, private credentials, or production treasury data are included.",
    resultDigest: "0xf3a80000000000000000000000000000000000000000000000000000000022c1",
    verificationUrl: null,
  },
};

const mockDraws = [activeDraw] satisfies DrawDetail[];

function toDrawSummary(draw: DrawDetail): DrawSummary {
  return {
    contractAddress: draw.contractAddress,
    demoOnly: draw.demoOnly,
    entriesCount: draw.entriesCount,
    entryWindow: draw.entryWindow,
    id: draw.id,
    maxEntries: draw.maxEntries,
    network: draw.network,
    status: draw.status,
    title: draw.title,
  };
}

export function listDrawSummaries(): DrawSummary[] {
  return mockDraws.map(toDrawSummary);
}

export function getActiveDraw(): DrawDetail {
  return activeDraw;
}

export function findDrawById(drawId: string): DrawDetail | undefined {
  return mockDraws.find((draw) => draw.id === drawId);
}

export function listDrawEvents(drawId: string): DrawEvent[] {
  return drawEventsByDrawId[drawId] ?? [];
}

export function getDrawRandomness(drawId: string): RandomnessRecord | undefined {
  return randomnessByDrawId[drawId];
}

export function getDrawFairness(drawId: string): FairnessRecord | undefined {
  return fairnessByDrawId[drawId];
}
