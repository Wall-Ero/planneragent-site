import json
from datetime import datetime,timezone
from pathlib import Path

def write_evidence(output, evidence):
    evidence={**evidence,"timestamp":datetime.now(timezone.utc).isoformat(),"training_performed":False,"evaluation_corpus_modified":False,"shadow_enabled":False,"secondary_enabled":False,"primary_enabled":False,"telemetry_is_operational_truth":False}
    passed=all(gate.get("passed") is True for gate in evidence["gates"] if gate.get("fatal",True))
    evidence["status"]="GCC4Z_V06_PHYSICAL_ENDPOINT_QUALIFIED" if passed else "GCC4Z_V06_PHYSICAL_ENDPOINT_QUALIFICATION_FAILED"
    output=Path(output); output.mkdir(parents=True,exist_ok=True)
    (output/"GCC4Z_V06_PHYSICAL_ENDPOINT_QUALIFICATION.evidence.json").write_text(json.dumps(evidence,indent=2,sort_keys=True)+"\n",encoding="utf-8")
    lines=["# GCC-4Z physical endpoint qualification","",f"Status: `{evidence['status']}`","",f"GPU: `{evidence['environment'].get('gpu_model','UNKNOWN')}`","",f"Candidate: `{evidence['identity'].get('candidate_id','UNKNOWN')}`","","## Gates",""]
    lines += [f"- {'PASS' if gate['passed'] else 'OBSERVATION' if not gate.get('fatal',True) else 'FAIL'} - `{gate['name']}` ({gate.get('taxonomy','physical_serving')})" for gate in evidence["gates"]]
    (output/"GCC4Z_V06_PHYSICAL_ENDPOINT_QUALIFICATION.md").write_text("\n".join(lines)+"\n",encoding="utf-8")
    return evidence["status"]
