import {createHash,randomUUID} from "node:crypto";
import {deepCopyAndFreeze} from "../../knowledge-exposure/knowledge.projection.guard.v1";
import {PLATFORM_ALERT_DISCLOSURE_MANIFEST_ID,PLATFORM_ALERT_DISCLOSURE_PROFILE_VERSION} from "../disclosure";
import {PLATFORM_ALERT_DELIVERY_POLICY_VERSION,PlatformAlertDeliveryError,type PlatformAlertDeliveryDependenciesV1,type PlatformAlertDeliveryEvidenceV1,type PlatformAlertDeliveryFailureCode,type PlatformAlertDeliveryRequestV1,type PlatformAlertDeliveryResultV1} from "./platform.alert.delivery.contracts.v1";

const hash=(value:string)=>createHash("sha256").update(value,"utf8").digest("hex"),E164=/^\+[1-9]\d{7,14}$/,WA=/^whatsapp:\+[1-9]\d{7,14}$/;
function canonical(value:unknown):string{if(value===null||typeof value==="boolean"||typeof value==="string")return JSON.stringify(value);if(typeof value==="number"&&Number.isFinite(value))return JSON.stringify(value);if(Array.isArray(value))return`[${value.map(canonical).join(",")}]`;if(value&&typeof value==="object")return`{${Object.keys(value as object).sort().map(k=>`${JSON.stringify(k)}:${canonical((value as Record<string,unknown>)[k])}`).join(",")}}`;throw new PlatformAlertDeliveryError("PLATFORM_ALERT_DELIVERY_ELIGIBILITY_INVALID");}

