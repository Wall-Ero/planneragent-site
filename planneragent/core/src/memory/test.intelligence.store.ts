//core/src/memory/test.intelligence.store.ts

import {
  createIntelligenceParticipationTrace
} from "./intelligence.trace";

const trace =
  createIntelligenceParticipationTrace({

    tenant_id: "default",

    company_id: "WAL_SIM",

    context_id: "supply_chain",

    authority_layer: "SENIOR",

    operational_scope: "SUPPLY_CHAIN",

    provider: "INTERNAL_DL",

    role: "RISK_SCORING",

    policy_scope: "DELEGATED_EXECUTION",

    execution_scope: "REALITY_CORRECTION",

    execution_contribution: "INDIRECT",

    metadata: {
      source: "dl.v2"
    }
  });

console.log(
  "TEST_TRACE_READY_FOR_PERSISTENCE",
  trace
);