import { describe, expect, it, vi } from "vitest";
import type { AuthoritativeExternalData } from "../../interpretation/authoritative.external.data";
import {
  adaptAdmittedDatasetToCognitionInput,
  admitIndustrialDataset,
  runGovernedDatasetAdmissionAtCognitionEntry,
  type IndustrialDatasetRole,
} from "../governed.dataset.admission";

function data(overrides: Record<string, unknown> = {}): AuthoritativeExternalData {
  const provenance = Object.freeze({ version: 1, immutable: "canonical" });
  return Object.freeze({
    contractVersion: "1",
    tenantId: "tenant-1",
    sourceIdentity: "source-1",
    acquisitionIdentity: "acquisition-1",
    interpretationIdentity: "interpretation-1",
    interpretationProfile: "GOVERNED_PASSIVE_CSV_V1",
    interpretationVersion: "1",
    datasetIdentity: "dataset-1",
    headers: Object.freeze(["orderId", "sku", "qty"]),
    rows: Object.freeze([Object.freeze(["O-1", "SKU-1", "12"])]),
    extractionMetadata: Object.freeze({}),
    provenance,
    lineage: Object.freeze({
      uploadId: "upload-1", uploadDigestAlgorithm: "SHA-256",
      uploadDigest: "a".repeat(64), acquisitionIdentity: "acquisition-1",
      interpretationIdentity: "interpretation-1", datasetIdentity: "dataset-1",
    }),
    ...overrides,
  }) as unknown as AuthoritativeExternalData;
}

function admit(value = data(), role: IndustrialDatasetRole = "ORDERS") {
  return admitIndustrialDataset(value, { version: 1, role });
}

describe("WU11A-1 — Governed Industrial Dataset Admission", () => {
  it("admits a valid governed role", () => {
    expect(admit()).toMatchObject({ admitted: true, dataset: { admission: { role: "ORDERS" } } });
  });

  it("rejects unsupported and ambiguous roles", () => {
    expect(admitIndustrialDataset(data(), { version: 1, role: "SUPPLY" as any }))
      .toEqual({ admitted: false, failure: "DATASET_ROLE_UNSUPPORTED" });
    expect(admitIndustrialDataset(data(), { version: 1, role: ["ORDERS", "INVENTORY"] } as any))
      .toEqual({ admitted: false, failure: "DATASET_ROLE_AMBIGUOUS" });
  });

  it("rejects invalid headers and incompatible structures", () => {
    expect(admit(data({ headers: Object.freeze(["mystery"]) })))
      .toEqual({ admitted: false, failure: "DATASET_HEADERS_INVALID" });
    expect(admit(data({ rows: Object.freeze([Object.freeze(["O-1"])]) })))
      .toEqual({ admitted: false, failure: "DATASET_STRUCTURE_INCOMPATIBLE" });
  });

  it("rejects an incompatible interpretation profile or version", () => {
    expect(admit(data({ interpretationVersion: "2" })))
      .toEqual({ admitted: false, failure: "DATASET_PROFILE_INCOMPATIBLE" });
    expect(admit(data({ interpretationProfile: "UNCONTROLLED" })))
      .toEqual({ admitted: false, failure: "DATASET_PROFILE_INCOMPATIBLE" });
  });

  it("returns an immutable result while preserving data and provenance references", () => {
    const source = data();
    const result = admit(source);
    expect(result.admitted).toBe(true);
    if (!result.admitted) return;
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.dataset)).toBe(true);
    expect(Object.isFrozen(result.dataset.admission)).toBe(true);
    expect(result.dataset.data).toBe(source);
    expect(result.dataset.data.provenance).toBe(source.provenance);
  });

  it.each([
    ["ORDERS", ["orderId", "sku", "qty"], "orders"],
    ["INVENTORY", ["sku", "qty"], "inventory"],
    ["MOVEMENTS", ["sku", "qty", "type"], "movements"],
    ["PRODUCTION_ORDERS", ["order", "article", "quantity"], "movord"],
    ["MATERIAL_MOVEMENTS", ["order", "article", "quantity", "type"], "movmag"],
    ["MASTER_BOM", ["parent", "component", "ratio"], "masterBom"],
  ] as const)("adapts %s to the historical %s cognition field", (role, headers, key) => {
    const source = data({
      headers: Object.freeze([...headers]),
      rows: Object.freeze([Object.freeze(headers.map((_, index) => String(index + 1)))]),
    });
    const result = admit(source, role);
    expect(result.admitted).toBe(true);
    if (!result.admitted) return;
    const adapted = adaptAdmittedDatasetToCognitionInput(result.dataset) as any;
    expect(Object.keys(adapted)).toEqual([key]);
    expect(adapted[key][0]).toEqual(Object.fromEntries(headers.map((header, index) => [header, String(index + 1)])));
  });

  it.each([
    ["GOVERNED_PASSIVE_CSV_V1", "CSV"],
    ["GOVERNED_PASSIVE_DELIMITED_TXT_DAT_V1", "TXT"],
    ["GOVERNED_PASSIVE_DELIMITED_TXT_DAT_V1", "DAT"],
    ["GOVERNED_PASSIVE_FIXED_WIDTH_TXT_DAT_V1", "DAT_FIXED"],
  ])("preserves format-neutral admission for %s (%s)", (profile) => {
    const source = data({ interpretationProfile: profile });
    const result = admit(source);
    expect(result.admitted).toBe(true);
    if (result.admitted) expect(result.dataset.data.provenance).toBe(source.provenance);
  });

  it("preserves identical provenance across CSV, TXT and DAT", () => {
    const provenance = data().provenance;
    const inputs = [
      data({ provenance, interpretationProfile: "GOVERNED_PASSIVE_CSV_V1" }),
      data({ provenance, interpretationProfile: "GOVERNED_PASSIVE_DELIMITED_TXT_DAT_V1" }),
      data({ provenance, interpretationProfile: "GOVERNED_PASSIVE_FIXED_WIDTH_TXT_DAT_V1" }),
    ];
    for (const source of inputs) {
      const result = admit(source);
      expect(result.admitted).toBe(true);
      if (result.admitted) expect(result.dataset.data.provenance).toBe(provenance);
    }
  });

  it("terminates at the historical cognition entry and blocks it after failed admission", async () => {
    const cognitionEntry = vi.fn(async (request) => request.orders);
    const base = {
      cognitionRequest: {
        request_id: "request-1", company_id: "company-1", plan: "JUNIOR" as const,
        intent: "ADVISE", domain: "production" as const,
      },
      cognitionEntry,
    };
    const success = await runGovernedDatasetAdmissionAtCognitionEntry({
      ...base, data: data(), roleContract: { version: 1, role: "ORDERS" },
    });
    expect(success.completed).toBe(true);
    expect(cognitionEntry).toHaveBeenCalledTimes(1);
    expect(cognitionEntry.mock.calls[0][0].orders).toEqual([
      { orderId: "O-1", sku: "SKU-1", qty: "12" },
    ]);

    const failure = await runGovernedDatasetAdmissionAtCognitionEntry({
      ...base, data: data({ headers: Object.freeze(["unknown"]) }),
      roleContract: { version: 1, role: "ORDERS" },
    });
    expect(failure).toEqual({ completed: false, failure: "DATASET_HEADERS_INVALID" });
    expect(cognitionEntry).toHaveBeenCalledTimes(1);
  });
});
