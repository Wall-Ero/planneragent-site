// core/src/decision/optimizer/bomReferenceDecision.ts
// ======================================================
// PlannerAgent — BOM Reference Decision
// Canonical Source of Truth
//
// Purpose
// Represent the explicit SCM choice of which BOM
// reference should be used for optimization when
// divergence exists.
//
// PlannerAgent detects divergence.
// SCM decides reference.
// Optimizer consumes decision.
// ======================================================

export type BomReference = "MASTER" | "PLAN" | "REALITY";

export type BomReferenceDecision = {
  company_id?: string;
  selected_reference: BomReference;
  reason?: string;
  decided_by?: string;
  created_at: string;
};

export function createBomReferenceDecision(params: {
  company_id?: string;
  selected_reference: BomReference;
  reason?: string;
  decided_by?: string;
}): BomReferenceDecision {
  return {
    company_id: params.company_id,
    selected_reference: params.selected_reference,
    reason: params.reason,
    decided_by: params.decided_by,
    created_at: new Date().toISOString(),
  };
}

export function selectBomByDecision(params: {
  decision?: BomReferenceDecision;
  master_bom?: Array<{ parent: string; component: string; ratio: number }>;
  plan_bom?: Array<{ parent: string; component: string; ratio: number }>;
  reality_bom?: Array<{ parent: string; component: string; ratio: number }>;
}): Array<{ parent: string; component: string; ratio: number }> {
  const ref = params.decision?.selected_reference;

  if (ref === "MASTER") return [...(params.master_bom ?? [])];
  if (ref === "PLAN") return [...(params.plan_bom ?? [])];
  if (ref === "REALITY") return [...(params.reality_bom ?? [])];

  return [];
}