import { describe, expect, it } from "vitest";
import { bindOperationalSignalsToScopeV1, createOperationalSignalEvaluationScopeV1 } from "../../cockpit/operational.signal.evaluation.scope.v1";
import * as window from "../canonical.decision.window.contract.v1";

async function binding(scopeType: "ENTITY" | "PATH" | "REQUEST_DATASET" = "ENTITY") {
  const base = { version: 1 as const, scope_type: scopeType, request_id: "request:1", company_id: "company:1", domain: "production", evidence_selection_ref: "selection:1", source_snapshot_ref: "snapshot:1" };
  const input = scopeType === "ENTITY" ? { ...base, entity: { entity_type: "SKU" as const, entity_ref: "sku:1" } } : scopeType === "PATH" ? { ...base, path: { subgraph_ref: "path:1", seed_refs: ["sku:1"] } } : base;
  const scope = await createOperationalSignalEvaluationScopeV1(input);
  return bindOperationalSignalsToScopeV1({ scope, request_id: "request:1", company_id: "company:1", evidence_as_of: "2026-08-13T10:00:00Z", evaluated_at: "2026-08-13T10:01:00Z" });
}
const common = async (scopeType: "ENTITY" | "PATH" | "REQUEST_DATASET" = "ENTITY") => ({ version: 1 as const, request_id: "request:1", company_id: "company:1", evaluation_scope: await binding(scopeType), evidence_refs: ["evidence:1"], provenance_refs: ["provenance:1"], causal_lineage_refs: ["lineage:1"] });
async function facts(scopeType: "ENTITY" | "PATH" | "REQUEST_DATASET" = "ENTITY") {
  const c = await common(scopeType);
  const requirement = await window.createDatedOperationalRequirementV1({ ...c, item_ref: "sku:1", order_ref: "order:1", quantity: { value: 10, unit_ref: "unit:each", quantity_evidence_ref: "quantity:required" }, requirement_time: "2026-08-14T12:00:00Z" });
  const availability = await window.createDatedOperationalAvailabilityV1({ ...c, item_ref: "sku:1", quantity: { value: 10, unit_ref: "unit:each", quantity_evidence_ref: "quantity:available" }, availability_time: "2026-08-14T10:00:00Z", availability_class: "SUPPLIER_COMMITMENT" });
  const occurrence = await window.createMaterialConsequenceOccurrenceV1({ ...c, occurrence_status: "KNOWN", consequence_ref: "consequence:stop", category: "PRODUCTION_INTERRUPTION", affected_operational_refs: ["sku:1", "order:1"], causal_condition_ref: "condition:delay", consequence_time: "2026-08-14T12:00:00Z" });
  const slackAssessment = await window.createOperationalSlackAssessmentV1({ ...c, requirement, availability, consequence_occurrence_ref: occurrence.occurrence_id });
  const slack = await window.createOperationalSlackResultV1({ version: 1, assessment: slackAssessment, status: "KNOWN", absorbable_delay: { value: 0, unit_ref: "duration:minutes" }, reason_ref: "reason:margin-exhausted" });
  const option = await window.createCorrectiveOptionFeasibilityV1({ ...c, corrective_option_ref: "option:expedite", item_refs: ["sku:1"], feasibility_status: "FEASIBLE", unavailable_at: "2026-08-14T11:00:00Z", materially_worsens_at: "2026-08-14T10:30:00Z", consequence_refs: ["consequence:stop"] });
  const assessment = await window.createCanonicalDecisionWindowAssessmentV1({ ...c, governing_condition_ref: "condition:delay", consequence_occurrences: [occurrence], slack_results: [slack], corrective_option_feasibility: [option], local_window_refs: scopeType === "REQUEST_DATASET" ? ["window:sku-1"] : [] });
  return { c, requirement, availability, occurrence, slackAssessment, slack, option, assessment };
}

