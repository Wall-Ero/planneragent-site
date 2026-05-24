// core/src/cognition/runtime/runtime.cognition.advisor.ts
// ============================================================
// PlannerAgent — Runtime Cognition Advisor
// Canonical Source of Truth
// ============================================================

import type {
RuntimeCognitionInput,
RuntimeCognitionAdvice,
RuntimeCognitionCandidate
} from "./runtime.cognition.types";


// ============================================================
// ADVISOR
// ============================================================

export function buildRuntimeCognitionAdvice(
input:RuntimeCognitionInput,
candidate?:RuntimeCognitionCandidate
):RuntimeCognitionAdvice{

const recommendation=
buildRecommendation(
input,
candidate
);

const experienceContribution=
computeExperienceContribution(
input,
candidate
);

const recommendationConfidence=
computeRecommendationConfidence(
input,
candidate,
experienceContribution
);

return{

recommendation,

recommendationConfidence:
round3(
recommendationConfidence
),

experienceContribution:
round3(
experienceContribution
),

summary:
buildSummary(
input,
candidate,
recommendationConfidence
)

};

}


// ============================================================
// RECOMMENDATION
// ============================================================

function buildRecommendation(
input:RuntimeCognitionInput,
candidate?:RuntimeCognitionCandidate
):string{

if(candidate===undefined){

return "No transferable experience available";

}

if(
input.decisionPressure>=0.8
){

return `High decision pressure detected. Apply experience pattern ${candidate.patternId}`;

}

if(
input.organizationalCoherence<0.5
){

return "Organizational coherence unstable. Use experience cautiously";

}

if(
input.experienceState==="REPEATED"
){

return "Similar situations detected repeatedly";

}

if(
input.experienceState==="STABLE"
){

return "Stable experience available for advisory support";

}

if(
input.experienceState==="STRUCTURAL"
){

return "Structural operational understanding available";

}

return "Limited operational experience available";

}


// ============================================================
// EXPERIENCE CONTRIBUTION
// ============================================================

function computeExperienceContribution(
input:RuntimeCognitionInput,
candidate?:RuntimeCognitionCandidate
):number{

if(candidate===undefined){

return 0;

}

return (

input.experienceConfidence*.4
+
input.transferability*.3
+
candidate.confidence*.3

);

}


// ============================================================
// CONFIDENCE
// ============================================================

function computeRecommendationConfidence(
input:RuntimeCognitionInput,
candidate?:RuntimeCognitionCandidate,
experienceContribution:number=0
):number{

if(candidate===undefined){

return .1;

}

return (

experienceContribution*.6
+
candidate.applicability*.2
+
(1-input.riskScore)*.2

);

}


// ============================================================
// SUMMARY
// ============================================================

function buildSummary(
input:RuntimeCognitionInput,
candidate?:RuntimeCognitionCandidate,
confidence:number=0
):string[]{

const summary:string[]=[];

summary.push(
`authority:${input.authority}`
);

summary.push(
`experience_state:${input.experienceState}`
);

summary.push(
`confidence:${round3(confidence)}`
);

summary.push(
`transferability:${input.transferability}`
);

if(candidate!==undefined){

summary.push(
`pattern:${candidate.patternId}`
);

}

if(
confidence>=0.8
){

summary.push(
"high_advisory_confidence"
);

}

if(
input.decisionPressure>=0.8
){

summary.push(
"decision_pressure_detected"
);

}

if(
input.organizationalCoherence<0.5
){

summary.push(
"coherence_instability_detected"
);

}

return summary;

}


// ============================================================
// HELPERS
// ============================================================

function round3(
value:number
):number{

return Math.round(
value*1000
)/1000;

}