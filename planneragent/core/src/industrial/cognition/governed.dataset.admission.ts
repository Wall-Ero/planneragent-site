import type { SandboxEvaluateRequestV2 } from "../../sandbox/contracts.v2";
import type { AuthoritativeExternalData } from "../interpretation/authoritative.external.data";
import {
  CSV_INTERPRETATION_PROFILE,
  CSV_INTERPRETATION_VERSION,
} from "../interpretation/governed.csv.interpretation";
import {
  DELIMITED_TXT_DAT_INTERPRETATION_PROFILE,
  FIXED_WIDTH_TXT_DAT_INTERPRETATION_PROFILE,
  TXT_DAT_INTERPRETATION_VERSION,
} from "../interpretation/governed.flatfile.interpretation";
import {
  XLSX_INTERPRETATION_PROFILE,
  XLSX_INTERPRETATION_VERSION,
} from "../interpretation/governed.xlsx.interpretation";

export const INDUSTRIAL_DATASET_ROLE_CONTRACT_VERSION = 1 as const;

export type IndustrialDatasetRole =
  | "ORDERS"
  | "INVENTORY"
  | "MOVEMENTS"
  | "PRODUCTION_ORDERS"
  | "MATERIAL_MOVEMENTS"
  | "MASTER_BOM";

export interface IndustrialDatasetRoleContractV1 {
  readonly version: typeof INDUSTRIAL_DATASET_ROLE_CONTRACT_VERSION;
  readonly role: IndustrialDatasetRole;
}

export interface DatasetRoleAdmissionAttestationV1 {
  readonly version: 1;
  readonly roleContractVersion: 1;
  readonly role: IndustrialDatasetRole;
  readonly datasetIdentity: string;
  readonly interpretationProfile: string;
  readonly interpretationVersion: string;
}

export interface AdmittedIndustrialDatasetV1 {
  readonly version: 1;
  readonly data: AuthoritativeExternalData;
  readonly roleContract: IndustrialDatasetRoleContractV1;
  readonly admission: DatasetRoleAdmissionAttestationV1;
}

export type DatasetAdmissionFailure =
  | "DATASET_ROLE_CONTRACT_INVALID"
  | "DATASET_ROLE_UNSUPPORTED"
  | "DATASET_ROLE_AMBIGUOUS"
  | "DATASET_HEADERS_INVALID"
  | "DATASET_STRUCTURE_INCOMPATIBLE"
  | "DATASET_PROFILE_INCOMPATIBLE";

export type DatasetAdmissionResult =
  | Readonly<{ admitted: true; dataset: AdmittedIndustrialDatasetV1 }>
  | Readonly<{ admitted: false; failure: DatasetAdmissionFailure }>;

type CognitionDatasetKey =
  | "orders" | "inventory" | "movements"
  | "movord" | "movmag" | "masterBom";

const ROLE_HEADERS: Readonly<Record<IndustrialDatasetRole, readonly (readonly string[])[]>> =
  Object.freeze({
    ORDERS: Object.freeze([
      Object.freeze(["orderId", "sku", "qty"]),
      Object.freeze(["order_id", "article", "quantity"]),
    ]),
    INVENTORY: Object.freeze([
      Object.freeze(["sku", "qty"]),
      Object.freeze(["article", "giacenza"]),
      Object.freeze(["codart", "qtyAvailable"]),
    ]),
    MOVEMENTS: Object.freeze([
      Object.freeze(["sku", "qty", "type"]),
      Object.freeze(["article", "quantity", "movement_type"]),
    ]),
    PRODUCTION_ORDERS: Object.freeze([
      Object.freeze(["order", "article", "quantity"]),
    ]),
    MATERIAL_MOVEMENTS: Object.freeze([
      Object.freeze(["order", "article", "quantity", "type"]),
      Object.freeze(["order", "article", "quantity", "causale"]),
    ]),
    MASTER_BOM: Object.freeze([
      Object.freeze(["parent", "component", "ratio"]),
      Object.freeze(["parentSku", "componentSku", "qtyPer"]),
    ]),
  });

const ROLE_KEYS: Readonly<Record<IndustrialDatasetRole, CognitionDatasetKey>> =
  Object.freeze({
    ORDERS: "orders", INVENTORY: "inventory", MOVEMENTS: "movements",
    PRODUCTION_ORDERS: "movord", MATERIAL_MOVEMENTS: "movmag",
    MASTER_BOM: "masterBom",
  });
const MOVEMENT_ATTRIBUTION_HEADERS=Object.freeze(["order_ref","delivery_ref","shipment_ref","production_order_ref","destination_ref","source_location_ref","destination_location_ref","movement_line_ref","reservation_ref","allocation_ref"]);
const PRODUCTION_ORDER_OPTIONAL_HEADERS=Object.freeze(["planned_output_available_at"]);

function denied(failure: DatasetAdmissionFailure): DatasetAdmissionResult {
  return Object.freeze({ admitted: false, failure });
}

function supportedProfile(data: AuthoritativeExternalData): boolean {
  return (data.interpretationProfile === CSV_INTERPRETATION_PROFILE &&
      data.interpretationVersion === CSV_INTERPRETATION_VERSION) ||
    ((data.interpretationProfile === DELIMITED_TXT_DAT_INTERPRETATION_PROFILE ||
      data.interpretationProfile === FIXED_WIDTH_TXT_DAT_INTERPRETATION_PROFILE) &&
      data.interpretationVersion === TXT_DAT_INTERPRETATION_VERSION) ||
    (data.interpretationProfile === XLSX_INTERPRETATION_PROFILE &&
      data.interpretationVersion === XLSX_INTERPRETATION_VERSION);
}

