import { describe, expect, it } from "vitest";
import { classifyDatasetDescriptor } from "../../../../core/datasets/datasetClassifier";
import { computeDecisionPressureV2 } from "../../decision/decision.pressure.v2";
import { deriveRealityState } from "../../reality/reality.state";
import { computePlanCoherence } from "../../topology/plan.coherence";
import {
  bindOperationalSignalsToScopeV1,
  createOperationalSignalEvaluationScopeV1,
  verifyOperationalSignalEvaluationScopeV1,
  type OperationalSignalEvaluationScopeInputV1,
} from "../operational.signal.evaluation.scope.v1";

const base = {
  version: 1,
  scope_type: "REQUEST_DATASET",
  request_id: "request-1",
  company_id: "company-1",
  domain: "production",
  evidence_selection_ref: "selection:request-1",
  source_snapshot_ref: "snapshot-1",
} as const satisfies OperationalSignalEvaluationScopeInputV1;

describe("COCKPIT-SCOPE-WU1 operational signal scope binding", () => {
  it("creates deterministic content-free request-dataset identity without claiming company completeness", async () => {
    const first = await createOperationalSignalEvaluationScopeV1(base);
    const second = await createOperationalSignalEvaluationScopeV1({ ...base });
    expect(first).toEqual(second);
    expect(first.scope_id).toMatch(/^operational-signal-scope:sha256:[0-9a-f]{64}$/);
    expect(first).toMatchObject({ company_global_claim: false, grants_execution: false });
    expect(JSON.stringify(first)).not.toMatch(/prompt|erp_rows|credentials|customer_document/i);
  });

  it("binds request, company, evidence as-of, and evaluation time", async () => {
    const scope = await createOperationalSignalEvaluationScopeV1(base);
    await expect(bindOperationalSignalsToScopeV1({
      scope, request_id: base.request_id, company_id: base.company_id,
      evidence_as_of: "2026-08-12T10:00:00.000Z",
      evaluated_at: "2026-08-12T10:00:01.000Z",
    })).resolves.toMatchObject({ version: 1, scope });
  });

  it("supports SKU and supplier entity references without changing attention semantics", async () => {
    for (const [entity_type, entity_ref] of [["SKU", "SKU-1"], ["SUPPLIER", "SUP-1"]] as const) {
      const scope = await createOperationalSignalEvaluationScopeV1({
        ...base, scope_type: "ENTITY", entity: { entity_type, entity_ref },
      });
      expect(scope.entity).toEqual({ entity_type, entity_ref });
    }
  });

  it("supports deterministic critical-subgraph/path identity", async () => {
    const a = await createOperationalSignalEvaluationScopeV1({
      ...base, scope_type: "PATH",
      path: { subgraph_ref: "critical-subgraph-1", seed_refs: ["SKU-B", "SKU-A"] },
    });
    const b = await createOperationalSignalEvaluationScopeV1({
      ...base, scope_type: "PATH",
      path: { subgraph_ref: "critical-subgraph-1", seed_refs: ["SKU-A", "SKU-B"] },
    });
    expect(a).toEqual(b);
  });

  it("rejects tenant, request, target, scope-type, and digest substitution", async () => {
    const entity = await createOperationalSignalEvaluationScopeV1({
      ...base, scope_type: "ENTITY", entity: { entity_type: "SKU", entity_ref: "SKU-1" },
    });
    await expect(verifyOperationalSignalEvaluationScopeV1(entity, {
      request_id: "request-other", company_id: base.company_id,
    })).rejects.toThrow("SCOPE_REQUEST_MISMATCH");
    await expect(verifyOperationalSignalEvaluationScopeV1(entity, {
      request_id: base.request_id, company_id: "company-other",
    })).rejects.toThrow("SCOPE_COMPANY_MISMATCH");
    await expect(verifyOperationalSignalEvaluationScopeV1({
      ...entity, entity: { entity_type: "SKU", entity_ref: "SKU-2" },
    }, base)).rejects.toThrow("SCOPE_DIGEST_MISMATCH");
    await expect(createOperationalSignalEvaluationScopeV1({
      ...base, scope_type: "PATH", entity: { entity_type: "SKU", entity_ref: "SKU-1" },
    } as any)).rejects.toThrow("SCOPE_TYPE_SUBSTITUTION");
    await expect(verifyOperationalSignalEvaluationScopeV1({
      ...entity, scope_digest: "0".repeat(64),
    }, base)).rejects.toThrow("SCOPE_DIGEST_MISMATCH");
  });

  it("distinguishes the same evidence selection under request, entity, and path scopes", async () => {
    const request = await createOperationalSignalEvaluationScopeV1(base);
    const entity = await createOperationalSignalEvaluationScopeV1({
      ...base, scope_type: "ENTITY", entity: { entity_type: "SKU", entity_ref: "SKU-1" },
    });
    const path = await createOperationalSignalEvaluationScopeV1({
      ...base, scope_type: "PATH", path: { subgraph_ref: "graph-1", seed_refs: ["SKU-1"] },
    });
    expect(new Set([request.scope_id, entity.scope_id, path.scope_id]).size).toBe(3);
    expect([request, entity, path].every((x) => x.company_global_claim === false)).toBe(true);
  });

  it("keeps all four mature signal calculations unchanged", async () => {
    const calculate = () => ({
      awareness: classifyDatasetDescriptor({ hasSnapshot: true, hasBehavioralEvents: true, hasStructuralData: false }),
      plan: computePlanCoherence({ orders: [{ id: "O1" }] }),
      reality: deriveRealityState({ realityScore: 0.8, topologyConfidence: 0.8, assumptions: [] }),
      pressure: computeDecisionPressureV2({ problemType: "NONE", correctionEffect: "FULL",
        shortageUnits: 0, demandUnits: 10, inventoryLevel: 20, executionGap: [] }),
    });
    const before = calculate();
    await createOperationalSignalEvaluationScopeV1(base);
    expect(calculate()).toEqual(before);
  });

  it("accepts only an opaque question reference and persists no natural-language question", async () => {
    const scope = await createOperationalSignalEvaluationScopeV1({ ...base, question_ref: "question-ref-1" });
    expect(scope.question_ref).toBe("question-ref-1");
    expect(scope).not.toHaveProperty("question");
    expect(scope).not.toHaveProperty("human_request");
  });
});
