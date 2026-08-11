import { createHash } from 'node:crypto';
import { deepCopyAndFreeze } from '../knowledge-exposure/knowledge.projection.guard.v1';
import { governanceIndicatorDigestV1 } from './governance.indicator.v1';
import { GovernanceIndicatorAggregateFailureV1, type CreateGovernanceIndicatorAggregateInputV1, type GovernanceIndicatorAggregateSemanticV1, type GovernanceIndicatorAggregateV1 } from './governance.indicator.aggregate.contracts.v1';

const hash=(x:unknown)=>createHash('sha256').update(JSON.stringify(x),'utf8').digest('hex');
export const governanceIndicatorAggregateDigestV1=(x:GovernanceIndicatorAggregateSemanticV1)=>hash(canonical(x));
export function createGovernanceIndicatorAggregateV1(input:CreateGovernanceIndicatorAggregateInputV1):GovernanceIndicatorAggregateV1{
	if(input.aggregate_type!=='GOVERNANCE_EVIDENCE_COMPLETENESS')throw new GovernanceIndicatorAggregateFailureV1('GOVERNANCE_INDICATOR_AGGREGATE_UNSUPPORTED');
	if(input.contributors.length===0)throw new GovernanceIndicatorAggregateFailureV1('GOVERNANCE_INDICATOR_CONTRIBUTOR_MISSING');
	if(new Set(input.contributors.map(x=>x.indicator_id)).size!==input.contributors.length)throw new GovernanceIndicatorAggregateFailureV1('GOVERNANCE_INDICATOR_CONTRIBUTOR_DUPLICATE');
	for(const x of input.contributors){
		const {indicator_id:_,indicator_digest:__,...semantic}=x;
		const digest=governanceIndicatorDigestV1(semantic);
		if(digest!==x.indicator_digest||x.indicator_id!==`governance-indicator:sha256:${digest}`)throw new GovernanceIndicatorAggregateFailureV1('GOVERNANCE_INDICATOR_CONTRIBUTOR_DIGEST_MISMATCH');
		if(x.tenant_id!==input.tenant_id)throw new GovernanceIndicatorAggregateFailureV1('GOVERNANCE_INDICATOR_CONTRIBUTOR_TENANT_MISMATCH');
		if(x.company_id!==input.company_id)throw new GovernanceIndicatorAggregateFailureV1('GOVERNANCE_INDICATOR_CONTRIBUTOR_COMPANY_MISMATCH');
		if(x.subject_type!==input.subject_type||x.subject_id!==input.subject_id)throw new GovernanceIndicatorAggregateFailureV1('GOVERNANCE_INDICATOR_CONTRIBUTOR_SUBJECT_MISMATCH');
		if(x.historical_mode!==input.historical_mode)throw new GovernanceIndicatorAggregateFailureV1('GOVERNANCE_INDICATOR_HISTORICAL_MODE_MISMATCH');
	}
	const missing=input.required_indicator_types.some(t=>!input.contributors.some(x=>x.indicator_type===t));
	const applicable=input.contributors.filter(x=>x.status!=='NOT_APPLICABLE');
	const status=applicable.some(x=>x.status==='DENIED')?'DENIED':missing||applicable.some(x=>x.status==='INCOMPLETE')?'INCOMPLETE':applicable.some(x=>x.status==='DEGRADED')?'DEGRADED':applicable.length?'HEALTHY':'NOT_APPLICABLE';
	const reason_codes=status==='DENIED'?['GOVERNANCE_CONTRIBUTOR_DENIED']as const:status==='INCOMPLETE'?(missing?['REQUIRED_GOVERNANCE_INDICATOR_MISSING']as const:['GOVERNANCE_CONTRIBUTOR_INCOMPLETE']as const):status==='DEGRADED'?['GOVERNANCE_CONTRIBUTOR_DEGRADED']as const:status==='NOT_APPLICABLE'?['NO_APPLICABLE_GOVERNANCE_INDICATOR']as const:['ALL_REQUIRED_GOVERNANCE_EVIDENCE_ACCOUNTED_FOR']as const;
	const semantic=canonical({version:1,aggregate_type:'GOVERNANCE_EVIDENCE_COMPLETENESS',subject_type:input.subject_type,subject_id:input.subject_id,...(input.tenant_id?{tenant_id:input.tenant_id}:{}),...(input.company_id?{company_id:input.company_id}:{}),required_indicator_types:[...input.required_indicator_types],contributors:input.contributors.map(x=>({indicator_id:x.indicator_id,indicator_digest:x.indicator_digest,indicator_type:x.indicator_type,status:x.status})),status,evaluated_at:input.evaluated_at,historical_mode:input.historical_mode,causal_lineage:[...input.causal_lineage],reason_codes:[...reason_codes]});
	const aggregate_digest=governanceIndicatorAggregateDigestV1(semantic);
	return deepCopyAndFreeze({...semantic,aggregate_id:`governance-indicator-aggregate:sha256:${aggregate_digest}`,aggregate_digest});
}
function canonical(x:GovernanceIndicatorAggregateSemanticV1):GovernanceIndicatorAggregateSemanticV1{return{...x,required_indicator_types:[...new Set(x.required_indicator_types)].sort(),contributors:[...x.contributors].sort((a,b)=>a.indicator_id.localeCompare(b.indicator_id)),causal_lineage:[...new Set(x.causal_lineage)].sort(),reason_codes:[...new Set(x.reason_codes)].sort()};}
