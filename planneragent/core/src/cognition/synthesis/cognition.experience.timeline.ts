// core/src/cognition/synthesis/cognition.experience.timeline.ts
// ============================================================
// PlannerAgent — Cognitive Experience Timeline
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Tracks how abstract operational experience evolves
// through repeated exposure across multiple realities.
//
// DOES NOT STORE
//
// - company identifiers
// - users
// - ERP records
// - execution artifacts
//
// STORES ONLY
//
// - experience evolution
// - stabilization maturity
// - transferability
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Experience is not:
// "I saw company X"
//
// Experience is:
//
// "I repeatedly observed similar reality
// becoming stable under similar conditions."
//
// ============================================================

export type ExperienceState =

| "EPISODIC"
| "EMERGING"
| "REPEATED"
| "STABLE"
| "STRUCTURAL";

export interface CognitiveExperienceRecord {

id:string;

/*
Abstract pattern identifier
*/

patternId:string;

/*
How many independent
realities produced
similar behavior
*/

observedRealities:number;

/*
Total observations
*/

observations:number;

/*
Successful stabilizations
*/

successfulStabilizations:number;

/*
Failed stabilizations
*/

failedStabilizations:number;

/*
0-1

How much this appears
reusable across realities
*/

transferability:number;

/*
0-1

Confidence accumulated
over time
*/

experienceConfidence:number;

state:
ExperienceState;

created_at:string;

updated_at:string;

}

export function updateExperienceTimeline(
memory:CognitiveExperienceRecord[],
patternId:string,
successful:boolean
):CognitiveExperienceRecord[]{

const existing=

memory.find(
x=>
x.patternId===
patternId
);

if(!existing){

return[
...memory,
createInitialRecord(
patternId,
successful
)
];

}

return memory.map(
item=>{

if(
item.patternId !==
patternId
){

return item;

}

const observations=

item.observations+1;

const success=

successful
? item.successfulStabilizations+1
: item.successfulStabilizations;

const failures=

successful
? item.failedStabilizations
: item.failedStabilizations+1;

const confidence=

success/
Math.max(
1,
observations
);

const transferability=

computeTransferability(
item.observedRealities+1,
confidence
);

return{

...item,

observations,

successfulStabilizations:
success,

failedStabilizations:
failures,

observedRealities:
item.observedRealities+1,

experienceConfidence:
round3(
confidence
),

transferability:
round3(
transferability
),

state:
resolveExperienceState(
observations,
confidence,
transferability
),

updated_at:
new Date()
.toISOString()

};

});

}

// ============================================================
// INITIAL RECORD
// ============================================================

function createInitialRecord(
patternId:string,
successful:boolean
):CognitiveExperienceRecord{

return{

id:
crypto.randomUUID(),

patternId,

observedRealities:1,

observations:1,

successfulStabilizations:
successful ? 1 : 0,

failedStabilizations:
successful ? 0 : 1,

transferability:
0.1,

experienceConfidence:
successful
? .7
: .3,

state:
"EPISODIC",

created_at:
new Date()
.toISOString(),

updated_at:
new Date()
.toISOString()

};

}

// ============================================================
// EXPERIENCE STATE
// ============================================================

function resolveExperienceState(
observations:number,
confidence:number,
transferability:number
):ExperienceState{

if(
observations>=50 &&
confidence>=.9 &&
transferability>=.8
){
return "STRUCTURAL";
}

if(
observations>=25 &&
confidence>=.8
){
return "STABLE";
}

if(
observations>=10
){
return "REPEATED";
}

if(
observations>=3
){
return "EMERGING";
}

return "EPISODIC";

}

function computeTransferability(
realities:number,
confidence:number
):number{

return clamp01(
(realities*.05)+
(confidence*.5)
);

}

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
)/1000;

}