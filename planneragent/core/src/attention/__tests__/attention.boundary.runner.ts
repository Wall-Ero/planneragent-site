// core/src/attention/__tests__/attention.boundary.runner.ts
// ============================================================
// PlannerAgent — Attention Boundary Runner
// Canonical Test Runner
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Verify:
//
// - subscription creation
// - attention evaluation
// - event triggering
// - notification generation
// - attention boundaries
//
// DOES NOT:
//
// - execute actions
// - modify authority
// - modify governance
//
// ============================================================

import {
AttentionSubscriptionStore
}
from "../attention.subscription";

import {
evaluateAttentionSubscriptions
}
from "../attention.engine";

import {
buildAttentionNotificationPayloads
}
from "../attention.notification.bridge";


// ============================================================
// MOCK DB
// ============================================================

const db:any={

prepare(){

return{

bind(){

return{

async run(){

return{
meta:{
changes:1
}
};

},

async all(){

return{

results:[{

attention_id:
"att-001",

tenant_id:
"default",

company_id:
"WAL_SIM",

context_id:
"supply_chain",

actor_id:
"planner_1",

scope:
"DELIVERY",

trigger:
"DELIVERY_DATE_CHANGED",

priority:
"HIGH",

status:
"ACTIVE",

noise_policy:
"IMMEDIATE_ON_TRIGGER",

target_ref:
"PO-001",

target_label:
"Critical delivery",

human_request:
"Disturb me only if deliveries change today",

condition_json:
null,

metadata_json:
"{}",

created_at:
new Date()
.toISOString(),

updated_at:
new Date()
.toISOString(),

expires_at:
null,

last_checked_at:
null,

last_triggered_at:
null

}]

};

},

async first(){

return null;

}

};

}

};

}

};


// ============================================================
// RUNNER
// ============================================================

async function run(){

console.log("");
console.log("================================");
console.log("ATTENTION BOUNDARY");
console.log("================================");
console.log("");


// ------------------------------------------------------------
// CREATE SUBSCRIPTION
// ------------------------------------------------------------

const store=

new AttentionSubscriptionStore(
db
);

await store.create({

tenant_id:
"default",

company_id:
"WAL_SIM",

context_id:
"supply_chain",

actor_id:
"planner_1",

scope:
"DELIVERY",

trigger:
"DELIVERY_DATE_CHANGED",

priority:
"HIGH",

target_ref:
"PO-001",

target_label:
"Critical delivery",

human_request:
"Disturb me only if deliveries change today"

});

console.log(
"✅ subscription created"
);


// ------------------------------------------------------------
// LOAD ACTIVE
// ------------------------------------------------------------

const subscriptions=

await store.getActive({

company_id:
"WAL_SIM",

context_id:
"supply_chain"

});

console.log(
"✅ subscriptions loaded"
);


// ------------------------------------------------------------
// EVALUATE
// ------------------------------------------------------------

const result=

evaluateAttentionSubscriptions({

subscriptions,

context:{

    now_iso:
new Date()
.toISOString(),

company_id:
"WAL_SIM",

context_id:
"supply_chain",

actor_id:
"planner_1",

previous_snapshot:{

delivery:{

date:
"2026-05-24"

}

},

current_snapshot:{

delivery:{

date:
"2026-05-25"

}

}

}

});

if(
result.triggered.length>0
){

console.log(
"✅ event triggered"
);

}else{

console.log(
"❌ no event"
);

}


// ------------------------------------------------------------
// NOTIFICATIONS
// ------------------------------------------------------------

const notifications=

buildAttentionNotificationPayloads(
result.triggered
);

if(
notifications.length>0
){

console.log(
"✅ notification generated"
);

}else{

console.log(
"❌ notification missing"
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
"FINAL EVENT"
);

console.log(
"================================"
);

console.log("");

console.log(
JSON.stringify(
result.triggered[0],
null,
2
)
);

console.log("");

console.log(
"================================"
);

console.log(
"FINAL NOTIFICATION"
);

console.log(
"================================"
);

console.log("");

console.log(
JSON.stringify(
notifications[0],
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