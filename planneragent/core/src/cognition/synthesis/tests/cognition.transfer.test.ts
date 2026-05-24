// core/src/cognition/synthesis/tests/cognition.transfer.test.ts
// ============================================================
// PlannerAgent — Cognitive Transfer Tests
// Canonical Source of Truth
// ============================================================

import {
describe,
it,
expect
}
from "vitest";

import {

buildCognitiveTransfer

}
from "../cognition.transfer.engine";

import type {

CognitiveTransferCandidate

}
from "../cognition.transfer.types";


// ============================================================
// FACTORY
// ============================================================

function createCandidate(

overrides:
Partial<CognitiveTransferCandidate>={}

):CognitiveTransferCandidate{

return{

id:"candidate-1",

patternId:"pattern-1",

experienceConfidence:.80,

transferability:.80,

similarity:.80,

experienceState:
"STABLE",

...overrides

};

}


// ============================================================
// TESTS
// ============================================================

describe(

"Cognitive Transfer",

()=>{


it(

"should return blocked when no candidates exist",

()=>{

const result=

buildCognitiveTransfer({

candidates:[]

});

expect(

result.transferAllowed

)

.toBe(
false
);

expect(

result.candidateId

)

.toBeNull();

expect(

result.summary

)

.toContain(
"no_candidate_available"
);

});


it(

"should select highest scoring candidate",

()=>{

const result=

buildCognitiveTransfer({

candidates:[

createCandidate({

id:"low",

similarity:.5,

transferability:.5,

experienceConfidence:.5

}),

createCandidate({

id:"high",

similarity:.9,

transferability:.9,

experienceConfidence:.9

})

]

});

expect(

result.candidateId

)

.toBe(
"high"
);

});


it(

"should allow structural experience transfer",

()=>{

const result=

buildCognitiveTransfer({

candidates:[

createCandidate({

experienceState:
"STRUCTURAL",

similarity:.95,

transferability:.90,

experienceConfidence:.92

})

]

});

expect(

result.transferAllowed

)

.toBe(
true
);

expect(

result.transferRisk

)

.toBe(
"LOW"
);

expect(

result.summary

)

.toContain(

"structural_experience_detected"

);

});


it(

"should block risky experience transfer",

()=>{

const result=

buildCognitiveTransfer({

candidates:[

createCandidate({

experienceState:
"EPISODIC",

similarity:.30,

transferability:.20,

experienceConfidence:.25

})

]

});

expect(

result.transferAllowed

)

.toBe(
false
);

expect(

result.transferRisk

)

.toBe(
"HIGH"
);

});


it(

"should compute confidence",

()=>{

const result=

buildCognitiveTransfer({

candidates:[

createCandidate({

similarity:.80,

transferability:.75,

experienceConfidence:.85

})

]

});

expect(

result.transferConfidence

)

.toBeGreaterThan(
0
);

expect(

result.transferConfidence

)

.toBeLessThanOrEqual(
1
);

});


it(

"should create summary",

()=>{

const result=

buildCognitiveTransfer({

candidates:[

createCandidate({

id:"summary-test",

experienceState:
"STRUCTURAL"

})

]

});

expect(

result.summary

)

.toContain(

"candidate:summary-test"

);

expect(

result.summary

)

.toContain(

"transfer_allowed"

);

});

});