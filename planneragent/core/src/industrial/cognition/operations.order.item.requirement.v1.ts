import {
	createOperationalSubjectRefV1,
	createOperationsEvidenceProfileV1,
	type OperationalSubjectRefV1,
} from '../../cognition/canonical.operational.roles.v1';
import {
	retrieveCanonicalAdmittedGovernedFactV1,
	type GovernedAcquisitionEvaluationResultV1,
} from '../../reality/governed.acquisition.evaluation.batch.v1';
import {
	evaluateOperationsBaselineCommitmentFeasibilityV1,
	type BaselineAvailabilityV1,
	type BaselinePlanOrderV1,
	type OperationsBaselineCommitmentFeasibilityV1,
} from './operations.baseline.commitment.feasibility.v1';
import { verifyOperationsOrderDeliveryCommitmentV1, type OperationsOrderDeliveryCommitmentV1 } from './operations.protected.objective.v1';

export type OperationsOrderItemRequirementBindingV1 = Readonly<{
	version: 1;
	relationship_kind: 'ORDER_REQUIRES_ITEM';
	tenant_id: string;
	company_id: string;
	request_id: string;
	scope_id: string;
	scope_digest: string;
	evidence_as_of: string;
	order_subject_ref: string;
	order_subject_digest: string;
	required_item_subject_ref: string;
	required_item_subject_digest: string;
	inventory_item_subject_ref: string;
	inventory_item_subject_digest: string;
	order_fact_ref: string;
	order_fact_digest: string;
	order_version_ref: string;
	commitment_ref: string;
	commitment_digest: string;
	item_ref: string;
	inventory_fact_ref: string;
	inventory_fact_digest: string;
	canonical_reality_ref: string;
	canonical_reality_digest: string;
	order_canonical_evidence_ref: string;
	inventory_canonical_evidence_ref: string;
	qualification_refs: readonly string[];
	provenance_refs: readonly string[];
	causal_lineage_refs: readonly string[];
	binding_id: string;
	binding_digest: string;
	digest_algorithm: 'SHA-256';
	deterministic: true;
	observational_only: true;
	recommended: false;
	executable: false;
	grants_authority: false;
	grants_execution: false;
}>;
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
function refs(v: readonly string[], code: string) {
	const x = [...new Set(v.map((y) => y.trim()).filter(Boolean))].sort();
	if (!x.length) throw new Error(code);
	return Object.freeze(x);
}
const factDigestRef = (digest: string) => `governed-fact-digest:sha256:${digest}`;
const realityDigestRef = (digest: string) => `canonical-reality-digest:sha256:${digest}`;
function freeze<T>(v: T): Readonly<T> {
	if (v && typeof v === 'object' && !Object.isFrozen(v)) {
		Object.values(v as Record<string, unknown>).forEach(freeze);
		Object.freeze(v);
	}
	return v;
}
function semantic(v: OperationsOrderItemRequirementBindingV1) {
	const {
		binding_id: _id,
		binding_digest: _digest,
		digest_algorithm: _algorithm,
		deterministic: _deterministic,
		observational_only: _observational,
		recommended: _recommended,
		executable: _executable,
		grants_authority: _authority,
		grants_execution: _execution,
		...value
	} = v;
	return value;
}
async function verifySubject(value: OperationalSubjectRefV1) {
	const profile = await createOperationsEvidenceProfileV1(),
		rebuilt = await createOperationalSubjectRefV1({
			version: 1,
			...(value.tenant_id ? { tenant_id: value.tenant_id } : {}),
			company_id: value.company_id,
			profile,
			subject_kind: value.subject_kind,
			subject_ref: value.subject_ref,
		});
	if (
		rebuilt.subject_id !== value.subject_id ||
		rebuilt.subject_digest !== value.subject_digest ||
		value.domain_ref !== 'domain:operations' ||
		value.profile_ref !== 'profile:operations-v1' ||
		value.grants_execution !== false
	)
		throw new Error('OPS_ORDER_ITEM_SUBJECT_INTEGRITY_INVALID');
}

