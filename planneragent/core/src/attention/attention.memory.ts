// core/src/attention/attention.memory.ts
// ============================================================
// PlannerAgent — Attention Memory
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Persist human-directed operational focus patterns.
//
// DOES NOT:
//
// - persist operational reality
// - persist execution
// - persist governance
// - persist decisions
//
// DOES:
//
// - remember human focus patterns
// - reconstruct repeated attention habits
// - enable focus continuity
//
// CORE PRINCIPLE
// ------------------------------------------------------------
//
// Attention remembers:
//
// "what humans repeatedly wanted watched"
//
// not:
//
// "what operational reality did"
//
// ============================================================

import type{
AttentionSubscription
}
from "./attention.types";


// ============================================================
// TYPES
// ============================================================

export interface AttentionMemoryRecord{

id:string;

tenant_id:string;

company_id:string;

actor_id:string;

scope:string;

trigger:string;

target_ref?:string;

target_label?:string;

timesRequested:number;

lastRequestedAt:string;

confidence:number;

summary:string[];

}


export interface AttentionMemoryResult{

records:
AttentionMemoryRecord[];

dominantFocus?:
AttentionMemoryRecord;

summary:
string[];

}


// ============================================================
// IN MEMORY V1
// ============================================================

const attentionMemory:
AttentionMemoryRecord[]=[];


// ============================================================
// APPEND
// ============================================================

export function appendAttentionMemory(

subscription:
AttentionSubscription

):AttentionMemoryRecord{


const existing=

attentionMemory.find(

x=>

x.company_id===subscription.company_id

&&

x.actor_id===subscription.actor_id

&&

x.scope===subscription.scope

&&

x.trigger===subscription.trigger

&&

x.target_ref===subscription.target_ref

);


if(

existing

){

existing.timesRequested++;

existing.lastRequestedAt=

new Date()
.toISOString();

existing.confidence=

round3(

Math.min(
1,
existing.confidence+.1
)

);

return existing;

}


const record:

AttentionMemoryRecord={

id:
crypto.randomUUID(),

tenant_id:
subscription.tenant_id,

company_id:
subscription.company_id,

actor_id:
subscription.actor_id,

scope:
subscription.scope,

trigger:
subscription.trigger,

target_ref:
subscription.target_ref,

target_label:
subscription.target_label,

timesRequested:
1,

lastRequestedAt:
new Date()
.toISOString(),

confidence:
0.3,

summary:[

`scope:${subscription.scope}`,

`trigger:${subscription.trigger}`

]

};


attentionMemory.push(
record
);

return record;

}


// ============================================================
// READ
// ============================================================

export function readAttentionMemory(

params:{

company_id:string;

actor_id?:string;

}

):AttentionMemoryResult{


let records=

attentionMemory.filter(

x=>

x.company_id===params.company_id

);


if(

params.actor_id

){

records=

records.filter(

x=>

x.actor_id===params.actor_id

);

}


records=

records.sort(

(a,b)=>

b.confidence-a.confidence

);


return{

records,

dominantFocus:
records[0],

summary:

buildSummary(
records
)

};

}


// ============================================================
// CLEAR
// ============================================================

export function clearAttentionMemory(){

attentionMemory.length=0;

}


// ============================================================
// SUMMARY
// ============================================================

function buildSummary(

records:
AttentionMemoryRecord[]

):string[]{

if(
!records.length
){

return[
"no_attention_memory"
];

}


const summary:string[]=[];

summary.push(

`focus_patterns:${records.length}`

);


if(

records[0]

){

summary.push(

`dominant_scope:${records[0].scope}`

);

summary.push(

`dominant_trigger:${records[0].trigger}`

);

}


return summary;

}


// ============================================================
// HELPERS
// ============================================================

function round3(
v:number
){

return Math.round(
v*1000
)/1000;

}