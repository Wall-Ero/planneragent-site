// core/src/cognition/synthesis/cognition.pattern.memory.ts
// ============================================================
// PlannerAgent — Synthetic Pattern Memory
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Preserve recurring operational structures that repeatedly
// emerge across observed reality.
//
// This memory DOES NOT:
//
// - preserve raw company data
// - preserve ERP identifiers
// - preserve supplier names
// - preserve decisions
// - preserve authority
//
// It DOES:
//
// - preserve recurring structures
// - preserve operational archetypes
// - preserve experiential patterns
//
// ============================================================

import type {

ExperiencePattern,
PatternCategory,
SyntheticExperienceLevel,

} from "./cognition.synthesis.types";

// ============================================================
// TYPES
// ============================================================

export interface PatternMemory {

patterns:
ExperiencePattern[];

}

// ============================================================
// CREATE
// ============================================================

export function createPatternMemory():
PatternMemory {

return{

patterns:[]

};

}

// ============================================================
// APPEND
// ============================================================

export function appendPatternMemory(
memory:PatternMemory,

input:{

category:PatternCategory;

description:string;

confidence:number;

}

):PatternMemory{

const existing =
memory.patterns.find(

x=>

x.category===
input.category

&&

x.description===
input.description

);

if(existing){

return{

patterns:

memory.patterns.map(

x=>{

if(
x.id!==existing.id
){

return x;

}

const occurrences =
x.observedOccurrences+1;

return{

...x,

observedOccurrences:
occurrences,

confidence:
round3(

(
x.confidence+
input.confidence
)/2

),

experienceLevel:
deriveExperienceLevel(
occurrences
)

};

}

)

};

}

const pattern:
ExperiencePattern={

id:
crypto.randomUUID(),

category:
input.category,

description:
input.description,

observedOccurrences:1,

confidence:
round3(
input.confidence
),

experienceLevel:
"EPISODIC"

};

return{

patterns:[

...memory.patterns,
pattern

]

};

}

// ============================================================
// HELPERS
// ============================================================

export function getRecurringPatterns(
memory:PatternMemory
):ExperiencePattern[]{

return memory.patterns.filter(

x=>

x.experienceLevel===
"RECURRING"

||

x.experienceLevel===
"GENERALIZED"

||

x.experienceLevel===
"EXPERIENTIAL"

);

}

export function getExperientialPatterns(
memory:PatternMemory
):ExperiencePattern[]{

return memory.patterns.filter(

x=>

x.experienceLevel===
"EXPERIENTIAL"

);

}

function deriveExperienceLevel(
occurrences:number
):SyntheticExperienceLevel{

if(
occurrences>=20
){
return "EXPERIENTIAL";
}

if(
occurrences>=10
){
return "GENERALIZED";
}

if(
occurrences>=4
){
return "RECURRING";
}

return "EPISODIC";

}

function round3(
value:number
):number{

return Math.round(
value*1000
)/1000;

}