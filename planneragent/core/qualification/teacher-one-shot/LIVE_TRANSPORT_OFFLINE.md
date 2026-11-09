# STEP 13J — isolated live transport, qualified OFFLINE

Target status: `CLOUDFLARE_ONE_SHOT_LIVE_TRANSPORT_OFFLINE_QUALIFIED`.
This is not authorization to infer. Teacher remains DISABLED and SHADOW.
No account/API/Student call, credential creation/read, deployment, GPU, training,
dataset change, D1 migration or automatic commit is part of this qualification.

## Components and reuse

- `live.contracts.ts`: fixed account/model/endpoint, manifest and minimal receipt;
  unconditional live denial; future dedicated-token boundary with no acquisition.
- `live.http.ts`: injectable, data-only response fixture client; native HTTPS
  implementation behind an unconditional denial before request construction/I/O.
- `live.journal.ts`: live-specific reservation and exclusive dispatch permission.
- `live.transport.ts`: one-request orchestration, bounded reading, native REST
  parsing, existing Realization parser and source-bound verifier.
- `live.fixtures.ts`: authored synthetic HTTP/completion data, not captured traffic.
- `live.offline.cli.ts`: inspection or one fixed-location injected demonstration.
- `local-state.ts`: exactly the exclusive synced writer extracted from 13H, shared
  by both journals; 13H admission/limits/CLI behavior are otherwise unchanged.

Reuse includes the 13H frozen artifact/digest/limits, 13F pure serializer (through
the frozen-payload inspection), qualified Realization exposure, Answer Plan,
public Voice and verifier. No offline adapter/provider router is rebuilt. The old
mock supervisor/quota and its required synthetic Neuron records are not disguised
as live accounting. The new receipt extends only this local experiment's result,
not operational memory or the business ledger. D1 stays DESIGN_READY/DEFERRED.

## Hard disable and credential isolation

`HardDisabledHttpsClientV1.post` always calls `denyRealDispatchV1()` before touching
inputs, creating an agent or opening a socket. This cannot be enabled by an env,
credential, argument or passing tests. `runInjectedLiveTransportExperimentV1`
admits only the exact data-only fixture client and isolated fixture journal;
native and arbitrary callback clients are denied before reservation.

There is no credential loader, secret store reader, env fallback, OAuth reader,
token CLI argument or existing Worker-secret access. The only authorization used
is an explicitly invalid offline placeholder, never an API token. Captured request
inspection always replaces Authorization with `Bearer [REDACTED]`. Receipts omit
headers, raw errors, raw provider bodies, provider messages and reasoning.

