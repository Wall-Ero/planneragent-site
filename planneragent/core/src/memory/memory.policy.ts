// core/src/memory/memory.policy.ts
// =================================
// PlannerAgent — Memory Policy
// Canonical Snapshot · Source of Truth
// =================================

import type {
  MemoryAccessPolicy,
  MemoryDomain,
  MemoryReadPolicy,
  MemoryWritePolicy
} from "./contracts.memory";

export function resolveMemoryWritePolicy(
  plan: string
): MemoryWritePolicy {

  const normalized =
    String(plan).toUpperCase();

  const mapping: Record<string, MemoryDomain> = {
    VISION: "OBSERVATION",
    GRADUATE: "AI_GOVERNANCE",
    JUNIOR: "DECISION",
    SENIOR: "EXECUTION",
    PRINCIPAL: "IMPROVEMENT",
    CHARTER: "CHARTER"
  };

  const write_domain =
    mapping[normalized];

  if (!write_domain) {
    return {
      allowed: false,
      reason: "UNKNOWN_PLAN"
    };
  }

  return {
    allowed: true,
    write_domain
  };
}

export function resolveMemoryReadPolicy(
  plan: string
): MemoryReadPolicy {

  const normalized =
    String(plan).toUpperCase();

  const readable_domains: MemoryDomain[] = [];

  if (normalized === "JUNIOR") {
    readable_domains.push("DECISION");
  }

  if (normalized === "SENIOR") {
    readable_domains.push(
      "DECISION",
      "EXECUTION"
    );
  }

  return {
    allowed: true,
    readable_domains
  };
}

export function resolveMemoryPolicy(
  plan: string
): MemoryAccessPolicy {

  return {
    write: resolveMemoryWritePolicy(plan),
    read: resolveMemoryReadPolicy(plan)
  };
}