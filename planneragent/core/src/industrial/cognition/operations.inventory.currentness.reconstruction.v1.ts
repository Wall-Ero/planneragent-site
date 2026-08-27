import type { OperationalSignalScopeBindingV1 } from '../../cockpit/operational.signal.evaluation.scope.v1';
import { verifyOperationalSignalEvaluationScopeV1 } from '../../cockpit/operational.signal.evaluation.scope.v1';
import type { GovernedSourceEventCoverageCapabilityV1 } from '../../cognition/governed.source.event.coverage.capability.v1';
import { verifyGovernedSourceEventCoverageCapabilityV1 } from '../../cognition/governed.source.event.coverage.capability.v1';
import type { GovernedOperationsFactV1 } from '../preservation/governed.operational.fact.preservation.v1';
import type { OperationsCanonicalLocationV1 } from './operations.canonical.location.v1';
import { resolveOperationsCanonicalLocationV1, verifyOperationsCanonicalLocationV1 } from './operations.canonical.location.v1';
import type { OperationsInventoryMovementStateDeltaV1 } from './operations.inventory.movement.state.delta.v1';
import {
	OPERATIONS_INVENTORY_STATE_LOCATION_KIND_REF,
	verifyOperationsInventoryMovementStateDeltaV1,
} from './operations.inventory.movement.state.delta.v1';
export const OPERATIONS_INVENTORY_CURRENTNESS_POLICY_REF = 'policy:operations-inventory-currentness-and-reconstruction-anchor-v1' as const;
export const OPERATIONS_INVENTORY_RECONSTRUCTION_PRODUCER_REF =
	'producer:operations-observation-anchored-inventory-reconstruction-v1' as const;
