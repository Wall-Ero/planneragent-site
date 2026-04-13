// core/src/execution/capability.registry.ts

/* =====================================================
 PATH: core/src/execution/capability.registry.ts
 CANONICAL SNAPSHOT — SOURCE OF TRUTH
 DOMAIN: FULL SCM DECISION SPACE
 VERSION: v1.0 (PlannerAgent Operational Coverage)
===================================================== */

import type { CapabilityDefinition } from "./capability.types";

export const CAPABILITY_REGISTRY = [

/* =====================================================
 1. DEMAND & PLANNING
===================================================== */

{
  id: "FORECAST_DEMAND",
  description: "Generate demand forecast",
  domain: "SUPPLY_CHAIN",
  allowedLevels: ["JUNIOR"],
  providers: { primary: "INTERNAL" },
  executionType: "SYNC",
  requiresApproval: false,
},

{
  id: "DETECT_DEMAND_DRIFT",
  description: "Detect anomalies in demand",
  domain: "SUPPLY_CHAIN",
  allowedLevels: ["VISION", "JUNIOR"],
  providers: { primary: "INTERNAL" },
  executionType: "SYNC",
  requiresApproval: false,
},

{
  id: "REDEFINE_DEMAND_PLAN",
  description: "Adjust demand plan globally",
  domain: "SUPPLY_CHAIN",
  allowedLevels: ["SENIOR"],
  providers: { primary: "INTERNAL" },
  executionType: "SYNC",
  requiresApproval: false,
},

{
  id: "REBALANCE_PLAN",
  description: "Rebalance global supply-demand plan",
  domain: "SUPPLY_CHAIN",
  allowedLevels: ["JUNIOR", "SENIOR"],
  providers: { primary: "INTERNAL" },
  executionType: "SYNC",
  requiresApproval: true,
},

{
  id: "FREEZE_PLAN",
  description: "Freeze planning decisions",
  domain: "SUPPLY_CHAIN",
  allowedLevels: ["SENIOR"],
  providers: { primary: "INTERNAL" },
  executionType: "SYNC",
  requiresApproval: false,
},

{
  id: "UNFREEZE_PLAN",
  description: "Unfreeze planning decisions",
  domain: "SUPPLY_CHAIN",
  allowedLevels: ["SENIOR"],
  providers: { primary: "INTERNAL" },
  executionType: "SYNC",
  requiresApproval: false,
},

/* =====================================================
 2. PROCUREMENT & SUPPLIER MANAGEMENT
===================================================== */

{
  id: "CREATE_PURCHASE_ORDER",
  description: "Create purchase order",
  domain: "SUPPLY_CHAIN",
  allowedLevels: ["JUNIOR"],
  providers: { primary: "ERP" },
  executionType: "ASYNC",
  requiresApproval: true,
},

{
  id: "UPDATE_PURCHASE_ORDER",
  description: "Update purchase order",
  domain: "SUPPLY_CHAIN",
  allowedLevels: ["JUNIOR"],
  providers: { primary: "ERP" },
  executionType: "ASYNC",
  requiresApproval: true,
},

{
  id: "CANCEL_PURCHASE_ORDER",
  description: "Cancel purchase order",
  domain: "SUPPLY_CHAIN",
  allowedLevels: ["JUNIOR"],
  providers: { primary: "ERP" },
  executionType: "ASYNC",
  requiresApproval: true,
},

{
  id: "EXPEDITE_SINGLE_ORDER",
  description: "Expedite a single supplier order",
  domain: "SUPPLY_CHAIN",
  allowedLevels: ["JUNIOR"],
  providers: { primary: "API" },
  executionType: "ASYNC",
  requiresApproval: true,
},

{
  id: "EXPEDITE_SUPPLIER_SYSTEM",
  description: "Expedite supplier globally",
  domain: "SUPPLY_CHAIN",
  allowedLevels: ["SENIOR"],
  providers: { primary: "API" },
  executionType: "ASYNC",
  requiresApproval: false,
},

{
  id: "EVALUATE_SUPPLIER",
  description: "Evaluate supplier performance",
  domain: "SUPPLY_CHAIN",
  allowedLevels: ["SENIOR"],
  providers: { primary: "INTERNAL" },
  executionType: "SYNC",
  requiresApproval: false,
},

{
  id: "RANK_SUPPLIERS",
  description: "Rank suppliers by performance",
  domain: "SUPPLY_CHAIN",
  allowedLevels: ["SENIOR"],
  providers: { primary: "INTERNAL" },
  executionType: "SYNC",
  requiresApproval: false,
},

{
  id: "SELECT_SUPPLIER_STRATEGY",
  description: "Define sourcing strategy",
  domain: "SUPPLY_CHAIN",
  allowedLevels: ["PRINCIPAL"],
  providers: { primary: "INTERNAL" },
  executionType: "SYNC",
  requiresApproval: false,
},

{
  id: "MANAGE_SUPPLIER_RELATION",
  description: "Manage supplier relationships",
  domain: "SUPPLY_CHAIN",
  allowedLevels: ["SENIOR"],
  providers: { primary: "INTERNAL" },
  executionType: "ASYNC",
  requiresApproval: false,
},

/* =====================================================
 3. INVENTORY MANAGEMENT
===================================================== */

{
  id: "ALLOCATE_SINGLE_ORDER",
  description: "Allocate inventory to order",
  domain: "SUPPLY_CHAIN",
  allowedLevels: ["JUNIOR"],
  providers: { primary: "INTERNAL" },
  executionType: "SYNC",
  requiresApproval: true,
},

{
  id: "REALLOCATE_INVENTORY_SYSTEM",
  description: "Reallocate inventory globally",
  domain: "SUPPLY_CHAIN",
  allowedLevels: ["SENIOR"],
  providers: { primary: "INTERNAL" },
  executionType: "SYNC",
  requiresApproval: false,
},

{
  id: "RESERVE_STOCK",
  description: "Reserve stock",
  domain: "SUPPLY_CHAIN",
  allowedLevels: ["JUNIOR"],
  providers: { primary: "INTERNAL" },
  executionType: "SYNC",
  requiresApproval: true,
},

{
  id: "CORRECT_INVENTORY",
  description: "Correct inventory discrepancies",
  domain: "SUPPLY_CHAIN",
  allowedLevels: ["SENIOR"],
  providers: { primary: "ERP" },
  executionType: "ASYNC",
  requiresApproval: false,
},

{
  id: "SET_SAFETY_STOCK_POLICY",
  description: "Adjust safety stock policy",
  domain: "SUPPLY_CHAIN",
  allowedLevels: ["SENIOR", "PRINCIPAL"],
  providers: { primary: "INTERNAL" },
  executionType: "SYNC",
  requiresApproval: false,
},

{
  id: "OPTIMIZE_STOCK_POSITION",
  description: "Optimize stock across locations",
  domain: "SUPPLY_CHAIN",
  allowedLevels: ["SENIOR"],
  providers: { primary: "INTERNAL" },
  executionType: "SYNC",
  requiresApproval: false,
},

/* =====================================================
 4. PRODUCTION
===================================================== */

{
  id: "RESCHEDULE_SINGLE_ORDER",
  description: "Reschedule production order",
  domain: "PRODUCTION",
  allowedLevels: ["JUNIOR"],
  providers: { primary: "ERP" },
  executionType: "ASYNC",
  requiresApproval: true,
},

{
  id: "RESCHEDULE_PRODUCTION_SYSTEM",
  description: "Reschedule production globally",
  domain: "PRODUCTION",
  allowedLevels: ["SENIOR"],
  providers: { primary: "ERP" },
  executionType: "ASYNC",
  requiresApproval: false,
},

{
  id: "OPTIMIZE_CAPACITY",
  description: "Optimize capacity allocation",
  domain: "PRODUCTION",
  allowedLevels: ["SENIOR"],
  providers: { primary: "INTERNAL" },
  executionType: "SYNC",
  requiresApproval: false,
},

{
  id: "SHORT_TERM_PRODUCTION_ADJUST",
  description: "Adjust production short term",
  domain: "PRODUCTION",
  allowedLevels: ["JUNIOR"],
  providers: { primary: "ERP" },
  executionType: "ASYNC",
  requiresApproval: true,
},

/* =====================================================
 5. LOGISTICS & DISTRIBUTION
===================================================== */

{
  id: "SELECT_ROUTE_FOR_ORDER",
  description: "Select delivery route",
  domain: "LOGISTICS",
  allowedLevels: ["JUNIOR"],
  providers: { primary: "API" },
  executionType: "ASYNC",
  requiresApproval: true,
},

{
  id: "OPTIMIZE_ROUTING_SYSTEM",
  description: "Optimize routing network",
  domain: "LOGISTICS",
  allowedLevels: ["SENIOR"],
  providers: { primary: "INTERNAL" },
  executionType: "SYNC",
  requiresApproval: false,
},

{
  id: "MANAGE_WAREHOUSE",
  description: "Manage warehouse operations",
  domain: "LOGISTICS",
  allowedLevels: ["SENIOR"],
  providers: { primary: "ERP" },
  executionType: "ASYNC",
  requiresApproval: false,
},

{
  id: "PROCESS_ORDER",
  description: "Process customer order",
  domain: "LOGISTICS",
  allowedLevels: ["JUNIOR"],
  providers: { primary: "ERP" },
  executionType: "ASYNC",
  requiresApproval: true,
},

{
  id: "OPTIMIZE_DISTRIBUTION_NETWORK",
  description: "Optimize distribution network",
  domain: "LOGISTICS",
  allowedLevels: ["PRINCIPAL"],
  providers: { primary: "INTERNAL" },
  executionType: "SYNC",
  requiresApproval: false,
},

/* =====================================================
 6. QUALITY & COMPLIANCE
===================================================== */

{
  id: "TRIGGER_QUALITY_CHECK",
  description: "Trigger quality inspection",
  domain: "PRODUCTION",
  allowedLevels: ["JUNIOR"],
  providers: { primary: "ERP" },
  executionType: "ASYNC",
  requiresApproval: true,
},

{
  id: "BLOCK_BATCH",
  description: "Block defective batch",
  domain: "PRODUCTION",
  allowedLevels: ["SENIOR"],
  providers: { primary: "ERP" },
  executionType: "ASYNC",
  requiresApproval: false,
},

{
  id: "RELEASE_BATCH",
  description: "Release batch",
  domain: "PRODUCTION",
  allowedLevels: ["SENIOR"],
  providers: { primary: "ERP" },
  executionType: "ASYNC",
  requiresApproval: false,
},

/* =====================================================
 7. MONITORING & CONTROL (CRITICAL)
===================================================== */

{
  id: "TRACK_KPI",
  description: "Track operational KPIs",
  domain: "SUPPLY_CHAIN",
  allowedLevels: ["VISION", "JUNIOR", "SENIOR"],
  providers: { primary: "INTERNAL" },
  executionType: "SYNC",
  requiresApproval: false,
},

{
  id: "ANALYZE_COST",
  description: "Analyze operational cost",
  domain: "SUPPLY_CHAIN",
  allowedLevels: ["SENIOR", "PRINCIPAL"],
  providers: { primary: "INTERNAL" },
  executionType: "SYNC",
  requiresApproval: false,
},

{
  id: "DETECT_PERFORMANCE_DRIFT",
  description: "Detect system performance drift",
  domain: "SUPPLY_CHAIN",
  allowedLevels: ["VISION", "JUNIOR"],
  providers: { primary: "INTERNAL" },
  executionType: "SYNC",
  requiresApproval: false,
},

/* =====================================================
 8. AI TOOLS ORCHESTRATION
===================================================== */

{
  id: "GENERATE_SCENARIOS",
  description: "Generate planning scenarios",
  domain: "AI_TOOLS",
  allowedLevels: ["JUNIOR", "SENIOR"],
  providers: { primary: "CLAUDE", fallback: ["OPENAI", "OSS"] },
  executionType: "SYNC",
  requiresApproval: false,
  estimatedCost: 0.02,
},

{
  id: "SUMMARIZE_CONTEXT",
  description: "Summarize operational context",
  domain: "AI_TOOLS",
  allowedLevels: ["VISION", "JUNIOR"],
  providers: { primary: "OPENAI", fallback: ["OSS"] },
  executionType: "SYNC",
  requiresApproval: false,
},

{
  id: "ANOMALY_EXPLANATION",
  description: "Explain anomalies",
  domain: "AI_TOOLS",
  allowedLevels: ["VISION", "JUNIOR"],
  providers: { primary: "CLAUDE" },
  executionType: "SYNC",
  requiresApproval: false,
},

] as const satisfies readonly CapabilityDefinition[];