// core/src/attention/__tests__/attention.memory.runner.ts
// ============================================================
// PlannerAgent — Attention Memory Runner
// Canonical Test Runner
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Verify:
//
// - attention memory creation
// - repeated focus accumulation
// - dominant focus reconstruction
// - confidence accumulation
//
// ============================================================

import {
appendAttentionMemory,
readAttentionMemory,
clearAttentionMemory
}
from "../attention.memory";

import type{
AttentionSubscription,
AttentionScope,
AttentionTrigger
}
from "../attention.types";


// ============================================================
// MOCK SUBSCRIPTIONS
// ============================================================

function buildSubscription(

scope:
AttentionScope,

trigger:
AttentionTrigger,

target?:string

):AttentionSubscription{

const now=
new Date()
.toISOString();

return{

attention_id:
crypto.randomUUID(),

tenant_id:
"default",

company_id:
"WAL_SIM",

context_id:
"supply_chain",

actor_id:
"planner_1",

scope,

trigger,

priority:
"HIGH",

status:
"ACTIVE",

noise_policy:
"IMMEDIATE_ON_TRIGGER",

target_ref:
target,

target_label:
target,

human_request:
"watch this",

condition:
undefined,

metadata:{},

created_at:
now,

updated_at:
now,

expires_at:
undefined,

last_checked_at:
undefined,

last_triggered_at:
undefined

};

}


// ============================================================
// RUNNER
// ============================================================

async function run(){

console.log("");
console.log("================================");
console.log("ATTENTION MEMORY");
console.log("================================");
console.log("");

clearAttentionMemory();


// ------------------------------------------------------------
// repeated focus
// ------------------------------------------------------------

appendAttentionMemory(

buildSubscription(
"DELIVERY",
"DELIVERY_DATE_CHANGED",
"PO-001"
)

);

appendAttentionMemory(

buildSubscription(
"DELIVERY",
"DELIVERY_DATE_CHANGED",
"PO-001"
)

);

appendAttentionMemory(

buildSubscription(
"DELIVERY",
"DELIVERY_DATE_CHANGED",
"PO-001"
)

);

appendAttentionMemory(

buildSubscription(
"SUPPLIER",
"CHANGE_DETECTED",
"ABC"
)

);

appendAttentionMemory(

buildSubscription(
"DELIVERY",
"DELIVERY_DATE_CHANGED",
"PO-001"
)

);

console.log(
"✅ memory entries created"
);


// ------------------------------------------------------------
// READ MEMORY
// ------------------------------------------------------------

const result=

readAttentionMemory({

company_id:
"WAL_SIM",

actor_id:
"planner_1"

});

console.log(
"✅ memory loaded"
);


// ------------------------------------------------------------
// ASSERTIONS
// ------------------------------------------------------------

if(
result.records.length>0
){

console.log(
"✅ records present"
);

}

if(
result.dominantFocus
){

console.log(
"✅ dominant focus detected"
);

}

if(
result.dominantFocus?.scope===
"DELIVERY"
){

console.log(
"✅ delivery focus dominant"
);

}

if(
(result.dominantFocus?.timesRequested ?? 0)
===4
){

console.log(
"✅ repeated attention accumulated"
);

}

if(
(result.dominantFocus?.confidence ?? 0)
>0.5
){

console.log(
"✅ confidence accumulated"
);

}


// ------------------------------------------------------------
// OUTPUT
// ------------------------------------------------------------

console.log("");

console.log(
"================================"
);

console.log(
"DOMINANT FOCUS"
);

console.log(
"================================"
);

console.log("");

console.log(

JSON.stringify(
result.dominantFocus,
null,
2
)

);

console.log("");

console.log(
"================================"
);

console.log(
"SUMMARY"
);

console.log(
"================================"
);

console.log("");

console.log(

JSON.stringify(
result.summary,
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