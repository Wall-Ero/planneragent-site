//core/src/sandbox/routes.voice.ts


import { evaluateSandboxV2 } from "./orchestrator.v2";
import type {
  SandboxEvaluateRequestV2,
    PlanTier,
      PlanningDomain
      } from "./contracts.v2";

      const PLAN_ALIAS: Record<string, PlanTier> = {
        VISION: "BASIC",
          GRADUATE: "JUNIOR",
          };

          function coerceNumberMap(input: unknown): Record<string, number> {
            if (!input || typeof input !== "object") return {};
              const out: Record<string, number> = {};
                for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
                    if (typeof v === "number") out[k] = v;
                      }
                        return out;
                        }

                        export async function voiceDecisionPreview(
                          req: Request,
                            env: Record<string, unknown>
                            ) {
                              const body = (await req.json()) as Partial<SandboxEvaluateRequestV2> & {
                                  plan?: string;
                                    };

                                      const normalizedPlan: PlanTier =
                                          body.plan && body.plan in PLAN_ALIAS
                                                ? PLAN_ALIAS[body.plan]
                                                      : (body.plan as PlanTier) ?? "BASIC";

                                                        const payload: SandboxEvaluateRequestV2 = {
                                                            company_id: body.company_id ?? "demo",
                                                                plan: normalizedPlan,
                                                                    domain: (body.domain ?? "supply_chain") as PlanningDomain,
                                                                       intent:
  normalizedPlan === "BASIC"
    ? "INFORM"
    : normalizedPlan === "JUNIOR"
    ? "ADVISE"
    : "EXECUTE",

                                                                            baseline_snapshot_id: body.baseline_snapshot_id ?? "preview",
                                                                                baseline_metrics: coerceNumberMap(body.baseline_metrics),
                                                                                    scenario_metrics: coerceNumberMap(body.scenario_metrics),

                                                                                        constraints_hint: {},
                                                                                            requested: {
                                                                                                  n_scenarios: 3,
                                                                                                        horizon_days: 21
                                                                                                            }
                                                                                                              };

                                                                                                                const result = await evaluateSandboxV2(payload, env);

                                                                                                                  return new Response(JSON.stringify(result, null, 2), {
                                                                                                                      headers: { "content-type": "application/json" }
                                                                                                                        });
                                                                                                                        }