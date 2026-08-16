import { describe, expect, it } from "vitest";
import { createOperationalSignalEvaluationScopeV1, bindOperationalSignalsToScopeV1 } from "../../cockpit/operational.signal.evaluation.scope.v1";
import { createGovernedSourceEventCoverageCapabilityV1, verifyGovernedSourceEventCoverageCapabilityV1, type GovernedSourceCoverageStatusV1 } from "../governed.source.event.coverage.capability.v1";

const end = "2026-08-16T10:00:00.000Z";
async function scope(company = "company:1", selection = "evidence-selection:1", snapshot = "source-snapshot:1") {
  const value = await createOperationalSignalEvaluationScopeV1({ version: 1, scope_type: "REQUEST_DATASET", request_id: "request:1", company_id: company, domain: "evidence", evidence_selection_ref: selection, source_snapshot_ref: snapshot });
  return bindOperationalSignalsToScopeV1({ scope: value, request_id: "request:1", company_id: company, evidence_as_of: end, evaluated_at: "2026-08-16T10:01:00.000Z" });
}
const fixtures = {
  operations: { domain_ref: "domain:operations", event_class_ref: "event-class:effected-consumption", required_semantic_field_refs: ["field:event-id", "field:item", "field:quantity", "field:unit", "field:order-ref", "field:process-ref"], guaranteed_semantic_field_refs: ["field:unit", "field:quantity", "field:process-ref", "field:order-ref", "field:item", "field:event-id", "field:item"], optional_semantic_field_refs: ["field:destination"] },
  maintenance: { domain_ref: "domain:maintenance", event_class_ref: "event-class:failure", required_semantic_field_refs: ["field:asset-ref", "field:event-id"], guaranteed_semantic_field_refs: ["field:event-id", "field:asset-ref"], optional_semantic_field_refs: [] },
  project: { domain_ref: "domain:project-management", event_class_ref: "event-class:milestone-effected", required_semantic_field_refs: ["field:event-id", "field:milestone-ref"], guaranteed_semantic_field_refs: ["field:milestone-ref", "field:event-id"], optional_semantic_field_refs: ["field:task-ref"] },
  finance: { domain_ref: "domain:finance", event_class_ref: "event-class:settlement", required_semantic_field_refs: ["field:event-id", "field:account-ref"], guaranteed_semantic_field_refs: ["field:account-ref", "field:event-id"], optional_semantic_field_refs: ["field:payment-ref"] },
} as const;
async function capability(status: GovernedSourceCoverageStatusV1 = "COMPLETE", overrides: Record<string, unknown> = {}) {
  return createGovernedSourceEventCoverageCapabilityV1({ version: 1, capability_policy_ref: "policy:governed-source-event-coverage-v1", capability_policy_version: "1", tenant_id: "tenant:1", source_identity_ref: "source:1", source_profile_ref: "source-profile:1", source_profile_version: "1", source_boundary_ref: "source-boundary:facility-1", evaluation_scope: await scope(), event_class_capabilities: Object.values(fixtures), coverage_start: "2026-08-01T00:00:00.000Z", coverage_end: end, coverage_status: status, profile_capability_evidence_refs: ["evidence:profile-capability"], snapshot_completeness_evidence_refs: status === "COMPLETE" ? ["evidence:snapshot-completeness"] : [], qualification_refs: status === "COMPLETE" ? ["qualification:source-completeness"] : [], provenance_refs: ["provenance:acquisition-lane"], causal_lineage_refs: ["lineage:source-declaration"], ...overrides } as any);
}

