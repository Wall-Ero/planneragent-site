import { describe, expect, it } from "vitest";
import { bindOperationalSignalsToScopeV1, createOperationalSignalEvaluationScopeV1 } from "../../cockpit/operational.signal.evaluation.scope.v1";
import { createGovernedSourceEventCoverageCapabilityV1, type GovernedSourceCoverageStatusV1 } from "../../cognition/governed.source.event.coverage.capability.v1";
import { assertOperationsPlannedProductionSnapshotCoverageV1, createOperationsPlannedProductionSnapshotCoverageProfileV1, OPERATIONS_PLANNED_PRODUCTION_EVENT_CLASS, OPERATIONS_PLANNED_PRODUCTION_OPTIONAL_FIELDS, OPERATIONS_PLANNED_PRODUCTION_REQUIRED_FIELDS } from "../cognition/operations.planned.production.snapshot.coverage.v1";
import { preserveGovernedOperationsFactV1 } from "../preservation/governed.operational.fact.preservation.v1";

const end = "2026-08-16T10:00:00.000Z";
const acquisition = { tenantId: "1", companyId: "company:1", sourceSystem: "GENERIC_ERP", connectorIdentityId: "connector-1", connectorRevision: 1, acquisitionReference: "acquisition-1", authorizationReference: "authorization-1", acquiredAt: end, capabilityId: "read", sourceRepresentation: "PROFILE_V1" };
const row = { production_order_id: "P1", article: "FG1", output_article: "FG1", quantity: 4, unit: "EA", scheduled_at: "2026-08-14T06:00:00.000Z", planned_output_available_at: "2026-08-14T12:00:00.000Z" };

async function scope(company = "company:1", selection = "evidence-selection:1", snapshot = "source-snapshot:1") {
  const value = await createOperationalSignalEvaluationScopeV1({ version: 1, scope_type: "REQUEST_DATASET", request_id: "request:1", company_id: company, domain: "operations", evidence_selection_ref: selection, source_snapshot_ref: snapshot });
  return bindOperationalSignalsToScopeV1({ scope: value, request_id: "request:1", company_id: company, evidence_as_of: end, evaluated_at: end });
}
async function coverage(status: GovernedSourceCoverageStatusV1 = "COMPLETE", fieldRefs: readonly string[] = OPERATIONS_PLANNED_PRODUCTION_REQUIRED_FIELDS, boundScope = scope(), sourceProfile = "source-profile:generic-erp") {
  return createGovernedSourceEventCoverageCapabilityV1({ version: 1, capability_policy_ref: "policy:governed-source-event-coverage-v1", capability_policy_version: "1", tenant_id: "tenant:1", source_identity_ref: "source:production", source_profile_ref: sourceProfile, source_profile_version: "1", source_boundary_ref: "source-boundary:company-1", evaluation_scope: await boundScope, event_class_capabilities: [{ domain_ref: "domain:operations", event_class_ref: OPERATIONS_PLANNED_PRODUCTION_EVENT_CLASS, required_semantic_field_refs: fieldRefs, guaranteed_semantic_field_refs: fieldRefs, optional_semantic_field_refs: OPERATIONS_PLANNED_PRODUCTION_OPTIONAL_FIELDS }], coverage_start: "2026-08-01T00:00:00.000Z", coverage_end: end, coverage_status: status, profile_capability_evidence_refs: ["evidence:profile-capability"], snapshot_completeness_evidence_refs: status === "COMPLETE" ? ["evidence:snapshot-completeness"] : [], qualification_refs: status === "COMPLETE" ? ["qualification:source-completeness"] : [], provenance_refs: ["provenance:acquisition-lane"], causal_lineage_refs: ["lineage:source-declaration"] });
}
async function fact(overrides: Record<string, unknown> = {}, acquisitionOverrides: Record<string, unknown> = {}) {
  return preserveGovernedOperationsFactV1("PRODUCTION_ORDERS", { ...row, ...overrides }, { ...acquisition, ...acquisitionOverrides });
}
async function input(overrides: Record<string, unknown> = {}) {
  return { version: 1 as const, tenant_id: "tenant:1", source_namespace: "GENERIC_ERP", evaluation_scope: await scope(), coverage: await coverage(), production_facts: [await fact()], ...overrides };
}

