export type PolicyStatus = "DRAFT" | "ACTIVE" | "RETIRED";

export interface PolicyRecord {
  policyId: string;
  version: number;
  status: PolicyStatus;

  policyJson: any;

  createdAt: string;

  createdBy: string;
  approvedBy?: string;
  changeNote?: string;
}