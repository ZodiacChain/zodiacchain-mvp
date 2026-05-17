import { useMemo, useState, type ReactElement } from "react";
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
  | "entry-open"
  | "test-entry-placed"
  | "entries-locked"
  | "randomness-requested"
  | "randomness-fulfilled"
  | "results-derived"
  | "evidence-published";

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
  eventName: string;
  timestamp: string;
};

type ScreenProps = {
  currentStage: LifecycleStage;
  currentStageIndex: number;
  isStageVisible: (stageId: LifecycleStageId) => boolean;
  onAdvance: () => void;
  onReset: () => void;
  onStageSelect: (stageId: LifecycleStageId) => void;
};

type ScreenComponent = (props: ScreenProps) => ReactElement;

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

const demoDraw = {
  celestialResult: "Virgo Ascendant",
  closesAt: "2026-05-17 18:00 UTC",
  contractAddress: "0x0000000000000000000000000000000000000042",
  drawId: "AMOY-DEMO-042",
  entriesCount: 128,
  entryRoot: "0x7c1e00000000000000000000000000000000000000000000000000000000a90d",
  maxEntries: 500,
  network: "Polygon Amoy Testnet",
  opensAt: "2026-05-16 18:00 UTC",
  resultDigest: "0xf3a80000000000000000000000000000000000000000000000000000000022c1",
  seedDigest: "0x9a420000000000000000000000000000000000000000000000000000000018ef",
  terrestrialResult: "04, 11, 16, 23, 35",
  title: "Reviewer test draw",
};

const testEntry = {
  accepted: true,
  entryHash: "0xe170000000000000000000000000000000000000000000000000000000000042",
  entryId: "entry-demo-042-reviewer-a17",
  label: "Reviewer Ticket A-17",
  placedAt: "2026-05-16 18:03 UTC",
  selectedNumbers: ["04", "11", "16", "23", "35"],
  walletAddress: "0x0000000000000000000000000000000000000E17",
  zodiacSign: "Virgo",
};

const randomness = {
  callbackTransactionHash: "0x0000000000000000000000000000000000000000000000000000000000042012",
  fulfilledAt: "2026-05-16 18:12 UTC",
  provider: "Chainlink VRF mock",
  requestId: "req-demo-2026-05-16-042",
  requestedAt: "2026-05-16 18:10 UTC",
  words: {
    celestial: "0x10",
    terrestrial: "0x04",
  },
};

const lifecycleStages: LifecycleStage[] = [
  {
    id: "entry-open",
    label: "Opened",
    detail: "Test draw announced for reviewer validation.",
    evidenceLabel: "Draw ID",
    evidenceValue: demoDraw.drawId,
    eventName: "draw.opened",
    timestamp: "2026-05-16 18:00 UTC",
  },
  {
    id: "test-entry-placed",
    label: "Test Entry",
    detail: "Reviewer sample entry is accepted into the mock entry set.",
    evidenceLabel: "Entry ID",
    evidenceValue: testEntry.entryId,
    eventName: "test.entry.accepted",
    timestamp: testEntry.placedAt,
  },
  {
    id: "entries-locked",
    label: "Locked",
    detail: "Entry list is frozen before randomness is requested.",
    evidenceLabel: "Entry root",
    evidenceValue: demoDraw.entryRoot,
    eventName: "entries.locked",
    timestamp: "2026-05-16 18:05 UTC",
  },
  {
    id: "randomness-requested",
    label: "Requested",
    detail: "Mock Chainlink VRF request reference is prepared.",
    evidenceLabel: "Request ID",
    evidenceValue: randomness.requestId,
    eventName: "randomness.requested",
    timestamp: randomness.requestedAt,
  },
  {
    id: "randomness-fulfilled",
    label: "Fulfilled",
    detail: "Mock randomness words are captured for deterministic mapping.",
    evidenceLabel: "Callback transaction",
    evidenceValue: randomness.callbackTransactionHash,
    eventName: "randomness.fulfilled",
    timestamp: randomness.fulfilledAt,
  },
  {
    id: "results-derived",
    label: "Derived",
    detail: "Results are mapped from the mock randomness words.",
    evidenceLabel: "Result digest",
    evidenceValue: demoDraw.resultDigest,
    eventName: "results.derived",
    timestamp: "2026-05-16 18:13 UTC",
  },
  {
    id: "evidence-published",
    label: "Published",
    detail: "Evidence is available for reviewer checks.",
    evidenceLabel: "Evidence event",
    evidenceValue: "evt-demo-042-evidence-published",
    eventName: "evidence.published",
    timestamp: "2026-05-16 18:15 UTC",
  },
];

