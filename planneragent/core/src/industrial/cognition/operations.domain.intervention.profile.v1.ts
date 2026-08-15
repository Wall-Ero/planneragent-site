import { createOperationsEvidenceProfileV1 } from "../../cognition/canonical.operational.roles.v1";
import { createCanonicalDomainInterventionProfileV1, type CanonicalDomainInterventionProfileV1 } from "../../cognition/canonical.domain.intervention.profile.v1";
import { createCanonicalDomainContextBindingV1, type CanonicalDomainContextBindingV1 } from "../../cognition/canonical.domain.context.v1";
import { createOperationsGovernedInterventionClassV1, type OperationsGovernedInterventionClassV1 } from "./operations.governed.intervention.class.v1";

export const OPERATIONS_DOMAIN_INTERVENTION_PROFILE_VERSION_V1 = "1" as const;
export const OPERATIONS_DOMAIN_SEMANTIC_PROFILE_REF_V1 = "domain-profile:operations" as const;

export async function createOperationsDomainInterventionClassesV1():Promise<readonly OperationsGovernedInterventionClassV1[]>{
  const base={version:1 as const,domain_profile_ref:"profile:operations-v1",domain_profile_version:"1",producer_ref:"producer:operations-domain-intervention-profile-v1",policy_ref:"policy:operations-domain-intervention-profile-v1"};
  return Object.freeze(await Promise.all([
    createOperationsGovernedInterventionClassV1({...base,class_key:"ALLOCATION_RELATIONSHIP_CHANGE"}),
    createOperationsGovernedInterventionClassV1({...base,class_key:"MATERIAL_SUPPLY_RELATIONSHIP_CHANGE"}),
    createOperationsGovernedInterventionClassV1({...base,class_key:"AVAILABILITY_TIMING_CHANGE"}),
  ]));
}

