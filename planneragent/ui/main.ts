import "./styles.css";
import { getSession } from "./auth/AuthProvider";
import { resolveRoleFromSession } from "./auth/RoleResolver";
import { appConfig } from "./app/app.config";
import { createCockpitPresentation, type CockpitTransportResponse } from "./cockpit.presentation";
import {
  renderActivityBarFrame,
  renderChatInputFrame,
  renderChatMessageFrame,
  renderDataAwarenessFrame,
  renderDecisionPressureFrame,
  renderMicrophone,
  renderPlanFrame,
  renderRealityFrame,
} from "./presentation/cockpit.frames";
import { renderCognitionContour, renderLateralChassis } from "./presentation/cockpit.decorations";
import { setupCockpitViewport } from "./presentation/cockpit.viewport";

const signal=(value:string,active?:string)=>`<span class="signal${value===active?" is-active":""}" data-state="${value===active?"active":"neutral"}" aria-current="${value===active?"true":"false"}">${value}</span>`;

async function currentCockpit():Promise<CockpitTransportResponse|undefined>{try{const session=getSession(),response=await fetch("/sandbox",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({request_id:crypto.randomUUID(),plan:appConfig.defaultMode,intent:"INFORM",domain:"operations",actor_id:session.user_id??"anonymous"})});if(!response.ok)return undefined;return await response.json() as CockpitTransportResponse}catch{return undefined}}

async function bootstrap(){const root=document.querySelector<HTMLElement>("#app");if(!root)return;const session=getSession(),role=resolveRoleFromSession(session),presentation=createCockpitPresentation(await currentCockpit());
 root.innerHTML=`<div class="cockpit-viewport" data-fit-mode="fit"><div class="cockpit-instrument"><main class="cockpit-shell" data-status="${presentation.available?"available":"waiting"}">
  ${renderLateralChassis()}
  <header class="header"><button class="text-control" type="button">FAQ</button><h1>PLANNERAGENT</h1><button class="text-control" type="button" aria-label="Identity (${role})">ID</button></header>
  <section class="activity" aria-label="PlannerAgent activity: ${presentation.activity}">${renderActivityBarFrame()}<div class="activity-idle-track"><i class="activity-idle-gap"></i></div></section>
  <section class="data-awareness" aria-labelledby="data-title">${renderDataAwarenessFrame()}<h2 id="data-title">DATA AWARENESS</h2><div class="horizontal-signals">${signal("SNAPSHOT",presentation.dataAwareness)}${signal("BEHAVIORAL",presentation.dataAwareness)}${signal("STRUCTURAL",presentation.dataAwareness)}</div></section>
  <section class="cognition" aria-label="Operational cockpit signals">
   ${renderCognitionContour()}
   <article class="signal-panel plan-panel">${renderPlanFrame()}<h2>PLAN</h2><div class="vertical-signals">${signal("VALID",presentation.plan)}${signal("MISSING",presentation.plan)}${signal("BROKEN",presentation.plan)}</div></article>
   <article class="signal-panel pressure-panel">${renderDecisionPressureFrame()}<div class="vertical-signals">${signal("HIGH",presentation.pressure)}${signal("MEDIUM",presentation.pressure)}${signal("LOW",presentation.pressure)}</div><h2>DECISION PRESSURE</h2></article>
   <article class="signal-panel reality-panel">${renderRealityFrame()}<h2>REALITY</h2><div class="vertical-signals">${signal("STABLE",presentation.reality)}${signal("SHIFTING",presentation.reality)}${signal("UNSTABLE",presentation.reality)}</div></article>
  </section>
  <section class="conversation" aria-label="Conversation">${renderChatMessageFrame()}<div class="conversation-content"><p>State your role and show me operations.</p><p>I will reveal if reality respects the plan.</p></div></section>
  <form class="composer" data-chat-state="empty">${renderChatInputFrame()}<button type="button" class="composer-button add" aria-label="Attach data">+</button><label class="sr-only" for="message">Message PlannerAgent</label><input id="message" name="message" autocomplete="off" placeholder="Type here..."><button type="button" class="composer-button microphone" aria-label="Microphone">${renderMicrophone()}</button><button type="button" class="composer-button composer-action" hidden></button></form>
  <section class="governance" aria-labelledby="governance-title"><div class="governance-title-row"><span class="governance-rule" aria-hidden="true"></span><h2 id="governance-title">AI OPERATIONAL GOVERNANCE</h2><span class="governance-rule" aria-hidden="true"></span></div><div class="governance-mode-row"><p>Mode: VISION. Observation only. No execution.</p><button class="help" type="button" aria-label="Help">?</button></div><div class="governance-graduate-row">GRADUATE: OFF</div></section>
 </main></div></div>`;
 const composer=root.querySelector<HTMLFormElement>(".composer"),message=composer?.querySelector<HTMLInputElement>("#message"),action=composer?.querySelector<HTMLButtonElement>(".composer-action");
 let generating=false;
 const syncComposer=()=>{if(!composer||!message||!action)return;const ready=message.value.trim().length>0;composer.dataset.chatState=generating?"generating":ready?"ready-to-send":"empty";action.hidden=!generating&&!ready;action.textContent=generating?"\u25a0":"\u2191";action.ariaLabel=generating?"Stop response":"Send message";action.title=action.ariaLabel;};
 composer?.addEventListener("submit",event=>event.preventDefault());
 message?.addEventListener("input",syncComposer);
 action?.addEventListener("click",()=>{
  if (!message) return;

  if (generating) {
    generating = false;
    syncComposer();
    return;
  }

  if (message.value.trim().length === 0) return;

  generating = true;
  message.value = "";
  syncComposer();
 });
 syncComposer();
 const viewport=root.querySelector<HTMLElement>(".cockpit-viewport"),instrument=root.querySelector<HTMLElement>(".cockpit-instrument");
 if(viewport&&instrument)setupCockpitViewport(viewport,instrument);
}
void bootstrap();
