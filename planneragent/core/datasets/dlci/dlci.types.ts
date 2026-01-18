// planneragent/core/datasets/dlci/dlci.types.ts

export type ISODate = string;
export type Id = string;

export type DecisionLayer = "BASIC" | "JUNIOR" | "SENIOR" | "AGI";

export interface DlciCompanyRow {
  companyId: Id;

  // load
  windowDays: number;
  decisionsTotalInWindow: number;
  decisionsCompanyInWindow: number;
  companyLoadPct: number; // 0..100

  // growth
  last7d: number;
  prev7d: number;
  wowGrowthPct: number | null; // null if prev7d=0

  // severity
  status: "NORMAL" | "ATTENTION" | "HIGH_CONCENTRATION" | "STRUCTURAL_RISK";
  reasons: string[];

  // traceability
  computedAt: ISODate;
}

export interface DlciSnapshot {
  metricId: Id;              // uuid
  windowDays: number;        // typically 30
  layer: DecisionLayer;      // usually "JUNIOR" or "SENIOR"
  computedAt: ISODate;

  totals: {
    activeCompaniesInWindow: number;
    decisionsTotalInWindow: number;
    topCompanyId: Id | null;
    topCompanyLoadPct: number | null;
  };

  companies: DlciCompanyRow[]; // sorted desc by companyLoadPct
}
