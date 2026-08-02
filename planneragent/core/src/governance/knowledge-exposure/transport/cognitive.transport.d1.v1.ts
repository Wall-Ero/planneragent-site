import type { CognitiveProviderV1,CognitiveTransportEvidenceRepositoryV1,CognitiveTransportEvidenceV1 } from "./cognitive.transport.contracts.v1";
import { CognitiveTransportError } from "./cognitive.transport.contracts.v1";
export class D1CognitiveTransportEvidenceRepositoryV1 implements CognitiveTransportEvidenceRepositoryV1{
 constructor(private readonly db:D1Database){}
 async reserve(id:string,provider:CognitiveProviderV1,at:string){try{await this.db.prepare("INSERT INTO cognitive_transport_dispatch_reservations VALUES (?,?,?)").bind(id,provider,at).run();return true;}catch{return false;}}
 async append(e:CognitiveTransportEvidenceV1){try{await this.db.prepare("INSERT INTO cognitive_transport_evidence VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(e.evidence_id,e.decision_id,e.binding_id,e.consumption_id,e.projection_digest,e.request_digest,e.provider,e.model,e.provider_deployment_class,e.purpose,e.region,e.retention,e.dispatched_at,e.status,e.response_digest??null,e.failure_code??null,JSON.stringify(e.causal_references)).run();}catch{throw new CognitiveTransportError("COGNITIVE_TRANSPORT_EVIDENCE_FAILED");}}
}
