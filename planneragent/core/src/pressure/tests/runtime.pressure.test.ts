// core/src/pressure/tests/runtime.pressure.test.ts
// ============================================================
// PlannerAgent — Runtime Governance Pressure Tests
// Canonical Source of Truth
// ============================================================

import {
describe,
it,
expect
} from "vitest";

import {
evaluateRuntimeGovernancePressure,
} from "../runtime.governance.pressure.engine";

import {
resolveDominantPressure,
} from "../runtime.pressure.classifier";

import {
computePressureTrend,
} from "../runtime.pressure.timeline";

import {
buildPressureSummary,
} from "../runtime.pressure.summary";

describe(
"Runtime Governance Pressure Engine",
()=>{

it(
"should return NONE when no evidence exists",
()=>{

const result=
evaluateRuntimeGovernancePressure({

evidence:{

rollbackRate:0,
overrideRate:0,
correctionFailureRate:0,

repeatedApprovals:0,
manualInterventions:0,
recurringExceptions:0,
unstableExecutions:0,

reconciliationVolatility:0,
decisionChurn:0,

delegatedExecutionLoad:0,
governanceReviews:0,
unresolvedGovernancePressure:0

}

});

expect(result.level)
.toBe("NONE");

expect(result.governanceRelevant)
.toBe(false);

});

it(
"should trigger governance relevance",
()=>{

const result=
evaluateRuntimeGovernancePressure({

evidence:{

rollbackRate:.45,
overrideRate:.45,
correctionFailureRate:.40,

repeatedApprovals:70,
manualInterventions:55,
recurringExceptions:15,
unstableExecutions:15,

reconciliationVolatility:.5,
decisionChurn:.5,

delegatedExecutionLoad:60,
governanceReviews:8,
unresolvedGovernancePressure:10

},

previousPressureScores:[
0.65,
0.72,
0.78,
0.84
]

});

expect(
result.governanceRelevant
)
.toBe(true);

expect(
result.level
)
.toMatch(
/MEDIUM|HIGH|CRITICAL/
);

});

});

describe(
"Runtime Pressure Timeline",
()=>{

it(
"should return stable if no history exists",
()=>{

expect(
computePressureTrend(
[],
0
)
)
.toBe("STABLE");

});

it(
"should detect increasing trend",
()=>{

expect(
computePressureTrend(
[
0.20,
0.25,
0.30,
0.35,
0.40
],
0.45
)
)
.toBe(
"INCREASING"
);

});

it(
"should detect decreasing trend",
()=>{

expect(
computePressureTrend(
[
0.80,
0.70,
0.60,
0.50
],
0.40
)
)
.toBe("DECREASING");

});

it(
"should detect volatile trend",
()=>{

expect(
computePressureTrend(
[
0.20,
0.85,
0.30,
0.92,
0.35
],
0.80
)
)
.toBe("VOLATILE");

});

});

describe(
"Runtime Pressure Classifier",
()=>{

it(
"should resolve dominant pressure",
()=>{

const dominant=
resolveDominantPressure({

structuralFriction:.2,
workflowFatigue:.8,
exceptionRecurrence:.1,
processInstability:.3,
governanceSaturation:.4

});

expect(
dominant
)
.toBe(
"WORKFLOW_FATIGUE"
);

});

});

describe(
"Runtime Pressure Summary",
()=>{

it(
"should build summary",
()=>{

const summary=
buildPressureSummary({

level:"HIGH",

trend:"INCREASING",

dominantPressure:
"STRUCTURAL_FRICTION",

stabilizationRisk:
"HIGH",

pressureScore:.8,

governanceRelevant:true,

breakdown:{

structuralFriction:.9,
workflowFatigue:.2,
exceptionRecurrence:.1,
processInstability:.1,
governanceSaturation:.1

},

summary:[]

});

expect(
summary.length
)
.toBeGreaterThan(0);

});

});