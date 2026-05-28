// core/src/attention/__tests__/attention.narrative.runner.ts
// ============================================================
// PlannerAgent — Attention Narrative Runner
// Canonical Test Runner
// ============================================================

import {
buildAttentionNarrative
}
from "../attention.narrative";

import type{
AttentionSubscription,
AttentionEvent
}
from "../attention.types";

import type{
AttentionLifecycleEvaluation
}
from "../attention.lifecycle";

function subscription(
id:string
):AttentionSubscription{

const now=
new Date()
.toISOString();

return{

attention_id:id,

tenant_id:"default",
company_id:"WAL_SIM",
context_id:"supply_chain",
actor_id:"planner_1",

scope:"DELIVERY",

trigger:"DELIVERY_DATE_CHANGED",

priority:"HIGH",

status:"ACTIVE",

noise_policy:
"IMMEDIATE_ON_TRIGGER",

target_ref:id,

target_label:
`PO ${id}`,

human_request:
"Watch delivery",

condition:
undefined,

metadata:{},

created_at:now,
updated_at:now,

expires_at:
undefined,

last_checked_at:
now,

last_triggered_at:
undefined

};

}

async function run(){

console.log("");
console.log("================================");
console.log("ATTENTION NARRATIVE");
console.log("================================");
console.log("");

const subscriptions=[
subscription("PO-001"),
subscription("PO-002"),
subscription("PO-003")
];

const events:AttentionEvent[]=[

{
attention_id:"PO-001",

scope:"DELIVERY",

trigger:"DELIVERY_DATE_CHANGED",

priority:"HIGH",

target_ref:"PO-001",

target_label:"Critical delivery",

reason:
"Delivery changed",

human_request:
"Disturb me only if changed",

evidence:{},

triggered_at:
new Date()
.toISOString()
}

];

const lifecycle:
AttentionLifecycleEvaluation[]=[

{
attention_id:"PO-002",

status:"ACTIVE",

lifecycleState:
"STALE",

realityPresence:
"WEAK",

cancellable:false,

humanReviewRequired:true,

reason:
"Attention not refreshed",

summary:[]
},

{
attention_id:"PO-003",

status:"ACTIVE",

lifecycleState:
"OBSOLETE",

realityPresence:
"MISSING",

cancellable:true,

humanReviewRequired:false,

reason:
"Target disappeared",

summary:[]
}

];

const narrative=
buildAttentionNarrative({

subscriptions,
events,
lifecycle

});

console.log(
"✅ narrative built"
);

if(
narrative.triggered.length===1
){

console.log(
"✅ triggered attention detected"
);

}

if(
narrative.stale.length===1
){

console.log(
"✅ stale attention detected"
);

}

if(
narrative.obsolete.length===1
){

console.log(
"✅ obsolete attention detected"
);

}

if(
narrative.cancellable.length===1
){

console.log(
"✅ cancellable attention detected"
);

}

console.log("");

console.log(
"================================"
);

console.log(
"NARRATIVE"
);

console.log(
"================================"
);

console.log("");

console.log(
JSON.stringify(
narrative,
null,
2
)
);

console.log("");

console.log(
"================================"
);

console.log(
"RUN COMPLETE"
);

console.log(
"================================"
);

console.log("");

}

run();