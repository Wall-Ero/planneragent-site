// core/src/governance/policy/hod.ts
// ======================================================
// PlannerAgent — Human Override Doctrine (HOD)
// Status: CANONICAL · READ-ONLY · POLICY-GATED
// ======================================================
//
// Rules:
// - AI may NEVER override a human
// - Human override is explicit, logged, and final
//

import { getPolicyRegistry } from "./runtime";

export function isHodEnabled(): boolean {
  const registry = getPolicyRegistry();
  return Boolean(registry.policies.hod?.enabled);
}