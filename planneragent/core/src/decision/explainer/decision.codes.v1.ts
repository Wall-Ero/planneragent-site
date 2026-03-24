// core/src/decision/explainer/decision.codes.v1.ts
// ======================================================
// PlannerAgent — Decision Semantic Codes V1
// Canonical Source of Truth
// ======================================================

export type DecisionCodeCategory =
  | "WHY"
  | "TRADEOFF"
  | "RISK";

export type DecisionCode = {
  code: string;
  category: DecisionCodeCategory;

  // fallback leggibile (no marketing, no storytelling)
  label: string;

  // hint per LLM → come esprimere il concetto
  llm_hint: string;
};

// ======================================================
// WHY CODES
// ======================================================

export const WHY_CODES: DecisionCode[] = [
  {
    code: "ELIMINATES_SHORTAGE",
    category: "WHY",
    label: "Eliminates shortage",
    llm_hint: "removes all unmet demand"
  },
  {
    code: "FULL_SERVICE",
    category: "WHY",
    label: "Ensures full service",
    llm_hint: "achieves full order fulfillment"
  },
  {
    code: "IMPROVES_SERVICE_LEVEL",
    category: "WHY",
    label: "Improves service level",
    llm_hint: "increases service performance compared to baseline"
  },
  {
    code: "REDUCES_LATENESS",
    category: "WHY",
    label: "Reduces lateness",
    llm_hint: "reduces delivery delays"
  },
  {
    code: "STABILIZES_PLAN",
    category: "WHY",
    label: "Stabilizes plan",
    llm_hint: "keeps plan variability low"
  },
  {
    code: "LIMITED_CHURN",
    category: "WHY",
    label: "Limits plan changes",
    llm_hint: "introduces limited and controlled plan adjustments"
  },
  {
    code: "REDUCES_DEPENDENCY",
    category: "WHY",
    label: "Reduces dependency",
    llm_hint: "avoids reliance on a single supply source"
  },
  {
    code: "BALANCES_SUPPLY",
    category: "WHY",
    label: "Balances supply",
    llm_hint: "distributes supply across available options"
  },
  {
    code: "USES_EXISTING_CAPACITY",
    category: "WHY",
    label: "Uses existing capacity",
    llm_hint: "leverages available internal capacity"
  },
  {
    code: "MINIMIZES_DISRUPTION",
    category: "WHY",
    label: "Minimizes disruption",
    llm_hint: "limits operational disruption"
  }
];

// ======================================================
// TRADEOFF CODES
// ======================================================

export const TRADEOFF_CODES: DecisionCode[] = [
  {
    code: "HIGHER_COST",
    category: "TRADEOFF",
    label: "Higher cost",
    llm_hint: "increases operational cost compared to alternatives"
  },
  {
    code: "INCREASED_PLAN_CHURN",
    category: "TRADEOFF",
    label: "Higher plan churn",
    llm_hint: "requires multiple plan adjustments"
  },
  {
    code: "MULTI_ACTION_COMPLEXITY",
    category: "TRADEOFF",
    label: "Multi-action complexity",
    llm_hint: "relies on multiple coordinated actions"
  },
  {
    code: "CAPACITY_STRESS",
    category: "TRADEOFF",
    label: "Capacity stress",
    llm_hint: "pushes capacity closer to limits"
  },
  {
    code: "INVENTORY_BUILDUP",
    category: "TRADEOFF",
    label: "Inventory buildup",
    llm_hint: "may increase inventory levels"
  },
  {
    code: "REDUCED_FLEXIBILITY",
    category: "TRADEOFF",
    label: "Reduced flexibility",
    llm_hint: "limits future adjustment options"
  },
  {
    code: "LONGER_RECOVERY_PATH",
    category: "TRADEOFF",
    label: "Longer recovery path",
    llm_hint: "requires more steps to revert or adjust later"
  }
];

// ======================================================
// RISK CODES
// ======================================================

export const RISK_CODES: DecisionCode[] = [
  {
    code: "ISOLATED_TOPOLOGY",
    category: "RISK",
    label: "Isolated topology",
    llm_hint: "operates on supply nodes with limited redundancy"
  },
  {
    code: "SUPPLY_ASSUMPTION",
    category: "RISK",
    label: "Supply assumption",
    llm_hint: "depends on supply conditions that may not fully materialize"
  },
  {
    code: "CAPACITY_OVERLOAD",
    category: "RISK",
    label: "Capacity overload",
    llm_hint: "may exceed available production capacity"
  },
  {
    code: "DATA_INCOMPLETE",
    category: "RISK",
    label: "Incomplete data",
    llm_hint: "based on incomplete or partial data visibility"
  },
  {
    code: "DEMAND_VARIABILITY",
    category: "RISK",
    label: "Demand variability",
    llm_hint: "sensitive to demand fluctuations"
  },
  {
    code: "SINGLE_SUPPLIER_DEPENDENCY",
    category: "RISK",
    label: "Single supplier dependency",
    llm_hint: "depends heavily on one supplier"
  },
  {
    code: "LEAD_TIME_UNCERTAINTY",
    category: "RISK",
    label: "Lead time uncertainty",
    llm_hint: "lead times may vary from expected values"
  },
  {
    code: "EXECUTION_RISK",
    category: "RISK",
    label: "Execution risk",
    llm_hint: "execution may not follow plan precisely"
  }
];

// ======================================================
// LOOKUP MAP (FAST ACCESS)
// ======================================================

export const DECISION_CODE_MAP: Record<string, DecisionCode> = [
  ...WHY_CODES,
  ...TRADEOFF_CODES,
  ...RISK_CODES
].reduce((acc, c) => {
  acc[c.code] = c;
  return acc;
}, {} as Record<string, DecisionCode>);