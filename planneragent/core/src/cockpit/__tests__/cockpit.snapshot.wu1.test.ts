import { describe, expect, it } from "vitest";
import { bindOperationalSignalsToScopeV1, createOperationalSignalEvaluationScopeV1 } from "../operational.signal.evaluation.scope.v1";
import { buildOperationalCockpitSnapshotV1, type BuildOperationalCockpitSnapshotV1Input } from "../operational.cockpit.snapshot.v1";

const asOf = "2026-08-12T09:00:00.000Z";
const evaluated = "2026-08-12T10:00:00.000Z";

async function input(scope_type: "REQUEST_DATASET" | "ENTITY" | "PATH" = "REQUEST_DATASET") {
  const scope = await createOperationalSignalEvaluationScopeV1({
    version: 1, scope_type, request_id: "request-1", company_id: "company-1", domain: "supply_chain",
    evidence_selection_ref: "evidence-selection:abc", source_snapshot_ref: "source-snapshot:def",
    question_ref: "question:opaque-1",
    ...(scope_type === "ENTITY" ? { entity: { entity_type: "SKU" as const, entity_ref: "sku:1" } } : {}),
    ...(scope_type === "PATH" ? { path: { subgraph_ref: "subgraph:1", seed_refs: ["sku:1", "supplier:1"] } } : {}),
  });
  const evaluation_scope = await bindOperationalSignalsToScopeV1({
    scope, request_id: "request-1", company_id: "company-1", evidence_as_of: asOf, evaluated_at: evaluated,
  });
  return {
    request_id: "request-1", company_id: "company-1", domain: "supply_chain", evaluation_scope,
    data_awareness: "STRUCTURAL" as const,
    plan: { level: "COHERENT" as const, source: "MASTER" as const, confidence: 0.91, score: 0.88, quality: "HIGH" as const, quality_score: 0.84 },
    reality: { state: "STABLE" as const, confidence: 0.92, reasons: ["reality_behavior_consistent"] },
    decision_pressure: { level: "LOW" as const, pressure_type: "NONE" as const },
  } satisfies BuildOperationalCockpitSnapshotV1Input;
}

