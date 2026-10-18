import json
from pathlib import Path
from transformers import AutoTokenizer

HERE = Path(__file__).resolve().parent
CORPUS = HERE / "corpus-diverse"
CONFIG = json.loads((HERE / "experiment.config.json").read_text(encoding="utf-8-sig"))

SPLITS = ("train", "validation", "qualification", "holdout", "adversarial")

from realization_training_contract_v01 import compact, prompt

tokenizer = AutoTokenizer.from_pretrained(
    CONFIG["base_model"],
    revision=CONFIG["base_revision"],
)

limit = CONFIG["max_sequence_length"]
records = []

for split in SPLITS:
    path = CORPUS / f"{split}.jsonl"
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue

        row = json.loads(line)
        prefix = prompt(CONFIG["instruction"], row["input_text"])
        target = compact(row["target"]) + tokenizer.eos_token

        prefix_tokens = len(tokenizer(prefix, add_special_tokens=True)["input_ids"])
        target_tokens = len(tokenizer(target, add_special_tokens=False)["input_ids"])
        total_tokens = len(
            tokenizer(
                prefix + target,
                add_special_tokens=True,
                truncation=False,
            )["input_ids"]
        )

        records.append({
            "record_id": row["record_id"],
            "split": split.upper(),
            "family": row["family"],
            "language": row["language"],
            "prefix_tokens": prefix_tokens,
            "target_tokens": target_tokens,
            "total_tokens": total_tokens,
        })

lengths = [r["total_tokens"] for r in records]
ordered = sorted(lengths)

def percentile(p):
    if not ordered:
        return None
    index = round((len(ordered) - 1) * p)
    return ordered[index]

exceeding = [r for r in records if r["total_tokens"] > limit]
near_limit = sorted(records, key=lambda r: r["total_tokens"], reverse=True)[:20]

report = {
    "candidate_id": CONFIG["candidate_id"],
    "base_model": CONFIG["base_model"],
    "base_revision": CONFIG["base_revision"],
    "measured_records": len(records),
    "seq_limit": limit,
    "min_tokens": min(lengths),
    "max_tokens": max(lengths),
    "p50_tokens": percentile(0.50),
    "p95_tokens": percentile(0.95),
    "p99_tokens": percentile(0.99),
    "records_exceeding_limit": len(exceeding),
    "decision": (
        "SEQ2048_PHYSICAL_PREFLIGHT_PASS"
        if len(exceeding) == 0
        else "SEQ2048_PHYSICAL_PREFLIGHT_FAIL"
    ),
    "largest_records": near_limit,
}

(HERE / "sequence-length.preflight.json").write_text(
    json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
    encoding="utf-8",
)

print(json.dumps(report, ensure_ascii=False, indent=2))
