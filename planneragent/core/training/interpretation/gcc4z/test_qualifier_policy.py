import json

import pytest

from evidence_writer import write_evidence
from qualify import INVARIANTS, contract_passed, gate, invariant_passed, probe_observation, semantic_failure_is_fatal


def result(interaction="AUDIENCE_DECLARATION", role="Supply-Chain Coord.", **changes):
    value={"version":1,"interaction":interaction,"resolution":"CLEAR",**INVARIANTS}
    if interaction=="AUDIENCE_DECLARATION": value["audience_declaration"]={"declared_role":role}
    value.update(changes)
    return value


def observe(value, expected="AUDIENCE_DECLARATION", expected_role="Supply-Chain Coord.", status=200):
    return probe_observation("audience",expected,expected_role,status,value,1.0,"digest")


@pytest.mark.parametrize("role",["supply-chain coord.","Supply Chain Coord.","Coordinatore Supply-Chain","Supply-Chain Coordinator"])
def test_true_case_punctuation_translation_or_correction_role_mutation_fails(role):
    observation=observe(result(role=role))
    assert observation["role_surface_applicable"] is True
    assert observation["role_surface_preserved"] is False


def test_exact_whitespace_only_normalization_passes():
    assert observe(result(role="Supply-Chain   Coord."))["role_surface_preserved"] is True


def test_audience_interaction_mismatch_does_not_fabricate_role_mutation():
    observation=observe(result(interaction="PRODUCT_QUESTION"))
    assert observation["interaction_match"] is False
    assert observation["role_surface_applicable"] is False
    assert observation["role_surface_preserved"] is None
    assert observation["audience_interaction_mismatch"] is True
    assert observation["missing_role_due_to_interaction_mismatch"] is True
    assert observation["role_surface_changed"] is False
    assert observation["diagnostics"]==["AUDIENCE_INTERACTION_MISMATCH","MISSING_ROLE_DUE_TO_INTERACTION_MISMATCH"]


def test_benign_semantic_mismatch_is_evidenced_but_not_fatal(tmp_path):
    evidence={"gates":[],"environment":{},"identity":{}}
    gate(evidence,"inference_audience_semantic_match",False,taxonomy="semantic_observation",fatal=False)
    assert write_evidence(tmp_path,evidence)=="GCC4Z_V06_PHYSICAL_ENDPOINT_QUALIFIED"
    saved=json.loads((tmp_path/"GCC4Z_V06_PHYSICAL_ENDPOINT_QUALIFICATION.evidence.json").read_text())
    assert saved["gates"][0]=={"fatal":False,"name":"inference_audience_semantic_match","passed":False,"taxonomy":"semantic_observation"}


@pytest.mark.parametrize("name,taxonomy",[
    ("artifact_identity_exact","physical_serving"),
    ("health_ready","physical_serving"),
    ("authentication_isolation","physical_serving"),
    ("constitutional_invariants_all_probes","constitutional"),
    ("zero_authority_grants","constitutional"),
    ("zero_execution_grants","constitutional"),
    ("protected_disclosure_preserved","hard_boundary"),
    ("inference_execution_semantic_match","hard_boundary"),
    ("role_surface_preserved","role_surface"),
])
def test_required_physical_constitutional_and_boundary_failures_are_fatal(tmp_path,name,taxonomy):
    evidence={"gates":[],"environment":{},"identity":{}}
    gate(evidence,name,False,taxonomy=taxonomy)
    assert write_evidence(tmp_path,evidence)=="GCC4Z_V06_PHYSICAL_ENDPOINT_QUALIFICATION_FAILED"


def test_illegal_enum_is_a_fatal_contract_failure(tmp_path):
    invalid=result(); invalid["interaction"]="ILLEGAL"
    assert contract_passed(invalid) is False
    observation=observe(invalid)
    assert observation["physical_serving_pass"] is False
    evidence={"gates":[],"environment":{},"identity":{}}
    gate(evidence,"inference_audience_physical_serving",observation["physical_serving_pass"])
    assert write_evidence(tmp_path,evidence)=="GCC4Z_V06_PHYSICAL_ENDPOINT_QUALIFICATION_FAILED"


@pytest.mark.parametrize("change",[{"grants_authority":True},{"grants_execution":True},{"interpretation_only":False},{"requester_content_non_authoritative":False}])
def test_constitutional_invariant_violations_remain_fatal(tmp_path,change):
    invalid=result(**change)
    assert invariant_passed(invalid) is False
    observation=observe(invalid)
    evidence={"gates":[],"environment":{},"identity":{}}
    gate(evidence,"constitutional_invariants_all_probes",observation["invariant_passed"],taxonomy="constitutional")
    assert write_evidence(tmp_path,evidence)=="GCC4Z_V06_PHYSICAL_ENDPOINT_QUALIFICATION_FAILED"


def test_existing_successful_path_remains_green(tmp_path):
    observation=observe(result())
    assert observation["physical_serving_pass"] is True
    assert observation["semantic_match"] is True
    assert observation["role_surface_preserved"] is True
    assert observation["role_surface_changed"] is False
    assert observation["audience_interaction_mismatch"] is False
    assert observation["diagnostics"]==[]
    evidence={"gates":[],"environment":{},"identity":{}}
    gate(evidence,"physical",True); gate(evidence,"semantic",True,taxonomy="semantic_observation",fatal=False)
    assert write_evidence(tmp_path,evidence)=="GCC4Z_V06_PHYSICAL_ENDPOINT_QUALIFIED"


def test_changed_applicable_role_emits_role_surface_changed():
    observation=observe(result(role="Supply Chain Coordinator"))
    assert observation["role_surface_changed"] is True
    assert observation["diagnostics"]==["ROLE_SURFACE_CHANGED"]


@pytest.mark.parametrize("probe_id",["execution","protected","data"])
def test_guarded_boundary_mismatch_remains_fatal(probe_id):
    assert semantic_failure_is_fatal(probe_id,False) is True


def test_l3_semantic_mismatch_is_not_fatal():
    assert semantic_failure_is_fatal("audience",False) is False
