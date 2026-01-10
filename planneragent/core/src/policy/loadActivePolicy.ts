import { PolicyRecord } from "./types";

export async function loadActivePolicy(
  env: any,
  policyId: string
): Promise<PolicyRecord> {
  const row = await env.POLICIES_DB
    .prepare(
      `
      SELECT *
        FROM policies
        WHERE policyId = ?
          AND status = 'active'
        LIMIT 1
      `)
    .bind(policyId)
    .first();

  if (!row) {
    throw new Error(
      `HUMAN_REQUIRED: no ACTIVE policy found for policyId=${policyId}`
    );
  }

  return {
    ...(row as PolicyRecord),
    policyJson: JSON.parse((row as
any).policyJson),
    };
}

