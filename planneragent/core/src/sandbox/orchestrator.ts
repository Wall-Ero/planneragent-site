// src/sandbox/orchestrator.ts
// ===============================
// Sandbox Orchestrator v1
// - Fan-out 3 LLM (parallel)
// - Normalize LLM outputs
// - Compute DQM (deterministic)
// - Return SandboxEvaluationSummary
// ===============================

import {
  SandboxScenarioInput,
  SandboxScenarioResult,
  SandboxEvaluationSummary,
  SandboxScenarioId,
  SandboxOrchestratorConfig,
  SandboxScenarioRankedResult,
} from "./contracts";

import { computeDqmV1 } from "./dqm";

// llm.ts must export: callManyLLMs(calls: LlmCall[], env?: any) -> Promise<LlmResult[]>
import { callManyLLMs, type LlmCall, type LlmResult } from "./llm";

// -------------------------------
// Helpers
// -------------------------------

function nowIso() {
  return new Date().toISOString();
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function safeString(x: unknown, fallback = ""): string {
  if (typeof x === "string") return x;
  try {
    return JSON.stringify(x);
  } catch {
    return fallback;
  }
}

// Normalized, governance-safe LLM output:
// - text only (advisory)
// - no decisions, no execution
export type NormalizedLlmAdvice = {
  provider: string;          // e.g. "openai", "anthropic", "google"
  model: string;             // e.g. "gpt-4.1", "claude-3.5", ...
  ok: boolean;
  latencyMs?: number;
  text: string;              // brief advisory narrative
  tokensIn?: number;
  tokensOut?: number;
  error?: string;
};

function normalizeLlmResult(r: LlmResult): NormalizedLlmAdvice {
  // Support a few common shapes without being brittle.
  const provider = (r as any).provider ?? (r as any).vendor ?? "unknown";
  const model = (r as any).model ?? "unknown";
  const ok = Boolean((r as any).ok ?? !(r as any).error);
  const latencyMs = (r as any).latencyMs ?? (r as any).latency_ms;
  const tokensIn = (r as any).tokensIn ?? (r as any).input_tokens;
  const tokensOut = (r as any).tokensOut ?? (r as any).output_tokens;

  // Prefer explicit text fields; fallback to generic.
  const text =
    (r as any).text ??
    (r as any).outputText ??
    (r as any).content ??
    (r as any).message ??
    safeString((r as any).raw ?? (r as any), "");

  const error = (r as any).error ? safeString((r as any).error) : undefined;

  // Keep it short-ish to avoid bloating payloads (governance-friendly).
  const trimmed = (text ?? "").toString().trim().slice(0, 4000);

  return {
    provider,
    model,
    ok,
    latencyMs,
    tokensIn,
    tokensOut,
    text: trimmed,
    error,
  };
}

// Build 3 LLM calls for a scenario.
// IMPORTANT: LLM sees only scenario input + metrics; no secrets.
// It must produce advisory text only (no actions).
function buildScenarioLlmCalls(
  scenario: SandboxScenarioInput
): LlmCall[] {
  const base = {
    scenarioId: scenario.scenarioId,
    baselineMetrics: scenario.baselineMetrics,
    scenarioMetrics: scenario.scenarioMetrics,
    feasible: scenario.feasible,
  };

  const promptText = `
You are an operations planning exploration model.
You must provide advisory analysis ONLY (no execution, no decisions).
Given baseline vs scenario metrics, explain:
1) main drivers of improvement/worsening
2) key risks and blind spots
3) suggested additional checks (data, constraints, edge cases)
Keep it concise and structured.
JSON input:
${safeString(base)}
`.trim();

  // These 3 are "logical slots". Your llm.ts can map them to real providers/models via env.
  return [
    {
      provider: "openai",
      model: "slotA",
      callId: '${scenario.scenarioId}-A',
      messages: [
        {role: "system", content: "You are an operations planning advisor."},
        {role: "user", content: promptText}
      ],
      temperature: 0.2,
      maxTokens: 500,
    },
    {
      provider: "anthropic",
      model: "slotB",
      callId: '${scenario.scenarioId}-B',
      messages: [
        {role: "system", content: "You are an operations planning advisor."},
        {role: "user", content: promptText}
      ],
      temperature: 0.2,
      maxTokens: 500,
    },
    {
      provider: "openai",
      model: "slotC",
      callId: '${scenario.scenarioId}-C',
      messages: [
        {role: "system", content: "You are an operations planning advisor."},
        {role: "user", content: promptText}
      ],
      temperature: 0.2,
      maxTokens: 500,
    },
  ] as LlmCall[];
}

// Optional: simple confidence proxy from 3 LLMs agreement (text-length & ok rate)
// This is NOT used for scoring. Only for notes/debug.
function computeAdvisoryHealth(advice: NormalizedLlmAdvice[]) {
  const okRate = advice.length
    ? advice.filter(a => a.ok).length / advice.length
    : 0;

  const avgLen = advice.length
    ? advice.reduce((s, a) => s + (a.text?.length ?? 0), 0) / advice.length
    : 0;

  return {
    okRate: Math.round(okRate * 1000) / 1000,
    avgLen: Math.round(avgLen),
  };
}

// -------------------------------
// Orchestrator v1
// -------------------------------

export async function evaluateSandboxScenariosV1(
  scenarios: SandboxScenarioInput[],
  config: SandboxOrchestratorConfig,
  env?: any
): Promise<SandboxEvaluationSummary> {
  const evaluatedAt = nowIso();

  // 1) Evaluate each scenario:
  //    - fan-out 3 LLM calls (parallel)
  //    - normalize
  //    - DQM compute
  const results: SandboxScenarioResult[] = [];

  for (const scenario of scenarios) {
    // (a) LLM fan-out
    const calls = buildScenarioLlmCalls(scenario);

    let raw: LlmResult[] = [];
    try {
      raw = await callManyLLMs(env, calls);
    } catch (e) {
      // If adapter fails hard, we still return deterministically with empty advice.
      raw = [
        { provider: "llmA", model: "modelA", ok: false, text: "", error: safeString(e) } as any,
        { provider: "llmB", model: "modelB", ok: false, text: "", error: safeString(e) } as any,
        { provider: "llmC", model: "modelC", ok: false, text: "", error: safeString(e) } as any,
      ];
    }

    const advice = raw.map(normalizeLlmResult);
    const advisoryHealth = computeAdvisoryHealth(advice);

    // (b) Deterministic scoring (DQM)
    const dqm = computeDqmV1(
      scenario.baselineMetrics,
      scenario.scenarioMetrics,
      scenario.feasible,
      scenario.weights
    );

    // (c) Compose per-scenario result
    results.push({
      scenarioId: scenario.scenarioId,
      feasible: scenario.feasible,
      dqm,
      // If your contracts.ts doesn't yet include llmAdvice, add it there.
      // Keeping it optional is fine.
      llm: {
        advice,
        health: advisoryHealth,
      },
    } as any);
  }

  // 2) Rank by DQM score (descending)
  const sorted = [...results].sort((a, b) => b.dqm.score - a.dqm.score);

  const ranked: SandboxScenarioRankedResult[] = sorted.map((r, idx) => ({
    ...r,
    rank: idx + 1,
  })) as any;

  // 3) Return summary
  return {
    evaluatedAt,
    baselineScenarioId: config.baselineScenarioId as SandboxScenarioId,
    results: ranked as any,
    bestScenarioId: ranked[0]?.scenarioId,
    notes: `sandbox-orchestrator-v1 | llm=3 parallel | deterministic dqm | scenarios=${scenarios.length}`,
  } as SandboxEvaluationSummary;
}