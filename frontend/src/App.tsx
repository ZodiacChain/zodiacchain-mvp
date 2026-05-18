import { useEffect, useMemo, useState, type ReactElement, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  CircleDot,
  Clock3,
  Database,
  ExternalLink,
  Eye,
  FileText,
  Fingerprint,
  FlaskConical,
  Gauge,
  Hash,
  History,
  KeyRound,
  Layers3,
  Link2,
  ListChecks,
  LockKeyhole,
  Network,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  TableProperties,
  TicketCheck,
  Timer,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

type ScreenId =
  | "active-draw"
  | "test-entry"
  | "lifecycle"
  | "results"
  | "fairness-dashboard"
  | "historical-draws"
  | "wallet-activity"
  | "protection";

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
  description: string;
  icon: LucideIcon;
  id: ScreenId;
  kicker: string;
  label: string;
  title: string;
};

type LifecycleStage = {
  detail: string;
  evidenceLabel: string;
  evidenceValue: string;
  eventName: CanonicalEventName;
  id: LifecycleStageId;
  label: string;
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

type DataStatus = "loading" | "backend" | "fallback";

type ScreenProps = {
  currentStage: LifecycleStage;
  currentStageIndex: number;
  dataStatus: DataStatus;
  demoData: DemoData;
  isStageVisible: (stageId: LifecycleStageId) => boolean;
  loadError: string | null;
  onAdvance: () => void;
  onReset: () => void;
  onScreenSelect: (screenId: ScreenId) => void;
  onStageSelect: (stageId: LifecycleStageId) => void;
};

type ScreenComponent = (props: ScreenProps) => ReactElement;

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "violet";

type ReviewLifecyclePhase = {
  detail: string;
  icon: LucideIcon;
  id: string;
  label: string;
  stageIds: LifecycleStageId[];
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1";

const officialEventNames = [
  "DrawScheduled",
  "DrawOpened",
  "BetPlaced",
  "BetRejected",
  "DrawClosed",
  "RandomnessRequested",
  "RandomnessFulfilled",
  "DrawResolved",
  "BetSettled",
  "DrawArchived",
] satisfies CanonicalEventName[];

const reviewLifecyclePhases = [
  {
    detail: "Schedule and draw metadata are visible before entry collection.",
    icon: Clock3,
    id: "scheduled",
    label: "Scheduled",
    stageIds: ["draw-scheduled"],
  },
  {
    detail: "The testnet window is open and reviewer entries can be recorded.",
    icon: TicketCheck,
    id: "open",
    label: "Open",
    stageIds: ["draw-opened", "bet-placed"],
  },
  {
    detail: "Entries are locked before randomness can be requested.",
    icon: LockKeyhole,
    id: "closed",
    label: "Closed",
    stageIds: ["draw-closed"],
  },
  {
    detail: "Request ID and fulfillment evidence connect the draw to VRF.",
    icon: KeyRound,
    id: "awaiting-randomness",
    label: "Awaiting Randomness",
    stageIds: ["randomness-requested", "randomness-fulfilled"],
  },
  {
    detail: "Official mock results are derived from displayed random words.",
    icon: ListChecks,
    id: "resolved",
    label: "Resolved",
    stageIds: ["draw-resolved"],
  },
  {
    detail: "The evidence packet is ready for public verification review.",
    icon: Archive,
    id: "archived",
    label: "Archived",
    stageIds: ["draw-archived"],
  },
] satisfies ReviewLifecyclePhase[];

const screenMeta: Record<ScreenId, ScreenMeta> = {
  "active-draw": {
    description: "Draw workspace and lifecycle preview.",
    icon: Activity,
    id: "active-draw",
    kicker: "Protocol overview",
    label: "Active Draw",
    title: "Active Draw",
  },
  "test-entry": {
    description: "Reviewer testnet entry simulation.",
    icon: TicketCheck,
    id: "test-entry",
    kicker: "Simulation form",
    label: "Place Bet",
    title: "Place Test Bet",
  },
  lifecycle: {
    description: "State transitions and event evidence.",
    icon: BarChart3,
    id: "lifecycle",
    kicker: "Lifecycle",
    label: "Lifecycle",
    title: "Draw Lifecycle",
  },
  results: {
    description: "Official mock result derivation.",
    icon: ListChecks,
    id: "results",
    kicker: "Derivation",
    label: "Results",
    title: "Draw Result",
  },
  "fairness-dashboard": {
    description: "Public verification center.",
    icon: ShieldCheck,
    id: "fairness-dashboard",
    kicker: "Verification",
    label: "Fairness",
    title: "Fairness Dashboard",
  },
  "historical-draws": {
    description: "Archived and resolved draw evidence.",
    icon: History,
    id: "historical-draws",
    kicker: "Records",
    label: "Historical",
    title: "Historical Draws",
  },
  "wallet-activity": {
    description: "Wallet-scoped testnet activity.",
    icon: WalletCards,
    id: "wallet-activity",
    kicker: "Wallet",
    label: "Wallet",
    title: "Wallet Activity",
  },
  protection: {
    description: "Risk and rule infrastructure.",
    icon: ShieldAlert,
    id: "protection",
    kicker: "Protection",
    label: "Protection",
    title: "Protection View",
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
  "historical-draws": HistoricalDrawsScreen,
  "wallet-activity": WalletActivityScreen,
  protection: ProtectionScreen,
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
  const [dataStatus, setDataStatus] = useState<DataStatus>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
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
          setLoadError(null);
        }
      } catch (error) {
        if (!isCancelled) {
          setDemoData(fallbackDemoData);
          setDataStatus("fallback");
          setLoadError(error instanceof Error ? error.message : "Mock API unavailable.");
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
      <ProtocolHeader
        activeScreen={activeScreen}
        dataStatus={dataStatus}
        onScreenSelect={setActiveScreen}
        sourceLabel={sourceLabel}
        walletAddress={demoData.testEntry.walletAddress}
      />

      <main className="workspace">
        <StatusNotice dataStatus={dataStatus} loadError={loadError} />

        {activeScreen !== "active-draw" ? (
          <header className="screen-header">
            <div>
              <p>{activeMeta.kicker}</p>
              <h1>{activeMeta.title}</h1>
              <span>{activeMeta.description}</span>
            </div>
            <Badge icon={BadgeCheck} tone={dataStatus === "fallback" ? "warning" : "success"}>
              {sourceLabel}
            </Badge>
          </header>
        ) : null}

        <ActiveScreen
          currentStage={currentStage}
          currentStageIndex={currentStageIndex}
          dataStatus={dataStatus}
          demoData={demoData}
          isStageVisible={isStageVisible}
          loadError={loadError}
          onAdvance={handleAdvance}
          onReset={handleReset}
          onScreenSelect={setActiveScreen}
          onStageSelect={setCurrentStageId}
        />

        <AppFooter />
      </main>
    </div>
  );
}

function ProtocolHeader({
  activeScreen,
  dataStatus,
  onScreenSelect,
  sourceLabel,
  walletAddress,
}: {
  activeScreen: ScreenId;
  dataStatus: DataStatus;
  onScreenSelect: (screenId: ScreenId) => void;
  sourceLabel: string;
  walletAddress: string;
}) {
  return (
    <header className="protocol-header">
      <div className="brand-lockup">
        <div className="brand-mark" aria-hidden="true">
          <Network size={23} />
        </div>
        <div>
          <p>ZodiacChain</p>
          <span>Verifiable draw infrastructure</span>
        </div>
      </div>

      <nav className="primary-nav" aria-label="Primary navigation">
        {screens.map((screen) => {
          const Icon = screen.icon;
          const isActive = activeScreen === screen.id;

          return (
            <button
              aria-current={isActive ? "page" : undefined}
              className="nav-item"
              data-active={isActive}
              key={screen.id}
              onClick={() => onScreenSelect(screen.id)}
              type="button"
            >
              <Icon size={17} />
              <span>{screen.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="header-status" aria-label="Environment and wallet status">
        <Badge icon={FlaskConical} tone="violet">
          Testnet MVP
        </Badge>
        <Badge icon={Network} tone="info">
          Polygon Amoy
        </Badge>
        <Badge icon={WalletCards} tone="neutral">
          Demo wallet {shortenHash(walletAddress)}
        </Badge>
        <Badge icon={dataStatus === "loading" ? RefreshCw : BadgeCheck} tone={statusTone(dataStatus)}>
          {sourceLabel}
        </Badge>
      </div>
    </header>
  );
}

function ActiveDrawScreen({
  currentStage,
  currentStageIndex,
  dataStatus,
  demoData,
  isStageVisible,
  onAdvance,
  onReset,
  onScreenSelect,
  onStageSelect,
}: ScreenProps) {
  const { draw, lifecycleStages, randomness, result, testEntry } = demoData;
  const progressLabel = `${currentStageIndex + 1} of ${lifecycleStages.length}`;
  const isFinalStage = currentStageIndex === lifecycleStages.length - 1;

  const drawMetrics = [
    { label: "Draw ID", value: draw.id },
    { label: "Network", value: draw.network },
    { label: "Locked entries", value: `${draw.entriesCount} / ${draw.maxEntries} mock` },
    { label: "Lifecycle state", value: currentStage.eventName },
  ];

  return (
    <section className="screen-stack">
      <Panel className="hero-panel">
        <div className="hero-grid">
          <div className="hero-copy">
            <Badge icon={ShieldCheck} tone="info">
              Testnet-first verification layer
            </Badge>
            <h1>Verifiable Draw Infrastructure</h1>
            <p>
              ZodiacChain demonstrates locked entries, verifiable randomness, deterministic
              Terrestrial and Celestial results, and public auditability for grant review.
            </p>
            <div className="hero-actions">
              <Button icon={TicketCheck} onClick={() => onScreenSelect("test-entry")} variant="primary">
                Place Test Bet
              </Button>
              <Button
                icon={ShieldCheck}
                onClick={() => onScreenSelect("fairness-dashboard")}
                variant="secondary"
              >
                View Fairness Dashboard
              </Button>
            </div>
            <div className="trust-badges" aria-label="Trust badges">
              <Badge icon={FlaskConical} tone="violet">
                Testnet MVP
              </Badge>
              <Badge icon={KeyRound} tone="info">
                Chainlink VRF
              </Badge>
              <Badge icon={Network} tone="neutral">
                Polygon Amoy
              </Badge>
              <Badge icon={ShieldCheck} tone="success">
                Fairness Dashboard
              </Badge>
            </div>
          </div>

          <div className="hero-evidence-card">
            <div className="panel-heading compact">
              <Gauge size={20} />
              <h2>Active Draw</h2>
              <Badge tone="success">Demo active</Badge>
            </div>
            <div className="hero-draw-title">
              <strong>{draw.title}</strong>
              <span>{draw.id}</span>
            </div>
            <div className="mini-metrics">
              <MetricCard label="Entries" value={`${draw.entriesCount}/${draw.maxEntries}`} />
              <MetricCard label="Request ID" value={randomness.requestId} />
              <MetricCard label="Result digest" value={result.resultDigest} />
            </div>
          </div>
        </div>
      </Panel>

      <section className="screen-grid">
        <Panel className="wide">
          <div className="panel-heading">
            <div>
              <p>Current draw</p>
              <h2>{draw.title}</h2>
            </div>
            <Badge tone="success">Visible testnet state</Badge>
          </div>
          <div className="metrics-grid">
            {drawMetrics.map((metric) => (
              <MetricCard key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </div>
        </Panel>

        <Panel className="wide">
          <div className="stage-control">
            <div>
              <p>Lifecycle simulation</p>
              <h2>{currentStage.label}</h2>
              <span>{currentStage.detail}</span>
            </div>
            <div className="stage-actions" aria-label="Lifecycle simulation controls">
              <Button ariaLabel="Reset demo flow" icon={RotateCcw} onClick={onReset} variant="icon" />
              <Button disabled={isFinalStage} icon={Play} onClick={onAdvance} variant="primary">
                Advance
              </Button>
            </div>
          </div>
          <ProgressTrack
            label={`Lifecycle progress ${progressLabel}`}
            value={((currentStageIndex + 1) / lifecycleStages.length) * 100}
          />
          <div className="evidence-strip">
            <span>{progressLabel}</span>
            <strong>{currentStage.evidenceLabel}</strong>
            <code>{currentStage.evidenceValue}</code>
          </div>
          <LifecycleStepper
            currentStageIndex={currentStageIndex}
            lifecycleStages={lifecycleStages}
            onStageSelect={onStageSelect}
          />
        </Panel>

        <Panel>
          <div className="panel-heading compact">
            <Gauge size={20} />
            <h2>Readiness</h2>
          </div>
          <StatusList
            rows={[
              {
                label: "Entry capture",
                tone: isStageVisible("bet-placed") ? "success" : "warning",
                value: isStageVisible("bet-placed") ? "BetPlaced visible" : "Awaiting reviewer step",
              },
              {
                label: "Lock policy",
                tone: isStageVisible("draw-closed") ? "success" : "info",
                value: isStageVisible("draw-closed") ? "DrawClosed published" : "Open in demo",
              },
              {
                label: "Randomness",
                tone: isStageVisible("randomness-fulfilled") ? "success" : "warning",
                value: isStageVisible("randomness-fulfilled")
                  ? "Mock words fulfilled"
                  : "Pending request path",
              },
            ]}
          />
        </Panel>

        <Panel>
          <div className="panel-heading compact">
            <Hash size={20} />
            <h2>Evidence IDs</h2>
          </div>
          <FactGrid
            facts={[
              { label: "Request ID", value: randomness.requestId },
              { label: "Entry ID", value: testEntry.entryId },
              { label: "Event", value: currentStage.eventName },
              { label: "Data source", value: dataStatus === "loading" ? "Loading" : demoData.source },
            ]}
          />
        </Panel>
      </section>
    </section>
  );
}

function TestEntryScreen({
  currentStageIndex,
  demoData,
  isStageVisible,
  onScreenSelect,
  onStageSelect,
}: ScreenProps) {
  const { draw, testEntry } = demoData;
  const entryVisible = isStageVisible("bet-placed");
  const validationRows = [
    {
      detail: `${draw.network} testnet fixture is selected.`,
      label: "Network gate",
      passed: true,
    },
    {
      detail: "Demo wallet remains inside local allowance.",
      label: "Daily wallet limit",
      passed: true,
    },
    {
      detail: "Selected numbers are captured as entry data only.",
      label: "Entry payload",
      passed: testEntry.selectedNumbers.length > 0,
    },
    {
      detail: "Official results are derived later from randomness.",
      label: "Result separation",
      passed: true,
    },
  ];

  return (
    <section className="screen-grid">
      <Panel className="wide accent-panel">
        <div className="panel-heading">
          <div>
            <p>Technical simulation</p>
            <h2>Testnet entry form</h2>
          </div>
          <Badge tone={entryVisible ? "success" : "info"}>{entryVisible ? "BetPlaced" : "Ready"}</Badge>
        </div>
        <p className="body-copy wide-copy">
          This screen records a reviewer test bet into the mock entry set. It is intentionally
          framed as a protocol simulation, not a value-bearing product flow.
        </p>
        <div className="entry-form-grid">
          <div className="entry-selector">
            <span>Entry type</span>
            <strong>Deterministic draw test</strong>
            <div className="number-pills" aria-label="Selected test numbers">
              {testEntry.selectedNumbers.map((number) => (
                <span key={number}>{number}</span>
              ))}
            </div>
          </div>
          <div className="entry-selector">
            <span>Zodiac input</span>
            <strong>{testEntry.zodiacSign}</strong>
            <p>Stored as entry metadata; not used to mutate official result derivation.</p>
          </div>
          <div className="stake-card">
            <span>Demo stake units</span>
            <strong>1.00 test unit</strong>
            <p>Non-transferable interface fixture for testnet validation.</p>
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="panel-heading compact">
          <TicketCheck size={20} />
          <h2>Entry Evidence</h2>
        </div>
        <FactGrid
          facts={[
            { label: "Entry ID", value: testEntry.entryId },
            { label: "Wallet", value: testEntry.walletAddress },
            { label: "Entry hash", value: testEntry.entryHash },
            { label: "Placed at", value: formatTimestamp(testEntry.placedAt) },
          ]}
        />
      </Panel>

      <Panel>
        <div className="panel-heading compact">
          <CircleDot size={20} />
          <h2>Quote Panel</h2>
        </div>
        <div className="quote-panel">
          <MetricCard label="Draw ID" value={draw.id} />
          <MetricCard label="Entries after placement" value={`${testEntry.entriesCountAfterPlacement}`} />
          <MetricCard label="Transaction" value={testEntry.transactionHash ?? "Mock API record"} />
        </div>
        {currentStageIndex < 2 ? (
          <Button icon={ArrowRight} onClick={() => onStageSelect("bet-placed")} variant="primaryWide">
            Place test entry
          </Button>
        ) : (
          <div className="success-callout">
            <CheckCircle2 size={18} />
            BetPlaced at {formatTimestamp(testEntry.placedAt)}
          </div>
        )}
      </Panel>

      <Panel>
        <div className="panel-heading compact">
          <ListChecks size={20} />
          <h2>Validation Checklist</h2>
        </div>
        <div className="validation-list">
          {validationRows.map((row) => (
            <div className="validation-row" data-passed={row.passed} key={row.label}>
              {row.passed ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <div>
                <strong>{row.label}</strong>
                <p>{row.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <div className="panel-heading compact">
          <AlertTriangle size={20} />
          <h2>Rejection Path</h2>
        </div>
        <div className="rejection-box">
          <Badge tone="warning">BetRejected schema path</Badge>
          <p>
            No rejection is triggered for this accepted fixture. Rejection reasons would be shown
            here as readable text before any entry is recorded.
          </p>
          <StatusList
            rows={[
              { label: "Daily allowance", tone: "success", value: "Within test limit" },
              { label: "Cooldown", tone: "success", value: "Clear" },
              { label: "Solvency check", tone: "success", value: "Demo pool healthy" },
            ]}
          />
        </div>
      </Panel>

      <Panel className="wide cta-band">
        <div>
          <p>Verification handoff</p>
          <h2>Confirm how this entry appears in public evidence.</h2>
        </div>
        <Button icon={ShieldCheck} onClick={() => onScreenSelect("fairness-dashboard")} variant="secondary">
          Open Fairness Dashboard
        </Button>
      </Panel>
    </section>
  );
}

function LifecycleScreen({ currentStageIndex, demoData, onStageSelect }: ScreenProps) {
  const { events, lifecycleStages } = demoData;

  return (
    <section className="screen-grid">
      <Panel className="wide">
        <div className="panel-heading">
          <div>
            <p>Reviewer state model</p>
            <h2>Six-stage lifecycle</h2>
          </div>
          <Badge tone="success">
            {lifecycleStages[currentStageIndex]?.eventName ?? lifecycleStages[0]!.eventName}
          </Badge>
        </div>
        <LifecycleStepper
          currentStageIndex={currentStageIndex}
          lifecycleStages={lifecycleStages}
          onStageSelect={onStageSelect}
        />
      </Panel>

      <Panel className="wide">
        <div className="panel-heading compact">
          <FileText size={20} />
          <h2>Underlying Event Stream</h2>
        </div>
        <EventStream currentStageIndex={currentStageIndex} events={events} lifecycleStages={lifecycleStages} />
      </Panel>

      <Panel className="wide">
        <div className="panel-heading">
          <div>
            <p>Official event names</p>
            <h2>Schema coverage</h2>
          </div>
          <Badge tone="neutral">Names preserved</Badge>
        </div>
        <div className="schema-grid">
          {officialEventNames.map((eventName) => {
            const emitted = events.some((event) => event.type === eventName);
            return (
              <div className="schema-card" data-emitted={emitted} key={eventName}>
                {emitted ? <CheckCircle2 size={17} /> : <CircleDot size={17} />}
                <strong>{eventName}</strong>
                <span>{emitted ? "Present in mock stream" : "No event emitted in this draw"}</span>
              </div>
            );
          })}
        </div>
      </Panel>
    </section>
  );
}

function ResultsScreen({ demoData, isStageVisible, onScreenSelect }: ScreenProps) {
  const { randomness, result } = demoData;
  const resultsVisible = isStageVisible("draw-resolved");
  const pendingValue = "Pending";

  const resultCards = [
    {
      detail: "Modulo 100 output from the terrestrial random word.",
      label: "Terrestrial Result 00-99",
      tone: "info" as BadgeTone,
      value: resultsVisible ? result.terrestrialResult.displayValue : pendingValue,
    },
    {
      detail: "Protocol group derived from the 00-99 terrestrial result.",
      label: "Terrestrial Animal",
      tone: "neutral" as BadgeTone,
      value: resultsVisible
        ? `Animal ID ${String(result.terrestrialResult.animalId).padStart(2, "0")}`
        : pendingValue,
    },
    {
      detail: "Range-normalized celestial number.",
      label: "Celestial Number 01-60",
      tone: "violet" as BadgeTone,
      value: resultsVisible ? result.celestialResult.displayValue : pendingValue,
    },
    {
      detail: "Celestial animal mapped by deterministic index.",
      label: "Celestial Animal",
      tone: "success" as BadgeTone,
      value: resultsVisible ? result.celestialResult.animalName : pendingValue,
    },
    {
      detail: "Celestial element mapped by deterministic band.",
      label: "Celestial Element",
      tone: "warning" as BadgeTone,
      value: resultsVisible ? result.celestialResult.elementName : pendingValue,
    },
  ];

  return (
    <section className="screen-grid">
      <Panel className="wide result-hero">
        <div className="panel-heading">
          <div>
            <p>Official mock/testnet results</p>
            <h2>Deterministic output packet</h2>
          </div>
          <Badge tone={resultsVisible ? "success" : "warning"}>
            {resultsVisible ? "DrawResolved" : "Awaiting DrawResolved"}
          </Badge>
        </div>
        <div className="result-card-grid">
          {resultCards.map((card) => (
            <ResultTile
              detail={card.detail}
              key={card.label}
              label={card.label}
              tone={card.tone}
              value={card.value}
            />
          ))}
        </div>
      </Panel>

      <Panel className="wide">
        <div className="panel-heading">
          <div>
            <p>Derivation notes</p>
            <h2>Traceable mapping</h2>
          </div>
          <Badge tone="neutral">Backend source</Badge>
        </div>
        <div className="derivation-grid">
          <MetricCard label="Source" value={result.source} />
          <MetricCard label="Request ID" value={result.requestId} />
          <MetricCard label="Terrestrial word" value={randomness.randomWords.terrestrial} />
          <MetricCard label="Celestial word" value={randomness.randomWords.celestial} />
          <MetricCard label="Result digest" value={result.resultDigest} />
          <MetricCard label="Derived at" value={formatTimestamp(result.derivedAt)} />
        </div>
      </Panel>

      <Panel className="wide cta-band">
        <div>
          <p>Public verification</p>
          <h2>Inspect the full derivation and event trail.</h2>
        </div>
        <Button icon={ShieldCheck} onClick={() => onScreenSelect("fairness-dashboard")} variant="primary">
          View Fairness Dashboard
        </Button>
      </Panel>
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
  } = demoData;
  const evidenceVisible = isStageVisible("draw-archived");
  const archivedStageIndex = lifecycleStages.findIndex((stage) => stage.id === "draw-archived");
  const progressPercent = ((currentStageIndex + 1) / lifecycleStages.length) * 100;

  return (
    <section className="screen-grid fairness-dashboard">
      <Panel className="wide fairness-hero-panel">
        <div className="panel-heading">
          <div>
            <p>Verification center</p>
            <h2>Public fairness evidence</h2>
          </div>
          <Badge tone={evidenceVisible ? "success" : "warning"}>
            {evidenceVisible ? "Archived evidence" : "Evidence pending"}
          </Badge>
        </div>
        <p className="body-copy wide-copy">
          Fairness is verified by following the draw from locked entries through the randomness
          request, fulfillment, deterministic result derivation, and archived evidence packet.
        </p>
        <div className="fairness-overview-grid">
          <MetricCard label="Draw ID" value={draw.id} />
          <MetricCard label="Lifecycle state" value={currentStage.eventName} />
          <MetricCard label="Request ID" value={randomness.requestId} />
          <MetricCard label="Result digest" value={result.resultDigest} />
        </div>
        <ProgressTrack label="Fairness evidence progress" value={progressPercent} />
        {!evidenceVisible ? (
          <Button icon={ArrowRight} onClick={() => onStageSelect("draw-archived")} variant="secondary">
            Show archived evidence
          </Button>
        ) : null}
      </Panel>

      <Panel className="wide">
        <div className="panel-heading">
          <div>
            <p>Lifecycle timeline</p>
            <h2>Reviewer evidence path</h2>
          </div>
          <Badge tone="info">{currentStage.label}</Badge>
        </div>
        <LifecycleStepper
          currentStageIndex={currentStageIndex}
          lifecycleStages={lifecycleStages}
          onStageSelect={onStageSelect}
        />
      </Panel>

      <Panel className="wide">
        <div className="panel-heading compact">
          <ShieldCheck size={20} />
          <h2>Evidence Path Detail</h2>
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
      </Panel>

      <Panel>
        <div className="panel-heading compact">
          <KeyRound size={20} />
          <h2>Randomness / VRF</h2>
        </div>
        <FactGrid facts={randomnessReferences} />
      </Panel>

      <Panel>
        <div className="panel-heading compact">
          <ListChecks size={20} />
          <h2>Official Results</h2>
        </div>
        <div className="official-result-stack">
          <ResultTile
            detail="Derived from terrestrial random word"
            label="Terrestrial Result"
            tone="info"
            value={result.terrestrialResult.displayValue}
          />
          <ResultTile
            detail="Derived from celestial random word"
            label="Celestial Mapping"
            tone="violet"
            value={`${result.celestialResult.displayValue} ${result.celestialResult.label}`}
          />
        </div>
      </Panel>

      <Panel className="wide">
        <div className="panel-heading">
          <div>
            <p>Deterministic derivation</p>
            <h2>Walkthrough</h2>
          </div>
          <Badge tone={currentStageIndex >= archivedStageIndex ? "success" : "warning"}>
            {currentStageIndex >= archivedStageIndex ? "Digest ready" : "Mock preview"}
          </Badge>
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
      </Panel>

      <Panel className="wide">
        <div className="panel-heading compact">
          <TableProperties size={20} />
          <h2>Event History</h2>
        </div>
        <EventStream currentStageIndex={currentStageIndex} events={events} lifecycleStages={lifecycleStages} />
      </Panel>

      <Panel>
        <div className="panel-heading compact">
          <ShieldAlert size={20} />
          <h2>Protection Snapshot</h2>
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
      </Panel>

      <Panel>
        <div className="panel-heading compact">
          <ExternalLink size={20} />
          <h2>Verification References</h2>
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
      </Panel>

      <Panel className="wide">
        <div className="panel-heading">
          <div>
            <p>Evidence packet</p>
            <h2>Inspectable references</h2>
          </div>
          <Badge tone="neutral">{fairness.verificationUrl ? "Explorer ready" : "Mock/demo labels"}</Badge>
        </div>
        <EvidenceTable rows={[...evidenceRows, { label: "Public notes", value: fairness.publicNotes }]} />
      </Panel>
    </section>
  );
}

function HistoricalDrawsScreen({ currentStage, demoData, onScreenSelect }: ScreenProps) {
  const { draw, result } = demoData;
  const historicalRows = [
    {
      cta: "Open fairness",
      drawId: draw.id,
      resultSummary: demoData.resultSummary,
      state: currentStage.id === "draw-archived" ? "Archived" : "Resolved preview",
      timestamp: formatTimestamp(result.derivedAt),
      window: `${formatTimestamp(draw.entryWindow.opensAt)} to ${formatTimestamp(draw.entryWindow.closesAt)}`,
    },
  ];

  return (
    <section className="screen-grid">
      <Panel className="wide">
        <div className="panel-heading">
          <div>
            <p>Read model</p>
            <h2>Draw records</h2>
          </div>
          <Badge tone="info">Frontend-only mock view</Badge>
        </div>
        <div className="historical-table" role="table" aria-label="Historical draws">
          <div className="historical-row historical-head" role="row">
            <span>Draw ID</span>
            <span>State</span>
            <span>Result summary</span>
            <span>Timestamp</span>
            <span>Action</span>
          </div>
          {historicalRows.map((row) => (
            <div className="historical-row" role="row" key={row.drawId}>
              <span data-label="Draw ID">
                <strong>{row.drawId}</strong>
                <small>{row.window}</small>
              </span>
              <span data-label="State">
                <Badge tone={row.state === "Archived" ? "success" : "warning"}>{row.state}</Badge>
              </span>
              <span data-label="Result summary">{row.resultSummary}</span>
              <span data-label="Timestamp">{row.timestamp}</span>
              <span data-label="Action">
                <Button
                  icon={ShieldCheck}
                  onClick={() => onScreenSelect("fairness-dashboard")}
                  variant="secondarySmall"
                >
                  {row.cta}
                </Button>
              </span>
            </div>
          ))}
        </div>
      </Panel>

      <EmptyState
        action={
          <Button icon={Activity} onClick={() => onScreenSelect("active-draw")} variant="secondary">
            Return to active draw
          </Button>
        }
        icon={Archive}
        text="The mock read model currently exposes one reviewer draw. Future backend records can populate this area without changing the screen contract."
        title="No additional archived draws"
      />
    </section>
  );
}

function WalletActivityScreen({ currentStageIndex, demoData, isStageVisible }: ScreenProps) {
  const { draw, testEntry } = demoData;
  const walletRows = [
    {
      detail: testEntry.entryId,
      label: "Active testnet entry",
      status: isStageVisible("bet-placed") ? "Recorded" : "Ready",
      tone: isStageVisible("bet-placed") ? "success" : "info",
      value: testEntry.selectedNumbers.join(" "),
    },
    {
      detail: draw.id,
      label: "Pending settlement",
      status: currentStageIndex >= 3 && currentStageIndex < 6 ? "In lifecycle" : "Waiting",
      tone: currentStageIndex >= 3 && currentStageIndex < 6 ? "warning" : "neutral",
      value: "Awaiting randomness path",
    },
    {
      detail: "DrawResolved / BetSettled schema path",
      label: "Settled preview",
      status: isStageVisible("draw-resolved") ? "Preview ready" : "Pending",
      tone: isStageVisible("draw-resolved") ? "success" : "neutral",
      value: demoData.resultSummary,
    },
  ] satisfies Array<{
    detail: string;
    label: string;
    status: string;
    tone: BadgeTone;
    value: string;
  }>;

  return (
    <section className="screen-grid">
      <Panel className="wide">
        <div className="panel-heading">
          <div>
            <p>Wallet-scoped data</p>
            <h2>Demo wallet summary</h2>
          </div>
          <Badge icon={WalletCards} tone="neutral">
            Reviewer fixture
          </Badge>
        </div>
        <p className="body-copy wallet-disclaimer">
          This is a mock wallet fixture for reviewer inspection. No browser wallet is connected,
          no signing flow is active, and no value-bearing transaction is submitted from this screen.
        </p>
        <div className="wallet-summary-grid">
          <MetricCard label="Demo wallet fixture" value={testEntry.walletAddress} />
          <MetricCard label="Network" value={testEntry.network} />
          <MetricCard label="Connection status" value="Mock fixture only" />
          <MetricCard label="Daily remaining allowance" value="4 of 5 test entries" />
          <MetricCard label="Cooldown" value="Clear for demo submission" />
        </div>
      </Panel>

      <Panel className="wide">
        <div className="panel-heading compact">
          <TicketCheck size={20} />
          <h2>Entry Activity</h2>
        </div>
        <div className="activity-list">
          {walletRows.map((row) => (
            <div className="activity-row" key={row.label}>
              <div>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
                <code>{row.detail}</code>
              </div>
              <Badge tone={row.tone}>{row.status}</Badge>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <div className="panel-heading compact">
          <Timer size={20} />
          <h2>Usage Controls</h2>
        </div>
        <StatusList
          rows={[
            { label: "Daily limit", tone: "success", value: "1 used / 5 available" },
            { label: "Cooldown", tone: "success", value: "0 minutes remaining" },
            { label: "Concentration cap", tone: "success", value: "Within mock limits" },
          ]}
        />
      </Panel>

      <Panel>
        <div className="panel-heading compact">
          <Eye size={20} />
          <h2>Public Separation</h2>
        </div>
        <p className="body-copy">
          Wallet activity stays separate from public draw evidence. The Fairness Dashboard exposes
          draw-level verification references, while this view keeps wallet-scoped fixture data
          grouped for reviewer inspection.
        </p>
      </Panel>
    </section>
  );
}

function ProtectionScreen({ demoData }: ScreenProps) {
  const protectionRules = [
    {
      detail: "Rejects entries below the configured testnet unit floor before recording.",
      icon: Gauge,
      label: "Min bet",
      value: "1 test unit",
    },
    {
      detail: "Caps a single simulated entry so one wallet cannot dominate the fixture.",
      icon: ShieldAlert,
      label: "Max bet",
      value: "10 test units",
    },
    {
      detail: "Keeps settlement exposure bounded in the testnet read model.",
      icon: Layers3,
      label: "Payout cap",
      value: "Protocol cap fixture",
    },
    {
      detail: "Limits wallet activity per day without touching public draw evidence.",
      icon: WalletCards,
      label: "Daily wallet limit",
      value: "5 test entries",
    },
    {
      detail: "Prevents repeated rapid submissions from the same demo wallet.",
      icon: Timer,
      label: "Cooldown",
      value: "60 seconds",
    },
    {
      detail: "Tracks entry distribution before randomness is requested.",
      icon: BarChart3,
      label: "Concentration cap",
      value: "25% per selection group",
    },
    {
      detail: "Checks that the demo settlement pool can cover mocked outcomes.",
      icon: Database,
      label: "Solvency check",
      value: "Healthy",
    },
    {
      detail: "Locks result publication to the displayed request and result digest.",
      icon: LockKeyhole,
      label: "Immutable resolution window",
      value: demoData.randomness.requestId,
    },
  ];

  return (
    <section className="screen-grid">
      <Panel className="wide protection-hero">
        <div className="panel-heading">
          <div>
            <p>Risk and protocol controls</p>
            <h2>Protection infrastructure snapshot</h2>
          </div>
          <Badge tone="violet">Testnet policy layer</Badge>
        </div>
        <p className="body-copy wide-copy">
          These display fixtures explain how the MVP frames entry validation, exposure bounds, and
          immutable resolution controls without changing draw logic or result derivation.
        </p>
      </Panel>

      {protectionRules.map((rule) => {
        const Icon = rule.icon;
        return (
          <Panel className="rule-card" key={rule.label}>
            <div className="rule-icon" aria-hidden="true">
              <Icon size={20} />
            </div>
            <span>{rule.label}</span>
            <strong>{rule.value}</strong>
            <p>{rule.detail}</p>
          </Panel>
        );
      })}
    </section>
  );
}

function Badge({
  children,
  icon: Icon,
  tone = "neutral",
}: {
  children: ReactNode;
  icon?: LucideIcon;
  tone?: BadgeTone;
}) {
  return (
    <span className="badge" data-tone={tone}>
      {Icon ? <Icon size={15} /> : null}
      {children}
    </span>
  );
}

function Button({
  ariaLabel,
  children,
  disabled,
  icon: Icon,
  onClick,
  variant = "secondary",
}: {
  ariaLabel?: string;
  children?: ReactNode;
  disabled?: boolean;
  icon?: LucideIcon;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "primaryWide" | "secondarySmall" | "icon";
}) {
  return (
    <button
      aria-label={ariaLabel}
      className="action-button"
      data-variant={variant}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {Icon ? <Icon size={17} /> : null}
      {children ? <span>{children}</span> : null}
    </button>
  );
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`panel ${className}`.trim()}>{children}</div>;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ResultTile({
  detail,
  label,
  tone,
  value,
}: {
  detail: string;
  label: string;
  tone: BadgeTone;
  value: string;
}) {
  return (
    <div className="result-tile" data-tone={tone}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </div>
  );
}

function FactGrid({ facts }: { facts: Array<{ label: string; value: string }> }) {
  return (
    <dl className="fact-grid">
      {facts.map((fact) => (
        <div key={fact.label}>
          <dt>{fact.label}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function StatusList({
  rows,
}: {
  rows: Array<{ label: string; tone: BadgeTone; value: string }>;
}) {
  return (
    <div className="status-list">
      {rows.map((row) => (
        <div className="status-row" key={row.label}>
          <span>{row.label}</span>
          <strong>{row.value}</strong>
          <Badge tone={row.tone}>{toneLabel(row.tone)}</Badge>
        </div>
      ))}
    </div>
  );
}

function ProgressTrack({ label, value }: { label: string; value: number }) {
  return (
    <div className="progress-track" aria-label={label}>
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

function LifecycleStepper({
  currentStageIndex,
  lifecycleStages,
  onStageSelect,
}: {
  currentStageIndex: number;
  lifecycleStages: LifecycleStage[];
  onStageSelect?: (stageId: LifecycleStageId) => void;
}) {
  return (
    <ol className="lifecycle-stepper" aria-label="Draw lifecycle">
      {reviewLifecyclePhases.map((phase) => {
        const indices = phase.stageIds
          .map((stageId) => lifecycleStages.findIndex((stage) => stage.id === stageId))
          .filter((index) => index >= 0);
        const firstIndex = indices[0] ?? 0;
        const lastIndex = indices.at(-1) ?? firstIndex;
        const firstStageId = phase.stageIds[0] ?? "draw-scheduled";
        const state =
          currentStageIndex > lastIndex
            ? "complete"
            : currentStageIndex >= firstIndex && currentStageIndex <= lastIndex
              ? "active"
              : "queued";
        const evidenceStage = lifecycleStages[lastIndex] ?? lifecycleStages[firstIndex];
        const Icon = phase.icon;

        return (
          <li
            className="lifecycle-step"
            data-pending={phase.id === "awaiting-randomness" && state === "active"}
            data-state={state}
            key={phase.id}
          >
            <button
              disabled={!onStageSelect}
              onClick={() => onStageSelect?.(firstStageId)}
              type="button"
            >
              <span className="step-node" aria-hidden="true">
                {state === "complete" ? <CheckCircle2 size={18} /> : <Icon size={18} />}
              </span>
              <span className="step-copy">
                <strong>{phase.label}</strong>
                <small>{evidenceStage?.eventName ?? phase.label}</small>
              </span>
            </button>
            <p>{phase.detail}</p>
            {evidenceStage ? <code>{evidenceStage.evidenceValue}</code> : null}
          </li>
        );
      })}
    </ol>
  );
}

function EventStream({
  currentStageIndex,
  events,
  lifecycleStages,
}: {
  currentStageIndex: number;
  events: DrawEvent[];
  lifecycleStages: LifecycleStage[];
}) {
  return (
    <div className="event-stream">
      {events.map((event) => {
        const stageIndex = lifecycleStages.findIndex((stage) => stage.eventName === event.type);
        const visible = stageIndex <= currentStageIndex || stageIndex < 0;
        return (
          <div className="event-row" data-muted={!visible} key={event.id}>
            <span>{formatTimestamp(event.occurredAt)}</span>
            <strong>{event.type}</strong>
            <code>{event.transactionHash ?? event.id}</code>
            <small>{formatPayload(event.payload)}</small>
          </div>
        );
      })}
    </div>
  );
}

function EvidenceTable({ rows }: { rows: Array<{ label: string; value: string }> }) {
  return (
    <table className="evidence-table" aria-label="Verification evidence">
      <tbody>
        {rows.map((row) => (
          <tr className="evidence-row" key={row.label}>
            <th scope="row">{row.label}</th>
            <td>{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EmptyState({
  action,
  icon: Icon,
  text,
  title,
}: {
  action?: ReactNode;
  icon: LucideIcon;
  text: string;
  title: string;
}) {
  return (
    <Panel className="wide empty-state">
      <div className="empty-icon" aria-hidden="true">
        <Icon size={22} />
      </div>
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      {action}
    </Panel>
  );
}

function StatusNotice({
  dataStatus,
  loadError,
}: {
  dataStatus: DataStatus;
  loadError: string | null;
}) {
  const tone = dataStatus === "fallback" ? "warning" : dataStatus === "loading" ? "info" : "success";
  const copy =
    dataStatus === "fallback"
      ? "Mock API unavailable, so the frontend is using the canonical demo fallback. No production or value-bearing activity is represented."
      : dataStatus === "loading"
        ? "Loading Polygon Amoy mock evidence for reviewer validation."
        : "Testnet MVP demo only. Polygon Amoy mock evidence is loaded for reviewer validation.";

  return (
    <section className="notice" data-tone={tone} aria-label="Testnet scope">
      {dataStatus === "fallback" ? <AlertTriangle size={18} /> : <FlaskConical size={18} />}
      <span>{copy}</span>
      {loadError ? <code>{loadError}</code> : null}
    </section>
  );
}

function AppFooter() {
  return (
    <footer className="app-footer">
      <div>
        <strong>ZodiacChain MVP</strong>
        <span>Testnet-first verifiable draw infrastructure.</span>
      </div>
      <div>
        <span>No token sale language.</span>
        <span>No value-bearing public participation.</span>
        <span>Mock evidence until on-chain read models are connected.</span>
      </div>
    </footer>
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
      detail: "Draw schedule is fixed before the reviewer entry window opens.",
      evidenceLabel: "Draw ID",
      evidenceValue: draw.id,
      eventName: "DrawScheduled",
      id: "draw-scheduled",
      label: "Scheduled",
      timestamp: eventTimestamp(events, "DrawScheduled", draw.entryWindow.opensAt),
    },
    {
      detail: "The draw starts accepting reviewer test entries.",
      evidenceLabel: "Draw contract",
      evidenceValue: draw.contractAddress,
      eventName: "DrawOpened",
      id: "draw-opened",
      label: "Opened",
      timestamp: eventTimestamp(events, "DrawOpened", draw.entryWindow.opensAt),
    },
    {
      detail: "Reviewer sample entry is accepted into the mock entry set.",
      evidenceLabel: "Entry ID",
      evidenceValue: testEntry.entryId,
      eventName: "BetPlaced",
      id: "bet-placed",
      label: "Test Entry",
      timestamp: eventTimestamp(events, "BetPlaced", testEntry.placedAt),
    },
    {
      detail: "Accepted entries are locked before randomness is requested.",
      evidenceLabel: "Entry root",
      evidenceValue: fairness.entryRoot,
      eventName: "DrawClosed",
      id: "draw-closed",
      label: "Closed",
      timestamp: eventTimestamp(events, "DrawClosed", draw.entryWindow.closesAt),
    },
    {
      detail: "The request ID links the closed draw to Chainlink VRF evidence.",
      evidenceLabel: "Request ID",
      evidenceValue: randomness.requestId,
      eventName: "RandomnessRequested",
      id: "randomness-requested",
      label: "Requested",
      timestamp: eventTimestamp(events, "RandomnessRequested", randomness.requestedAt),
    },
    {
      detail: "Randomness words are captured for deterministic mapping.",
      evidenceLabel: "Callback transaction",
      evidenceValue: randomness.callbackTransactionHash ?? "Pending",
      eventName: "RandomnessFulfilled",
      id: "randomness-fulfilled",
      label: "Fulfilled",
      timestamp: eventTimestamp(events, "RandomnessFulfilled", randomness.fulfilledAt),
    },
    {
      detail: "Official results are derived from the displayed random words.",
      evidenceLabel: "Result digest",
      evidenceValue: result.resultDigest,
      eventName: "DrawResolved",
      id: "draw-resolved",
      label: "Resolved",
      timestamp: eventTimestamp(events, "DrawResolved", result.derivedAt),
    },
    {
      detail: "Resolved draw evidence is archived for dashboard verification.",
      evidenceLabel: "Result digest",
      evidenceValue: result.resultDigest,
      eventName: "DrawArchived",
      id: "draw-archived",
      label: "Archived",
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

function formatPayload(payload: Record<string, unknown>): string {
  return Object.entries(payload)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`)
    .join(" | ");
}

function shortenHash(value: string): string {
  if (value.length <= 14) {
    return value;
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function statusTone(dataStatus: DataStatus): BadgeTone {
  if (dataStatus === "fallback") {
    return "warning";
  }

  if (dataStatus === "loading") {
    return "info";
  }

  return "success";
}

function toneLabel(tone: BadgeTone): string {
  const labels: Record<BadgeTone, string> = {
    danger: "Issue",
    info: "Ready",
    neutral: "Queued",
    success: "Verified",
    violet: "Testnet",
    warning: "Pending",
  };

  return labels[tone];
}

export default App;
