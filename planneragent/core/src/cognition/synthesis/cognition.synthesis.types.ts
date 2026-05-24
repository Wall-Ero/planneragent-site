// core/src/cognition/synthesis/cognition.synthesis.types.ts
// ============================================================
// PlannerAgent — Synthetic Cognition Types
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Shared constitutional contracts for Synthetic Cognition.
//
// Synthetic Cognition DOES NOT:
//
// - preserve raw company data
// - preserve authority
// - preserve decisions
// - preserve policies
//
// It DOES:
//
// - preserve operational structures
// - preserve stabilization patterns
// - preserve coherence behaviors
// - preserve experiential signals
//
// ============================================================

export type SyntheticExperienceLevel =
| "EPISODIC"
| "RECURRING"
| "GENERALIZED"
| "EXPERIENTIAL";

export type PatternCategory =
| "SUPPLY_INSTABILITY"
| "EXECUTION_DRIFT"
| "DECISION_PRESSURE"
| "WORKFLOW_FATIGUE"
| "RECONCILIATION_INSTABILITY"
| "RESOURCE_CONSTRAINT"
| "COHERENCE_BREAK";

export interface ExperiencePattern {

id:string;

category:PatternCategory;

description:string;

observedOccurrences:number;

confidence:number;

experienceLevel:
SyntheticExperienceLevel;

}

export interface StabilizationPattern {

id:string;

problem:string;

correction:string;

outcome:

| "SUCCESS"
| "PARTIAL"
| "FAILED";

confidence:number;

observedOccurrences:number;

}

export interface CoherenceSignal {

id:string;

behavior:string;

coherenceEffect:number;

confidence:number;

}

export interface ExperienceTimeline {

firstObserved:string;

lastObserved:string;

occurrences:number;

trend:

| "INCREASING"
| "STABLE"
| "DECREASING"
| "VOLATILE";

}

export interface SyntheticCognitionResult {

experientialPatterns:
ExperiencePattern[];

stabilizationPatterns:
StabilizationPattern[];

coherenceSignals:
CoherenceSignal[];

historicalConfidence:number;

cognitiveIntegrity:number;

summary:string[];

}   