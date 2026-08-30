import hashlib, json, os, shutil, tempfile, zipfile
from pathlib import Path

IDENTITY={"service_protocol_version":1,"candidate_id":"PA-INTERPRETATION-STUDENT-v0.6","candidate_version":"0.6","artifact_sha256":"f20989ac8397aa1788fcdd03c6027fb178e4489bc576a175f690029ac2eb9e1f","artifact_size":22782731,"adapter_digest":"sha256:6ce46299667e0ba8f9b24b3558cc8b3ae110ef5bbcfb5c20a5f32ea022400ad3","base_model":"Qwen/Qwen3-0.6B-Base","base_revision":"da87bfb608c14b7cf20ba1ce41287e8de496c0cd","qualification":"QUALIFIED_FOR_SHADOW","lifecycle":"QUALIFIED_FOR_SHADOW"}
ROOT="PA-INTERPRETATION-STUDENT-v0.6/"
def runtime_identity(dtype): return {**IDENTITY,"effective_dtype":dtype}
def verify_metadata(manifest,qualification):
    checks=((manifest.get("candidate_id"),IDENTITY["candidate_id"],"CANDIDATE_ID_MISMATCH"),(manifest.get("adapter_digest"),IDENTITY["adapter_digest"],"ADAPTER_DIGEST_MISMATCH"),(manifest.get("base_model"),IDENTITY["base_model"],"BASE_MODEL_MISMATCH"),(manifest.get("base_revision"),IDENTITY["base_revision"],"BASE_REVISION_MISMATCH"),(qualification.get("decision"),IDENTITY["qualification"],"QUALIFICATION_MISMATCH"))
    for actual,expected,error in checks:
        if actual!=expected: raise RuntimeError(error)
def digest(stream):
    h=hashlib.sha256()
    for block in iter(lambda:stream.read(1024*1024),b""): h.update(block)
    return h.hexdigest()
def verify_and_extract(archive:Path, cache:Path)->Path:
    if archive.stat().st_size!=IDENTITY["artifact_size"]: raise RuntimeError("ARTIFACT_SIZE_MISMATCH")
    with archive.open("rb") as f:
        if digest(f)!=IDENTITY["artifact_sha256"]: raise RuntimeError("ARTIFACT_SHA256_MISMATCH")
    with zipfile.ZipFile(archive) as z:
        manifest=json.loads(z.read(ROOT+"final-adapter/candidate.manifest.json")); qualification=json.loads(z.read(ROOT+"qualification.decision.json"))
        verify_metadata(manifest,qualification)
        entry=ROOT+"final-adapter/adapter/adapter_model.safetensors"
        with z.open(entry) as f:
            if "sha256:"+digest(f)!=IDENTITY["adapter_digest"]: raise RuntimeError("ADAPTER_BYTES_MISMATCH")
        target=cache/IDENTITY["artifact_sha256"]; adapter=target/"adapter"
        if not adapter.exists():
            cache.mkdir(parents=True,exist_ok=True); temp=Path(tempfile.mkdtemp(prefix="extract-",dir=cache))
            try:
                prefix=ROOT+"final-adapter/adapter/"
                for member in z.infolist():
                    if member.is_dir() or not member.filename.startswith(prefix): continue
                    relative=Path(member.filename[len(prefix):])
                    if relative.is_absolute() or ".." in relative.parts: raise RuntimeError("UNSAFE_ARCHIVE_PATH")
                    output=temp/"adapter"/relative; output.parent.mkdir(parents=True,exist_ok=True)
                    with z.open(member) as source,output.open("wb") as sink: shutil.copyfileobj(source,sink)
                os.replace(temp,target)
            except: shutil.rmtree(temp,ignore_errors=True); raise
        return adapter
