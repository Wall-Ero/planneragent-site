// core/src/attention/attention.types.ts
// ============================================================
// PlannerAgent — Operational Working Attention Types
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Define temporary human-directed operational focus.
//
// Attention IS:
// - temporary
// - human-directed
// - revocable
// - runtime evaluated
// - notification-oriented
//
// Attention IS NOT:
// - authority
// - execution permission
// - permanent memory
// - governance escalation
// - autonomous monitoring expansion
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Memory remembers the past.
// Attention watches the future.
//
// Observe → Understand → Remember → Focus → Notify
//
// ============================================================

export type AttentionScope =
  | "DELIVERY"
  | "ORDER"
  | "SKU"
  | "CUSTOMER"
  | "SUPPLIER"
  | "PLAN"
  | "REALITY"
  | "EXECUTION"
  | "GOVERNANCE"
  | "GENERAL";

export type LegacyAttentionTrigger =
  | "REALITY_DRIFTING"
  | "REALITY_MISALIGNED";

export type CurrentAttentionTrigger =
  | "CHANGE_DETECTED"
  | "DELIVERY_DATE_CHANGED"
  | "QUANTITY_CHANGED"
  | "PLAN_BROKEN"
  | "REALITY_SHIFTING"
  | "REALITY_UNSTABLE"
  | "DECISION_PRESSURE_HIGH"
  | "EXECUTION_BLOCKED"
  | "GOVERNANCE_REVIEW_REQUIRED"
  | "CUSTOM_CONDITION";

/**
 * Persisted attention identity contract.
 *
 * Legacy Reality triggers remain readable for historical subscriptions and
 * events, but are not creation-facing and do not match Reality Stability.
 */
export type AttentionTrigger =
  | CurrentAttentionTrigger
  | LegacyAttentionTrigger;

export type AttentionPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type AttentionStatus =
| "ACTIVE"
| "PAUSED"
| "RESOLVED"
| "OBSOLETE"
| "EXPIRED"
| "DISABLED";

export type AttentionNoisePolicy =
  | "SILENT_UNLESS_TRIGGERED"
  | "DAILY_DIGEST"
  | "IMMEDIATE_ON_TRIGGER"
  | "CRITICAL_ONLY";

export interface AttentionCondition {

  field?: string;

  operator?:
    | "EQUALS"
    | "NOT_EQUALS"
    | "GREATER_THAN"
    | "LESS_THAN"
    | "CHANGED"
    | "CONTAINS"
    | "EXISTS";

  value?: unknown;

  description?: string;
}

export interface AttentionSubscription {

  attention_id: string;

  tenant_id: string;

  company_id: string;

  context_id: string;

  actor_id: string;

  scope: AttentionScope;

  trigger: AttentionTrigger;

  priority: AttentionPriority;

  status: AttentionStatus;

  noise_policy: AttentionNoisePolicy;

  target_ref?: string;

  target_label?: string;

  human_request: string;

  condition?: AttentionCondition;

  metadata?: Record<string, unknown>;

  created_at: string;

  updated_at: string;

  expires_at?: string;

  last_checked_at?: string;

  last_triggered_at?: string;
}

export interface CreateAttentionSubscriptionInput {

  tenant_id?: string;

  company_id: string;

  context_id: string;

  actor_id: string;

  scope: AttentionScope;

  trigger: CurrentAttentionTrigger;

  priority?: AttentionPriority;

  noise_policy?: AttentionNoisePolicy;

  target_ref?: string;

  target_label?: string;

  human_request: string;

  condition?: AttentionCondition;

  metadata?: Record<string, unknown>;

  expires_at?: string;
}

export interface AttentionEvaluationContext {

  tenant_id?: string;

  company_id: string;

  context_id: string;

  actor_id?: string;

  now_iso: string;

  signals?: any;

  governance?: any;

  execution?: any;

  reality?: any;

  plan?: any;

  previous_snapshot?: any;

  current_snapshot?: any;
}

export interface AttentionEvent {

  attention_id: string;

  scope: AttentionScope;

  trigger: AttentionTrigger;

  priority: AttentionPriority;

  target_ref?: string;

  target_label?: string;

  reason: string;

  human_request: string;

  evidence?: Record<string, unknown>;

  triggered_at: string;
}

export interface AttentionEvaluationResult {

  checked: number;

  triggered: AttentionEvent[];

  suppressed: AttentionEvent[];

  summary: string[];
}

export interface AttentionNotificationPayload {

  attention_id: string;

  priority: AttentionPriority;

  title: string;

  message: string;

  target_ref?: string;

  target_label?: string;

  reason: string;

  created_at: string;

  metadata?: Record<string, unknown>;
}
