// core/src/cognition/runtime/runtime.cognition.adapter.ts
// ============================================================
// PlannerAgent — Runtime Cognition Adapter
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Connect selected cognition to runtime participation.
//
// DOES NOT:
//
// - authorize execution
// - change authority
// - execute actions
// - modify policy
//
// DOES:
//
// - adapt selected cognition
// - create runtime cognition signals
// - support advisor participation
// - support execution participation
//
// ============================================================

import type {
  CognitionCandidate
} from "../synthesis/cognition.memory.bridge";


// ============================================================
// TYPES
// ============================================================

export type RuntimeParticipationMode=
| "NONE"
| "ADVISOR"
| "EXECUTION";

export interface RuntimeCognitionAdapterInput{

selected:CognitionCandidate|null;

executionAllowed:boolean;

}

export interface RuntimeCognitionResult{

participationMode:
RuntimeParticipationMode;

experienceId:string|null;

patternId:string|null;

confidence:number;

transferability:number;

runtimeTrust:number;

summary:string[];

}


// ============================================================
// MAIN
// ============================================================

export function adaptRuntimeCognition(
input:RuntimeCognitionAdapterInput
):RuntimeCognitionResult{

const candidate=
input.selected;

if(
!candidate
){

return{

participationMode:
"NONE",

experienceId:null,

patternId:null,

confidence:0,

transferability:0,

runtimeTrust:0,

summary:[
"no_runtime_cognition"
]

};

}

const participationMode=

input.executionAllowed
? "EXECUTION"
: "ADVISOR";

const runtimeTrust=

computeRuntimeTrust(
candidate
);

return{

participationMode,

experienceId:
candidate.experienceId,

patternId:
candidate.patternId,

confidence:
round3(
candidate.confidence
),

transferability:
round3(
candidate.transferability
),

runtimeTrust,

summary:
buildSummary({
candidate,
participationMode,
runtimeTrust
})

};

}


// ============================================================
// TRUST
// ============================================================

function computeRuntimeTrust(
candidate:CognitionCandidate
):number{

const trust=

candidate.confidence*.4+
candidate.transferability*.4+
candidate.score*.2;

return round3(
trust
);

}


// ============================================================
// SUMMARY
// ============================================================

function buildSummary(
params:{
candidate:CognitionCandidate;
participationMode:RuntimeParticipationMode;
runtimeTrust:number;
}
):string[]{

const summary:string[]=[];

summary.push(
`participation:${params.participationMode}`
);

summary.push(
`experience:${params.candidate.experienceId}`
);

summary.push(
`pattern:${params.candidate.patternId}`
);

summary.push(
`trust:${params.runtimeTrust}`
);

summary.push(
`state:${params.candidate.state}`
);

if(
params.participationMode==="ADVISOR"
){

summary.push(
"cognition_supporting_advisory_mode"
);

}

if(
params.participationMode==="EXECUTION"
){

summary.push(
"cognition_supporting_execution_mode"
);

}

if(
params.candidate.state==="STRUCTURAL"
){

summary.push(
"structural_runtime_experience"
);

}

return summary;

}


// ============================================================
// HELPERS
// ============================================================

function round3(
v:number
):number{

return Math.round(
v*1000
)/1000;

}