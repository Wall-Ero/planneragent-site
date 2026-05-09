// core/src/identity/identity.session.ts
// ======================================================
// PlannerAgent — Identity Session
// Canonical Source of Truth
// ======================================================

import type {
  IdentitySessionV1,
  IdentitySessionMode
} from "./identity.types";

// ======================================================
// CREATE PUBLIC SESSION
// ======================================================

export function createPublicSession(): IdentitySessionV1 {

  return {
    session_id: crypto.randomUUID(),

    authenticated: false,

    mode: "PUBLIC",

    authority_state: "UNDECLARED",

    authority_confidence: 0,

    runtime_capabilities: [
      "CHAT_ONLY"
    ],

    governance_flags: [
      "PUBLIC_ACCESS",
      "NO_DATA_ACCESS",
      "NO_EXECUTION"
    ],

    created_at: new Date().toISOString()
  };
}

// ======================================================
// CREATE OBSERVE SESSION
// ======================================================

export function createObserveSession(
  input: {
    actor_id: string;

    tenant_id?: string;
    company_id?: string;
  }
): IdentitySessionV1 {

  return {
    session_id: crypto.randomUUID(),

    actor_id: input.actor_id,

    tenant_id: input.tenant_id,
    company_id: input.company_id,

    authenticated: true,

    mode: "OBSERVE",

    authority_state: "UNDECLARED",

    authority_confidence: 0.2,

    runtime_capabilities: [
      "UPLOAD_DATA",
      "OBSERVE_REALITY"
    ],

    governance_flags: [
      "AUTHENTICATED",
      "VISION_ONLY"
    ],

    created_at: new Date().toISOString()
  };
}

// ======================================================
// SESSION MODE RESOLVER
// ======================================================

export function resolveSessionMode(
  input: {
    plan?: string;
  }
): IdentitySessionMode {

  switch (input.plan) {

    case "VISION":
      return "OBSERVE";

    case "GRADUATE":
      return "GOVERN_AI";

    case "JUNIOR":
      return "ADVISORY";

    case "SENIOR":
      return "DELEGATED";

    case "CHARTER":
      return "CONSTITUTIONAL";

    default:
      return "PUBLIC";
  }
}