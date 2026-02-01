// governance/oag/types.ts
import type { PlanTier, Intent, PlanningDomain } from "../../sandbox/contracts.v2";

export type OagProof = {
  company_id: string;
    actor_id: string;

      plan: PlanTier;
        domain: PlanningDomain;
          intent: Intent;

            sponsor_id?: string;

              issued_at: string;
                authority: "human" | "board" | "system";
                };