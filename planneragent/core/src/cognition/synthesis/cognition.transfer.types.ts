// core/src/cognition/synthesis/cognition.transfer.types.ts
// ============================================================
// PlannerAgent — Cognition Transfer Types
// Canonical Source of Truth
// ============================================================


// ============================================================
// SOURCE EXPERIENCE
// ============================================================

export interface CognitiveTransferCandidate{

id:string;

patternId:string;

experienceConfidence:number;

transferability:number;

similarity:number;

experienceState:
| "EPISODIC"
| "EMERGING"
| "REPEATED"
| "STABLE"
| "STRUCTURAL";

}


// ============================================================
// POLICY RESULT
// ============================================================

export interface CognitiveTransferPolicyResult{

allowed:boolean;

reason:string[];

policyScore:number;

}


// ============================================================
// GUARD RESULT
// ============================================================

export interface CognitiveTransferGuardResult{

allowed:boolean;

riskLevel:
| "LOW"
| "MEDIUM"
| "HIGH";

blockedReasons:string[];

}


// ============================================================
// FINAL RESULT
// ============================================================

export interface CognitiveTransferResult{

candidateId:string|null;

transferAllowed:boolean;

transferConfidence:number;

transferRisk:
| "LOW"
| "MEDIUM"
| "HIGH";

summary:string[];

}


// ============================================================
// ENGINE INPUT
// ============================================================

export interface CognitiveTransferInput{

candidates:
CognitiveTransferCandidate[];

minimumSimilarity?:number;

minimumTransferability?:number;

minimumConfidence?:number;

}