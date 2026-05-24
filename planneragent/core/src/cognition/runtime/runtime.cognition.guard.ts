// core/src/cognition/runtime/runtime.cognition.guard.ts
// ============================================================
// PlannerAgent — Runtime Cognition Guard
// Canonical Source of Truth
// ============================================================

import type {

RuntimeCognitionInput,
RuntimeCognitionGuardResult

} from "./runtime.cognition.types";

import {

MIN_TRANSFERABILITY,
MIN_EXPERIENCE_CONFIDENCE,
MAX_TRANSFER_RISK,

MIN_ORGANIZATIONAL_COHERENCE,

ALLOW_ADVISORY_LEVELS,
ALLOW_EXECUTION_LEVELS,

BLOCKED_LEVELS,

EXECUTABLE_EXPERIENCE_STATES,
ADVISORY_EXPERIENCE_STATES,

REQUIRE_REVIEW_IF,
POLICY_SUMMARY

} from "./runtime.cognition.policy";


// ============================================================
// GUARD
// ============================================================

export function evaluateRuntimeCognitionGuard(
input:RuntimeCognitionInput
):RuntimeCognitionGuardResult{

const reasons:string[]=[];


// ============================================================
// CONSTITUTIONAL BLOCK
// ============================================================

if(

BLOCKED_LEVELS.includes(
input.authority as never
)

){

reasons.push(
POLICY_SUMMARY.blockedAuthority
);

return{

status:"BLOCKED",

allowed:false,

reasons

};

}


// ============================================================
// EXPERIENCE CONFIDENCE
// ============================================================

if(

input.experienceConfidence
<
MIN_EXPERIENCE_CONFIDENCE

){

reasons.push(
POLICY_SUMMARY.blockedConfidence
);

}


// ============================================================
// TRANSFERABILITY
// ============================================================

if(

input.transferability
<
MIN_TRANSFERABILITY

){

reasons.push(
POLICY_SUMMARY.blockedTransferability
);

}


// ============================================================
// COHERENCE
// ============================================================

if(

input.organizationalCoherence
<
MIN_ORGANIZATIONAL_COHERENCE

){

reasons.push(
POLICY_SUMMARY.blockedCoherence
);

}


// ============================================================
// RISK
// ============================================================

if(

input.riskScore
>
MAX_TRANSFER_RISK

){

reasons.push(
POLICY_SUMMARY.blockedRisk
);

}


// ============================================================
// ADVISOR RULES
// ============================================================

if(

ALLOW_ADVISORY_LEVELS.includes(
input.authority as never
)

){

if(

!ADVISORY_EXPERIENCE_STATES.includes(
input.experienceState as never
)

){

reasons.push(
POLICY_SUMMARY.reviewRequired
);

}

}


// ============================================================
// EXECUTION RULES
// ============================================================

if(

ALLOW_EXECUTION_LEVELS.includes(
input.authority as never
)

){

if(

!EXECUTABLE_EXPERIENCE_STATES.includes(
input.experienceState as never
)

){

reasons.push(
POLICY_SUMMARY.reviewRequired
);

}

}


// ============================================================
// REVIEW
// ============================================================

const requiresReview=

input.riskScore
>=
REQUIRE_REVIEW_IF.highRisk

||

input.experienceConfidence
<=
REQUIRE_REVIEW_IF.lowConfidence

||

input.transferability
<=
REQUIRE_REVIEW_IF.lowTransferability

||

input.organizationalCoherence
<=
REQUIRE_REVIEW_IF.lowCoherence;


// ============================================================
// RESULT
// ============================================================

if(
reasons.length>0
){

return{

status:
requiresReview
?
"REVIEW_REQUIRED"
:
"BLOCKED",

allowed:false,

reasons

};

}


return{

status:"ALLOWED",

allowed:true,

reasons:[]

};

}