export async function createOperationsDomainInterventionProfileV1():Promise<CanonicalDomainInterventionProfileV1>{
  const evidence_profile=await createOperationsEvidenceProfileV1();
  const [allocation,supply,timing]=await createOperationsDomainInterventionClassesV1();
  return createCanonicalDomainInterventionProfileV1({
    version:1,binding_profile_ref:"intervention-profile:operations-v1",binding_profile_version:OPERATIONS_DOMAIN_INTERVENTION_PROFILE_VERSION_V1,
    evidence_profile,policy_ref:"policy:operations-domain-intervention-profile-v1",
    dimension_primitives:[
      {dimension_key:"ALLOCATION_RELATIONSHIP"},
      {dimension_key:"MATERIAL_DEPENDENCY_RELATIONSHIP"},
      {dimension_key:"SUPPLY_AVAILABILITY_RELATIONSHIP"},
      {dimension_key:"COMMITMENT_TIMING_RELATIONSHIP"},
    ],
    intervention_primitives:[
      {primitive_key:"CHANGE_ALLOCATION_RELATIONSHIP",admitted_intervention_class_ref:allocation.intervention_class_id,admitted_intervention_class_digest:allocation.intervention_class_digest,knowledge_hypothesis_refs:[],experience_hypothesis_refs:[]},
      {primitive_key:"CHANGE_MATERIAL_SUPPLY_RELATIONSHIP",admitted_intervention_class_ref:supply.intervention_class_id,admitted_intervention_class_digest:supply.intervention_class_digest,knowledge_hypothesis_refs:[],experience_hypothesis_refs:[]},
      {primitive_key:"CHANGE_AVAILABILITY_TIMING",admitted_intervention_class_ref:timing.intervention_class_id,admitted_intervention_class_digest:timing.intervention_class_digest,knowledge_hypothesis_refs:[],experience_hypothesis_refs:[]},
    ],
    constraint_family_keys:["COMMITMENT_BOUNDARY","COMPETING_DEMAND_PRIORITY","ITEM_UNIT_COHERENCE","MATERIAL_FEASIBILITY","QUANTITY_CONSERVATION","TOPOLOGY_VALIDITY"],
    evaluator_family_keys:["ALLOCATION_FEASIBILITY","BASELINE_COMMITMENT_FEASIBILITY","MATERIAL_FLOW_PROPAGATION"],
    dimension_intervention_bindings:[
      {dimension_key:"ALLOCATION_RELATIONSHIP",primitive_key:"CHANGE_ALLOCATION_RELATIONSHIP"},
      {dimension_key:"SUPPLY_AVAILABILITY_RELATIONSHIP",primitive_key:"CHANGE_ALLOCATION_RELATIONSHIP"},
      {dimension_key:"MATERIAL_DEPENDENCY_RELATIONSHIP",primitive_key:"CHANGE_MATERIAL_SUPPLY_RELATIONSHIP"},
      {dimension_key:"SUPPLY_AVAILABILITY_RELATIONSHIP",primitive_key:"CHANGE_MATERIAL_SUPPLY_RELATIONSHIP"},
      {dimension_key:"SUPPLY_AVAILABILITY_RELATIONSHIP",primitive_key:"CHANGE_AVAILABILITY_TIMING"},
      {dimension_key:"COMMITMENT_TIMING_RELATIONSHIP",primitive_key:"CHANGE_AVAILABILITY_TIMING"},
    ],
    intervention_constraint_bindings:[
      {primitive_key:"CHANGE_ALLOCATION_RELATIONSHIP",constraint_family_key:"COMPETING_DEMAND_PRIORITY"},
      {primitive_key:"CHANGE_ALLOCATION_RELATIONSHIP",constraint_family_key:"ITEM_UNIT_COHERENCE"},
      {primitive_key:"CHANGE_ALLOCATION_RELATIONSHIP",constraint_family_key:"QUANTITY_CONSERVATION"},
      {primitive_key:"CHANGE_MATERIAL_SUPPLY_RELATIONSHIP",constraint_family_key:"ITEM_UNIT_COHERENCE"},
      {primitive_key:"CHANGE_MATERIAL_SUPPLY_RELATIONSHIP",constraint_family_key:"MATERIAL_FEASIBILITY"},
      {primitive_key:"CHANGE_MATERIAL_SUPPLY_RELATIONSHIP",constraint_family_key:"QUANTITY_CONSERVATION"},
      {primitive_key:"CHANGE_MATERIAL_SUPPLY_RELATIONSHIP",constraint_family_key:"TOPOLOGY_VALIDITY"},
      {primitive_key:"CHANGE_AVAILABILITY_TIMING",constraint_family_key:"COMMITMENT_BOUNDARY"},
      {primitive_key:"CHANGE_AVAILABILITY_TIMING",constraint_family_key:"MATERIAL_FEASIBILITY"},
    ],
    intervention_evaluator_bindings:[
      {dimension_key:"ALLOCATION_RELATIONSHIP",primitive_key:"CHANGE_ALLOCATION_RELATIONSHIP",evaluator_family_key:"ALLOCATION_FEASIBILITY"},
      {dimension_key:"SUPPLY_AVAILABILITY_RELATIONSHIP",primitive_key:"CHANGE_ALLOCATION_RELATIONSHIP",evaluator_family_key:"ALLOCATION_FEASIBILITY"},
      {dimension_key:"MATERIAL_DEPENDENCY_RELATIONSHIP",primitive_key:"CHANGE_MATERIAL_SUPPLY_RELATIONSHIP",evaluator_family_key:"MATERIAL_FLOW_PROPAGATION"},
      {dimension_key:"SUPPLY_AVAILABILITY_RELATIONSHIP",primitive_key:"CHANGE_MATERIAL_SUPPLY_RELATIONSHIP",evaluator_family_key:"MATERIAL_FLOW_PROPAGATION"},
      {dimension_key:"SUPPLY_AVAILABILITY_RELATIONSHIP",primitive_key:"CHANGE_AVAILABILITY_TIMING",evaluator_family_key:"BASELINE_COMMITMENT_FEASIBILITY"},
      {dimension_key:"COMMITMENT_TIMING_RELATIONSHIP",primitive_key:"CHANGE_AVAILABILITY_TIMING",evaluator_family_key:"BASELINE_COMMITMENT_FEASIBILITY"},
    ],
    qualification_refs:["qualification:repository-owned-operations-semantics-v1"],
  });
}

export async function createOperationsDomainContextBindingV1():Promise<CanonicalDomainContextBindingV1>{return createCanonicalDomainContextBindingV1({version:1,domain_ref:"domain:operations",domain_semantic_profile_ref:OPERATIONS_DOMAIN_SEMANTIC_PROFILE_REF_V1,domain_semantic_profile_version:"1",evidence_profile:await createOperationsEvidenceProfileV1(),intervention_profile:await createOperationsDomainInterventionProfileV1(),policy_ref:"policy:operations-domain-context-v1",qualification_refs:["qualification:repository-owned-operations-domain-context-v1"]});}
