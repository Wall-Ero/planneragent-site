import {describe,expect,it} from "vitest";
import {enforceVisionExecutionBoundary,VISION_NO_EXECUTION_REASON} from "../visionExecutionBoundary.v1";
import {guardExecutionIntent} from "../../../executor/executor.guard.v1";
import {isExecutionAllowedForPlan} from "../authorityExecution.policy";
import {computeDataAwarenessLevel} from "../../../reality/reality.level";
import {computePlanCoherence} from "../../../topology/plan.coherence";
import {inferBomFromProduction} from "../../reality/inferBomFromProduction.v1";
import {runScenario} from "../../../simulation/scenario.runner";

const vision=(executionAllowed=true,governanceReason="DATA_REPAIR_ONLY")=>enforceVisionExecutionBoundary({plan:"VISION",executionAllowed,governanceReason});
describe("VISION-SB-WU1 canonical no-execution boundary",()=>{
 it.each(["ADVISORY_ONLY","DATA_REPAIR_ONLY","PLAN_REPAIR_DELEGATED_EXECUTION","RECOVERY","FALLBACK","OPTIMIZER","SCENARIO"])("denies VISION eligibility from %s",governanceReason=>{expect(enforceVisionExecutionBoundary({plan:"VISION",executionAllowed:true,governanceReason})).toEqual({executionAllowed:false,governanceReason:VISION_NO_EXECUTION_REASON,executionPreviewExecutable:false,issueExecutionActionId:false,resolveExecutionCredential:false,permitExecutionSuccessEvidence:false});});
 it("denies caller-requested EXECUTE at both authority and executor guards",()=>{expect(isExecutionAllowedForPlan("VISION")).toBe(false);expect(guardExecutionIntent({mode:"VISION",capability_id:"erp.write",payload:{}} as any,{hasAuthority:true,approver_id:"approver"})).toEqual({ok:false,reason:"VISION_CANNOT_EXECUTE"});});
 it("keeps data repair advisory and issues no action identity, credential, or success evidence",()=>{expect(vision()).toMatchObject({executionAllowed:false,executionPreviewExecutable:false,issueExecutionActionId:false,resolveExecutionCredential:false,permitExecutionSuccessEvidence:false});});
 it.each([["JUNIOR",true],["SENIOR",true],["PRINCIPAL",true],["CHARTER",false]] as const)("does not change %s eligibility",(plan,allowed)=>{expect(enforceVisionExecutionBoundary({plan,executionAllowed:allowed,governanceReason:"existing"})).toMatchObject({executionAllowed:allowed,governanceReason:"existing"});});
 it("preserves Data Awareness snapshot, behavioral, and structural inputs",()=>{expect(computeDataAwarenessLevel({orders:[{}]})).toBe(1);expect(computeDataAwarenessLevel({orders:[{}],inventory:[{}]})).toBe(2);expect(computeDataAwarenessLevel({orders:[{}],inventory:[{}],movements:[{}]})).toBe(3);});
 it("preserves Plan Coherence as an observational result",()=>{expect(computePlanCoherence({orders:[{orderId:"1"}]})).toMatchObject({level:"INCOHERENT",score:expect.any(Number)});expect(vision().executionAllowed).toBe(false);});
 it("preserves historical BOM reconstruction without execution",()=>{const result=inferBomFromProduction([{order:"P1",article:"FG",quantity:10}],[{order:"P1",article:"RM",quantity:-20}]);expect(result.bom[0]?.components[0]?.median_ratio).toBe(2);expect(vision().executionAllowed).toBe(false);});
 it("preserves deterministic scenarios without making them executable",()=>{const result=runScenario({snapshot:{inventory:[],orders:[],supply:[],bom:[],assumptions:[],confidence:{},awareness_level:0} as any,mode:"PLAN_REPAIR",changes:[]});expect(result.mode).toBe("PLAN_REPAIR");expect(vision().executionAllowed).toBe(false);});
});
