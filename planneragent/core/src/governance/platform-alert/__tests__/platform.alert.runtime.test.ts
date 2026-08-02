import { describe, expect, it } from "vitest";
import { deepCopyAndFreeze } from "../../knowledge-exposure/knowledge.projection.guard.v1";
import {
  PLATFORM_ALERT_POLICY_ID, PLATFORM_ALERT_POLICY_VERSION, PLATFORM_OWNER_ID,
  type PlatformAlertAdmissionRequestV1, type PlatformAlertAuditEventV1,
  type PlatformAlertRepositoryV1, type PlatformOperationalAlertIntentV1,
  type VerifiedPlatformAlertSourceV1,
} from "../platform.alert.contracts.v1";
import { platformAlertSourceDigestV1 } from "../platform.alert.policy.v1";
import { PlatformAlertAdmissionRuntimeV1 } from "../platform.alert.runtime.v1";

const NOW = "2026-08-02T10:01:00.000Z";
function source(overrides: Partial<VerifiedPlatformAlertSourceV1> = {}): VerifiedPlatformAlertSourceV1 {
  const base = {source_class:"WU4C_TWILIO_DELIVERY" as const,source_evidence_id:"twilio-evidence:failed",source_outcome:"FAILED" as const,occurred_at:"2026-08-02T10:00:40.000Z",failure_code:"GOVERNED_TWILIO_PROVIDER_FAILURE",tenant_reference_digest:"a".repeat(64),company_reference_digest:"b".repeat(64),correlation_id:"correlation:platform-alert",causal_references:["audit:delivery"]};
  const merged = {...base,...overrides};
  const {source_evidence_digest:_,...subject} = merged as VerifiedPlatformAlertSourceV1;
  return deepCopyAndFreeze({...subject,source_evidence_digest:overrides.source_evidence_digest ?? platformAlertSourceDigestV1(subject)}) as VerifiedPlatformAlertSourceV1;
}
function request(value=source(), overrides: Partial<PlatformAlertAdmissionRequestV1> = {}): PlatformAlertAdmissionRequestV1 {
  return deepCopyAndFreeze({version:1,source_class:value.source_class,source_evidence_id:value.source_evidence_id,source_evidence_digest:value.source_evidence_digest,platform_owner_id:PLATFORM_OWNER_ID,communication_family:"PLATFORM_OPERATIONAL_ALERT",purpose:"GOVERNED_DELIVERY_REVIEW",policy_id:PLATFORM_ALERT_POLICY_ID,policy_version:PLATFORM_ALERT_POLICY_VERSION,requested_at:NOW,correlation_id:value.correlation_id,causal_references:[value.source_evidence_id,...value.causal_references],...overrides}) as PlatformAlertAdmissionRequestV1;
}
class Repository implements PlatformAlertRepositoryV1 {
  intents = new Map<string,PlatformOperationalAlertIntentV1>(); audits:PlatformAlertAuditEventV1[]=[]; suppressions:string[]=[];
  async persistAdmission(intent:PlatformOperationalAlertIntentV1){if(this.intents.has(intent.deduplication_id))return "EXISTING" as const;this.intents.set(intent.deduplication_id,intent);return "CREATED" as const;}
  async findByDeduplicationId(id:string){return this.intents.get(id)??null;}
  async suppress(id:string){this.suppressions.push(id);}
  async audit(event:PlatformAlertAuditEventV1){this.audits.push(event);}
}
function runtime(value:VerifiedPlatformAlertSourceV1|null=source(), repository=new Repository()) { return {repository,runtime:new PlatformAlertAdmissionRuntimeV1({source:{resolve:async()=>value},repository})}; }

