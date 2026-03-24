// core/src/sandbox/routes.voice.ts
// ======================================================
// PlannerAgent — Voice Decision Preview (Canonical v7)
// FINAL:
// - No BASIC
// - VISION first-class
// - Structured voice model
// - Policy context + recommendation split
// - Governance translated to language
// ======================================================

import { evaluateSandboxV2 } from "./orchestrator.v2";
import { buildPolicyContext } from "../decision/policy/policy.context.v1";

import type {
  SandboxEvaluateRequestV2,
  PlanTier,
  PlanningDomain,
} from "./contracts.v2";

import { DECISION_CODE_MAP } from "../decision/explainer/decision.codes.v1";

// ======================================================
// TYPES
// ======================================================

type VoiceDecision = {
  message: string;
  why: string[];
  tradeoffs: string[];
  risks: string[];
};

type VoiceContext = {
  historical: {
    summary: string;
    confidence: number;
    signals: string[];
  } | null;
};

type VoiceGovernance = {
  execution: string;
};

type StructuredVoice = {
  decision: VoiceDecision;
  context: VoiceContext;
  governance: VoiceGovernance;
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
    // PLAN
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
    // DECISION BLOCK
    // --------------------------------------------------

    const explanation = result.explanation;

    const decision: VoiceDecision = {
      message: explanation?.summary ?? "No summary available",
      why: translateCodes(explanation?.whyChosen),
      tradeoffs: translateCodes(explanation?.tradeoffs),
      risks: translateCodes(explanation?.risks),
    };

    // --------------------------------------------------
    // POLICY CONTEXT (historical)
    // --------------------------------------------------

    const policyContext = result.policy_used
  ? buildPolicyContext(result.policy_used)
  : null;

    const context: VoiceContext = {
      historical: policyContext
    };

    // --------------------------------------------------
    // GOVERNANCE TRANSLATION
    // --------------------------------------------------

    const governance: VoiceGovernance = {
      execution: translateGovernance(plan)
    };

    // --------------------------------------------------
    // FINAL STRUCTURED VOICE
    // --------------------------------------------------

    const structuredVoice = adaptVoiceByPlan(plan, {
      decision,
      context,
      governance
    });

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return json({
      ok: true,
      plan,
      intent,
      voice: structuredVoice,
      governance_raw: result.governance
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
// GOVERNANCE TRANSLATION (HUMAN)
// ======================================================

function translateGovernance(plan: PlanTier): string {

  if (plan === "VISION") {
    return "Observation only. No execution allowed.";
  }

  if (plan === "JUNIOR" || plan === "GRADUATE") {
    return "Execution requires explicit approval.";
  }

  if (plan === "SENIOR") {
    return "Execution allowed within delegated scope.";
  }

  if (plan === "PRINCIPAL") {
    return "Execution allowed with budget authority.";
  }

  return "Unknown governance state";
}

// ======================================================
// GOVERNANCE VOICE ADAPTATION
// ======================================================

function adaptVoiceByPlan(
  plan: PlanTier,
  voice: StructuredVoice
): StructuredVoice {

  // -------------------------
  // VISION → PURE OBSERVATION
  // -------------------------
  if (plan === "VISION") {
    return {
      decision: {
        ...voice.decision,
        message: `Observation: ${voice.decision.message}`,
        tradeoffs: []
      },
      context: {
        historical: null // 👉 VISION non interpreta policy
      },
      governance: voice.governance
    };
  }

  // -------------------------
  // JUNIOR / GRADUATE → DIALOGUE
  // -------------------------
  if (plan === "JUNIOR" || plan === "GRADUATE") {
    return {
      decision: {
        ...voice.decision,
        message:
          `In similar situations, your company has typically operated this way.\n` +
          `You can continue this approach or consider an alternative.\n\n` +
          `Recommendation: ${voice.decision.message}`
      },
      context: voice.context,
      governance: voice.governance
    };
  }

  // -------------------------
  // SENIOR → EXECUTION
  // -------------------------
  if (plan === "SENIOR") {
    return {
      decision: {
        ...voice.decision,
        message: `Executing under delegation: ${voice.decision.message}`
      },
      context: voice.context,
      governance: voice.governance
    };
  }

  // -------------------------
  // PRINCIPAL → IMPROVEMENT
  // -------------------------
  if (plan === "PRINCIPAL") {
    return {
      decision: {
        ...voice.decision,
        message:
          `System-level improvement opportunity identified.\n\n` +
          `${voice.decision.message}`
      },
      context: voice.context,
      governance: voice.governance
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