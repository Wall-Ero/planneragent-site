// core/src/connectors/generic.erp.adapter.ts
// =====================================================
// PlannerAgent — Generic ERP Adapter
// Canonical Source of Truth
// Worker-safe version (no process.env)
// =====================================================

import {
  registerConnector,
  IndustrialConnector
} from "../industrial/system.registry";

import {
  READ_ORDERS,
  READ_INVENTORY,
  READ_MOVEMENTS,
  READ_PRODUCTION_PLAN,
  READ_SUPPLY_PLAN,
  UPDATE_ORDER,
  NOTIFY_SUPPLIER
} from "../industrial/capabilities";

// -----------------------------------------------------
// CONFIG (for demo / local dev)
// -----------------------------------------------------

const ERP_BASE_URL = "https://example-erp.api";

// -----------------------------------------------------

async function callERP(
  endpoint: string,
  payload?: Record<string, unknown>
) {

  const response = await fetch(`${ERP_BASE_URL}/${endpoint}`, {
    method: payload ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json"
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  if (!response.ok) {
    throw new Error(`ERP request failed: ${response.status}`);
  }

  return response.json();
}

// -----------------------------------------------------

const genericERPAdapter: IndustrialConnector = {

  id: "erp-generic",

  vendor: "GENERIC",

  capabilities: [
    READ_ORDERS,
    READ_INVENTORY,
    READ_MOVEMENTS,
    READ_PRODUCTION_PLAN,
    READ_SUPPLY_PLAN,
    UPDATE_ORDER,
    NOTIFY_SUPPLIER
  ],

  async health() {

    return {
      ok: true,
      vendor: "GENERIC",
      latency_ms: 0
    };

  },

  async execute(
    capability_id: string,
    payload: Record<string, unknown>
  ): Promise<Record<string, unknown>> {

    switch (capability_id) {

      case "read_orders":
        return callERP("orders");

      case "read_inventory":
        return callERP("inventory");

      case "read_movements":
        return callERP("movements");

      case "read_production_plan":
        return callERP("production-plan");

      case "read_supply_plan":
        return callERP("supply-plan");

      case "update_order":
        return callERP("orders/update", payload);

      case "notify_supplier":
        return callERP("supplier/notify", payload);

      default:
        throw new Error(`Unsupported capability: ${capability_id}`);

    }

  }

};

// -----------------------------------------------------

registerConnector(genericERPAdapter);
