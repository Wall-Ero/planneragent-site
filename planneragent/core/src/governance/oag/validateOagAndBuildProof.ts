// core/src/governance/oag/validateOagAndBuildProof.ts
// ======================================================
// validateOagAndBuildProof — Graph-based wrapper v1
// Canonical Source of Truth
//
// Rules:
// - Client never self-mints authority.
// - Graph must be valid (no self-delegation, no expired delegations, etc.).
// - Plan→Intent constitutional matrix enforced (inside runtime).
// - Board actor may bootstrap "board" authority in pre-SRL demo mode.
// - Otherwise: a matching delegation must exist.
// ======================================================

import type { Intent, PlanTier, PlanningDomain, OagProof } from "../../sandbox/contracts.v2";
import type { OagGraph } from "../authority.graph";
import { oagStoreSingleton } from "./authority.graph.store";
import { resolveAuthorityFromGraph } from "./authority.graph.runtime";

export type ValidateOagInput = {
  company_id: string;
  actor_id: string;
  plan: PlanTier;
  intent: Intent;
  domain: PlanningDomain;
  now_iso?: string;
};

export type ValidateOagOk = { ok: true; proof: OagProof };
export type ValidateOagFail = { ok: false; reason: string };

export async function validateOagAndBuildProof(input: ValidateOagInput): Promise<ValidateOagOk | ValidateOagFail> {
  const graph = oagStoreSingleton.getGraph() as OagGraph | null | undefined;

  if (!graph) {
    return { ok: false, reason: "OAG_NO_GRAPH" };
  }

  // Optional but sane: prevent cross-company proofing with a wrong graph loaded
  if (graph.company_id !== input.company_id) {
    return { ok: false, reason: "OAG_GRAPH_COMPANY_MISMATCH" };
  }

  const res = resolveAuthorityFromGraph(graph, input);
  if (!res.ok) return { ok: false, reason: res.reason };

  return { ok: true, proof: res.proof };
}