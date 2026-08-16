import { describe, expect, it } from "vitest";
import {
  createOperationsGovernedFutureSupplyFactV1,
  resolveOperationsCurrentGovernedFutureSupplyVersionV1,
  verifyOperationsGovernedFutureSupplyFactV1,
} from "../cognition/operations.governed.future.supply.fact.v1";

const base = {
  version: 1 as const, tenant_id: "tenant-1", company_id: "company-1", source_namespace: "source:erp-1",
  source_record_ref: "source-record:supply-1-v1", external_commitment_ref: "supply:S1", external_line_ref: "line:1",
  commitment_version_ref: "supply-version:1", item_ref: "operations-item:SKU1",
  quantity: { value: 10, source_unit: "EA" }, available_at: "2026-09-10T10:00:00Z",
  effective_at: "2026-08-16T10:00:00Z", observed_at: "2026-08-16T09:59:00Z", lifecycle: "ACTIVE" as const,
  lifecycle_evidence_ref: "evidence:lifecycle-1", qualification_refs: ["qualification:supply"],
  provenance_refs: ["provenance:supply"], causal_lineage_refs: ["lineage:supply"],
};
const fact = (overrides: Record<string, unknown> = {}) => createOperationsGovernedFutureSupplyFactV1({ ...base, ...overrides } as any);

