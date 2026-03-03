// planneragent/ui/main.ts
// =====================================================
// PlannerAgent UI — Control Interface
// Canonical Source of Truth
// =====================================================

import "./styles.css";

import { getUiState } from "./state/uiState";
import { getSession } from "./auth/AuthProvider";

import type { DataAwarenessLevel } from "../core/datasets/datasetClassifier";
import type { PlanState } from "../core/signals/planState";
import type { RealityState } from "../core/signals/realityState";
import type { DecisionPressureState } from "../core/signals/decisionPressureState";

type SandboxSignals = {
  data_awareness?: "SNAPSHOT" | "BEHAVIORAL" | "STRUCTURAL";
  plan?: "COHERENT" | "SOME_GAPS" | "INCOHERENT";
  reality?: "ALIGNED" | "DRIFTING" | "MISALIGNED";
  decision_pressure?: "LOW" | "MEDIUM" | "HIGH";
};

type SandboxResponse = {
  ok: boolean;
  plan: "VISION" | "JUNIOR" | "SENIOR" | "PRINCIPAL";
  signals?: SandboxSignals;
};

async function fetchSandbox(): Promise<SandboxResponse> {

  const res = await fetch("/sandbox", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company_id: "demo",
      request_id: crypto.randomUUID(),
      plan: "VISION",
      intent: "INFORM",
      domain: "supply_chain",
      actor_id: "anonymous",
      baseline_snapshot_id: "baseline-1",
      baseline_metrics: {
        demand: 800,
        stock: 600,
        supplier_dependency: 0.5
      },
      dataset_descriptor: {
        hasSnapshot: true,
        hasBehavioralEvents: false,
        hasStructuralData: false
      }
    })
  });

  return res.json();
}


// -----------------------------------------------------
// TYPE MAPPERS
// -----------------------------------------------------

function mapDataAwareness(v?: string): DataAwarenessLevel | undefined {
  if (v === "SNAPSHOT") return "SNAPSHOT";
  if (v === "BEHAVIORAL") return "BEHAVIORAL";
  if (v === "STRUCTURAL") return "STRUCTURAL";
  return undefined;
}

function mapPlan(v?: string): PlanState | undefined {
  if (v === "COHERENT") return "COHERENT";
  if (v === "SOME_GAPS") return "SOME_GAPS";
  if (v === "INCOHERENT") return "INCOHERENT";
  return undefined;
}

function mapReality(v?: string): RealityState | undefined {
  if (v === "ALIGNED") return "ALIGNED";
  if (v === "DRIFTING") return "DRIFTING";
  if (v === "MISALIGNED") return "MISALIGNED";
  return undefined;
}

function mapPressure(v?: string): DecisionPressureState | undefined {
  if (v === "LOW") return "LOW";
  if (v === "MEDIUM") return "MEDIUM";
  if (v === "HIGH") return "HIGH";
  return undefined;
}


// -----------------------------------------------------
// RENDER HELPERS
// -----------------------------------------------------

function renderOption(label: string, active?: string) {

  const cls = label === active
    ? "option active"
    : "option";

  return `<span class="${cls}">${label}</span>`;
}

function renderSignal(label: string, active?: string) {

  const cls = label === active
    ? "signal active"
    : "signal";

  return `<div class="${cls}">${label}</div>`;
}


// -----------------------------------------------------
// MAIN RENDER
// -----------------------------------------------------

async function render() {

  const el = document.getElementById("app");
  if (!el) return;

  // session used only to check login state
  const session = getSession();

  const response = await fetchSandbox();

  if (!response.ok) {

    el.innerHTML = `<div style="color:red">Sandbox error</div>`;
    return;
  }

  const s = response.signals ?? {};

  const signalState = {
    data_awareness: mapDataAwareness(s.data_awareness),
    plan: mapPlan(s.plan),
    reality: mapReality(s.reality),
    decision_pressure: mapPressure(s.decision_pressure)
  };

  const ui = getUiState(
    response.plan,
    signalState
  );

  el.innerHTML = `
  <div class="panel">

    <div class="topbar">
      <div class="faq">FAQ</div>
      <div class="userid">ID</div>
    </div>

    <div class="title">
      PLANNER AGENT
    </div>

    <div class="subtitle">
      AI OPERATIONAL GOVERNANCE
    </div>

    <div class="tagline">
      KEEP REALITY ALIGNED WITH PLAN. GET ADVICE. KEEP AI UNDER CONTROL.
    </div>

    <div class="section">

      <div class="section-title">
        DATA AWARENESS
      </div>

      ${renderOption("SNAPSHOT", signalState.data_awareness)}
      ${renderOption("BEHAVIORAL", signalState.data_awareness)}
      ${renderOption("STRUCTURAL", signalState.data_awareness)}

    </div>

    <div class="plan-reality">

      <div class="column">

        <div class="section-title">
          PLAN
        </div>

        ${renderSignal("COHERENT", signalState.plan)}
        ${renderSignal("SOME_GAPS", signalState.plan)}
        ${renderSignal("INCOHERENT", signalState.plan)}

      </div>

      <div class="pressure">

        ${renderSignal("HIGH", signalState.decision_pressure)}
        ${renderSignal("MEDIUM", signalState.decision_pressure)}
        ${renderSignal("LOW", signalState.decision_pressure)}

        <div class="section-title">
          DECISION PRESSURE
        </div>

      </div>

      <div class="column">

        <div class="section-title">
          REALITY
        </div>

        ${renderSignal("ALIGNED", signalState.reality)}
        ${renderSignal("DRIFTING", signalState.reality)}
        ${renderSignal("MISALIGNED", signalState.reality)}

      </div>

    </div>

    <div class="mode">
      Mode: ${ui.authority.title}
    </div>

    <div class="mode-sub">
      ${ui.authority.subtitle}
    </div>

  </div>
  `;
}

render();