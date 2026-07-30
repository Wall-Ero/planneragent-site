import { describe, expect, it } from "vitest";
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
  type TxtDatInterpretationConfiguration,
} from "../interpretation/governed.flatfile.interpretation";
import { governedCsvInput } from "./governed.csv.test.fixture";
import { governedTxtDatInput } from "./governed.flatfile.test.fixture";

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
    governedTxtDatInput(bytes, profile),
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
      expect(data.provenance.version).toBe(1);
      expect(Object.isFrozen(data.provenance)).toBe(true);
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
    expect(Object.keys(dat.provenance).sort()).toEqual(
      Object.keys(csv.provenance).sort(),
    );
  });

  it("adds canonical provenance without flattening its attested facts", async () => {
    const data = await csvAed();
    expect(Object.keys(data)).toContain("provenance");
    for (const attestedOnly of [
      "principal_id",
      "session_id",
      "membership_id",
      "authorization_decision_id",
      "quarantine_reference",
      "inspection_id",
      "malware_scan_id",
    ]) expect(Object.keys(data)).not.toContain(attestedOnly);
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
