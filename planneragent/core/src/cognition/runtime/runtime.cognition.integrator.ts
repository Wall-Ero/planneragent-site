// core/src/cognition/runtime/runtime.cognition.integrator.ts
// ============================================================
// PlannerAgent — Runtime Cognition Integrator
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Single runtime entry point for cognition participation.
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
// - retrieve experiential evidence
// - create cognition candidates
// - select runtime cognition
// - adapt runtime participation
//
// ============================================================

import type {
CognitiveExperienceRecord
} from "../synthesis/cognition.experience.timeline";

import {
buildCognitionMemoryBridge
} from "../synthesis/cognition.memory.bridge";

import {
selectRuntimeCognition
} from "./runtime.cognition.selector";

import {
adaptRuntimeCognition
} from "./runtime.cognition.adapter";


// ============================================================
// TYPES
// ============================================================

export interface RuntimeCognitionIntegratorInput{

experiences:
CognitiveExperienceRecord[];

executionAllowed:boolean;

}

export interface RuntimeCognitionIntegratorResult{

bridge:{
totalExperiences:number;
transferableExperiences:number;
summary:string[];
};

selection:{
blocked:boolean;
reason:string;
summary:string[];
};

runtime:{
participationMode:
| "NONE"
| "ADVISOR"
| "EXECUTION";

experienceId:string|null;

patternId:string|null;

confidence:number;

transferability:number;

runtimeTrust:number;

summary:string[];
};

summary:string[];

}


// ============================================================
// MAIN
// ============================================================

export function buildRuntimeCognition(
input:RuntimeCognitionIntegratorInput
):RuntimeCognitionIntegratorResult{

// --------------------------------------------------
// MEMORY BRIDGE
// --------------------------------------------------

const bridge=

buildCognitionMemoryBridge({

experiences:
input.experiences

});

// --------------------------------------------------
// SELECTION
// --------------------------------------------------

const selection=

selectRuntimeCognition({

candidates:
bridge.candidates

});

// --------------------------------------------------
// ADAPTER
// --------------------------------------------------

const runtime=

adaptRuntimeCognition({

selected:
selection.selected,

executionAllowed:
input.executionAllowed

});


// --------------------------------------------------
// RESULT
// --------------------------------------------------

return{

bridge:{

totalExperiences:
bridge.totalExperiences,

transferableExperiences:
bridge.transferableExperiences,

summary:
bridge.summary

},

selection:{

blocked:
selection.blocked,

reason:
selection.reason,

summary:
selection.summary

},

runtime,

summary:
buildSummary({

bridge,
selection,
runtime

})

};

}


// ============================================================
// SUMMARY
// ============================================================

function buildSummary(
params:any
):string[]{

const summary:string[]=[];

summary.push(
`experiences:${params.bridge.totalExperiences}`
);

summary.push(
`transferable:${params.bridge.transferableExperiences}`
);

summary.push(
`selection:${params.selection.reason}`
);

summary.push(
`participation:${params.runtime.participationMode}`
);

if(
params.runtime.runtimeTrust>=.8
){

summary.push(
"high_runtime_trust"
);

}

if(
params.runtime.participationMode==="ADVISOR"
){

summary.push(
"runtime_supporting_advisory"
);

}

if(
params.runtime.participationMode==="EXECUTION"
){

summary.push(
"runtime_supporting_execution"
);

}

return summary;

}