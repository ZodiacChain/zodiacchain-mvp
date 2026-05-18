import { useEffect, useMemo, useState, type ReactElement } from "react";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  ChartNetwork,
  CheckCircle2,
  CircleDot,
  Database,
  ExternalLink,
  Fingerprint,
  FileText,
  FlaskConical,
  Gauge,
  GitBranch,
  Hash,
  KeyRound,
  Link2,
  ListChecks,
  LockKeyhole,
  Network,
  Play,
  RotateCcw,
  Route,
  ShieldCheck,
  TicketCheck,
  type LucideIcon,
} from "lucide-react";

type ScreenId = "active-draw" | "test-entry" | "lifecycle" | "results" | "fairness-dashboard";

type LifecycleStageId =
  | "draw-scheduled"
  | "draw-opened"
  | "bet-placed"
  | "draw-closed"
  | "randomness-requested"
  | "randomness-fulfilled"
  | "draw-resolved"
  | "draw-archived";

type CanonicalEventName =
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

type ScreenMeta = {
  id: ScreenId;
  label: string;
  kicker: string;
  title: string;
  icon: LucideIcon;
};

type LifecycleStage = {
  id: LifecycleStageId;
  label: string;
  detail: string;
  evidenceLabel: string;
  evidenceValue: string;
  eventName: CanonicalEventName;
  timestamp: string;
};

type TerrestrialResult = {
  animalId: number;
  displayValue: string;
  value: number;
};

type CelestialResult = {
  animalId: number;
  animalName: string;
  displayValue: string;
  elementId: number;
  elementName: string;
  label: string;
  value: number;
};

type DrawDetail = {
  celestialResult: CelestialResult | null;
  contractAddress: string;
  demoOnly: boolean;
  entriesCount: number;
  entryWindow: {
    closesAt: string;
    opensAt: string;
  };
  evidence: Array<{ label: string; value: string }>;
  id: string;
  maxEntries: number;
  network: string;
  status: string;
  terrestrialResult: TerrestrialResult | null;
  title: string;
};

type TestEntryFixture = {
  accepted: boolean;
  demoOnly: true;
  drawId: string;
  entryHash: string;
  entryId: string;
  entriesCountAfterPlacement: number;
  label: string;
  network: string;
  placedAt: string;
  selectedNumbers: string[];
  transactionHash: string | null;
  walletAddress: string;
  zodiacSign: string;
};

type RandomnessRecord = {
  callbackTransactionHash: string | null;
  fulfilledAt: string | null;
  provider: string;
  randomWords: {
    celestial: string;
    terrestrial: string;
  };
  requestId: string;
  requestedAt: string;
  seedDigest: string;
  value: string | null;
};

type ResultDerivationRecord = {
  celestialResult: CelestialResult;
  derivedAt: string;
  demoOnly: true;
  drawId: string;
  randomWords: RandomnessRecord["randomWords"];
  requestId: string;
  resultDigest: string;
  source: string;
  terrestrialResult: TerrestrialResult;
};

type FairnessRecord = {
  checks: Array<{
    detail: string;
    label: string;
    passed: boolean;
  }>;
  drawId: string;
  entryRoot: string;
  publicNotes: string;
  resultDigest: string;
  verificationUrl: string | null;
};

type DrawEvent = {
  blockNumber: number | null;
  drawId: string;
  id: string;
  occurredAt: string;
  payload: Record<string, unknown>;
  transactionHash: string | null;
  type: CanonicalEventName;
};

type DemoData = {
  derivationWalkthrough: Array<{ label: string; result: string; step: string; working: string }>;
  draw: DrawDetail;
  events: DrawEvent[];
  evidenceRows: Array<{ label: string; value: string }>;
  explorerPlaceholders: Array<{ label: string; target: string; type: string }>;
  fairness: FairnessRecord;
  fairnessEvidencePath: Array<{
    detail: string;
    evidenceLabel: string;
    evidenceValue: string;
    icon: LucideIcon;
    stageId: LifecycleStageId;
    title: string;
  }>;
  lifecycleStages: LifecycleStage[];
  protectionSummary: Array<{ detail: string; label: string; passed: boolean }>;
  randomness: RandomnessRecord;
  randomnessReferences: Array<{ label: string; value: string }>;
  result: ResultDerivationRecord;
  resultSummary: string;
  source: "backend" | "fallback";
  testEntry: TestEntryFixture;
};

type ApiEnvelope<T> = {
  data: T;
};

type ScreenProps = {
  currentStage: LifecycleStage;
  currentStageIndex: number;
  demoData: DemoData;
  isStageVisible: (stageId: LifecycleStageId) => boolean;
  onAdvance: () => void;
  onReset: () => void;
  onStageSelect: (stageId: LifecycleStageId) => void;
};

type ScreenComponent = (props: ScreenProps) => ReactElement;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1";

const screenMeta: Record<ScreenId, ScreenMeta> = {
  "active-draw": {
    id: "active-draw",
    label: "Active Draw",
    kicker: "Draw workspace",
    title: "Active Draw",
    icon: Activity,
  },
  "test-entry": {
    id: "test-entry",
    label: "Test Entry",
    kicker: "Reviewer flow",
    title: "Test Entry",
    icon: TicketCheck,
  },
  lifecycle: {
    id: "lifecycle",
    label: "Lifecycle",
    kicker: "State trail",
    title: "Lifecycle Visualization",
    icon: ChartNetwork,
  },
  results: {
    id: "results",
    label: "Results",
    kicker: "Derivation view",
    title: "Result Derivation",
    icon: ListChecks,
  },
  "fairness-dashboard": {
    id: "fairness-dashboard",
    label: "Fairness Dashboard",
    kicker: "Verification",
    title: "Fairness Dashboard",
    icon: ShieldCheck,
  },
};