const evidenceRows = [
  { label: "Chain", value: demoDraw.network },
  { label: "Draw ID", value: demoDraw.drawId },
  { label: "Draw contract", value: demoDraw.contractAddress },
  { label: "Entry ID", value: testEntry.entryId },
  { label: "Entry hash", value: testEntry.entryHash },
  { label: "Entry root", value: demoDraw.entryRoot },
  { label: "VRF request", value: randomness.requestId },
  { label: "Callback transaction", value: randomness.callbackTransactionHash },
  { label: "Result digest", value: demoDraw.resultDigest },
];

const fairnessEvidencePath = [
  {
    detail: "Draw metadata and entry window are visible before any randomness is requested.",
    evidenceLabel: "Draw contract",
    evidenceValue: demoDraw.contractAddress,
    icon: Activity,
    stageId: "entry-open",
    title: "Draw opened",
  },
  {
    detail: "Reviewer sample entry creates the accepted hash that becomes part of the entry root.",
    evidenceLabel: "Entry hash",
    evidenceValue: testEntry.entryHash,
    icon: TicketCheck,
    stageId: "test-entry-placed",
    title: "Test entry accepted",
  },
  {
    detail: "Accepted entries are frozen into a deterministic root before the request event.",
    evidenceLabel: "Entry root",
    evidenceValue: demoDraw.entryRoot,
    icon: LockKeyhole,
    stageId: "entries-locked",
    title: "Entries locked",
  },
  {
    detail: "The randomness request reference becomes the anchor for the future VRF transaction.",
    evidenceLabel: "Request ID",
    evidenceValue: randomness.requestId,
    icon: KeyRound,
    stageId: "randomness-requested",
    title: "Randomness requested",
  },
  {
    detail: "Fulfillment captures callback transaction and the mock random words used by the demo.",
    evidenceLabel: "Callback transaction",
    evidenceValue: randomness.callbackTransactionHash,
    icon: Fingerprint,
    stageId: "randomness-fulfilled",
    title: "Randomness fulfilled",
  },
  {
    detail: "Mock random words are mapped through the deterministic derivation rules.",
    evidenceLabel: "Derived output",
    evidenceValue: `${demoDraw.terrestrialResult} / ${demoDraw.celestialResult}`,
    icon: ListChecks,
    stageId: "results-derived",
    title: "Results derived",
  },
  {
    detail:
      "The published digest ties draw ID, entry root, request reference, and results together.",
    evidenceLabel: "Result digest",
    evidenceValue: demoDraw.resultDigest,
    icon: ShieldCheck,
    stageId: "evidence-published",
    title: "Evidence published",
  },
] satisfies Array<{
  detail: string;
  evidenceLabel: string;
  evidenceValue: string;
  icon: LucideIcon;
  stageId: LifecycleStageId;
  title: string;
}>;

const randomnessReferences = [
  { label: "Provider", value: randomness.provider },
  { label: "Request ID", value: randomness.requestId },
  { label: "Requested at", value: randomness.requestedAt },
  { label: "Fulfilled at", value: randomness.fulfilledAt },
  { label: "Callback transaction", value: randomness.callbackTransactionHash },
  { label: "Seed digest", value: demoDraw.seedDigest },
  { label: "Terrestrial word", value: randomness.words.terrestrial },
  { label: "Celestial word", value: randomness.words.celestial },
];

