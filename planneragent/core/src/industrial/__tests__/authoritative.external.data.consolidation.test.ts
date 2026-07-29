import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  INDUSTRIAL_INTERPRETATION_REGISTRY_VERSION,
  SECURE_FILE_ACQUISITION_PROFILE,
  type SecureFileAcquisitionResult,
} from "../acquisition/secure.file.acquisition";
import {
  AUTHORITATIVE_EXTERNAL_DATA_VERSION,
  type AuthoritativeExternalData,
} from "../interpretation/authoritative.external.data";
import {
  constructAuthoritativeExternalData,
  interpretAdmittedCsv,
} from "../interpretation/governed.csv.interpretation";
import {
  constructTxtDatAuthoritativeExternalData,
  interpretAdmittedTxtDat,
  type AdmittedTxtDatContentReader,
  type TxtDatInterpretationConfiguration,
} from "../interpretation/governed.flatfile.interpretation";
import { governedCsvInput } from "./governed.csv.test.fixture";

function admission(bytes: Uint8Array, format: "CSV" | "TXT_DAT") {
  const byteDigest = createHash("sha256").update(bytes).digest("hex");
  return Object.freeze({
    processed: true,
    disposition: "ADMITTED_FOR_GOVERNED_INTERPRETATION",
    reference: Object.freeze({
      acquisitionProfile: SECURE_FILE_ACQUISITION_PROFILE,
      interpretationRegistryVersion:
        INDUSTRIAL_INTERPRETATION_REGISTRY_VERSION,
      uploadId: `upload-${format.toLowerCase()}`,
      tenantId: "tenant-001",
      companyId: "company-001",
      authorizationReference: "authorization:010a",
      quarantineReference: `quarantine:${format.toLowerCase()}`,
      inspectionId: `inspection:${format.toLowerCase()}`,
      malwareScanId: `scan:${format.toLowerCase()}`,
      detectedFormat: format,
      byteDigestAlgorithm: "SHA-256",
      byteDigest,
      byteLength: bytes.byteLength,
      admittedAt: "2026-07-27T21:00:00.000Z",
    }),
  }) as Extract<
    SecureFileAcquisitionResult,
    { disposition: "ADMITTED_FOR_GOVERNED_INTERPRETATION" }
  >;
}

function content(reference: ReturnType<typeof admission>["reference"],
  bytes: Uint8Array) {
  return {
    acquisitionProfile: reference.acquisitionProfile,
    interpretationRegistryVersion: reference.interpretationRegistryVersion,
    uploadId: reference.uploadId,
    tenantId: reference.tenantId,
    companyId: reference.companyId,
    quarantineReference: reference.quarantineReference,
    inspectionId: reference.inspectionId,
    malwareScanId: reference.malwareScanId,
    byteDigestAlgorithm: reference.byteDigestAlgorithm,
    byteDigest: reference.byteDigest,
    byteLength: reference.byteLength,
    bytes,
  };
}

async function csvAed(): Promise<AuthoritativeExternalData> {
  const bytes = new TextEncoder().encode("code,amount\nA01,10");
  const configuration = {
    delimiter: ",", quote: '"', newline: "\n",
    maxRows: 3, maxColumns: 3, maxCellLength: 10,
  } as const;
  const interpreted = await interpretAdmittedCsv(
    governedCsvInput(bytes, configuration),
  );
  if (!interpreted.interpreted) throw new Error(interpreted.denial);
  const result = constructAuthoritativeExternalData(
    interpreted.extraction,
  );
  if (!result.constructed) throw new Error(result.denial);
  return result.data;
}

async function flatFileAed(
  dataKind: "TXT" | "DAT",
): Promise<AuthoritativeExternalData> {
  const bytes = new TextEncoder().encode("A01|10");
  const admitted = admission(bytes, "TXT_DAT");
  const reader: AdmittedTxtDatContentReader = {
    async readAdmittedTxtDat(reference) {
      return content(reference, bytes);
    },
  };
  const profile: TxtDatInterpretationConfiguration = {
    dataKind,
    layout: "DELIMITED",
    delimiter: "|",
    newline: "\n",
    fields: [{ name: "code" }, { name: "amount" }],
    maxRows: 3,
    maxFields: 3,
    maxFieldLength: 10,
    maxRecordLength: 20,
  };
  const interpreted = await interpretAdmittedTxtDat(
    admitted, reader, profile,
  );
  if (!interpreted.interpreted) throw new Error(interpreted.denial);
  const result = constructTxtDatAuthoritativeExternalData(
    interpreted.extraction,
  );
  if (!result.constructed) throw new Error(result.denial);
  return result.data;
}

function downstreamConsumer(
  data: AuthoritativeExternalData,
): readonly (readonly string[])[] {
  return data.rows;
}

describe("Work Unit 10A — Authoritative External Data consolidation", () => {
  it("accepts unchanged CSV, TXT and DAT output through one contract", async () => {
    const csv = await csvAed();
    const txt = await flatFileAed("TXT");
    const dat = await flatFileAed("DAT");
    for (const data of [csv, txt, dat]) {
      expect(data.contractVersion).toBe(
        AUTHORITATIVE_EXTERNAL_DATA_VERSION,
      );
      expect(downstreamConsumer(data)).toEqual([["A01", "10"]]);
      expect(Object.isFrozen(data)).toBe(true);
      expect(Object.isFrozen(data.extractionMetadata)).toBe(true);
      expect(Object.isFrozen(data.lineage)).toBe(true);
    }
  });

  it("preserves the exact runtime field contract across adapters", async () => {
    const csv = await csvAed();
    const txt = await flatFileAed("TXT");
    const dat = await flatFileAed("DAT");
    expect(Object.keys(txt).sort()).toEqual(Object.keys(csv).sort());
    expect(Object.keys(dat).sort()).toEqual(Object.keys(csv).sort());
    expect(Object.keys(txt.lineage).sort()).toEqual(
      Object.keys(csv.lineage).sort(),
    );
    expect(Object.keys(txt.extractionMetadata).sort()).toEqual(
      Object.keys(csv.extractionMetadata).sort(),
    );
  });

  it("requires no interface widening for a future adapter", async () => {
    const baseline = await csvAed();
    const future = Object.freeze({
      ...baseline,
      interpretationProfile: "GOVERNED_FUTURE_ADAPTER_V1",
      interpretationVersion: "203",
      extractionMetadata: Object.freeze({
        encoding: "UTF-8",
        records: 1,
        passive: true,
        optional: null,
      }),
    }) satisfies AuthoritativeExternalData;
    expect(downstreamConsumer(future)).toEqual([["A01", "10"]]);
  });

  it("contains no source discriminator in the universal interface", async () => {
    const data: AuthoritativeExternalData = await flatFileAed("DAT");
    for (const forbidden of [
      "sourceFormat", "csv", "txt", "dat", "delimiter", "fixedWidth",
    ]) expect(Object.keys(data)).not.toContain(forbidden);
  });
});
