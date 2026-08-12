import { describe, expect, it } from "vitest";
import { buildUiSignalsV1 } from "../../sandbox/signal.engine.v1";
import { computeDataAwarenessLevel } from "../../reality/reality.level";
import { computeRealityScore } from "../../reality/reality.score";
import { deriveRealityState } from "../../reality/reality.state";
import { computeDecisionPressureV2 } from "../../decision/decision.pressure.v2";
import { computePlanCoherence } from "../../topology/plan.coherence";
import { mergeInventoryWithReconstruction } from "../../reconstruction/inventory.reconstruction";
import { normalizeMovements } from "../../normalization/movements.normalizer";
import { createOperationalSignalEvaluationScopeV1 } from "../operational.signal.evaluation.scope.v1";

function dl(topologyConfidence: number) {
  return {
    demand_forecast: { p50: 0 },
    risk_score: { stockout_risk: 0.2, supplier_dependency: 0.2 },
    assumptions: 0,
    topologyConfidence: { confidence: topologyConfidence },
    anomaly_signals: [],
  };
}

const descriptors = {
  SNAPSHOT: { hasSnapshot: true, hasBehavioralEvents: false, hasStructuralData: false },
  BEHAVIORAL: { hasSnapshot: true, hasBehavioralEvents: true, hasStructuralData: false },
  STRUCTURAL: { hasSnapshot: true, hasBehavioralEvents: true, hasStructuralData: true },
} as const;

describe("COCKPIT-DA-WU1 public modality and internal topology confidence", () => {
  it.each(Object.entries(descriptors))("preserves %s as the public Data Awareness modality", (expected, descriptor) => {
    const result = buildUiSignalsV1({ dl: dl(0.8), dataset_descriptor: descriptor });
    expect(result.signals.data_awareness).toBe(expected);
    expect(result.dataset.level).toBe(expected);
  });

  it("allows STRUCTURAL modality with weak topology confidence", () => {
    const result = buildUiSignalsV1({ dl: dl(0.2), dataset_descriptor: descriptors.STRUCTURAL });
    expect(result.signals.data_awareness).toBe("STRUCTURAL");
    expect(result.signals.reality).toBe("MISALIGNED");
  });

  it("allows BEHAVIORAL modality with high topology confidence", () => {
    const result = buildUiSignalsV1({ dl: dl(0.9), dataset_descriptor: descriptors.BEHAVIORAL });
    expect(result.signals.data_awareness).toBe("BEHAVIORAL");
    expect(result.signals.reality).toBe("ALIGNED");
  });

  it("binds modality meaning to distinct request and entity evaluation scopes", async () => {
    const common = {
      version: 1 as const, request_id: "request-1", company_id: "company-1",
      domain: "production", source_snapshot_ref: "snapshot-1",
    };
    const requestScope = await createOperationalSignalEvaluationScopeV1({
      ...common, scope_type: "REQUEST_DATASET",
      evidence_selection_ref: "selection:behavioral",
    });
    const entityScope = await createOperationalSignalEvaluationScopeV1({
      ...common, scope_type: "ENTITY", evidence_selection_ref: "selection:snapshot",
      entity: { entity_type: "SKU", entity_ref: "SKU-1" },
    });
    expect(requestScope.scope_id).not.toBe(entityScope.scope_id);
    expect(buildUiSignalsV1({ dl: dl(0.8), dataset_descriptor: descriptors.BEHAVIORAL }).signals.data_awareness)
      .toBe("BEHAVIORAL");
    expect(buildUiSignalsV1({ dl: dl(0.8), dataset_descriptor: descriptors.SNAPSHOT }).signals.data_awareness)
      .toBe("SNAPSHOT");
  });

  it("does not accept observation memory, decision history, learning, or SOI as modality inputs", () => {
    const result = buildUiSignalsV1({ dl: dl(0.8), dataset_descriptor: descriptors.SNAPSHOT });
    expect(result.signals.data_awareness).toBe("SNAPSHOT");
    expect(Object.keys(descriptors.SNAPSHOT)).toEqual([
      "hasSnapshot", "hasBehavioralEvents", "hasStructuralData",
    ]);
  });

  it("preserves awareness-depth contribution and existing Reality behavior", () => {
    expect(computeDataAwarenessLevel({ orders: [{}], inventory: [{}], movements: [{}] })).toBe(3);
    const common = {
      confidence: { stock: 0.8, demand: 0.8, lead_time: 0.8, bom: 0.8 },
      assumptions: [], bom_divergence: {},
    };
    const shallow = computeRealityScore({ ...common, awareness_level: 1 });
    const deep = computeRealityScore({ ...common, awareness_level: 3 });
    expect(deep).toBeGreaterThan(shallow);
    expect(deriveRealityState({ realityScore: 0.8, topologyConfidence: 0.2, assumptions: [] }).realityState)
      .toBe("ASSUMED");
    expect(deriveRealityState({ realityScore: 0.8, topologyConfidence: 0.8,
      assumptions: [{ field: "a" }, { field: "b" }, { field: "c" }] as any }).realityState)
      .toBe("ASSUMED");
  });

  it("keeps Plan Coherence and Decision Pressure V2 deterministic and unchanged", () => {
    expect(computePlanCoherence({ orders: [] })).toMatchObject({ level: "INCOHERENT", score: 0 });
    expect(computeDecisionPressureV2({ problemType: "NONE", correctionEffect: "FULL",
      shortageUnits: 1, demandUnits: 10, inventoryLevel: 20, executionGap: [] }))
      .toMatchObject({ final: "MEDIUM", breakdown: { shortage: "MEDIUM" } });
  });

  it("keeps effective-inventory movement application unchanged", () => {
    const at = "2026-08-12T10:00:00.000Z";
    const movements = normalizeMovements([{ sku: "A", type: "IN", qty: 10, date: at }]);
    expect(mergeInventoryWithReconstruction([{ sku: "A", qty: 5 }], movements, at))
      .toEqual([{ sku: "A", qty: 15 }]);
  });
});
