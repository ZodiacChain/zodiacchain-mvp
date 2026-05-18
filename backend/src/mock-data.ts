import type {
  DrawClosingState,
  DrawDetail,
  DrawEvent,
  DrawLifecycleRecord,
  DrawLifecycleStep,
  DrawSummary,
  FairnessRecord,
  RandomnessRecord,
  ResultDerivationRecord,
  TestEntryFixture,
} from "./domain.js";
import { deriveDrawResult } from "./result-derivation.js";

const mockRandomWords = {
  celestial: "0x10",
  terrestrial: "0x04",
};

const demoResult = deriveDrawResult(mockRandomWords);
const demoDrawId = "AMOY-DEMO-042";
const demoEntryRoot = "0x7c1e00000000000000000000000000000000000000000000000000000000a90d";
const demoRequestId = "req-demo-2026-05-16-042";
const demoEntryId = "entry-demo-042-reviewer-a17";
const demoEntryHash = "0xe170000000000000000000000000000000000000000000000000000000000042";
const demoSelectedNumbers = ["04", "11", "16", "23", "35"];
const demoWalletAddress = "0x0000000000000000000000000000000000000E17";
const demoResultDigest = "0xf3a80000000000000000000000000000000000000000000000000000000022c1";
const demoCallbackTransactionHash =
  "0x0000000000000000000000000000000000000000000000000000000000042012";

const activeDraw: DrawDetail = {
  celestialResult: demoResult.celestialResult,
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
    { label: "VRF request", value: demoRequestId },
    {
      label: "Entry root",
      value: demoEntryRoot,
    },
    {
      label: "Result digest",
      value: demoResultDigest,
    },
    { label: "Terrestrial word", value: mockRandomWords.terrestrial },
    { label: "Celestial word", value: mockRandomWords.celestial },
  ],
  id: demoDrawId,
  lifecycle: [
    {
      detail: "Draw schedule is fixed before the reviewer entry window opens.",
      label: "Scheduled",
      order: 1,
      status: "complete",
    },
    {
      detail: "Test draw announced for reviewer validation.",
      label: "Opened",
      order: 2,
      status: "complete",
    },
    {
      detail: "Reviewer sample entry is accepted into the mock entry set.",
      label: "Bet Placed",
      order: 3,
      status: "complete",
    },
    {
      detail: "Entry list will be frozen before randomness is requested.",
      label: "Closed",
      order: 4,
      status: "queued",
    },
    {
      detail: "Mock VRF request reference is prepared for the demo flow.",
      label: "Randomness Requested",
      order: 5,
      status: "queued",
    },
    {
      detail: "Randomness response will be captured as a mock fulfillment.",
      label: "Randomness Fulfilled",
      order: 6,
      status: "queued",
    },
    {
      detail: "Results are mapped deterministically from the mocked randomness value.",
      label: "Draw Resolved",
      order: 7,
      status: "queued",
    },
    {
      detail: "Resolved draw evidence is archived for dashboard verification.",
      label: "Archived",
      order: 8,
      status: "queued",
    },
  ],
  maxEntries: 500,
  network: "Polygon Amoy",
  status: "entry_open",
  terrestrialResult: demoResult.terrestrialResult,
  title: "Reviewer test draw",
};

const drawEventsByDrawId: Record<string, DrawEvent[]> = {
  [demoDrawId]: [
    {
      blockNumber: 8420995,
      drawId: demoDrawId,
      id: "evt-demo-042-draw-scheduled",
      occurredAt: "2026-05-16T17:55:00.000Z",
      payload: {
        closesAt: activeDraw.entryWindow.closesAt,
        drawId: demoDrawId,
        opensAt: activeDraw.entryWindow.opensAt,
      },
      transactionHash: "0x0000000000000000000000000000000000000000000000000000000000041995",
      type: "DrawScheduled",
    },
    {
      blockNumber: 8421001,
      drawId: demoDrawId,
      id: "evt-demo-042-draw-opened",
      occurredAt: "2026-05-16T18:00:00.000Z",
      payload: {
        drawId: demoDrawId,
        entriesCount: 0,
        network: activeDraw.network,
      },
      transactionHash: "0x0000000000000000000000000000000000000000000000000000000000042001",
      type: "DrawOpened",
    },
    {
      blockNumber: 8421003,
      drawId: demoDrawId,
      id: "evt-demo-042-bet-placed",
      occurredAt: "2026-05-16T18:03:00.000Z",
      payload: {
        drawId: demoDrawId,
        entryHash: demoEntryHash,
        entryId: demoEntryId,
        player: demoWalletAddress,
        selectedNumbers: demoSelectedNumbers,
      },
      transactionHash: null,
      type: "BetPlaced",
    },
    {
      blockNumber: 8421005,
      drawId: demoDrawId,
      id: "evt-demo-042-draw-closed",
      occurredAt: "2026-05-16T18:05:00.000Z",
      payload: {
        drawId: demoDrawId,
        entriesCount: 128,
        entryRoot: demoEntryRoot,
      },
      transactionHash: "0x0000000000000000000000000000000000000000000000000000000000042005",
      type: "DrawClosed",
    },
    {
      blockNumber: 8421006,
      drawId: demoDrawId,
      id: "evt-demo-042-randomness-requested",
      occurredAt: "2026-05-16T18:10:00.000Z",
      payload: {
        drawId: demoDrawId,
        provider: "Chainlink VRF mock",
        requestId: demoRequestId,
      },
      transactionHash: "0x0000000000000000000000000000000000000000000000000000000000042006",
      type: "RandomnessRequested",
    },
    {
      blockNumber: 8421012,
      drawId: demoDrawId,
      id: "evt-demo-042-randomness-fulfilled",
      occurredAt: "2026-05-16T18:12:00.000Z",
      payload: {
        celestialWord: mockRandomWords.celestial,
        drawId: demoDrawId,
        requestId: demoRequestId,
        terrestrialWord: mockRandomWords.terrestrial,
      },
      transactionHash: demoCallbackTransactionHash,
      type: "RandomnessFulfilled",
    },
    {
      blockNumber: null,
      drawId: demoDrawId,
      id: "evt-demo-042-draw-resolved",
      occurredAt: "2026-05-16T18:13:00.000Z",
      payload: {
        celestialAnimalId: demoResult.celestialResult.animalId,
        celestialAnimalName: demoResult.celestialResult.animalName,
        celestialElementId: demoResult.celestialResult.elementId,
        celestialElementName: demoResult.celestialResult.elementName,
        celestialNumber: demoResult.celestialResult.displayValue,
        drawId: demoDrawId,
        resultDigest: demoResultDigest,
        terrestrialAnimalId: demoResult.terrestrialResult.animalId,
        terrestrialResult: demoResult.terrestrialResult.displayValue,
      },
      transactionHash: null,
      type: "DrawResolved",
    },
    {
      blockNumber: null,
      drawId: demoDrawId,
      id: "evt-demo-042-draw-archived",
      occurredAt: "2026-05-16T18:15:00.000Z",
      payload: {
        drawId: demoDrawId,
        entryRoot: demoEntryRoot,
        resultDigest: demoResultDigest,
      },
      transactionHash: null,
      type: "DrawArchived",
    },
  ],
};

