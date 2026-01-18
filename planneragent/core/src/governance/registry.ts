/**
 * Governance Policy Registry — Dataset Loader
 * Status: CANONICAL v1
 *
 * Responsibility:
 * - Load raw governance policy datasets
 * - No validation
 * - No interpretation
 * - No side effects
 */

export type PolicyBundle = {
  policies: string[];
  hash: string;
  loaded_at: string;
};

export async function loadPolicyDatasets(): Promise<PolicyBundle> {
  // v1 — static placeholder (filesystem / KV / remote loader comes later)
  // This keeps Core deterministic while unblocking bootstrap.

  const policies = [
    "delegation.policy.v1",
    "budget.policy.v1",
    "authority.policy.v1",
    "execution.policy.v1",
  ];

  return {
    policies,
    hash: computeHash(policies),
    loaded_at: new Date().toISOString(),
  };
}

// --- Internal

function computeHash(input: string[]): string {
  // Deterministic, simple, audit-friendly (NOT cryptographic)
  return (
    "POLICY-" +
    input
      .join("|")
      .split("")
      .reduce((acc, c) => acc + c.charCodeAt(0), 0)
      .toString(16)
  );
}