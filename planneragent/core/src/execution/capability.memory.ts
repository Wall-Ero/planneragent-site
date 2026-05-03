// ======================================================
// PlannerAgent — Capability Memory (Canonical)
// Persistent + In-Memory Fallback
// ======================================================

type MemoryRecord = {
  action: string;
  capabilityId: string;
  successCount: number;
  failureCount: number;
  lastUsedAt: string;
};

const inMemoryStore = new Map<string, MemoryRecord>();

// ======================================================
// CONFIG
// ======================================================

const SUCCESS_WEIGHT = 1;
const FAILURE_WEIGHT = -2;

// ======================================================
// HELPERS
// ======================================================

function buildKey(action: string, capabilityId: string) {
  return `${action}__${capabilityId}`;
}

function score(record: MemoryRecord): number {
  return (
    record.successCount * SUCCESS_WEIGHT +
    record.failureCount * FAILURE_WEIGHT
  );
}

// ======================================================
// READ (MAIN ENTRY)
// ======================================================

export async function getCapabilityFromMemory(
  action: string,
  env?: { DB?: D1Database }
): Promise<string | null> {

  // ---------------------------
  // 1. DB FIRST
  // ---------------------------
  if (env?.DB) {
    try {
      const rows = await env.DB.prepare(`
        SELECT capability_id, success_count, failure_count
        FROM capability_memory
        WHERE action = ?
      `)
        .bind(action)
        .all();

      if (rows?.results?.length) {
        const best = rows.results
          .map((r: any) => ({
            capabilityId: r.capability_id,
            score:
              r.success_count * SUCCESS_WEIGHT +
              r.failure_count * FAILURE_WEIGHT,
          }))
          .sort((a, b) => b.score - a.score)[0];

        if (best && best.score > 0) {
          return best.capabilityId;
        }
      }
    } catch (err) {
      console.log("MEMORY_DB_READ_FAILED", err);
    }
  }

  // ---------------------------
  // 2. FALLBACK MEMORY
  // ---------------------------
  const candidates = Array.from(inMemoryStore.values())
    .filter((r) => r.action === action);

  if (!candidates.length) return null;

  const best = candidates.sort(
    (a, b) => score(b) - score(a)
  )[0];

  return score(best) > 0 ? best.capabilityId : null;
}

// ======================================================
// WRITE (LEARNING)
// ======================================================

export async function learnCapability(params: {
  action: string;
  capabilityId: string;
  success: boolean;
  env?: { DB?: D1Database };
}) {

  const { action, capabilityId, success, env } = params;

  const key = buildKey(action, capabilityId);

  // ---------------------------
  // 1. UPDATE MEMORY
  // ---------------------------
  const existing = inMemoryStore.get(key);

  const updated: MemoryRecord = {
    action,
    capabilityId,
    successCount: existing?.successCount ?? 0,
    failureCount: existing?.failureCount ?? 0,
    lastUsedAt: new Date().toISOString(),
  };

  if (success) updated.successCount++;
  else updated.failureCount++;

  inMemoryStore.set(key, updated);

  // ---------------------------
  // 2. PERSIST TO DB
  // ---------------------------
  if (env?.DB) {
    try {
      await env.DB.prepare(`
        INSERT INTO capability_memory (
          action,
          capability_id,
          success_count,
          failure_count,
          last_used_at
        )
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(action, capability_id)
        DO UPDATE SET
          success_count = success_count + ?,
          failure_count = failure_count + ?,
          last_used_at = ?
      `)
        .bind(
          action,
          capabilityId,
          success ? 1 : 0,
          success ? 0 : 1,
          updated.lastUsedAt,
          success ? 1 : 0,
          success ? 0 : 1,
          updated.lastUsedAt
        )
        .run();

    } catch (err) {
      console.log("MEMORY_DB_WRITE_FAILED", err);
    }
  }
}