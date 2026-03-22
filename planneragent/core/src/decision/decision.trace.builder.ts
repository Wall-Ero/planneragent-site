// core/src/decision/decision.trace.builder.ts
// ============================================================
// Decision Trace Builder — From ORD Trace → V2 Governance Model
// Canonical Source of Truth
// ============================================================

import type { OrdDecisionTrace } from "./ord/ord.trace"
import type { DlEvidenceV2 } from "../sandbox/contracts.v2"

import {
  createDecisionTraceV2,
  type DecisionTraceV2,
  type AuthorityLevel,
  type DecisionMode
} from "./decision.trace"

import { deriveActionsV1 } from "./action.deriver"


export function buildDecisionTraceFromOrd(input: {
  ord: OrdDecisionTrace
  dl: DlEvidenceV2

  authorityLevel: AuthorityLevel
  decisionMode: DecisionMode

}): DecisionTraceV2 {

  const { ord, dl } = input

  // ----------------------------------------------------------
  // VISION
  // ----------------------------------------------------------

  const { ordersSeen, inventorySeen, shortagesDetected } = ord.reality

  let data_quality: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN"

  if (ordersSeen === 0 && inventorySeen === 0) {
    data_quality = "UNKNOWN"
  } else if (inventorySeen === 0) {
    data_quality = "LOW"
  } else if (shortagesDetected > 0) {
    data_quality = "MEDIUM"
  } else {
    data_quality = "HIGH"
  }

  const anomalies: string[] = []

  if (inventorySeen === 0) {
    anomalies.push("NO_INVENTORY_DATA")
  }

  if (shortagesDetected > 0) {
    anomalies.push("SHORTAGE_DETECTED")
  }

  if (ordersSeen === 0) {
    anomalies.push("NO_ORDERS_DATA")
  }

  const vision = {
    reality_snapshot: {
      ordersSeen,
      inventorySeen,
      shortagesDetected
    },
    data_quality,
    anomalies_detected: anomalies
  }

  // ----------------------------------------------------------
  // AUTHORITY
  // ----------------------------------------------------------

  const authority = {
    level: input.authorityLevel,
    mode: input.decisionMode
  }

  // ----------------------------------------------------------
  // GRADUATE
  // ----------------------------------------------------------

  const graduate =
    input.authorityLevel === "GRADUATE"
      ? {
          ai_usage: {
            provider: "UNKNOWN",
            purpose: "UNSPECIFIED_ACTION"
          },
          real_world_impact: {
            impact_type: "PROCESS_TRIGGER" as const,
            system_target: "UNKNOWN" as const,
            entity_target: {
              type: "generic" as const
            },
            action: {
              type: "TRIGGER" as const
            },
            reversibility: "REVERSIBLE" as const,
            risk_level: "MEDIUM" as const
          },
          human_control: {
            reviewed: true,
            approved: true
          }
        }
      : undefined

  // ----------------------------------------------------------
  // JUNIOR (NOW POWERED BY ACTION DERIVER)
  // ----------------------------------------------------------

  const junior =
    input.authorityLevel === "JUNIOR"
      ? (() => {

          const derived = deriveActionsV1({
            ord,
            dl
          })

          return {
            proposed_actions: derived.proposed_actions.map(p => ({
              type: p.action.kind,
              description: p.reason,
              expected_impact: p.expected_impact
            })),
            selected_action: {
              approved_by_human:
                input.decisionMode === "HUMAN_APPROVED"
            }
          }
        })()
      : undefined

  // ----------------------------------------------------------
  // SENIOR
  // ----------------------------------------------------------

  const senior =
    input.authorityLevel === "SENIOR" ||
    input.authorityLevel === "PRINCIPAL"
      ? {
          autonomous_execution: (ord.actions ?? []).map(a => ({
            type: a.kind,
            description: `Executed on SKU ${a.sku ?? "unknown"}`,
            executed: ord.governance.executionAllowed
          }))
        }
      : undefined

  // ----------------------------------------------------------
  // PRINCIPAL
  // ----------------------------------------------------------

  const principal =
    input.authorityLevel === "PRINCIPAL"
      ? {
          process_improvement: {
            action: "OPTIMIZATION_PROPOSAL",
            expected_roi: undefined
          },
          resource_constraints: {
            within_budget: true,
            within_scope: true
          }
        }
      : undefined

  // ----------------------------------------------------------
  // CHARTER
  // ----------------------------------------------------------

  const charter =
    input.authorityLevel === "CHARTER"
      ? {
          compliance: {
            allowed: ord.governance.executionAllowed,
            violations: ord.governance.executionAllowed
              ? []
              : ["EXECUTION_NOT_ALLOWED"]
          },
          enforced_rules: ["POLICY_CHECK"]
        }
      : undefined

  // ----------------------------------------------------------
  // BUILD
  // ----------------------------------------------------------

  return createDecisionTraceV2({
    requestId: ord.requestId,

    authority,
    vision,

    graduate,
    junior,
    senior,
    principal,
    charter
  })
}