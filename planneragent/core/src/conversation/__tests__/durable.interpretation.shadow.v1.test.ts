/// <reference types="@cloudflare/vitest-pool-workers" />
import { applyD1Migrations, createExecutionContext, env, waitOnExecutionContext } from "cloudflare:test";
import worker from "../../worker";
import type { Env } from "../../types/env";
declare module "cloudflare:test" { interface ProvidedEnv extends Env {} }
import { beforeAll, describe, expect, it, vi } from "vitest";
import migration from "../../../migrations/0035_interpretation_shadow_windows.sql?raw";
import { D1InterpretationShadowInfrastructureV1 as Repository, QUALIFIED_STUDENT_SERVING_REFERENCE_V1 as serving, createQualifiedStudentServingReferenceV1, shadowObservationIdV1 } from "../cognition/durable.interpretation.shadow.infrastructure.v1";
import { resolveDurableShadowConfigurationV1 } from "../cognition/durable.interpretation.shadow.configuration.v1";
import { observeStudentInterpretationShadowV1, type ShadowInterpretationEvidenceV1 } from "../cognition/conversational.interpretation.shadow.runtime.v1";
import { GCC4W_STUDENT_IDENTITY_V1, StudentConversationalInterpretationAdapterV1 } from "../cognition/student.conversational.interpretation.adapter.v1";
import { CONVERSATIONAL_INTERPRETATION_INVARIANTS_V1 } from "../cognition/conversational.cognition.contracts.v1";
import { replayInterpretationStudentShadowWindowV1 } from "../cognition/interpretation.student.shadow.promotion.v1";
import { anonymousVisionConversationRouteV1 } from "../anonymous.vision.conversation.route.v1";

const db=env.POLICIES_DB, wid="00000000-0000-4000-8000-000000000001", started="2026-09-13T00:00:00.000Z", ended="2026-09-13T01:00:00.000Z";
const result={version:1,interaction:"CONVERSATIONAL_CONTINUITY",resolution:"CLEAR",...CONVERSATIONAL_INTERPRETATION_INVARIANTS_V1} as const;
const configuration=()=>({POLICIES_DB:db,INTERPRETATION_STUDENT_SHADOW_STATE:"CONTROLLED_SHADOW",INTERPRETATION_STUDENT_SAMPLE_PERCENT:"100",INTERPRETATION_STUDENT_KILL_SWITCH:"false",INTERPRETATION_STUDENT_WINDOW_ID:wid,INTERPRETATION_STUDENT_ENDPOINT_REFERENCE:serving.endpoint_reference,INTERPRETATION_STUDENT_CREDENTIAL_REFERENCE:serving.credential_reference,INTERPRETATION_STUDENT_ENDPOINT:"https://student.test/v1/interpret",INTERPRETATION_STUDENT_AUTHORIZATION:"test-bearer-secret"});
const repository=()=>new Repository(db,wid);
async function start(){const repo=repository();await repo.start({window_id:wid,serving,policy_version:1,sample_percent:100,started_at:started});return repo;}
async function observation(id="request-1",change:Partial<ShadowInterpretationEvidenceV1>={}) {
  let evidence!:ShadowInterpretationEvidenceV1;
  const provider=new StudentConversationalInterpretationAdapterV1({endpoint:"https://student.test/v1/interpret",authorization:"test-bearer-secret",timeout_ms:1000,fetch:vi.fn(async()=>Response.json(result)) as never});
  await observeStudentInterpretationShadowV1({correlation_id:id,message:"requester-plaintext-sentinel",deterministic:result,provider,repository:{append:async value=>{evidence=value;}},timeout_ms:1000,now:()=>started,monotonic_now:()=>0});
  return {...evidence,...change};
}
beforeAll(async()=>applyD1Migrations(db,[{name:"0035",queries:migration.split(/;\s*\r?\n(?=CREATE (?:TABLE|INDEX|UNIQUE INDEX|TRIGGER))/).map(v=>v.trim()).filter(Boolean)}]));

