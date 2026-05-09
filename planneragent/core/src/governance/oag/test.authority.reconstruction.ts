// core/src/governance/oag/test.authority.reconstruction.ts

import {
  reconstructOrganizationalAuthority
} from "./authority.reconstruction";

// ------------------------------------------------------
// TEST 1 — PUBLIC USER
// ------------------------------------------------------

console.log(
  "TEST_PUBLIC",
  reconstructOrganizationalAuthority({
    authenticated: false
  })
);

// ------------------------------------------------------
// TEST 2 — AUTHENTICATED ONLY
// ------------------------------------------------------

console.log(
  "TEST_AUTHENTICATED",
  reconstructOrganizationalAuthority({
    authenticated: true
  })
);

// ------------------------------------------------------
// TEST 3 — DECLARED AUTHORITY
// ------------------------------------------------------

console.log(
  "TEST_DECLARED",
  reconstructOrganizationalAuthority({
    authenticated: true,
    declared_role: "MANAGER",
    declared_supervisor: "director_001"
  })
);

// ------------------------------------------------------
// TEST 4 — RECONSTRUCTED AUTHORITY
// ------------------------------------------------------

console.log(
  "TEST_RECONSTRUCTED",
  reconstructOrganizationalAuthority({
    authenticated: true,

    declared_role: "MANAGER",
    declared_supervisor: "director_001",

    sponsored: true,
    reciprocal_confirmation: true,

    erp_scope_match: true,
    execution_alignment: true
  })
);

// ------------------------------------------------------
// TEST 5 — FULL VALIDATED
// ------------------------------------------------------

console.log(
  "TEST_VALIDATED",
  reconstructOrganizationalAuthority({
    authenticated: true,

    declared_role: "HEAD_OF_SUPPLY_CHAIN",
    declared_supervisor: "coo_001",

    sponsored: true,
    reciprocal_confirmation: true,

    erp_scope_match: true,
    execution_alignment: true,
    team_alignment: true,
    budget_alignment: true,
    api_scope_match: true
  })
);
