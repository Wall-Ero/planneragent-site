import { INDUSTRIAL_CAPABILITIES } from "../industrial/capabilities";
import { OFFERS_V1 } from "../market/offers";
import { isExecutionAllowedForPlan } from "../sandbox/authority/authorityExecution.policy";
import type { PlanningDomain, PlanTier } from "../sandbox/contracts.v2";

const tiers = ["VISION", "GRADUATE", "JUNIOR", "SENIOR", "PRINCIPAL", "CHARTER"] as const satisfies readonly PlanTier[];
const planningDomains = ["supply_chain", "production", "logistics", "finance", "general"] as const satisfies readonly PlanningDomain[];

export type PlannerAgentPublicCapabilityProjectionV1 = Readonly<{
  version: 1;
  product: "PlannerAgent";
  purpose: string;
  tiers: readonly Readonly<{ name: PlanTier; publicly_available: boolean; execution_possible_by_tier: boolean }>[];
  supported_planning_domains: readonly PlanningDomain[];
  supported_data_categories: readonly string[];
  vision: Readonly<{ observation_only: true; execution_allowed: false }>;
  data_introduction: Readonly<{ registration_required: true; accepted_later: readonly ["CSV", "XLSX", "SUPPORTED_API_OR_DATA_SOURCE"] }>;
  limitations: readonly string[];
}>;

export function createPlannerAgentPublicCapabilityProjectionV1(): PlannerAgentPublicCapabilityProjectionV1 {
  const categories = [...new Set(INDUSTRIAL_CAPABILITIES.filter(({ verb }) => verb === "read").map(({ description }) => description))].sort();
  return Object.freeze({
    version: 1,
    product: "PlannerAgent",
    purpose: "Operational planning support that helps people understand plan, reality, and governed action boundaries.",
    tiers: Object.freeze(tiers.map((name) => Object.freeze({
      name,
      publicly_available: Boolean(OFFERS_V1.tiers[name].visible_on_site && OFFERS_V1.tiers[name].availability.pre_srl),
      execution_possible_by_tier: isExecutionAllowedForPlan(name),
    }))),
    supported_planning_domains: Object.freeze([...planningDomains]),
    supported_data_categories: Object.freeze(categories),
    vision: Object.freeze({ observation_only: true, execution_allowed: false }),
    data_introduction: Object.freeze({ registration_required: true, accepted_later: Object.freeze(["CSV", "XLSX", "SUPPORTED_API_OR_DATA_SOURCE"] as const) }),
    limitations: Object.freeze([
      "No user-specific operational claim is made until appropriate data is admitted.",
      "Anonymous conversation cannot introduce data, access organizations, monitor participants, or execute actions.",
      "Capabilities not represented in this public projection must not be claimed.",
    ]),
  });
}
