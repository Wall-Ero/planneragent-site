// core/src/cognition/runtime/runtime.cognition.policy.ts
// ============================================================
// PlannerAgent — Runtime Cognition Policy
// Canonical Source of Truth
// ============================================================


// ============================================================
// TRANSFER RULES
// ============================================================

export const MIN_TRANSFERABILITY = 0.50;

export const MIN_EXPERIENCE_CONFIDENCE = 0.60;

export const MAX_TRANSFER_RISK = 0.70;


// ============================================================
// ORGANIZATIONAL COHERENCE
// ============================================================

export const MIN_ORGANIZATIONAL_COHERENCE = 0.50;


// ============================================================
// DECISION PRESSURE
// ============================================================

export const HIGH_DECISION_PRESSURE = 0.80;


// ============================================================
// AUTHORITY
// ============================================================

export const ALLOW_ADVISORY_LEVELS = [

"JUNIOR",
"SENIOR",
"PRINCIPAL"

] as const;


export const ALLOW_EXECUTION_LEVELS = [

"SENIOR",
"PRINCIPAL"

] as const;


export const BLOCKED_LEVELS = [

"VISION",
"GRADUATE",
"CHARTER"

] as const;


// ============================================================
// EXPERIENCE STATES
// ============================================================

export const ADVISORY_EXPERIENCE_STATES = [

"REPEATED",
"STABLE",
"STRUCTURAL"

] as const;


export const EXECUTABLE_EXPERIENCE_STATES = [

"STABLE",
"STRUCTURAL"

] as const;


// ============================================================
// REVIEW THRESHOLDS
// ============================================================

export const REQUIRE_REVIEW_IF = {

highRisk:0.60,

lowConfidence:0.50,

lowTransferability:0.50,

lowCoherence:0.50

};


// ============================================================
// SUMMARY TAGS
// ============================================================

export const POLICY_SUMMARY = {

blockedAuthority:
"authority_blocked",

blockedRisk:
"risk_exceeded",

blockedConfidence:
"confidence_too_low",

blockedTransferability:
"experience_not_transferable",

blockedCoherence:
"organizational_coherence_low",

reviewRequired:
"human_review_required"

};