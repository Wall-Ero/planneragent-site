// core/src/cognition/synthesis/cognition.transfer.policy.ts
// ============================================================
// PlannerAgent — Cognition Transfer Policy
// Canonical Source of Truth
// ============================================================

import type {

CognitiveTransferCandidate,
CognitiveTransferPolicyResult

}
from "./cognition.transfer.types";


// ============================================================
// POLICY
// ============================================================

export function evaluateTransferPolicy(

candidate:CognitiveTransferCandidate,

minimumSimilarity:number=.60,
minimumTransferability:number=.50,
minimumConfidence:number=.50

):CognitiveTransferPolicyResult{

const reasons:string[]=[];

let score=0;


// ============================================================
// SIMILARITY
// ============================================================

if(
candidate.similarity>=minimumSimilarity
){

score+=.35;

}
else{

reasons.push(
"insufficient_similarity"
);

}


// ============================================================
// TRANSFERABILITY
// ============================================================

if(
candidate.transferability>=
minimumTransferability
){

score+=.35;

}
else{

reasons.push(
"insufficient_transferability"
);

}


// ============================================================
// EXPERIENCE CONFIDENCE
// ============================================================

if(
candidate.experienceConfidence>=
minimumConfidence
){

score+=.30;

}
else{

reasons.push(
"insufficient_experience_confidence"
);

}


// ============================================================
// STRUCTURAL BONUS
// ============================================================

if(

candidate.experienceState===
"STRUCTURAL"

){

score+=.10;

}


// ============================================================
// FINAL
// ============================================================

score=
Math.min(
1,
round3(score)
);

return{

allowed:
score>=.70,

reason:
reasons,

policyScore:
score

};

}


// ============================================================
// HELPERS
// ============================================================

function round3(
v:number
):number{

return Math.round(
v*1000
)
/1000;

}