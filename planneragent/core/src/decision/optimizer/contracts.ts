// core/src/decision/optimizer/contracts.ts
// ======================================================
// PlannerAgent — Optimizer v1 Contracts
// Canonical Source of Truth
// ======================================================

export type PlanTier = "VISION" | "GRADUATE" | "JUNIOR" | "SENIOR" | "PRINCIPAL" | "CHARTER";

export type OptimizerBudget = {
  maxMillis: number;
  maxEvals: number;
  allowMilp?: boolean; // v1 stub only
};

export type ConstraintsHint = {
  // "messy reality" knobs
  allowSplitAcrossSuppliers?: boolean; // v1: not used yet (reserved)
  allowEarlyRelease?: boolean; // v1: allows early supply creation (production/expedite) before nominal
  maxRescheduleDays?: number; // cap shift on delivery dates
  maxExpeditePercent?: number; // cap expedite qty vs shortage
  freezeHorizonDays?: number; // stability fence (no reschedule inside)
};

export type ObjectiveWeights = {
  // Higher weights => more important (score is lower-is-better)
  lateness: number; // penalize rescheduling later
  shortage: number; // penalize remaining shortages/backlog
  inventory: number; // penalize extra inventory (v1 proxy)
  stability: number; // penalize action count and magnitude
  cost: number; // penalize expedite / production adjustments
  service: number; // penalize service loss (v1 proxy)
};

export type OptimizerInput = {
  requestId: string;
  plan: PlanTier;

  asOf: string; // ISO date
  orders: any[];
  inventory: any[];
  movements: any[];

  baseline_metrics: Record<string, number>;
  scenario_metrics: Record<string, number>;
  constraints_hint?: ConstraintsHint;

  dlSignals?: Record<string, number>;
  weights?: Partial<ObjectiveWeights>;
  budget?: Partial<OptimizerBudget>;
};

export type Action =
  | {
      kind: "RESCHEDULE_DELIVERY";
      orderId: string;
      shiftDays: number; // positive => later
      reason?: string;
    }
  | {
      kind: "EXPEDITE_SUPPLIER";
      sku: string;
      qty: number;
      costFactor: number; // >= 1
      supplierId?: string;
      reason?: string;
    }
  | {
      kind: "SHORT_TERM_PRODUCTION_ADJUST";
      sku: string;
      qty: number;
      availableInDays: number; // 0 means immediate
      costFactor: number; // >= 1
      reason?: string;
    };

export type CandidatePlan = {
  id: string;
  actions: Action[];

  feasibleHard: boolean;
  softViolations: string[];

  kpis: Record<string, number>;
  score: number;

  evidence: {
    constraintsUsed: Required<ConstraintsHint>;
    weightsUsed: Required<ObjectiveWeights>;
    evalSteps: string[];
  };
};

export type OptimizerResult = {
  ok: boolean;
  best: CandidatePlan;
  candidates: CandidatePlan[];
  meta: {
    engine: string;
    evalCount: number;
    millis: number;
    deterministicSeed: string;
  };
};
