import { describe, expect, it, vi } from "vitest";
import {
  createProductionErpConnector, PRODUCTION_ERP_PROFILES,
  ProductionErpConnectorError, validateProductionErpConnectorConfig,
  initializeProductionErpConnector,
  type ProductionErpConnectorConfig, type ProductionErpProfileName,
} from "../../connectors/generic.erp.adapter";
import type { ConnectorExecutionAccess } from "../connector.access";

const NOW = Date.parse("2026-07-31T12:00:00.000Z");
const paths = Object.freeze({ ORDERS: "/orders", INVENTORY: "/inventory", MOVEMENTS: "/movements",
  PRODUCTION_ORDERS: "/production-orders", MATERIAL_MOVEMENTS: "/material-movements", MASTER_BOM: "/master-bom" });
const config: ProductionErpConnectorConfig = Object.freeze({ baseUrl: "https://erp.example/api/v1", tenantId: "tenant-1",
  companyId: "company-1", ownerId: "owner-1", sourceSystem: "ERP-1", sourceRegion: "EU",
  credentialReference: "secret://erp/token", requestTimeoutMs: 50, maxResponseBytes: 100_000, profilePaths: paths });
const access = (change: Record<string, unknown> = {}): ConnectorExecutionAccess => ({
  workload: Object.freeze({ workloadId: "worker-1", tenantId: "tenant-1", authenticationId: "authn-1" }),
  credential: Object.freeze({ credentialReference: "secret://erp/token", secret: "top-secret" }),
  dataPolicyAdmission: Object.freeze({ decision: "ADMITTED", policyVersion: "1", authorizationReference: "authz-1",
    connectorIdentityId: "connector-identity:erp-production-rest", connectorRevision: 1, credentialReference: "secret://erp/token",
    capabilityId: "read_orders", context: Object.freeze({ contextId: "context-1", tenantId: "tenant-1", targetTenantId: "tenant-1",
      sourceSystem: "ERP-1", sourceRegion: "EU", targetRegion: "EU", runtimeLocality: "TENANT_LOCAL",
      encryptionDomain: "EXECUTION_MEMORY", encryptionEvidence: Object.freeze({ contextId: "context-1",
        connectorIdentityId: "connector-identity:erp-production-rest", domain: "EXECUTION_MEMORY", encryptedInTransit: true, encryptedAtRest: true }),
      transportEvidence: Object.freeze({ contextId: "context-1", connectorIdentityId: "connector-identity:erp-production-rest", scheme: "HTTPS", secure: true }),
      ...(change.context as object ?? {}) }), ...change } as any),
});
const rows: Record<ProductionErpProfileName, Record<string, unknown>> = {
  ORDERS: { external_order_id: "O1", external_order_version: "1", company_id: "company-1", owner_id: "owner-1", sku: "SKU1", quantity_value: 2, quantity_unit: "EA", status: "OPEN", observed_at: "2026-07-31T11:00:00.000Z", effective_at: "2026-07-31T10:00:00.000Z", due_at: "2026-08-01T00:00:00.000Z" },
  INVENTORY: { inventory_id: "I1", company_id: "company-1", source_system: "ERP-1", warehouse_id: "W1", sku: "SKU1", quantity: 7, unit: "EA", observed_at: "2026-07-31T11:00:00.000Z" },
  MOVEMENTS: { movement_id: "M1", company_id: "company-1", source_system: "ERP-1", sku: "SKU1", quantity: 3, type: "RECEIPT", unit: "EA", occurred_at: "2026-07-31T11:00:00.000Z" },
  PRODUCTION_ORDERS: { production_order_id: "P1", company_id: "company-1", source_system: "ERP-1", article: "FG1", output_article: "FG1", quantity: 5, unit: "EA", scheduled_at: "2026-08-01T00:00:00.000Z" },
  MATERIAL_MOVEMENTS: { movement_id: "MM1", production_order_id: "P1", company_id: "company-1", source_system: "ERP-1", article: "RM1", quantity: 4, type: "CONSUMPTION", unit: "EA", occurred_at: "2026-07-31T11:00:00.000Z" },
  MASTER_BOM: { company_id: "company-1", source_system: "ERP-1", parent: "FG1", component: "RM1", ratio: 2, unit: "EA", revision: "R1", valid_from: "2026-07-01T00:00:00.000Z" },
};
const collections: Record<ProductionErpProfileName, string> = { ORDERS: "orders", INVENTORY: "inventory", MOVEMENTS: "movements", PRODUCTION_ORDERS: "productionOrders", MATERIAL_MOVEMENTS: "materialMovements", MASTER_BOM: "masterBom" };
const capabilities: Record<ProductionErpProfileName, string> = { ORDERS: "read_orders", INVENTORY: "read_inventory", MOVEMENTS: "read_movements", PRODUCTION_ORDERS: "read_production_plan", MATERIAL_MOVEMENTS: "read_movements", MASTER_BOM: "read_master_bom" };
function response(name: ProductionErpProfileName, values: unknown[] = [rows[name]], init: ResponseInit = {}) {
  return new Response(JSON.stringify({ schema_version: PRODUCTION_ERP_PROFILES[name], [collections[name]]: values }), { status: 200, ...init, headers: { "content-type": "application/json", ...init.headers } });
}
function connector(fetcher: typeof fetch) { return createProductionErpConnector(config, { fetch: fetcher, now: () => NOW }); }
async function run(name: ProductionErpProfileName, fetcher: typeof fetch = async () => response(name), payload: Record<string, unknown> = {}) {
  const selected = (name === "MOVEMENTS" || name === "MATERIAL_MOVEMENTS") ? { providerProfile: PRODUCTION_ERP_PROFILES[name], ...payload } : payload;
  return connector(fetcher).execute(capabilities[name], selected, access());
}
async function denied(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toMatchObject({ name: "ProductionErpConnectorError", code, message: "Production ERP connector request failed" });
}

