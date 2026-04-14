// core/src/decision/optimizer/contracts.ts
// ======================================================
// PlannerAgent — Optimizer v1 Contracts
// Canonical Source of Truth
// ======================================================

export type PlanTier =
  | "VISION"
  | "GRADUATE"
  | "JUNIOR"
  | "SENIOR"
  | "PRINCIPAL"
  | "CHARTER";

export type OptimizerBudget = {
  maxMillis: number;
  maxEvals: number;
  allowMilp?: boolean;
};

export type ConstraintsHint = {
  allowSplitAcrossSuppliers?: boolean;
  allowEarlyRelease?: boolean;
  maxRescheduleDays?: number;
  maxExpeditePercent?: number;
  freezeHorizonDays?: number;
};

export type ObjectiveWeights = {
  lateness: number;
  shortage: number;
  inventory: number;
  stability: number;
  cost: number;
  service: number;
  context: number; // assumptions + topology penalty
};

export type OptimizerInput = {
  requestId: string;

  plan: PlanTier;

  asOf: string;

  orders: any[];
  inventory: any[];
  movements: any[];

  baseline_metrics: Record<string, number>;

  scenario_metrics: Record<string, number>;

  constraints_hint?: ConstraintsHint;

  dlSignals?: Record<string, number>;

  weights?: Partial<ObjectiveWeights>;

  budget?: Partial<OptimizerBudget>;

  behaviorProfile?: any; // 🔥 TEMP (poi tipizziamo bene)

  // ======================================================
  // Inferred BOM (deterministic DL layer)
  // ======================================================

  inferredBom?:
    | Array<{
        parent: string;
        component?: string;
        ratio?: number;
        median_ratio?: number;
      }>
    | {
        bom?: Array<{
          parent: string;
          components: Array<{
            component: string;
            median_ratio: number;
            mean_ratio?: number;
            variance?: number;
            samples?: number;
          }>;
          confidence?: number;
        }>;
      };

  // ======================================================
  // Reality Snapshot (Reality Builder)
  // ======================================================

  realitySnapshot?: {
    observed?: unknown;

    reconstructed?: unknown;

    assumed?: unknown;

    awareness_level?: number;

    confidence?: {
      stock?: number;
      demand?: number;
      lead_time?: number;
      bom?: number;
    };

    assumptions?: Array<{
      id: string;
      category: string;
      value: number | string | boolean;
      source: string;
      reason: string;
      confidence: number;
      created_at: string;
    }>;

    created_at?: string;
  };

  // ======================================================
  // Operational Topology
  // ======================================================

  operationalTopology?: {
    nodes: Array<{
      id: string;
      kind: string;
    }>;

    edges: Array<{
      from: string;
      to: string;
      relation: string;
      weight?: number;
    }>;
  };

  // ======================================================
  // Topology confidence (computed by topology engine)
  // ======================================================

  topologyConfidence?: number;

  // ======================================================
  // SCM BOM reference decision
  // ======================================================

  bomReferenceDecision?: {
    company_id?: string;
    selected_reference: "MASTER" | "PLAN" | "REALITY";
    decided_by?: string;
    reason?: string;
  };
};

export type Action =
  | {
      kind: "RESCHEDULE_DELIVERY";
      orderId: string;
      shiftDays: number;
      reason?: string;
    }
  | {
      kind: "EXPEDITE_SUPPLIER";
      sku: string;
      qty: number;
      costFactor: number;
      supplierId?: string;
      reason?: string;
    }
  | {
      kind: "SHORT_TERM_PRODUCTION_ADJUST";
      sku: string;
      qty: number;
      availableInDays: number;
      costFactor: number;
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