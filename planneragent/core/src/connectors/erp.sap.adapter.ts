// core/src/connectors/erp.sap.adapter.ts
import { registerConnector } from "../industrial/system.registry";
import type { IndustrialConnector } from "../industrial/system.registry";

const sapAdapter: IndustrialConnector = {
  id: "erp-sap",
  vendor: "SAP",
  capabilities: [
    {
      id: "read_supply_plan",
      domain: "supply_chain",
      verb: "read",
      description: "Read supply plan from ERP",
    },
  ],
  async health() {
    return { ok: true, vendor: "SAP", latency_ms: 120 };
  },
};

registerConnector(sapAdapter);
