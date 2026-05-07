// core/src/memory/memory.tables.ts
// =====================================================
// PlannerAgent — Governed Memory Table Resolver
// Canonical Snapshot · Source of Truth
// =====================================================

import type {
  MemoryDomain
} from "./contracts.memory";

// =====================================================
// CANONICAL TABLE MAP
// =====================================================

export const MEMORY_TABLES: Record<MemoryDomain, string> = {

  OBSERVATION:
    "memory_observations",

  AI_GOVERNANCE:
    "memory_ai_governance",

  DECISION:
    "memory_decisions",

  EXECUTION:
    "memory_executions",

  IMPROVEMENT:
    "memory_improvements",

  CHARTER:
    "memory_charter_events",
};

// =====================================================
// GOVERNED TABLE RESOLVER
// =====================================================

export function resolveMemoryTable(
  domain: MemoryDomain
): string {

  const table =
    MEMORY_TABLES[domain];

  if (!table) {
    throw new Error(
      `UNKNOWN_MEMORY_DOMAIN:${domain}`
    );
  }

  return table;
}