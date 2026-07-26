// core/src/connectors/index.ts
// =====================================================
// PlannerAgent — Connector Loader
// Canonical Source of Truth
//
// Importing this file registers all industrial connectors
// =====================================================

import "./erp.sap.adapter";
export { initializeProductionErpConnector } from "./generic.erp.adapter";