describe("PRESSURE-WINDOW-CANONICAL-CONTRACT-WU1", () => {
  it("creates deterministic immutable requirement and availability identities", async () => {
    const a = await facts(), b = await facts();
    expect(a.requirement).toEqual(b.requirement); expect(a.availability).toEqual(b.availability);
    expect(a.requirement.requirement_id).toMatch(/sha256:[0-9a-f]{64}$/); expect(a.availability.availability_id).toMatch(/sha256:[0-9a-f]{64}$/);
    expect(Object.isFrozen(a.requirement) && Object.isFrozen(a.requirement.quantity)).toBe(true);
  });

  it("fails closed on item, unit, scope, request, and company substitution", async () => {
    const f = await facts();
    const badItem = await window.createDatedOperationalAvailabilityV1({ ...f.c, item_ref: "sku:2", quantity: f.availability.quantity, availability_time: f.availability.availability_time, availability_class: "SCHEDULED_RECEIPT" });
    await expect(window.createOperationalSlackAssessmentV1({ ...f.c, requirement: f.requirement, availability: badItem })).rejects.toThrow("SLACK_ITEM_MISMATCH");
    const badUnit = await window.createDatedOperationalAvailabilityV1({ ...f.c, item_ref: "sku:1", quantity: { ...f.availability.quantity, unit_ref: "unit:kg" }, availability_time: f.availability.availability_time, availability_class: "SCHEDULED_RECEIPT" });
    await expect(window.createOperationalSlackAssessmentV1({ ...f.c, requirement: f.requirement, availability: badUnit })).rejects.toThrow("SLACK_UNIT_MISMATCH");
    await expect(window.createDatedOperationalRequirementV1({ ...f.c, company_id: "company:2", item_ref: "sku:1", quantity: f.requirement.quantity, requirement_time: f.requirement.requirement_time })).rejects.toThrow(/MISMATCH/);
  });

  it("requires authoritative consequence time for KNOWN and preserves exact category/scope/time", async () => {
    const f = await facts(); expect(f.occurrence).toMatchObject({ category: "PRODUCTION_INTERRUPTION", consequence_time: "2026-08-14T12:00:00Z", scope_id: f.c.evaluation_scope.scope.scope_id });
    await expect(window.createMaterialConsequenceOccurrenceV1({ ...f.c, occurrence_status: "KNOWN", consequence_ref: "consequence:x", category: "SERVICE_IMPACT", affected_operational_refs: ["sku:1"], causal_condition_ref: "condition:x" })).rejects.toThrow("CONSEQUENCE_TIME_REQUIRED");
  });

  it("does not fabricate slack and keeps slack separate from window status", async () => {
    const f = await facts();
    await expect(window.createOperationalSlackResultV1({ version: 1, assessment: f.slackAssessment, status: "UNRESOLVED", absorbable_delay: { value: 0, unit_ref: "duration:minutes" }, reason_ref: "reason:missing" })).rejects.toThrow("SLACK_DURATION_NOT_RESOLVED");
    const open = await window.createCanonicalDecisionWindowResultV1({ version: 1, assessment: f.assessment, status: "OPEN", end_reason: "EFFECTIVE_OPTION_LOSS", end_time: "2026-08-14T11:00:00Z", remaining_duration: { value: 0, unit_ref: "duration:minutes" }, governing_option_feasibility_ref: f.option.feasibility_id, causal_lineage_refs: ["lineage:1"] });
    expect(f.slack.absorbable_delay?.value).toBe(0); expect(open.status).toBe("OPEN");
    const positiveClosed = await window.createCanonicalDecisionWindowResultV1({ version: 1, assessment: f.assessment, status: "CLOSED", end_reason: "MATERIAL_CONSEQUENCE_ONSET", end_time: "2026-08-14T12:00:00Z", remaining_duration: { value: 5, unit_ref: "duration:minutes" }, governing_consequence_occurrence_ref: f.occurrence.occurrence_id, causal_lineage_refs: ["lineage:1"] });
    expect(positiveClosed.status).toBe("CLOSED");
  });

  it("represents time-bound option feasibility, loss, worsening, and unknown expiry", async () => {
    const f = await facts(); expect(f.option).toMatchObject({ feasibility_status: "FEASIBLE", unavailable_at: "2026-08-14T11:00:00Z", materially_worsens_at: "2026-08-14T10:30:00Z" });
    const unknown = await window.createCorrectiveOptionFeasibilityV1({ ...f.c, corrective_option_ref: "option:reroute", item_refs: ["sku:1"], feasibility_status: "UNRESOLVED", consequence_refs: [] });
    expect(unknown).not.toHaveProperty("unavailable_at"); expect(JSON.stringify(unknown)).not.toMatch(/freezeHorizon|maxReschedule/);
  });

  it.each([
    ["MATERIAL_CONSEQUENCE_ONSET", "occurrence"], ["EFFECTIVE_OPTION_LOSS", "option"], ["EFFECTIVE_OPTION_MATERIAL_WORSENING", "option"],
  ] as const)("represents CLOSED because of %s", async (reason, governing) => {
    const f = await facts(); const result = await window.createCanonicalDecisionWindowResultV1({ version: 1, assessment: f.assessment, status: "CLOSED", end_time: reason === "MATERIAL_CONSEQUENCE_ONSET" ? f.occurrence.consequence_time : reason === "EFFECTIVE_OPTION_LOSS" ? f.option.unavailable_at : f.option.materially_worsens_at, end_reason: reason, ...(governing === "occurrence" ? { governing_consequence_occurrence_ref: f.occurrence.occurrence_id } : { governing_option_feasibility_ref: f.option.feasibility_id }), causal_lineage_refs: ["lineage:1"] });
    expect(result.end_reason).toBe(reason); expect(result.end_time).toBeTruthy();
  });

  it("represents a caller-selected earliest authoritative event without selecting it", async () => {
    const f = await facts(); const result = await window.createCanonicalDecisionWindowResultV1({ version: 1, assessment: f.assessment, status: "OPEN", end_time: f.option.materially_worsens_at, end_reason: "EFFECTIVE_OPTION_MATERIAL_WORSENING", governing_option_feasibility_ref: f.option.feasibility_id, causal_lineage_refs: ["lineage:1"] });
    expect(result.end_time).toBe("2026-08-14T10:30:00Z"); expect(result).not.toHaveProperty("selected_by_algorithm");
  });

  it("keeps missing time unresolved without fabricated dates", async () => {
    const f = await facts(); const result = await window.createCanonicalDecisionWindowResultV1({ version: 1, assessment: f.assessment, status: "INSUFFICIENT_EVIDENCE", end_reason: "UNRESOLVED", causal_lineage_refs: ["lineage:1"] });
    expect(result).not.toHaveProperty("end_time"); expect(result).not.toHaveProperty("remaining_duration");
  });

  it.each(["PATH", "REQUEST_DATASET"] as const)("preserves %s scope boundaries", async scopeType => {
    const f = await facts(scopeType); expect(f.assessment.evaluation_scope.scope.scope_type).toBe(scopeType); expect(f.assessment.company_global_claim).toBe(false);
    if (scopeType === "REQUEST_DATASET") expect(f.assessment.local_window_refs).toEqual(["window:sku-1"]);
  });

  it("is source-neutral, non-authorizing, classification-free, and threshold-free", async () => {
    const f = await facts(); const json = JSON.stringify(f.assessment);
    expect(f.assessment).toMatchObject({ grants_execution: false, grants_remediation: false, observational_only: true });
    expect(json).not.toMatch(/LOW|MEDIUM|HIGH|3.?day|7.?day|shortageUnits|demandUnits|threshold/i);
  });

  it("represents a qualified supplier commitment without ingestion", async () => {
    const c = await common(); const commitment = await window.createSupplierCommitmentV1({ ...c, supplier_ref: "supplier:1", item_ref: "sku:1", commitment_ref: "commitment:1", commitment_version_ref: "version:2", committed_arrival_time: "2026-08-14T10:00:00Z", observed_at: "2026-08-13T09:00:00Z", effective_at: "2026-08-13T09:05:00Z", qualification_ref: "qualification:1" });
    expect(commitment.supplier_commitment_id).toMatch(/sha256/); expect(JSON.stringify(commitment)).not.toMatch(/email|chat|provider_response/i);
  });

  it("changes requirement identity when authoritative time changes", async () => { const f = await facts(); const changed = await window.createDatedOperationalRequirementV1({ ...f.c, item_ref: "sku:1", quantity: f.requirement.quantity, requirement_time: "2026-08-14T13:00:00Z" }); expect(changed.requirement_digest).not.toBe(f.requirement.requirement_digest); });
  it("changes availability identity when provenance changes", async () => { const f = await facts(); const changed = await window.createDatedOperationalAvailabilityV1({ ...f.c, provenance_refs: ["provenance:2"], item_ref: "sku:1", quantity: f.availability.quantity, availability_time: f.availability.availability_time, availability_class: f.availability.availability_class }); expect(changed.availability_digest).not.toBe(f.availability.availability_digest); });
  it("fails closed when canonical unit identity is absent", async () => { const c = await common(); await expect(window.createDatedOperationalRequirementV1({ ...c, item_ref: "sku:1", quantity: { value: 1, unit_ref: "", quantity_evidence_ref: "quantity:1" }, requirement_time: "2026-08-14T12:00:00Z" })).rejects.toThrow("REQUIREMENT_QUANTITY_INVALID"); });
  it("does not convert quantity units", async () => { const f = await facts(); expect(f.requirement.quantity).toEqual({ value: 10, unit_ref: "unit:each", quantity_evidence_ref: "quantity:required" }); expect(f.requirement).not.toHaveProperty("converted_quantity"); });
  it("allows unresolved consequence occurrence without a fabricated time", async () => { const c = await common(); const occurrence = await window.createMaterialConsequenceOccurrenceV1({ ...c, occurrence_status: "UNRESOLVED", consequence_ref: "consequence:unknown", category: "SERVICE_IMPACT", affected_operational_refs: ["sku:1"], causal_condition_ref: "condition:delay" }); expect(occurrence).not.toHaveProperty("consequence_time"); });
  it("requires an unavailable time for an unavailable option", async () => { const c = await common(); await expect(window.createCorrectiveOptionFeasibilityV1({ ...c, corrective_option_ref: "option:x", item_refs: ["sku:1"], feasibility_status: "UNAVAILABLE", consequence_refs: [] })).rejects.toThrow("OPTION_UNAVAILABLE_TIME_REQUIRED"); });
  it("does not define a dataset-level result by composition", async () => { const f = await facts("REQUEST_DATASET"); expect(f.assessment.local_window_refs).toHaveLength(1); expect(f.assessment).not.toHaveProperty("dataset_window_status"); });
  it("does not invent PATH edge durations", async () => { const f = await facts("PATH"); expect(f.assessment.evaluation_scope.scope.path?.subgraph_ref).toBe("path:1"); expect(f.assessment).not.toHaveProperty("edge_durations"); });
  it("requires governing evidence for a closed consequence window", async () => { const f = await facts(); await expect(window.createCanonicalDecisionWindowResultV1({ version: 1, assessment: f.assessment, status: "CLOSED", end_time: "2026-08-14T12:00:00Z", end_reason: "MATERIAL_CONSEQUENCE_ONSET", causal_lineage_refs: ["lineage:1"] })).rejects.toThrow("WINDOW_CONSEQUENCE_REF_REQUIRED"); });
  it("requires governing evidence for a closed option window", async () => { const f = await facts(); await expect(window.createCanonicalDecisionWindowResultV1({ version: 1, assessment: f.assessment, status: "CLOSED", end_time: "2026-08-14T11:00:00Z", end_reason: "EFFECTIVE_OPTION_LOSS", causal_lineage_refs: ["lineage:1"] })).rejects.toThrow("WINDOW_OPTION_REF_REQUIRED"); });
});
