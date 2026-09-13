#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python3.12 -m venv .venv
. .venv/bin/activate
python -m pip install --upgrade pip==25.2
python -m pip install -r service/requirements.lock
python - <<'PY'
import torch
assert torch.cuda.is_available(), "CUDA_UNAVAILABLE"
assert torch.cuda.get_device_capability()[0] >= 8, "GPU_COMPUTE_CAPABILITY_BELOW_8"
assert torch.cuda.is_bf16_supported(), "BF16_UNSUPPORTED"
print("GPU_PREFLIGHT_PASS", torch.cuda.get_device_name(), torch.cuda.get_device_capability())
PY