const screens = Object.values(screenMeta);

const fallbackDraw: DrawDetail = {
  celestialResult: {
    animalId: 5,
    animalName: "Dragon",
    displayValue: "17",
    elementId: 2,
    elementName: "Fire",
    label: "Dragon / Fire",
    value: 17,
  },
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
    { label: "Terrestrial word", value: "0x04" },
    { label: "Celestial word", value: "0x10" },
  ],
  id: "AMOY-DEMO-042",
  maxEntries: 500,
  network: "Polygon Amoy",
  status: "entry_open",
  terrestrialResult: {
    animalId: 2,
    displayValue: "04",
    value: 4,
  },
  title: "Reviewer test draw",
};

const fallbackTestEntry: TestEntryFixture = {
  accepted: true,
  demoOnly: true,
  drawId: fallbackDraw.id,
  entryHash: "0xe170000000000000000000000000000000000000000000000000000000000042",
  entryId: "entry-demo-042-reviewer-a17",
  entriesCountAfterPlacement: 128,
  label: "Reviewer Ticket A-17",
  network: "Polygon Amoy",
  placedAt: "2026-05-16T18:03:00.000Z",
  selectedNumbers: ["04", "11", "16", "23", "35"],
  transactionHash: null,
  walletAddress: "0x0000000000000000000000000000000000000E17",
  zodiacSign: "Virgo",
};

const fallbackRandomness: RandomnessRecord = {
  callbackTransactionHash: "0x0000000000000000000000000000000000000000000000000000000000042012",
  fulfilledAt: "2026-05-16T18:12:00.000Z",
  provider: "Chainlink VRF mock",
  randomWords: {
    celestial: "0x10",
    terrestrial: "0x04",
  },
  requestId: "req-demo-2026-05-16-042",
  requestedAt: "2026-05-16T18:10:00.000Z",
  seedDigest: "0x9a420000000000000000000000000000000000000000000000000000000018ef",
  value: "0x10",
};

const fallbackResult: ResultDerivationRecord = {
  celestialResult: fallbackDraw.celestialResult!,
  derivedAt: "2026-05-16T18:13:00.000Z",
  demoOnly: true,
  drawId: fallbackDraw.id,
  randomWords: fallbackRandomness.randomWords,
  requestId: fallbackRandomness.requestId,
  resultDigest: "0xf3a80000000000000000000000000000000000000000000000000000000022c1",
  source: "mock-result-derivation",
  terrestrialResult: fallbackDraw.terrestrialResult!,
};

const fallbackFairness: FairnessRecord = {
  checks: [
    {
      detail: "Mock entries are represented by a deterministic root, not private user data.",
      label: "Entries locked before randomness",
      passed: true,
    },
    {
      detail: "Request ID and fulfillment are displayed as separate evidence points.",
      label: "VRF request and fulfillment linked",
      passed: true,
    },
    {
      detail: "The official result can be recomputed from the displayed random words.",
      label: "Deterministic result derivation",
      passed: true,
    },
  ],
  drawId: fallbackDraw.id,
  entryRoot: "0x7c1e00000000000000000000000000000000000000000000000000000000a90d",
  publicNotes:
    "Demo-only fairness record for frontend and reviewer validation. No secrets, private credentials, or production treasury data are included.",
  resultDigest: fallbackResult.resultDigest,
  verificationUrl: null,
};

