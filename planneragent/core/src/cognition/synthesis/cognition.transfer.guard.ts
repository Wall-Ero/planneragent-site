// core/src/cognition/synthesis/cognition.transfer.guard.ts
// ============================================================
// PlannerAgent — Cognition Transfer Guard
// Canonical Source of Truth
// ============================================================

import type {

CognitiveTransferCandidate,
CognitiveTransferGuardResult

}
from "./cognition.transfer.types";


// ============================================================
// GUARD
// ============================================================

export function evaluateTransferGuard(

candidate:CognitiveTransferCandidate

):CognitiveTransferGuardResult{

const blockedReasons:string[]=[];

let riskScore=0;


// ============================================================
// LOW EXPERIENCE CONFIDENCE
// ============================================================

if(
candidate.experienceConfidence
<
.50
){

riskScore+=.40;

blockedReasons.push(
"low_experience_confidence"
);

}


// ============================================================
// LOW TRANSFERABILITY
// ============================================================

if(
candidate.transferability
<
.50
){

riskScore+=.35;

blockedReasons.push(
"low_transferability"
);

}


// ============================================================
// LOW SIMILARITY
// ============================================================

if(
candidate.similarity
<
.60
){

riskScore+=.35;

blockedReasons.push(
"low_similarity"
);

}


// ============================================================
// EXPERIENCE INSTABILITY
// ============================================================

if(

candidate.experienceState===

"EPISODIC"

||

candidate.experienceState===

"EMERGING"

){

riskScore+=.25;

blockedReasons.push(
"experience_not_stable"
);

}


// ============================================================
// STRUCTURAL REDUCTION
// ============================================================

if(

candidate.experienceState===

"STRUCTURAL"

){

riskScore-=.20;

}


// ============================================================
// NORMALIZE
// ============================================================

riskScore=

clamp01(
riskScore
);


// ============================================================
// RISK
// ============================================================

const riskLevel=

resolveRiskLevel(
riskScore
);


// ============================================================
// RESULT
// ============================================================

return{

allowed:
riskLevel!=="HIGH",

riskLevel,

blockedReasons

};

}


// ============================================================
// HELPERS
// ============================================================

function resolveRiskLevel(
score:number
):

| "LOW"
| "MEDIUM"
| "HIGH"{

if(
score>=.75
){
return "HIGH";
}

if(
score>=.40
){
return "MEDIUM";
}

return "LOW";

}

function clamp01(
v:number
):number{

return Math.max(
0,
Math.min(
1,
v
)
);

}