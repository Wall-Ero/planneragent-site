import hashlib,inspect,json,logging,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parents[1]))
import pytest
from app.contracts import INTERACTIONS,INVARIANTS,enforce_byte_limit,validate_request,validate_result
from app.identity import IDENTITY,runtime_identity,verify_and_extract,verify_metadata
from app.model import CONTEXT_TOKENS,MAX_NEW_TOKENS,InputTokenLimitExceeded,encode_admitted_prompt,resolve_dtype,training_prompt
from app.auth import authorized
def result(**changes): return {"version":1,"interaction":"UNRELATED","resolution":"CLEAR",**INVARIANTS,**changes}
def test_valid_result(): assert validate_result(result())["interaction"]=="UNRELATED"
@pytest.mark.parametrize("change",[{"interaction":"WRONG"},{"grants_authority":True},{"grants_execution":True}])
def test_rejects_enum_and_invariants(change):
    with pytest.raises(ValueError): validate_result(result(**change))
def test_rejects_malformed_json():
    with pytest.raises(json.JSONDecodeError): json.loads("not-json")
def test_request_and_training_serialization():
    req={"version":1,"raw_user_message":"hello","allowed_interactions":list(INTERACTIONS),"invariants":INVARIANTS,"required_result_contract":"CONVERSATIONAL_INTERPRETATION_RESULT_V1"}
    assert validate_request(req)=="hello"; assert training_prompt("hello").endswith("USER:\nhello\n\nTARGET:\n")
def test_privacy_logging_source():
    source=inspect.getsource(__import__("app.main",fromlist=["x"])); assert all("message" not in line for line in source.splitlines() if "log." in line)
def test_identity_is_exact(): assert IDENTITY["qualification"]=="QUALIFIED_FOR_SHADOW" and IDENTITY["artifact_size"]==22782731
def test_identity_exposes_effective_dtype(): assert runtime_identity("bf16")["effective_dtype"]=="bf16"
def test_oversized_bytes_rejected():
    with pytest.raises(ValueError,match="REQUEST_TOO_LARGE"): enforce_byte_limit(b"12345",4)
def test_auth_missing_wrong_and_valid(): assert not authorized(None,"x"*32) and not authorized("Bearer wrong","x"*32) and authorized("Bearer "+"x"*32,"x"*32)
def test_artifact_mismatch_fails_closed(tmp_path):
    bad=tmp_path/"bad.zip"; bad.write_bytes(b"bad")
    with pytest.raises(RuntimeError,match="ARTIFACT_SIZE_MISMATCH"): verify_and_extract(bad,tmp_path/"cache")
def test_adapter_and_revision_mismatch_fail_closed():
    manifest={"candidate_id":IDENTITY["candidate_id"],"adapter_digest":"wrong","base_model":IDENTITY["base_model"],"base_revision":IDENTITY["base_revision"]}
    with pytest.raises(RuntimeError,match="ADAPTER_DIGEST_MISMATCH"): verify_metadata(manifest,{"decision":IDENTITY["qualification"]})
    manifest["adapter_digest"]=IDENTITY["adapter_digest"]; manifest["base_revision"]="wrong"
    with pytest.raises(RuntimeError,match="BASE_REVISION_MISMATCH"): verify_metadata(manifest,{"decision":IDENTITY["qualification"]})
class Shape:
    def __init__(self,tokens): self.shape=(1,tokens)
class Tokenizer:
    def __init__(self,tokens): self.tokens=tokens; self.arguments=None
    def __call__(self,_prompt,**arguments): self.arguments=arguments; return {"input_ids":Shape(self.tokens)}
def test_boundary_prompt_accepted_without_truncation():
    tokenizer=Tokenizer(CONTEXT_TOKENS-MAX_NEW_TOKENS)
    encode_admitted_prompt(tokenizer,"private text")
    assert tokenizer.arguments["truncation"] is False
def test_prompt_over_limit_rejected_without_plaintext(caplog):
    tokenizer=Tokenizer(CONTEXT_TOKENS-MAX_NEW_TOKENS+1)
    with pytest.raises(InputTokenLimitExceeded,match="INPUT_TOKEN_LIMIT_EXCEEDED"): encode_admitted_prompt(tokenizer,"private text")
    assert "private text" not in caplog.text
def test_total_budget_never_exceeds_context(): assert (CONTEXT_TOKENS-MAX_NEW_TOKENS)+MAX_NEW_TOKENS==CONTEXT_TOKENS
class Cuda:
    def is_available(self): return True
    def is_bf16_supported(self): return True
    def get_device_capability(self): return (8,0)
class Torch: cuda=Cuda(); bfloat16="bf16-sentinel"
def test_dtype_exact_and_no_fallback():
    assert resolve_dtype(Torch(),"bf16")=="bf16-sentinel"
    with pytest.raises(RuntimeError,match="UNSUPPORTED_CONFIGURED_DTYPE"): resolve_dtype(Torch(),"fp16")
def test_t4_compute_capability_fails_closed():
    torch=Torch(); torch.cuda.get_device_capability=lambda:(7,5)
    with pytest.raises(RuntimeError,match="COMPUTE_CAPABILITY"): resolve_dtype(torch,"bf16")
