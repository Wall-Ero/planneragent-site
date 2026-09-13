# GCC-5D durable shadow foundation

Extends GCC-5B (7b14f50) and GCC-5C (9638335). No real window, deployment, promotion, retraining or weight change occurs in this unit. Production remains disabled by default.

## Infrastructure and serving

Reuse Core's POLICIES_DB and core/migrations convention. No new datastore, control plane or public administration route. Core alone owns operational truth, routing, responses, authority and execution. Admission, inference and persistence run inside genuine ExecutionContext.waitUntil(), never awaited by the primary response.

The serving reference pins PA_STUDENT_HTTP_V1, qualified v0.6, artifact SHA-256/size, adapter digest, base model/revision and bf16 dtype. Only governed endpoint/credential binding names are retained. Endpoint and bearer values belong in runtime secrets, never Git or D1. Every inference first authenticates /v1/identity and verifies all pins, dtype and protocol. Failure prevents inference. Both HTTP calls reject redirects. The future service also requires authenticated /health readiness after artifact/model validation.

## Migration and operations

0035 adds immutable windows, append-only admissions, immutable observations, a window/observation index and integrity triggers. Existing tables/data are preserved. Tests use applyD1Migrations and SQLite integrity/foreign-key checks. No remote migration is applied. An externally applied earlier experimental 0035 must be reconciled explicitly; CREATE TABLE IF NOT EXISTS cannot upgrade an incompatible table definition.

Operations are internal and binding-scoped, for an already authorized Core/operator context. Constructors never write.

- start explicitly creates a UUID-shaped window with canonical UTC timestamp and immutable serving, policy and sampling pins. Duplicate IDs fail.
- status takes a D1 batch snapshot and returns deeply frozen metadata: identity/state/timestamps; eligible/sampled/completed counts; provider/contract failures; class/hard-boundary coverage; semantic/role/product-focus agreement; reliability; valid-contract rate; latency; and GCC-5C coverage. Only closed windows expose stored recommendations.
- close reuses committed GCC-5C deterministic replay and atomically saves CLOSED plus its result only when the snapshot revision still matches. Racing admission/append causes SHADOW_WINDOW_CLOSE_CONFLICT; the authorized caller can retry. Successful close rejects later admissions/completions. Already admitted external calls may finish, but cannot append afterward. There is no reopen.

Every admission/append increments revision atomically. D1 batches are transactional (https://developers.cloudflare.com/d1/worker-api/d1-database/); revision comparison protects the read/write gap. Triggers reject pin changes, deletes, historical updates and INSERT OR REPLACE rewrites even with recursive triggers off. Duplicate admissions are ignored without recounting; duplicate completions fail.

## Activation, recovery and privacy

Only DISABLED and CONTROLLED_SHADOW exist. Durable activation requires an explicit window, numeric sample rate, true/false kill switch, exact reference names, HTTPS runtime endpoint/bearer, D1 and bounded timeout. Missing/malformed config disables shadow. Endpoint presence never activates it. Missing/closed windows, mismatched pins/sampling and kill-switch activation prevent new Student calls. Configuration changes do not cancel old in-flight calls.

Counters measure durably admitted eligible requests. IDs are hashed; request_digest retains the same ID digest for GCC-5C compatibility, not a requester-content hash. Distinct observations need distinct request IDs. Duplicate rejection is global across reconstruction/windows.

Delivery is best effort with at-most-once durable admission/completion per ID, no automatic inference retry or queue, and no exactly-once claim. A crash after admission may leave sampled/completed gaps. Restart never silently retries, creates windows, changes pins, reopens windows, duplicates observations or alters frozen results. After an ambiguous close response, read status to determine whether commit succeeded.

Persistence accepts validated primitives, closed enums and canonical identity. Extra payload fields are discarded; invalid/incoherent values rejected. Plaintext, role text, prompts, completions, protected/source/organizational content, endpoint values and credentials are absent from storage/status. Errors become fixed failure classes; no console-payload fallback exists. Tests inspect rows, status and logs with hostile payload/error sentinels.

## Physical deployment prerequisite

The minimum suitable shape is one replaceable persistent GPU VM/container, serving process, restart supervisor, stable HTTPS ingress, secret injection and durable model/artifact storage. No vendor is selected or constitutionally required. Before GCC-5E, verify bf16 support and memory/latency for the pinned 0.6B base/adapter; verify hashes/revision before readiness; mount artifacts read-only; disable body/token logs; protect health/identity/inference; prove restart identity without workstation/tunnel; and set resource/concurrency limits, budget alerts and an operator stop procedure.

Runpod Pods are one replaceable example, not a selection. Storage documentation distinguishes ephemeral disks from durable volumes (https://docs.runpod.io/pods/storage/types); stopping releases GPU allocation (https://docs.runpod.io/pods/troubleshooting/zero-gpus). Durable storage alone does not prove restart availability or endpoint readiness. Capacity and cost remain procurement-time facts.

Normal tests use local D1 and stubbed HTTP. The actual Worker/waitUntil/D1 test proves local integration, not physical GPU readiness. The historical GCC-5A physical harness targets the earlier logging-based path and is not rerun as durable proof. Live HTTPS, identity, restart and cost qualification remain required.

Repository production configuration contains no controlled-shadow activation. No production deployment/configuration changed. GCC-5E has not started.

## Verified local results

- `npx vitest run --config vitest.gcc5d.config.mts`: 33 files, 439 tests passed, including 19 GCC-5D tests. The singleWorker setting avoids the installed custom pool starting one workerd instance per file; standard maxWorkers does not limit those instances.
- `node src/conversation/evaluation/run.gcc5d.migration.integrity.mjs`: integrity, foreign keys and preservation of existing data passed. D1 disallows integrity_check, so that check uses standalone SQLite; admission, immutability, SQL replacement protection and replay are verified in local D1.
- `npx tsc --noEmit --pretty false`: 82 repository diagnostics; none in GCC-5D files. The read-only pre-GCC-5D comparison has 118 diagnostics; no unrelated TypeScript repairs were made.
- `git diff --check` for GCC-5D tracked files: passed. Nothing staged or committed.

The earlier unrestricted conversation run exhausted local Worker resources. A subsequent JSON run had 436 passes, one unsupported D1 pragma failure, and two Worker connection failures. The final single-Worker run passed all 439 tests without increasing timeouts or weakening assertions. The local runtime reports compatibility fallback from 2026-01-02 to 2025-09-06; no production-runtime or physical-GPU proof is claimed.