const fallbackEvents: DrawEvent[] = [
  {
    blockNumber: 8420995,
    drawId: fallbackDraw.id,
    id: "evt-demo-042-draw-scheduled",
    occurredAt: "2026-05-16T17:55:00.000Z",
    payload: {
      closesAt: fallbackDraw.entryWindow.closesAt,
      drawId: fallbackDraw.id,
      opensAt: fallbackDraw.entryWindow.opensAt,
    },
    transactionHash: "0x0000000000000000000000000000000000000000000000000000000000041995",
    type: "DrawScheduled",
  },
  {
    blockNumber: 8421001,
    drawId: fallbackDraw.id,
    id: "evt-demo-042-draw-opened",
    occurredAt: "2026-05-16T18:00:00.000Z",
    payload: {
      drawId: fallbackDraw.id,
      entriesCount: 0,
      network: fallbackDraw.network,
    },
    transactionHash: "0x0000000000000000000000000000000000000000000000000000000000042001",
    type: "DrawOpened",
  },
  {
    blockNumber: 8421003,
    drawId: fallbackDraw.id,
    id: "evt-demo-042-bet-placed",
    occurredAt: fallbackTestEntry.placedAt,
    payload: {
      drawId: fallbackDraw.id,
      entryHash: fallbackTestEntry.entryHash,
      entryId: fallbackTestEntry.entryId,
      player: fallbackTestEntry.walletAddress,
      selectedNumbers: fallbackTestEntry.selectedNumbers,
    },
    transactionHash: null,
    type: "BetPlaced",
  },
  {
    blockNumber: 8421005,
    drawId: fallbackDraw.id,
    id: "evt-demo-042-draw-closed",
    occurredAt: "2026-05-16T18:05:00.000Z",
    payload: {
      drawId: fallbackDraw.id,
      entriesCount: fallbackDraw.entriesCount,
      entryRoot: fallbackFairness.entryRoot,
    },
    transactionHash: "0x0000000000000000000000000000000000000000000000000000000000042005",
    type: "DrawClosed",
  },
  {
    blockNumber: 8421006,
    drawId: fallbackDraw.id,
    id: "evt-demo-042-randomness-requested",
    occurredAt: fallbackRandomness.requestedAt,
    payload: {
      drawId: fallbackDraw.id,
      provider: fallbackRandomness.provider,
      requestId: fallbackRandomness.requestId,
    },
    transactionHash: "0x0000000000000000000000000000000000000000000000000000000000042006",
    type: "RandomnessRequested",
  },
  {
    blockNumber: 8421012,
    drawId: fallbackDraw.id,
    id: "evt-demo-042-randomness-fulfilled",
    occurredAt: fallbackRandomness.fulfilledAt ?? fallbackRandomness.requestedAt,
    payload: {
      celestialWord: fallbackRandomness.randomWords.celestial,
      drawId: fallbackDraw.id,
      requestId: fallbackRandomness.requestId,
      terrestrialWord: fallbackRandomness.randomWords.terrestrial,
    },
    transactionHash: fallbackRandomness.callbackTransactionHash,
    type: "RandomnessFulfilled",
  },
  {
    blockNumber: null,
    drawId: fallbackDraw.id,
    id: "evt-demo-042-draw-resolved",
    occurredAt: fallbackResult.derivedAt,
    payload: {
      celestialAnimalId: fallbackResult.celestialResult.animalId,
      celestialAnimalName: fallbackResult.celestialResult.animalName,
      celestialElementId: fallbackResult.celestialResult.elementId,
      celestialElementName: fallbackResult.celestialResult.elementName,
      celestialNumber: fallbackResult.celestialResult.displayValue,
      drawId: fallbackDraw.id,
      resultDigest: fallbackResult.resultDigest,
      terrestrialAnimalId: fallbackResult.terrestrialResult.animalId,
      terrestrialResult: fallbackResult.terrestrialResult.displayValue,
    },
    transactionHash: null,
    type: "DrawResolved",
  },
  {
    blockNumber: null,
    drawId: fallbackDraw.id,
    id: "evt-demo-042-draw-archived",
    occurredAt: "2026-05-16T18:15:00.000Z",
    payload: {
      drawId: fallbackDraw.id,
      entryRoot: fallbackFairness.entryRoot,
      resultDigest: fallbackResult.resultDigest,
    },
    transactionHash: null,
    type: "DrawArchived",
  },
];

const screenComponents: Record<ScreenId, ScreenComponent> = {
  "active-draw": ActiveDrawScreen,
  "test-entry": TestEntryScreen,
  lifecycle: LifecycleScreen,
  results: ResultsScreen,
  "fairness-dashboard": FairnessDashboardScreen,
};

const fallbackDemoData = buildDemoData({
  draw: fallbackDraw,
  events: fallbackEvents,
  fairness: fallbackFairness,
  randomness: fallbackRandomness,
  result: fallbackResult,
  source: "fallback",
  testEntry: fallbackTestEntry,
});

