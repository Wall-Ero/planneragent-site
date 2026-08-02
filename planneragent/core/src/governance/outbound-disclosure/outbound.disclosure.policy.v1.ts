import { createHash } from "node:crypto";
import { deepCopyAndFreeze } from "../knowledge-exposure/knowledge.projection.guard.v1";
import { OUTBOUND_DISCLOSURE_POLICY_VERSION,OutboundDisclosureError,type OutboundDisclosureAdmissionRequestV1,type OutboundDisclosureAdmissionV1,type OutboundDisclosureFailureCode } from "./outbound.disclosure.contracts.v1";
const TEXT=/^[A-Za-z0-9][A-Za-z0-9:._/@-]{0,255}$/,HEX=/^[0-9a-f]{64}$/,TIME=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const digest=(v:unknown)=>createHash("sha256").update(JSON.stringify(v),"utf8").digest("hex");
const validTime=(v:unknown):v is string=>typeof v==="string"&&TIME.test(v)&&new Date(v).toISOString()===v;
export function buildOutboundDisclosureAdmissionV1(unsafe:OutboundDisclosureAdmissionRequestV1,now:string=unsafe?.requested_at):OutboundDisclosureAdmissionV1{
 const r=deepCopyAndFreeze(unsafe) as OutboundDisclosureAdmissionRequestV1,e=r?.eligibility,failures=new Set<OutboundDisclosureFailureCode>();
 if(!r||r.version!==1||!validTime(now)||!validTime(r.requested_at)||!validTime(r.expires_at)||Date.parse(r.expires_at)<=Date.parse(now)||!TEXT.test(r.correlation_id??"")||!Array.isArray(r.causal_references)||!Array.isArray(r.governance_references))failures.add("DISCLOSURE_REQUEST_INVALID");
 if(!e||e.version!==1||e.operation!=="OUTBOUND_DISCLOSURE"||!TEXT.test(e.decision_id??"")||!TEXT.test(e.binding_id??"")||!TEXT.test(e.consumption_id??"")||!HEX.test(e.projection_digest??""))failures.add("DISCLOSURE_ELIGIBILITY_INVALID");
 if(e?.purpose!=="CUSTOMER_QUOTATION_DISCLOSURE")failures.add("DISCLOSURE_PURPOSE_NOT_ADMITTED");
 if(!TEXT.test(r.authority_reference??""))failures.add("DISCLOSURE_REQUEST_INVALID");
 if(r.communication_family!=="TENANT_OPERATIONAL_DISCLOSURE")failures.add("DISCLOSURE_FAMILY_NOT_ADMITTED");
 if(!r.recipient||r.recipient.version!==1||r.recipient.recipient_class!=="AUTHORIZED_BUSINESS_RECIPIENT"||!TEXT.test(r.recipient.recipient_id??"")||!TEXT.test(r.recipient.entitlement_reference??""))failures.add("DISCLOSURE_RECIPIENT_INVALID");
 if(r.recipient?.tenant_id!==e?.tenant_id||r.recipient?.company_id!==e?.company_id)failures.add("DISCLOSURE_OWNER_SUBSTITUTED");
 if(r.recipient?.recipient_id!==e?.target_identity||e?.target_class!=="AUTHORIZED_BUSINESS_RECIPIENT")failures.add("DISCLOSURE_RECIPIENT_SUBSTITUTED");
 if(!(["EMAIL","SMS","WHATSAPP","WEBHOOK"] as const).includes(r.channel))failures.add("DISCLOSURE_CHANNEL_NOT_ADMITTED");
 if(!(["STRUCTURED_JSON","PLAIN_TEXT","GENERATED_DOCUMENT"] as const).includes(r.representation))failures.add("DISCLOSURE_REQUEST_INVALID");
 if(!(["PUBLIC","INTERNAL","SENSITIVE","CRITICAL","CONSTITUTIONAL"] as const).includes(r.classification))failures.add("DISCLOSURE_REQUEST_INVALID");
 if(failures.size)throw new OutboundDisclosureError([...failures].sort()[0]!);
 const subject={decision_id:e.decision_id,binding_id:e.binding_id,knowledge_consumption_id:e.consumption_id,authority_reference:r.authority_reference,governance_references:[...r.governance_references].sort(),tenant_id:e.tenant_id,company_id:e.company_id,purpose:e.purpose,communication_family:r.communication_family,manifest_id:e.manifest_id,projection_digest:e.projection_digest,recipient:r.recipient,channel:r.channel,representation:r.representation,classification:r.classification,policy_version:OUTBOUND_DISCLOSURE_POLICY_VERSION,admitted_at:now,expires_at:r.expires_at,correlation_id:r.correlation_id,causal_references:r.causal_references};
 const disclosure_id=`outbound-disclosure:sha256:${digest(subject)}`,canonical_digest=digest({...subject,disclosure_id});return deepCopyAndFreeze({version:1,disclosure_id,...subject,canonical_digest}) as OutboundDisclosureAdmissionV1;
}
