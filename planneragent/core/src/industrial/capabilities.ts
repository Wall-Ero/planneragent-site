// core/src/industrial/capabilities.ts
// =====================================================
// PlannerAgent — Industrial Capability Catalog
// Canonical Source of Truth
//
// Defines the universal capability set used by
// PlannerAgent to interact with ERP / WMS / MES systems.
//
// These capabilities represent operations that exist
// across most industrial systems.
//
// ERP connectors map vendor-specific APIs to these.
// =====================================================

import type { IndustrialCapability } from "./uic.interface";

// -----------------------------------------------------
// SUPPLY CHAIN — READ CAPABILITIES
// -----------------------------------------------------

export const READ_ORDERS: IndustrialCapability = {
  id: "read_orders",
  domain: "supply_chain",
  verb: "read",
  description:
    "Retrieve sales, production, or purchase orders from an industrial system",
};

export const READ_INVENTORY: IndustrialCapability = {
  id: "read_inventory",
  domain: "supply_chain",
  verb: "read",
  description:
    "Retrieve current inventory levels across warehouses or storage locations",
};

export const READ_MOVEMENTS: IndustrialCapability = {
  id: "read_movements",
  domain: "supply_chain",
  verb: "read",
  description:
    "Retrieve material movements (goods receipt, goods issue, production consumption)",
};

export const READ_PRODUCTION_PLAN: IndustrialCapability = {
  id: "read_production_plan",
  domain: "manufacturing",
  verb: "read",
  description:
    "Retrieve production schedule, work orders, or manufacturing plan",
};

export const READ_SUPPLY_PLAN: IndustrialCapability = {
  id: "read_supply_plan",
  domain: "procurement",
  verb: "read",
  description:
    "Retrieve supplier delivery plan, purchase orders, or inbound supply schedule",
};

// -----------------------------------------------------
// EXECUTION CAPABILITIES
// -----------------------------------------------------

export const UPDATE_ORDER: IndustrialCapability = {
  id: "update_order",
  domain: "supply_chain",
  verb: "execute",
  description:
    "Update order attributes such as quantity, schedule date, or release status",
};

export const NOTIFY_SUPPLIER: IndustrialCapability = {
  id: "notify_supplier",
  domain: "procurement",
  verb: "execute",
  description:
    "Notify supplier about expedite request, delay, or material issue",
};

// -----------------------------------------------------
// CANONICAL CAPABILITY SET
// -----------------------------------------------------

export const INDUSTRIAL_CAPABILITIES: IndustrialCapability[] = [
  READ_ORDERS,
  READ_INVENTORY,
  READ_MOVEMENTS,
  READ_PRODUCTION_PLAN,
  READ_SUPPLY_PLAN,
  UPDATE_ORDER,
  NOTIFY_SUPPLIER,
];

// -----------------------------------------------------
// HELPER — capability lookup
// -----------------------------------------------------

export function getCapabilityById(
  id: string
): IndustrialCapability | undefined {
  return INDUSTRIAL_CAPABILITIES.find(c => c.id === id);
}

// -----------------------------------------------------
// HELPER — list by domain
// -----------------------------------------------------

export function getCapabilitiesByDomain(domain: string) {
  return INDUSTRIAL_CAPABILITIES.filter(c => c.domain === domain);
}