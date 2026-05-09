// core/src/identity/test.authority.drift.ts

import {
  createOrganizationalAuthorityLink
} from "../governance/oag/organizational.authority.link";

import {
  evaluateAuthorityDrift
} from "./organizational.authority.drift";

const link =
  createOrganizationalAuthorityLink({

    tenant_id: "default",

    company_id: "WAL_SIM",

    from_actor_id: "director_001",

    to_actor_id: "planner_001",

    link_type: "DELEGATION",

    authority_scope: [
      "SUPPLY_CHAIN"
    ],

    delegated_execution: true,

    delegated_budget: false,

    validation_state: "VALIDATED",

    reciprocal_confirmation: true
  });

const drifts =
  evaluateAuthorityDrift({

    link,

    runtime: {

      execution_scope: [
        "SUPPLY_CHAIN",
        "FINANCE"
      ],

      budget_scope: true,

      supervisor_confirmed: false,

      erp_scope_match: false
    }
  });

console.log(
  "TEST_AUTHORITY_DRIFT",
  drifts
);