describe("OPERATIONS-PLANNED-PRODUCTION-CURRENT-SNAPSHOT-COVERAGE-BINDING-WU1", () => {
  it("creates a deterministic immutable source-neutral Operations coverage profile", async () => {
    const a = await createOperationsPlannedProductionSnapshotCoverageProfileV1(), b = await createOperationsPlannedProductionSnapshotCoverageProfileV1();
    expect(a).toEqual(b);
    expect(Object.isFrozen(a) && Object.isFrozen(a.required_semantic_field_refs)).toBe(true);
    expect(a).toMatchObject({ domain_ref: "domain:operations", event_class_ref: OPERATIONS_PLANNED_PRODUCTION_EVENT_CLASS, source_profile_support_rule: "EXPLICIT_GOVERNED_CAPABILITY_EVIDENCE", complete_snapshot_required: true, qualification_required: true, single_source_only: true, current_snapshot_only: true, establishes_membership: false, establishes_material_feasibility: false, establishes_realization: false, recommended: false, executable: false, grants_authority: false, grants_execution: false });
    expect(JSON.stringify(a)).not.toMatch(/SAP|ERP|MES|CSV|EXCEL/);
  });

  it("requires the exact minimal semantic fields and keeps scheduled start optional", async () => {
    expect(OPERATIONS_PLANNED_PRODUCTION_REQUIRED_FIELDS).toEqual(["field:output-item", "field:planned-output-available-at", "field:planned-quantity", "field:production-identity", "field:source-fact-identity", "field:source-namespace", "field:unit"]);
    expect(OPERATIONS_PLANNED_PRODUCTION_OPTIONAL_FIELDS).toEqual(["field:scheduled-start-at"]);
    await expect(assertOperationsPlannedProductionSnapshotCoverageV1(await input())).resolves.toMatchObject({ profile_ref: "coverage-profile:operations-planned-production-current-snapshot-v1" });
  });

  it("treats a qualified COMPLETE empty snapshot as a meaningful current universe", async () => {
    await expect(assertOperationsPlannedProductionSnapshotCoverageV1(await input({ production_facts: [] }))).resolves.toBeDefined();
  });

  it("never promotes PARTIAL or INSUFFICIENT coverage", async () => {
    for (const status of ["PARTIAL", "INSUFFICIENT"] as const) await expect(assertOperationsPlannedProductionSnapshotCoverageV1(await input({ coverage: await coverage(status) }))).rejects.toThrow("OPS_PRODUCTION_COVERAGE_COMPLETE_REQUIRED");
  });

  it("requires output availability and never substitutes scheduled start", async () => {
    const fields = OPERATIONS_PLANNED_PRODUCTION_REQUIRED_FIELDS.filter(field => field !== "field:planned-output-available-at");
    await expect(assertOperationsPlannedProductionSnapshotCoverageV1(await input({ coverage: await coverage("COMPLETE", fields) }))).rejects.toThrow("OPS_PRODUCTION_COVERAGE_REQUIRED_FIELDS_NOT_GUARANTEED");
    await expect(assertOperationsPlannedProductionSnapshotCoverageV1(await input({ production_facts: [await fact({ planned_output_available_at: undefined })] }))).rejects.toThrow("OPS_PRODUCTION_COVERAGE_OUTPUT_AVAILABILITY_REQUIRED");
  });

  it("binds exact snapshot, selection, company, scope, tenant and evidence_as_of", async () => {
    const mismatches = [await coverage("COMPLETE", OPERATIONS_PLANNED_PRODUCTION_REQUIRED_FIELDS, scope("company:1", "evidence-selection:2")), await coverage("COMPLETE", OPERATIONS_PLANNED_PRODUCTION_REQUIRED_FIELDS, scope("company:1", "evidence-selection:1", "source-snapshot:2")), await coverage("COMPLETE", OPERATIONS_PLANNED_PRODUCTION_REQUIRED_FIELDS, scope("company:2"))];
    for (const candidate of mismatches) await expect(assertOperationsPlannedProductionSnapshotCoverageV1(await input({ coverage: candidate }))).rejects.toThrow("OPS_PRODUCTION_COVERAGE_CONTEXT_MISMATCH");
    await expect(assertOperationsPlannedProductionSnapshotCoverageV1(await input({ tenant_id: "tenant:2" }))).rejects.toThrow("OPS_PRODUCTION_COVERAGE_CONTEXT_MISMATCH");
  });

  it("rejects forged coverage and incomplete qualification through the universal verifier", async () => {
    const complete = await coverage();
    await expect(assertOperationsPlannedProductionSnapshotCoverageV1(await input({ coverage: { ...complete, qualification_refs: [] } }))).rejects.toThrow("SOURCE_COVERAGE_INTEGRITY_INVALID");
    await expect(assertOperationsPlannedProductionSnapshotCoverageV1(await input({ coverage: { ...complete, capability_digest: "0".repeat(64) } }))).rejects.toThrow("SOURCE_COVERAGE_INTEGRITY_INVALID");
  });

  it("retains single-source fact identity, namespace, provenance and uniqueness boundaries", async () => {
    await expect(assertOperationsPlannedProductionSnapshotCoverageV1(await input({ production_facts: [await fact(), await fact()] }))).rejects.toThrow("OPS_PRODUCTION_COVERAGE_FACT_IDENTITY_DUPLICATE");
    await expect(assertOperationsPlannedProductionSnapshotCoverageV1(await input({ production_facts: [await fact({}, { sourceSystem: "GENERIC_MES" })] }))).rejects.toThrow("OPS_PRODUCTION_COVERAGE_FACT_SOURCE_MISMATCH");
    await expect(assertOperationsPlannedProductionSnapshotCoverageV1(await input({ production_facts: [await fact({}, { companyId: "company:2" })] }))).rejects.toThrow("OPS_PRODUCTION_COVERAGE_FACT_SOURCE_MISMATCH");
  });

  it("allows any governed source profile only when it supplies the same complete capability", async () => {
    for (const profile of ["source-profile:generic-erp", "source-profile:generic-mes", "source-profile:governed-file"]) await expect(assertOperationsPlannedProductionSnapshotCoverageV1(await input({ coverage: await coverage("COMPLETE", OPERATIONS_PLANNED_PRODUCTION_REQUIRED_FIELDS, scope(), profile) }))).resolves.toBeDefined();
    const sapFields = OPERATIONS_PLANNED_PRODUCTION_REQUIRED_FIELDS.filter(field => field !== "field:planned-output-available-at");
    await expect(assertOperationsPlannedProductionSnapshotCoverageV1(await input({ coverage: await coverage("PARTIAL", sapFields, scope(), "source-profile:sap-erp") }))).rejects.toThrow("OPS_PRODUCTION_COVERAGE_COMPLETE_REQUIRED");
  });

  it("rejects hypothetical, authority, tier, commercial and downstream semantic inputs", async () => {
    for (const key of ["scenario", "counterfactual", "chat", "alternative_plan", "optimizer_candidate", "twin_snapshot", "authority_tier", "subscription_tier", "commercial_plan", "credit_balance", "material_feasibility", "realization", "recommendation", "execution"]) await expect(assertOperationsPlannedProductionSnapshotCoverageV1(await input({ [key]: "forbidden" }))).rejects.toThrow("OPS_PRODUCTION_COVERAGE_UNSAFE_INPUT");
  });
});
