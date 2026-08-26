import type { OperationalSignalScopeBindingV1 } from "../cockpit/operational.signal.evaluation.scope.v1";
import type { GovernedSourceEventCoverageCapabilityV1 } from "../cognition/governed.source.event.coverage.capability.v1";
import { composeCanonicalOperationalRealityV1 } from "./canonical.operational.reality.composition.v1";
import {
  alignGovernedMultiSourceOperationalRealityV1,
  type GovernedRepresentationObservationInputV1,
  type GovernedTemporalBindingV1,
} from "./governed.multi-source.reality.alignment.v1";
import {
  createObservationBreadthV1,
  type GovernedOperationalRepresentationV1,
  type OperationalRepresentationRelationshipV1,
} from "./governed.operational.representation.v1";

export async function composeExistingObservedOperationalRealityV1(input: Readonly<{
  version: 1;
  tenant_id: string;
  evaluation_scope: OperationalSignalScopeBindingV1;
  observations: readonly GovernedRepresentationObservationInputV1[];
  temporal_bindings: readonly GovernedTemporalBindingV1[];
  representation_relationships: readonly OperationalRepresentationRelationshipV1[];
  coverage: readonly GovernedSourceEventCoverageCapabilityV1[];
}>) {
  const representations = new Map<string, GovernedOperationalRepresentationV1>();
  for (const observation of input.observations) {
    if (observation.source.kind === "PERSISTENT_REPRESENTATION") {
      representations.set(observation.source.representation.representation_id, observation.source.representation);
    }
  }
  const observation_breadth = await createObservationBreadthV1({
    version: 1,
    evaluation_scope: input.evaluation_scope,
    representations: [...representations.values()],
  });
  const alignment = await alignGovernedMultiSourceOperationalRealityV1({
    version: input.version,
    tenant_id: input.tenant_id,
    evaluation_scope: input.evaluation_scope,
    observations: input.observations,
    temporal_bindings: input.temporal_bindings,
    representation_relationships: input.representation_relationships,
  });
  const canonical_reality = await composeCanonicalOperationalRealityV1({
    version: input.version,
    tenant_id: input.tenant_id,
    evaluation_scope: input.evaluation_scope,
    evidence: alignment.canonical_evidence,
    coverage: input.coverage,
  });
  return Object.freeze({ version: 1 as const, observation_breadth, alignment, canonical_reality });
}
