export type DrawStatus =
  | "entry_open"
  | "entry_locked"
  | "randomness_requested"
  | "randomness_fulfilled"
  | "results_derived"
  | "published";

export type LifecycleStepStatus = "complete" | "queued";

export type DrawLifecycleStep = {
  detail: string;
  label: string;
  order: number;
  status: LifecycleStepStatus;
};

export type EvidenceItem = {
  label: string;
  value: string;
};

export type DrawSummary = {
  contractAddress: string;
  demoOnly: boolean;
  entriesCount: number;
  entryWindow: {
    closesAt: string;
    opensAt: string;
  };
  id: string;
  maxEntries: number;
  network: "Polygon Amoy";
  status: DrawStatus;
  title: string;
};

export type DrawDetail = DrawSummary & {
  celestialResult: string | null;
  evidence: EvidenceItem[];
  lifecycle: DrawLifecycleStep[];
  terrestrialResult: number[] | null;
};

export type DrawEventType =
  | "draw.opened"
  | "entries.locked"
  | "randomness.requested"
  | "randomness.fulfilled"
  | "results.derived"
  | "evidence.published";

export type DrawEvent = {
  blockNumber: number | null;
  drawId: string;
  id: string;
  occurredAt: string;
  payload: Record<string, string | number | boolean | null>;
  transactionHash: string | null;
  type: DrawEventType;
};

export type RandomnessRecord = {
  callbackTransactionHash: string | null;
  fulfilledAt: string | null;
  provider: "Chainlink VRF mock";
  requestId: string;
  requestedAt: string;
  seedDigest: string;
  value: string | null;
};

export type FairnessCheck = {
  detail: string;
  label: string;
  passed: boolean;
};

export type FairnessRecord = {
  checks: FairnessCheck[];
  drawId: string;
  entryRoot: string;
  publicNotes: string;
  resultDigest: string;
  verificationUrl: string | null;
};

export type ApiError = {
  error: {
    code: string;
    drawId?: string;
    message: string;
  };
};
