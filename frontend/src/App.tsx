import { useState, type ReactElement } from "react";
import {
  Activity,
  BadgeCheck,
  ChartNetwork,
  FlaskConical,
  Gauge,
  ListChecks,
  Network,
  ShieldCheck,
  TicketCheck,
  type LucideIcon,
} from "lucide-react";

type ScreenId = "active-draw" | "test-entry" | "lifecycle" | "results" | "fairness-dashboard";

type ScreenMeta = {
  id: ScreenId;
  label: string;
  kicker: string;
  title: string;
  icon: LucideIcon;
};

type ScreenComponent = () => ReactElement;

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

const drawMetrics = [
  { label: "Draw ID", value: "AMOY-DEMO-042" },
  { label: "Network", value: "Polygon Amoy" },
  { label: "Entries", value: "128 mock" },
  { label: "State", value: "Entry window open" },
];

const lifecycleSteps = [
  { label: "Opened", detail: "Test draw announced", state: "complete" },
  { label: "Locked", detail: "Entries fixed before randomness", state: "queued" },
  { label: "Requested", detail: "VRF request reference prepared", state: "queued" },
  { label: "Fulfilled", detail: "Randomness delivered to demo flow", state: "queued" },
  { label: "Derived", detail: "Results mapped deterministically", state: "queued" },
  { label: "Published", detail: "Evidence shown for reviewer checks", state: "queued" },
];

const evidenceRows = [
  { label: "Chain", value: "Polygon Amoy Testnet" },
  { label: "Draw contract", value: "0xAmoyDemo0000000000000000000000000042" },
  { label: "VRF request", value: "req-demo-2026-05-16-042" },
  { label: "Entry root", value: "0x7c1e...a90d" },
  { label: "Result digest", value: "0xf3a8...22c1" },
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
  const activeMeta = screenMeta[activeScreen];
  const ActiveScreen = screenComponents[activeScreen];

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
            Testnet MVP demo only. Uses Polygon Amoy mock data for reviewer validation, not public
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

        <ActiveScreen />
      </main>
    </div>
  );
}

function ActiveDrawScreen() {
  return (
    <section className="screen-grid">
      <div className="panel wide">
        <div className="panel-heading">
          <div>
            <p>Current draw</p>
            <h2>Reviewer test draw</h2>
          </div>
          <span className="state-tag open">Open</span>
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

      <div className="panel">
        <div className="panel-heading compact">
          <Gauge size={20} />
          <h2>Readiness</h2>
        </div>
        <div className="readiness-list">
          <span>Entry capture</span>
          <strong>Mock data loaded</strong>
          <span>Lock policy</span>
          <strong>Pending test close</strong>
          <span>Evidence view</span>
          <strong>Dashboard placeholder</strong>
        </div>
      </div>
    </section>
  );
}

function TestEntryScreen() {
  return (
    <section className="screen-grid">
      <div className="panel wide">
        <div className="panel-heading">
          <div>
            <p>Sample entry</p>
            <h2>Test ticket preview</h2>
          </div>
          <span className="state-tag muted">Static</span>
        </div>
        <div className="ticket-preview">
          <div>
            <span>Entry label</span>
            <strong>Reviewer Ticket A-17</strong>
          </div>
          <div>
            <span>Numbers</span>
            <strong>04 11 16 23 35</strong>
          </div>
          <div>
            <span>Zodiac sign</span>
            <strong>Virgo</strong>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading compact">
          <TicketCheck size={20} />
          <h2>Entry State</h2>
        </div>
        <p className="body-copy">
          Entry creation is not connected in this demo state. This screen shows the static review
          state that later connects to the demo data API.
        </p>
      </div>
    </section>
  );
}

function LifecycleScreen() {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p>Draw state</p>
          <h2>Verification timeline</h2>
        </div>
        <span className="state-tag muted">Placeholder</span>
      </div>
      <ol className="timeline">
        {lifecycleSteps.map((step, index) => (
          <li className="timeline-step" data-state={step.state} key={step.label}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <strong>{step.label}</strong>
              <p>{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ResultsScreen() {
  return (
    <section className="screen-grid">
      <div className="panel">
        <div className="panel-heading compact">
          <ListChecks size={20} />
          <h2>Terrestrial Result</h2>
        </div>
        <div className="result-callout">
          <span>Mock draw output</span>
          <strong>04, 11, 16, 23, 35</strong>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading compact">
          <Activity size={20} />
          <h2>Celestial Result</h2>
        </div>
        <div className="result-callout accent">
          <span>Deterministic mapping</span>
          <strong>Virgo Ascendant</strong>
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
        <p className="body-copy">
          Result derivation will display the locked entry set, randomness reference, deterministic
          mapping rule, and final digest once the demo data contracts are connected.
        </p>
      </div>
    </section>
  );
}

function FairnessDashboardScreen() {
  return (
    <section className="screen-grid">
      <div className="panel wide">
        <div className="panel-heading">
          <div>
            <p>Evidence</p>
            <h2>Reviewer verification</h2>
          </div>
          <span className="state-tag open">Testnet</span>
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

      <div className="panel">
        <div className="panel-heading compact">
          <ShieldCheck size={20} />
          <h2>Checks</h2>
        </div>
        <ul className="check-list">
          <li>Entries locked before randomness</li>
          <li>Request reference visible</li>
          <li>Digest matches displayed result</li>
        </ul>
      </div>
    </section>
  );
}

export default App;