export class PlatformAlertDeliveryRuntimeV1{
 constructor(private readonly d:PlatformAlertDeliveryDependenciesV1){}
 async deliver(request:PlatformAlertDeliveryRequestV1):Promise<PlatformAlertDeliveryResultV1>{
  const e=request?.eligibility,at=this.d.now();
  if(!e||!Object.isFrozen(e)||e.transport_executed!==false||!e.disclosure_consumption_id)throw new PlatformAlertDeliveryError("PLATFORM_ALERT_DELIVERY_ELIGIBILITY_REQUIRED");
  if(e.profile_version!==PLATFORM_ALERT_DISCLOSURE_PROFILE_VERSION||e.manifest_id!==PLATFORM_ALERT_DISCLOSURE_MANIFEST_ID||e.family!=="PLATFORM_OPERATIONAL_ALERT"||e.purpose!=="GOVERNED_DELIVERY_REVIEW"||e.representation!=="STRUCTURED_JSON"||e.classification!=="INTERNAL"||e.sovereignty!=="TENANT_LOCAL"||e.retention!=="NO_RETENTION")throw new PlatformAlertDeliveryError("PLATFORM_ALERT_DELIVERY_ELIGIBILITY_INVALID");
  if(Date.parse(e.expires_at)<=Date.parse(at))throw new PlatformAlertDeliveryError("PLATFORM_ALERT_DELIVERY_EXPIRED");
  const endpoint=await this.d.endpoints.readBound(e.endpoint_id);
  if(!endpoint)throw new PlatformAlertDeliveryError("PLATFORM_ALERT_DELIVERY_ENDPOINT_NOT_FOUND");
  if(endpoint.endpoint_id!==e.endpoint_id||endpoint.entitlement_id!==e.recipient_entitlement_id||endpoint.actor_id!==e.accountable_actor_id||endpoint.destination_digest!==e.endpoint_destination_digest||hash(endpoint.normalized_destination)!==e.endpoint_destination_digest)throw new PlatformAlertDeliveryError("PLATFORM_ALERT_DELIVERY_ENDPOINT_SUBSTITUTED");
  if(endpoint.channel!==e.channel)throw new PlatformAlertDeliveryError("PLATFORM_ALERT_DELIVERY_CHANNEL_MISMATCH");
  const payload=canonical(e.projection),payloadDigest=hash(payload);
  if(!await this.d.evidence.reserve(e.disclosure_consumption_id,e.endpoint_id,e.channel,at))throw new PlatformAlertDeliveryError("PLATFORM_ALERT_DELIVERY_ALREADY_ATTEMPTED");
  let identity="",reference:string|undefined;
  try{
   if(e.channel==="EMAIL"){
    const transport=this.d.transports.email;if(!transport)throw new PlatformAlertDeliveryError("PLATFORM_ALERT_DELIVERY_TRANSPORT_UNAVAILABLE");identity=transport.provider_id;
    const result=await transport.send({to:endpoint.normalized_destination,subject:"PlannerAgent platform operational alert",body:payload,content_type:"application/json; charset=utf-8"});if(!result.ok)throw new PlatformAlertDeliveryError("PLATFORM_ALERT_DELIVERY_TRANSPORT_FAILED");reference=result.provider_message_reference;
   }else{
    const transport=e.channel==="SMS"?this.d.transports.sms:this.d.transports.whatsapp;if(!transport)throw new PlatformAlertDeliveryError("PLATFORM_ALERT_DELIVERY_TRANSPORT_UNAVAILABLE");const expected=e.channel==="SMS"?"TWILIO_SMS":"TWILIO_WHATSAPP";
    if(transport.binding.provider_identity!=="twilio"||transport.binding.product!==expected)throw new PlatformAlertDeliveryError("PLATFORM_ALERT_DELIVERY_CHANNEL_MISMATCH");
    if((e.channel==="SMS"&&!E164.test(endpoint.normalized_destination))||(e.channel==="WHATSAPP"&&!WA.test(endpoint.normalized_destination)))throw new PlatformAlertDeliveryError("PLATFORM_ALERT_DELIVERY_ENDPOINT_SUBSTITUTED");
    const bytes=new TextEncoder().encode(payload).byteLength;if((e.channel==="SMS"&&(payload.length>70||bytes>280))||(e.channel==="WHATSAPP"&&bytes>4096))throw new PlatformAlertDeliveryError("PLATFORM_ALERT_DELIVERY_PAYLOAD_TOO_LARGE");
    identity=`twilio:${expected}`;reference=(await transport.send({channel:e.channel,product:expected,destination:endpoint.normalized_destination,message:payload,sender_identity_reference:transport.binding.sender_identity_reference})).provider_message_reference;
   }
   const evidence=this.record(e,at,payloadDigest,identity,"SUCCEEDED",undefined,reference);await this.append(evidence);return deepCopyAndFreeze({version:1,status:"SUCCEEDED",evidence,content_returned:false}) as PlatformAlertDeliveryResultV1;
  }catch(error){const transportCode=(error as {code?:unknown})?.code,code=error instanceof PlatformAlertDeliveryError?error.code:transportCode==="GOVERNED_TWILIO_TIMEOUT"?"PLATFORM_ALERT_DELIVERY_INDETERMINATE":"PLATFORM_ALERT_DELIVERY_TRANSPORT_FAILED",status=code==="PLATFORM_ALERT_DELIVERY_INDETERMINATE"?"INDETERMINATE" as const:"FAILED" as const,evidence=this.record(e,at,payloadDigest,identity||this.identity(e.channel),status,code);await this.append(evidence);throw new PlatformAlertDeliveryError(code);}
 }
 private identity(channel:string){return channel==="EMAIL"?(this.d.transports.email?.provider_id??"email:unavailable"):`twilio:${channel==="SMS"?"TWILIO_SMS":"TWILIO_WHATSAPP"}`;}
 private record(e:PlatformAlertDeliveryRequestV1["eligibility"],at:string,payload:string,identity:string,status:"SUCCEEDED"|"FAILED"|"INDETERMINATE",failure?:PlatformAlertDeliveryFailureCode,reference?:string):PlatformAlertDeliveryEvidenceV1{return deepCopyAndFreeze({version:1,evidence_id:`platform-alert-delivery-evidence:${randomUUID()}`,disclosure_id:e.disclosure_id,disclosure_consumption_id:e.disclosure_consumption_id,alert_id:e.alert_id,endpoint_id:e.endpoint_id,endpoint_destination_digest:e.endpoint_destination_digest,channel:e.channel,projection_digest:e.projection_digest,payload_digest:payload,transport_identity:identity,dispatched_at:at,status,...(failure?{failure_code:failure}:{}),...(reference?{provider_message_reference_digest:hash(reference)}:{}),policy_version:PLATFORM_ALERT_DELIVERY_POLICY_VERSION,correlation_id:e.correlation_id,causal_references:[...e.causal_references,e.disclosure_id,e.disclosure_consumption_id].sort()}) as PlatformAlertDeliveryEvidenceV1;}
 private async append(evidence:PlatformAlertDeliveryEvidenceV1){try{await this.d.evidence.append(evidence);}catch{throw new PlatformAlertDeliveryError("PLATFORM_ALERT_DELIVERY_EVIDENCE_FAILED");}}
}
