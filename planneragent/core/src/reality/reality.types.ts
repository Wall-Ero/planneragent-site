// core/src/reality/reality.types.ts
// ======================================================
// PlannerAgent — Reality Types
// Canonical Source of Truth
// ======================================================

export type RealitySource =
  | "observed"
  | "reconstructed"
  | "assumed";

export type DataAwarenessLevel =
  | 0
  | 1
  | 2
  | 3;

export type AssumptionCategory =
  | "demand"
  | "lead_time"
  | "stock"
  | "bom"
  | "capacity"
  | "generic";

export type AssumptionRecord = {
  id: string;
  category: AssumptionCategory;
  value: number | string | boolean;
  source: RealitySource;
  reason: string;
  confidence: number;
  created_at: string;
};

export type ConfidenceMap = {
  stock: number;
  demand: number;
  lead_time: number;
  bom: number;
};

export type ObservedReality = {
  orders?: unknown[];
  inventory?: unknown[];
  movements?: unknown[];
};

export type ReconstructedReality = {
  inferred_bom?: unknown;
  reconstructed_stock?: number;
  inferred_demand_rate?: number;
};

export type AssumedReality = {
  demand_rate?: number;
  lead_time_days?: number;
};

export type RealitySnapshot = {
  observed: ObservedReality;
  reconstructed: ReconstructedReality;
  assumed: AssumedReality;

  awareness_level: DataAwarenessLevel;

  confidence: ConfidenceMap;

  assumptions: AssumptionRecord[];

  created_at: string;
};
