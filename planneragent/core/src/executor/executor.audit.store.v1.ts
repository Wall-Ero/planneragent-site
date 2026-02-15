// core/src/executor/executor.audit.store.v1.ts
// ==================================================
// Executor Audit Store v1
// Canonical Source of Truth
// ==================================================

import type { ExecutorAuditEntryV1 } from "./executor.audit.v1";

// Placeholder: D1 / KV / DB later
const AUDIT_LOG: ExecutorAuditEntryV1[] = [];

export function storeExecutorAuditV1(
  entry: ExecutorAuditEntryV1
): void {
  AUDIT_LOG.push(entry);
}

export function listExecutorAuditsV1(): ExecutorAuditEntryV1[] {
  return [...AUDIT_LOG];
}