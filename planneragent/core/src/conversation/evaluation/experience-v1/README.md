**STEP13R_BENCHMARK_IMPLEMENTATION_STATUS** — Implemented `STEP13R-B/experience-v1.0.0` as an offline benchmark of the existing product. No production behavior or request contract is changed. The corpus contains only public questions and synthetic fault conditions. The requested roadmap DOCX was not found locally; §77 was not independently inspected. The supplied work-unit requirements define this implementation's scope.

Run from the repository root:

```powershell
node planneragent/core/src/conversation/evaluation/experience-v1/run.cjs
```

The runner uses installed dependencies, imports the existing immutable network-deny preload before Vitest starts, and passes only an environment allowlist to its child. It does not install packages, load local provider credentials, activate inference, or use external services. It requires the expected HEAD, records source hashes and the Git index hash before/after, and fails if source, HEAD or index changes during execution. On this Windows host the sandbox denied esbuild subprocess creation (`spawn EPERM`); execution required the normal command escalation while retaining the network denial. No network-related escalation was used.

**CURRENT_HEAD_AND_INDEX** — HEAD `98add4bd27833b526d426d1686ef2567deb2962d`; staged changes: zero at pre-flight and review. The unchanged index SHA-256 is recorded in `artifacts/provenance.v1.json`. Existing concurrent Identity, Gateway, UI configuration/asset, waitlist and qualification changes remain outside this work unit. Measurements use the current working tree, including the pre-existing Gateway implementation whose conversation forwarding was inspected. They are not presented as measurements of a pristine checkout. The repository-wide whitespace check reports pre-existing whitespace in `planneragent/ui/assets/frames/Data_aw_frame.svg`; that file was left untouched.

**BENCHMARK_FILES**

| File | Responsibility |
| --- | --- |
| `corpus.v1.json` | 26 versioned scenarios: exact input sequences, goals, governed expectations, family tags, source references and synthetic fault selectors |
| `oracle.v1.ts` | Independently authored exact public wording, six mandatory clauses, boundary answers and finite declared mutation checks; never consumes the production plan as its expected answer |
| `run.cjs` | Offline runner, source/index provenance, report-completeness gate and separate quality aggregation |
| `vitest.config.mts` | Extends the existing operational-chat and natural-capabilities family runners |
| `../../__tests__/conversational.experience.offline.v1.test.ts` | Real UI scenario execution, transport/schema assertions, independent oracle controls and network-deny probes |
| `../../__tests__/operational.chat.offline.fixture.v1.ts` | Shared extraction of the existing minimal DOM and real UI mount; records client/Core requests, replies, status, Stop and transcript state |
| `../../__tests__/operational.chat.e2e.offline.v1.test.ts` | Existing test assertions retained; imports the extracted fixture |
| `artifacts/observed.v1.json` | Exact observed requests, Core replies, displayed text, classifications and source evidence for every scenario; synthetic oracle controls are separate |
| `artifacts/harness.v1.json` | Native Vitest execution results |
| `artifacts/provenance.v1.json` | HEAD/index/source hashes, Node version, environment policy and harness-integrity gate |
| `artifacts/execution.v1.log` | Runner stdout/stderr |

The fixture loads real `ui/main.ts`, its client, composer and transcript. An in-memory service-binding bridge calls the actual Gateway and Core worker. The recorded run contains 33 turns and 31 real conversation Core calls; two deliberate client-side transport failures do not reach Core. It captures the actual public request bodies; turns two and three contain only `version`, `request_id` and the current `message`. There is no history injection, private runtime invocation, or fabricated positive Core response. The DOM fixture establishes application behavior in Node, not browser layout or hosted deployment behavior. The 404/transport exception occur at the client bridge; version corruption occurs before real Gateway/Core handling. Stop is the actual UI action, with a real Core response deliberately delayed at the bridge.

**SCENARIO_COVERAGE** — Families overlap; these rows must not be added into an overall score.

| Family | Scenarios | Supported | Failed | Not measurable |
| --- | ---: | ---: | ---: | ---: |
| 1. Single-turn capabilities and boundaries | 3 | 2 | 1 | 0 |
| 2. Two-/three-turn reference conversations | 6 | 2 | 4 | 0 |
| 3. Pronouns, ellipses, ambiguity | 6 | 0 | 6 | 0 |
| 4. Missing context and clarification | 5 | 0 | 5 | 0 |
| 5. Public capabilities, tiers, domains | 6 | 1 | 5 | 0 |
| 6. Disclosure, execution, authority | 7 | 6 | 1 | 0 |
| 7. Finite semantic fidelity / hosted limitation | 3 | 2 | 0 | 1 |
| 8. Transport, abort and unavailable provider | 5 | 5 | 0 | 0 |

Family 2's two supported cases preserve explicit security refusals after a public answer. They do not demonstrate contextual reference resolution. Family 6's failure is `AMB-004`, which provides no clarification for “Do that.” It is not evidence of an authority grant.

**HARNESS_TEST_RESULTS** — 12 test files; **382 PASS, 1 pre-existing TODO, 0 failures**. This includes the original operational-chat regression coverage (**165 PASS + 1 TODO**), the additional existing natural/semantic/contract regression suites (**183 PASS**), and the new benchmark integrity suite (**34 PASS**). Harness PASS means the corpus executed, measurements were recorded correctly, the existing checks passed, and network denial held. It does not mean every conversational task succeeded. The runner exits nonzero for incomplete evidence, test failure, or concurrent source/index changes.

