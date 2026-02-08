// core/src/sandbox/authority/authorityContext.builder.ts
// ======================================================
// Authority Context Builder — P3 Minimal
// Canonical Source of Truth
// ======================================================

import type { SignedSnapshotV1 } from "../contracts.v2";

export type AuthorityContext = {
  company_id: string;
  actor_id: string;
  plan: string;
  authority: "human" | "board" | "system";
};

export function buildAuthorityContext(
  snapshot: SignedSnapshotV1
): AuthorityContext {

  return {
    company_id: snapshot.company_id,
    actor_id: snapshot.actor_id,
    plan: snapshot.plan,
    authority: snapshot.oag_proof.authority
  };
}