describe("PA-WU1 platform alert intent and admission",()=>{
  it.each([
    source({source_class:"WU4B_EMAIL_DELIVERY",source_evidence_id:"email-evidence:failed",failure_code:"EMAIL_PROVIDER_FAILURE"}),
    source(),
    source({source_outcome:"INDETERMINATE",failure_code:"GOVERNED_TWILIO_TIMEOUT"}),
  ])("admits supported durable $source_class $source_outcome evidence",async value=>{const x=runtime(value);await expect(x.runtime.admit(request(value))).resolves.toMatchObject({status:"ADMITTED",content_returned:false});});
  it("denies missing evidence and caller-only events",async()=>{await expect(runtime(null).runtime.admit(request())).rejects.toMatchObject({code:"PLATFORM_ALERT_SOURCE_NOT_FOUND"});});
  it("denies unsupported source classes",async()=>{await expect(runtime().runtime.admit(request(source(),{source_class:"RUNTIME_ERROR" as any}))).rejects.toMatchObject({code:"PLATFORM_ALERT_SOURCE_UNSUPPORTED"});});
  it("denies source identity and digest substitution",async()=>{const value=source();for(const overrides of [{source_evidence_id:"other"},{source_evidence_digest:"f".repeat(64)}])await expect(runtime(value).runtime.admit(request(value,overrides as any))).rejects.toMatchObject({code:"PLATFORM_ALERT_SOURCE_SUBSTITUTED"});});
  it("denies raw provider responses and tenant payloads",async()=>{const value=source();for(const extra of [{raw_provider_response:"secret"},{tenant_operational_payload:{order:"42"}}])await expect(runtime(value).runtime.admit(deepCopyAndFreeze({...request(value),...extra}) as any)).rejects.toMatchObject({code:"PLATFORM_ALERT_SOURCE_CONTENT_PROHIBITED"});});
  it("builds deterministic deeply immutable identities and keeps outcome separate from urgency",async()=>{const value=source({source_outcome:"INDETERMINATE",failure_code:"GOVERNED_TWILIO_TIMEOUT"}),a=(await runtime(value).runtime.admit(request(value))).intent,b=(await runtime(value).runtime.admit(request(value))).intent;expect(a.alert_id).toBe(b.alert_id);expect(a.deduplication_id).toBe(b.deduplication_id);expect(a).toMatchObject({communication_family:"PLATFORM_OPERATIONAL_ALERT",platform_owner_id:PLATFORM_OWNER_ID,source_outcome:"INDETERMINATE",review_urgency:"URGENT_REVIEW",acknowledgement_required:true});expect(Object.isFrozen(a)).toBe(true);expect(Object.isFrozen(a.projection_manifest)).toBe(true);});
  it("contains no transport, recipient, credential, provider, or special organizational actor",async()=>{const intent=(await runtime().runtime.admit(request())).intent,text=JSON.stringify(intent);expect(text).not.toMatch(/recipient|endpoint|email_address|phone|credential|auth_token|provider_identity|founder|CEO/i);});
  it("denies success, unknown purpose, policy, owner, family, mutable input, and expiry",async()=>{
    const cases:[VerifiedPlatformAlertSourceV1,any,string][]=[
      [source({source_outcome:"SUCCEEDED" as any}),{},"PLATFORM_ALERT_OUTCOME_UNSUPPORTED"],
      [source(),{purpose:"OTHER"},"PLATFORM_ALERT_PURPOSE_INVALID"],
      [source(),{policy_version:"V2"},"PLATFORM_ALERT_POLICY_INVALID"],
      [source(),{policy_id:"OTHER"},"PLATFORM_ALERT_POLICY_SUBSTITUTED"],
      [source(),{platform_owner_id:"tenant:1"},"PLATFORM_ALERT_OWNER_MISMATCH"],
      [source(),{communication_family:"TENANT_OPERATIONAL_DISCLOSURE"},"PLATFORM_ALERT_FAMILY_MISMATCH"],
      [source({occurred_at:"2026-08-01T09:00:00.000Z"}),{},"PLATFORM_ALERT_EXPIRED"],
    ];
    for(const [value,overrides,code] of cases)await expect(runtime(value).runtime.admit(request(value,overrides))).rejects.toMatchObject({code});
    await expect(runtime().runtime.admit({...request()} as any)).rejects.toMatchObject({code:"PLATFORM_ALERT_REQUEST_INVALID"});
  });
  it("admits once and durably suppresses sequential and concurrent duplicates",async()=>{const value=source(),repository=new Repository(),admission=new PlatformAlertAdmissionRuntimeV1({source:{resolve:async()=>value},repository}),input=request(value);const results=await Promise.all([admission.admit(input),admission.admit(input)]);expect(results.map(x=>x.status).sort()).toEqual(["ADMITTED","SUPPRESSED"]);expect(repository.intents).toHaveLength(1);expect(repository.suppressions).toHaveLength(1);await expect(admission.admit(input)).resolves.toMatchObject({status:"SUPPRESSED",intent:{alert_id:results[0]!.intent.alert_id}});expect(repository.audits.map(x=>x.event_kind)).toEqual(expect.arrayContaining(["ADMITTED","DUPLICATE_DETECTED","SUPPRESSED"]));});
  it("uses distinct identities for distinct durable events",async()=>{const a=source(),b=source({source_evidence_id:"twilio-evidence:other"}),ra=(await runtime(a).runtime.admit(request(a))).intent,rb=(await runtime(b).runtime.admit(request(b))).intent;expect(a.source_evidence_digest).not.toBe(b.source_evidence_digest);expect(ra.alert_id).not.toBe(rb.alert_id);expect(ra.deduplication_id).not.toBe(rb.deduplication_id);});
  it("persists sanitized denial evidence",async()=>{const x=runtime(null);await expect(x.runtime.admit(request())).rejects.toBeDefined();expect(x.repository.audits).toContainEqual(expect.objectContaining({event_kind:"DENIED",reason_code:"PLATFORM_ALERT_SOURCE_NOT_FOUND"}));expect(JSON.stringify(x.repository.audits)).not.toMatch(/message|endpoint|credential|provider_response/i);});
});
