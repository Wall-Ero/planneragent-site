// ==========================================
// Sandbox Contracts v1
// ==========================================

// ------------------------------------------
// ID Types
// ------------------------------------------

export type SandboxScenarioId = string;

// ------------------------------------------
// Input Scenario (what Sandbox evaluates)
// ------------------------------------------

export interface SandboxScenarioInput {
  scenarioId: SandboxScenarioId;

  feasible: boolean;

  // Metrics used as reference (baseline plan)
  baselineMetrics: {
    lateness_days_weighted: number;
    late_orders: number;
    inventory_negatives_count: number;
    plan_churn_index: number;
    cost_proxy: number;
    [key: string]: number;
  };

  // Metrics produced by scenario simulation
  scenarioMetrics: {
    lateness_days_weighted: number;
    late_orders: number;
    inventory_negatives_count: number;
    plan_churn_index: number;
    cost_proxy: number;
    [key: string]: number;
  };

  // DQM weights (explicit, governance-safe)
  weights: {
    service: number;
    stability: number;
    cost: number;
  };
}

// ------------------------------------------
// Single Scenario Result
// ------------------------------------------

export interface SandboxScenarioResult {
  scenarioId: SandboxScenarioId;

  feasible: boolean;

  // Deterministic score (source of truth)
  dqm: {
    normalized: {
      service: number;
      stability: number;
      cost: number;
    };
    score: number;
  };

  // Optional — raw LLM outputs (audit / debug)
  llm?: Array<{
    callId: string;
    provider: string;
    model: string;
    ok: boolean;
    text?: string;
    error?: string;
    latencyMs?: number;
  }>;

  // Assigned by orchestrator
  rank?: number;
}

// ------------------------------------------
// Aggregated Output (multi-scenario)
// ------------------------------------------

export interface SandboxEvaluationSummary {
  evaluatedAt: string; // ISO-8601

  baselineScenarioId: SandboxScenarioId;

  results: SandboxScenarioResult[];

  bestScenarioId?: SandboxScenarioId;

  notes?: string;
}

export interface SandboxOrchestratorConfig {
  baselineScenarioId: SandboxScenarioId;
}

// ===============================
// Ranked result
// ===============================
export interface SandboxScenarioRankedResult
  extends SandboxScenarioResult {
  rank: number;
}
