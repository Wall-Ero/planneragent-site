// core/src/attention/attention.policy.ts
// ============================================================
// PlannerAgent — Attention Policy Engine
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Protect human focus while preserving operational meaning.
//
// DOES NOT:
//
// - evaluate reality
// - execute actions
// - create authority
// - persist memory
//
// DOES:
//
// - reduce repetitive noise
// - preserve meaningful change
// - aggregate instability
// - escalate repeated events
//
// CORE PRINCIPLE
// ------------------------------------------------------------
//
// Attention suppresses repetitive noise,
// never meaningful operational change.
//
// ============================================================

import type {
AttentionEvent
}
from "./attention.types";


// ============================================================
// TYPES
// ============================================================

export interface AttentionPolicyInput{

events:
AttentionEvent[];

windowMinutes?:number;

maxDuplicates?:number;

escalationThreshold?:number;

}


export interface AttentionPolicyResult{

delivered:
AttentionEvent[];

suppressed:
AttentionEvent[];

summary:
string[];

}


// ============================================================
// MAIN ENGINE
// ============================================================

export function applyAttentionPolicy(
input:AttentionPolicyInput
):AttentionPolicyResult{

const maxDuplicates=
input.maxDuplicates ?? 2;

const escalationThreshold=
input.escalationThreshold ?? 4;

const delivered:
AttentionEvent[]=[];

const suppressed:
AttentionEvent[]=[];

const grouped=
groupEvents(
input.events
);

for(
const group of grouped
){

// --------------------------------------------------
// repeated instability
// --------------------------------------------------

if(
group.length >=
escalationThreshold
){

delivered.push(
buildEscalatedEvent(
group
)
);

continue;

}


// --------------------------------------------------
// significance filtering
// --------------------------------------------------

let duplicateCount=0;

let previous:
AttentionEvent | null=
null;

for(
const event of group
){

if(
!previous
){

delivered.push(
event
);

previous=
event;

continue;

}


// --------------------------------------------------
// never suppress meaningful change
// --------------------------------------------------

if(
isMeaningfulChange(
previous,
event
)
){

delivered.push(
event
);

previous=
event;

duplicateCount=0;

continue;

}


// --------------------------------------------------
// repetitive noise reduction
// --------------------------------------------------

duplicateCount++;

if(
duplicateCount <=
maxDuplicates
){

delivered.push(
event);

}else{

suppressed.push(
event
);

}

previous=
event;

}

}

return{

delivered,

suppressed,

summary:
buildSummary(
input.events.length,
delivered.length,
suppressed.length
)

};

}


// ============================================================
// MEANINGFUL CHANGE
// ============================================================

function isMeaningfulChange(
previous:AttentionEvent,
current:AttentionEvent
):boolean{


// -------------------------------------
// priority increase
// -------------------------------------

if(

priorityScore(
current.priority
)

>

priorityScore(
previous.priority
)

){

return true;

}


// -------------------------------------
// target changed
// -------------------------------------

if(

current.target_ref
!==

previous.target_ref

){

return true;

}


// -------------------------------------
// reason changed
// -------------------------------------

if(

current.reason
!==

previous.reason

){

return true;

}


// -------------------------------------
// evidence changed
// -------------------------------------

if(

JSON.stringify(
current.evidence
)

!==

JSON.stringify(
previous.evidence
)

){

return true;

}


return false;

}


// ============================================================
// GROUP EVENTS
// ============================================================

function groupEvents(
events:
AttentionEvent[]
):AttentionEvent[][]{

const groups:
Record<
string,
AttentionEvent[]
>={};

for(
const event of events
){

const key=

[
event.scope,
event.trigger
].join("_");

if(
!groups[key]
){

groups[key]=[];

}

groups[key].push(
event);

}

return Object.values(
groups
);

}


// ============================================================
// ESCALATION
// ============================================================

function buildEscalatedEvent(
events:
AttentionEvent[]
):AttentionEvent{

const first=
events[0];

return{

...first,

priority:
"CRITICAL",

reason:
`Repeated instability detected (${events.length} events)`,

evidence:{

trigger:
first.trigger,

events:
events.length

}

};

}


// ============================================================
// PRIORITY SCORE
// ============================================================

function priorityScore(
priority:string
):number{

switch(
priority
){

case "LOW":
return 1;

case "MEDIUM":
return 2;

case "HIGH":
return 3;

case "CRITICAL":
return 4;

default:
return 0;

}

}


// ============================================================
// SUMMARY
// ============================================================

function buildSummary(
checked:number,
delivered:number,
suppressed:number
):string[]{

const summary:string[]=[];

summary.push(
`events:${checked}`
);

summary.push(
`delivered:${delivered}`
);

summary.push(
`suppressed:${suppressed}`
);

if(
suppressed>0
){

summary.push(
"noise_reduction_active"
);

}

if(
delivered>0
){

summary.push(
"meaning_preserved"
);

}

return summary;

}