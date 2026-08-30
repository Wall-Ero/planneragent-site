# GCC-4X v0.6 shadow serving and artifact ingestion

## Status and authority boundary

The Core shadow contract and orchestration are source-ready. The qualified v0.6 artifact is physically present and identity-verified locally; no physical serving runtime is asserted. Deterministic anonymous-conversation admission remains the only live routing authority. Shadow evidence is diagnostic and cannot affect responses, authority, execution, disclosure, identity, account, session, or organization state.

- `LOCAL_QUALIFIED_ARTIFACT_PRESENT`
- `LOCAL_ARTIFACT_IDENTITY_VERIFIED`

## Artifact ingestion

The immutable ingestion source for the next serving WU is the existing qualified artifact:

`core/training-artifacts/gcc4w/PA-INTERPRETATION-STUDENT-v0.6-GCC4W.zip`

Do not copy it into the previously reserved `training-artifacts/models/.../incoming` convention. The current GCC-4W location already provides the immutable experiment provenance, and duplicating 22 MB would create an unnecessary second identity surface. The exact artifact path is ignored by Git.

Before extraction or use, require all three checks:

```powershell
$artifact = "core/training-artifacts/gcc4w/PA-INTERPRETATION-STUDENT-v0.6-GCC4W.zip"
(Get-Item -LiteralPath $artifact).Length
(Get-FileHash -LiteralPath $artifact -Algorithm SHA256).Hash.ToLowerInvariant()
```

Expected size: `22782731` bytes.

Expected SHA-256: `f20989ac8397aa1788fcdd03c6027fb178e4489bc576a175f690029ac2eb9e1f`.

Local reconciliation on 2026-08-30 verified the outer size and SHA-256, candidate `PA-INTERPRETATION-STUDENT-v0.6`, lifecycle `TRAINED_CANDIDATE`, qualification `QUALIFIED_FOR_SHADOW`, and adapter digest `sha256:6ce46299667e0ba8f9b24b3558cc8b3ae110ef5bbcfb5c20a5f32ea022400ad3`. The adapter digest was independently recomputed by streaming `final-adapter/adapter/adapter_model.safetensors` directly from the ZIP and matched `candidate.manifest.json`.

The serving WU must still verify every internal hash and reject base-model or revision mismatch before loading. Do not commit the ZIP or other generated GCC-4W artifacts.

## Provider-neutral inference endpoint

The next serving WU must deploy a separately replaceable inference service that:

1. Loads the pinned base `Qwen/Qwen3-0.6B-Base` at revision `da87bfb608c14b7cf20ba1ce41287e8de496c0cd` and the verified v0.6 adapter.
2. Exposes an authenticated HTTPS `POST` endpoint.
3. Accepts `SealedConversationalInterpretationRequestV1` JSON.
4. Returns only `ConversationalInterpretationResultV1` JSON.
5. Performs no authority, execution, identity, organization, session, or Core routing work.
6. Has no automatic retries and no plaintext request retention.
7. Publishes health and immutable candidate-identity evidence separately from inference output.
8. Is physically tested for timeout, malformed output, illegal enums, invariant violations, and exact candidate identity before Core activation.

Core deliberately contains no Transformers, PEFT, Qwen runtime, Kaggle integration, or subprocess invocation.

## Local shadow activation

Configure the Core development environment with:

```text
INTERPRETATION_STUDENT_SHADOW_ENABLED=true
INTERPRETATION_STUDENT_ENDPOINT=https://<student-service>/v1/interpret
INTERPRETATION_STUDENT_AUTHORIZATION=<secret bearer value>
INTERPRETATION_STUDENT_TIMEOUT_MS=1500
```

Start Core normally. Confirm shadow evidence appears under event name `CONVERSATIONAL_INTERPRETATION_SHADOW_V1` and that `/conversation` responses are byte-for-byte unchanged with shadow disabled versus enabled.

## Production activation

1. Physically qualify the serving WU and endpoint identity.
2. Store `INTERPRETATION_STUDENT_AUTHORIZATION` as a Worker secret; never place it in `wrangler.toml`.
3. Set the endpoint and bounded timeout as non-secret configuration.
4. Deploy with `INTERPRETATION_STUDENT_SHADOW_ENABLED=false` first.
5. Run health and deterministic response regression checks.
6. Enable shadow only, then verify success/timeout/parser/boundary evidence. Do not promote to SECONDARY or PRIMARY.

## Rollback

Set `INTERPRETATION_STUDENT_SHADOW_ENABLED=false` and redeploy/reconfigure. The route omits the provider entirely when disabled or when the Worker execution-context scheduler is unavailable. No deterministic behavior or state rollback is required because shadow results are never consumed by the live path.
