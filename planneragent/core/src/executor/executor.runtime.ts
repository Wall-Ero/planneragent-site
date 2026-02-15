// PATH: core/src/executor/executor.runtime.ts
// ======================================================
// PlannerAgent — Executor Light Runtime
// Status: CANONICAL · GO-TO-MARKET SAFE
// ======================================================

import type { ExecutorRequest } from "../../../contracts/executor/executor.request";
import type { ExecutorResult } from "./executor.result";

import { assertExecutorAuthority, assertExecutorScope } from "./executor.guard";
import { generateAuditRef } from "./executor.audit";

// ------------------------------------------------------
// PREVIEW — no side effects
// ------------------------------------------------------

export function previewExecution(req: ExecutorRequest): ExecutorResult {
  try {
    assertExecutorAuthority(req);
    assertExecutorScope(req);

    return {
      ok: true,
      audit_ref: "preview-only",
      executed_at: new Date().toISOString(),
    };
  } catch (err) {
    return {
      ok: false,
      reason: (err as Error).message,
    };
  }
}

// ------------------------------------------------------
// RUN — real execution (still light)
// ------------------------------------------------------

export function runExecution(req: ExecutorRequest): ExecutorResult {
  try {
    assertExecutorAuthority(req);
    assertExecutorScope(req);

    const auditRef = generateAuditRef();

    // ⚠️ REAL execution will be plugged here (later P6/P7)
    // For now: controlled no-op

    return {
      ok: true,
      audit_ref: auditRef,
      executed_at: new Date().toISOString(),
    };
  } catch (err) {
    return {
      ok: false,
      reason: (err as Error).message,
    };
  }
}