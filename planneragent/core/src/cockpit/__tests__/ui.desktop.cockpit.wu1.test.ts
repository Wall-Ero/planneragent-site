import{describe,expect,it}from"vitest";
import{createCockpitPresentation,type CockpitTransportResponse}from"../../../../ui/cockpit.presentation";
import{resolveRoleFromSession}from"../../../../ui/auth/RoleResolver";
const response=(overrides:Record<string,unknown>={}):CockpitTransportResponse=>({ok:true,operational_cockpit_snapshot:{signals:{data_awareness:"STRUCTURAL",plan:{level:"COHERENT"},reality:{state:"STABLE"},decision_pressure:{level:"LOW"}},canonical_cognition:{decision_pressure:{completeness_status:"COMPLETE"}},...overrides}});
describe("NEW-COCKPIT-UI-IMPLEMENTATION-WU1",()=>{
 it("renders governed canonical cockpit state",()=>expect(createCockpitPresentation(response())).toMatchObject({available:true,dataAwareness:"STRUCTURAL",plan:"VALID",reality:"STABLE",pressure:"LOW"}));
 it.each([["COHERENT","VALID"],["SOME_GAPS","MISSING"],["INCOHERENT","BROKEN"]]as const)("uses established Plan adapter %s to %s",(level,state)=>expect(createCockpitPresentation(response({signals:{data_awareness:"SNAPSHOT",plan:{level},reality:{state:"SHIFTING"},decision_pressure:{level:"MEDIUM"}}})).plan).toBe(state));
 it.each(["SNAPSHOT","BEHAVIORAL","STRUCTURAL"]as const)("preserves Data Awareness %s",state=>expect(createCockpitPresentation(response({signals:{data_awareness:state}})).dataAwareness).toBe(state));
 it.each(["STABLE","SHIFTING","UNSTABLE"]as const)("preserves product Reality %s",state=>expect(createCockpitPresentation(response({signals:{reality:{state}}})).reality).toBe(state));
 it("does not manifest ASSUMED Reality",()=>expect(createCockpitPresentation(response({signals:{reality:{state:"ASSUMED"}}})).reality).toBeUndefined());
 it.each(["LOW","MEDIUM","HIGH"]as const)("preserves asserted Pressure %s",level=>expect(createCockpitPresentation(response({signals:{decision_pressure:{level}}})).pressure).toBe(level));
 it.each(["QUALIFIED_PARTIAL_UNRESOLVED","QUALIFIED_PARTIAL_INSUFFICIENT_EVIDENCE"]as const)("does not fake Pressure for %s",completeness_status=>expect(createCockpitPresentation(response({canonical_cognition:{decision_pressure:{completeness_status}}})).pressure).toBeUndefined());
 it("fails safely without response or governed snapshot",()=>{expect(createCockpitPresentation()).toEqual({available:false,activity:"WAITING"});expect(createCockpitPresentation({ok:false})).toEqual({available:false,activity:"WAITING"})});
 it("is immutable and activity defaults to WAITING",()=>{const x=createCockpitPresentation(response());expect(Object.isFrozen(x)).toBe(true);expect(x.activity).toBe("WAITING")});
 it.each([[{authenticated:false},"ANONYMOUS"],[{authenticated:true,user_id:"user:1"},"USER"],[{authenticated:true,user_id:"founder:1",is_founder:true},"FOUNDER"]]as const)("preserves existing auth resolution as %s",(session,role)=>expect(resolveRoleFromSession(session)).toBe(role));
});
