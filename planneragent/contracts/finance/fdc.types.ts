// planneragent/core/src/finance/fdc.types.ts

export type DecisionLayer = "JUNIOR" | "SENIOR" | "SSC" | "AGI";
export type OrdStatus = "BLOCKED" | "PARTIAL" | "OPERATIONAL";

export type FinancialIntent =
  | "SPEND"
  | "RESERVE"
  | "INVEST"
  | "TRANSFER"
  | "COMMIT_CONTRACT"
  | "DELEGATE_BUDGET";

export type ApprovalMode = "EXPLICIT" | "DELEGATED" | "POLICY_DRIVEN";

export type FdcStatus =
  | "PROPOSED"
  | "APPROVED"
  | "COMMITTED"
  | "EXECUTED"
  | "REVOKED"
  | "EXPIRED";

export interface FinancialDecisionCommitV1 {
  fdcId: string; // uuid
  generatedAt: string; // ISO
  companyId: string;

  decisionRef: {
    decisionId: string; // uuid
    decisionLayer: DecisionLayer;
  };

  financialIntent: FinancialIntent;

  budgetAuthority: {
    owner: string; // CFO / Founder / Board / Director
    limit: number;
    approvalMode: ApprovalMode;
  };

  amount: number;
  currency: string; // "EUR"

  status: FdcStatus;

  scope: {
    purpose: string;
    constraints: string[];
  };

  trace: {
    ordStatus: OrdStatus;
    fdgPolicyVersion: string;
    dlciVersion?: string;
  };

  signatures: {
    system: string; // signature of commit payload hash
    human: string;  // signer id / signature id
  };

  audit?: {
    previousFdcId?: string;
    notes?: string;
  };

  // required for runtime safety
  idempotencyKey: string;
  requestId?: string;
  actorUserId?: string;
}