The unchanged TODO is `ANONYMOUS-VISION-CONVERSATION-V1 fails closed when provider prose contradicts the deterministic public capability projection`. Its presence is not a successful semantic-fidelity check.

**PRODUCT_QUALITY_RESULTS** — **13 SUPPORTED, 12 FAILED, 1 NOT_MEASURABLE** across the 26 scenarios. This is a count of declared scenario objectives, not an aggregate conversational-quality score:

| Objective group | Supported | Failed | Not measurable |
| --- | ---: | ---: | ---: |
| Substantive answers, context, clarification, semantic measurement | 2 | 12 | 1 |
| Explicit security/data/execution boundary responses | 6 | 0 | 0 |
| Safe handling of deliberate transport/abort/provider faults | 5 | 0 | 0 |

The five resilience successes mean safe error handling. They do not award successful-answer credit to unavailable product questions. `PUB-001` and `RES-004` deliberately use the same question with different objectives: inability to answer is a product failure for the former, while safe fail-closed behavior satisfies the latter. `SEM-001` records that hosted fidelity cannot be measured. Naturalness and style are **NOT_SCORED**. No ChatGPT-comparability percentage is calculated.

**CONTEXTUAL_FAILURES** — `CTX-001`–`CTX-004` fail all five follow-up turns with `REQUEST_NOT_ADMITTED` and no displayed answer. For example, “What can PlannerAgent do?” receives the real public capability answer, but “Can it execute actions?” produces no response. In the three-turn case, both “Explain those domains.” and “And the third one?” fail. Client requests contain no prior turns; Core's public schema does not accept history. These are genuine current-route gaps. They establish no claim about a future history-enabled route. `AMB-001`–`AMB-004` also return rejection without a clarifying question.

**SEMANTIC_FIDELITY_FINDINGS** — The two dedicated capability scenarios retain all six independently specified governed clauses, including the domain-availability qualification and observation-only execution negation. Other displayed deterministic capability turns are recorded individually in the JSON. No semantic violation was verified in these approved renderings. Five finite oracle controls demonstrate complete wording, removal of the VISION negation, appended execution contradiction, unsupported universal availability and invented organizational authority. These are synthetic controls, not product failures. A sixth arbitrary-prose control remains NOT_MEASURABLE. The oracle recognizes only exact approved renderings and exact declared mutations; absent text matches alone cannot establish a semantic omission in arbitrary prose. General hosted realization has neither live output nor a qualified general semantic oracle in this unit. Student realization is not qualified; Teacher LIVE remains disabled.

**SECURITY_BOUNDARY_RESULTS** — Six explicit boundary cases preserve the exact public refusal/registration responses, including after a valid first turn. Deterministic answer plans retain `grants_authority: false` and `grants_execution: false`. No verified protected disclosure or authority violation was observed within these checked surfaces. The tests perform no organizational data access, execution, training, identity changes, or provider activation. Provider selection, hosted dispatch and Student interpretation are asserted absent during benchmark scenarios. These bounded observations are not a general adversarial security qualification.

**NETWORK_DENY_VERIFIED** — Six child-process probes verify denial before I/O for `fetch`, `net.connect`, `tls.connect`, `http2.connect`, `dgram.createSocket`, and `dns.lookup`. Each inherits the existing preload, receives `OFFLINE_NETWORK_ACCESS_DENIED`, acknowledges only its exact intentional probe, and exits zero. The same existing guard asserts no unexpected attempts after every test and at process exit. Ordinary scenario execution has no acknowledged network attempts. The immutable socket/DNS restrictions stay active even when the UI uses an in-memory fetch bridge.

**TOP_THREE_VERIFIED_GAPS**

1. **No contextual reference resolution through the public route.** Four conversations / five follow-up turns fail. The client sends no history and the schema rejects extra fields. A future correction needs an explicitly governed context contract and continuity qualification; UI-visible prior exchanges do not supply Core context.
2. **No usable clarification for absent referents.** All four standalone ambiguity cases fail silently in the transcript. Rejection preserves a boundary but does not help the user repair the question. A correction should return a bounded clarifying question without inventing a referent, operational fact, or authorization.
3. **Public answer coverage depends on an unavailable hosted path outside the narrow qualified grammar.** All four explicit VISION/tier/domain/integration questions fail offline with `SERVICE_UNAVAILABLE`. A correction should qualify broader source-bound public answers with independent expectations before relying on hosted realization. This is an offline finding; deployed provider availability and answer quality remain unmeasured.

**SINGLE_RECOMMENDED_NEXT_CORRECTION** — In a separately authorized work unit, add a governed, source-bound clarification response for missing or unresolved referents at the public conversation boundary. Keep execution and disclosure locked, disclose the context limitation, and ask the user to restate the subject. Re-run `CTX-*` and `AMB-*` without injecting history. This is a small first repair to the observed interaction failure; resolving historical references still requires separate context-contract work. No such correction is implemented here.

**GO_NO_GO_FOR_INDEPENDENT_REVIEW** — **GO** for independent review of this offline benchmark and its observed gaps. The evidence does not qualify hosted realization, Student/Teacher promotion, general semantic fidelity, or comparative naturalness. No staging, commit, push, deployment, inference, training or promotion was performed. AIOG-CS-001/G1, GRADUATE stand-by and Stream B remain untouched by this work unit.
