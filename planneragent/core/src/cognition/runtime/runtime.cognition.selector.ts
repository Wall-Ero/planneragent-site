// core/src/cognition/runtime/runtime.cognition.selector.ts
// ============================================================
// PlannerAgent — Runtime Cognition Selector
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Select the most reliable experiential cognition candidate
// for runtime participation.
//
// DOES NOT:
//
// - authorize execution
// - approve actions
// - modify authority
// - create cognition
//
// DOES:
//
// - select usable experiences
// - filter risky experiences
// - prioritize stable cognition
//
// ============================================================

import type {
  CognitionCandidate
} from "../synthesis/cognition.memory.bridge";


// ============================================================
// TYPES
// ============================================================

export interface RuntimeCognitionSelectorInput{

  candidates:CognitionCandidate[];

}

export interface RuntimeCognitionSelection{

  selected:CognitionCandidate|null;

  blocked:boolean;

  reason:string;

  summary:string[];

}


// ============================================================
// MAIN
// ============================================================

export function selectRuntimeCognition(
input:RuntimeCognitionSelectorInput
):RuntimeCognitionSelection{

const candidates=

input.candidates
.filter(
isAllowedCandidate
)
.sort(
(a,b)=>
b.score-a.score
);

if(
candidates.length===0
){

return{

selected:null,

blocked:true,

reason:
"NO_RUNTIME_COGNITION_AVAILABLE",

summary:[
"runtime_cognition_blocked"
]

};

}

const selected=
candidates[0]!;

return{

selected,

blocked:false,

reason:
"RUNTIME_COGNITION_SELECTED",

summary:
buildSummary(
selected
)

};

}


// ============================================================
// FILTERS
// ============================================================

function isAllowedCandidate(
candidate:CognitionCandidate
):boolean{

if(
candidate.transferability<0.5
){
return false;
}

if(
candidate.confidence<0.5
){
return false;
}

if(
candidate.state==="EMERGING"
&&
candidate.score<0.6
){
return false;
}

return true;

}


// ============================================================
// SUMMARY
// ============================================================

function buildSummary(
candidate:CognitionCandidate
):string[]{

const summary:string[]=[];

summary.push(
`experience:${candidate.experienceId}`
);

summary.push(
`pattern:${candidate.patternId}`
);

summary.push(
`score:${candidate.score}`
);

summary.push(
`state:${candidate.state}`
);

if(
candidate.state==="STRUCTURAL"
){

summary.push(
"structural_runtime_cognition"
);

}

if(
candidate.transferability>=0.8
){

summary.push(
"high_transferability"
);

}

return summary;

}