function sameHeaders(actual: readonly string[], expected: readonly string[]): boolean {
  return actual.length === expected.length &&
    actual.every((header, index) => header === expected[index]);
}
function compatibleHeaders(role:IndustrialDatasetRole,actual:readonly string[],expected:readonly string[]):boolean{if(sameHeaders(actual,expected))return true;const allowedOptional=role==="MOVEMENTS"||role==="MATERIAL_MOVEMENTS"?MOVEMENT_ATTRIBUTION_HEADERS:role==="PRODUCTION_ORDERS"?PRODUCTION_ORDER_OPTIONAL_HEADERS:undefined;if(!allowedOptional)return false;if(actual.length<expected.length||!expected.every((header,index)=>actual[index]===header))return false;const optional=actual.slice(expected.length);return new Set(optional).size===optional.length&&optional.every(header=>allowedOptional.includes(header));}
function exactTimestamp(value:string):boolean{return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)&&Number.isFinite(Date.parse(value));}

export function admitIndustrialDataset(
  data: AuthoritativeExternalData,
  contract: IndustrialDatasetRoleContractV1,
): DatasetAdmissionResult {
  if (Array.isArray((contract as any)?.role)) {
    return denied("DATASET_ROLE_AMBIGUOUS");
  }
  if (!contract || contract.version !== 1 || typeof contract.role !== "string") {
    return denied("DATASET_ROLE_CONTRACT_INVALID");
  }
  if (!Object.prototype.hasOwnProperty.call(ROLE_HEADERS, contract.role)) {
    return denied("DATASET_ROLE_UNSUPPORTED");
  }
  if (!data || data.contractVersion !== "1" || !Object.isFrozen(data.provenance)) {
    return denied("DATASET_STRUCTURE_INCOMPATIBLE");
  }
  if (!supportedProfile(data)) return denied("DATASET_PROFILE_INCOMPATIBLE");
  if (!Array.isArray(data.headers) || data.headers.length === 0 ||
    data.headers.some(header => typeof header !== "string" || header.length === 0) ||
    new Set(data.headers).size !== data.headers.length) {
    return denied("DATASET_HEADERS_INVALID");
  }
  const allowed = ROLE_HEADERS[contract.role];
  if (!allowed.some(headers => compatibleHeaders(contract.role,data.headers, headers))) {
    return denied("DATASET_HEADERS_INVALID");
  }
  if (!Array.isArray(data.rows) || data.rows.some(row =>
    !Array.isArray(row) || row.length !== data.headers.length ||
    row.some(cell => typeof cell !== "string"))) {
    return denied("DATASET_STRUCTURE_INCOMPATIBLE");
  }
  if(contract.role==="PRODUCTION_ORDERS"){const index=data.headers.indexOf("planned_output_available_at");if(index>=0&&data.rows.some(row=>row[index]!==""&&!exactTimestamp(row[index]!)))return denied("DATASET_STRUCTURE_INCOMPATIBLE");}

  const roleContract = Object.freeze({ version: 1, role: contract.role });
  const admission = Object.freeze({
    version: 1 as const,
    roleContractVersion: 1 as const,
    role: contract.role,
    datasetIdentity: data.datasetIdentity,
    interpretationProfile: data.interpretationProfile,
    interpretationVersion: data.interpretationVersion,
  });
  return Object.freeze({
    admitted: true,
    dataset: Object.freeze({ version: 1, data, roleContract, admission }),
  });
}

export function adaptAdmittedDatasetToCognitionInput(
  admitted: AdmittedIndustrialDatasetV1,
): Readonly<Pick<SandboxEvaluateRequestV2, CognitionDatasetKey>> {
  const rows = admitted.data.rows.map(row => Object.freeze(
    Object.fromEntries(admitted.data.headers.flatMap((header, index) => header==="planned_output_available_at"&&row[index]===""?[]:[[header, row[index]]])),
  ));
  return Object.freeze({ [ROLE_KEYS[admitted.roleContract.role]]: Object.freeze(rows) }) as
    Readonly<Pick<SandboxEvaluateRequestV2, CognitionDatasetKey>>;
}

export async function runGovernedDatasetAdmissionAtCognitionEntry<T>(input: Readonly<{
  data: AuthoritativeExternalData;
  roleContract: IndustrialDatasetRoleContractV1;
  cognitionRequest: Omit<SandboxEvaluateRequestV2, CognitionDatasetKey>;
  cognitionEntry: (request: SandboxEvaluateRequestV2) => Promise<T>;
}>): Promise<Readonly<{ completed: true; result: T; admittedDataset: AdmittedIndustrialDatasetV1 }> |
  Readonly<{ completed: false; failure: DatasetAdmissionFailure }>> {
  const admission = admitIndustrialDataset(input.data, input.roleContract);
  if (!admission.admitted) return Object.freeze({ completed: false, failure: admission.failure });
  const request = Object.freeze({
    ...input.cognitionRequest,
    ...adaptAdmittedDatasetToCognitionInput(admission.dataset),
  }) as SandboxEvaluateRequestV2;
  const result = await input.cognitionEntry(request);
  return Object.freeze({ completed: true, result, admittedDataset: admission.dataset });
}
