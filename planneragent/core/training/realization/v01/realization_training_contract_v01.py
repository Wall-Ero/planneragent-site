import json

REALIZATION_ANSWER_MAX_LENGTH_V1 = 16_384

def compact(value):
    return json.dumps(
        value,
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    )

def prompt(instruction, input_text):
    return f"{instruction}\n\nREQUEST:\n{input_text}\n\nTARGET:\n"

def parse_realization_envelope_v1(raw):
    if not isinstance(raw, str) or not raw:
        return None

    try:
        value = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return None

    if not isinstance(value, dict):
        return None

    if set(value.keys()) != {"version", "answer"}:
        return None

    if value.get("version") != 1:
        return None

    answer = value.get("answer")
    if not isinstance(answer, str):
        return None

    answer = answer.strip()
    if not answer or len(answer) > REALIZATION_ANSWER_MAX_LENGTH_V1:
        return None

    return {
        "version": 1,
        "answer": answer,
    }
