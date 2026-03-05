import { renderSignals } from "./cockpitSignals.js";
import { renderChatWindow } from "../chat/ChatWindow.js";

export function renderCockpit(contentEl, state){
  contentEl.innerHTML = `
    <div class="inner headerRow">
      <div class="headerBlock">
        <div class="headerTop">
          <div>FAQ</div>
          <div>ID</div>
        </div>
        <div class="brand">PLANNER AGENT</div>
        <div class="subbrand">AI OPERATIONAL GOVERNANCE</div>
        <div class="tagline">KEEP REALITY ALIGNED WITH PLAN, GET ADVICE, KEEP AI UNDER CONTROL.</div>
      </div>
    </div>

    <div class="inner dataRow">
      <div class="sectionTitle">DATA AWARENESS</div>
      <div class="tabs" id="dataTabs"></div>
    </div>

    <div class="inner planRow">
      <div class="prGrid">
        <div>
          <div class="prBlockTitle">PLAN</div>
          <div class="signalList" id="planSignals"></div>
        </div>

        <div class="centerPressure">
          <div style="height:11px"></div>
          <div class="pressureLevels" id="pressureSignals"></div>
        </div>

        <div>
          <div class="prBlockTitle">REALITY</div>
          <div class="signalList" id="realitySignals"></div>
        </div>
      </div>
    </div>

    <div class="inner pressureRow">
      <div class="dpTitle">DECISION PRESSURE</div>
    </div>

    <div class="inner chatRow chatArea" id="chatMount"></div>

    <div class="inner statusRow statusStrip">
      <div class="pill">
        <span class="k">Mode:</span> <strong>VISION</strong>.
        <span class="k">Observation only.</span>
        <span class="k">No execution.</span>
        &nbsp;|&nbsp;
        <span class="k">Data:</span> <span class="v">${state.dataActive ? "Active" : "None"}</span>
      </div>
    </div>

    <div class="inner bottomRow"></div>
  `;

  renderSignals(contentEl, state);
  renderChatWindow(contentEl.querySelector("#chatMount"), state);
}