describe("COCKPIT-SNAPSHOT-WU1", () => {
  it.each(["REQUEST_DATASET", "ENTITY", "PATH"] as const)("constructs immutable %s snapshots", async (kind) => {
    const snapshot = await buildOperationalCockpitSnapshotV1(await input(kind));
    expect(snapshot.evaluation_scope.scope.scope_type).toBe(kind);
    expect(snapshot.company_global_claim).toBe(false);
    expect(snapshot.grants_execution).toBe(false);
    expect(snapshot.observational_only).toBe(true);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.signals.plan)).toBe(true);
  });

  it("retains exact entity/path references and opaque question reference", async () => {
    const entity = await buildOperationalCockpitSnapshotV1(await input("ENTITY"));
    const path = await buildOperationalCockpitSnapshotV1(await input("PATH"));
    expect(entity.evaluation_scope.scope.entity).toEqual({ entity_type: "SKU", entity_ref: "sku:1" });
    expect(path.evaluation_scope.scope.path).toEqual({ subgraph_ref: "subgraph:1", seed_refs: ["sku:1", "supplier:1"] });
    expect(path.question_ref).toBe("question:opaque-1");
    expect(entity.snapshot_id).not.toBe(path.snapshot_id);
  });

  it("is deterministic and changes digest for every material semantic input", async () => {
    const base = await input();
    const first = await buildOperationalCockpitSnapshotV1(base);
    const second = await buildOperationalCockpitSnapshotV1(base);
    expect(second.snapshot_digest).toBe(first.snapshot_digest);
    expect(second.snapshot_id).toBe(first.snapshot_id);
    const variants: BuildOperationalCockpitSnapshotV1Input[] = [
      { ...base, data_awareness: "BEHAVIORAL" },
      { ...base, plan: { ...base.plan, score: 0.7 } },
      { ...base, reality: { ...base.reality, state: "UNSTABLE" } },
      { ...base, decision_pressure: { level: "HIGH", pressure_type: "EXECUTION" } },
      { ...base, evaluation_scope: { ...base.evaluation_scope, evidence_as_of: "2026-08-12T08:00:00.000Z" } },
      await input("ENTITY"),
    ];
    for (const variant of variants) {
      expect((await buildOperationalCockpitSnapshotV1(variant)).snapshot_digest).not.toBe(first.snapshot_digest);
    }
  });

  it.each(["SNAPSHOT", "BEHAVIORAL", "STRUCTURAL"] as const)("retains Data Awareness %s only", async (state) => {
    const base = await input();
    const snapshot = await buildOperationalCockpitSnapshotV1({ ...base, data_awareness: state });
    expect(snapshot.signals.data_awareness).toBe(state);
    expect(JSON.stringify(snapshot)).not.toMatch(/topologyConfidence|\"LOW\".*data_awareness/);
  });

  it.each(["STABLE", "SHIFTING", "UNSTABLE", "ASSUMED"] as const)("retains Reality %s without metrics or historical states", async (state) => {
    const base = await input();
    const snapshot = await buildOperationalCockpitSnapshotV1({ ...base, reality: { state, confidence: 0.72, reasons: ["reason_code"] } });
    expect(snapshot.signals.reality).toEqual({ state, confidence: 0.72, reasons: ["reason_code"] });
    expect(snapshot.signals.reality).not.toHaveProperty("metrics");
    expect(JSON.stringify(snapshot.signals.reality)).not.toMatch(/ALIGNED|DRIFTING|MISALIGNED/);
  });

  it("preserves the complete frozen Plan and Decision Pressure shapes independently", async () => {
    const base = await input();
    const snapshot = await buildOperationalCockpitSnapshotV1({
      ...base, data_awareness: "SNAPSHOT",
      reality: { state: "ASSUMED", confidence: 0.45, reasons: ["reality_score_below_threshold"] },
      decision_pressure: { level: "HIGH", pressure_type: "DATA_QUALITY", blocked_reason: "UNRELIABLE_REALITY" },
    });
    expect(snapshot.signals.plan).toEqual(base.plan);
    expect(snapshot.signals.decision_pressure).toEqual({ level: "HIGH", pressure_type: "DATA_QUALITY", blocked_reason: "UNRELIABLE_REALITY" });
    expect(snapshot.signals.data_awareness).toBe("SNAPSHOT");
    expect(snapshot.signals.reality.state).toBe("ASSUMED");
  });

  it("contains only content-free operational attribution and no authority surface", async () => {
    const snapshot = await buildOperationalCockpitSnapshotV1(await input());
    const json = JSON.stringify(snapshot);
    for (const forbidden of ["erp_rows", "question_text", "prompt", "credential", "provider_response", "business_payload", "movements", "bom", "optimizer", "execution_allowed", "authority_grant"]) {
      expect(json.toLowerCase()).not.toContain(forbidden);
    }
    expect(snapshot).not.toHaveProperty("execute");
    expect(snapshot).not.toHaveProperty("governance");
  });

  it("fails closed on mismatches, invalid signals, and time inversion", async () => {
    const base = await input();
    await expect(buildOperationalCockpitSnapshotV1({ ...base, request_id: "other" })).rejects.toThrow("SCOPE_REQUEST_MISMATCH");
    await expect(buildOperationalCockpitSnapshotV1({ ...base, company_id: "other" })).rejects.toThrow("SCOPE_COMPANY_MISMATCH");
    await expect(buildOperationalCockpitSnapshotV1({ ...base, domain: "other" })).rejects.toThrow("COCKPIT_SNAPSHOT_DOMAIN_MISMATCH");
    await expect(buildOperationalCockpitSnapshotV1({ ...base, data_awareness: "LOW" as never })).rejects.toThrow("AWARENESS_INVALID");
    await expect(buildOperationalCockpitSnapshotV1({ ...base, plan: { ...base.plan, score: 2 } })).rejects.toThrow("PLAN_SCORE_INVALID");
    await expect(buildOperationalCockpitSnapshotV1({ ...base, reality: { ...base.reality, state: "ALIGNED" as never } })).rejects.toThrow("REALITY_INVALID");
    await expect(buildOperationalCockpitSnapshotV1({ ...base, decision_pressure: { level: "CRITICAL" as never, pressure_type: "NONE" } })).rejects.toThrow("PRESSURE_INVALID");
    await expect(buildOperationalCockpitSnapshotV1({ ...base, evaluation_scope: { ...base.evaluation_scope, evidence_as_of: "2026-08-12T11:00:00.000Z" } })).rejects.toThrow("TIME_INVALID");
  });
});
