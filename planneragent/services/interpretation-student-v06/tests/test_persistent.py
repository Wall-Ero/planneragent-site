import json
import secrets
import sys
import traceback
from pathlib import Path
from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).parents[1]))
from app import main, persistent
from app.contracts import INTERACTIONS, INVARIANTS
from app.identity import IDENTITY, verify_metadata
from app.model import resolve_dtype


@pytest.fixture
def configured(monkeypatch, tmp_path):
    token = secrets.token_hex(32)  # Generated test-only credential.
    artifact = tmp_path / "artifact.zip"
    artifact.write_bytes(b"invalid")
    for name, value in {
        "STUDENT_BEARER_TOKEN": token,
        "STUDENT_ARTIFACT_PATH": str(artifact),
        "STUDENT_CACHE_ROOT": str(tmp_path / "cache"),
        "HF_HOME": str(tmp_path / "hf"),
        "STUDENT_DTYPE": "bf16",
        "STUDENT_MAX_CONCURRENCY": "1",
        "STUDENT_MAX_REQUEST_BYTES": "16384",
    }.items():
        monkeypatch.setenv(name, value)
    return artifact, token


def rejected():
    with pytest.raises(RuntimeError, match="^PERSISTENT_STUDENT_STARTUP_FAILED$") as error:
        with TestClient(persistent.app):
            pytest.fail("startup admitted")
    assert not main.app.state.ready
    return "".join(traceback.format_exception(error.value))


@pytest.mark.parametrize("name,value", [
    ("STUDENT_BEARER_TOKEN", ""), ("STUDENT_DTYPE", "fp16"),
    ("STUDENT_MAX_CONCURRENCY", "0"), ("STUDENT_MAX_CONCURRENCY", "2"),
    ("STUDENT_MAX_REQUEST_BYTES", "invalid"), ("STUDENT_MAX_REQUEST_BYTES", "0"),
    ("STUDENT_MAX_REQUEST_BYTES", "16385"), ("STUDENT_CACHE_ROOT", "relative"),
    ("HF_HOME", ""),
])
def test_bad_configuration_before_model_load(configured, monkeypatch, name, value):
    monkeypatch.setenv(name, value)
    engine = Mock()
    monkeypatch.setattr(main, "StudentEngine", engine)
    rejected()
    engine.assert_not_called()


def test_missing_artifact(configured, monkeypatch):
    configured[0].unlink()
    engine = Mock()
    monkeypatch.setattr(main, "StudentEngine", engine)
    rejected()
    engine.assert_not_called()


def test_sha_mismatch_before_model_load(configured, monkeypatch):
    with configured[0].open("wb") as stream:
        stream.truncate(IDENTITY["artifact_size"])
    engine = Mock()
    monkeypatch.setattr(main, "StudentEngine", engine)
    rejected()
    engine.assert_not_called()


def test_candidate_mismatch():
    manifest = {key: IDENTITY[key] for key in
                ("candidate_id", "adapter_digest", "base_model", "base_revision")}
    manifest["candidate_id"] = "wrong"
    with pytest.raises(RuntimeError, match="CANDIDATE_ID_MISMATCH"):
        verify_metadata(manifest, {"decision": IDENTITY["qualification"]})


@pytest.mark.parametrize("available,bf16,major", [(False, True, 8), (True, False, 8), (True, True, 7)])
def test_gpu_rejected_without_fallback(available, bf16, major):
    torch = Mock()
    torch.cuda.is_available.return_value = available
    torch.cuda.is_bf16_supported.return_value = bf16
    torch.cuda.get_device_capability.return_value = (major, 0)
    with pytest.raises(RuntimeError, match="CONFIGURED_DTYPE_UNSUPPORTED"):
        resolve_dtype(torch, "bf16")


def test_startup_exception_is_sanitized(configured, monkeypatch, caplog):
    def fail(*args):
        raise RuntimeError(configured[1])
    monkeypatch.setattr(main, "verify_and_extract", fail)
    assert configured[1] not in rejected()
    assert configured[1] not in caplog.text


