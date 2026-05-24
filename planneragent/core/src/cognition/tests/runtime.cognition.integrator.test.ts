// core/src/cognition/tests/runtime.cognition.integrator.test.ts
// ============================================================
// PlannerAgent — Runtime Cognition Integrator Test
// Canonical Test Suite
// ============================================================

import {describe,it,expect} from "vitest";

import {
buildRuntimeCognition
} from "../runtime/runtime.cognition.integrator"
import type {
CognitiveExperienceRecord
} from "../synthesis/cognition.experience.timeline";


// ============================================================
// TEST DATA
// ============================================================

const experiences:CognitiveExperienceRecord[]=[

{

id:"exp-001",

patternId:"pattern-A",

state:"REPEATED",

experienceConfidence:.65,

transferability:.70,

observedRealities:4,

observations:8,

successfulStabilizations:3,

failedStabilizations:1,

created_at:
"2026-05-24T16:00:00Z",

updated_at:
"2026-05-24T16:00:00Z"

},

{

id:"exp-002",

patternId:"pattern-B",

state:"STRUCTURAL",

experienceConfidence:.95,

transferability:.92,

observedRealities:12,

observations:22,

successfulStabilizations:15,

failedStabilizations:0,

created_at:
"2026-05-24T16:00:00Z",

updated_at:
"2026-05-24T16:00:00Z"

},

{

id:"exp-003",

patternId:"pattern-C",

state:"EMERGING",

experienceConfidence:.30,

transferability:.20,

observedRealities:1,

observations:2,

successfulStabilizations:0,

failedStabilizations:2,

created_at:
"2026-05-24T16:00:00Z",

updated_at:
"2026-05-24T16:00:00Z"

}

];


// ============================================================
// TESTS
// ============================================================

describe(
"Runtime Cognition Integrator",
()=>{

it(
"should build cognition bridge",
()=>{

const result=

buildRuntimeCognition({

experiences,
executionAllowed:false

});

expect(
result.bridge.totalExperiences
)
.toBe(3);

expect(
result.bridge.transferableExperiences
)
.toBe(2);

});

it(
"should select structural cognition",
()=>{

const result=

buildRuntimeCognition({

experiences,
executionAllowed:false

});

expect(
result.runtime.experienceId
)
.toBe(
"exp-002"
);

});

it(
"should create advisor participation",
()=>{

const result=

buildRuntimeCognition({

experiences,
executionAllowed:false

});

expect(
result.runtime.participationMode
)
.toBe(
"ADVISOR"
);

});

it(
"should create execution participation",
()=>{

const result=

buildRuntimeCognition({

experiences,
executionAllowed:true

});

expect(
result.runtime.participationMode
)
.toBe(
"EXECUTION"
);

});

it(
"should compute runtime trust",
()=>{

const result=

buildRuntimeCognition({

experiences,
executionAllowed:true

});

expect(
result.runtime.runtimeTrust
)
.toBeGreaterThan(
0.7
);

});

it(
"should block weak cognition",
()=>{

const result=

buildRuntimeCognition({

experiences:[
experiences[2]!
],

executionAllowed:true

});

expect(
result.selection.blocked
)
.toBe(true);

expect(
result.runtime.participationMode
)
.toBe(
"NONE"
);

});

it(
"should create summary",
()=>{

const result=

buildRuntimeCognition({

experiences,
executionAllowed:true

});

expect(
result.summary.length
)
.toBeGreaterThan(
0
);

});

it(
"should create high runtime trust signal",
()=>{

const result=

buildRuntimeCognition({

experiences,
executionAllowed:true

});

expect(

result.summary.includes(
"high_runtime_trust"
)

).toBe(true);

});

});