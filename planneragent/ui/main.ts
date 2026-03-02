// planneragent/ui/main.ts

import { getUiState } from "./state/uiState";

import {
  classifyDataset,
  type DatasetDescriptor,
} from "../core/datasets/datasetClassifier";

import { getSession } from "./auth/AuthProvider";
import { resolveRoleFromSession } from "./auth/RoleResolver";

function render() {
  const el = document.getElementById("app");
  if (!el) return;

  // ---- MOCK TEMP (finché non colleghiamo input reali) ----
  const dataset: DatasetDescriptor = {
    hasSnapshot: true,
    hasBehavioralEvents: false,
    hasStructuralData: false,
  };

  const awareness = classifyDataset(dataset); // -> { level, evidence }
  const ui = getUiState("VISION", awareness.level);

  const session = getSession();
  const role = resolveRoleFromSession(session);

  el.innerHTML = `
    <div style="
      font-family: system-ui;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0e0e11;
      color: #eaeaf0;
    ">
      <div style="text-align:center; line-height: 1.4">
        <h1 style="margin:0 0 12px 0;">PlannerAgent</h1>

        <p style="margin:0;">
          <strong>Mode:</strong> ${ui.authority.title}
        </p>
        <p style="margin:6px 0 14px 0; opacity: .9;">
          ${ui.authority.subtitle}
        </p>

        <p style="margin:0; opacity:.85;">
          <strong>Data awareness:</strong> ${ui.dataAwareness.label}
        </p>

        <p style="margin:10px 0 0 0; opacity:.75;">
          <strong>Role:</strong> ${role}
        </p>
      </div>
    </div>
  `;
}

render();