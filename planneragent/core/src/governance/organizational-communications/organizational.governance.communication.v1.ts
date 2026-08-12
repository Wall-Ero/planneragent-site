import { createHash } from 'node:crypto';
import { deepCopyAndFreeze } from '../knowledge-exposure/knowledge.projection.guard.v1';
import { governanceIndicatorAggregateDigestV1, governanceIndicatorDigestV1, type GovernanceIndicatorAggregateV1, type GovernanceIndicatorV1 } from '../indicators';
import { OrganizationalGovernanceCommunicationFailureV1, type CreateOrganizationalGovernanceCommunicationInputV1, type OrganizationalGovernanceCommunicationDecisionV1, type OrganizationalGovernanceCommunicationReasonCodeV1, type OrganizationalGovernanceCommunicationSemanticV1, type OrganizationalGovernanceCommunicationSourceV1, type OrganizationalGovernanceCommunicationV1 } from './organizational.governance.communication.contracts.v1';

const hash=(x:unknown)=>createHash('sha256').update(JSON.stringify(x),'utf8').digest('hex');
const prefixes:Readonly<Record<string,string>>=Object.freeze({AUTHORITY_INTEGRITY:'AUTHORITY',PROVIDER_TRUST:'PROVIDER_TRUST',SECURITY_EVIDENCE_COMPOSITION:'SECURITY_EVIDENCE',KNOWLEDGE_EXPOSURE_GOVERNANCE:'KNOWLEDGE_EXPOSURE',RUNTIME_SECURITY_EVIDENCE:'RUNTIME_SECURITY',GOVERNANCE_EVIDENCE_COMPLETENESS:'GOVERNANCE_EVIDENCE'});
export const organizationalGovernanceCommunicationDigestV1=(x:OrganizationalGovernanceCommunicationSemanticV1)=>hash(canonical(x));

export function createOrganizationalGovernanceCommunicationV1(input:CreateOrganizationalGovernanceCommunicationInputV1):OrganizationalGovernanceCommunicationDecisionV1{
	if(!input?.source||!input.subject_type||!input.subject_id||!input.generated_at)fail('GOVERNANCE_COMMUNICATION_IDENTITY_INVALID');
	const aggregate='aggregate_id'in input.source, source=input.source;
	const actualId=aggregate?(source as GovernanceIndicatorAggregateV1).aggregate_id:(source as GovernanceIndicatorV1).indicator_id,actualDigest=aggregate?(source as GovernanceIndicatorAggregateV1).aggregate_digest:(source as GovernanceIndicatorV1).indicator_digest;
	if(actualId!==input.expected_source_id)fail('GOVERNANCE_COMMUNICATION_SOURCE_IDENTITY_MISMATCH');
	if(actualDigest!==input.expected_source_digest)fail('GOVERNANCE_COMMUNICATION_SOURCE_DIGEST_MISMATCH');
	if(aggregate){const{aggregate_id:_,aggregate_digest:__,...semantic}=source as GovernanceIndicatorAggregateV1;if(governanceIndicatorAggregateDigestV1(semantic)!==actualDigest)fail('GOVERNANCE_COMMUNICATION_SOURCE_INVALID');}
	else{const{indicator_id:_,indicator_digest:__,...semantic}=source as GovernanceIndicatorV1;if(governanceIndicatorDigestV1(semantic)!==actualDigest)fail('GOVERNANCE_COMMUNICATION_SOURCE_INVALID');}
	if(source.tenant_id!==input.tenant_id)fail('GOVERNANCE_COMMUNICATION_TENANT_MISMATCH');if(source.company_id!==input.company_id)fail('GOVERNANCE_COMMUNICATION_COMPANY_MISMATCH');
	if(source.subject_type!==input.subject_type||source.subject_id!==input.subject_id)fail('GOVERNANCE_COMMUNICATION_SUBJECT_MISMATCH');if(source.historical_mode!==input.historical_mode)fail('GOVERNANCE_COMMUNICATION_HISTORICAL_MODE_MISMATCH');
	const type=aggregate?'GOVERNANCE_EVIDENCE_COMPLETENESS':(source as GovernanceIndicatorV1).indicator_type,prefix=prefixes[type];if(!prefix)fail('GOVERNANCE_COMMUNICATION_SOURCE_UNSUPPORTED');
	const contributor_references=aggregate?(source as GovernanceIndicatorAggregateV1).contributors.map(x=>({indicator_id:x.indicator_id,indicator_digest:x.indicator_digest,status:x.status})):[];
	const reference:OrganizationalGovernanceCommunicationSourceV1={source_kind:aggregate?'AGGREGATE':'INDICATOR',source_id:actualId,source_digest:actualDigest,indicator_type:type as any,status:source.status,contributor_references};
	if(source.status==='NOT_APPLICABLE')return deepCopyAndFreeze({version:1 as const,decision:'NO_COMMUNICATION_REQUIRED' as const,source:reference,reason_code:'SOURCE_NOT_APPLICABLE' as const});
	if(source.status==='DEGRADED')fail('GOVERNANCE_COMMUNICATION_MAPPING_UNSUPPORTED');
	const classification=source.status==='HEALTHY'?'INFORMATIONAL':source.status==='DENIED'?'BLOCKING':'ATTENTION_REQUIRED',attention_requirement=source.status==='HEALTHY'?'NO_ACTION':'REVIEW',blocking=source.status==='DENIED';
	const reason_codes=[`${prefix}_${source.status}` as OrganizationalGovernanceCommunicationReasonCodeV1];
	const semantic=canonical({version:1,communication_type:'GOVERNANCE_STATE',subject_type:input.subject_type,subject_id:input.subject_id,...(input.tenant_id?{tenant_id:input.tenant_id}:{}),...(input.company_id?{company_id:input.company_id}:{}),source:reference,source_status:source.status,classification,attention_requirement,blocking,reason_codes,historical_mode:input.historical_mode,generated_at:input.generated_at,causal_lineage:[...input.causal_lineage],provenance_references:[actualId,...contributor_references.map(x=>x.indicator_id)]});
	const communication_digest=organizationalGovernanceCommunicationDigestV1(semantic),communication=deepCopyAndFreeze({...semantic,communication_id:`organizational-governance-communication:sha256:${communication_digest}`,communication_digest}) as OrganizationalGovernanceCommunicationV1;
	return deepCopyAndFreeze({version:1,decision:'COMMUNICATION_GENERATED',source:reference,communication});
}
function canonical(x:OrganizationalGovernanceCommunicationSemanticV1):OrganizationalGovernanceCommunicationSemanticV1{return{...x,source:{...x.source,contributor_references:[...x.source.contributor_references].sort((a,b)=>a.indicator_id.localeCompare(b.indicator_id))},reason_codes:[...new Set(x.reason_codes)].sort(),causal_lineage:[...new Set(x.causal_lineage)].sort(),provenance_references:[...new Set(x.provenance_references)].sort()};}
function fail(code:ConstructorParameters<typeof OrganizationalGovernanceCommunicationFailureV1>[0]):never{throw new OrganizationalGovernanceCommunicationFailureV1(code);}