export async function createOperationsOrderItemRequirementBindingV1(
	input: Readonly<{
		version: 1;
		acquisition_result: GovernedAcquisitionEvaluationResultV1;
		order_canonical_evidence_ref: string;
		inventory_canonical_evidence_ref: string;
		commitment: OperationsOrderDeliveryCommitmentV1;
	}>,
): Promise<OperationsOrderItemRequirementBindingV1> {
	if (input.version !== 1) throw new Error('OPS_ORDER_ITEM_BINDING_VERSION_UNSUPPORTED');
	await verifyOperationsOrderDeliveryCommitmentV1(input.commitment);
	const [orderAdmitted, inventoryAdmitted] = await Promise.all([
		retrieveCanonicalAdmittedGovernedFactV1(input.acquisition_result, input.order_canonical_evidence_ref),
		retrieveCanonicalAdmittedGovernedFactV1(input.acquisition_result, input.inventory_canonical_evidence_ref),
	]);
	if (!orderAdmitted.cognition_eligible || !inventoryAdmitted.cognition_eligible)
		throw new Error('OPS_ORDER_ITEM_CANONICAL_EVIDENCE_NOT_COGNITION_ELIGIBLE');
	const order = orderAdmitted.fact,
		inventory = inventoryAdmitted.fact;
	if (order.semantic.family !== 'ORDERS' || !order.role_bindings.plan_element) throw new Error('OPS_ORDER_ITEM_ORDER_REQUIRED');
	if (inventory.semantic.family !== 'INVENTORY' || !inventory.role_bindings.observation)
		throw new Error('OPS_ORDER_ITEM_INVENTORY_REQUIRED');
	await Promise.all([verifySubject(order.role_bindings.subject), verifySubject(inventory.role_bindings.subject)]);
	const profile = await createOperationsEvidenceProfileV1(),
		requiredItem = await createOperationalSubjectRefV1({
			version: 1,
			...(order.role_bindings.subject.tenant_id ? { tenant_id: order.role_bindings.subject.tenant_id } : {}),
			company_id: order.role_bindings.subject.company_id,
			profile,
			subject_kind: 'SKU',
			subject_ref: `sku:${order.semantic.sku}`,
		}),
		inventorySubject = inventory.role_bindings.subject,
		c = input.commitment,
		r = input.acquisition_result;
	if (
		order.role_bindings.subject.subject_kind !== 'ORDER' ||
		inventorySubject.subject_kind !== 'SKU' ||
		requiredItem.subject_id !== inventorySubject.subject_id ||
		requiredItem.subject_digest !== inventorySubject.subject_digest
	)
		throw new Error('OPS_ORDER_ITEM_INVENTORY_SUBJECT_MISMATCH');
	if (
		c.order_fact_ref !== order.fact_id ||
		c.order_version_ref !== `order-version:${order.semantic.order_version}` ||
		c.item_ref !== `operations-item:${order.semantic.sku}`
	)
		throw new Error('OPS_ORDER_ITEM_COMMITMENT_MISMATCH');
	if (
		c.objective_binding.company_id !== r.company_id ||
		c.objective_binding.request_id !== r.request_id ||
		c.objective_binding.evidence_as_of !== r.evidence_as_of
	)
		throw new Error('OPS_ORDER_ITEM_CONTEXT_MISMATCH');
	const value = {
			version: 1 as const,
			relationship_kind: 'ORDER_REQUIRES_ITEM' as const,
			tenant_id: r.tenant_id,
			company_id: r.company_id,
			request_id: r.request_id,
			scope_id: c.objective_binding.scope_id,
			scope_digest: c.objective_binding.scope_digest,
			evidence_as_of: r.evidence_as_of,
			order_subject_ref: order.role_bindings.subject.subject_id,
			order_subject_digest: order.role_bindings.subject.subject_digest,
			required_item_subject_ref: requiredItem.subject_id,
			required_item_subject_digest: requiredItem.subject_digest,
			inventory_item_subject_ref: inventorySubject.subject_id,
			inventory_item_subject_digest: inventorySubject.subject_digest,
			order_fact_ref: order.fact_id,
			order_fact_digest: order.fact_digest,
			order_version_ref: c.order_version_ref,
			commitment_ref: c.commitment_id,
			commitment_digest: c.commitment_digest,
			item_ref: c.item_ref,
			inventory_fact_ref: inventory.fact_id,
			inventory_fact_digest: inventory.fact_digest,
			canonical_reality_ref: r.canonical_reality.composition_id,
			canonical_reality_digest: r.canonical_reality.composition_digest,
			order_canonical_evidence_ref: orderAdmitted.canonical_evidence_ref,
			inventory_canonical_evidence_ref: inventoryAdmitted.canonical_evidence_ref,
			qualification_refs: refs(
				[...order.role_bindings.plan_element.evidence_refs, inventory.role_bindings.observation.qualification_ref],
				'OPS_ORDER_ITEM_QUALIFICATION_REQUIRED',
			),
			provenance_refs: refs(
				[...order.role_bindings.plan_element.provenance_refs, ...inventory.role_bindings.observation.provenance_refs, ...r.provenance_refs],
				'OPS_ORDER_ITEM_PROVENANCE_REQUIRED',
			),
			causal_lineage_refs: refs(
				[
					order.fact_id,
					factDigestRef(order.fact_digest),
					inventory.fact_id,
					factDigestRef(inventory.fact_digest),
					c.commitment_id,
					requiredItem.subject_id,
					inventorySubject.subject_id,
					r.canonical_reality.composition_id,
					realityDigestRef(r.canonical_reality.composition_digest),
				],
				'OPS_ORDER_ITEM_LINEAGE_REQUIRED',
			),
		},
		binding_digest = await sha(value);
	return freeze({
		...value,
		binding_id: `operations-order-item-requirement-binding:sha256:${binding_digest}`,
		binding_digest,
		digest_algorithm: 'SHA-256' as const,
		deterministic: true as const,
		observational_only: true as const,
		recommended: false as const,
		executable: false as const,
		grants_authority: false as const,
		grants_execution: false as const,
	});
}

