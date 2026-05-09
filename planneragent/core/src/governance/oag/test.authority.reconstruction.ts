// core/src/governance/oag/test.authority.reconstruction.ts

import {
  createOrganizationalAuthorityLink
} from "./organizational.authority.link";

import {
  reconstructOrganizationalAuthority
} from "./organizational.authority.reconstruction";

// ======================================================
// TEST 1 — DECLARED
// ======================================================

const declaredLink =
  createOrganizationalAuthorityLink({

    tenant_id: "default",

    company_id: "MAMI_SIM",

    from_actor_id: "director_001",

    to_actor_id: "planner_001",

    link_type: "REPORTING_LINE",

    authority_scope: [
      "SUPPLY_CHAIN"
    ]
  });

const declared =
  reconstructOrganizationalAuthority([
    declaredLink
  ]);

console.log(
  "TEST_DECLARED",
  declared
);

// ======================================================
// TEST 2 — RECONSTRUCTED
// ======================================================

const reconstructedLink =
  createOrganizationalAuthorityLink({

    tenant_id: "default",

    company_id: "MAMI_SIM",

    from_actor_id: "director_001",

    to_actor_id: "planner_001",

    link_type: "DELEGATION",

    authority_scope: [
      "SUPPLY_CHAIN",
      "PROCUREMENT"
    ],

    delegated_execution: true,

    reciprocal_confirmation: true,

    validation_state:
      "VALIDATED",

    authority_confidence: 0.4
  });

const reconstructed =
  reconstructOrganizationalAuthority([
    reconstructedLink
  ]);

console.log(
  "TEST_RECONSTRUCTED",
  reconstructed
);

// ======================================================
// TEST 3 — VALIDATED
// ======================================================

const validatedLink =
  createOrganizationalAuthorityLink({

    tenant_id: "default",

    company_id: "MAMI_SIM",

    from_actor_id: "board_001",

    to_actor_id: "director_001",

    link_type: "BUDGET_AUTHORITY",

    authority_scope: [
      "GLOBAL_OPERATIONS"
    ],

    delegated_execution: true,

    delegated_budget: true,

    reciprocal_confirmation: true,

    validation_state:
      "VALIDATED",

    authority_confidence: 0.5
  });

const validated =
  reconstructOrganizationalAuthority([
    validatedLink
  ]);

console.log(
  "TEST_VALIDATED",
  validated
);