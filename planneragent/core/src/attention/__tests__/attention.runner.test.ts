// core/src/attention/__tests__/attention.runner.test.ts
// ============================================================
// PlannerAgent — Attention Runner
// Canonical Validation
// Run:
//
// npm tsx core/src/attention/__tests__/attention.runner.test.ts
// ============================================================

import {
evaluateAttentionSubscriptions
}
from "../attention.engine";

import {
buildAttentionNotificationPayload
}
from "../attention.notification.bridge";

import type {
AttentionSubscription,
AttentionEvaluationContext
}
from "../attention.types";

console.log(`
================================
ATTENTION RUNNER
================================
`);

const subscription:AttentionSubscription={

attention_id:
crypto.randomUUID(),

tenant_id:
"default",

company_id:
"planneragent",

context_id:
"supply_chain",

actor_id:
"scm_001",

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

created_at:
new Date().toISOString(),

updated_at:
new Date().toISOString()
};

console.log(
"✅ Subscription created"
);

const context:
AttentionEvaluationContext={

company_id:
"planneragent",

context_id:
"supply_chain",

actor_id:
"scm_001",

now_iso:
new Date().toISOString(),

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
};

console.log(
"✅ Subscription loaded"
);

const result=
evaluateAttentionSubscriptions({

subscriptions:[
subscription
],

context

});

if(
result.triggered.length>0
){

console.log(
"✅ Delivery change detected"
);

}else{

throw new Error(
"Delivery trigger failed"
);

}

const event=
result.triggered[0];

if(event){

console.log(
"✅ Attention trigger generated"
);

}else{

throw new Error(
"Attention event missing"
);

}

const notification=
buildAttentionNotificationPayload(
event
);

if(notification){

console.log(
"✅ Notification payload built"
);

}else{

throw new Error(
"Notification failed"
);

}

subscription.status=
"DISABLED";

if(
subscription.status===
"DISABLED"
){

console.log(
"✅ Subscription disabled"
);

}else{

throw new Error(
"Disable failed"
);

}

console.log(`
================================
FINAL EVENT
================================
`);

console.log(
JSON.stringify(
event,
null,
2
)
);

console.log(`
================================
FINAL NOTIFICATION
================================
`);

console.log(
JSON.stringify(
notification,
null,
2
)
);

console.log(`
================================
RUN COMPLETE
================================
`);