const derivationWalkthrough = [
  {
    label: "Freeze accepted entries",
    result: demoDraw.entryRoot,
    step: "01",
    working: "entryRoot = hash(sorted accepted mock entries)",
  },
  {
    label: "Bind request to seed",
    result: `${randomness.requestId} + ${demoDraw.seedDigest}`,
    step: "02",
    working: "seed = request reference + fulfilled random words",
  },
  {
    label: "Map terrestrial output",
    result: demoDraw.terrestrialResult,
    step: "03",
    working: `${randomness.words.terrestrial} maps to ${demoDraw.terrestrialResult}`,
  },
  {
    label: "Map celestial output",
    result: demoDraw.celestialResult,
    step: "04",
    working: `${randomness.words.celestial} maps to ${demoDraw.celestialResult}`,
  },
  {
    label: "Publish digest",
    result: demoDraw.resultDigest,
    step: "05",
    working: "digest = hash(drawId + entryRoot + requestId + derived results)",
  },
];

const explorerPlaceholders = [
  {
    label: "Draw contract",
    target: demoDraw.contractAddress,
    type: "Polygon Amoy address",
  },
  {
    label: "Request transaction",
    target: "0x0000000000000000000000000000000000000000000000000000000000042006",
    type: "Polygon Amoy transaction",
  },
  {
    label: "Callback transaction",
    target: randomness.callbackTransactionHash,
    type: "Polygon Amoy transaction",
  },
  {
    label: "Published evidence",
    target: "evt-demo-042-evidence-published",
    type: "Future explorer event anchor",
  },
];

const protectionSummary = [
  {
    detail: "Entry root is recorded before randomness can influence the accepted entry set.",
    label: "Pre-request entry lock",
  },
  {
    detail: "Request ID and callback transaction are displayed as separate evidence points.",
    label: "Request and fulfillment split",
  },
  {
    detail: "Result digest can be recomputed from public mock inputs during the demo.",
    label: "Deterministic recomputation",
  },
];

const screenComponents: Record<ScreenId, ScreenComponent> = {
  "active-draw": ActiveDrawScreen,
  "test-entry": TestEntryScreen,
  lifecycle: LifecycleScreen,
  results: ResultsScreen,
  "fairness-dashboard": FairnessDashboardScreen,
};

function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>("active-draw");
  const [currentStageId, setCurrentStageId] = useState<LifecycleStageId>("entry-open");
  const activeMeta = screenMeta[activeScreen];
  const ActiveScreen = screenComponents[activeScreen];

  const currentStageIndex = useMemo(
    () => lifecycleStages.findIndex((stage) => stage.id === currentStageId),
    [currentStageId],
  );
  const currentStage = lifecycleStages[currentStageIndex] ?? lifecycleStages[0]!;

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
            Testnet MVP demo only. Polygon Amoy mock data for reviewer validation. No public
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
            Testnet visible
          </div>
        </header>

        <ActiveScreen
          currentStage={currentStage}
          currentStageIndex={currentStageIndex}
          isStageVisible={isStageVisible}
          onAdvance={handleAdvance}
          onReset={handleReset}
          onStageSelect={setCurrentStageId}
        />
      </main>
    </div>
  );
}