The future credential contract requires one account and Workers AI only. The
[REST guide](https://developers.cloudflare.com/workers-ai/get-started/rest-api/)
requires Read and Edit while the [endpoint reference](https://developers.cloudflare.com/api/resources/ai/methods/run/)
lists Read or Write. The conflict must be rechecked before provisioning. No claim
that an existing OAuth credential has least privilege is made. Lightning, Student,
OpenRouter and existing Worker credentials are neither loaded nor contacted.

## Fixed destination and dispatch protocol

The only destination is the native HTTPS Workers AI endpoint for account
`efd250d57d6fad4a3c4ca458fc20c550` and `@cf/qwen/qwen3-30b-a3b-fp8`.
The request contains exactly the 2,094-byte 13H body with digest
`sha256:74dce8541223ec4723953eeeb990970be3c4c6b70e372d4e3436c61ff1ac2764`.
It is a nonstreaming POST with 512 output tokens and no tools/fallback/discovery.
No configurable destination/account/model/payload is accepted. TLS validation is
enabled in the dormant native backend; it has no redirect/retry mechanism.

The live state location is fixed relative to this module: `live-state/`.
It is not a manifest override, cwd/env choice or CLI option. An offline fixture
factory virtualizes storage for tests only; it cannot authorize real dispatch.
The enabled demonstration instead uses fixed `injected-demo-state/`.

1. Validate exact fixture manifest, frozen payload, authorization placeholder and
   canonical public exposure before admission.
2. Exclusively create/sync `reserved.json`: experiment identity, payload digest,
   model, account, authorization evidence reference, authorized location and state.
3. Exclusively create/sync `dispatch.json`: permission permanently consumed. Check
   the full reserved record against its in-process canonical snapshot first.
4. Only then invoke the injected client once. No retry, secondary request or refund.
5. Exclusively create/sync `result.json` and stop, regardless of outcome.

After process reconstruction there is no dispatch capability. Existing, partial,
corrupt or conflicting markers block reservation/recovery. A crash after either
marker, or an error writing the receipt, cannot cause automatic resending. The
13H `local-state` demonstration is separate and must never be deleted/reused.

Existing ancestor symlinks/junctions are rejected. This is a trusted local filesystem
gate using exclusive creation/fsync, not a distributed/tamper-proof authorization
system or power-loss guarantee. Operator deletion, disk rollback or editing the
program remains outside its guarantee; there is no built-in reset/move/repair.

## Deadline, response limits and acceptance

One 30-second deadline covers client invocation, headers and the complete body.
Abort closes the response and cancels fixture waits. It is not restarted per chunk.
The reader counts bytes incrementally, retains at most 65,536 bytes, rejects an
oversized declared length early, and rejects inconsistent lengths. Empty chunks
are not retained. It rejects changed origins/paths, every redirect, SSE/HTML and
other media types, ambiguous headers, unsupported encodings and invalid UTF-8.
`Accept-Encoding: identity` avoids decompression ambiguity; compressed bodies are
rejected, not automatically expanded. All failures consume the attempt.

The parser requires the native REST wrapper (`success`, `errors`, `result`, optional
`messages`), successful status, one completion with valid ID/created/object/model,
index zero, assistant role, stop finish reason and no tool calls/truncation.
`reasoning_content` may be a string but is discarded, never joined to the answer,
logged, returned or persisted. The structured Realization parser and existing
whole-answer source-bound verifier then run separately. Free-form prose remains
INCONCLUSIVE. Linguistic quality always needs independent review. The local receipt
holds only candidate digest/verification, not candidate or reasoning plaintext.

Provider input/output/total token counts are validated independently. Missing usage
is UNKNOWN; negative, inconsistent or >512 output-token usage is INCONSISTENT.
Neither condition is accepted as successful completion. Semantic checks may still
PASS for exact canonical text while usage is rejected: these are distinct facts.
Actual Neuron consumption is UNKNOWN, never inferred from tokens or defaulted to
zero. Fixture receipts explicitly identify injected provenance and zero actual
network requests. No `offline_neurons` is injected into this path.

Provider errors are numeric codes only; quota 3036, Paid-required 5035, capacity
3040 and timeout errors are all terminal. Connection/body failures and the local
deadline produce UNCERTAIN with permission consumed. No raw provider message is
copied into exceptions/receipts. Public response is unaffected because this local
path has no public response mutation/integration. There is no training or Student
qualification path, even for a semantically verified shadow candidate.

## Offline commands

From `planneragent/core`:

```powershell
node node_modules/vite-node/vite-node.mjs --script qualification/teacher-one-shot/live.offline.cli.ts --inspect
node node_modules/vite-node/vite-node.mjs --script qualification/teacher-one-shot/live.offline.cli.ts --offline-demo
node node_modules/vitest/vitest.mjs run --config vitest.teacher.live.transport.offline.config.mts --no-cache
```

The demonstration's second invocation is denied. The CLI accepts no live flag,
state directory, token or prompt arguments. Real state is not initialized by it.
All state directories are ignored by Git. Tests use temporary isolated directories
and never the live or 13H demonstration locations.

## Remaining live blockers and one next step

Mock HTTP qualification proves local behavior, NOT hosted compatibility, capacity,
socket behavior, quota availability or live model quality. The native I/O branch is
deliberately unreachable and has not been exercised. Model-specific input schema
advertises JSON Schema but the generic feature list omits this candidate. Generic
examples also show legacy response forms; no fallback is introduced. Reasoning
budget/template behavior and the true input token bound remain unqualified.

Before any future live activation: operator-verified current Workers Free/no Paid,
no payment method, current model eligibility, measured dashboard usage/residual,
no Gateway prepaid route, dedicated-token metadata and scope, reviewed payload,
one fixed authorization-bound experiment and explicit operator permission are all
required. No prerequisite is inferred from a mock PASS. Activation needs a separate
reviewed change/authorization; removing a guard alone is not an activation protocol.

Single next operational step: acquire dated, non-secret Workers AI dashboard
evidence of current daily usage and remaining Free quota. Do not run inference.

## Recorded offline verification — 2026-10-21

- 340/340 tests passed in nine suites: 75 STEP13J tests plus 265 prior regressions.
- Focused strict TypeScript checking passed with no emission for both local CLIs
  and all their imported modules.
- Tests intercept fetch and native HTTPS. Child-process fault injection also
  forbids network access; crashes after reservation/dispatch/terminal fsync all
  prevent a second attempt on restart.
- CLI inspection reports `real_dispatch_enabled:false`; injected demonstration
  exits 0 with one injected POST, zero actual network requests, known fixture
  token counts, Neurons UNKNOWN and canonical-fixture semantic PASS in SHADOW.
- Repeating the demonstration exits 1. Its markers/receipt remain in the ignored
  `injected-demo-state/` directory. They contain no raw answer/reasoning/headers.
- Hashes of both 13H demonstration files match before and after this run. The
  fixed `live-state/` directory was not created. No credential was acquired.

The source review and offline results do not establish hosted response behavior
or qualify the dormant socket branch for live operation.
