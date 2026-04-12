//core/src/execution/capability.types.ts

export type CapabilityDomain =
  | "SUPPLY_CHAIN"
  | "PRODUCTION"
  | "LOGISTICS"
  | "FINANCE"
  | "AI_TOOLS"
  | "COMMUNICATION";

export type CapabilityLevel =
  | "VISION"
  | "GRADUATE"
  | "JUNIOR"
  | "SENIOR"
  | "PRINCIPAL"
  | "CHARTER";

export type ProviderType =
  | "CLAUDE"
  | "OPENAI"
  | "OSS"
  | "ERP"
  | "API"
  | "INTERNAL";

export interface CapabilityDefinition {
  id: string;
  description: string;
  domain: CapabilityDomain;

  allowedLevels: CapabilityLevel[];

  providers: {
    primary: ProviderType;
    fallback?: ProviderType[];
  };

  executionType: "SYNC" | "ASYNC";

  requiresApproval: boolean;

  estimatedCost?: number;
}