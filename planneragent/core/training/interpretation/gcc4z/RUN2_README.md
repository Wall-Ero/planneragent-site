# GCC-4Z Run-2 external GPU qualification handoff

This is the Run-2 handoff. It does not contain the model archive or Run-1 evidence. Run-1 remains failed and immutable.

Upload this ZIP and `PA-INTERPRETATION-STUDENT-v0.6-GCC4W.zip` separately into the same browser/JupyterLab directory on an Ampere-or-newer Linux GPU host.

```sh
unzip PA-INTERPRETATION-STUDENT-v0.6-GCC4Z-RUN2-HANDOFF.zip
cd PA-INTERPRETATION-STUDENT-v0.6-GCC4Z-RUN2-HANDOFF
sha256sum --check SHA256SUMS
chmod +x scripts/*.sh
./scripts/setup_external_gpu.sh
export STUDENT_ARTIFACT_PATH="$(realpath ../PA-INTERPRETATION-STUDENT-v0.6-GCC4W.zip)"
export STUDENT_BEARER_TOKEN="$(openssl rand -hex 32)"
./.venv/bin/python -m pytest -q scripts/test_qualifier_policy.py service/tests/test_foundation.py
./.venv/bin/python scripts/qualify.py
```

The runner starts and restarts the unchanged GCC-4Y service itself. Do not run it on a T4. It fails unless CUDA is available, compute capability is at least 8.0, and BF16 is supported. It verifies the external model ZIP before model load and writes new Run-2 results under `output/`.

Do not copy Run-1 evidence into this directory. Request plaintext and the bearer token are omitted from generated evidence. Qualification does not enable Core shadow, train, or modify evaluation corpora.