const completedLifecycleSteps: DrawLifecycleStep[] = activeDraw.lifecycle.map((step) => ({
  ...step,
  status: "complete",
}));

const testEntriesByDrawId: Record<string, TestEntryFixture> = {
  [demoDrawId]: {
    accepted: true,
    demoOnly: true,
    drawId: demoDrawId,
    entryHash: demoEntryHash,
    entryId: demoEntryId,
    entriesCountAfterPlacement: 128,
    label: "Reviewer Ticket A-17",
    network: "Polygon Amoy",
    placedAt: "2026-05-16T18:03:00.000Z",
    selectedNumbers: demoSelectedNumbers,
    transactionHash: null,
    walletAddress: demoWalletAddress,
    zodiacSign: "Virgo",
  },
};

const closingStatesByDrawId: Record<string, DrawClosingState> = {
  [demoDrawId]: {
    closedAt: "2026-05-16T18:05:00.000Z",
    closedBy: "Chainlink Automation mock",
    demoOnly: true,
    drawId: demoDrawId,
    entriesCount: 128,
    entryRoot: demoEntryRoot,
    nextStatus: "randomness_requested",
    status: "entry_locked",
  },
};

const randomnessByDrawId: Record<string, RandomnessRecord> = {
  [demoDrawId]: {
    callbackTransactionHash: demoCallbackTransactionHash,
    fulfilledAt: "2026-05-16T18:12:00.000Z",
    provider: "Chainlink VRF mock",
    randomWords: mockRandomWords,
    requestId: demoRequestId,
    requestedAt: "2026-05-16T18:10:00.000Z",
    seedDigest: "0x9a420000000000000000000000000000000000000000000000000000000018ef",
    value: mockRandomWords.celestial,
  },
};

const resultDerivationsByDrawId: Record<string, ResultDerivationRecord> = {
  [demoDrawId]: {
    celestialResult: demoResult.celestialResult,
    derivedAt: "2026-05-16T18:13:00.000Z",
    demoOnly: true,
    drawId: demoDrawId,
    randomWords: mockRandomWords,
    requestId: demoRequestId,
    resultDigest: demoResultDigest,
    source: "mock-result-derivation",
    terrestrialResult: demoResult.terrestrialResult,
  },
};

const fairnessByDrawId: Record<string, FairnessRecord> = {
  [demoDrawId]: {
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
    drawId: demoDrawId,
    entryRoot: demoEntryRoot,
    publicNotes:
      "Demo-only fairness record for frontend and reviewer validation. No secrets, private credentials, or production treasury data are included.",
    resultDigest: demoResultDigest,
    verificationUrl: null,
  },
};

const lifecycleByDrawId: Record<string, DrawLifecycleRecord> = {
  [demoDrawId]: {
    currentStatus: "published",
    demoOnly: true,
    drawId: demoDrawId,
    evidence: activeDraw.evidence,
    events: drawEventsByDrawId[demoDrawId] ?? [],
    requestId: demoRequestId,
    steps: completedLifecycleSteps,
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

export function getDrawTestEntry(drawId: string): TestEntryFixture | undefined {
  return testEntriesByDrawId[drawId];
}

export function getDrawClosingState(drawId: string): DrawClosingState | undefined {
  return closingStatesByDrawId[drawId];
}

export function getDrawLifecycle(drawId: string): DrawLifecycleRecord | undefined {
  return lifecycleByDrawId[drawId];
}

export function getDrawRandomness(drawId: string): RandomnessRecord | undefined {
  return randomnessByDrawId[drawId];
}

export function getDrawResultDerivation(drawId: string): ResultDerivationRecord | undefined {
  return resultDerivationsByDrawId[drawId];
}

export function getDrawFairness(drawId: string): FairnessRecord | undefined {
  return fairnessByDrawId[drawId];
}
