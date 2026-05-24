// core/src/cognition/runtime/runtime.cognition.execution.ts
// ============================================================
// PlannerAgent — Runtime Cognition Execution
// Canonical Source of Truth
// ============================================================

import type {

RuntimeCognitionInput,
RuntimeCognitionCandidate,
RuntimeCognitionExecution

} from "./runtime.cognition.types";


// ============================================================
// EXECUTION
// ============================================================

export function buildRuntimeCognitionExecution(

input:RuntimeCognitionInput,
candidate?:RuntimeCognitionCandidate

):RuntimeCognitionExecution{

const executionAllowed=

resolveExecutionAllowed(
input,
candidate
);

const executionConfidence=

computeExecutionConfidence(
input,
candidate
);

return{

executionAllowed,

executionConfidence:
round3(
executionConfidence
),

executionAdjustment:

buildAdjustments(
input,
candidate
),

executionReasoning:

buildReasoning(
input,
candidate,
executionAllowed
)

};

}


// ============================================================
// EXECUTION RULES
// ============================================================

function resolveExecutionAllowed(

input:RuntimeCognitionInput,
candidate?:RuntimeCognitionCandidate

):boolean{

if(
!candidate
){
return false;
}

if(
input.authority==="JUNIOR"
){
return false;
}

if(
input.authority==="VISION"
){
return false;
}

if(
input.authority==="GRADUATE"
){
return false;
}

if(
input.authority==="CHARTER"
){
return false;
}

if(
input.experienceConfidence<.6
){
return false;
}

if(
input.transferability<.5
){
return false;
}

if(
input.riskScore>.7
){
return false;
}

return true;

}


// ============================================================
// CONFIDENCE
// ============================================================

function computeExecutionConfidence(

input:RuntimeCognitionInput,
candidate?:RuntimeCognitionCandidate

):number{

if(
!candidate
){
return 0;
}

return(

input.experienceConfidence*.4
+
input.transferability*.3
+
candidate.confidence*.2
+
(
1-input.riskScore
)*.1

);

}


// ============================================================
// ADJUSTMENTS
// ============================================================

function buildAdjustments(

input:RuntimeCognitionInput,
candidate?:RuntimeCognitionCandidate

):string[]{

const adjustments:string[]=[];

if(
!candidate
){
return adjustments;
}

if(
input.decisionPressure>=.8
){

adjustments.push(
"accelerate_execution_path"
);

}

if(
input.organizationalCoherence<.5
){

adjustments.push(
"reduce_execution_scope"
);

}

if(
candidate.transferability>=.8
){

adjustments.push(
"high_transfer_experience_detected"
);

}

if(
candidate.riskScore>=.6
){

adjustments.push(
"execution_risk_monitoring_enabled"
);

}

return adjustments;

}


// ============================================================
// REASONING
// ============================================================

function buildReasoning(

input:RuntimeCognitionInput,
candidate:RuntimeCognitionCandidate|undefined,
allowed:boolean

):string[]{

const reasoning:string[]=[];

reasoning.push(
`authority:${input.authority}`
);

reasoning.push(
`experience_state:${input.experienceState}`
);

reasoning.push(
`allowed:${allowed}`
);

if(
candidate
){

reasoning.push(
`pattern:${candidate.patternId}`
);

reasoning.push(
`candidate_confidence:${candidate.confidence}`
);

}

if(
input.riskScore>.7
){

reasoning.push(
"execution_blocked_by_risk"
);

}

if(
input.transferability<.5
){

reasoning.push(
"execution_blocked_by_transferability"
);

}

return reasoning;

}


// ============================================================
// HELPERS
// ============================================================

function round3(
value:number
):number{

return Math.round(
value*1000
)
/1000;

}