// core/src/cognition/synthesis/cognition.memory.bridge.ts
// ============================================================
// PlannerAgent — Cognition Memory Bridge
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Retrieve experiential evidence from memory and convert
// memory records into cognition runtime candidates.
//
// DOES NOT:
//
// - authorize actions
// - execute actions
// - change authority
// - rank final decisions
//
// DOES:
//
// - retrieve experience records
// - normalize experience evidence
// - create cognition candidates
//
// ============================================================

import type {
  CognitiveExperienceRecord
} from "./cognition.experience.timeline";


// ============================================================
// TYPES
// ============================================================

export interface MemoryBridgeInput{
  experiences:CognitiveExperienceRecord[];
}

export interface CognitionCandidate{

  experienceId:string;

  patternId:string;

  confidence:number;

  transferability:number;

  state:
    CognitiveExperienceRecord["state"];

  score:number;

}

export interface MemoryBridgeResult{

  candidates:CognitionCandidate[];

  totalExperiences:number;

  transferableExperiences:number;

  summary:string[];

}


// ============================================================
// MAIN
// ============================================================

export function buildCognitionMemoryBridge(
input:MemoryBridgeInput
):MemoryBridgeResult{

const candidates=

input.experiences
.map(buildCandidate)
.sort(
(a,b)=>
b.score-a.score
);

const transferableExperiences=

candidates.filter(
x=>x.transferability>=0.5
).length;

return{

candidates,

totalExperiences:
input.experiences.length,

transferableExperiences,

summary:
buildSummary({
candidates,
transferableExperiences
})

};

}


// ============================================================
// CANDIDATE
// ============================================================

function buildCandidate(
experience:CognitiveExperienceRecord
):CognitionCandidate{

const score=

computeScore(
experience
);

return{

experienceId:
experience.id,

patternId:
experience.patternId,

confidence:
experience.experienceConfidence,

transferability:
experience.transferability,

state:
experience.state,

score

};

}


// ============================================================
// SCORE
// ============================================================

function computeScore(
experience:CognitiveExperienceRecord
):number{

const stateWeight=

getStateWeight(
experience.state
);

return round3(

experience.experienceConfidence*.45+

experience.transferability*.35+

stateWeight*.20

);

}


function getStateWeight(
state:CognitiveExperienceRecord["state"]
):number{

switch(state){

case "STRUCTURAL":
return 1;

case "STABLE":
return .8;

case "REPEATED":
return .6;

case "EMERGING":
return .4;

default:
return .2;

}

}


// ============================================================
// SUMMARY
// ============================================================

function buildSummary(
params:{
candidates:CognitionCandidate[];
transferableExperiences:number;
}
):string[]{

const summary:string[]=[];

summary.push(
`candidates:${params.candidates.length}`
);

summary.push(
`transferable:${params.transferableExperiences}`
);

if(
params.transferableExperiences>0
){
summary.push(
"transferable_experience_detected"
);
}

if(
params.candidates.some(
x=>x.state==="STRUCTURAL"
)
){
summary.push(
"structural_experience_available"
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