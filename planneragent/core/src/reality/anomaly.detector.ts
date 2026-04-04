//core/src/reality/anomaly.detector.ts

// ======================================================
// PlannerAgent — Inventory Anomaly Detector v1
// Canonical Source of Truth
//
// PURPOSE:
// - explain WHY ERP != reconstructed reality
// - classify anomaly types
// - provide actionable diagnosis
// ======================================================

type InventoryRow = {
  sku: string;
  erpQty: number;
  reconstructedQty: number;
};

type Movement = {
  sku: string;
  qty: number;
  type?: string; // T, U, B, etc.
  date?: string;
  event?: string; // optional enriched event
};

export type AnomalyCause =
  | "PRODUCTION_NOT_POSTED"
  | "CONSUMPTION_NOT_REFLECTED"
  | "TRANSFER_NOT_REGISTERED"
  | "ERP_OVERESTIMATION"
  | "ERP_UNDERESTIMATION"
  | "UNKNOWN";

export type AnomalyDiagnosis = {
  sku: string;
  delta: number;
  absDelta: number;
  cause: AnomalyCause;
  confidence: number;
  explanation: string;
  suggestedAction?: string;
};

// ======================================================
// ENTRY
// ======================================================

export function detectInventoryAnomalies(
  rows: InventoryRow[],
  movements: Movement[]
): AnomalyDiagnosis[] {
  const result: AnomalyDiagnosis[] = [];

  for (const row of rows) {
    const { sku, erpQty, reconstructedQty } = row;

    const delta = erpQty - reconstructedQty;
    const absDelta = Math.abs(delta);

    if (absDelta === 0) continue;

    const relatedMovements = movements.filter(
      (m) => m.sku === sku
    );

    const diagnosis = diagnoseSku(
      sku,
      erpQty,
      reconstructedQty,
      delta,
      absDelta,
      relatedMovements
    );

    result.push(diagnosis);
  }

  return result;
}

// ======================================================
// CORE DIAGNOSIS
// ======================================================

function diagnoseSku(
  sku: string,
  erpQty: number,
  reconstructedQty: number,
  delta: number,
  absDelta: number,
  movements: Movement[]
): AnomalyDiagnosis {

  // --------------------------------------------------
  // classify movement signals
  // --------------------------------------------------

  let productionLoad = 0;
  let consumption = 0;
  let transfers = 0;

  for (const m of movements) {
    const qty = Number(m.qty ?? 0);

    if (!Number.isFinite(qty)) continue;

    const type = String(m.type ?? "").toUpperCase();
    const event = String(m.event ?? "").toUpperCase();

    if (type === "T" || event.includes("PRODUCTION")) {
      productionLoad += qty;
    } else if (type === "U" || event.includes("CONSUMPTION")) {
      consumption += Math.abs(qty);
    } else if (type === "B" || event.includes("TRANSFER")) {
      transfers += Math.abs(qty);
    }
  }

  // --------------------------------------------------
  // RULES
  // --------------------------------------------------

  // CASE 1: reconstructed > ERP
  // -> production not posted OR inbound not recorded
  if (reconstructedQty > erpQty) {

    if (productionLoad > 0) {
      return build(
        sku,
        delta,
        absDelta,
        "PRODUCTION_NOT_POSTED",
        0.9,
        `ERP shows ${erpQty}, but ${productionLoad} units were produced and not posted.`,
        "Post production receipt into ERP"
      );
    }

    if (transfers > 0) {
      return build(
        sku,
        delta,
        absDelta,
        "TRANSFER_NOT_REGISTERED",
        0.7,
        `Stock appears increased by transfers not reflected in ERP.`,
        "Verify inbound transfer postings"
      );
    }

    return build(
      sku,
      delta,
      absDelta,
      "ERP_UNDERESTIMATION",
      0.6,
      `Reconstructed stock is higher than ERP. Missing inbound or posting.`,
      "Reconcile ERP stock with physical inventory"
    );
  }

  // CASE 2: reconstructed < ERP
  // -> consumption not reflected OR ERP inflated
  if (reconstructedQty < erpQty) {

    if (consumption > 0) {
      return build(
        sku,
        delta,
        absDelta,
        "CONSUMPTION_NOT_REFLECTED",
        0.9,
        `ERP shows ${erpQty}, but ${consumption} units were consumed.`,
        "Verify production consumption postings"
      );
    }

    return build(
      sku,
      delta,
      absDelta,
      "ERP_OVERESTIMATION",
      0.6,
      `ERP stock is higher than reconstructed reality.`,
      "Adjust ERP inventory to match actual stock"
    );
  }

  // fallback (should never happen)
  return build(
    sku,
    delta,
    absDelta,
    "UNKNOWN",
    0.3,
    "Unable to determine anomaly cause",
    "Manual investigation required"
  );
}

// ======================================================
// HELPER
// ======================================================

function build(
  sku: string,
  delta: number,
  absDelta: number,
  cause: AnomalyCause,
  confidence: number,
  explanation: string,
  suggestedAction?: string
): AnomalyDiagnosis {
  return {
    sku,
    delta,
    absDelta,
    cause,
    confidence,
    explanation,
    suggestedAction,
  };
}