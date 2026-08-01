// core/src/connectors/index.ts
// =====================================================
// PlannerAgent — Connector Loader
// Canonical Source of Truth
//
// Importing this file registers all industrial connectors
// =====================================================

export { initializeProductionErpConnector } from "./generic.erp.adapter";
export { initializeSapConnector } from "./erp.sap.adapter";
export { initializeMesConnector } from "./generic.mes.adapter";
export { initializeOperationalEdgeConnector } from "./generic.operational-edge.adapter";
