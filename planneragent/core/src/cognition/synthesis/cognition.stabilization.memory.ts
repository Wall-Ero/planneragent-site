// core/src/cognition/synthesis/cognition.stabilization.memory.ts
// ============================================================
// PlannerAgent — Cognitive Stabilization Memory
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Stores abstract stabilization behaviors learned across
// multiple operational realities.
//
// DOES NOT STORE
//
// - company identifiers
// - ERP data
// - suppliers
// - users
// - execution details
// - authority
//
// STORES ONLY
//
// - generalized stabilization patterns
// - operational outcomes
// - stabilization confidence
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// PlannerAgent does not remember organizations.
//
// PlannerAgent remembers what tends
// to stabilize operational reality.
//
// ============================================================

export type StabilizationDomain =

| "SUPPLY_CHAIN"
| "MANUFACTURING"
| "PROCUREMENT"
| "LOGISTICS"
| "PROJECT_COORDINATION"
| "PROGRAM_MANAGEMENT"
| "OPERATIONS"
| "CUSTOMER_OPERATIONS";

export type StabilizationType =

| "PRESSURE_REDUCTION"
| "COHERENCE_RECOVERY"
| "INSTABILITY_CONTAINMENT"
| "EXCEPTION_STABILIZATION"
| "EXECUTION_ALIGNMENT"
| "DECISION_ALIGNMENT"
| "COORDINATION_RECOVERY";

export interface StabilizationPattern {

id:string;

/*
Abstract operational pattern
*/

behavior:string;

domain:
StabilizationDomain;

stabilizationType:
StabilizationType;

/*
0-1

How much stabilization
was repeatedly observed
*/

stabilizationEffect:number;

/*
0-1

Reliability accumulated
through repeated use
*/

confidence:number;

/*
Number of independent
organizational realities
where pattern appeared
*/

experienceDepth:number;

/*
Repeated successful
stabilizations
*/

successfulOccurrences:number;

/*
Repeated failed
stabilizations
*/

failedOccurrences:number;

/*
Average recovery speed
relative to observation
*/

recoveryVelocity:number;

/*
Average reduction of
operational pressure
*/

pressureReduction:number;

/*
Average increase in
system coherence
*/

coherenceRecovery:number;

created_at:string;

updated_at:string;

}

// ============================================================
// APPEND
// ============================================================

export function appendStabilizationPattern(
memory:StabilizationPattern[],
incoming:StabilizationPattern
):StabilizationPattern[]{

const existing=

memory.find(
x=>

x.behavior===
incoming.behavior &&

x.domain===
incoming.domain
);

if(!existing){

return[
...memory,
incoming
];

}

return memory.map(
item=>{

if(
item.id !==
existing.id
){

return item;

}

const success=

item.successfulOccurrences+
incoming.successfulOccurrences;

const failures=

item.failedOccurrences+
incoming.failedOccurrences;

const total=

Math.max(
1,
success+
failures
);

return{

...item,

successfulOccurrences:
success,

failedOccurrences:
failures,

experienceDepth:
item.experienceDepth+1,

confidence:
round3(
success/total
),

stabilizationEffect:
average(
item.stabilizationEffect,
incoming.stabilizationEffect
),

recoveryVelocity:
average(
item.recoveryVelocity,
incoming.recoveryVelocity
),

pressureReduction:
average(
item.pressureReduction,
incoming.pressureReduction
),

coherenceRecovery:
average(
item.coherenceRecovery,
incoming.coherenceRecovery
),

updated_at:
new Date()
.toISOString()

};

}

);

}

// ============================================================
// HELPERS
// ============================================================

function average(
a:number,
b:number
):number{

return round3(
(a+b)/2
);

}

function round3(
v:number
):number{

return Math.round(
v*1000
)/1000;

}