function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>("active-draw");
  const [currentStageId, setCurrentStageId] = useState<LifecycleStageId>("draw-opened");
  const [demoData, setDemoData] = useState<DemoData>(fallbackDemoData);
  const [dataStatus, setDataStatus] = useState<"loading" | "backend" | "fallback">("loading");
  const activeMeta = screenMeta[activeScreen];
  const ActiveScreen = screenComponents[activeScreen];
  const lifecycleStages = demoData.lifecycleStages;

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      try {
        const loadedDemoData = await loadDemoData();

        if (!isCancelled) {
          setDemoData(loadedDemoData);
          setDataStatus("backend");
        }
      } catch {
        if (!isCancelled) {
          setDemoData(fallbackDemoData);
          setDataStatus("fallback");
        }
      }
    }

    void load();

    return () => {
      isCancelled = true;
    };
  }, []);

  const currentStageIndex = useMemo(
    () =>
      Math.max(
        0,
        lifecycleStages.findIndex((stage) => stage.id === currentStageId),
      ),
    [currentStageId, lifecycleStages],
  );
  const currentStage = lifecycleStages[currentStageIndex] ?? lifecycleStages[0]!;
  const sourceLabel =
    dataStatus === "loading"
      ? "Loading mock API"
      : demoData.source === "backend"
        ? "Backend mock API"
        : "Canonical demo fallback";

  function isStageVisible(stageId: LifecycleStageId) {
    return lifecycleStages.findIndex((stage) => stage.id === stageId) <= currentStageIndex;
  }

  function handleAdvance() {
    const nextIndex = Math.min(currentStageIndex + 1, lifecycleStages.length - 1);
    setCurrentStageId(lifecycleStages[nextIndex]?.id ?? lifecycleStages[0]!.id);
  }

  function handleReset() {
    setCurrentStageId(lifecycleStages[0]!.id);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <Network size={22} />
          </div>
          <div>
            <p>ZodiacChain</p>
            <span>MVP demo</span>
          </div>
        </div>

        <nav className="nav-list">
          {screens.map((screen) => {
            const Icon = screen.icon;
            const isActive = activeScreen === screen.id;

            return (
              <button
                aria-current={isActive ? "page" : undefined}
                className="nav-item"
                data-active={isActive}
                key={screen.id}
                onClick={() => setActiveScreen(screen.id)}
                type="button"
              >
                <Icon size={18} />
                <span>{screen.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="workspace">
        <section className="notice" aria-label="Testnet scope">
          <FlaskConical size={18} />
          <span>
            Testnet MVP demo only. Polygon Amoy mock evidence for reviewer validation. No public
            participation or value-bearing activity.
          </span>
        </section>

        <header className="screen-header">
          <div>
            <p>{activeMeta.kicker}</p>
            <h1>{activeMeta.title}</h1>
          </div>
          <div className="status-pill">
            <BadgeCheck size={16} />
            {sourceLabel}
          </div>
        </header>

        <ActiveScreen
          currentStage={currentStage}
          currentStageIndex={currentStageIndex}
          demoData={demoData}
          isStageVisible={isStageVisible}
          onAdvance={handleAdvance}
          onReset={handleReset}
          onStageSelect={setCurrentStageId}
        />
      </main>
    </div>
  );
}

function ActiveDrawScreen({
  currentStage,
  currentStageIndex,
  demoData,
  isStageVisible,
  onAdvance,
  onReset,
}: ScreenProps) {
  const { draw, lifecycleStages, randomness, testEntry } = demoData;
  const progressLabel = `${currentStageIndex + 1} of ${lifecycleStages.length}`;
  const isFinalStage = currentStageIndex === lifecycleStages.length - 1;

  const drawMetrics = [
    { label: "Draw ID", value: draw.id },
    { label: "Network", value: draw.network },
    { label: "Entries", value: `${draw.entriesCount} / ${draw.maxEntries} mock` },
    { label: "Current state", value: currentStage.label },
  ];

  return (
    <section className="screen-grid">
      <div className="panel wide">
        <div className="panel-heading">
          <div>
            <p>Current draw</p>
            <h2>{draw.title}</h2>
          </div>
          <span className="state-tag open">Demo active</span>
        </div>
        <div className="metrics-grid">
          {drawMetrics.map((metric) => (
            <div className="metric" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="panel wide">
        <div className="stage-control">
          <div>
            <p>Demo script state</p>
            <h2>{currentStage.label}</h2>
            <span>{currentStage.detail}</span>
          </div>
          <div className="stage-actions" aria-label="Lifecycle simulation controls">
            <button
              aria-label="Reset demo flow"
              className="icon-button"
              onClick={onReset}
              title="Reset demo flow"
              type="button"
            >
              <RotateCcw size={18} />
            </button>
            <button
              className="primary-action"
              disabled={isFinalStage}
              onClick={onAdvance}
              type="button"
            >
              <Play size={17} />
              Advance
            </button>
          </div>
        </div>
        <div className="progress-track" aria-label={`Lifecycle progress ${progressLabel}`}>
          <span style={{ width: `${((currentStageIndex + 1) / lifecycleStages.length) * 100}%` }} />
        </div>
        <div className="evidence-strip">
          <span>{progressLabel}</span>
          <strong>{currentStage.evidenceLabel}</strong>
          <code>{currentStage.evidenceValue}</code>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading compact">
          <Gauge size={20} />
          <h2>Readiness</h2>
        </div>
        <div className="readiness-list">
          <span>Entry capture</span>
          <strong>
            {isStageVisible("bet-placed") ? "BetPlaced visible" : "Awaiting reviewer step"}
          </strong>
          <span>Lock policy</span>
          <strong>{isStageVisible("draw-closed") ? "DrawClosed published" : "Open in demo"}</strong>
          <span>Randomness</span>
          <strong>
            {isStageVisible("randomness-fulfilled")
              ? "Mock words fulfilled"
              : "Pending request path"}
          </strong>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading compact">
          <Hash size={20} />
          <h2>Evidence IDs</h2>
        </div>
        <dl className="compact-facts">
          <div>
            <dt>Request ID</dt>
            <dd>{randomness.requestId}</dd>
          </div>
          <div>
            <dt>Entry ID</dt>
            <dd>{testEntry.entryId}</dd>
          </div>
          <div>
            <dt>Event</dt>
            <dd>{currentStage.eventName}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

function TestEntryScreen({ currentStageIndex, demoData, isStageVisible, onAdvance }: ScreenProps) {
  const { testEntry } = demoData;
  const entryVisible = isStageVisible("bet-placed");

  return (
    <section className="screen-grid">
      <div className="panel wide">
        <div className="panel-heading">
          <div>
            <p>Sample entry</p>
            <h2>Test entry simulation</h2>
          </div>
          <span className={entryVisible ? "state-tag open" : "state-tag muted"}>
            {entryVisible ? "BetPlaced" : "Ready"}
          </span>
        </div>
        <div className="ticket-preview">
          <div>
            <span>Entry label</span>
            <strong>{testEntry.label}</strong>
          </div>
          <div>
            <span>Selected numbers</span>
            <strong>{testEntry.selectedNumbers.join(" ")}</strong>
          </div>
          <div>
            <span>Zodiac sign</span>
            <strong>{testEntry.zodiacSign}</strong>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading compact">
          <TicketCheck size={20} />
          <h2>Entry Evidence</h2>
        </div>
        <dl className="compact-facts">
          <div>
            <dt>Entry ID</dt>
            <dd>{testEntry.entryId}</dd>
          </div>
          <div>
            <dt>Wallet</dt>
            <dd>{testEntry.walletAddress}</dd>
          </div>
          <div>
            <dt>Entry hash</dt>
            <dd>{testEntry.entryHash}</dd>
          </div>
        </dl>
      </div>

      <div className="panel">
        <div className="panel-heading compact">
          <CircleDot size={20} />
          <h2>Simulation State</h2>
        </div>
        <p className="body-copy">
          This is a reviewer test entry. Selected numbers are entry data only; official results are
          derived later from the randomness words.
        </p>
        {currentStageIndex < 2 ? (
          <button className="secondary-action" onClick={onAdvance} type="button">
            <ArrowRight size={17} />
            Place test entry
          </button>
        ) : (
          <div className="success-callout">
            <CheckCircle2 size={18} />
            BetPlaced at {formatTimestamp(testEntry.placedAt)}
          </div>
        )}
      </div>
    </section>
  );
}

function LifecycleScreen({ currentStageIndex, demoData, onStageSelect }: ScreenProps) {
  const { lifecycleStages } = demoData;

  return (
    <section className="screen-grid">
      <div className="panel wide">
        <div className="panel-heading">
          <div>
            <p>Draw state</p>
            <h2>Verification timeline</h2>
          </div>
          <span className="state-tag open">
            {lifecycleStages[currentStageIndex]?.eventName ?? lifecycleStages[0]!.eventName}
          </span>
        </div>
        <ol className="timeline">
          {lifecycleStages.map((step, index) => {
            const state =
              index < currentStageIndex
                ? "complete"
                : index === currentStageIndex
                  ? "active"
                  : "queued";

            return (
              <li className="timeline-step" data-state={state} key={step.id}>
                <button onClick={() => onStageSelect(step.id)} type="button">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{step.label}</strong>
                </button>
                <div>
                  <p>{step.detail}</p>
                  <dl>
                    <dt>{step.evidenceLabel}</dt>
                    <dd>{step.evidenceValue}</dd>
                    <dt>Event</dt>
                    <dd>{step.eventName}</dd>
                    <dt>Time</dt>
                    <dd>{step.timestamp}</dd>
                  </dl>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="panel wide">
        <div className="panel-heading compact">
          <FileText size={20} />
          <h2>Event Stream</h2>
        </div>
        <div className="event-stream">
          {lifecycleStages.map((event, index) => (
            <div className="event-row" data-muted={index > currentStageIndex} key={event.eventName}>
              <span>{event.timestamp}</span>
              <strong>{event.eventName}</strong>
              <code>{event.evidenceValue}</code>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ResultsScreen({ demoData, isStageVisible }: ScreenProps) {
  const { randomness, result } = demoData;
  const resultsVisible = isStageVisible("draw-resolved");

  return (
    <section className="screen-grid">
      <div className="panel">
        <div className="panel-heading compact">
          <ListChecks size={20} />
          <h2>Terrestrial Result</h2>
        </div>
        <div className="result-callout">
          <span>{resultsVisible ? "Official derived result" : "Awaiting derivation"}</span>
          <strong>{resultsVisible ? result.terrestrialResult.displayValue : "Pending"}</strong>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading compact">
          <Activity size={20} />
          <h2>Celestial Result</h2>
        </div>
        <div className="result-callout accent">
          <span>{resultsVisible ? "Celestial number and mapping" : "Awaiting randomness"}</span>
          <strong>
            {resultsVisible
              ? `${result.celestialResult.displayValue} - ${result.celestialResult.label}`
              : "Pending"}
          </strong>
        </div>
      </div>

      <div className="panel wide">
        <div className="panel-heading">
          <div>
            <p>Derivation notes</p>
            <h2>Traceable mapping</h2>
          </div>
          <span className="state-tag muted">Backend source</span>
        </div>
        <div className="derivation-grid">
          <div>
            <span>Source</span>
            <strong>{result.source}</strong>
          </div>
          <div>
            <span>Request ID</span>
            <strong>{result.requestId}</strong>
          </div>
          <div>
            <span>Terrestrial word</span>
            <strong>{randomness.randomWords.terrestrial}</strong>
          </div>
          <div>
            <span>Celestial word</span>
            <strong>{randomness.randomWords.celestial}</strong>
          </div>
          <div>
            <span>Result digest</span>
            <strong>{result.resultDigest}</strong>
          </div>
          <div>
            <span>Derived at</span>
            <strong>{formatTimestamp(result.derivedAt)}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

function FairnessDashboardScreen({
  currentStage,
  currentStageIndex,
  demoData,
  isStageVisible,
  onStageSelect,
}: ScreenProps) {
  const {
    derivationWalkthrough,
    draw,
    evidenceRows,
    explorerPlaceholders,
    fairnessEvidencePath,
    lifecycleStages,
    protectionSummary,
    randomnessReferences,
  } = demoData;
  const evidenceVisible = isStageVisible("draw-archived");
  const archivedStageIndex = lifecycleStages.findIndex((stage) => stage.id === "draw-archived");
  const progressPercent = ((currentStageIndex + 1) / lifecycleStages.length) * 100;

  return (
    <section className="screen-grid fairness-dashboard">
      <div className="panel wide fairness-hero-panel">
        <div className="panel-heading">
          <div>
            <p>Public verification</p>
            <h2>Fairness evidence path</h2>
          </div>
          <span className={evidenceVisible ? "state-tag open" : "state-tag muted"}>
            {evidenceVisible ? "Archived" : "Pending"}
          </span>
        </div>
        <p className="body-copy wide-copy">
          Fairness is verified by following the draw from locked entries, through the randomness
          request and fulfillment, into deterministic official results. The dashboard uses the same
          backend mock records as the result screen.
        </p>
        <div className="fairness-overview-grid">
          <div>
            <span>Draw ID</span>
            <strong>{draw.id}</strong>
          </div>
          <div>
            <span>Lifecycle state</span>
            <strong>{currentStage.eventName}</strong>
          </div>
          <div>
            <span>Evidence progress</span>
            <strong>
              {currentStageIndex + 1}/{lifecycleStages.length} events visible
            </strong>
          </div>
          <div>
            <span>Explorer status</span>
            <strong>Polygon Amoy placeholders</strong>
          </div>
        </div>
        {!evidenceVisible ? (
          <button
            className="secondary-action inline-action"
            onClick={() => onStageSelect("draw-archived")}
            type="button"
          >
            <ArrowRight size={17} />
            Show archived evidence
          </button>
        ) : null}
      </div>

      <div className="panel wide">
        <div className="panel-heading">
          <div>
            <p>Event evidence</p>
            <h2>Verification timeline</h2>
          </div>
          <span className="state-tag open">{currentStage.label}</span>
        </div>
        <div className="progress-track fairness-progress" aria-label="Fairness evidence progress">
          <span style={{ width: `${progressPercent}%` }} />
        </div>
        <ol className="fairness-path" aria-label="Fairness evidence timeline">
          {fairnessEvidencePath.map((item) => {
            const Icon = item.icon;
            const stageIndex = lifecycleStages.findIndex((stage) => stage.id === item.stageId);
            const timelineEvent = lifecycleStages[stageIndex];
            const isComplete = stageIndex < currentStageIndex || evidenceVisible;
            const isActive = stageIndex === currentStageIndex && !evidenceVisible;
            const state = isComplete ? "complete" : isActive ? "active" : "queued";

            return (
              <li className="fairness-path-step" data-state={state} key={item.title}>
                <div className="path-icon" aria-hidden="true">
                  <Icon size={18} />
                </div>
                <div>
                  <span>{timelineEvent?.eventName ?? item.evidenceLabel}</span>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                  <code>{item.evidenceValue}</code>
                  <small>{timelineEvent?.timestamp}</small>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="panel">
        <div className="panel-heading compact">
          <KeyRound size={20} />
          <h2>Randomness References</h2>
        </div>
        <dl className="compact-facts evidence-facts">
          {randomnessReferences.map((reference) => (
            <div key={reference.label}>
              <dt>{reference.label}</dt>
              <dd>{reference.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="panel">
        <div className="panel-heading compact">
          <ExternalLink size={20} />
          <h2>Explorer Placeholders</h2>
        </div>
        <div className="explorer-list">
          {explorerPlaceholders.map((placeholder) => (
            <div className="explorer-row" key={placeholder.label}>
              <div>
                <span>{placeholder.type}</span>
                <strong>{placeholder.label}</strong>
                <code>{placeholder.target}</code>
              </div>
              <span className="placeholder-link">
                <Link2 size={15} />
                Future link
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel wide">
        <div className="panel-heading">
          <div>
            <p>Deterministic derivation</p>
            <h2>Result walkthrough</h2>
          </div>
          <span
            className={
              currentStageIndex >= archivedStageIndex ? "state-tag open" : "state-tag muted"
            }
          >
            {currentStageIndex >= archivedStageIndex ? "Digest ready" : "Mock preview"}
          </span>
        </div>
        <div className="walkthrough-list">
          {derivationWalkthrough.map((step) => (
            <div className="walkthrough-step" key={step.step}>
              <span>{step.step}</span>
              <div>
                <strong>{step.label}</strong>
                <p>{step.working}</p>
                <code>{step.result}</code>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading compact">
          <ShieldCheck size={20} />
          <h2>Verification Summary</h2>
        </div>
        <div className="summary-list">
          {protectionSummary.map((summary) => (
            <div className="summary-row" key={summary.label}>
              <CheckCircle2 size={18} />
              <div>
                <strong>{summary.label}</strong>
                <p>{summary.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading compact">
          <Database size={20} />
          <h2>Replaceable Evidence</h2>
        </div>
        <div className="replacement-stack">
          <div>
            <Route size={18} />
            <span>Mock source</span>
            <strong>
              {demoData.source === "backend"
                ? "backend mock API records"
                : "canonical demo fallback"}
            </strong>
          </div>
          <div>
            <GitBranch size={18} />
            <span>Future source</span>
            <strong>backend read model + Polygon Amoy explorer URLs</strong>
          </div>
        </div>
      </div>

      <div className="panel wide">
        <div className="panel-heading compact">
          <FileText size={20} />
          <h2>Evidence Packet</h2>
        </div>
        <table className="evidence-table" aria-label="Verification evidence">
          <tbody>
            {evidenceRows.map((row) => (
              <tr className="evidence-row" key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

async function loadDemoData(): Promise<DemoData> {
  const activeDraw = await fetchApiData<DrawDetail>("/draws/active");
  const drawId = encodeURIComponent(activeDraw.id);
  const [testEntry, events, randomness, result, fairness] = await Promise.all([
    fetchApiData<TestEntryFixture>(`/draws/${drawId}/test-entry`),
    fetchApiData<DrawEvent[]>(`/draws/${drawId}/events`),
    fetchApiData<RandomnessRecord>(`/draws/${drawId}/randomness`),
    fetchApiData<ResultDerivationRecord>(`/draws/${drawId}/result`),
    fetchApiData<FairnessRecord>(`/draws/${drawId}/fairness`),
  ]);

  return buildDemoData({
    draw: activeDraw,
    events,
    fairness,
    randomness,
    result,
    source: "backend",
    testEntry,
  });
}

async function fetchApiData<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`Mock API request failed: ${response.status} ${path}`);
  }

  const body = (await response.json()) as ApiEnvelope<T>;
  return body.data;
}

function buildDemoData(input: {
  draw: DrawDetail;
  events: DrawEvent[];
  fairness: FairnessRecord;
  randomness: RandomnessRecord;
  result: ResultDerivationRecord;
  source: DemoData["source"];
  testEntry: TestEntryFixture;
}): DemoData {
  const { draw, events, fairness, randomness, result, source, testEntry } = input;
  const resultSummary = `Terrestrial ${result.terrestrialResult.displayValue} / Celestial ${result.celestialResult.displayValue} ${result.celestialResult.label}`;
  const lifecycleStages = buildLifecycleStages({
    draw,
    events,
    fairness,
    randomness,
    result,
    testEntry,
  });
  const evidenceRows = [
    { label: "Chain", value: draw.network },
    { label: "Draw ID", value: draw.id },
    { label: "Draw contract", value: draw.contractAddress },
    { label: "Entry ID", value: testEntry.entryId },
    { label: "Entry hash", value: testEntry.entryHash },
    { label: "Entry root", value: fairness.entryRoot },
    { label: "VRF request", value: randomness.requestId },
    { label: "Callback transaction", value: randomness.callbackTransactionHash ?? "Pending" },
    { label: "Terrestrial Result", value: result.terrestrialResult.displayValue },
    { label: "Celestial Number", value: result.celestialResult.displayValue },
    { label: "Celestial Mapping", value: result.celestialResult.label },
    { label: "Result digest", value: result.resultDigest },
  ];
  const fairnessEvidencePath = [
    {
      detail: "Draw metadata and schedule are visible before entries open.",
      evidenceLabel: "Draw ID",
      evidenceValue: draw.id,
      icon: Activity,
      stageId: "draw-scheduled",
      title: "Draw scheduled",
    },
    {
      detail: "Reviewer-facing entry window starts with the canonical DrawOpened event.",
      evidenceLabel: "Draw contract",
      evidenceValue: draw.contractAddress,
      icon: Activity,
      stageId: "draw-opened",
      title: "Draw opened",
    },
    {
      detail: "Reviewer sample entry is accepted and kept separate from official results.",
      evidenceLabel: "Entry hash",
      evidenceValue: testEntry.entryHash,
      icon: TicketCheck,
      stageId: "bet-placed",
      title: "Bet placed",
    },
    {
      detail: "Accepted entries are frozen into a deterministic root before randomness.",
      evidenceLabel: "Entry root",
      evidenceValue: fairness.entryRoot,
      icon: LockKeyhole,
      stageId: "draw-closed",
      title: "Draw closed",
    },
    {
      detail: "The request ID links the closed draw to the future Chainlink VRF evidence.",
      evidenceLabel: "Request ID",
      evidenceValue: randomness.requestId,
      icon: KeyRound,
      stageId: "randomness-requested",
      title: "Randomness requested",
    },
    {
      detail: "Fulfillment captures the random words used by deterministic derivation.",
      evidenceLabel: "Callback transaction",
      evidenceValue: randomness.callbackTransactionHash ?? "Pending",
      icon: Fingerprint,
      stageId: "randomness-fulfilled",
      title: "Randomness fulfilled",
    },
    {
      detail: "Random words are mapped to the official Terrestrial and Celestial results.",
      evidenceLabel: "Official output",
      evidenceValue: resultSummary,
      icon: ListChecks,
      stageId: "draw-resolved",
      title: "Draw resolved",
    },
    {
      detail: "Archived evidence keeps draw ID, entry root, request reference, and results tied.",
      evidenceLabel: "Result digest",
      evidenceValue: result.resultDigest,
      icon: ShieldCheck,
      stageId: "draw-archived",
      title: "Draw archived",
    },
  ] satisfies DemoData["fairnessEvidencePath"];
  const randomnessReferences = [
    { label: "Provider", value: randomness.provider },
    { label: "Request ID", value: randomness.requestId },
    { label: "Requested at", value: formatTimestamp(randomness.requestedAt) },
    { label: "Fulfilled at", value: formatTimestamp(randomness.fulfilledAt) },
    { label: "Callback transaction", value: randomness.callbackTransactionHash ?? "Pending" },
    { label: "Seed digest", value: randomness.seedDigest },
    { label: "Terrestrial word", value: randomness.randomWords.terrestrial },
    { label: "Celestial word", value: randomness.randomWords.celestial },
  ];
  const derivationWalkthrough = [
    {
      label: "Freeze accepted entries",
      result: fairness.entryRoot,
      step: "01",
      working: "entryRoot is published by DrawClosed before randomness is requested",
    },
    {
      label: "Bind request to draw",
      result: `${draw.id} + ${randomness.requestId}`,
      step: "02",
      working: "requestId links Chainlink VRF evidence to this draw",
    },
    {
      label: "Map terrestrial output",
      result: result.terrestrialResult.displayValue,
      step: "03",
      working: `${randomness.randomWords.terrestrial} % 100 = ${result.terrestrialResult.displayValue}`,
    },
    {
      label: "Map celestial output",
      result: `${result.celestialResult.displayValue} ${result.celestialResult.label}`,
      step: "04",
      working: `${randomness.randomWords.celestial} maps to ${result.celestialResult.displayValue}, ${result.celestialResult.label}`,
    },
    {
      label: "Publish digest",
      result: result.resultDigest,
      step: "05",
      working: "digest binds drawId, entryRoot, requestId, random words, and official results",
    },
  ];
  const explorerPlaceholders = [
    {
      label: "Draw contract",
      target: draw.contractAddress,
      type: "Polygon Amoy address",
    },
    {
      label: "Request transaction",
      target: findEvent(events, "RandomnessRequested")?.transactionHash ?? "0x...",
      type: "Polygon Amoy transaction",
    },
    {
      label: "Callback transaction",
      target: randomness.callbackTransactionHash ?? "0x...",
      type: "Polygon Amoy transaction",
    },
    {
      label: "Archived draw event",
      target: findEvent(events, "DrawArchived")?.id ?? "DrawArchived",
      type: "Future explorer event anchor",
    },
  ];
  const protectionSummary = fairness.checks.map((check) => ({
    detail: check.detail,
    label: check.label,
    passed: check.passed,
  }));

  return {
    derivationWalkthrough,
    draw,
    events,
    evidenceRows,
    explorerPlaceholders,
    fairness,
    fairnessEvidencePath,
    lifecycleStages,
    protectionSummary,
    randomness,
    randomnessReferences,
    result,
    resultSummary,
    source,
    testEntry,
  };
}

function buildLifecycleStages(input: {
  draw: DrawDetail;
  events: DrawEvent[];
  fairness: FairnessRecord;
  randomness: RandomnessRecord;
  result: ResultDerivationRecord;
  testEntry: TestEntryFixture;
}): LifecycleStage[] {
  const { draw, events, fairness, randomness, result, testEntry } = input;

  return [
    {
      id: "draw-scheduled",
      label: "Scheduled",
      detail: "Draw schedule is fixed before the reviewer entry window opens.",
      evidenceLabel: "Draw ID",
      evidenceValue: draw.id,
      eventName: "DrawScheduled",
      timestamp: eventTimestamp(events, "DrawScheduled", draw.entryWindow.opensAt),
    },
    {
      id: "draw-opened",
      label: "Opened",
      detail: "The draw starts accepting reviewer test entries.",
      evidenceLabel: "Draw contract",
      evidenceValue: draw.contractAddress,
      eventName: "DrawOpened",
      timestamp: eventTimestamp(events, "DrawOpened", draw.entryWindow.opensAt),
    },
    {
      id: "bet-placed",
      label: "Test Entry",
      detail: "Reviewer sample entry is accepted into the mock entry set.",
      evidenceLabel: "Entry ID",
      evidenceValue: testEntry.entryId,
      eventName: "BetPlaced",
      timestamp: eventTimestamp(events, "BetPlaced", testEntry.placedAt),
    },
    {
      id: "draw-closed",
      label: "Closed",
      detail: "Accepted entries are locked before randomness is requested.",
      evidenceLabel: "Entry root",
      evidenceValue: fairness.entryRoot,
      eventName: "DrawClosed",
      timestamp: eventTimestamp(events, "DrawClosed", draw.entryWindow.closesAt),
    },
    {
      id: "randomness-requested",
      label: "Requested",
      detail: "The request ID links the closed draw to Chainlink VRF evidence.",
      evidenceLabel: "Request ID",
      evidenceValue: randomness.requestId,
      eventName: "RandomnessRequested",
      timestamp: eventTimestamp(events, "RandomnessRequested", randomness.requestedAt),
    },
    {
      id: "randomness-fulfilled",
      label: "Fulfilled",
      detail: "Randomness words are captured for deterministic mapping.",
      evidenceLabel: "Callback transaction",
      evidenceValue: randomness.callbackTransactionHash ?? "Pending",
      eventName: "RandomnessFulfilled",
      timestamp: eventTimestamp(events, "RandomnessFulfilled", randomness.fulfilledAt),
    },
    {
      id: "draw-resolved",
      label: "Resolved",
      detail: "Official results are derived from the displayed random words.",
      evidenceLabel: "Result digest",
      evidenceValue: result.resultDigest,
      eventName: "DrawResolved",
      timestamp: eventTimestamp(events, "DrawResolved", result.derivedAt),
    },
    {
      id: "draw-archived",
      label: "Archived",
      detail: "Resolved draw evidence is archived for dashboard verification.",
      evidenceLabel: "Result digest",
      evidenceValue: result.resultDigest,
      eventName: "DrawArchived",
      timestamp: eventTimestamp(events, "DrawArchived", result.derivedAt),
    },
  ];
}

function findEvent(events: DrawEvent[], eventName: CanonicalEventName): DrawEvent | undefined {
  return events.find((event) => event.type === eventName);
}

function eventTimestamp(
  events: DrawEvent[],
  eventName: CanonicalEventName,
  fallback: string | null,
): string {
  return formatTimestamp(findEvent(events, eventName)?.occurredAt ?? fallback);
}

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "Pending";
  }

  return value.replace("T", " ").replace(".000Z", " UTC");
}

export default App;
