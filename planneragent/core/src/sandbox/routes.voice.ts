// core/src/sandbox/routes.voice.ts
// ======================================================
// PlannerAgent — Voice Decision Preview (Canonical v5)
// FINAL:
// - No BASIC
// - VISION is first-class
// - Governance-aligned voice
// ======================================================

import { evaluateSandboxV2 } from "./orchestrator.v2";
import type {
  SandboxEvaluateRequestV2,
  PlanTier,
  PlanningDomain,
} from "./contracts.v2";

import { DECISION_CODE_MAP } from "../decision/explainer/decision.codes.v1";

// ======================================================
// TYPES
// ======================================================

type VoiceBlock = {
  message: string;
  why: string[];
  tradeoffs: string[];
  risks: string[];
};

// ======================================================
// HELPERS
// ======================================================

function coerceNumberMap(input: unknown): Record<string, number> {
  if (!input || typeof input !== "object") return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (typeof v === "number") out[k] = v;
  }
  return out;
}

// ======================================================
// MAIN
// ======================================================

export async function voiceDecisionPreview(
  req: Request,
  env: Record<string, unknown>
) {
  try {
    const body = (await req.json()) as Partial<SandboxEvaluateRequestV2> & {
      plan?: PlanTier;
    };

    // --------------------------------------------------
    // PLAN (no alias, no BASIC)
    // --------------------------------------------------

    const plan: PlanTier = body.plan ?? "VISION";

    // --------------------------------------------------
    // INTENT
    // --------------------------------------------------

    const intent =
      plan === "VISION"
        ? "INFORM"
        : plan === "JUNIOR" || plan === "GRADUATE"
        ? "ADVISE"
        : "EXECUTE";

    // --------------------------------------------------
    // PAYLOAD
    // --------------------------------------------------

    const payload: SandboxEvaluateRequestV2 = {
      request_id: body.request_id ?? `voice-${Date.now()}`,
      company_id: body.company_id ?? "demo",

      plan,
      intent,
      domain: (body.domain ?? "supply_chain") as PlanningDomain,

      baseline_snapshot_id: body.baseline_snapshot_id ?? "preview",
      baseline_metrics: coerceNumberMap(body.baseline_metrics),
      scenario_metrics: coerceNumberMap(body.scenario_metrics),

      constraints_hint: body.constraints_hint ?? {},

      snapshot: body.snapshot ?? {},

      orders: body.orders,
      inventory: body.inventory,
      movements: body.movements,
      movord: body.movord,
      movmag: body.movmag,
      masterBom: body.masterBom,
    };

    // --------------------------------------------------
    // CORE
    // --------------------------------------------------

    const result = await evaluateSandboxV2(payload, env);

    if (!result.ok) {
      return json({ ok: false, error: result.reason }, 400);
    }

    // --------------------------------------------------
    // BASE VOICE
    // --------------------------------------------------

    const explanation = result.explanation;

    const baseVoice: VoiceBlock = {
      message: explanation?.summary ?? "No summary available",
      why: translateCodes(explanation?.whyChosen),
      tradeoffs: translateCodes(explanation?.tradeoffs),
      risks: translateCodes(explanation?.risks),
    };

    // --------------------------------------------------
    // GOVERNANCE VOICE
    // --------------------------------------------------

    const adaptedVoice = adaptVoiceByPlan(plan, baseVoice);

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return json({
      ok: true,
      plan,
      intent,
      voice: adaptedVoice,
      governance: result.governance,
    });

  } catch (err: any) {
    return json(
      {
        ok: false,
        error: err?.message ?? "INTERNAL_ERROR",
      },
      500
    );
  }
}

// ======================================================
// TRANSLATION
// ======================================================

function translateCodes(codes: string[] = []): string[] {
  return codes.map((code) => {
    const meta = DECISION_CODE_MAP[code];
    return meta?.label ?? code;
  });
}

// ======================================================
// GOVERNANCE VOICE
// ======================================================

function adaptVoiceByPlan(plan: PlanTier, voice: VoiceBlock): VoiceBlock {

  // -------------------------
  // VISION → OBSERVATION
  // -------------------------
  if (plan === "VISION") {
    return {
      message: `Observation: ${voice.message}`,
      why: voice.why,
      tradeoffs: [],
      risks: voice.risks,
    };
  }

  // -------------------------
  // JUNIOR / GRADUATE → APPROVAL
  // -------------------------
  if (plan === "JUNIOR" || plan === "GRADUATE") {
    return {
      message: `Recommendation (requires approval): ${voice.message}`,
      why: voice.why,
      tradeoffs: voice.tradeoffs,
      risks: voice.risks,
    };
  }

  // -------------------------
  // SENIOR → DELEGATED
  // -------------------------
  if (plan === "SENIOR") {
    return {
      message: `Delegated execution: ${voice.message}`,
      why: voice.why,
      tradeoffs: voice.tradeoffs,
      risks: voice.risks,
    };
  }

  // -------------------------
  // PRINCIPAL → IMPROVEMENT
  // -------------------------
  if (plan === "PRINCIPAL") {
    return {
      message: `Improvement proposal (budget-aware): ${voice.message}`,
      why: voice.why,
      tradeoffs: voice.tradeoffs,
      risks: voice.risks,
    };
  }

  return voice;
}

// ======================================================
// UTILS
// ======================================================

function json(obj: any, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { "content-type": "application/json" },
  });
}