# GCC-5D-S1 persistent qualified Student deployment contract

Readiness: DEPLOYABLE_PACKAGE_READY_PROVIDER_NOT_SELECTED.
GCC-5E is not started. Production shadow remains DISABLED.
No cloud account, deployment, lifecycle, weights, or Core configuration is changed.

## Package and lineage

Reuse the GCC-4Y service at commit 4e8ee5c, packaged unchanged by GCC-4Z
Run-2 `core/training/interpretation/gcc4z/build_run2_handoff.ps1`, and used by
GCC-5A. The original six application modules, Dockerfile and requirements.lock
remain unchanged. The S1 entry point wraps that service; it does not introduce
another inference protocol, prompt, tokenizer, model, or result contract.

The machine-readable inventory and exact identity are in
[deployment.manifest.json](deployment.manifest.json). Deploy only its eight
application files plus Dockerfile and requirements.lock, and retain the manifest
and this contract as deployment instructions. Tests, evidence, training scripts,
handoff ZIPs and notebooks are not runtime inputs.

Supply the qualified model ZIP separately through durable read-only storage.
Never add it to Git or a container build context. Use a clean build context
containing only Dockerfile, requirements.lock and the eight listed app files.
The existing Dockerfile copies only requirements.lock and app.

## Startup

Build with the existing Dockerfile. The deployment MUST override BOTH its
legacy command and unauthenticated healthcheck with the manifest commands.
From /service, run:

```sh
python3.12 -m uvicorn app.persistent:app --host 0.0.0.0 --port 8080 --workers 1 --no-access-log
```

Use `python3.12 -m app.probe` as the authenticated readiness probe; it reads
the bearer from the environment and exits without printing values or bodies.
The manifest carries health timing defaults; adjust startup grace only from
measured cold-start evidence. Never declare readiness just because a socket opens.

Inject absolute paths via STUDENT_ARTIFACT_PATH, STUDENT_CACHE_ROOT and HF_HOME.
The artifact must be a file; the cache directories must be writable by UID 10001.
Inject STUDENT_BEARER_TOKEN from the provider's secret store, never CLI literals,
tracked environment files or source. It must contain at least 32 printable ASCII
characters without whitespace; generate it with cryptographic randomness.
Optional settings default to STUDENT_DTYPE=bf16, STUDENT_MAX_CONCURRENCY=1 and
STUDENT_MAX_REQUEST_BYTES=16384. Only bf16 and concurrency one are accepted;
the byte limit may be an integer from 1 to 16384.

Startup validates configuration, archive existence/size/SHA-256, manifest candidate,
adapter digest, base model/revision and qualification, then verifies adapter bytes
before loading the pinned model. Each process extracts to a fresh private cache
directory, avoiding reuse of stale or modified adapter files. It validates CUDA,
native bf16 support and compute capability >=8 through the existing engine.
Missing artifacts/secrets, mismatched identity or SHA, invalid paths/settings,
unsupported dtype/GPU, download or model-load failure prevent readiness and
abort startup with PERSISTENT_STUDENT_STARTUP_FAILED. No fallback model/dtype exists.
Third-party startup exception text is suppressed; inference exceptions become a
fixed failure response. No request/response bodies or authorization headers may
be logged by ingress, supervisors, tracing or providers.

The existing dependency pins are reused (torch 2.10.0, transformers 4.51.3,
peft 0.20.0, accelerate 1.13.0, safetensors 0.6.2, fastapi 0.116.1,
uvicorn 0.35.0, pytest 8.4.1 and httpx 0.28.1). requirements.lock is not a
complete transitive/hash lock; preserve the built image digest when qualifying
a deployment. S1 does not claim a built or physically qualified container.

## Replaceable infrastructure requirements

Provide a persistent Linux GPU VM/container, Python 3.12, the existing CUDA
12.8.1/cuDNN runtime and compatible NVIDIA driver/container GPU support.
Provide restart supervision, stable HTTPS ingress and a stable endpoint reference.
Port 8080 is private; only HTTPS ingress is public. Bearer authorization protects
GET /health, GET /v1/identity and POST /v1/interpret. No browser tunnel, Quick
Tunnel or developer workstation may be required at runtime or restart.
Do not expose the legacy app.main entry point directly.

