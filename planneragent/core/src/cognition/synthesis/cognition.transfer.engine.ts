// core/src/cognition/synthesis/cognition.transfer.engine.ts
// ============================================================
// PlannerAgent — Cognition Transfer Engine
// Canonical Source of Truth
// ============================================================

import type {

CognitiveTransferInput,
CognitiveTransferResult,
CognitiveTransferCandidate

}
from "./cognition.transfer.types";

import {

evaluateTransferPolicy

}
from "./cognition.transfer.policy";

import {

evaluateTransferGuard

}
from "./cognition.transfer.guard";


// ============================================================
// ENGINE
// ============================================================

export function buildCognitiveTransfer(

input:CognitiveTransferInput

):CognitiveTransferResult{

if(
input.candidates.length===0
){

return{

candidateId:null,

transferAllowed:false,

transferConfidence:0,

transferRisk:"HIGH",

summary:[
"no_candidate_available"
]

};

}


const candidate=

resolveBestCandidate(
input.candidates
);


const policy=

evaluateTransferPolicy(

candidate,

input.minimumSimilarity ?? .60,

input.minimumTransferability ?? .50,

input.minimumConfidence ?? .50

);


const guard=

evaluateTransferGuard(
candidate
);


const confidence=

computeTransferConfidence(

candidate,
policy.policyScore

);


const allowed=

policy.allowed
&&
guard.allowed;


return{

candidateId:
candidate.id,

transferAllowed:
allowed,

transferConfidence:
round3(
confidence
),

transferRisk:
guard.riskLevel,

summary:
buildSummary({

candidate,
policy,
guard,
confidence,
allowed

})

};

}


// ============================================================
// CANDIDATE
// ============================================================

function resolveBestCandidate(

candidates:
CognitiveTransferCandidate[]

):CognitiveTransferCandidate{

return candidates.sort(

(a,b)=>

computeCandidateScore(b)

-

computeCandidateScore(a)

)[0];

}


function computeCandidateScore(

candidate:
CognitiveTransferCandidate

):number{

return (

candidate.similarity*.40

+

candidate.transferability*.30

+

candidate.experienceConfidence*.30

);

}


// ============================================================
// CONFIDENCE
// ============================================================

function computeTransferConfidence(

candidate:
CognitiveTransferCandidate,

policyScore:number

):number{

const value=

(

candidate.similarity*.40

+

candidate.transferability*.30

+

candidate.experienceConfidence*.30

)

*
policyScore;


return clamp01(
value
);

}


// ============================================================
// SUMMARY
// ============================================================

function buildSummary(
params:any
):string[]{

const summary:string[]=[];


summary.push(

`candidate:${params.candidate.id}`

);

summary.push(

`risk:${params.guard.riskLevel}`

);

summary.push(

`policy_score:${params.policy.policyScore}`

);


if(
params.allowed
){

summary.push(
"transfer_allowed"
);

}
else{

summary.push(
"transfer_blocked"
);

}


if(

params.candidate.experienceState
===
"STRUCTURAL"

){

summary.push(
"structural_experience_detected"
);

}


summary.push(

`confidence:${round3(
params.confidence
)}`

);


return summary;

}


// ============================================================
// HELPERS
// ============================================================

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

function round3(
v:number
):number{

return Math.round(
v*1000
)
/1000;

}