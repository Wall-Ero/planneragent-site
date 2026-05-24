// core/src/cognition/runtime/tests/runtime.cognition.test.ts
// ============================================================
// PlannerAgent — Runtime Cognition Tests
// Canonical Source of Truth
// ============================================================

import { describe,it,expect } from "vitest";

import {

evaluateRuntimeCognitionGuard

} from "../runtime.cognition.guard";

import {

buildRuntimeCognitionAdvice

} from "../runtime.cognition.advisor";

import {

buildRuntimeCognitionExecution

} from "../runtime.cognition.execution";

import type {

RuntimeCognitionInput,
RuntimeCognitionCandidate

} from "../runtime.cognition.types";


// ============================================================
// FIXTURES
// ============================================================

const baseInput:RuntimeCognitionInput={

authority:"JUNIOR",

experienceState:"STABLE",

transferability:.80,

experienceConfidence:.90,

riskScore:.20,

organizationalCoherence:.80,

decisionPressure:.30

};


const candidate:RuntimeCognitionCandidate={

id:"candidate-1",

patternId:"supplier-delay-pattern",

experienceState:"STABLE",

confidence:.85,

transferability:.90,

applicability:.75,

riskScore:.20,

summary:[
"stable_pattern_detected"
]

};


// ============================================================
// TESTS
// ============================================================

describe(

"Runtime Cognition",

()=>{


it(

"should block VISION runtime cognition",

()=>{

const result=

evaluateRuntimeCognitionGuard({

...baseInput,

authority:"VISION"

});

expect(
result.allowed
)
.toBe(
false
);

expect(
result.status
)
.toBe(
"BLOCKED"
);

}

);


it(

"should allow JUNIOR advisory cognition",

()=>{

const result=

evaluateRuntimeCognitionGuard({

...baseInput,

authority:"JUNIOR"

});

expect(
result.allowed
)
.toBe(
true
);

expect(
result.status
)
.toBe(
"ALLOWED"
);

}

);


it(

"should create advisory recommendation",

()=>{

const advice=

buildRuntimeCognitionAdvice(

baseInput,
candidate

);

expect(

advice.recommendationConfidence

)

.toBeGreaterThan(
0
);

expect(

advice.summary

)

.toContain(

"pattern:supplier-delay-pattern"

);

}

);


it(

"should block execution for JUNIOR",

()=>{

const execution=

buildRuntimeCognitionExecution(

{

...baseInput,

authority:"JUNIOR"

},

candidate

);

expect(

execution.executionAllowed

)

.toBe(
false
);

}

);


it(

"should allow execution for SENIOR",

()=>{

const execution=

buildRuntimeCognitionExecution(

{

...baseInput,

authority:"SENIOR"

},

candidate

);

expect(

execution.executionAllowed

)

.toBe(
true
);

}

);


it(

"should block risky execution",

()=>{

const execution=

buildRuntimeCognitionExecution(

{

...baseInput,

authority:"SENIOR",

riskScore:.95

},

candidate

);

expect(

execution.executionAllowed

)

.toBe(
false
);

}

);


it(

"should generate execution reasoning",

()=>{

const execution=

buildRuntimeCognitionExecution(

{

...baseInput,

authority:"PRINCIPAL"

},

candidate

);

expect(

execution.executionReasoning

)

.toContain(

"authority:PRINCIPAL"

);

}

);

});