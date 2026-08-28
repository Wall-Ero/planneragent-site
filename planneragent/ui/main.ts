import "./styles.css";
import { getSession, projectServerSession } from "./auth/AuthProvider";
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
import { AnonymousConversationClientV1 } from "./conversation.client";
import { beginConversationExchangeV1, completeConversationExchangeV1, createConversationTranscriptV1, failConversationExchangeV1, positionConversationTurnAtStartV1, trimConversationExchangesV1, type ConversationExchangeV1 } from "./conversation.transcript";
import { IdentityClientV1 } from "./identity.client";
import { createIdentityModalV1 } from "./identity.modal";

const signal=(value:string,active?:string)=>`<span class="signal${value===active?" is-active":""}" data-state="${value===active?"active":"neutral"}" aria-current="${value===active?"true":"false"}">${value}</span>`;

async function currentCockpit():Promise<CockpitTransportResponse|undefined>{try{const response=await fetch("/sandbox",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({request_id:crypto.randomUUID(),plan:appConfig.defaultMode,intent:"INFORM",domain:"operations",actor_id:"anonymous"})});if(!response.ok)return undefined;return await response.json() as CockpitTransportResponse}catch{return undefined}}

async function bootstrap(){const root=document.querySelector<HTMLElement>("#app");if(!root)return;const identity=new IdentityClientV1(),session=projectServerSession(await identity.session()),presentation=createCockpitPresentation(await currentCockpit());
 root.innerHTML=`<div class="cockpit-viewport" data-fit-mode="fit"><div class="cockpit-instrument"><main class="cockpit-shell" data-status="${presentation.available?"available":"waiting"}">
  ${renderLateralChassis()}
  <header class="header"><button class="text-control" type="button">FAQ</button><h1>PLANNERAGENT</h1><button class="text-control identity-control" type="button" aria-label="Identity (${session.status})">ID</button></header>
  <section class="activity" aria-label="PlannerAgent activity: ${presentation.activity}">${renderActivityBarFrame()}<div class="activity-idle-track"><i class="activity-idle-gap"></i></div></section>
  <section class="data-awareness" aria-labelledby="data-title">${renderDataAwarenessFrame()}<h2 id="data-title">DATA AWARENESS</h2><div class="horizontal-signals">${signal("SNAPSHOT",presentation.dataAwareness)}${signal("BEHAVIORAL",presentation.dataAwareness)}${signal("STRUCTURAL",presentation.dataAwareness)}</div></section>
  <section class="cognition" aria-label="Operational cockpit signals">
   ${renderCognitionContour()}
   <article class="signal-panel plan-panel">${renderPlanFrame()}<h2>PLAN</h2><div class="vertical-signals">${signal("VALID",presentation.plan)}${signal("MISSING",presentation.plan)}${signal("BROKEN",presentation.plan)}</div></article>
   <article class="signal-panel pressure-panel">${renderDecisionPressureFrame()}<div class="vertical-signals">${signal("HIGH",presentation.pressure)}${signal("MEDIUM",presentation.pressure)}${signal("LOW",presentation.pressure)}</div><h2>DECISION PRESSURE</h2></article>
   <article class="signal-panel reality-panel">${renderRealityFrame()}<h2>REALITY</h2><div class="vertical-signals">${signal("STABLE",presentation.reality)}${signal("SHIFTING",presentation.reality)}${signal("UNSTABLE",presentation.reality)}</div></article>
  </section>
  <section class="conversation" aria-label="Conversation">${renderChatMessageFrame()}<div class="conversation-content conversation-invitation"><p>State your role and show me what you're facing.</p><p>I will reveal where a decision can no longer wait.</p></div></section>
  <form class="composer" data-chat-state="empty">${renderChatInputFrame()}<button type="button" class="composer-button add" aria-label="Attach data">+</button><label class="sr-only" for="message">Message PlannerAgent</label><input id="message" name="message" autocomplete="off" placeholder="Type here..."><button type="button" class="composer-button microphone" aria-label="Microphone">${renderMicrophone()}</button><button type="button" class="composer-button composer-action" hidden></button></form>
  <section class="governance" aria-labelledby="governance-title"><div class="governance-title-row"><span class="governance-rule" aria-hidden="true"></span><h2 id="governance-title">AI OPERATIONAL GOVERNANCE</h2><span class="governance-rule" aria-hidden="true"></span></div><div class="governance-mode-row"><p>Mode: VISION. Observation only. No execution.</p><button class="help" type="button" aria-label="Help">?</button></div><div class="governance-graduate-row">GRADUATE: OFF</div></section>
 </main></div></div>`;
 const composer=root.querySelector<HTMLFormElement>(".composer"),message=composer?.querySelector<HTMLInputElement>("#message"),action=composer?.querySelector<HTMLButtonElement>(".composer-action"),conversation=root.querySelector<HTMLElement>(".conversation"),invitation=conversation?.querySelector<HTMLElement>(".conversation-invitation");
 const client=new AnonymousConversationClientV1();
 const identityControl=root.querySelector<HTMLButtonElement>(".identity-control"),syncIdentity=(value=getSession())=>{if(identityControl){identityControl.dataset.accountState=value.status;identityControl.ariaLabel=`Identity (${value.status})`;identityControl.textContent=value.status==="REGISTERED"?"ID · REGISTERED":"ID";}},acceptSession=(value:ReturnType<typeof getSession>)=>{projectServerSession(value);syncIdentity();};identityControl?.addEventListener("click",()=>root.append(createIdentityModalV1(document,identity,getSession(),acceptSession)));syncIdentity();
 let generating=false;
 let transcript:HTMLElement|undefined,exchanges:ConversationExchangeV1[]=[];
 const syncComposer=()=>{if(!composer||!message||!action)return;const ready=message.value.trim().length>0;composer.dataset.chatState=generating?"generating":ready?"ready-to-send":"empty";action.hidden=!generating&&!ready;action.textContent=generating?"\u25a0":"\u2191";action.ariaLabel=generating?"Stop response":"Send message";action.title=action.ariaLabel;};
 const send=async()=>{if(!message||!conversation||generating)return;const text=message.value.trim();if(!text)return;invitation?.remove();if(!transcript){transcript=createConversationTranscriptV1(document);conversation.append(transcript);conversation.classList.add("conversation-transcript-mode");}let exchange=beginConversationExchangeV1(document,transcript,text);exchanges.push(exchange);generating=true;syncComposer();const result=await client.send(text);generating=false;if(result.status==="RESPONSE"){exchange=completeConversationExchangeV1(document,exchange,result.response.text);message.value="";}else{exchange=failConversationExchangeV1(exchange);}const index=exchanges.findIndex(({element})=>element===exchange.element);if(index>=0)exchanges[index]=exchange;exchanges=trimConversationExchangesV1(exchanges);if(exchange.assistantTurn)positionConversationTurnAtStartV1(transcript,exchange.assistantTurn);syncComposer();};
 composer?.addEventListener("submit",event=>{event.preventDefault();void send();});
 message?.addEventListener("input",syncComposer);
 action?.addEventListener("click",()=>{if(generating){client.stop();generating=false;syncComposer();return;}void send();});
 syncComposer();
 const viewport=root.querySelector<HTMLElement>(".cockpit-viewport"),instrument=root.querySelector<HTMLElement>(".cockpit-instrument");
 if(viewport&&instrument)setupCockpitViewport(viewport,instrument);
}
void bootstrap();
