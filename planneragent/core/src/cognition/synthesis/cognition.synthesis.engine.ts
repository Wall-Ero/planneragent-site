// core/src/cognition/synthesis/cognition.synthesis.engine.ts
// ============================================================
// PlannerAgent — Cognitive Synthesis Engine
// Canonical Source of Truth
// ============================================================

import type {

CognitiveExperienceRecord,
ExperienceState

} from "./cognition.experience.timeline";


// ============================================================
// INPUT TYPES
// ============================================================

export interface PatternInput{

confidence:number;

}

export interface CoherenceInput{

score:number;

}

export interface StabilizationInput{

successRate:number;

}


// ============================================================
// SYNTHESIS TYPES
// ============================================================

export interface CognitiveSynthesisInput{

patterns:PatternInput[];

coherences:CoherenceInput[];

stabilizations:StabilizationInput[];

experiences:CognitiveExperienceRecord[];

}

export interface CognitiveSynthesisResult{

patternCount:number;

coherenceCount:number;

stabilizationCount:number;

experienceCount:number;

dominantExperienceState:ExperienceState;

transferability:number;

experienceConfidence:number;

cognitiveMaturity:
| "LOW"
| "MEDIUM"
| "HIGH"
| "STRUCTURAL";

summary:string[];

}


// ============================================================
// ENGINE
// ============================================================

export function buildCognitiveSynthesis(
input:CognitiveSynthesisInput
):CognitiveSynthesisResult{

const experienceConfidence=

average(

input.experiences.map(
x=>x.experienceConfidence
)

);

const transferability=

average(

input.experiences.map(
x=>x.transferability
)

);

const dominantExperienceState=

resolveDominantState(
input.experiences
);

const cognitiveMaturity=

resolveMaturity(
experienceConfidence,
transferability,
dominantExperienceState
);

return{

patternCount:
input.patterns.length,

coherenceCount:
input.coherences.length,

stabilizationCount:
input.stabilizations.length,

experienceCount:
input.experiences.length,

dominantExperienceState,

transferability:
round3(
transferability
),

experienceConfidence:
round3(
experienceConfidence
),

cognitiveMaturity,

summary:
buildSummary({

dominantExperienceState,
experienceConfidence,
transferability,
cognitiveMaturity,
input

})

};

}


// ============================================================
// STATE
// ============================================================

function resolveDominantState(
items:CognitiveExperienceRecord[]
):ExperienceState{

if(
items.length===0
){
return "EPISODIC";
}

const counts:Record<
ExperienceState,
number
>={

EPISODIC:0,
EMERGING:0,
REPEATED:0,
STABLE:0,
STRUCTURAL:0

};

for(
const item
of items
){

counts[
item.state
]++;

}

const dominant=

Object.keys(
counts
).reduce(

(
best,
current
)=>

counts[
current as ExperienceState
]
>
counts[
best as ExperienceState
]

? current
: best

);

return dominant as ExperienceState;

}


// ============================================================
// MATURITY
// ============================================================

function resolveMaturity(

confidence:number,
transferability:number,
state:ExperienceState

):
"LOW"
|
"MEDIUM"
|
"HIGH"
|
"STRUCTURAL"{

if(

state==="STRUCTURAL"
&&
confidence>=.9
&&
transferability>=.8

){

return "STRUCTURAL";

}

if(

state==="STABLE"
&&
confidence>=.75

){

return "HIGH";

}

if(

state==="REPEATED"
||
confidence>=.5

){

return "MEDIUM";

}

return "LOW";

}


// ============================================================
// SUMMARY
// ============================================================

function buildSummary(
params:any
):string[]{

const summary:string[]=[];

summary.push(
`patterns:${params.input.patterns.length}`
);

summary.push(
`coherences:${params.input.coherences.length}`
);

summary.push(
`stabilizations:${params.input.stabilizations.length}`
);

summary.push(
`experience_state:${params.dominantExperienceState}`
);

summary.push(
`maturity:${params.cognitiveMaturity}`
);

if(
params.transferability>=.7
){

summary.push(
"experience_transferable"
);

}

if(
params.experienceConfidence>=.8
){

summary.push(
"high_confidence_experience"
);

}

if(
params.cognitiveMaturity==="STRUCTURAL"
){

summary.push(
"cross_reality_operational_understanding_detected"
);

}

return summary;

}


// ============================================================
// HELPERS
// ============================================================

function average(
values:number[]
):number{

if(
values.length===0
){
return 0;
}

return values.reduce(
(a,b)=>a+b,
0
)
/ values.length;

}

function round3(
v:number
):number{

return Math.round(
v*1000
)
/1000;

}