import json
INSTRUCTION="Return only a PlannerAgent ConversationalInterpretationResultV1 JSON object matching the required contract."
CONTEXT_TOKENS=384
MAX_NEW_TOKENS=192
def training_prompt(text): return f"{INSTRUCTION}\n\nUSER:\n{text}\n\nTARGET:\n"
class InputTokenLimitExceeded(ValueError): pass
def resolve_dtype(torch,dtype_name):
    if dtype_name!="bf16": raise RuntimeError("UNSUPPORTED_CONFIGURED_DTYPE")
    if not torch.cuda.is_available() or not torch.cuda.is_bf16_supported(): raise RuntimeError("CONFIGURED_DTYPE_UNSUPPORTED_BY_HARDWARE")
    major,_minor=torch.cuda.get_device_capability()
    if major<8: raise RuntimeError("CONFIGURED_DTYPE_UNSUPPORTED_BY_COMPUTE_CAPABILITY")
    return torch.bfloat16
def encode_admitted_prompt(tokenizer,text):
    encoded=tokenizer(training_prompt(text),return_tensors="pt",truncation=False,add_special_tokens=True)
    if encoded["input_ids"].shape[1]+MAX_NEW_TOKENS>CONTEXT_TOKENS: raise InputTokenLimitExceeded("INPUT_TOKEN_LIMIT_EXCEEDED")
    return encoded
class StudentEngine:
    def __init__(self,adapter,identity,dtype_name):
        import torch
        from peft import PeftModel
        from transformers import AutoModelForCausalLM,AutoTokenizer
        dtype=resolve_dtype(torch,dtype_name)
        self.torch=torch; self.dtype_name=dtype_name; self.tokenizer=AutoTokenizer.from_pretrained(adapter,local_files_only=True)
        base=AutoModelForCausalLM.from_pretrained(identity["base_model"],revision=identity["base_revision"],torch_dtype=dtype,device_map="auto")
        self.model=PeftModel.from_pretrained(base,adapter,is_trainable=False); self.model.eval()
    def encode_admitted_prompt(self,text):
        return encode_admitted_prompt(self.tokenizer,text)
    def interpret(self,text):
        encoded=self.encode_admitted_prompt(text).to(self.model.device)
        with self.torch.inference_mode(): output=self.model.generate(**encoded,max_new_tokens=MAX_NEW_TOKENS,do_sample=False,num_beams=1,pad_token_id=self.tokenizer.eos_token_id)
        raw=self.tokenizer.decode(output[0][encoded["input_ids"].shape[1]:],skip_special_tokens=True).strip()
        return json.loads(raw)
