// core/src/cognition/runtime/runtime.cognition.types.ts
// ============================================================
// PlannerAgent — Runtime Cognition Types
// Canonical Source of Truth
// ============================================================

import type {
  ExperienceState,
} from "../synthesis/cognition.experience.timeline";


// ============================================================
// AUTHORITY
// ============================================================

export type RuntimeAuthorityLevel =
  | "VISION"
  | "GRADUATE"
  | "JUNIOR"
  | "SENIOR"
  | "PRINCIPAL"
  | "CHARTER";


// ============================================================
// RUNTIME STATUS
// ============================================================

export type RuntimeCognitionStatus =
  | "ALLOWED"
  | "BLOCKED"
  | "REVIEW_REQUIRED";


// ============================================================
// INPUT
// ============================================================

export interface RuntimeCognitionInput {

  authority:
    RuntimeAuthorityLevel;

  experienceState:
    ExperienceState;

  transferability:
    number;

  experienceConfidence:
    number;

  riskScore:
    number;

  organizationalCoherence:
    number;

  decisionPressure:
    number;

}


// ============================================================
// CANDIDATE
// ============================================================

export interface RuntimeCognitionCandidate {

  id:string;

  patternId:string;

  experienceState:
    ExperienceState;

  confidence:number;

  transferability:number;

  applicability:number;

  riskScore:number;

  summary:string[];

}


// ============================================================
// ADVISOR OUTPUT
// ============================================================

export interface RuntimeCognitionAdvice {

  recommendation:string;

  recommendationConfidence:number;

  experienceContribution:number;

  summary:string[];

}


// ============================================================
// EXECUTION OUTPUT
// ============================================================

export interface RuntimeCognitionExecution {

  executionAllowed:boolean;

  executionConfidence:number;

  executionAdjustment:string[];

  executionReasoning:string[];

}


// ============================================================
// GUARD RESULT
// ============================================================

export interface RuntimeCognitionGuardResult {

  status:
    RuntimeCognitionStatus;

  allowed:boolean;

  reasons:string[];

}


// ============================================================
// FINAL RESULT
// ============================================================

export interface RuntimeCognitionResult {

  authority:
    RuntimeAuthorityLevel;

  status:
    RuntimeCognitionStatus;

  guard:
    RuntimeCognitionGuardResult;

  advice?:
    RuntimeCognitionAdvice;

  execution?:
    RuntimeCognitionExecution;

  confidence:number;

  summary:string[];

}