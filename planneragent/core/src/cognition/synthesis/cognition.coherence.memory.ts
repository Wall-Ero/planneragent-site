// core/src/cognition/synthesis/cognition.coherence.memory.ts
// ============================================================
// PlannerAgent — Cognitive Coherence Memory
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Stores abstract operational coherence observations learned
// across multiple organizational realities.
//
// DOES NOT STORE
//
// - company identifiers
// - supplier names
// - ERP values
// - people
// - business secrets
// - authority
// - execution history
//
// STORES ONLY
//
// - generalized operational patterns
// - coherence preservation signals
// - experiential learning
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Experience may travel.
// Reality never does.
//
// ============================================================

export type CoherenceDomain =

| "PLAN"
| "REALITY"
| "EXECUTION"
| "DECISION"
| "ORGANIZATIONAL"
| "AUTHORITY"
| "GOVERNANCE"
| "TEMPORAL"
| "COGNITIVE"
| "STRUCTURAL"
| "COORDINATION";

export type ExperienceDomain =

| "SUPPLY_CHAIN"
| "MANUFACTURING"
| "PROCUREMENT"
| "LOGISTICS"
| "PROJECT_COORDINATION"
| "PROGRAM_MANAGEMENT"
| "CUSTOMER_OPERATIONS"
| "OPERATIONS";

export interface CoherenceObservation {

id:string;

coherenceDomain:
CoherenceDomain;

experienceDomain:
ExperienceDomain;

pattern:string;

/*
0-1
How strongly this behavior
preserved coherence
*/

coherenceEffect:number;

/*
0-1
How reliable this pattern
became over time
*/

confidence:number;

/*
How many independent
organizational realities
contributed to pattern
stabilization
*/

experienceDepth:number;

/*
Repeated successful
observations
*/

successfulOccurrences:number;

/*
Repeated failed
observations
*/

failedOccurrences:number;

created_at:string;

updated_at:string;

}

export function appendCoherenceObservation(
memory:CoherenceObservation[],
observation:CoherenceObservation
):CoherenceObservation[]{

const existing=

memory.find(
x=>x.pattern===
observation.pattern
);

if(!existing){

return[
...memory,
observation
];

}

return memory.map(
item=>{

if(
item.pattern !==
observation.pattern
){

return item;

}

const totalSuccess=

item.successfulOccurrences+
observation.successfulOccurrences;

const totalFailure=

item.failedOccurrences+
observation.failedOccurrences;

const totalRuns=

Math.max(
1,
totalSuccess+
totalFailure
);

const confidence=

totalSuccess/
totalRuns;

return{

...item,

successfulOccurrences:
totalSuccess,

failedOccurrences:
totalFailure,

confidence:
round3(confidence),

experienceDepth:
item.experienceDepth+1,

coherenceEffect:
round3(

(
item.coherenceEffect+
observation.coherenceEffect
)/2

),

updated_at:
new Date()
.toISOString()

};

}

);

}

function round3(
v:number
):number{

return Math.round(
v*1000
)/1000;

}