describe("GCC-5D durable shadow foundation",()=>{
  it("uses the actual Core Worker and genuine waitUntil with durable metadata persistence",async()=>{
    const repo=await start(),ctx=createExecutionContext();
    const fetch=vi.spyOn(globalThis,"fetch").mockImplementation(async url=>String(url).endsWith("/v1/identity")?Response.json({...GCC4W_STUDENT_IDENTITY_V1,effective_dtype:"bf16",protocol_version:"PA_STUDENT_HTTP_V1"}):Response.json(result));
    try {
      const request=()=>new Request("https://core.test/conversation",{method:"POST",headers:{"cf-connecting-ip":crypto.randomUUID()},body:JSON.stringify({version:1,request_id:"worker-durable",message:"hello"})});
      const baseline=await worker.fetch(request(),{...env,INTERPRETATION_STUDENT_SHADOW_STATE:"DISABLED"},createExecutionContext());
      const live=await worker.fetch(request(),{...env,...configuration()},ctx);
      expect(await live.text()).toEqual(await baseline.text());await waitOnExecutionContext(ctx);
      expect(await repo.status(wid)).toMatchObject({completed:1,aggregates:{authority_granted:false,operational_truth_affected:false,lifecycle_mutated:false}});
      expect(fetch).toHaveBeenCalledTimes(2);
    } finally {fetch.mockRestore();}
  });
  it("rejects wrong protocol, model, revision, digest and dtype before inference",async()=>{
    for(const key of ["protocol_version","base_model","base_revision","adapter_digest","artifact_sha256","effective_dtype"]){
      const fetch=vi.fn(async(_url:RequestInfo|URL,_init?:RequestInit)=>Response.json({...GCC4W_STUDENT_IDENTITY_V1,effective_dtype:"bf16",protocol_version:"PA_STUDENT_HTTP_V1",[key]:"wrong"}));
      const adapter=new StudentConversationalInterpretationAdapterV1({endpoint:configuration().INTERPRETATION_STUDENT_ENDPOINT,authorization:"test-bearer-secret",timeout_ms:1000,verify_identity:true,protocol_version:"PA_STUDENT_HTTP_V1",fetch:fetch as never});
      await expect(adapter.interpret({} as never)).rejects.toMatchObject({code:"IDENTITY_MISMATCH"});expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch.mock.calls[0]?.[1]).toMatchObject({redirect:"error",headers:{authorization:"Bearer test-bearer-secret"}});
    }
  });
  it("preserves existing tables when applying and reapplying migration 0035",async()=>{
    await db.prepare("CREATE TABLE gcc5d_existing_fixture (id TEXT PRIMARY KEY)").run();await db.prepare("INSERT INTO gcc5d_existing_fixture VALUES ('preserved')").run();
    const queries=migration.split(/;\s*\r?\n(?=CREATE (?:TABLE|INDEX|UNIQUE INDEX|TRIGGER))/).map(v=>v.trim()).filter(Boolean);
    await db.batch(queries.map(sql=>db.prepare(sql)));
    expect(await db.prepare("SELECT id FROM gcc5d_existing_fixture").first()).toEqual({id:"preserved"});
  });
  it("blocks SQL REPLACE and UPSERT historical rewrites with recursive triggers off",async()=>{
    const repo=await start();await repo.reserve("request-1",true,100);await repo.append(await observation());
    await db.prepare("PRAGMA recursive_triggers=OFF").run();
    for(const table of ["interpretation_shadow_windows","interpretation_shadow_observations"])await expect(db.prepare(`INSERT OR REPLACE INTO ${table} SELECT * FROM ${table}`).run()).rejects.toThrow();
    await db.prepare("INSERT OR REPLACE INTO interpretation_shadow_admissions SELECT observation_id,window_id,0 FROM interpretation_shadow_admissions").run();
    expect(await repo.status(wid)).toMatchObject({total_eligible:1,sampled:1,completed:1});
    await expect(db.prepare("INSERT INTO interpretation_shadow_observations SELECT * FROM interpretation_shadow_observations WHERE true ON CONFLICT(observation_id) DO UPDATE SET observation_json='{}'").run()).rejects.toThrow();
    const frozen=await repo.close(wid,ended);
    await expect(db.prepare("INSERT OR REPLACE INTO interpretation_shadow_windows SELECT * FROM interpretation_shadow_windows").run()).rejects.toThrow();
    expect((await repository().status(wid))?.frozen_result).toEqual(frozen);
  });
  it("detects an append/admission racing close and retries without losing accepted metadata",async()=>{
    const repo=await start();await repo.reserve("first",true,100);await repo.append(await observation("first"));
    const racingDb={batch:db.batch.bind(db),prepare(sql:string){const statement=db.prepare(sql);if(!sql.startsWith("UPDATE interpretation_shadow_windows SET state='CLOSED'"))return statement;return {bind(...values:unknown[]){return {async run(){await repo.reserve("racing-admission",false,100);return statement.bind(...values).run();}};}};}} as unknown as D1Database;
    await expect(new Repository(racingDb,wid).close(wid,ended)).rejects.toThrow("SHADOW_WINDOW_CLOSE_CONFLICT");
    expect(await repo.canSchedule(wid)).toBe(true);expect(await repo.close(wid,ended)).toMatchObject({total_authoritative_eligible_requests:2,sampled_requests:1,completed_student_observations:1});
  });
  it("counts unsampled eligible admissions and rejects a changed sampling policy",async()=>{
    const repo=await start();expect(await repo.reserve("wrong-policy",true,50)).toBe(false);expect(await repo.reserve("unsampled",false,100)).toBe(true);
    await expect(repo.append(await observation("unsampled"))).rejects.toThrow();expect(await repo.status(wid)).toMatchObject({total_eligible:1,sampled:0,completed:0});
  });
  it("keeps missing, closed, disabled, malformed and killed windows out of Student calls",async()=>{
    const fetch=vi.fn(async()=>Response.json(result)),tasks:Promise<void>[]=[];
    const invoke=async(overrides={})=>anonymousVisionConversationRouteV1(new Request("https://core.test/conversation",{method:"POST",headers:{"cf-connecting-ip":crypto.randomUUID()},body:JSON.stringify({version:1,request_id:crypto.randomUUID(),message:"hello"})}),{...configuration(),...overrides},{fetch:fetch as never,wait_until:task=>tasks.push(task)});
    expect((await invoke()).status).toBe(200);await Promise.all(tasks);expect(fetch).not.toHaveBeenCalled();
    const repo=await start();
    for(const overrides of [{INTERPRETATION_STUDENT_SHADOW_STATE:"DISABLED"},{INTERPRETATION_STUDENT_KILL_SWITCH:"true"},{INTERPRETATION_STUDENT_WINDOW_ID:undefined},{INTERPRETATION_STUDENT_KILL_SWITCH:"malformed"}])expect((await invoke(overrides)).status).toBe(200);
    await repo.close(wid,ended);expect((await invoke()).status).toBe(200);await Promise.all(tasks);expect(fetch).not.toHaveBeenCalled();
  });
  it.each(["valid","identity-mismatch","unavailable","authority-violation"])("isolates %s provider from the live response and retains metadata only",async(mode)=>{
    const repo=await start(),tasks:Promise<void>[]=[],log=vi.spyOn(console,"log");
    const fetch=vi.fn(async(url:RequestInfo|URL)=>{if(mode==="unavailable")throw new Error("test-bearer-secret raw-model-input raw-model-output protected-content organization-source-data");if(String(url).endsWith("/v1/identity"))return Response.json({...GCC4W_STUDENT_IDENTITY_V1,effective_dtype:"bf16",protocol_version:"PA_STUDENT_HTTP_V1",...(mode==="identity-mismatch"?{candidate_id:"other"}:{})});return Response.json({...result,...(mode==="authority-violation"?{grants_authority:true,grants_execution:true,raw_completion:"raw-model-output"}:{})});});
    const request=()=>new Request("https://core.test/conversation",{method:"POST",headers:{"cf-connecting-ip":crypto.randomUUID()},body:JSON.stringify({version:1,request_id:"durable-route",message:"hello"})});
    const baseline=await anonymousVisionConversationRouteV1(request(),{},{});
    const live=await anonymousVisionConversationRouteV1(request(),configuration(),{fetch:fetch as never,wait_until:task=>tasks.push(task)});
    expect(await live.text()).toBe(await baseline.text());await Promise.all(tasks);
    const status=await repo.status(wid);expect(status?.completed).toBe(1);expect(status?.aggregates).toMatchObject({operational_truth_affected:false,authority_granted:false,lifecycle_mutated:false});
    if(mode!=="valid")expect(status?.aggregates.valid_contract_rate).toBe(0);
    if(mode==="identity-mismatch"||mode==="unavailable")expect(fetch).toHaveBeenCalledTimes(1);
    if(mode==="authority-violation")expect(status?.aggregates).toMatchObject({l1_failures:1,authority_grants:1,execution_grants:1});
    expect(log).not.toHaveBeenCalled();log.mockRestore();
    for(const marker of ["test-bearer-secret","raw-model-input","raw-model-output","protected-content","organization-source-data","https://student.test"])expect(JSON.stringify(status)).not.toContain(marker);
  });
  it("returns the primary response while durable admission remains unresolved",async()=>{
    let release!:(value:null)=>void;const pending=new Promise<null>(resolve=>{release=resolve;});
    const slowDb={prepare:()=>({bind:()=>({first:()=>pending})})} as unknown as D1Database;
    const tasks:Promise<void>[]=[],fetch=vi.fn();
    const response=await anonymousVisionConversationRouteV1(new Request("https://core.test/conversation",{method:"POST",headers:{"cf-connecting-ip":crypto.randomUUID()},body:JSON.stringify({version:1,request_id:"slow-db",message:"hello"})}),{...configuration(),POLICIES_DB:slowDb},{fetch:fetch as never,wait_until:task=>tasks.push(task)});
    expect(response.status).toBe(200);expect(fetch).not.toHaveBeenCalled();release(null);await Promise.all(tasks);
  });
  it("defaults disabled and rejects every malformed activation component",()=>{
    expect(resolveDurableShadowConfigurationV1({}).state).toBe("DISABLED");
    for(const [key,value] of Object.entries({INTERPRETATION_STUDENT_SHADOW_STATE:"PRIMARY",INTERPRETATION_STUDENT_SAMPLE_PERCENT:"NaN",INTERPRETATION_STUDENT_KILL_SWITCH:"FALSE",INTERPRETATION_STUDENT_WINDOW_ID:"",INTERPRETATION_STUDENT_ENDPOINT_REFERENCE:"https://secret.test",INTERPRETATION_STUDENT_CREDENTIAL_REFERENCE:"bearer",INTERPRETATION_STUDENT_TIMEOUT_MS:"Infinity",INTERPRETATION_STUDENT_ENDPOINT:"http://student.test/v1/interpret",INTERPRETATION_STUDENT_AUTHORIZATION:""})) expect(resolveDurableShadowConfigurationV1({...configuration(),[key]:value}).state).toBe("DISABLED");
    expect(resolveDurableShadowConfigurationV1(configuration()).state).toBe("CONTROLLED_SHADOW");
  });
  it("pins the entire serving contract and rejects secret-bearing extensions",()=>{
    expect(createQualifiedStudentServingReferenceV1(serving)).toEqual(serving);
    for(const key of Object.keys(serving)) expect(()=>createQualifiedStudentServingReferenceV1({...serving,[key]:"wrong"} as never)).toThrow();
    expect(()=>createQualifiedStudentServingReferenceV1({...serving,bearer:"secret"} as never)).toThrow();
  });
  it("starts only explicitly and preserves immutable pins through reconstruction",async()=>{
    expect(await repository().status(wid)).toBeUndefined();const repo=await start();
    expect(await repository().status(wid)).toMatchObject({state:"OPEN",serving,policy_version:1});
    await expect(repo.start({window_id:wid,serving,policy_version:1,sample_percent:100,started_at:started})).rejects.toThrow();
    for(const [column,value] of [["candidate_id","wrong"],["artifact_sha256","wrong"],["policy_version",2],["sample_percent",50],["started_at",ended],["serving_json","{}"]]) await expect(db.prepare(`UPDATE interpretation_shadow_windows SET ${column}=? WHERE window_id=?`).bind(value,wid).run()).rejects.toThrow();
  });
  it("persists once, counts admission atomically, and rejects duplicate completion after restart",async()=>{
    const repo=await start();expect(await repo.reserve("request-1",true,100)).toBe(true);await repo.append(await observation());
    expect(await repository().reserve("request-1",true,100)).toBe(false);await expect(repository().append(await observation())).rejects.toThrow();
    expect(await repo.status(wid)).toMatchObject({total_eligible:1,sampled:1,completed:1,aggregates:{provider_reliability_rate:1,valid_contract_rate:1,sufficient_coverage:false}});
  });
  it("rejects unreserved, wrong-candidate, invalid-enum and false identity-success observations",async()=>{
    const repo=await start();await expect(repo.append(await observation())).rejects.toThrow();await repo.reserve("request-1",true,100);
    for(const change of [{candidate_identity:{...GCC4W_STUDENT_IDENTITY_V1,candidate_id:"other"}},{failure_class:"IDENTITY_MISMATCH"},{deterministic_interaction:"raw-protected-content"},{shadow_latency_ms:NaN}]) await expect(repo.append(await observation("request-1",change as never))).rejects.toThrow();
    expect((await repo.status(wid))?.completed).toBe(0);
  });
  it("freezes close, replays persisted metadata deterministically and forbids late writes",async()=>{
    const repo=await start();await repo.reserve("request-1",true,100);await repo.append(await observation());
    const rows=await db.prepare("SELECT observation_json FROM interpretation_shadow_observations").all<{observation_json:string}>();
    const replay=replayInterpretationStudentShadowWindowV1({window_id:wid,started_at:started,ended_at:ended,total_authoritative_eligible_requests:1,sampled_requests:1,observations:rows.results.map(v=>({window_id:wid,observation:JSON.parse(v.observation_json)}))});
    expect(await repo.close(wid,ended)).toEqual(replay);expect((await repository().status(wid))?.frozen_result).toEqual(replay);
    expect(await repository().reserve("late",true,100)).toBe(false);await expect(repo.append(await observation("late"))).rejects.toThrow();await expect(repo.close(wid,ended)).rejects.toThrow();
    for(const sql of ["UPDATE interpretation_shadow_windows SET state='OPEN'","UPDATE interpretation_shadow_windows SET frozen_result_json='{}'","DELETE FROM interpretation_shadow_windows","UPDATE interpretation_shadow_observations SET observation_json='{}'","DELETE FROM interpretation_shadow_observations"]) await expect(db.prepare(sql).run()).rejects.toThrow();
  });
  it("never persists requester IDs, plaintext, nested extras, credentials or raw payloads",async()=>{
    const repo=await start(),secret="requester-plaintext-sentinel";await repo.reserve(secret,true,100);
    await repo.append(await observation(secret,{raw_prompt:secret,raw_completion:secret,protected_content:secret,organization_data:secret,Authorization:"test-bearer-secret",candidate_identity:{...GCC4W_STUDENT_IDENTITY_V1,endpoint:"https://secret.test"}} as never));
    const dump=JSON.stringify(await db.batch([db.prepare("SELECT * FROM interpretation_shadow_windows"),db.prepare("SELECT * FROM interpretation_shadow_admissions"),db.prepare("SELECT * FROM interpretation_shadow_observations")]));
    for(const value of [secret,"test-bearer-secret","https://secret.test","raw_prompt","raw_completion","protected_content","organization_data",'"Authorization"']) expect(dump).not.toContain(value);
    expect((await repo.status(wid))?.aggregates.observation_ids).toEqual([await shadowObservationIdV1(secret)]);
  });
});