export const OPERATIONS_INVENTORY_OBSERVATION_EVENT_CLASS = 'event-class:governed-inventory-observation' as const;
export const OPERATIONS_INVENTORY_DELTA_EVENT_CLASS = 'event-class:governed-inventory-state-changing-movement' as const;
export const OPERATIONS_INVENTORY_OBSERVATION_REQUIRED_FIELDS = Object.freeze([
	'field:company',
	'field:event-identity',
	'field:item',
	'field:location',
	'field:observation-effective-at',
	'field:quantity',
	'field:unit',
] as const);
export const OPERATIONS_INVENTORY_DELTA_REQUIRED_FIELDS = Object.freeze([
	'field:company',
	'field:destination-location',
	'field:event-identity',
	'field:item',
	'field:movement-class',
	'field:occurred-at',
	'field:quantity',
	'field:source-location',
	'field:unit',
] as const);
export type OperationsInventoryCurrentnessReconstructionV1 = Readonly<{
	version: 1;
	policy_ref: typeof OPERATIONS_INVENTORY_CURRENTNESS_POLICY_REF;
	policy_version: '1';
	producer_ref: typeof OPERATIONS_INVENTORY_RECONSTRUCTION_PRODUCER_REF;
	producer_version: '1';
	company_id: string;
	item_ref: string;
	canonical_location_ref: string;
	canonical_location_digest: string;
	source_unit: string;
	selected_observation_ref: string;
	selected_observation_digest: string;
	observation_effective_at: string;
	observation_quantity: number;
	applied_delta_refs: readonly string[];
	reconstruction_interval: Readonly<{ lower: string; lower_inclusive: false; upper: string; upper_inclusive: true }>;
	current_quantity: number;
	request_id: string;
	scope_id: string;
	scope_digest: string;
	evidence_selection_ref: string;
	source_snapshot_ref: string;
	evidence_as_of: string;
	observation_coverage_ref: string;
	delta_coverage_ref: string;
	evidence_refs: readonly string[];
	qualification_refs: readonly string[];
	provenance_refs: readonly string[];
	causal_lineage_refs: readonly string[];
	result_id: string;
	result_digest: string;
	digest_algorithm: 'SHA-256';
	current_fact: true;
	negative_quantity_preserved: true;
	caller_selected_observation: false;
	caller_supplied_quantity: false;
	recommended: false;
	executable: false;
	grants_authority: false;
	grants_execution: false;
}>;
const forbidden = [
	'selected_observation',
	'current_quantity',
	'authority_tier',
	'optimizer_candidate',
	'scenario_mutation',
	'causal_perturbation',
	'future_supply',
	'planned_production',
	'learned_quantity',
];
function req(v: string | undefined, c: string) {
	const x = v?.trim();
	if (!x) throw new Error(c);
	return x;
}
function refs(v: readonly string[], c: string) {
	const x = [...new Set(v.map((y) => req(y, c)))].sort();
	if (!x.length) throw new Error(c);
	return x;
}
function canonical(v: unknown): string {
	if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
	if (v && typeof v === 'object')
		return `{${Object.entries(v as Record<string, unknown>)
			.filter(([, x]) => x !== undefined)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([k, x]) => `${JSON.stringify(k)}:${canonical(x)}`)
			.join(',')}}`;
	return JSON.stringify(v);
}
async function sha(v: unknown) {
	const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(v)));
	return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, '0')).join('');
}
function freeze<T>(v: T): Readonly<T> {
	if (v && typeof v === 'object' && !Object.isFrozen(v)) {
		Object.values(v as Record<string, unknown>).forEach(freeze);
		Object.freeze(v);
	}
	return v;
}
function reject(v: object, c: string) {
	for (const k of forbidden) if (k in (v as Record<string, unknown>)) throw new Error(c);
}
async function verifyFact(v: GovernedOperationsFactV1) {
	const { fact_id: _id, fact_digest: _digest, grants_execution: _execution, observational_only: _observational, ...semantic } = v,
		d = await sha(semantic);
	if (
		v.fact_digest !== d ||
		v.fact_id !== `governed-operations-fact:sha256:${v.source_fact_ref.replace('governed-source-fact:sha256:', '')}` ||
		v.observational_only !== true ||
		v.grants_execution !== false
	)
		throw new Error('OPS_INVENTORY_CURRENTNESS_OBSERVATION_INTEGRITY_INVALID');
}
function fields(c: GovernedSourceEventCoverageCapabilityV1, event: string, required: readonly string[]) {
	const x = c.event_class_capabilities.find((y) => y.domain_ref === 'domain:operations' && y.event_class_ref === event);
	if (!x || required.some((f) => !x.guaranteed_semantic_field_refs.includes(f)))
		throw new Error('OPS_INVENTORY_CURRENTNESS_COVERAGE_FIELDS_REQUIRED');
}
function coverage(c: GovernedSourceEventCoverageCapabilityV1, s: OperationalSignalScopeBindingV1, tenant: string) {
	if (c.coverage_status !== 'COMPLETE') throw new Error('OPS_INVENTORY_CURRENTNESS_COMPLETE_COVERAGE_REQUIRED');
	const x = s.scope;
	if (
		c.tenant_id !== tenant ||
		c.company_id !== x.company_id ||
		c.request_id !== x.request_id ||
		c.scope_id !== x.scope_id ||
		c.scope_digest !== x.scope_digest ||
		c.evidence_selection_ref !== x.evidence_selection_ref ||
		c.source_snapshot_ref !== x.source_snapshot_ref ||
		c.coverage_end !== s.evidence_as_of ||
		c.multi_source_composition !== false
	)
		throw new Error('OPS_INVENTORY_CURRENTNESS_COVERAGE_CONTEXT_MISMATCH');
}
export async function reconstructOperationsCurrentInventoryV1(
	input: Readonly<{
		version: 1;
		tenant_id: string;
		evaluation_scope: OperationalSignalScopeBindingV1;
		observation_coverage: GovernedSourceEventCoverageCapabilityV1;
		delta_coverage: GovernedSourceEventCoverageCapabilityV1;
		inventory_observation_candidates: readonly GovernedOperationsFactV1[];
		movement_deltas: readonly OperationsInventoryMovementStateDeltaV1[];
		location_candidates: readonly OperationsCanonicalLocationV1[];
		qualification_refs: readonly string[];
		provenance_refs: readonly string[];
		causal_lineage_refs: readonly string[];
	}>,
): Promise<readonly OperationsInventoryCurrentnessReconstructionV1[]> {
	if (input.version !== 1) throw new Error('OPS_INVENTORY_CURRENTNESS_VERSION_UNSUPPORTED');
	reject(input, 'OPS_INVENTORY_CURRENTNESS_UNSAFE_INPUT');
	await Promise.all([
		verifyOperationalSignalEvaluationScopeV1(input.evaluation_scope.scope, input.evaluation_scope.scope),
		verifyGovernedSourceEventCoverageCapabilityV1(input.observation_coverage),
		verifyGovernedSourceEventCoverageCapabilityV1(input.delta_coverage),
		...input.inventory_observation_candidates.map(verifyFact),
		...input.movement_deltas.map(verifyOperationsInventoryMovementStateDeltaV1),
		...input.location_candidates.map(verifyOperationsCanonicalLocationV1),
	]);
	const s = input.evaluation_scope.scope,
		tenant = req(input.tenant_id, 'OPS_INVENTORY_CURRENTNESS_TENANT_REQUIRED');
	coverage(input.observation_coverage, input.evaluation_scope, tenant);
	coverage(input.delta_coverage, input.evaluation_scope, tenant);
	fields(input.observation_coverage, OPERATIONS_INVENTORY_OBSERVATION_EVENT_CLASS, OPERATIONS_INVENTORY_OBSERVATION_REQUIRED_FIELDS);
	fields(input.delta_coverage, OPERATIONS_INVENTORY_DELTA_EVENT_CLASS, OPERATIONS_INVENTORY_DELTA_REQUIRED_FIELDS);
	if (input.observation_coverage.source_identity_ref !== input.delta_coverage.source_identity_ref)
		throw new Error('OPS_INVENTORY_CURRENTNESS_MULTI_SOURCE_COMPOSITION_UNSUPPORTED');
	const asOf = Date.parse(input.evaluation_scope.evidence_as_of),
		groups = new Map<string, { location: OperationsCanonicalLocationV1; facts: GovernedOperationsFactV1[] }>();
	for (const f of input.inventory_observation_candidates) {
		const m = f.semantic;
		if (m.family !== 'INVENTORY') throw new Error('OPS_INVENTORY_CURRENTNESS_OBSERVATION_REQUIRED');
		const companyBound = f.company_id === s.company_id || f.role_bindings.subject.company_id === s.company_id;
		const tenantBound = f.role_bindings.subject.tenant_id === tenant || f.role_bindings.subject.tenant_id === `tenant:${tenant}`;
		if (!companyBound || !tenantBound)
			throw new Error('OPS_INVENTORY_CURRENTNESS_OBSERVATION_CONTEXT_MISMATCH');
		if (Date.parse(m.observed_at) > asOf) continue;
		const location = await resolveOperationsCanonicalLocationV1({
				version: 1,
				tenant_id: tenant,
				company_id: s.company_id,
				source_namespace: f.provenance.source_system,
				external_location_ref: m.warehouse_id,
				location_kind_ref: OPERATIONS_INVENTORY_STATE_LOCATION_KIND_REF,
				evidence_as_of: input.evaluation_scope.evidence_as_of,
				candidates: input.location_candidates,
			}),
			item = `operations-item:${m.sku}`,
			unit = req(m.quantity.source_unit, 'OPS_INVENTORY_CURRENTNESS_UNIT_REQUIRED'),
			key = `${s.company_id}|${item}|${location.location_id}|${unit}`,
			g = groups.get(key) ?? { location, facts: [] };
		g.facts.push(f);
		groups.set(key, g);
	}
	if (!groups.size) throw new Error('OPS_INVENTORY_CURRENTNESS_NO_OBSERVATION');
	const deltaIds = new Set<string>();
	for (const d of input.movement_deltas) {
		if (deltaIds.has(d.delta_id)) throw new Error('OPS_INVENTORY_CURRENTNESS_DUPLICATE_DELTA');
		deltaIds.add(d.delta_id);
		if (
			d.company_id !== s.company_id ||
			d.request_id !== s.request_id ||
			d.scope_id !== s.scope_id ||
			d.scope_digest !== s.scope_digest ||
			d.evidence_selection_ref !== s.evidence_selection_ref ||
			d.source_snapshot_ref !== s.source_snapshot_ref ||
			d.evidence_as_of !== input.evaluation_scope.evidence_as_of
		)
			throw new Error('OPS_INVENTORY_CURRENTNESS_DELTA_CONTEXT_MISMATCH');
	}
	const out: OperationsInventoryCurrentnessReconstructionV1[] = [];
	for (const [key, g] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
		const ordered = [...g.facts].sort((a, b) => Date.parse((b.semantic as any).observed_at) - Date.parse((a.semantic as any).observed_at)),
			selected = ordered[0]!,
			m = selected.semantic as Extract<GovernedOperationsFactV1['semantic'], { family: 'INVENTORY' }>,
			t0 = Date.parse(m.observed_at);
		if (ordered.length > 1 && Date.parse((ordered[1]!.semantic as any).observed_at) === t0)
			throw new Error('OPS_INVENTORY_CURRENTNESS_LATEST_AMBIGUOUS');
		const item = `operations-item:${m.sku}`,
			unit = m.quantity.source_unit,
			applied = input.movement_deltas
				.filter(
					(d) =>
						d.company_id === s.company_id &&
						d.item_ref === item &&
						d.canonical_location_ref === g.location.location_id &&
						d.canonical_location_digest === g.location.location_digest &&
						d.quantity.source_unit === unit &&
						Date.parse(d.occurred_at) > t0 &&
						Date.parse(d.occurred_at) <= asOf,
				)
				.sort((a, b) => a.delta_id.localeCompare(b.delta_id));
		for (const d of input.movement_deltas)
			if (
				d.company_id === s.company_id &&
				d.item_ref === item &&
				d.canonical_location_ref === g.location.location_id &&
				d.quantity.source_unit !== unit
			)
				throw new Error('OPS_INVENTORY_CURRENTNESS_UNIT_MISMATCH');
		const current = m.quantity.value + applied.reduce((n, d) => n + (d.direction === 'INCREASE' ? d.quantity.value : -d.quantity.value), 0),
			value = {
				version: 1 as const,
				policy_ref: OPERATIONS_INVENTORY_CURRENTNESS_POLICY_REF,
				policy_version: '1' as const,
				producer_ref: OPERATIONS_INVENTORY_RECONSTRUCTION_PRODUCER_REF,
				producer_version: '1' as const,
				company_id: s.company_id,
				item_ref: item,
				canonical_location_ref: g.location.location_id,
				canonical_location_digest: g.location.location_digest,
				source_unit: unit,
				selected_observation_ref: selected.fact_id,
				selected_observation_digest: selected.fact_digest,
				observation_effective_at: m.observed_at,
				observation_quantity: m.quantity.value,
				applied_delta_refs: applied.map((d) => d.delta_id),
				reconstruction_interval: {
					lower: m.observed_at,
					lower_inclusive: false as const,
					upper: input.evaluation_scope.evidence_as_of,
					upper_inclusive: true as const,
				},
				current_quantity: current,
				request_id: s.request_id,
				scope_id: s.scope_id,
				scope_digest: s.scope_digest,
				evidence_selection_ref: s.evidence_selection_ref,
				source_snapshot_ref: s.source_snapshot_ref,
				evidence_as_of: input.evaluation_scope.evidence_as_of,
				observation_coverage_ref: input.observation_coverage.capability_id,
				delta_coverage_ref: input.delta_coverage.capability_id,
				evidence_refs: refs(
					[
						selected.source_fact_ref,
						g.location.location_id,
						input.observation_coverage.capability_id,
						input.delta_coverage.capability_id,
						...applied.map((d) => d.delta_id),
					],
					'OPS_INVENTORY_CURRENTNESS_EVIDENCE_REQUIRED',
				),
				qualification_refs: refs(
					[
						selected.role_bindings.observation?.qualification_ref ?? '',
						...g.location.qualification_refs,
						...input.observation_coverage.qualification_refs,
						...input.delta_coverage.qualification_refs,
						...applied.flatMap((d) => d.qualification_refs),
						...input.qualification_refs,
					],
					'OPS_INVENTORY_CURRENTNESS_QUALIFICATION_REQUIRED',
				),
				provenance_refs: refs(
					[
						`provenance:${selected.provenance.acquisition_reference}`,
						...g.location.provenance_refs,
						...input.observation_coverage.provenance_refs,
						...input.delta_coverage.provenance_refs,
						...applied.flatMap((d) => d.provenance_refs),
						...input.provenance_refs,
					],
					'OPS_INVENTORY_CURRENTNESS_PROVENANCE_REQUIRED',
				),
				causal_lineage_refs: refs(
					[
						selected.fact_id,
						g.location.location_id,
						input.observation_coverage.capability_id,
						input.delta_coverage.capability_id,
						...applied.map((d) => d.delta_id),
						...input.causal_lineage_refs,
						OPERATIONS_INVENTORY_CURRENTNESS_POLICY_REF,
						OPERATIONS_INVENTORY_RECONSTRUCTION_PRODUCER_REF,
					],
					'OPS_INVENTORY_CURRENTNESS_LINEAGE_REQUIRED',
				),
			};
		const result_digest = await sha(value);
		out.push(
			freeze({
				...value,
				result_id: `operations-inventory-currentness-reconstruction:sha256:${result_digest}`,
				result_digest,
				digest_algorithm: 'SHA-256' as const,
				current_fact: true as const,
				negative_quantity_preserved: true as const,
				caller_selected_observation: false as const,
				caller_supplied_quantity: false as const,
				recommended: false as const,
				executable: false as const,
				grants_authority: false as const,
				grants_execution: false as const,
			}),
		);
	}
	return freeze(out);
}
export async function verifyOperationsInventoryCurrentnessReconstructionV1(v: OperationsInventoryCurrentnessReconstructionV1) {
	const {
			result_id: _id,
			result_digest: _digest,
			digest_algorithm: _algorithm,
			current_fact: _current,
			negative_quantity_preserved: _negative,
			caller_selected_observation: _selected,
			caller_supplied_quantity: _quantity,
			recommended: _recommended,
			executable: _executable,
			grants_authority: _authority,
			grants_execution: _execution,
			...value
		} = v,
		d = await sha(value);
	if (
		v.result_digest !== d ||
		v.result_id !== `operations-inventory-currentness-reconstruction:sha256:${d}` ||
		v.current_fact !== true ||
		v.negative_quantity_preserved !== true ||
		v.caller_selected_observation !== false ||
		v.caller_supplied_quantity !== false ||
		v.recommended !== false ||
		v.executable !== false ||
		v.grants_authority !== false ||
		v.grants_execution !== false
	)
		throw new Error('OPS_INVENTORY_CURRENTNESS_INTEGRITY_INVALID');
}
