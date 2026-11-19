import { afterAll, afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import corpus from "../evaluation/experience-v1/corpus.v1.json";
import { approvedParagraphs, clauses, classify, inspectApprovedMeaning, type Turn } from "../evaluation/experience-v1/oracle.v1";
import { Element, mount } from "./operational.chat.offline.fixture.v1";
import * as natural from "../cognition/hybrid.natural.capabilities.v1";
import * as registry from "../../sandbox/llm/registry";
import { CognitiveTransportMediatorV1 } from "../../governance/knowledge-exposure/transport";
import { StudentConversationalInterpretationAdapterV1 } from "../cognition/student.conversational.interpretation.adapter.v1";
import { LIVE_NETWORK_ENABLED_V1 } from "../../../qualification/teacher-one-shot/live.contracts";

const guard = createRequire(import.meta.url)("../../../qualification/teacher-one-shot/offline.network-deny.cjs");
const observations: unknown[] = [], networkEvidence: unknown[] = [], oracleControls: unknown[] = [];
let plan: MockInstance<typeof natural.createNaturalCapabilitiesAnswerPlanV1>;
let renderer: MockInstance<typeof natural.renderNaturalCapabilitiesV1>;
let selection: MockInstance<typeof registry.resolveLlmProviders>;
let hosted: MockInstance<CognitiveTransportMediatorV1["dispatchPublic"]>;
let student: MockInstance<StudentConversationalInterpretationAdapterV1["interpret"]>;
beforeEach(() => {
  vi.resetModules();
  plan = vi.spyOn(natural, "createNaturalCapabilitiesAnswerPlanV1");
  renderer = vi.spyOn(natural, "renderNaturalCapabilitiesV1");
  selection = vi.spyOn(registry, "resolveLlmProviders");
  hosted = vi.spyOn(CognitiveTransportMediatorV1.prototype, "dispatchPublic");
  student = vi.spyOn(StudentConversationalInterpretationAdapterV1.prototype, "interpret");
});
afterEach(() => {
  try {
    guard.assertNoUnexpectedAttempts();
    expect(selection).not.toHaveBeenCalled(); expect(hosted).not.toHaveBeenCalled(); expect(student).not.toHaveBeenCalled();
    expect(LIVE_NETWORK_ENABLED_V1).toBe(false);
  } finally { vi.restoreAllMocks(); vi.unstubAllGlobals(); }
});
afterAll(() => {
  if (process.env.STEP13R_B_REPORT) writeFileSync(process.env.STEP13R_B_REPORT, JSON.stringify({
    benchmark_version: corpus.version, execution_id: process.env.STEP13R_B_EXECUTION_ID, naturalness: "NOT_SCORED", style: "NOT_SCORED",
    measurement: "REAL_UI_MAIN_CLIENT_GATEWAY_CORE_IN_NODE_DOM_NO_BROWSER_LAYOUT_OR_LIVE_INFERENCE",
    scenarios: observations, oracle_controls: oracleControls, network_deny: networkEvidence,
    limitations: ["Finite exact-wording oracle; no general semantic qualification.", "Hosted, Student and Teacher output quality is NOT_MEASURABLE.", "No independent human naturalness comparison approved.", "Roadmap DOCX not found locally; supplied work-unit requirements used."],
  }, null, 2) + "\n");
});

describe("STEP13R-B real conversational experience corpus v1 (harness integrity, not a product quality score)", () => {
  it("validates corpus identity, source references and all eight scenario families", () => {
    expect(new Set(corpus.scenarios.map(scenario => scenario.id)).size).toBe(corpus.scenarios.length);
    expect([...new Set(corpus.scenarios.flatMap(scenario => scenario.families))].sort()).toEqual([1,2,3,4,5,6,7,8]);
    for (const scenario of corpus.scenarios) {
      expect(scenario.inputs.length).toBeGreaterThan(0); expect(scenario.expected).toBeTruthy();
      for (const source of scenario.sources) expect(corpus.sources).toHaveProperty(source);
    }
  });
  it.each(corpus.scenarios)("records $id through the public UI request path", async scenario => {
    const fault = "fault" in scenario ? scenario.fault : undefined;
    const ui = await mount(fault ? { [fault]: true } : {});
    const turns: Turn[] = [];
    for (const input of scenario.inputs) {
      const before = { gateway: ui.gatewayFetch.mock.calls.length, core: ui.realCore.mock.calls.length, plan: plan.mock.calls.length, render: renderer.mock.calls.length };
      const requestIndex = ui.requests.length, replyIndex = ui.replies.length;
      const clientIndex = ui.clientRequests.length;
      ui.submit(input);
      const exchange = ui.exchanges().at(-1)!;
      expect(exchange.querySelector<Element>(".conversation-turn-user")?.querySelector<Element>("p")?.textContent).toBe(input);
      if (fault === "hold") {
        await vi.waitFor(() => expect(ui.signal()).toBeDefined());
        ui.root.querySelector<Element>(".composer-action")!.dispatchEvent(new Event("click"));
      }
      await vi.waitFor(() => expect(["complete", "failed"]).toContain(exchange.dataset.exchangeState));
      if (fault === "hold") { ui.release(); await Promise.resolve(); await Promise.resolve(); }
      const request = ui.requests[requestIndex] ?? null, reply = ui.replies[replyIndex] ?? null;
      const clientRequest = ui.clientRequests[clientIndex];
      expect(ui.clientRequests.length - clientIndex).toBe(1);
      expect(Object.keys(clientRequest).sort()).toEqual(["message", "request_id", "version"]);
      expect(clientRequest).toMatchObject({ version: 1, message: input });
      const text = exchange.querySelector<Element>(".conversation-turn-planneragent")?.querySelector<Element>("p")?.textContent ?? null;
      const noCore = fault === "noForwarding" || fault === "transportError";
      expect(ui.requests.length - requestIndex).toBe(noCore ? 0 : 1);
      if (request) {
        // No private history injection, even on turns two and three.
        expect(Object.keys(request).sort()).toEqual(fault === "malformed" ? ["version"] : ["message", "request_id", "version"]);
        if (fault !== "malformed") expect(request).toMatchObject({ version: 1, message: input });
        expect(ui.realCore.mock.calls.length - before.core).toBe(1);
        expect(ui.gatewayFetch.mock.calls.length - before.gateway).toBe(1);
      }
      expect(ui.replies.length - replyIndex).toBe(noCore ? 0 : 1);
      if (text !== null) { expect(text).toBe(reply?.text); expect(exchange.dataset.exchangeState).toBe("complete"); }
      else expect(exchange.dataset.exchangeState).toBe("failed");
      // Complete source-bound path is required whenever that renderer was used.
      if (renderer.mock.calls.length > before.render) {
        expect(plan.mock.calls.length - before.plan).toBe(1);
        expect(renderer.mock.calls[before.render][0]).toBe(plan.mock.results[before.plan].value);
        expect(reply?.text).toBe(renderer.mock.results[before.render].value.text);
        expect(plan.mock.results[before.plan].value).toMatchObject({ grants_authority: false, grants_execution: false });
      }
      expect(ui.root.textContent).not.toContain("SYNTHETIC_TRANSPORT_FAILURE");
      turns.push({ input, state: exchange.dataset.exchangeState, displayed_text: text, request, reply,
        client_request: clientRequest, client_http_status: ui.clientStatuses[clientIndex] ?? null,
        http_status: ui.statuses[replyIndex] ?? null, gateway_calls: ui.gatewayFetch.mock.calls.length - before.gateway,
        core_calls: ui.realCore.mock.calls.length - before.core, plan_calls: plan.mock.calls.length - before.plan,
        renderer_calls: renderer.mock.calls.length - before.render, aborted: ui.signal()?.aborted ?? false });
    }
    observations.push({ ...scenario, supporting_sources: scenario.sources.map(source => corpus.sources[source as keyof typeof corpus.sources]),
      ...classify(scenario.goal, turns), turns,
      semantic_findings: turns.filter(turn => turn.displayed_text && turn.renderer_calls).map(turn => inspectApprovedMeaning(turn.displayed_text!)),
      authority_findings: "NO_VERIFIED_VIOLATION_IN_OBSERVED_OUTPUTS; LIMITED_TO_EXACT_BOUNDARY_AND_RENDERER_CHECKS",
    });
  });

  it("independently detects declared omission and contradiction mutations without crediting them as product outputs", () => {
    const controls = [
      { id: "ORACLE-COMPLETE", candidate: approvedParagraphs, outcome: "SUPPORTED", missing: [], contradictions: [] },
      { id: "ORACLE-OMISSION", candidate: approvedParagraphs.replace(clauses[2], ""), outcome: "FAILED", missing: [2], contradictions: [] },
      { id: "ORACLE-CONTRADICTION", candidate: approvedParagraphs + " VISION can execute actions.", outcome: "FAILED", missing: [], contradictions: ["VISION can execute actions."] },
      { id: "ORACLE-UNSUPPORTED-AVAILABILITY", candidate: approvedParagraphs + " Every domain is implemented, qualified and publicly available.", outcome: "FAILED", missing: [], contradictions: ["Every domain is implemented, qualified and publicly available."] },
      { id: "ORACLE-AUTHORITY", candidate: approvedParagraphs + " I have accessed your organization and approved the order.", outcome: "FAILED", missing: [], contradictions: ["I have accessed your organization and approved the order."] },
      { id: "ORACLE-ARBITRARY-PROSE", candidate: "PlannerAgent helps people with planning.", outcome: "NOT_MEASURABLE", missing: [0,1,2,3,4,5], contradictions: [] },
    ];
    for (const control of controls) {
      const actual = inspectApprovedMeaning(control.candidate);
      expect(actual).toMatchObject({ status: control.outcome, missing_clause_indices: control.missing, contradictions: control.contradictions });
      oracleControls.push({ ...control, actual, measurement: "SYNTHETIC_ORACLE_CONTROL_NOT_PRODUCT_OUTPUT", omission_detection: control.id === "ORACLE-OMISSION" ? "VERIFIED_EXACT_CLAUSE_REMOVAL" : "NOT_APPLICABLE" });
    }
  });

  it.each([
    ["fetch", "globalThis.fetch('https://example.invalid')"],
    ["net.connect", "require('node:net').connect(443,'example.invalid')"],
    ["tls.connect", "require('node:tls').connect(443,'example.invalid')"],
    ["http2.connect", "require('node:http2').connect('https://example.invalid')"],
    ["dgram.createSocket", "require('node:dgram').createSocket('udp4')"],
    ["dns.lookup", "require('node:dns').lookup('example.invalid',()=>{})"],
  ])("verifies inherited immutable offline denial: %s", (route, probe) => {
    const child = spawnSync(process.execPath, ["-e", `const g=globalThis[Symbol.for('planneragent.oneshot.offline.network-denial.v1')]; if(!g) process.exit(90); try { ${probe}; process.exit(91); } catch(e) { if(e.code!=='OFFLINE_NETWORK_ACCESS_DENIED') process.exit(92); } g.acknowledgeExpectedAttempts([${JSON.stringify(route)}]); g.assertNoUnexpectedAttempts();`], { encoding: "utf8", timeout: 10000 });
    expect(child.status, child.stderr).toBe(0);
    networkEvidence.push({ route, blocked_before_io: true, inherited_preload: true, child_exit_code: child.status });
  });
});
