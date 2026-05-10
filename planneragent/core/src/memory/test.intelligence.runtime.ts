// core/src/memory/test.intelligence.runtime.ts

import {
  createRuntimeIntelligenceTrace
} from "./intelligence.trace.runtime";

const trace =
  createRuntimeIntelligenceTrace({

    tenant_id: "default",

    company_id: "MAMI_SIM",

    context_id: "supply_chain",

    authority_layer: "SENIOR",

    operational_scope: "SUPPLY_CHAIN",

    provider: "OPENROUTER",

    model: "openai/gpt-4o-mini",

    role: "DECISION_SUPPORT",

    policy_scope: "DELEGATED_EXECUTION",

    execution_scope: "REALITY_CORRECTION",

    execution_contribution: "INDIRECT",

    metadata: {
      orchestrator: "v2",
      source: "optimizer"
    }
  });

console.log(
  "TEST_RUNTIME_INTELLIGENCE_TRACE",
  trace
);