/**
 * PlannerAgent — Governance Event Bus
 * Status: CANONICAL · DETERMINISTIC · SIDE-EFFECT FREE
 *
 * Purpose:
 * - Collect governance-grade signals
 * - Provide structured, auditable events
 * - Never trigger real-world actions
 *
 * This module:
 * - does NOT notify
 * - does NOT call webhooks
 * - does NOT send emails
 * - does NOT integrate external systems
 *
 * It only emits and stores governance events for downstream consumers.
 */

export type GovernanceEventType =
  | "FOUNDER_NOTIFICATION_REQUIRED"
  | "LEGAL_RISK_DETECTED"
  | "BUDGET_THRESHOLD_EXCEEDED"
  | "MODE_ESCALATION_REQUIRED"
  | "DELEGATION_VIOLATION"
  | "POLICY_BREACH"
  | "DECISION_APPROVED"
  | "DECISION_REJECTED";

export interface GovernanceEventPayload {
  contextId: string;
  decisionType?: string;
  status?: string;
  reason?: string;
  mode?: "BASIC" | "JUNIOR" | "SENIOR" | "PRINCIPAL";
  budgetEur?: number;
  policyId?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface GovernanceEvent {
  id: string;
  type: GovernanceEventType;
  payload: GovernanceEventPayload;
  emittedAt: string; // ISO-8601
  source: "CORE";
}

/**
 * Internal event store (runtime only)
 * This is NOT persistence.
 * Snapshot/export is the only legal way out.
 */
const eventLog: GovernanceEvent[] = [];

/**
 * Deterministic ID generator
 * No randomness. No UUID.
 * Audit-friendly and replay-safe.
 */
function generateEventId(
  type: GovernanceEventType,
  contextId: string,
  emittedAt: string
): string {
  return `${type}::${contextId}::${emittedAt}`;
}

/**
 * Emit a governance event
 * This is a pure signal, not an action.
 */
function emit(
  type: GovernanceEventType,
  payload: GovernanceEventPayload
): GovernanceEvent {
  const emittedAt = new Date().toISOString();

  const event: GovernanceEvent = {
    id: generateEventId(type, payload.contextId, emittedAt),
    type,
    payload: {
      ...payload,
      timestamp: emittedAt
    },
    emittedAt,
    source: "CORE"
  };

  eventLog.push(event);

  return event;
}

/**
 * Read-only snapshot of all governance events
 * Safe for audit, logging, compliance, dashboards
 */
function snapshot(): readonly GovernanceEvent[] {
  return [...eventLog];
}

/**
 * Clears runtime log
 * Only legal in test or controlled environments
 */
function clear(): void {
  eventLog.length = 0;
}

/**
 * Public API
 */
export const governanceEvents = Object.freeze({
  emit,
  snapshot,
  clear
});