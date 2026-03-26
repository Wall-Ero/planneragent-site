// src/sandbox/signal.engine.v1.ts
// ======================================================
// UI SIGNAL ENGINE — v1 (Deterministic, Typed, No UI Inference)
// Source of Truth
// ======================================================

import type {
  DlEvidenceV2,
  DatasetClassificationResult,
  DatasetDescriptor,
  UiSignalsV1,
  DataAwarenessState,
  PlanState,
  RealityState,
  DecisionPressureState,
} from "./contracts.v2";

import { classifyDatasetDescriptor } from "../../../core/datasets/datasetClassifier";

// -----------------------------
// Helpers
// -----------------------------
function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function classifyDataAwareness(descriptor?: DatasetDescriptor): DatasetClassificationResult {
  const d: DatasetDescriptor =
    descriptor ?? {
      hasSnapshot: true,
      hasBehavioralEvents: false,
      hasStructuralData: false,
    };

  return classifyDatasetDescriptor(d);
}

function mapDataAwarenessState(level: DatasetClassificationResult["level"]): DataAwarenessState {
  switch (level) {
    case "STRUCTURAL":
      return "STRUCTURAL";
    case "BEHAVIORAL":
      return "BEHAVIORAL";
    default:
      return "SNAPSHOT";
  }
}

function mapDecisionPressureState(index01: number): DecisionPressureState {
  const x = clamp01(index01);
  if (x >= 0.7) return "HIGH";
  if (x >= 0.4) return "MEDIUM";
  return "LOW";
}

function mapPlanState(stockoutRisk01: number): PlanState {
  const x = clamp01(stockoutRisk01);
  if (x >= 0.6) return "INCOHERENT";
  if (x >= 0.3) return "SOME_GAPS";
  return "COHERENT";
}

function mapRealityState(driftIndex01: number): RealityState {
  const x = clamp01(driftIndex01);
  if (x >= 0.7) return "MISALIGNED";
  if (x >= 0.4) return "DRIFTING";
  return "ALIGNED";
}

// -----------------------------
// Public API
// -----------------------------
export function buildUiSignalsV1(input: {
  dl: DlEvidenceV2;
  dataset_descriptor?: DatasetDescriptor;
}): { signals: UiSignalsV1; dataset: DatasetClassificationResult } {
  // ==================================================
  // DATASET (SAFE FALLBACK)
  // ==================================================
  const descriptor: DatasetDescriptor =
    input.dataset_descriptor ?? {
      hasSnapshot: true,
      hasBehavioralEvents: false,
      hasStructuralData: false,
    };

  const dataset = classifyDataAwareness(descriptor);

  // ==================================================
  // DL METRICS
  // ==================================================
  const stockoutRisk = clamp01(input.dl.risk_score.stockout_risk);
  const supplierDependency = clamp01(input.dl.risk_score.supplier_dependency);

  const pressureIndex = clamp01(Math.max(stockoutRisk, supplierDependency));
  const driftIndex = clamp01(stockoutRisk * 0.7 + supplierDependency * 0.3);

  // ==================================================
  // BASE SIGNALS
  // ==================================================
  const signals: UiSignalsV1 = {
    data_awareness: mapDataAwarenessState(dataset.level),
    plan: mapPlanState(stockoutRisk),
    reality: mapRealityState(driftIndex),
    decision_pressure: mapDecisionPressureState(pressureIndex),
  };

  // ==================================================
  // REALITY GOVERNANCE OVERRIDE (🔥 CORE LOGIC)
  // ==================================================
  const assumptions = input.dl.assumptions ?? 0;
  const topologyConfidence = input.dl.topologyConfidence?.confidence ?? 1;

  if (assumptions > 0 && topologyConfidence < 0.6) {
    signals.reality = "ASSUMED";
  } else if (topologyConfidence < 0.6) {
    signals.reality = "MISALIGNED";
  } else if (assumptions > 0) {
    signals.reality = "DRIFTING";
  }

  // ==================================================
  // OUTPUT
  // ==================================================
  return { signals, dataset };
}