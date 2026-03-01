// src/governance/legal/legalState.ts
// ============================================
// Legal State — Runtime Flag (Week 0)
// Canonical Snapshot · Source of Truth
// ============================================

export type LegalState = "PRE_SRL" | "SRL_ACTIVE";

export function resolveLegalState(raw?: string): LegalState {
  const v = String(raw ?? "").trim().toUpperCase();
  if (v === "SRL_ACTIVE") return "SRL_ACTIVE";
  return "PRE_SRL";
}