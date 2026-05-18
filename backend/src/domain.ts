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

export type TerrestrialResult = {
  animalId: number;
  displayValue: string;
  value: number;
};

export type CelestialAnimalName =
  | "Rat"
  | "Ox"
  | "Tiger"
  | "Rabbit"
  | "Dragon"
  | "Snake"
  | "Horse"
  | "Goat"
  | "Monkey"
  | "Rooster"
  | "Dog"
  | "Pig";

export type CelestialElementName = "Wood" | "Fire" | "Earth" | "Metal" | "Water";

export type CelestialResult = {
  animalId: number;
  animalName: CelestialAnimalName;
  displayValue: string;
  elementId: number;
  elementName: CelestialElementName;
  label: string;
  value: number;
};

export type DrawDetail = DrawSummary & {
  celestialResult: CelestialResult | null;
  evidence: EvidenceItem[];
  lifecycle: DrawLifecycleStep[];
  terrestrialResult: TerrestrialResult | null;
};

export type DrawEventType =
  | "DrawScheduled"
  | "DrawOpened"
  | "BetPlaced"
  | "BetRejected"
  | "DrawClosed"
  | "RandomnessRequested"
  | "RandomnessFulfilled"
  | "DrawResolved"
  | "BetSettled"
  | "DrawArchived";

export type DrawEvent = {
  blockNumber: number | null;
  drawId: string;
  id: string;
  occurredAt: string;
  payload: Record<string, string | number | boolean | string[] | null>;
  transactionHash: string | null;
  type: DrawEventType;
};

export type TestEntryFixture = {
  accepted: boolean;
  demoOnly: true;
  drawId: string;
  entryHash: string;
  entryId: string;
  entriesCountAfterPlacement: number;
  label: string;
  network: "Polygon Amoy";
  placedAt: string;
  selectedNumbers: string[];
  transactionHash: string | null;
  walletAddress: string;
  zodiacSign: string;
};

export type DrawClosingState = {
  closedAt: string;
  closedBy: "Chainlink Automation mock";
  demoOnly: true;
  drawId: string;
  entriesCount: number;
  entryRoot: string;
  nextStatus: DrawStatus;
  status: "entry_locked";
};

export type RandomnessWords = {
  celestial: string;
  terrestrial: string;
};

export type RandomnessRecord = {
  callbackTransactionHash: string | null;
  fulfilledAt: string | null;
  provider: "Chainlink VRF mock";
  randomWords: RandomnessWords;
  requestId: string;
  requestedAt: string;
  seedDigest: string;
  value: string | null;
};

export type ResultDerivationRecord = {
  celestialResult: CelestialResult;
  derivedAt: string;
  demoOnly: true;
  drawId: string;
  randomWords: RandomnessWords;
  requestId: string;
  resultDigest: string;
  source: "mock-result-derivation";
  terrestrialResult: TerrestrialResult;
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

export type DrawLifecycleRecord = {
  currentStatus: "published";
  demoOnly: true;
  drawId: string;
  evidence: EvidenceItem[];
  events: DrawEvent[];
  requestId: string;
  steps: DrawLifecycleStep[];
};

export type ApiError = {
  error: {
    code: string;
    drawId?: string;
    message: string;
  };
};