Store the archive durably and read-only. HF_HOME holds the exact pinned base
revision; pre-provision it or permit the existing model loader to download that
revision. HF_HUB_OFFLINE=1 is optional after provisioning the complete cache.
Never substitute another revision when offline/cache resolution fails. Only
runtime-owned processes may write caches. Per-process adapter extraction is
disposable; abrupt process termination can leave directories for bounded
operator cleanup while no process is using them.

NVIDIA L4 was physically demonstrated in GCC-4Z/GCC-5A development evidence.
The code requires native bf16 and compute capability >=8, not L4 specifically.
The old README's 4 GB VRAM/8 GB RAM suggestion is an unmeasured sizing floor,
not a proven minimum or guarantee. No repository evidence establishes minimum
VRAM, throughput, price or persistent capacity. Size for the pinned 0.6B base
and adapter, single concurrent inference, 384 total tokens and 192 maximum
generated tokens. Confirm placement, memory, cold-start latency and inference
latency physically before acceptance; the inherited device_map=auto is unchanged.
Capacity, vendor, budget alerts and stop procedures are deployment concerns.
No vendor is selected, required by Core, or a constitutional dependency.

## Core boundary

GCC-5D already stores exact serving pins and binding names through
QUALIFIED_STUDENT_SERVING_REFERENCE_V1. Future Core secret names are
INTERPRETATION_STUDENT_ENDPOINT and INTERPRETATION_STUDENT_AUTHORIZATION.
The latter carries the same raw bearer as STUDENT_BEARER_TOKEN; Core supplies
the HTTP Bearer prefix. Endpoint values belong only in runtime secrets.
INTERPRETATION_STUDENT_ENDPOINT_REFERENCE and
INTERPRETATION_STUDENT_CREDENTIAL_REFERENCE identify those existing names.

The S1 identity endpoint adds protocol_version=PA_STUDENT_HTTP_V1, which GCC-5D
checks, while preserving service_protocol_version=1 and all qualified identity
fields. Core requires an HTTPS endpoint ending /v1/interpret and authenticates
/v1/identity before inference. Its existing disabled-by-default resolver also
requires explicit governed window/sampling/kill-switch configuration before
controlled shadow. Endpoint availability alone cannot activate shadow.
Core retains truth, authority, routing and execution. No Core repair or activation
is needed or performed. No production configuration is written in S1.

## Future physical restart acceptance gate (NOT PASSED IN S1)

1. Start the persistent service with the manifest's pins, secrets and private GPU
   runtime, without any workstation/tunnel. Authenticate /health: require HTTP 200
   and exactly status=ready.
2. Authenticate /v1/identity: require HTTP 200 and exact equality with the manifest
   identity, including candidate, archive hash/size, adapter digest, base/revision,
   lifecycle/qualification, both protocol fields and effective_dtype=bf16.
3. Perform authenticated POST /v1/interpret using a synthetic, non-requester input
   in the existing contract; require HTTP 200 and a valid interpretation result.
4. Restart the actual service process/container under its supervisor, preserving
   durable artifact/base storage and stable ingress; do not merely reconnect a client.
5. Repeat health, exact identity and inference. Require identity identical to step 2.
   Verify unauthorized calls to all three routes fail and no sensitive logs appear.
6. Retain only identity, statuses, timings, restart evidence and contract-validity
   metadata. Do not retain endpoint/bearer values, prompts, completions or requester
   data in tracked evidence. Record GPU placement, memory and latency measurements.

Failure blocks acceptance. This gate does not authorize opening a GCC-5E window,
enabling production shadow or promoting lifecycle. Local stubbed tests are not
physical restart or inference evidence.

## S1 verification

Run only `python -m pytest -q tests/test_foundation.py tests/test_persistent.py`
from this service directory with the pinned lightweight test dependencies.
The new tests cover startup rejection, no model load on invalid inputs, CUDA/bf16
rejection, authenticated endpoints, exact identity/protocol, inference delegation,
fresh per-start caches, fixed privacy-safe errors and disabled production config.
The engine and positive artifact loading are stubbed; the SHA rejection uses the
real archive verifier. No full regression or repository-wide TypeScript diagnostics.

Verified locally in S1: 42 tests passed (Python 3.12.10), with three dependency/legacy
deprecation warnings. GPU/model execution was not performed. The original qualified
source files match commit 4e8ee5c. No files were staged or committed.
