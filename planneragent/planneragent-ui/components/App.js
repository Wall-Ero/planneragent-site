import { getInitialUiState, setModeNoData, setModeDemo } from "../state/uiState.js";
import { renderCockpit } from "./cockpit/cockpitLayout.js";

export function mountApp(rootEl){
  const state = getInitialUiState();

  rootEl.innerHTML = `
    <div class="cockpit" id="cockpit">
      <div class="layer frame"></div>
      <div class="layer header"></div>
      <div class="layer data"></div>
      <div class="layer plan"></div>
      <div class="layer pressure"></div>
      <div class="layer chatframe"></div>
      <div class="layer statusframe"></div>
      <div class="content" id="content"></div>
    </div>
  `;

  const cockpitEl = rootEl.querySelector("#cockpit");
  const contentEl = rootEl.querySelector("#content");

  // initial render
  renderCockpit(contentEl, state);

  // wire global buttons if present
  const noDataBtn = document.getElementById("noDataBtn");
  const demoBtn = document.getElementById("demoBtn");
  const expandBtn = document.getElementById("expandBtn");

  if (noDataBtn) noDataBtn.addEventListener("click", () => {
    setModeNoData(state);
    renderCockpit(contentEl, state);
  });

  if (demoBtn) demoBtn.addEventListener("click", () => {
    setModeDemo(state);
    renderCockpit(contentEl, state);
  });

  if (expandBtn) expandBtn.addEventListener("click", () => {
    cockpitEl.classList.toggle("chat-expanded");
  });
}