def test_identity_auth_inference_and_fresh_cache(configured, monkeypatch, caplog):
    caches = []
    def extract(archive, cache):
        caches.append(cache)
        return cache / "adapter"
    monkeypatch.setattr(main, "verify_and_extract", extract)
    result = {"version": 1, "interaction": "UNRELATED", "resolution": "CLEAR", **INVARIANTS}
    engine = Mock()
    engine.return_value.interpret.return_value = result
    monkeypatch.setattr(main, "StudentEngine", engine)
    identities = []
    for _ in range(2):
        with TestClient(persistent.app) as client:
            for path in ("/health", "/v1/identity", "/v1/interpret"):
                response = client.post(path, json={}) if path.endswith("interpret") else client.get(path)
                assert response.status_code == 401
            assert client.get("/health", headers={"authorization": "Bearer wrong"}).status_code == 401
            headers = {"authorization": "Bearer " + configured[1]}
            assert client.get("/health", headers=headers).json() == {"status": "ready"}
            identity = client.get("/v1/identity", headers=headers).json()
            assert identity == {**IDENTITY, "effective_dtype": "bf16", "protocol_version": "PA_STUDENT_HTTP_V1"}
            identities.append(identity)
            request = {"version": 1, "raw_user_message": "synthetic-test-only",
                       "allowed_interactions": list(INTERACTIONS), "invariants": INVARIANTS,
                       "required_result_contract": "CONVERSATIONAL_INTERPRETATION_RESULT_V1"}
            response = client.post("/v1/interpret", headers=headers, json=request)
            assert response.status_code == 200 and response.json() == result
            engine.return_value.interpret.side_effect = RuntimeError(configured[1])
            response = client.post("/v1/interpret", headers=headers, json=request)
            assert response.status_code == 503 and configured[1] not in response.text
            engine.return_value.interpret.side_effect = None
        assert not main.app.state.ready
    assert identities[0] == identities[1]
    assert caches[0] != caches[1] and all(not cache.exists() for cache in caches)
    assert all(call.args[1:] == (IDENTITY, "bf16") for call in engine.call_args_list)
    assert configured[1] not in caplog.text and "synthetic-test-only" not in caplog.text


def test_manifest_pins_and_production_disabled():
    root = Path(__file__).parents[1]
    manifest = json.loads((root / "deployment.manifest.json").read_text())
    assert manifest["identity"] == {**IDENTITY, "effective_dtype": "bf16", "protocol_version": "PA_STUDENT_HTTP_V1"}
    assert manifest["production_shadow"] == "DISABLED"
    assert manifest["observation_window"] == "NOT_STARTED"
    assert all((root / item).is_file() for item in manifest["application_files"])
    production = (root.parents[1] / "core" / "wrangler.toml").read_text()
    assert "CONTROLLED_SHADOW" not in production

def test_missing_secret(configured, monkeypatch):
    monkeypatch.delenv("STUDENT_BEARER_TOKEN")
    engine = Mock()
    monkeypatch.setattr(main, "StudentEngine", engine)
    rejected()
    engine.assert_not_called()


@pytest.mark.parametrize("status,body,expected", [
    (200, b'{"status":"ready"}', True),
    (200, b'{"status":"starting"}', False),
    (401, b'{}', False),
    (200, b'invalid', False),
])
def test_authenticated_probe(configured, monkeypatch, status, body, expected):
    from app import probe
    connection = Mock()
    response = connection.getresponse.return_value
    response.status = status
    response.read.return_value = body
    factory = Mock(return_value=connection)
    monkeypatch.setattr(probe.http.client, "HTTPConnection", factory)
    assert probe.ready() is expected
    connection.request.assert_called_once_with(
        "GET", "/health", headers={"Authorization": "Bearer " + configured[1]})
    connection.close.assert_called_once()


def test_probe_failure_is_silent(configured, monkeypatch, capsys):
    from app import probe
    monkeypatch.setattr(probe.http.client, "HTTPConnection", Mock(side_effect=RuntimeError(configured[1])))
    assert not probe.ready()
    captured = capsys.readouterr()
    assert captured.out == captured.err == ""
