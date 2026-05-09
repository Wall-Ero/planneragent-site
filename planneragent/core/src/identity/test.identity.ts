// core/src/identity/test.identity.ts
// ======================================================
// PlannerAgent — Identity Runtime Test
// ======================================================

import {
  createPublicSession,
  createObserveSession
} from "./identity.session";

import {
  createDeclaredAuthority,
  applyDeclaredAuthority
} from "./identity.authority";

import {
  validateDeclaredAuthority,
  validateAuthorityClaim
} from "./identity.validation";

// ======================================================
// TEST 1 — PUBLIC SESSION
// ======================================================

const publicSession =
  createPublicSession();

console.log(
  "TEST_PUBLIC_SESSION",
  publicSession
);

// ======================================================
// TEST 2 — OBSERVE SESSION
// ======================================================

const observeSession =
  createObserveSession({
    actor_id: "planner_001",
    tenant_id: "tenant_demo",
    company_id: "MAMI_SIM"
  });

console.log(
  "TEST_OBSERVE_SESSION",
  observeSession
);

// ======================================================
// TEST 3 — DECLARED AUTHORITY
// ======================================================

const authority =
  createDeclaredAuthority({
    actor_id: "planner_001",

    declared_role: "MANAGER",

    declared_scope: [
      "SUPPLY_CHAIN",
      "PROCUREMENT"
    ],

    declared_supervisor:
      "director_001",

    delegated_execution: true
  });

console.log(
  "TEST_DECLARED_AUTHORITY",
  authority
);

// ======================================================
// TEST 4 — APPLY AUTHORITY
// ======================================================

const enrichedSession =
  applyDeclaredAuthority(
    observeSession,
    authority
  );

console.log(
  "TEST_ENRICHED_SESSION",
  enrichedSession
);

// ======================================================
// TEST 5 — VALIDATION
// ======================================================

const validation =
  validateDeclaredAuthority(
    enrichedSession
  );

console.log(
  "TEST_VALIDATION",
  validation
);

// ======================================================
// TEST 6 — CLAIM VALIDATION
// ======================================================

const claim =
  validateAuthorityClaim(
    enrichedSession
  );

console.log(
  "TEST_CLAIM",
  claim
);