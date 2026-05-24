// core/src/cognition/synthesis/tests/cognition.synthesis.test.ts
// ============================================================
// PlannerAgent — Cognitive Synthesis Tests
// Canonical Source of Truth
// ============================================================

import {
describe,
it,
expect
} from "vitest";

import {
buildCognitiveSynthesis
} from "../cognition.synthesis.engine";

import type {
CognitiveExperienceRecord,
ExperienceState
}
from "../cognition.experience.timeline";


// ============================================================
// FACTORIES
// ============================================================

function createExperience(

state:
| "EPISODIC"
| "EMERGING"
| "REPEATED"
| "STABLE"
| "STRUCTURAL",

experienceConfidence:number,

transferability:number

):CognitiveExperienceRecord{

return{

id:"exp-1",

patternId:"pattern-1",

state:
state as ExperienceState,

experienceConfidence,

transferability,

observedRealities:1,

observations:1,

successfulStabilizations:1,

failedStabilizations:0,

created_at:
"2026-01-01",

updated_at:
"2026-01-01"

};

}


// ============================================================
// TESTS
// ============================================================

describe(

"Cognitive Synthesis",

()=>{


it(

"should detect repeated experience",

()=>{

const result=

buildCognitiveSynthesis({

patterns:[

{
confidence:.7
}

],

coherences:[

{
score:.8
}

],

stabilizations:[

{
successRate:.7
}

],

experiences:[

createExperience(
"REPEATED",
.65,
.50
),

createExperience(
"REPEATED",
.60,
.55
)

]

});

expect(

result.dominantExperienceState

)

.toBe(

"REPEATED"

);

});


it(

"should detect stable experience",

()=>{

const result=

buildCognitiveSynthesis({

patterns:[

{
confidence:.8
}

],

coherences:[

{
score:.9
}

],

stabilizations:[

{
successRate:.8
}

],

experiences:[

createExperience(
"STABLE",
.82,
.72
),

createExperience(
"STABLE",
.79,
.75
)

]

});

expect(

result.dominantExperienceState

)

.toBe(

"STABLE"

);

expect(

result.cognitiveMaturity

)

.toBe(

"HIGH"

);

});


it(

"should detect structural experience",

()=>{

const result=

buildCognitiveSynthesis({

patterns:[

{
confidence:.9
}

],

coherences:[

{
score:.95
}

],

stabilizations:[

{
successRate:.95
}

],

experiences:[

createExperience(
"STRUCTURAL",
.95,
.90
),

createExperience(
"STRUCTURAL",
.92,
.85
)

]

});

expect(

result.dominantExperienceState

)

.toBe(

"STRUCTURAL"

);

expect(

result.cognitiveMaturity

)

.toBe(

"STRUCTURAL"

);

});


it(

"should compute transferability",

()=>{

const result=

buildCognitiveSynthesis({

patterns:[

{
confidence:.7
}

],

coherences:[

{
score:.7
}

],

stabilizations:[

{
successRate:.8
}

],

experiences:[

createExperience(
"STABLE",
.70,
.80
),

createExperience(
"STABLE",
.90,
.50
)

]

});

expect(

result.transferability

)

.toBeGreaterThan(
0
);

expect(

result.transferability

)

.toBeLessThanOrEqual(
1
);

});


it(

"should create summary",

()=>{

const result=

buildCognitiveSynthesis({

patterns:[

{
confidence:.9
}

],

coherences:[

{
score:.9
}

],

stabilizations:[

{
successRate:.9
}

],

experiences:[

createExperience(
"STRUCTURAL",
.95,
.90
)

]

});

expect(

result.summary

)

.toContain(

"experience_state:STRUCTURAL"

);

expect(

result.summary

)

.toContain(

"maturity:STRUCTURAL"

);

expect(

result.summary

)

.toContain(

"cross_reality_operational_understanding_detected"

);

});


});