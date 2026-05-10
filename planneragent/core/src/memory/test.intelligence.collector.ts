// core/src/memory/test.intelligence.collector.ts

import {
  createRuntimeIntelligenceTrace
} from "./intelligence.trace.runtime";

import {
  IntelligenceTraceCollector
} from "./intelligence.trace.collector";

const collector =
  new IntelligenceTraceCollector();

collector.append(
  createRuntimeIntelligenceTrace({
    tenant_id: "default",
    company_id: "MAMI_SIM",
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
  })
);

collector.append(
  createRuntimeIntelligenceTrace({
    tenant_id: "default",
    company_id: "MAMI_SIM",
    context_id: "supply_chain",

    authority_layer: "SENIOR",
    operational_scope: "SUPPLY_CHAIN",

    provider: "RULE_ENGINE",
    role: "GOVERNANCE",

    policy_scope: "GOVERNANCE_ONLY",
    execution_contribution: "INDIRECT",

    metadata: {
      source: "policy.v2"
    }
  })
);

console.log(
  "TEST_INTELLIGENCE_COLLECTOR",
  {
    count: collector.count(),
    traces: collector.all()
  }
);