describe("operations governed future supply source facts", () => {
  it("creates a deterministic recursively immutable request-independent governed fact", async () => {
    const a = await fact(), b = await fact();
    expect(a.fact_id).toBe(b.fact_id);
    expect(Object.isFrozen(a) && Object.isFrozen(a.quantity) && Object.isFrozen(a.causal_lineage_refs)).toBe(true);
    expect(a).not.toHaveProperty("request_id");
    await expect(verifyOperationsGovernedFutureSupplyFactV1(a)).resolves.toBeUndefined();
  });
  it("preserves exact source, item, quantity, unit and distinct knowledge/physical times", async () => {
    const value = await fact();
    expect(value).toMatchObject({ tenant_id: "tenant-1", company_id: "company-1", source_namespace: "source:erp-1",
      external_commitment_ref: "supply:S1", external_line_ref: "line:1", commitment_version_ref: "supply-version:1",
      item_ref: "operations-item:SKU1", quantity: { value: 10, source_unit: "EA" },
      effective_at: "2026-08-16T10:00:00Z", available_at: "2026-09-10T10:00:00Z",
      current_knowledge_fact: true, physical_inventory: false });
  });
  it.each(["source_namespace", "external_commitment_ref", "commitment_version_ref", "item_ref"])("requires exact %s", async field => {
    await expect(fact({ [field]: "" })).rejects.toThrow();
  });
  it("requires positive quantity, unit, valid available_at and valid effective_at", async () => {
    await expect(fact({ quantity: { value: 0, source_unit: "EA" } })).rejects.toThrow("OPS_FUTURE_SUPPLY_QUANTITY_INVALID");
    await expect(fact({ quantity: { value: 1, source_unit: "" } })).rejects.toThrow("OPS_FUTURE_SUPPLY_UNIT_REQUIRED");
    await expect(fact({ available_at: "bad" })).rejects.toThrow("OPS_FUTURE_SUPPLY_AVAILABLE_AT_INVALID");
    await expect(fact({ effective_at: "bad" })).rejects.toThrow("OPS_FUTURE_SUPPLY_EFFECTIVE_AT_INVALID");
  });
  it("creates distinct immutable historical facts for ETA and quantity revisions", async () => {
    const original = await fact(), eta = await fact({ source_record_ref: "source-record:supply-1-v2", commitment_version_ref: "supply-version:2", supersedes_version_ref: "supply-version:1", available_at: "2026-09-14T10:00:00Z" }),
      quantity = await fact({ source_record_ref: "source-record:supply-1-v3", commitment_version_ref: "supply-version:3", supersedes_version_ref: "supply-version:2", quantity: { value: 8, source_unit: "EA" } });
    expect(new Set([original.fact_id, eta.fact_id, quantity.fact_id]).size).toBe(3);
  });
  it("resolves only explicit supersession chains and fails closed on ambiguity", async () => {
    const v1 = await fact(), v2 = await fact({ source_record_ref: "source-record:supply-1-v2", commitment_version_ref: "supply-version:2", supersedes_version_ref: "supply-version:1", effective_at: "2026-08-17T10:00:00Z" });
    const key = { tenant_id: "tenant-1", company_id: "company-1", source_namespace: "source:erp-1", external_commitment_ref: "supply:S1", external_line_ref: "line:1", evidence_as_of: "2026-08-18T10:00:00Z" };
    await expect(resolveOperationsCurrentGovernedFutureSupplyVersionV1([v1, v2], key)).resolves.toMatchObject({ commitment_version_ref: "supply-version:2" });
    const unrelated = await fact({ source_record_ref: "source-record:supply-1-vx", commitment_version_ref: "supply-version:x" });
    await expect(resolveOperationsCurrentGovernedFutureSupplyVersionV1([v1, unrelated], key)).rejects.toThrow("OPS_FUTURE_SUPPLY_CURRENT_VERSION_AMBIGUOUS");
  });
  it.each(["CANCELLED", "SUPERSEDED"] as const)("does not admit governing %s lifecycle as current supply", async lifecycle => {
    const v1 = await fact(), terminal = await fact({ source_record_ref: `source-record:${lifecycle}`, commitment_version_ref: "supply-version:2", supersedes_version_ref: "supply-version:1", lifecycle });
    await expect(resolveOperationsCurrentGovernedFutureSupplyVersionV1([v1, terminal], { tenant_id: "tenant-1", company_id: "company-1", source_namespace: "source:erp-1", external_commitment_ref: "supply:S1", external_line_ref: "line:1", evidence_as_of: "2026-08-18T10:00:00Z" })).resolves.toBeUndefined();
  });
  it("supports exact full realization and rejects partial or unbound realization", async () => {
    const realized = await fact({ lifecycle: "REALIZED", realization: { receipt_event_ref: "movement:receipt-1", realized_quantity: { value: 10, source_unit: "EA" } } });
    expect(realized.realization?.receipt_event_ref).toBe("movement:receipt-1");
    await expect(fact({ lifecycle: "REALIZED", realization: { receipt_event_ref: "movement:receipt-1", realized_quantity: { value: 4, source_unit: "EA" } } })).rejects.toThrow("OPS_FUTURE_SUPPLY_FULL_REALIZATION_REQUIRED");
    await expect(fact({ realization: { receipt_event_ref: "movement:receipt-1", realized_quantity: { value: 10, source_unit: "EA" } } })).rejects.toThrow("OPS_FUTURE_SUPPLY_REALIZATION_LIFECYCLE_MISMATCH");
  });
  it("rejects scenario, optimizer, learned, LLM, baseline and tier contamination", async () => {
    for (const unsafe of [{ scenario_supply: "x" }, { optimizer_supply: "x" }, { counterfactual_supply: "x" }, { learned_eta: "x" }, { llm_eta: "x" }, { baseline_availability: {} }, { authority_tier: "CHARTER" }])
      await expect(fact(unsafe)).rejects.toThrow("OPS_FUTURE_SUPPLY_UNSAFE_INPUT");
  });
  it("namespaces identical external IDs across companies and sources", async () => {
    const a = await fact(), company = await fact({ company_id: "company-2" }), source = await fact({ source_namespace: "source:erp-2" });
    expect(new Set([a.fact_id, company.fact_id, source.fact_id]).size).toBe(3);
  });
  it("rejects forged integrity and grants no recommendation, authority, or execution", async () => {
    const value = await fact();
    await expect(verifyOperationsGovernedFutureSupplyFactV1({ ...value, quantity: { value: 999, source_unit: "EA" } })).rejects.toThrow("OPS_FUTURE_SUPPLY_FACT_INTEGRITY_INVALID");
    expect(value).toMatchObject({ forecast: false, counterfactual: false, recommended: false, executable: false, grants_authority: false, grants_execution: false });
  });
});