function ActiveDrawScreen({ currentStage, currentStageIndex, onAdvance, onReset }: ScreenProps) {
  const progressLabel = `${currentStageIndex + 1} of ${lifecycleStages.length}`;
  const isFinalStage = currentStageIndex === lifecycleStages.length - 1;

  const drawMetrics = [
    { label: "Draw ID", value: demoDraw.drawId },
    { label: "Network", value: demoDraw.network },
    { label: "Entries", value: `${demoDraw.entriesCount} / ${demoDraw.maxEntries} mock` },
    { label: "Current state", value: currentStage.label },
  ];

  return (
    <section className="screen-grid">
      <div className="panel wide">
        <div className="panel-heading">
          <div>
            <p>Current draw</p>
            <h2>{demoDraw.title}</h2>
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
          <strong>{currentStageIndex >= 1 ? "Entry visible" : "Awaiting reviewer step"}</strong>
          <span>Lock policy</span>
          <strong>{currentStageIndex >= 2 ? "Entry root published" : "Open in demo"}</strong>
          <span>Randomness</span>
          <strong>
            {currentStageIndex >= 4 ? "Mock words fulfilled" : "Pending request path"}
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

function TestEntryScreen({ currentStageIndex, isStageVisible, onAdvance }: ScreenProps) {
  const entryVisible = isStageVisible("test-entry-placed");

  return (
    <section className="screen-grid">
      <div className="panel wide">
        <div className="panel-heading">
          <div>
            <p>Sample entry</p>
            <h2>Test entry simulation</h2>
          </div>
          <span className={entryVisible ? "state-tag open" : "state-tag muted"}>
            {entryVisible ? "Accepted" : "Ready"}
          </span>
        </div>
        <div className="ticket-preview">
          <div>
            <span>Entry label</span>
            <strong>{testEntry.label}</strong>
          </div>
          <div>
            <span>Numbers</span>
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
          This is a frontend-only reviewer interaction. It places no live transaction and only
          advances the mock lifecycle shown in this workspace.
        </p>
        {currentStageIndex === 0 ? (
          <button className="secondary-action" onClick={onAdvance} type="button">
            <ArrowRight size={17} />
            Place test entry
          </button>
        ) : (
          <div className="success-callout">
            <CheckCircle2 size={18} />
            Entry accepted at {testEntry.placedAt}
          </div>
        )}
      </div>
    </section>
  );
}

function LifecycleScreen({ currentStageIndex, onStageSelect }: ScreenProps) {
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

function ResultsScreen({ isStageVisible }: ScreenProps) {
  const resultsVisible = isStageVisible("results-derived");

  return (
    <section className="screen-grid">
      <div className="panel">
        <div className="panel-heading compact">
          <ListChecks size={20} />
          <h2>Terrestrial Result</h2>
        </div>
        <div className="result-callout">
          <span>{resultsVisible ? "Mock draw output" : "Awaiting derivation"}</span>
          <strong>{resultsVisible ? demoDraw.terrestrialResult : "Pending"}</strong>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading compact">
          <Activity size={20} />
          <h2>Celestial Result</h2>
        </div>
        <div className="result-callout accent">
          <span>{resultsVisible ? "Deterministic mapping" : "Awaiting randomness"}</span>
          <strong>{resultsVisible ? demoDraw.celestialResult : "Pending"}</strong>
        </div>
      </div>

      <div className="panel wide">
        <div className="panel-heading">
          <div>
            <p>Derivation notes</p>
            <h2>Traceable mapping</h2>
          </div>
          <span className="state-tag muted">Demo data</span>
        </div>
        <div className="derivation-grid">
          <div>
            <span>Source</span>
            <strong>mock-result-derivation</strong>
          </div>
          <div>
            <span>Request ID</span>
            <strong>{randomness.requestId}</strong>
          </div>
          <div>
            <span>Terrestrial word</span>
            <strong>{randomness.words.terrestrial}</strong>
          </div>
          <div>
            <span>Celestial word</span>
            <strong>{randomness.words.celestial}</strong>
          </div>
          <div>
            <span>Result digest</span>
            <strong>{demoDraw.resultDigest}</strong>
          </div>
          <div>
            <span>Derived at</span>
            <strong>2026-05-16 18:13 UTC</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

function FairnessDashboardScreen({
  currentStage,
  currentStageIndex,
  isStageVisible,
  onStageSelect,
}: ScreenProps) {
  const evidenceVisible = isStageVisible("evidence-published");
  const publishedStageIndex = lifecycleStages.findIndex(
    (stage) => stage.id === "evidence-published",
  );
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
            {evidenceVisible ? "Published" : "Pending"}
          </span>
        </div>
        <p className="body-copy wide-copy">
          Fairness is verified by following the draw from an immutable entry snapshot, through the
          randomness request and fulfillment, into a deterministic result digest. These mock values
          are shaped like the future testnet evidence so the demo can swap sources without changing
          the reviewer workflow.
        </p>
        <div className="fairness-overview-grid">
          <div>
            <span>Draw ID</span>
            <strong>{demoDraw.drawId}</strong>
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
            onClick={() => onStageSelect("evidence-published")}
            type="button"
          >
            <ArrowRight size={17} />
            Show published evidence
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
              currentStageIndex >= publishedStageIndex ? "state-tag open" : "state-tag muted"
            }
          >
            {currentStageIndex >= publishedStageIndex ? "Digest ready" : "Mock preview"}
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
            <strong>frontend static evidence model</strong>
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

export default App;
