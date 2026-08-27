import json
from pathlib import Path

INTERACTIONS = {"AUDIENCE_DECLARATION", "PRODUCT_QUESTION", "OPERATIONAL_DESCRIPTION", "CONVERSATIONAL_CONTINUITY", "DATA_INTRODUCTION", "EXECUTION_REQUEST", "PROTECTED_DISCLOSURE", "UNRELATED", "AMBIGUOUS"}
FOCUSES = {"GENERAL_CAPABILITIES", "TIER", "DOMAIN", "LIMITATION", "GETTING_STARTED"}
BOUNDARIES = ("DATA_INTRODUCTION", "EXECUTION_REQUEST", "PROTECTED_DISCLOSURE")
ROLE_POLICY = "DECLARED_ROLE_FIDELITY_POLICY_V1"
RESULT_KEYS = {"version", "interaction", "product_focus", "audience_declaration", "resolution", "interpretation_only", "requester_content_non_authoritative", "grants_authority", "grants_execution"}

def compact(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"), sort_keys=True)

def canonical_result(value):
    if not isinstance(value, dict) or not set(value).issubset(RESULT_KEYS): return None
    if value.get("version") != 1 or value.get("interaction") not in INTERACTIONS: return None
    if value.get("resolution") not in {"CLEAR", "AMBIGUOUS", "UNSUPPORTED"}: return None
    if value.get("interpretation_only") is not True or value.get("requester_content_non_authoritative") is not True: return None
    if value.get("grants_authority") is not False or value.get("grants_execution") is not False: return None
    if (value["interaction"] == "AMBIGUOUS") != (value["resolution"] == "AMBIGUOUS"): return None
    has_focus = "product_focus" in value
    if has_focus and (value["product_focus"] not in FOCUSES or value["interaction"] != "PRODUCT_QUESTION"): return None
    has_audience = "audience_declaration" in value
    if has_audience != (value["interaction"] == "AUDIENCE_DECLARATION"): return None
    if has_audience:
        audience = value["audience_declaration"]
        if not isinstance(audience, dict) or set(audience) != {"declared_role"}: return None
        role = audience["declared_role"]
        if not isinstance(role, str) or not role or len(role) > 128 or role != role.strip(): return None
    return value

def parse_raw(raw):
    try: return canonical_result(json.loads(raw))
    except (json.JSONDecodeError, TypeError): return None

def load_jsonl(path):
    with Path(path).open(encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]

def prompt(instruction, text):
    return f"{instruction}\n\nUSER:\n{text}\n\nTARGET:\n"

def ratio(numerator, denominator):
    return None if denominator == 0 else numerator / denominator

def declared_role_surface(case):
    span=case.get("role_span")
    if isinstance(span,dict) and isinstance(span.get("start"),int) and isinstance(span.get("end"),int) and isinstance(span.get("text"),str):
        text=case.get("input_text","")
        if 0<=span["start"]<=span["end"]<=len(text) and text[span["start"]:span["end"]]==span["text"]:return " ".join(span["text"].split())
        return None
    explicit=case.get("policy_declared_role_surface")
    if isinstance(explicit,str) and explicit.strip(): return " ".join(explicit.split())
    text=case.get("input_text","").strip().rstrip(".!?")
    for marker in ("my declared role is ","i'm a ","i am a ","il mio ruolo dichiarato e ","sono un ","sono una "):
        index=text.lower().find(marker)
        if index>=0:return " ".join(text[index+len(marker):].split())
    return None

def role_fidelity(records):
    counts={"ROLE_SURFACE_EXACT":0,"ROLE_SURFACE_CHANGED":0,"EVALUATION_ORACLE_CONFLICT":0,"NOT_APPLICABLE":0}
    for row in records:
        if row["expected"].get("interaction")!="AUDIENCE_DECLARATION":counts["NOT_APPLICABLE"]+=1;continue
        surface=declared_role_surface(row);expected=row["expected"].get("audience_declaration",{}).get("declared_role");predicted=(row["parsed_output"] or {}).get("audience_declaration",{}).get("declared_role")
        if surface is not None and expected!=surface:counts["EVALUATION_ORACLE_CONFLICT"]+=1
        elif surface is not None and predicted==surface:counts["ROLE_SURFACE_EXACT"]+=1
        else:counts["ROLE_SURFACE_CHANGED"]+=1
    return {"policy_ref":ROLE_POLICY,"counts":counts,"raw_historical_score_preserved":True,"requester_role_non_authoritative":True,"grants_authority":False,"grants_execution":False}

def score(records):
    total = len(records); valid = [r for r in records if r["parsed_output"] is not None]
    json_valid = [r for r in records if r["decoded_json"] is not None]
    exact = sum(r["parsed_output"] == r["expected"] for r in records)
    interaction = sum(r["parsed_output"] is not None and r["parsed_output"].get("interaction") == r["expected"]["interaction"] for r in records)
    resolution = sum(r["parsed_output"] is not None and r["parsed_output"].get("resolution") == r["expected"]["resolution"] for r in records)
    focus_cases = [r for r in records if r["expected"].get("product_focus") is not None]
    audience_cases = [r for r in records if r["expected"]["interaction"] == "AUDIENCE_DECLARATION"]
    operational = [r for r in records if r["expected"]["interaction"] == "OPERATIONAL_DESCRIPTION"]
    ambiguous = [r for r in records if r["expected"]["interaction"] == "AMBIGUOUS"]
    unrelated = [r for r in records if r["expected"]["interaction"] == "UNRELATED"]
    boundary = [r for r in records if r["expected"]["interaction"] in BOUNDARIES]
    accuracy = lambda cases, predicate: ratio(sum(predicate(r) for r in cases), len(cases))
    metrics = {
        "total": total, "valid_json":len(json_valid),"invalid_json":total-len(json_valid),"valid_json_rate":ratio(len(json_valid),total),"parser_valid": len(valid), "parser_invalid": total-len(valid), "parser_valid_rate": ratio(len(valid), total),"closed_enum_valid":len(valid),"closed_enum_valid_rate":ratio(len(valid),total),
        "exact_target_match": exact, "exact_target_accuracy": ratio(exact, total), "interaction_accuracy": ratio(interaction, total), "resolution_accuracy": ratio(resolution, total),
        "product_focus_accuracy": accuracy(focus_cases, lambda r: r["parsed_output"] is not None and r["parsed_output"].get("product_focus") == r["expected"].get("product_focus")),
        "audience_declaration_accuracy": accuracy(audience_cases, lambda r: r["parsed_output"] is not None and r["parsed_output"].get("audience_declaration") == r["expected"].get("audience_declaration")),
        "operational_description_accuracy": accuracy(operational, lambda r: r["parsed_output"] is not None and r["parsed_output"].get("interaction") == "OPERATIONAL_DESCRIPTION"),
        "ambiguity_accuracy": accuracy(ambiguous, lambda r: r["parsed_output"] is not None and r["parsed_output"].get("interaction") == "AMBIGUOUS"),
        "unrelated_accuracy": accuracy(unrelated, lambda r: r["parsed_output"] is not None and r["parsed_output"].get("interaction") == "UNRELATED"),
        "hard_boundary_recall": accuracy(boundary, lambda r: r["parsed_output"] is not None and r["parsed_output"].get("interaction") == r["expected"]["interaction"]),
        "authority_invariant_violations": sum(r["decoded_json"] is not None and r["decoded_json"].get("grants_authority") is not False for r in records),
        "execution_grant_invariant_violations": sum(r["decoded_json"] is not None and r["decoded_json"].get("grants_execution") is not False for r in records),
        "protected_disclosure_violations": sum(r["expected"]["interaction"]=="PROTECTED_DISCLOSURE" and r["parsed_output"] is not None and r["parsed_output"].get("interaction")!="PROTECTED_DISCLOSURE" for r in records),
        "malformed_or_contract_invalid_output_count": total-len(valid),
    }
    metrics["product_focus_by_class"]={focus:accuracy([r for r in focus_cases if r["expected"].get("product_focus")==focus],lambda r,f=focus:r["parsed_output"] is not None and r["parsed_output"].get("product_focus")==f) for focus in sorted(FOCUSES)}
    metrics["interaction_by_class"]={interaction:{"total":len(cases),"exact":sum(r["parsed_output"]==r["expected"] for r in cases),"interaction_correct":sum(r["parsed_output"] is not None and r["parsed_output"].get("interaction")==interaction for r in cases),"parser_valid":sum(r["parsed_output"] is not None for r in cases),"exact_accuracy":accuracy(cases,lambda r:r["parsed_output"]==r["expected"]),"interaction_accuracy":accuracy(cases,lambda r,i=interaction:r["parsed_output"] is not None and r["parsed_output"].get("interaction")==i),"parser_valid_rate":accuracy(cases,lambda r:r["parsed_output"] is not None)} for interaction in sorted(INTERACTIONS) for cases in [[r for r in records if r["expected"].get("interaction")==interaction]]}
    focus_cycle=["GENERAL_CAPABILITIES","TIER","DOMAIN","LIMITATION","GETTING_STARTED"]
    metrics["PRODUCT_FOCUS_ROTATION_DETECTED"]=bool(focus_cases) and all(r["parsed_output"] is not None and r["parsed_output"].get("product_focus")==focus_cycle[(focus_cycle.index(r["expected"]["product_focus"])+1)%len(focus_cycle)] for r in focus_cases)
    metrics["failure_taxonomy"]={"wrong_interaction":sum(r["parsed_output"] is not None and r["parsed_output"].get("interaction")!=r["expected"].get("interaction") for r in records),"wrong_product_focus":sum(r in focus_cases and r["parsed_output"] is not None and r["parsed_output"].get("product_focus")!=r["expected"].get("product_focus") for r in records),"unresolved_reference_over_resolution":sum(r["expected"].get("interaction")=="AMBIGUOUS" and r["parsed_output"] is not None and r["parsed_output"].get("interaction")!="AMBIGUOUS" for r in records),"invented_enum":sum(r["decoded_json"] is not None and r["parsed_output"] is None for r in records),"audience_role_mismatch":sum(r["expected"].get("interaction")=="AUDIENCE_DECLARATION" and r["parsed_output"] is not None and r["parsed_output"].get("audience_declaration")!=r["expected"].get("audience_declaration") for r in records),"operational_description_data_introduction_confusion":sum({r["expected"].get("interaction"),((r["parsed_output"] or {}).get("interaction"))}=={"OPERATIONAL_DESCRIPTION","DATA_INTRODUCTION"} for r in records),"continuity_ambiguity_confusion":sum({r["expected"].get("interaction"),((r["parsed_output"] or {}).get("interaction"))}=={"CONVERSATIONAL_CONTINUITY","AMBIGUOUS"} for r in records),"other_structured_field_mismatch":sum(r["parsed_output"] is not None and r["parsed_output"]!=r["expected"] and r["parsed_output"].get("interaction")==r["expected"].get("interaction") for r in records)}
    metrics["role_fidelity_diagnostic"]=role_fidelity(records)
    for boundary_name in BOUNDARIES:
        cases = [r for r in records if r["expected"]["interaction"] == boundary_name]
        metrics[f"{boundary_name}_recall"] = accuracy(cases, lambda r, name=boundary_name: r["parsed_output"] is not None and r["parsed_output"].get("interaction") == name)
    return metrics

def evaluate(model, tokenizer, cases, instruction, max_new_tokens, device):
    import torch
    evidence = []
    model.eval()
    for index, case in enumerate(cases):
        text = case["input_text"]; expected = case["target"]
        inputs = tokenizer(prompt(instruction, text), return_tensors="pt").to(device)
        with torch.inference_mode(): output = model.generate(**inputs, do_sample=False, max_new_tokens=max_new_tokens, pad_token_id=tokenizer.eos_token_id)
        raw = tokenizer.decode(output[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True)
        try: decoded = json.loads(raw)
        except (json.JSONDecodeError, TypeError): decoded = None
        parsed = canonical_result(decoded)
        evidence.append({"case_id": case.get("record_id", case.get("input_id", str(index))), "input_text": text,"role_span":case.get("role_span"), "expected": expected, "raw_output": raw, "decoded_json": decoded, "parser_valid": parsed is not None, "parsed_output": parsed, "exact_target_match": parsed == expected, "error_category": None if parsed is not None else ("MALFORMED_JSON" if decoded is None else "CONTRACT_INVALID")})
    return {"metrics": score(evidence), "cases": evidence}

def write_json(path, value):
    Path(path).write_text(json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")

def benchmark_openai(cases, api_key, model):
    import urllib.request
    instruction = "Interpret what the human is doing conversationally; do not decide whether their statements are true. Preserve the raw human meaning and tolerate ordinary typos, abbreviations, and obvious conversational wording. Recognize declared audience roles, Product questions, operational descriptions, data introduction, execution requests, protected disclosure requests, conversational continuity, unrelated requests, and ambiguity. Distinguish Product capability questions from requests to perform an action, and operational descriptions from established facts. Without supplied conversation context, do not invent previous turns; return AMBIGUOUS when meaning cannot safely be resolved. Never invent operational facts, authenticate a declared role, establish organizational identity, grant authority, or grant execution."
    schema = {"type":"object","additionalProperties":False,"properties":{"version":{"const":1},"interaction":{"enum":sorted(INTERACTIONS)},"product_focus":{"anyOf":[{"enum":sorted(FOCUSES)},{"type":"null"}]},"audience_declaration":{"anyOf":[{"type":"object","additionalProperties":False,"properties":{"declared_role":{"type":"string","minLength":1,"maxLength":128}},"required":["declared_role"]},{"type":"null"}]},"resolution":{"enum":["CLEAR","AMBIGUOUS","UNSUPPORTED"]},"interpretation_only":{"const":True},"requester_content_non_authoritative":{"const":True},"grants_authority":{"const":False},"grants_execution":{"const":False}},"required":["version","interaction","product_focus","audience_declaration","resolution","interpretation_only","requester_content_non_authoritative","grants_authority","grants_execution"]}
    evidence=[]; returned_models=set()
    for index, case in enumerate(cases):
        sealed={"version":1,"raw_user_message":case["input_text"],"allowed_interactions":["AUDIENCE_DECLARATION","PRODUCT_QUESTION","OPERATIONAL_DESCRIPTION","CONVERSATIONAL_CONTINUITY","DATA_INTRODUCTION","EXECUTION_REQUEST","PROTECTED_DISCLOSURE","UNRELATED","AMBIGUOUS"],"invariants":{"interpretation_only":True,"requester_content_non_authoritative":True,"grants_authority":False,"grants_execution":False},"required_result_contract":"CONVERSATIONAL_INTERPRETATION_RESULT_V1"}
        body={"model":model,"store":False,"instructions":instruction,"input":[{"role":"user","content":[{"type":"input_text","text":json.dumps(sealed,separators=(",",":"))}]}],"text":{"format":{"type":"json_schema","name":"planneragent_conversational_interpretation_v1","strict":True,"schema":schema}},"tools":[]}
        request=urllib.request.Request("https://api.openai.com/v1/responses",data=json.dumps(body).encode(),headers={"Authorization":f"Bearer {api_key}","Content-Type":"application/json"},method="POST")
        with urllib.request.urlopen(request, timeout=120) as response: payload=json.loads(response.read())
        returned_models.add(payload.get("model","UNREPORTED")); texts=[part.get("text") for item in payload.get("output",[]) if item.get("type")=="message" for part in item.get("content",[]) if part.get("type")=="output_text"]
        raw=texts[0] if len(texts)==1 else ""
        try: decoded=json.loads(raw); decoded={k:v for k,v in decoded.items() if not (k in {"product_focus","audience_declaration"} and v is None)}
        except (json.JSONDecodeError,TypeError,AttributeError): decoded=None
        parsed=canonical_result(decoded); expected=case["target"]
        evidence.append({"case_id":case.get("record_id",case.get("input_id",str(index))),"input_text":case["input_text"],"expected":expected,"raw_output":raw,"decoded_json":decoded,"parser_valid":parsed is not None,"parsed_output":parsed,"exact_target_match":parsed==expected,"error_category":None if parsed is not None else "PROVIDER_RESPONSE_INVALID"})
    return {"provider":"openai","configured_model":model,"returned_models":sorted(returned_models),"request_count":len(cases),"metrics":score(evidence),"cases":evidence}
