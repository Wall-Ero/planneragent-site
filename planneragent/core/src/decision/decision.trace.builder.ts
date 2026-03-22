// core/src/decision/decision.trace.builder.ts
// ============================================================
// Decision Trace Builder — From ORD Trace + DL Evidence → V2 Governance Model
// Canonical Source of Truth
// ============================================================

import type { DlEvidenceV2 } from "../sandbox/contracts.v2"
import type { OrdDecisionTrace } from "./ord/ord.trace"
import { deriveActionsV1 } from "./action.deriver"

import {
  createDecisionTraceV2,
  type DecisionTraceV2,
  type AuthorityLevel,
  type DecisionMode
} from "./decision.trace"

export function buildDecisionTraceFromOrd(input: {
  ord: OrdDecisionTrace
  dl: DlEvidenceV2
  authorityLevel: AuthorityLevel
  decisionMode: DecisionMode
}): DecisionTraceV2 {
  const { ord, dl, authorityLevel, decisionMode } = input

  // ----------------------------------------------------------
  // VISION
  // ----------------------------------------------------------

  const anomalies: string[] = []

  if (ord.reality.ordersSeen === 0) {
    anomalies.push("NO_ORDERS_DATA")
  }

  if (ord.reality.inventorySeen === 0) {
    anomalies.push("NO_INVENTORY_DATA")
  }

  if (ord.reality.shortagesDetected > 0) {
    anomalies.push("SHORTAGE_DETECTED")
  }

  const dataQuality: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN" =
    ord.reality.ordersSeen > 0 && ord.reality.inventorySeen > 0
      ? "MEDIUM"
      : ord.reality.inventorySeen > 0 || ord.reality.ordersSeen > 0
      ? "LOW"
      : "UNKNOWN"

  const vision = {
    reality_snapshot: {
      ordersSeen: ord.reality.ordersSeen,
      inventorySeen: ord.reality.inventorySeen,
      shortagesDetected: ord.reality.shortagesDetected
    },
    data_quality: dataQuality,
    anomalies_detected: anomalies
  }

  // ----------------------------------------------------------
  // AUTHORITY
  // ----------------------------------------------------------

  const authority = {
    level: authorityLevel,
    mode: decisionMode
  }

  // ----------------------------------------------------------
  // DERIVED ACTIONS (deterministic, no LLM)
  // ----------------------------------------------------------

  const derivedActions = deriveActionsV1({
    ord,
    dl
  })

  // ----------------------------------------------------------
  // GRADUATE
  // ----------------------------------------------------------

  const graduate =
    authorityLevel === "GRADUATE"
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
  // JUNIOR
  // ----------------------------------------------------------

  const junior =
    authorityLevel === "JUNIOR"
      ? {
          proposed_actions: derivedActions.proposed_actions.map((item) => ({
            type: item.action.kind,
            description: item.reason,
            expected_impact: item.expected_impact
          })),
          selected_action: {
            approved_by_human: ord.decisionMode === "HUMAN_APPROVED"
          }
        }
      : undefined

  // ----------------------------------------------------------
  // SENIOR
  // ----------------------------------------------------------

  const senior =
    authorityLevel === "SENIOR" || authorityLevel === "PRINCIPAL"
      ? {
          autonomous_execution: (ord.actions ?? []).map((a) => ({
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
    authorityLevel === "PRINCIPAL"
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
    authorityLevel === "CHARTER"
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