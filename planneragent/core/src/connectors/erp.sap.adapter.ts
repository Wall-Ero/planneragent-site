// core/src/connectors/erp.sap.adapter.ts
// =====================================================
// PlannerAgent — SAP ERP Adapter
// Canonical Source of Truth
// =====================================================

import {
  registerConnector,
  IndustrialConnector,
} from "../industrial/system.registry";

const sapAdapter: IndustrialConnector = {

  id: "erp-sap",

  vendor: "SAP",

  capabilities: [

    {
      id: "read_orders",
      domain: "supply_chain",
      verb: "read",
      description: "Read sales orders from SAP",
    },

    {
      id: "read_inventory",
      domain: "supply_chain",
      verb: "read",
      description: "Read inventory levels from SAP",
    },

    {
      id: "read_movements",
      domain: "supply_chain",
      verb: "read",
      description: "Read inventory movements",
    },

    {
      id: "notify_supplier",
      domain: "procurement",
      verb: "execute",
      description: "Notify supplier about expedite request",
    },

  ],

  async health() {
    return {
      ok: true,
      vendor: "SAP",
      latency_ms: 120,
    };
  },

  async execute(
    capability_id: string,
    payload: Record<string, unknown>
  ): Promise<Record<string, unknown>> {

    switch (capability_id) {

      case "read_orders":
        return {
          orders: [],
        };

      case "read_inventory":
        return {
          inventory: [],
        };

      case "read_movements":
        return {
          movements: [],
        };

      case "notify_supplier":
        return {
          notified: true,
          payload,
        };

      default:
        throw new Error(`SAP adapter cannot execute '${capability_id}'`);
    }

  },

};

registerConnector(sapAdapter);