describe("GOVERNED-SOURCE-FIXATION-EVENT-COVERAGE-CAPABILITY-WU1", () => {
  it("creates deterministic immutable source-neutral current-snapshot capability", async () => {
    const a = await capability(), b = await capability();
    expect(a.capability_id).toBe(b.capability_id);
    expect(Object.isFrozen(a) && Object.isFrozen(a.event_class_capabilities) && Object.isFrozen(a.event_class_capabilities[0]!.required_semantic_field_refs)).toBe(true);
    expect(a.event_class_capabilities.map(item => item.domain_ref)).toEqual(["domain:finance", "domain:maintenance", "domain:operations", "domain:project-management"]);
    expect(a.event_class_capabilities[2]!.guaranteed_semantic_field_refs).toEqual(["field:event-id", "field:item", "field:order-ref", "field:process-ref", "field:quantity", "field:unit"]);
    expect(a).toMatchObject({ declaration_kind: "CURRENT_SNAPSHOT_COVERAGE", coverage_status: "COMPLETE", source_identity_ref: "source:1", source_profile_ref: "source-profile:1", source_boundary_ref: "source-boundary:facility-1", evidence_selection_ref: "evidence-selection:1", source_snapshot_ref: "source-snapshot:1", asserts_event_occurrence: false, asserts_event_absence: false, establishes_domain_coverage: false, establishes_fixation: false, establishes_changeability: false, recommended: false, executable: false, grants_authority: false, grants_execution: false, company_global_claim: false, multi_source_composition: false, cross_source_deduplication: false });
    await expect(verifyGovernedSourceEventCoverageCapabilityV1(a)).resolves.toBeUndefined();
  });

  it("keeps COMPLETE, PARTIAL and INSUFFICIENT distinct and fails COMPLETE closed", async () => {
    expect((await capability("PARTIAL")).coverage_status).toBe("PARTIAL");
    expect((await capability("INSUFFICIENT")).coverage_status).toBe("INSUFFICIENT");
    await expect(capability("COMPLETE", { snapshot_completeness_evidence_refs: [] })).rejects.toThrow("SOURCE_COVERAGE_COMPLETENESS_EVIDENCE_REQUIRED");
    await expect(capability("COMPLETE", { qualification_refs: [] })).rejects.toThrow("SOURCE_COVERAGE_QUALIFICATION_REQUIRED");
    const missing = { ...fixtures.operations, guaranteed_semantic_field_refs: ["field:event-id"] };
    await expect(capability("COMPLETE", { event_class_capabilities: [missing] })).rejects.toThrow("SOURCE_COVERAGE_REQUIRED_FIELD_NOT_GUARANTEED");
    await expect(capability("COMPLETE", { snapshot_completeness_evidence_refs: [], profile_capability_evidence_refs: ["capability:read-movements", "schema:movements-v1"] })).rejects.toThrow("SOURCE_COVERAGE_COMPLETENESS_EVIDENCE_REQUIRED");
  });

  it("requires exact source, profile, boundary, scope and valid bounded interval", async () => {
    for (const [key, code] of [["source_identity_ref", "SOURCE_COVERAGE_SOURCE_REQUIRED"], ["source_profile_ref", "SOURCE_COVERAGE_PROFILE_REQUIRED"], ["source_boundary_ref", "SOURCE_COVERAGE_BOUNDARY_REQUIRED"], ["capability_policy_ref", "SOURCE_COVERAGE_POLICY_REQUIRED"]] as const) await expect(capability("COMPLETE", { [key]: "" })).rejects.toThrow(code);
    await expect(capability("COMPLETE", { coverage_start: "2026-08-17T00:00:00.000Z" })).rejects.toThrow("SOURCE_COVERAGE_INTERVAL_INVALID");
    await expect(capability("COMPLETE", { coverage_end: "2026-08-15T00:00:00.000Z" })).rejects.toThrow("SOURCE_COVERAGE_INTERVAL_INVALID");
    const other = await createOperationalSignalEvaluationScopeV1({ version: 1, scope_type: "REQUEST_DATASET", request_id: "request:1", company_id: "company:2", domain: "evidence", evidence_selection_ref: "evidence-selection:2", source_snapshot_ref: "source-snapshot:2" });
    await expect(bindOperationalSignalsToScopeV1({ scope: other, request_id: "request:1", company_id: "company:1", evidence_as_of: end, evaluated_at: end })).rejects.toThrow("SCOPE_COMPANY_MISMATCH");
  });

  it("rejects forged class, fields, interval and epistemic boundary", async () => {
    const value = await capability();
    for (const forged of [{ ...value, capability_digest: "0".repeat(64) }, { ...value, coverage_start: "2026-08-02T00:00:00.000Z" }, { ...value, event_class_capabilities: [{ ...value.event_class_capabilities[0]!, event_class_ref: "event-class:forged" }] }, { ...value, event_class_capabilities: [{ ...value.event_class_capabilities[0]!, guaranteed_semantic_field_refs: ["field:forged"] }] }]) await expect(verifyGovernedSourceEventCoverageCapabilityV1(forged as any)).rejects.toThrow("SOURCE_COVERAGE_INTEGRITY_INVALID");
    await expect(verifyGovernedSourceEventCoverageCapabilityV1({ ...value, asserts_event_absence: true } as any)).rejects.toThrow();
    expect(JSON.stringify(value)).not.toMatch(/SAP|MES|ERP|VISION|GRADUATE|JUNIOR|SENIOR|PRINCIPAL|CHARTER|ORDER|SKU|ALLOCATION|MACHINE|PAYMENT|TASK|MILESTONE|BOM|SHIPMENT/);
  });
});
