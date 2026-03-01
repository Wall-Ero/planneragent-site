// planneragent/ui/main.ts
// ======================================================
// P8 — UI ENTRY POINT
// Renders UI state only (no Core, no authority creation)
// ======================================================

import { getUiState } from "./state/uiState";

function render() {
  const el = document.getElementById("app");
  if (!el) return;

  // 🔹 For now: hard-coded visual mode (P8)
  // Later this will come from sessionState / RoleResolver
  const ui = getUiState("VISION");

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
      <div style="text-align:center; max-width: 420px;">
        <h1 style="margin-bottom: 12px;">PlannerAgent</h1>

        <p style="font-size: 16px; margin: 0;">
          <strong>Mode:</strong> ${ui.authority.title}
        </p>

        <p style="opacity: 0.8; margin-top: 6px;">
          ${ui.authority.subtitle}
        </p>
      </div>
    </div>
  `;
}

render();