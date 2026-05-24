// core/src/pressure/runtime.pressure.timeline.ts
// ============================================================

import type {
  GovernancePressureTrend,
} from "./runtime.pressure.types";

export function computePressureTrend(
history:number[],
current:number
):
"STABLE"
|"INCREASING"
|"DECREASING"
|"VOLATILE"
{

if(history.length===0){
return "STABLE";
}

const values=[
...history,
current
];

let increasing=0;
let decreasing=0;

for(
let i=1;
i<values.length;
i++
){

const delta=
values[i]-
values[i-1];

if(delta>0){
increasing++;
}

if(delta<0){
decreasing++;
}

}

const totalChanges=
increasing+
decreasing;

if(totalChanges===0){
return "STABLE";
}

const dominantRatio=
Math.max(
increasing,
decreasing
)
/totalChanges;

if(
dominantRatio>=0.8
){

return increasing>
decreasing
? "INCREASING"
: "DECREASING";

}

return "VOLATILE";

}