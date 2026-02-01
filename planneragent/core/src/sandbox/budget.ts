// sandbox/llm/budget.ts


import type { D1Database } from "@cloudflare/workers-types";

export type PlanTier = "BASIC" | "JUNIOR" | "SENIOR";

export interface LlmBudgetConfig {
  basicMonthlyCapEur: number;      // es. 50
  juniorContributionPct: number;   // es. 0.05
  seniorContributionPct: number;   // es. 0.07
}

export const DEFAULT_LLM_BUDGET: LlmBudgetConfig = {
  basicMonthlyCapEur: 50,
  juniorContributionPct: 0.05,
  seniorContributionPct: 0.07,
};

export function getLlmBudgetConfig(
  plan: PlanTier,
  overrides?: Partial<LlmBudgetConfig>
): LlmBudgetConfig {
  const base = { ...DEFAULT_LLM_BUDGET, ...overrides };

  switch (plan) {
    case "BASIC":
      return {
        ...base,
        juniorContributionPct: 0,
        seniorContributionPct: 0,
      };

    case "JUNIOR":
      return {
        ...base,
        seniorContributionPct: 0,
      };

    case "SENIOR":
      return base;

    default:
      return base;
  }
}

// ----------------------------
// Helpers
// ----------------------------
function currentMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// ----------------------------
// Budget bootstrap
// ----------------------------
export async function ensureGlobalBudget(
  db: D1Database,
  config: LlmBudgetConfig = DEFAULT_LLM_BUDGET
) {
  const month = currentMonth();

  const existing = await db
    .prepare(
      `SELECT id FROM llm_global_budget WHERE month = ?`
    )
    .bind(month)
    .first();

  if (existing) return;

  await db
    .prepare(
      `INSERT INTO llm_global_budget
       (id, month, total_budget_eur, used_budget_eur, updated_at)
       VALUES (?, ?, ?, 0, ?)`
    )
    .bind(
      crypto.randomUUID(),
      month,
      config.basicMonthlyCapEur,
      new Date().toISOString()
    )
    .run();
}

// ----------------------------
// Guard: can we consume LLM?
// ----------------------------
export async function canConsumeLLM(
  db: D1Database,
  companyId: string,
  plan: PlanTier,
  estimatedCostEur: number
): Promise<boolean> {
  const month = currentMonth();

  if (plan !== "BASIC") {
    // Junior & Senior: always allowed (they pay)
    return true;
  }

  const budget = await db
    .prepare(
      `SELECT total_budget_eur, used_budget_eur
       FROM llm_global_budget
       WHERE month = ?`
    )
    .bind(month)
    .first<any>();

  if (!budget) return false;

  return (
    budget.used_budget_eur + estimatedCostEur <= budget.total_budget_eur
  );
}

// ----------------------------
// Record usage
// ----------------------------
export async function recordLlmUsage(
  db: D1Database,
  params: {
    companyId: string;
    plan: PlanTier;
    provider: string;
    model: string;
    estimatedCostEur: number;
  }
) {
  const month = currentMonth();
  const now = new Date().toISOString();

  // 1) per-company usage
  await db
    .prepare(
      `INSERT INTO llm_company_usage
       (company_id, month, plan_tier, llm_calls, estimated_cost_eur, last_call_at)
       VALUES (?, ?, ?, 1, ?, ?)
       ON CONFLICT(company_id, month)
       DO UPDATE SET
         llm_calls = llm_calls + 1,
         estimated_cost_eur = estimated_cost_eur + excluded.estimated_cost_eur,
         last_call_at = excluded.last_call_at`
    )
    .bind(
      params.companyId,
      month,
      params.plan,
      params.estimatedCostEur,
      now
    )
    .run();

  // 2) global BASIC budget
  if (params.plan === "BASIC") {
    await db
      .prepare(
        `UPDATE llm_global_budget
         SET used_budget_eur = used_budget_eur + ?,
             updated_at = ?
         WHERE month = ?`
      )
      .bind(params.estimatedCostEur, now, month)
      .run();
  }

  // 3) audit log
  await db
    .prepare(
      `INSERT INTO llm_call_log
       (id, company_id, plan_tier, provider, model, estimated_cost_eur, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      crypto.randomUUID(),
      params.companyId,
      params.plan,
      params.provider,
      params.model,
      params.estimatedCostEur,
      now
    )
    .run();
}

// ----------------------------
// Redistribution (monthly)
// ----------------------------
export async function recordRedistribution(
  db: D1Database,
  companyId: string,
  plan: PlanTier,
  subscriptionEur: number,
  config: LlmBudgetConfig = DEFAULT_LLM_BUDGET
) {
  if (plan === "BASIC") return;

  const pct =
    plan === "JUNIOR"
      ? config.juniorContributionPct
      : config.seniorContributionPct;

  const contribution = subscriptionEur * pct;
  const month = currentMonth();

  await db
    .prepare(
      `INSERT INTO llm_redistribution
       (id, month, source_plan, source_company_id, contribution_eur, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(
      crypto.randomUUID(),
      month,
      plan,
      companyId,
      contribution,
      new Date().toISOString()
    )
    .run();

  // add to global pool
  await db
    .prepare(
      `UPDATE llm_global_budget
       SET total_budget_eur = total_budget_eur + ?,
           updated_at = ?
       WHERE month = ?`
    )
    .bind(contribution, new Date().toISOString(), month)
    .run();
}

// ----------------------------
// Remaining budget (BASIC global pool)
// ----------------------------
export async function getBasicBudgetRemainingEur(
  db: D1Database,
  config: LlmBudgetConfig = DEFAULT_LLM_BUDGET
): Promise<number> {
  await ensureGlobalBudget(db, config);

  const month = currentMonth();

  const row = await db
    .prepare(
      `SELECT total_budget_eur, used_budget_eur
       FROM llm_global_budget
       WHERE month = ?`
    )
    .bind(month)
    .first<any>();

  if (!row) return 0;

  const total = Number(row.total_budget_eur ?? 0);
  const used = Number(row.used_budget_eur ?? 0);

  const remaining = total - used;
  return remaining > 0 ? remaining : 0;
}