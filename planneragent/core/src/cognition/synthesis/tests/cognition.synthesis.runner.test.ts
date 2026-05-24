// ============================================================
// PlannerAgent — Cognition Synthesis Runtime Runner
// Canonical Source of Truth
// TSX Compatible
// ============================================================

import {
updateExperienceTimeline,
type CognitiveExperienceRecord
}
from "../cognition.experience.timeline";


// ============================================================
// ASSERT
// ============================================================

function assert(
condition:boolean,
message:string
):void{

if(!condition){

throw new Error(
`ASSERT FAILED → ${message}`
);

}

console.log(
`✅ ${message}`
);

}


// ============================================================
// MAIN
// ============================================================

async function run(){

console.log("\n");
console.log("================================");
console.log("COGNITION SYNTHESIS RUNNER");
console.log("================================");

let memory:
CognitiveExperienceRecord[]=[];

const patternId=
"inventory_reconciliation";


// ------------------------------------------------
// EPISODIC
// ------------------------------------------------

memory=
updateExperienceTimeline(
memory,
patternId,
true
);

assert(
memory[0].state==="EPISODIC",
"EPISODIC reached"
);


// ------------------------------------------------
// EMERGING
// ------------------------------------------------

for(
let i=0;
i<3;
i++
){

memory=
updateExperienceTimeline(
memory,
patternId,
true
);

}

assert(
memory[0].state==="EMERGING",
"EMERGING reached"
);


// ------------------------------------------------
// REPEATED
// ------------------------------------------------

for(
let i=0;
i<10;
i++
){

memory=
updateExperienceTimeline(
memory,
patternId,
true
);

}

assert(
memory[0].state==="REPEATED",
"REPEATED reached"
);


// ------------------------------------------------
// STABLE
// ------------------------------------------------

for(
let i=0;
i<20;
i++
){

memory=
updateExperienceTimeline(
memory,
patternId,
true
);

}

assert(
memory[0].state==="STABLE",
"STABLE reached"
);


// ------------------------------------------------
// STRUCTURAL
// ------------------------------------------------

for(
let i=0;
i<50;
i++
){

memory=
updateExperienceTimeline(
memory,
patternId,
true
);

}

assert(
memory[0].state==="STRUCTURAL",
"STRUCTURAL reached"
);

assert(
memory[0].experienceConfidence>.9,
"Confidence > .9"
);

assert(
memory[0].transferability>.8,
"Transferability > .8"
);


// ------------------------------------------------
// FAILURE DEGRADATION
// ------------------------------------------------

for(
let i=0;
i<15;
i++
){

memory=
updateExperienceTimeline(
memory,
patternId,
false
);

}

console.log("\n");
console.log("FINAL EXPERIENCE");
console.log("================================");

console.log(
JSON.stringify(
memory[0],
null,
2
)
);

console.log("\n");
console.log("================================");
console.log("RUN COMPLETE");
console.log("================================");

}


// ============================================================
// START
// ============================================================

run()
.catch(
(err)=>{

console.log("\n");
console.error(
"❌ RUN FAILED"
);

console.error(
err
);

process.exit(1);

}
);