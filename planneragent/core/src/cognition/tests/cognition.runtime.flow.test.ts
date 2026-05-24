// core/src/cognition/tests/cognition.runtime.flow.test.ts
// ============================================================
// PlannerAgent — Cognition Runtime Flow Test
// Canonical Test Suite
// ============================================================
//
// Covers:
//
// cognition.memory.bridge.ts
// runtime.cognition.selector.ts
// runtime.cognition.adapter.ts
//
// ============================================================

import {describe,it,expect} from "vitest";

import {
buildCognitionMemoryBridge
} from "../synthesis/cognition.memory.bridge";

import {
selectRuntimeCognition
} from "../runtime/runtime.cognition.selector";

import {
adaptRuntimeCognition
} from "../runtime/runtime.cognition.adapter";

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
"2026-05-24T12:00:00Z",

updated_at:
"2026-05-24T12:00:00Z"

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
"2026-05-24T12:00:00Z",

updated_at:
"2026-05-24T12:00:00Z"

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
"2026-05-24T12:00:00Z",

updated_at:
"2026-05-24T12:00:00Z"

}

];


// ============================================================
// TESTS
// ============================================================

describe(
"Cognition Runtime Flow",
()=>{

it(
"should create cognition candidates",
()=>{

const result=

buildCognitionMemoryBridge({
experiences
});

expect(
result.candidates.length
)
.toBe(3);

expect(
result.transferableExperiences
)
.toBe(2);

});

it(
"should prioritize structural experience",
()=>{

const bridge=

buildCognitionMemoryBridge({
experiences
});

expect(
bridge.candidates[0].state
)
.toBe(
"STRUCTURAL"
);

});

it(
"should select best runtime cognition",
()=>{

const bridge=

buildCognitionMemoryBridge({
experiences
});

const selected=

selectRuntimeCognition({

candidates:
bridge.candidates

});

expect(
selected.blocked
)
.toBe(false);

expect(
selected.selected?.state
)
.toBe(
"STRUCTURAL"
);

});

it(
"should block weak cognition",
()=>{

const weak=

buildCognitionMemoryBridge({

experiences:[
experiences[2]!
]

});

const result=

selectRuntimeCognition({

candidates:
weak.candidates

});

expect(
result.blocked
)
.toBe(true);

});

it(
"should create advisory cognition",
()=>{

const bridge=

buildCognitionMemoryBridge({
experiences
});

const selected=

selectRuntimeCognition({

candidates:
bridge.candidates

});

const runtime=

adaptRuntimeCognition({

selected:
selected.selected,

executionAllowed:false

});

expect(
runtime.participationMode
)
.toBe(
"ADVISOR"
);

});

it(
"should create execution cognition",
()=>{

const bridge=

buildCognitionMemoryBridge({
experiences
});

const selected=

selectRuntimeCognition({

candidates:
bridge.candidates

});

const runtime=

adaptRuntimeCognition({

selected:
selected.selected,

executionAllowed:true

});

expect(
runtime.participationMode
)
.toBe(
"EXECUTION"
);

});

it(
"should compute runtime trust",
()=>{

const bridge=

buildCognitionMemoryBridge({
experiences
});

const selected=

selectRuntimeCognition({

candidates:
bridge.candidates

});

const runtime=

adaptRuntimeCognition({

selected:
selected.selected,

executionAllowed:true

});

expect(
runtime.runtimeTrust
)
.toBeGreaterThan(
0.7
);

});

it(
"should generate summary",
()=>{

const bridge=

buildCognitionMemoryBridge({
experiences
});

const selected=

selectRuntimeCognition({

candidates:
bridge.candidates

});

const runtime=

adaptRuntimeCognition({

selected:
selected.selected,

executionAllowed:true

});

expect(
runtime.summary.length
)
.toBeGreaterThan(
0
);

});

});