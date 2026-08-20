import "./styles.css";
import { getSession } from "./auth/AuthProvider";
import { resolveRoleFromSession } from "./auth/RoleResolver";
import { appConfig } from "./app/app.config";
import { createCockpitPresentation, type CockpitTransportResponse } from "./cockpit.presentation";

const frames={background:new URL("./assets/frames/Background_frame.svg",import.meta.url).href,activity:new URL("./assets/frames/Activity_bar_frame.svg",import.meta.url).href,data:new URL("./assets/frames/Data_aw_frame.svg",import.meta.url).href,plan:new URL("./assets/frames/Plan_frame.svg",import.meta.url).href,pressure:new URL("./assets/frames/Decision_pres_frame.svg",import.meta.url).href,reality:new URL("./assets/frames/Reality_frame.svg",import.meta.url).href,message:new URL("./assets/frames/Chat_message.svg",import.meta.url).href,input:new URL("./assets/frames/Chat_input.svg",import.meta.url).href,governance:new URL("./assets/frames/Ai_op_frame.svg",import.meta.url).href,microphone:new URL("./assets/frames/Microphone_frame.svg",import.meta.url).href};
const signal=(value:string,active?:string)=>`<span class="signal${value===active?" is-active":""}" aria-current="${value===active?"true":"false"}">${value}</span>`;
const frame=(src:string,label:string)=>`<img class="frame" src="${src}" alt="" aria-hidden="true" data-frame="${label}">`;

async function currentCockpit():Promise<CockpitTransportResponse|undefined>{try{const session=getSession(),response=await fetch("/sandbox",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({request_id:crypto.randomUUID(),plan:appConfig.defaultMode,intent:"INFORM",domain:"operations",actor_id:session.user_id??"anonymous"})});if(!response.ok)return undefined;return await response.json() as CockpitTransportResponse}catch{return undefined}}

async function bootstrap(){const root=document.querySelector<HTMLElement>("#app");if(!root)return;const session=getSession(),role=resolveRoleFromSession(session),presentation=createCockpitPresentation(await currentCockpit());
 root.innerHTML=`<main class="cockpit-shell" data-status="${presentation.available?"available":"waiting"}">
  ${frame(frames.background,"background")}
  <header class="header"><button class="text-control" type="button" data-action="faq">FAQ</button><h1>PLANNERAGENT</h1><button class="text-control" type="button" data-action="identity" aria-label="Identity (${role})">ID</button></header>
  <section class="activity" aria-label="PlannerAgent activity: ${presentation.activity}">${frame(frames.activity,"activity")}<div class="activity-track"><div class="activity-line"><i></i></div></div></section>
  <section class="data-awareness" aria-labelledby="data-title">${frame(frames.data,"data-awareness")}<h2 id="data-title">DATA AWARENESS</h2><div class="horizontal-signals">${signal("SNAPSHOT",presentation.dataAwareness)}${signal("BEHAVIORAL",presentation.dataAwareness)}${signal("STRUCTURAL",presentation.dataAwareness)}</div></section>
  <section class="cognition" aria-label="Operational cockpit signals">
   <article class="signal-panel plan-panel">${frame(frames.plan,"plan")}<h2>PLAN</h2><div class="vertical-signals">${signal("VALID",presentation.plan)}${signal("MISSING",presentation.plan)}${signal("BROKEN",presentation.plan)}</div></article>
   <article class="signal-panel pressure-panel">${frame(frames.pressure,"decision-pressure")}<div class="vertical-signals">${signal("HIGH",presentation.pressure)}${signal("MEDIUM",presentation.pressure)}${signal("LOW",presentation.pressure)}</div><h2>DECISION PRESSURE</h2></article>
   <article class="signal-panel reality-panel">${frame(frames.reality,"reality")}<h2>REALITY</h2><div class="vertical-signals">${signal("STABLE",presentation.reality)}${signal("SHIFTING",presentation.reality)}${signal("UNSTABLE",presentation.reality)}</div></article>
  </section>
  <section class="conversation" aria-label="Conversation">${frame(frames.message,"chat-message")}<p>State your role and show me operations.<br>I will reveal if reality respects the plan.</p></section>
  <form class="composer">${frame(frames.input,"chat-input")}<button type="button" class="composer-button add" aria-label="Attach data">+</button><label class="sr-only" for="message">Message PlannerAgent</label><input id="message" name="message" autocomplete="off" placeholder="Type here..."><button type="button" class="composer-button microphone" aria-label="Microphone">${frame(frames.microphone,"microphone")}</button><button type="button" class="composer-button send" aria-label="Send message" title="Send message">↑</button><button type="button" class="composer-button stop" aria-label="Stop generation" title="Stop generation">■</button></form>
  <section class="governance" aria-labelledby="governance-title"><div class="governance-title-row"><span class="governance-rule" aria-hidden="true"></span><h2 id="governance-title">AI OPERATIONAL GOVERNANCE</h2><span class="governance-rule" aria-hidden="true"></span></div><div class="governance-mode-row"><p>Mode: VISION. Observation only. No execution.</p><button class="help" type="button" aria-label="Help">?</button></div><div class="governance-graduate-row">GRADUATE: OFF</div></section>
 </main>`;
 root.querySelector<HTMLFormElement>(".composer")?.addEventListener("submit",event=>event.preventDefault());
 root.querySelectorAll<HTMLButtonElement>("[data-action]").forEach(button=>button.addEventListener("click",()=>button.setAttribute("aria-expanded",button.getAttribute("aria-expanded")==="true"?"false":"true")));
}
void bootstrap();