describe("WU12C generic read-only ERP profiles", () => {
  const invalidConfigs: readonly [string, Partial<ProductionErpConnectorConfig>, string][] = [
    ["missing base endpoint", { baseUrl: "" }, "ERP_CONFIGURATION_INVALID"],
    ["non-HTTPS endpoint", { baseUrl: "http://erp.example" }, "ERP_CONFIGURATION_INVALID"],
    ["embedded credentials", { baseUrl: "https://user:pass@erp.example" }, "ERP_CONFIGURATION_INVALID"],
    ["endpoint query", { baseUrl: "https://erp.example?token=x" }, "ERP_CONFIGURATION_INVALID"],
    ["invalid relative path", { profilePaths: { ORDERS: "orders" } }, "ERP_ENDPOINT_PATH_INVALID"],
    ["path traversal", { profilePaths: { ORDERS: "/a/../orders" } }, "ERP_ENDPOINT_PATH_INVALID"],
    ["path query secret", { profilePaths: { ORDERS: "/orders?token=x" } }, "ERP_ENDPOINT_PATH_INVALID"],
    ["empty capabilities", { profilePaths: {} }, "ERP_CONFIGURATION_INVALID"],
    ["invalid timeout", { requestTimeoutMs: 0 }, "ERP_CONFIGURATION_INVALID"],
    ["excess timeout", { requestTimeoutMs: 30_001 }, "ERP_CONFIGURATION_INVALID"],
    ["invalid response bound", { maxResponseBytes: 0 }, "ERP_CONFIGURATION_INVALID"],
    ["invalid credential reference", { credentialReference: "plain-secret" }, "ERP_AUTHENTICATION_PROFILE_INVALID"],
    ["unsupported authentication", { authenticationProfile: "BASIC_AUTH_V1" as any }, "ERP_CONFIGURATION_INVALID"],
  ];
  it("accepts and deeply freezes complete V1 configuration", () => { const value = validateProductionErpConnectorConfig(config); expect(Object.isFrozen(value)).toBe(true); expect(Object.isFrozen(value.profilePaths)).toBe(true); });
  it("declares only partially configured capabilities", () => { const value = createProductionErpConnector({ ...config, profilePaths: { INVENTORY: "/stock" } }); expect(value.capabilities.map(c => c.id)).toEqual(["read_inventory"]); });
  it("keeps identical production initialization idempotent and rejects configuration drift", () => {
    const env = { INDUSTRIAL_ERP_BASE_URL: "https://erp-init.example", INDUSTRIAL_ERP_TENANT_ID: "tenant-init",
      INDUSTRIAL_ERP_COMPANY_ID: "company-init", INDUSTRIAL_ERP_OWNER_ID: "owner-init", INDUSTRIAL_ERP_SOURCE_SYSTEM: "ERP-INIT",
      INDUSTRIAL_ERP_SOURCE_REGION: "EU", INDUSTRIAL_ERP_CREDENTIAL_REFERENCE: "secret://erp/init",
      INDUSTRIAL_ERP_REQUEST_TIMEOUT_MS: "100", INDUSTRIAL_ERP_ORDERS_PATH: "/orders" };
    expect(initializeProductionErpConnector(env)).toBe(true);
    expect(initializeProductionErpConnector(env)).toBe(true);
    expect(() => initializeProductionErpConnector({ ...env, INDUSTRIAL_ERP_ORDERS_PATH: "/changed" })).toThrow("Invalid production ERP connector configuration");
  });
  it.each(invalidConfigs)("rejects %s", (_label, change, code) => { try { validateProductionErpConnectorConfig({ ...config, ...change }); throw new Error("expected rejection"); } catch (error) { expect(error).toBeInstanceOf(ProductionErpConnectorError); expect((error as ProductionErpConnectorError).code).toBe(code); } });

  it.each(Object.keys(rows) as ProductionErpProfileName[])("acquires and projects valid %s", async name => {
    const fetcher = vi.fn<typeof fetch>(async (_url, init) => { expect(init?.method).toBe("GET"); expect(init?.redirect).toBe("error"); expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer top-secret"); return response(name); });
    const output = await run(name, fetcher) as any; expect(output.providerProfile).toBe(PRODUCTION_ERP_PROFILES[name]); expect(output.cognitionRows).toHaveLength(1); expect(Object.isFrozen(output)).toBe(true); expect(Object.isFrozen(output.cognitionRows[0])).toBe(true); expect(fetcher).toHaveBeenCalledOnce();
  });
  const parity: readonly [ProductionErpProfileName, string, object][] = [
    ["ORDERS", "orders", { orderId: "O1", sku: "SKU1", qty: 2 }], ["INVENTORY", "inventory", { sku: "SKU1", qty: 7 }],
    ["MOVEMENTS", "movements", { sku: "SKU1", qty: 3, type: "RECEIPT" }], ["PRODUCTION_ORDERS", "movord", { order: "P1", article: "FG1", quantity: 5 }],
    ["MATERIAL_MOVEMENTS", "movmag", { order: "P1", article: "RM1", quantity: 4, type: "CONSUMPTION", production_order_ref:"P1" }], ["MASTER_BOM", "masterBom", { parent: "FG1", component: "RM1", ratio: 2 }],
  ];
  it.each(parity)("maps %s truthfully to %s", async (name, lane, expected) => { const output = await run(name) as any; expect(output.cognitionLane).toBe(lane); expect(output.cognitionRows).toEqual([expected]); expect(JSON.stringify(output)).not.toContain("uploadId"); expect(JSON.stringify(output)).not.toContain("AuthoritativeExternalData"); });
  it("admits and preserves only explicit provider-neutral movement attribution",async()=>{const attribution={order_ref:"order:O1",delivery_ref:"delivery:D1",shipment_ref:"shipment:S1",production_order_ref:"production-order:P1",destination_ref:"destination:C1",source_location_ref:"location:W1",destination_location_ref:"location:W2",movement_line_ref:"movement-line:10",reservation_ref:"reservation:R1",allocation_ref:"source-allocation:A1"},row={...rows.MOVEMENTS,...attribution},output=await run("MOVEMENTS",async()=>response("MOVEMENTS",[row])) as any;expect(output.movements[0]).toMatchObject(attribution);expect(output.cognitionRows[0]).toMatchObject(attribution);expect(output.governedFacts[0].semantic.source_attribution).toEqual(attribution);for(const key of ["allocation_relationship_ref","protected_objective","fixation_evidence","changeability","constraint_result","admissibility","recommendation"])expect(output.governedFacts[0]).not.toHaveProperty(key);expect(output.governedFacts[0]).toMatchObject({observational_only:true,grants_execution:false});});
  it("keeps optional attribution absent and rejects invalid or arbitrary attribution",async()=>{const minimal=await run("MOVEMENTS") as any;expect(minimal.governedFacts[0].semantic.source_attribution).toEqual({});const empty={...rows.MOVEMENTS,order_ref:""};await denied(run("MOVEMENTS",async()=>response("MOVEMENTS",[empty])),"ERP_VALUE_TYPE_INVALID");const arbitrary={...rows.MOVEMENTS,nearest_order_ref:"order:guess"};await denied(run("MOVEMENTS",async()=>response("MOVEMENTS",[arbitrary])),"ERP_UNKNOWN_FIELD");});
  it("rejects production-order attribution substitution",async()=>await denied(run("MATERIAL_MOVEMENTS",async()=>response("MATERIAL_MOVEMENTS",[{...rows.MATERIAL_MOVEMENTS,production_order_ref:"P2"}])),"ERP_SOURCE_IDENTITY_CONTRADICTION"));
  it("binds supplied attribution into the governed digest without changing stable event identity",async()=>{const a=await run("MOVEMENTS") as any,b=await run("MOVEMENTS",async()=>response("MOVEMENTS",[{...rows.MOVEMENTS,order_ref:"order:O1"}])) as any;expect(a.governedFacts[0].fact_id).toBe(b.governedFacts[0].fact_id);expect(a.governedFacts[0].fact_digest).not.toBe(b.governedFacts[0].fact_digest);});

  const schemaCases: readonly [string, ProductionErpProfileName, (row: any) => void, string][] = [
    ["missing required field", "INVENTORY", r => delete r.sku, "ERP_REQUIRED_FIELD_MISSING"],
    ["unknown field", "INVENTORY", r => r.surprise = 1, "ERP_UNKNOWN_FIELD"],
    ["numeric coercion", "INVENTORY", r => r.quantity = "7", "ERP_NUMERIC_COERCION_PROHIBITED"],
    ["negative inventory", "INVENTORY", r => r.quantity = -1, "ERP_VALUE_TYPE_INVALID"],
    ["warehouse absent", "INVENTORY", r => delete r.warehouse_id, "ERP_REQUIRED_FIELD_MISSING"],
    ["source contradiction", "INVENTORY", r => r.source_system = "OTHER", "ERP_SOURCE_IDENTITY_CONTRADICTION"],
    ["company contradiction", "INVENTORY", r => r.company_id = "other", "ERP_SOURCE_IDENTITY_CONTRADICTION"],
    ["invalid movement type", "MOVEMENTS", r => r.type = "UNKNOWN", "ERP_CAPABILITY_PAYLOAD_MISMATCH"],
    ["invalid timestamp", "MOVEMENTS", r => r.occurred_at = "31/07/2026", "ERP_DATE_AMBIGUOUS"],
    ["unsupported unit", "MOVEMENTS", r => r.unit = "BOX", "ERP_VALUE_TYPE_INVALID"],
    ["production identity absent", "PRODUCTION_ORDERS", r => delete r.production_order_id, "ERP_REQUIRED_FIELD_MISSING"],
    ["output contradiction", "PRODUCTION_ORDERS", r => r.output_article = "OTHER", "ERP_CAPABILITY_PAYLOAD_MISMATCH"],
    ["invalid production quantity", "PRODUCTION_ORDERS", r => r.quantity = 0, "ERP_VALUE_TYPE_INVALID"],
    ["invalid consumption quantity", "MATERIAL_MOVEMENTS", r => r.quantity = -2, "ERP_VALUE_TYPE_INVALID"],
    ["wrong movement profile", "MATERIAL_MOVEMENTS", r => r.type = "RECEIPT", "ERP_CAPABILITY_PAYLOAD_MISMATCH"],
    ["invalid BOM quantity", "MASTER_BOM", r => r.ratio = 0, "ERP_VALUE_TYPE_INVALID"],
    ["invalid BOM revision", "MASTER_BOM", r => r.revision = "", "ERP_VALUE_TYPE_INVALID"],
    ["invalid BOM validity", "MASTER_BOM", r => r.valid_from = "2026-07-01", "ERP_DATE_AMBIGUOUS"],
    ["orders owner contradiction", "ORDERS", r => r.owner_id = "other", "ERP_SOURCE_IDENTITY_CONTRADICTION"],
  ];
  it.each(schemaCases)("rejects %s", async (_label, name, mutate, code) => { const row = structuredClone(rows[name]); mutate(row); await denied(run(name, async () => response(name, [row])), code); });
  it("rejects duplicate identities", async () => denied(run("ORDERS", async () => response("ORDERS", [rows.ORDERS, { ...rows.ORDERS }])), "ERP_DUPLICATE_IDENTITY"));
  it("rejects non-finite JSON numeric tokens", async () => denied(run("INVENTORY", async () => new Response(JSON.stringify({ schema_version: PRODUCTION_ERP_PROFILES.INVENTORY, inventory: [rows.INVENTORY] }).replace('"quantity":7', '"quantity":Infinity'), { headers: { "content-type": "application/json" } })), "ERP_NON_FINITE_NUMBER"));
  it("rejects duplicate BOM relationships", async () => denied(run("MASTER_BOM", async () => response("MASTER_BOM", [rows.MASTER_BOM, { ...rows.MASTER_BOM }])), "ERP_DUPLICATE_IDENTITY"));
  it("rejects malformed arrays", async () => denied(run("ORDERS", async () => new Response(JSON.stringify({ schema_version: PRODUCTION_ERP_PROFILES.ORDERS, orders: {} }), { headers: { "content-type": "application/json" } })), "ERP_REQUIRED_FIELD_MISSING"));
  it("rejects profile version mismatch", async () => denied(run("ORDERS", async () => new Response(JSON.stringify({ schema_version: "PRODUCTION_REST_ERP_ORDERS_V2", orders: [] }), { headers: { "content-type": "application/json" } })), "ERP_PROFILE_VERSION_UNSUPPORTED"));
  it("rejects malformed JSON", async () => denied(run("ORDERS", async () => new Response("{", { headers: { "content-type": "application/json" } })), "ERP_RESPONSE_SCHEMA_INVALID"));
  it("rejects invalid content type", async () => denied(run("ORDERS", async () => new Response("{}", { headers: { "content-type": "text/plain" } })), "ERP_CONTENT_TYPE_INVALID"));
  it("rejects declared oversized responses", async () => denied(run("ORDERS", async () => response("ORDERS", undefined, { headers: { "content-length": "100001" } })), "ERP_RESPONSE_TOO_LARGE"));
  it("rejects actual oversized responses", async () => { const small = { ...config, maxResponseBytes: 10 }; await denied(createProductionErpConnector(small, { fetch: async () => response("ORDERS"), now: () => NOW }).execute("read_orders", {}, access()), "ERP_RESPONSE_TOO_LARGE"); });
  it("rejects redirects", async () => denied(run("ORDERS", async () => new Response(null, { status: 302, headers: { location: "https://other.example" } })), "ERP_REDIRECT_PROHIBITED"));
  it("contains provider exceptions", async () => denied(run("ORDERS", async () => { throw new Error("secret provider body infrastructure-id"); }), "ERP_ACQUISITION_FAILED"));
  it("contains provider timeout", async () => { const slow = createProductionErpConnector({ ...config, requestTimeoutMs: 1 }, { now: () => NOW, fetch: async (_u, init) => new Promise((_r, reject) => init?.signal?.addEventListener("abort", () => reject(new Error("aborted")))) }); await denied(slow.execute("read_orders", {}, access()), "ERP_PROVIDER_TIMEOUT"); });

  it.each(["POST", "PUT", "PATCH", "DELETE"])("structurally prohibits %s", async method => denied(connector(async () => response("ORDERS")).execute("read_orders", { method }, access()), "ERP_WRITE_OPERATION_PROHIBITED"));
  it("rejects an undeclared capability", async () => denied(createProductionErpConnector({ ...config, profilePaths: { ORDERS: "/orders" } }, { fetch: async () => response("ORDERS"), now: () => NOW }).execute("read_inventory", {}, access()), "ERP_CAPABILITY_NOT_CONFIGURED"));
  it("requires explicit movement profile when both profiles exist", async () => denied(connector(async () => response("MOVEMENTS")).execute("read_movements", {}, access()), "ERP_PROFILE_UNSUPPORTED"));
  it("rejects identity substitution", async () => denied(connector(async () => response("ORDERS")).execute("read_orders", {}, access({ connectorIdentityId: "substitute" })), "ERP_ACQUISITION_FAILED"));
  it("rejects credential substitution", async () => denied(connector(async () => response("ORDERS")).execute("read_orders", {}, { ...access(), credential: { credentialReference: "secret://other", secret: "x" } }), "ERP_ACQUISITION_FAILED"));
  it("rejects tenant mismatch", async () => denied(connector(async () => response("ORDERS")).execute("read_orders", {}, access({ context: { tenantId: "other" } })), "ERP_ACQUISITION_FAILED"));
  it("rejects transport denial", async () => denied(connector(async () => response("ORDERS")).execute("read_orders", {}, access({ context: { transportEvidence: { ...access().dataPolicyAdmission.context.transportEvidence, secure: false } } })), "ERP_ACQUISITION_FAILED"));
  it("rejects encryption denial", async () => denied(connector(async () => response("ORDERS")).execute("read_orders", {}, access({ context: { encryptionEvidence: { ...access().dataPolicyAdmission.context.encryptionEvidence, encryptedAtRest: false } } })), "ERP_ACQUISITION_FAILED"));
  it("health uses HEAD without reading business data", async () => { const fetcher = vi.fn<typeof fetch>(async () => new Response(null, { status: 204 })); await expect(connector(fetcher).health()).resolves.toMatchObject({ ok: true }); expect(fetcher.mock.calls[0]![1]?.method).toBe("HEAD"); });
  it("health sanitizes provider failure", async () => { const health = await connector(async () => { throw new Error("secret"); }).health(); expect(health.ok).toBe(false); expect(JSON.stringify(health)).not.toContain("secret"); });
  it("defensively copies provider rows", async () => { const row = structuredClone(rows.INVENTORY); const output = await run("INVENTORY", async () => response("INVENTORY", [row])) as any; row.sku = "MUTATED"; expect(output.inventory[0].sku).toBe("SKU1"); });
  it("never invokes cognition or fabricates file acquisition evidence", async () => { const output = await run("ORDERS") as any; expect(output.cognitionRows).toBeDefined(); expect(output).not.toHaveProperty("provenance"); expect(output).not.toHaveProperty("uploadId"); expect(output).not.toHaveProperty("quarantineReference"); });
});
