// core/src/memory/memory.classifier.ts
// =================================
// PlannerAgent — Memory Classifier
// Canonical Snapshot · Source of Truth
// =================================

import type {
  MemoryDomain,
  MemorySubtype,
  MemoryWriteRequest
} from "./contracts.memory";

export interface ResolvedMemoryType {
  domain: MemoryDomain;
  subtype: MemorySubtype;
}

export function resolveMemoryType(
  input: {
    plan: string;
    intent?: string;
    anomaly?: boolean;
  }
): ResolvedMemoryType {

  const plan =
    String(input.plan).toUpperCase();

  const intent =
    String(input.intent ?? "")
      .toUpperCase();

  // --------------------------------------------------
  // VISION
  // --------------------------------------------------

  if (plan === "VISION") {

    if (intent === "SIMULATE") {
      return {
        domain: "OBSERVATION",
        subtype: "SIMULATION_SNAPSHOT"
      };
    }

    return {
      domain: "OBSERVATION",
      subtype: "SIGNAL_OBSERVATION"
    };
  }

  // --------------------------------------------------
  // GRADUATE
  // --------------------------------------------------

  if (plan === "GRADUATE") {

    if (input.anomaly) {
      return {
        domain: "AI_GOVERNANCE",
        subtype: "AI_POLICY_VIOLATION"
      };
    }

    return {
      domain: "AI_GOVERNANCE",
      subtype: "AI_TOOL_USAGE"
    };
  }

  // --------------------------------------------------
  // JUNIOR
  // --------------------------------------------------

  if (plan === "JUNIOR") {

    if (input.anomaly) {
      return {
        domain: "DECISION",
        subtype: "ANOMALY_DECISION"
      };
    }

    return {
      domain: "DECISION",
      subtype: "APPROVED_DECISION"
    };
  }

  // --------------------------------------------------
  // SENIOR
  // --------------------------------------------------

  if (plan === "SENIOR") {

    if (intent === "RECOVER") {
      return {
        domain: "EXECUTION",
        subtype: "RECOVERY_EXECUTION"
      };
    }

    if (intent === "HANDLE_EXCEPTION") {
      return {
        domain: "EXECUTION",
        subtype: "EXCEPTION_HANDLING"
      };
    }

    return {
      domain: "EXECUTION",
      subtype: "DELEGATED_EXECUTION"
    };
  }

  // --------------------------------------------------
  // PRINCIPAL
  // --------------------------------------------------

  if (plan === "PRINCIPAL") {

    return {
      domain: "IMPROVEMENT",
      subtype: "SYSTEMIC_IMPROVEMENT"
    };
  }

  // --------------------------------------------------
  // CHARTER
  // --------------------------------------------------

  if (plan === "CHARTER") {

    if (input.anomaly) {
      return {
        domain: "CHARTER",
        subtype: "AUTHORITY_VIOLATION"
      };
    }

    return {
      domain: "CHARTER",
      subtype: "AUTONOMY_DRIFT"
    };
  }

  // --------------------------------------------------
  // FALLBACK
  // --------------------------------------------------

  return {
    domain: "OBSERVATION",
    subtype: "SIGNAL_OBSERVATION"
  };
}

export function classifyMemoryWrite(
  input: {
    tenant_id?: string;
    company_id?: string;
    context_id?: string;

    plan: string;
    intent?: string;

    anomaly?: boolean;

    payload: unknown;
  }
): MemoryWriteRequest {

  const resolved =
    resolveMemoryType({
      plan: input.plan,
      intent: input.intent,
      anomaly: input.anomaly
    });

  return {
    tenant_id:
      input.tenant_id ?? "default",

    company_id:
      input.company_id ?? "unknown",

    context_id:
      input.context_id ?? "unknown",

    plan: input.plan,

    intent: input.intent,

    domain: resolved.domain,

    subtype: resolved.subtype,

    payload: input.payload
  };
}