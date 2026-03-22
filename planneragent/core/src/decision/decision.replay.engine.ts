// core/src/decision/decision.replay.engine.ts
// ============================================================
// Decision Replay Engine
// Canonical Source of Truth (V2-aligned, type-safe)
// ============================================================

import type { DecisionTraceV2 } from "./decision.trace"

// ============================================================
// Types
// ============================================================

export interface ReplayCandidate {
  trace: DecisionTraceV2
  similarityScore: number
}

export interface ReplayResult {
  hasSimilar: boolean
  bestMatch?: DecisionTraceV2
  similarityScore?: number
  explanation: string
}

// ============================================================
// Helpers (STRICT — no unknown leakage)
// ============================================================

function safeNumber(value: unknown): number {
  if (typeof value === "number") return value
  if (typeof value === "string") return Number(value)
  return 0
}

// ============================================================
// Similarity Engine (V2-native, SAFE)
// ============================================================

function computeSimilarity(a: DecisionTraceV2, b: DecisionTraceV2): number {

  let score = 0

  // ----------------------------------------------------------
  // 1. Authority similarity
  // ----------------------------------------------------------
  if (a.authority.level === b.authority.level) {
    score += 0.3
  }

  if (a.authority.mode === b.authority.mode) {
    score += 0.2
  }

  // ----------------------------------------------------------
  // 2. Vision similarity (SAFE extraction)
  // ----------------------------------------------------------

  const aInv = safeNumber(a.vision.reality_snapshot["inventorySeen"])
  const bInv = safeNumber(b.vision.reality_snapshot["inventorySeen"])

  const invDiff = Math.abs(aInv - bInv)

  if (invDiff === 0) score += 0.2
  else if (invDiff <= 2) score += 0.1

  const aShort = safeNumber(a.vision.reality_snapshot["shortagesDetected"])
  const bShort = safeNumber(b.vision.reality_snapshot["shortagesDetected"])

  if (aShort === bShort) {
    score += 0.1
  }

  // ----------------------------------------------------------
  // 3. Data quality similarity
  // ----------------------------------------------------------
  if (a.vision.data_quality === b.vision.data_quality) {
    score += 0.1
  }

  // ----------------------------------------------------------
  // 4. Actions similarity (junior layer)
  // ----------------------------------------------------------

  const aActions = (a.junior?.proposed_actions ?? [])
    .map(x => x.type)
    .join("|")

  const bActions = (b.junior?.proposed_actions ?? [])
    .map(x => x.type)
    .join("|")

  if (aActions && aActions === bActions) {
    score += 0.1
  }

  return Math.min(score, 1)
}

// ============================================================
// Replay Engine
// ============================================================

export function replayDecision(input: {
  current: DecisionTraceV2
  history: DecisionTraceV2[]
  threshold?: number
}): ReplayResult {

  const threshold = input.threshold ?? 0.5

  let best: ReplayCandidate | null = null

  for (const past of input.history) {

    const sim = computeSimilarity(input.current, past)

    if (!best || sim > best.similarityScore) {
      best = { trace: past, similarityScore: sim }
    }
  }

  if (!best || best.similarityScore < threshold) {
    return {
      hasSimilar: false,
      explanation: "No sufficiently similar past decision found"
    }
  }

  return {
    hasSimilar: true,
    bestMatch: best.trace,
    similarityScore: best.similarityScore,
    explanation: buildExplanation(best.trace, best.similarityScore)
  }
}

// ============================================================
// Explanation Builder
// ============================================================

function buildExplanation(
  past: DecisionTraceV2,
  score: number
): string {

  const timeInfo = past.issuedAt

  if (past.authority.mode === "HUMAN_APPROVED") {
    return `A similar situation was handled on ${timeInfo}. A human approved a similar action under comparable conditions (similarity=${score.toFixed(2)}).`
  }

  if (past.authority.mode === "DELEGATED_EXECUTION") {
    return `A similar situation was executed under delegation on ${timeInfo} by ${past.authority.level} (similarity=${score.toFixed(2)}).`
  }

  return `A partially similar situation was detected on ${timeInfo} (similarity=${score.toFixed(2)}).`
}