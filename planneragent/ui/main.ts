// planneragent/ui/main.ts
// =====================================================
// PlannerAgent UI — Cockpit Interface
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
  operational_cockpit_snapshot?: {
    signals?: {
      operational_availability?: {
        status: "CURRENT_GOVERNED" | "PARTIALLY_UNRESOLVED";
        breakdown: Array<{ kind: "EFFECTIVE_INVENTORY" | "GOVERNED_FUTURE_SUPPLY" | "PLANNED_PRODUCTION"; quantity: number; unit: "EA" }>;
        planned_production: Array<{ item_ref: string; planned_quantity: number; feasible_quantity: number; available_at: string; feasibility: "FEASIBLE" | "PARTIALLY_FEASIBLE" | "ZERO_FEASIBLE" | "UNRESOLVED" }>;
      };
    };
  };
};

// -----------------------------------------------------
// SANDBOX REQUEST
// -----------------------------------------------------

async function fetchSandbox(): Promise<SandboxResponse> {

  try {

    const res = await fetch("/sandbox", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

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

    return await res.json();

  } catch (e) {

    // fallback mock se sandbox non esiste ancora
    return {

      ok: true,

      plan: "VISION",

      signals: {

        data_awareness: "SNAPSHOT",
        plan: "COHERENT",
        reality: "ALIGNED",
        decision_pressure: "MEDIUM"

      }

    };

  }

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

function availabilityLabel(kind: string): string {
  if (kind === "EFFECTIVE_INVENTORY") return "Effective inventory";
  if (kind === "GOVERNED_FUTURE_SUPPLY") return "Governed future supply";
  return "Planned production";
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

function renderOperationalAvailability(response: SandboxResponse): string {
  const availability = response.operational_cockpit_snapshot?.signals?.operational_availability;
  if (!availability) return "";
  const rows = availability.breakdown.map(row => `<div class="availability-row"><span>${availabilityLabel(row.kind)}</span><strong>${row.quantity} ${row.unit}</strong></div>`).join("");
  const production = availability.planned_production.map(row => `<div class="production-row"><span>${escapeHtml(row.item_ref.replace("operations-item:", ""))}</span><span>${row.feasible_quantity}/${row.planned_quantity} EA · ${row.feasibility.replaceAll("_", " ")} · ${escapeHtml(new Date(row.available_at).toLocaleString())}</span></div>`).join("");
  return `<div class="availability-panel"><div class="section-title">CURRENT OPERATIONAL AVAILABILITY</div><div class="availability-state">${availability.status === "CURRENT_GOVERNED" ? "Current governed" : "Partially unresolved"}</div>${rows}${production}</div>`;
}

// -----------------------------------------------------
// MAIN RENDER
// -----------------------------------------------------

async function render() {

  const el = document.getElementById("app");

  if (!el) return;

  getSession();

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

  const ui = getUiState(response.plan);

  el.innerHTML = `

  <div class="panel">

    <div class="topbar">
      <div>FAQ</div>
      <div>ID</div>
    </div>

    <div class="title">PLANNER AGENT</div>

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

      <div class="options">

        ${renderOption("SNAPSHOT", signalState.data_awareness)}
        ${renderOption("BEHAVIORAL", signalState.data_awareness)}
        ${renderOption("STRUCTURAL", signalState.data_awareness)}

      </div>

    </div>


    <div class="cockpit">

      <div class="cockpit-frame></div>

      <div class="triptych">

        <div class="column">

          <div class="column-title">PLAN</div>

          ${renderSignal("COHERENT", signalState.plan)}
          ${renderSignal("SOME_GAPS", signalState.plan)}
          ${renderSignal("INCOHERENT", signalState.plan)}

        </div>


        <div class="pressure">

          ${renderSignal("HIGH", signalState.decision_pressure)}
          ${renderSignal("MEDIUM", signalState.decision_pressure)}
          ${renderSignal("LOW", signalState.decision_pressure)}

          <div class="decision-label">
            DECISION PRESSURE
          </div>

        </div>


        <div class="column">

          <div class="column-title">REALITY</div>

          ${renderSignal("ALIGNED", signalState.reality)}
          ${renderSignal("DRIFTING", signalState.reality)}
          ${renderSignal("MISALIGNED", signalState.reality)}

        </div>

      </div>

    </div>

    ${renderOperationalAvailability(response)}


    <div class="chat">

      <div class="chatbox">

        <div class="chatprompt">
          State your role and show me the plan
        </div>

        <div class="chatinput">
          + Type here...
        </div>

      </div>

    </div>


    <div class="mode">
      Mode: ${ui.authority.title}
    </div>

    <div class="mode-sub">
      ${ui.authority.subtitle}
    </div>


    <div class="footer">

      Terms of Use · Privacy Policy · © 2026 PlannerAgent. All rights reserved.

      <br/>

      The visual design, interface layout, texts, and interaction patterns
      of this website are protected by copyright law.

    </div>

  </div>

  `;

}

render();
