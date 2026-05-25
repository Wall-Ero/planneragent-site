// core/src/attention/attention.subscription.ts
// ============================================================
// PlannerAgent — Attention Subscription Store
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Create, read, update and disable human-directed attention.
//
// This layer DOES NOT:
// - evaluate operational reality
// - send notifications
// - authorize execution
// - create governance authority
//
// It DOES:
// - persist what the human asked PlannerAgent to watch
// - retrieve active attention subscriptions
// - disable or expire attention
//
// ============================================================

import type {
  AttentionSubscription,
  AttentionStatus,
  CreateAttentionSubscriptionInput,
} from "./attention.types";

function nowIso(): string {

  return new Date()
    .toISOString();

}

function parseJson<T>(
  value: string | null | undefined,
  fallback: T
): T {

  if (!value) return fallback;

  try {

    return JSON.parse(value) as T;

  } catch {

    return fallback;

  }

}

function normalizeStatus(
  status: unknown
): AttentionStatus {

  const s =
    String(status ?? "")
      .toUpperCase();

  if (
    s === "ACTIVE" ||
    s === "PAUSED" ||
    s === "EXPIRED" ||
    s === "DISABLED"
  ) {

    return s;

  }

  return "ACTIVE";

}

function rowToSubscription(
  row: any
): AttentionSubscription {

  return {

    attention_id:
      row.attention_id,

    tenant_id:
      row.tenant_id,

    company_id:
      row.company_id,

    context_id:
      row.context_id,

    actor_id:
      row.actor_id,

    scope:
      row.scope,

    trigger:
      row.trigger,

    priority:
      row.priority,

    status:
      normalizeStatus(row.status),

    noise_policy:
      row.noise_policy,

    target_ref:
      row.target_ref ?? undefined,

    target_label:
      row.target_label ?? undefined,

    human_request:
      row.human_request,

    condition:
      parseJson(
        row.condition_json,
        undefined
      ),

    metadata:
      parseJson(
        row.metadata_json,
        {}
      ),

    created_at:
      row.created_at,

    updated_at:
      row.updated_at,

    expires_at:
      row.expires_at ?? undefined,

    last_checked_at:
      row.last_checked_at ?? undefined,

    last_triggered_at:
      row.last_triggered_at ?? undefined,
  };

}

export class AttentionSubscriptionStore {

  constructor(
    private db: D1Database
  ) {}

  async create(
    input: CreateAttentionSubscriptionInput
  ): Promise<AttentionSubscription> {

    const createdAt =
      nowIso();

    const subscription:
      AttentionSubscription = {

      attention_id:
        crypto.randomUUID(),

      tenant_id:
        input.tenant_id ?? "default",

      company_id:
        input.company_id,

      context_id:
        input.context_id,

      actor_id:
        input.actor_id,

      scope:
        input.scope,

      trigger:
        input.trigger,

      priority:
        input.priority ?? "MEDIUM",

      status:
        "ACTIVE",

      noise_policy:
        input.noise_policy ?? "IMMEDIATE_ON_TRIGGER",

      target_ref:
        input.target_ref,

      target_label:
        input.target_label,

      human_request:
        input.human_request,

      condition:
        input.condition,

      metadata:
        input.metadata ?? {},

      created_at:
        createdAt,

      updated_at:
        createdAt,

      expires_at:
        input.expires_at,
    };

    await this.db.prepare(`
      INSERT INTO attention_subscriptions (

        attention_id,

        tenant_id,
        company_id,
        context_id,

        actor_id,

        scope,
        trigger,

        priority,
        status,

        noise_policy,

        target_ref,
        target_label,

        human_request,

        condition_json,
        metadata_json,

        created_at,
        updated_at,

        expires_at,

        last_checked_at,
        last_triggered_at

      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(

      subscription.attention_id,

      subscription.tenant_id,
      subscription.company_id,
      subscription.context_id,

      subscription.actor_id,

      subscription.scope,
      subscription.trigger,

      subscription.priority,
      subscription.status,

      subscription.noise_policy,

      subscription.target_ref ?? null,
      subscription.target_label ?? null,

      subscription.human_request,

      subscription.condition
        ? JSON.stringify(subscription.condition)
        : null,

      JSON.stringify(subscription.metadata ?? {}),

      subscription.created_at,
      subscription.updated_at,

      subscription.expires_at ?? null,

      null,
      null

    ).run();

    return subscription;

  }

  async getActive(
    params: {
      company_id: string;
      context_id?: string;
      actor_id?: string;
      now_iso?: string;
    }
  ): Promise<AttentionSubscription[]> {

    const now =
      params.now_iso ?? nowIso();

    const res =
      await this.db.prepare(`
        SELECT *
        FROM attention_subscriptions
        WHERE company_id = ?
          AND status = 'ACTIVE'
          AND (
            expires_at IS NULL
            OR expires_at > ?
          )
        ORDER BY priority DESC, created_at ASC
      `).bind(
        params.company_id,
        now
      ).all();

    let rows =
      (res.results ?? [])
        .map(rowToSubscription);

    if (params.context_id) {

      rows =
        rows.filter(
          x =>
            x.context_id === params.context_id
        );

    }

    if (params.actor_id) {

      rows =
        rows.filter(
          x =>
            x.actor_id === params.actor_id
        );

    }

    return rows;

  }

  async getById(
    attention_id: string
  ): Promise<AttentionSubscription | null> {

    const res =
      await this.db.prepare(`
        SELECT *
        FROM attention_subscriptions
        WHERE attention_id = ?
        LIMIT 1
      `).bind(
        attention_id
      ).first();

    if (!res) return null;

    return rowToSubscription(res);

  }

  async markChecked(
    attention_id: string,
    checked_at = nowIso()
  ): Promise<void> {

    await this.db.prepare(`
      UPDATE attention_subscriptions
      SET
        last_checked_at = ?,
        updated_at = ?
      WHERE attention_id = ?
    `).bind(
      checked_at,
      checked_at,
      attention_id
    ).run();

  }

  async markTriggered(
    attention_id: string,
    triggered_at = nowIso()
  ): Promise<void> {

    await this.db.prepare(`
      UPDATE attention_subscriptions
      SET
        last_triggered_at = ?,
        last_checked_at = ?,
        updated_at = ?
      WHERE attention_id = ?
    `).bind(
      triggered_at,
      triggered_at,
      triggered_at,
      attention_id
    ).run();

  }

  async updateStatus(
    attention_id: string,
    status: AttentionStatus
  ): Promise<void> {

    const updatedAt =
      nowIso();

    await this.db.prepare(`
      UPDATE attention_subscriptions
      SET
        status = ?,
        updated_at = ?
      WHERE attention_id = ?
    `).bind(
      status,
      updatedAt,
      attention_id
    ).run();

  }

  async disable(
    attention_id: string
  ): Promise<void> {

    await this.updateStatus(
      attention_id,
      "DISABLED"
    );

  }

  async expirePastDue(
    now_iso = nowIso()
  ): Promise<number> {

    const res =
      await this.db.prepare(`
        UPDATE attention_subscriptions
        SET
          status = 'EXPIRED',
          updated_at = ?
        WHERE status = 'ACTIVE'
          AND expires_at IS NOT NULL
          AND expires_at <= ?
      `).bind(
        now_iso,
        now_iso
      ).run();

    return Number(
      res.meta?.changes ?? 0
    );

  }

}