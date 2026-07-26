// core/src/connectors/erp.sap.adapter.ts
// =====================================================
// PlannerAgent — SAP ERP Adapter
// Canonical Source of Truth
// =====================================================

import {
  registerConnector,
  IndustrialConnector,
} from "../industrial/system.registry";
import {
  NOTIFY_SUPPLIER,
  READ_INVENTORY,
  READ_MOVEMENTS,
  READ_ORDERS,
} from "../industrial/capabilities";

const sapAdapter: IndustrialConnector = {

  id: "erp-sap",

  vendor: "SAP",

  identity: Object.freeze({
    connectorId: "erp-sap",
    identityId: "connector-identity:erp-sap",
    credentialReference: "secret://connectors/erp-sap",
  }),
  dataPolicyBinding: Object.freeze({
    tenantId: "tenant-001",
    sourceSystem: "SAP",
    sourceRegion: "EU",
    transportScheme: "HTTPS",
  }),

  capabilities: [
    READ_ORDERS,
    READ_INVENTORY,
    READ_MOVEMENTS,
    NOTIFY_SUPPLIER,
  ],

  async health() {
    return {
      ok: true,
      connectorIdentityId: "connector-identity:erp-sap",
      checkedAt: new Date().toISOString(),
      latencyMs: 120,
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
