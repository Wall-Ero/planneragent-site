INTERACTIONS=("AUDIENCE_DECLARATION","PRODUCT_QUESTION","OPERATIONAL_DESCRIPTION","CONVERSATIONAL_CONTINUITY","DATA_INTRODUCTION","EXECUTION_REQUEST","PROTECTED_DISCLOSURE","UNRELATED","AMBIGUOUS")
FOCUSES=("GENERAL_CAPABILITIES","TIER","DOMAIN","LIMITATION","GETTING_STARTED")
INVARIANTS={"interpretation_only":True,"requester_content_non_authoritative":True,"grants_authority":False,"grants_execution":False}
REQUEST_KEYS={"version","raw_user_message","allowed_interactions","invariants","required_result_contract"}; RESULT_KEYS={"version","interaction","product_focus","audience_declaration","resolution",*INVARIANTS}
def enforce_byte_limit(body,maximum):
    if len(body)>maximum: raise ValueError("REQUEST_TOO_LARGE")
def validate_request(v):
    if not isinstance(v,dict) or set(v)!=REQUEST_KEYS or v.get("version")!=1 or not isinstance(v.get("raw_user_message"),str) or not v["raw_user_message"]: raise ValueError("INVALID_REQUEST_CONTRACT")
    if tuple(v.get("allowed_interactions",()))!=INTERACTIONS or v.get("invariants")!=INVARIANTS or v.get("required_result_contract")!="CONVERSATIONAL_INTERPRETATION_RESULT_V1": raise ValueError("INVALID_REQUEST_CONTRACT")
    return v["raw_user_message"]
def validate_result(v):
    if not isinstance(v,dict) or not set(v)<=RESULT_KEYS or v.get("version")!=1 or v.get("interaction") not in INTERACTIONS or v.get("resolution") not in ("CLEAR","AMBIGUOUS","UNSUPPORTED"): raise ValueError("INVALID_RESULT_CONTRACT")
    if any(v.get(k)!=x for k,x in INVARIANTS.items()) or ((v["interaction"]=="AMBIGUOUS")!=(v["resolution"]=="AMBIGUOUS")): raise ValueError("INVALID_RESULT_INVARIANTS")
    if ("product_focus" in v) and (v["interaction"]!="PRODUCT_QUESTION" or v["product_focus"] not in FOCUSES): raise ValueError("INVALID_PRODUCT_FOCUS")
    if ("audience_declaration" in v)!=(v["interaction"]=="AUDIENCE_DECLARATION"): raise ValueError("INVALID_AUDIENCE_DECLARATION")
    if "audience_declaration" in v:
        a=v["audience_declaration"]
        if not isinstance(a,dict) or set(a)!={"declared_role"} or not isinstance(a["declared_role"],str) or not 0<len(a["declared_role"])<=128 or a["declared_role"]!=a["declared_role"].strip(): raise ValueError("INVALID_AUDIENCE_DECLARATION")
    return v