export async function verifyOperationsOrderItemRequirementBindingV1(value: OperationsOrderItemRequirementBindingV1): Promise<void> {
	const digest = await sha(semantic(value));
	if (
		value.binding_digest !== digest ||
		value.binding_id !== `operations-order-item-requirement-binding:sha256:${digest}` ||
		value.required_item_subject_ref !== value.inventory_item_subject_ref ||
		value.required_item_subject_digest !== value.inventory_item_subject_digest ||
		value.deterministic !== true ||
		value.observational_only !== true ||
		value.recommended !== false ||
		value.executable !== false ||
		value.grants_authority !== false ||
		value.grants_execution !== false
	)
		throw new Error('OPS_ORDER_ITEM_BINDING_INTEGRITY_INVALID');
}

export async function bindOperationsOrderItemFeasibilityOperandsV1(
	input: Readonly<{
		version: 1;
		commitment: OperationsOrderDeliveryCommitmentV1;
		relationship: OperationsOrderItemRequirementBindingV1;
		availability: readonly BaselineAvailabilityV1[];
	}>,
): Promise<Readonly<{ plan_orders: readonly BaselinePlanOrderV1[]; availability: readonly BaselineAvailabilityV1[] }>> {
	if (input.version !== 1) throw new Error('OPS_BOUND_FEASIBILITY_VERSION_UNSUPPORTED');
	await Promise.all([
		verifyOperationsOrderDeliveryCommitmentV1(input.commitment),
		verifyOperationsOrderItemRequirementBindingV1(input.relationship),
	]);
	const c = input.commitment,
		b = input.relationship;
	if (
		b.commitment_ref !== c.commitment_id ||
		b.commitment_digest !== c.commitment_digest ||
		b.order_fact_ref !== c.order_fact_ref ||
		b.order_version_ref !== c.order_version_ref ||
		b.item_ref !== c.item_ref ||
		b.company_id !== c.objective_binding.company_id ||
		b.request_id !== c.objective_binding.request_id ||
		b.scope_id !== c.objective_binding.scope_id ||
		b.scope_digest !== c.objective_binding.scope_digest
	)
		throw new Error('OPS_ORDER_ITEM_FEASIBILITY_BINDING_MISMATCH');
	if (
		!input.availability.length ||
		input.availability.some(
			(a) =>
				a.item_ref !== b.item_ref ||
				!a.causal_lineage_refs.includes(b.inventory_fact_ref) ||
				!a.causal_lineage_refs.includes(factDigestRef(b.inventory_fact_digest)) ||
				!a.causal_lineage_refs.includes(b.canonical_reality_ref) ||
				!a.causal_lineage_refs.includes(realityDigestRef(b.canonical_reality_digest)),
		)
	)
		throw new Error('OPS_ORDER_ITEM_AVAILABILITY_NOT_GOVERNED');
	const evidence = [b.binding_id, b.order_canonical_evidence_ref, b.inventory_canonical_evidence_ref],
		lineage = [b.binding_id, `operations-order-item-binding-digest:sha256:${b.binding_digest}`, b.canonical_reality_ref, realityDigestRef(b.canonical_reality_digest)],
		plan = freeze({
			evidence_observed_at: b.evidence_as_of,
			evidence_refs: evidence,
			qualification_refs: b.qualification_refs,
			provenance_refs: b.provenance_refs,
			causal_lineage_refs: lineage,
			order_fact_ref: c.order_fact_ref,
			order_version_ref: c.order_version_ref,
			item_ref: c.item_ref,
			quantity: c.committed_quantity,
			due_at: c.committed_due_at,
		}),
		availability = input.availability.map((a) =>
			freeze({
				...a,
				evidence_refs: refs([...a.evidence_refs, ...evidence], 'OPS_ORDER_ITEM_EVIDENCE_REQUIRED'),
				qualification_refs: refs([...a.qualification_refs, ...b.qualification_refs], 'OPS_ORDER_ITEM_QUALIFICATION_REQUIRED'),
				provenance_refs: refs([...a.provenance_refs, ...b.provenance_refs], 'OPS_ORDER_ITEM_PROVENANCE_REQUIRED'),
				causal_lineage_refs: refs([...a.causal_lineage_refs, ...lineage], 'OPS_ORDER_ITEM_LINEAGE_REQUIRED'),
			}),
		);
	return freeze({ plan_orders: [plan], availability });
}
export async function evaluateOperationsBoundBaselineCommitmentFeasibilityV1(
	input: Readonly<{
		version: 1;
		commitment: OperationsOrderDeliveryCommitmentV1;
		relationship: OperationsOrderItemRequirementBindingV1;
		availability: readonly BaselineAvailabilityV1[];
		evidence_boundary: 'COMPLETE' | 'PARTIAL';
	}>,
): Promise<OperationsBaselineCommitmentFeasibilityV1> {
	const operands = await bindOperationsOrderItemFeasibilityOperandsV1(input);
	return evaluateOperationsBaselineCommitmentFeasibilityV1({
		version: 1,
		commitment: input.commitment,
		baseline_semantics: 'BASELINE_CURRENT_PLAN',
		evidence_selection_ref: input.commitment.objective_binding.evaluation_scope.scope.evidence_selection_ref,
		plan_orders: operands.plan_orders,
		availability: operands.availability,
		evidence_boundary: input.evidence_boundary,
	});
}
