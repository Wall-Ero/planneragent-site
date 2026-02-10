.
├── README.md
├── REPO_TREE_SNAPSHOT.txt
├── Source.CanonicalMap.md
├── Source.CanonicalMap.v1.md
├── docs
│   ├── Source.CanonicalMap.v1.md
│   └── Source.v1.md
├── index.html
├── package-lock.json
├── package.json
├── planneragent
│   ├── Source.CanonicalMap.md
│   ├── contracts
│   │   ├── dlci
│   │   ├── finance
│   │   │   ├── fdc.d1.sql
│   │   │   ├── fdc.types.ts
│   │   │   ├── fdc.v1.json
│   │   │   ├── fdg.v1.json
│   │   │   └── financial-decision-commit.v1.json
│   │   ├── governance
│   │   │   ├── boundary.response.schema.json
│   │   │   └── policy.leader.v1.ts
│   │   ├── msi
│   │   ├── ord
│   │   └── voice
│   ├── core
│   │   ├── .editorconfig
│   │   ├── .gitignore
│   │   ├── .prettierrc
│   │   ├── .vscode
│   │   │   └── settings.json
│   │   ├── contracts
│   │   │   ├── dlci
│   │   │   │   └── dlci.types.ts
│   │   │   ├── finance
│   │   │   ├── governance
│   │   │   ├── msi
│   │   │   ├── ord
│   │   │   └── voice
│   │   ├── datasets
│   │   │   └── dlci
│   │   │       ├── adapters
│   │   │       ├── dlci.schema.json
│   │   │       └── dlci.types.ts
│   │   ├── decision
│   │   │   ├── decisionReadinessGate.v1
│   │   │   ├── ord
│   │   │   │   ├── ord.evaluate.ts
│   │   │   │   └── ordGate.v1.ts
│   │   │   ├── ord.confidence.ts
│   │   │   └── pressure.ts
│   │   ├── decision-memory
│   │   │   ├── schema
│   │   │   └── snapshot
│   │   ├── dev.vars
│   │   ├── governance
│   │   │   └── policy
│   │   │       ├── governance.policy.schema.v1.json
│   │   │       ├── governance.policy.types.v1.ts
│   │   │       ├── governance.policy.v1.json
│   │   │       └── policy.loader.v1.ts
│   │   ├── legal
│   │   ├── metrics
│   │   ├── migrations
│   │   │   ├── 0001_llm_usage.sql
│   │   │   ├── 0003_llm_budget.sql
│   │   │   └── 0004_llm_usage_context.sql
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   ├── payload.json
│   │   ├── public
│   │   │   └── index.html
│   │   ├── signed.json
│   │   ├── src
│   │   │   ├── analyzeCore.ts
│   │   │   ├── datasets
│   │   │   │   └── dlci
│   │   │   │       └── adapters
│   │   │   ├── decision-memory
│   │   │   │   ├── decision.store.ts
│   │   │   │   ├── schema
│   │   │   │   │   ├── decisionMemory.schema.json
│   │   │   │   │   └── decisionMemorySnapshot.schema.json
│   │   │   │   ├── snapshot
│   │   │   │   │   ├── snapshot.builder.ts
│   │   │   │   │   └── snapshot.types.ts
│   │   │   │   └── tests
│   │   │   │       └── decisionMemory.integration.test.ts
│   │   │   ├── edge
│   │   │   │   └── routes.evaluate.ts
│   │   │   ├── feature-flags
│   │   │   ├── finance
│   │   │   │   ├── fdc.runtime.ts
│   │   │   │   └── fdv.runtime.ts
│   │   │   ├── governance
│   │   │   │   ├── FounderNotificationPolicy.v1
│   │   │   │   ├── __tests__
│   │   │   │   ├── authority.graph.ts
│   │   │   │   ├── boundary.policy.ts
│   │   │   │   ├── boundary.responses.ts
│   │   │   │   ├── decision.types.ts
│   │   │   │   ├── events.ts
│   │   │   │   ├── legalReadiness.monitor.v1.ts
│   │   │   │   ├── oag
│   │   │   │   │   ├── __tests__
│   │   │   │   │   │   └── oag.runtime.test.ts
│   │   │   │   │   ├── authority.graph.runtime.ts
│   │   │   │   │   ├── authority.graph.store.ts
│   │   │   │   │   ├── sql
│   │   │   │   │   │   ├── 001_oag.sql
│   │   │   │   │   │   └── 001_oag_d1.sql
│   │   │   │   │   ├── types.ts
│   │   │   │   │   ├── validateOag.test.ts
│   │   │   │   │   ├── validateOag.ts
│   │   │   │   │   └── validateOagAndBuildProof.ts
│   │   │   │   ├── policy
│   │   │   │   │   └── bootstrap.ts
│   │   │   │   ├── registry.ts
│   │   │   │   ├── runtime.ts
│   │   │   │   ├── snapshot
│   │   │   │   │   └── snapshot.ts
│   │   │   │   └── validator.ts
│   │   │   ├── index.ts
│   │   │   ├── legal
│   │   │   ├── metrics
│   │   │   ├── migrations
│   │   │   │   └── 001_decision_memory_snapshots.sql
│   │   │   ├── msi
│   │   │   ├── notifications
│   │   │   ├── orchestrator
│   │   │   │   └── __tests__
│   │   │   ├── policy
│   │   │   │   ├── enforcePolicy.ts
│   │   │   │   ├── evaluateJuniorPolicy.ts
│   │   │   │   ├── loadActivePolicy.ts
│   │   │   │   └── types.ts
│   │   │   ├── sandbox
│   │   │   │   ├── LogLlmUsage.ts
│   │   │   │   ├── __tests__
│   │   │   │   │   └── p3.snapshot.integration.test.ts
│   │   │   │   ├── apiBoundary.v2.ts
│   │   │   │   ├── authority
│   │   │   │   │   ├── authorityContext.builder.ts
│   │   │   │   │   ├── authorityExecution.policy.ts
│   │   │   │   │   ├── authoritySandbox.guard.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── budget.ts
│   │   │   │   ├── contracts.ts
│   │   │   │   ├── contracts.v2.ts
│   │   │   │   ├── dl.v2.ts
│   │   │   │   ├── dqm.ts
│   │   │   │   ├── llm
│   │   │   │   │   ├── executeWithLlmProviders.ts
│   │   │   │   │   ├── health.routes.ts
│   │   │   │   │   ├── providerMap.ts
│   │   │   │   │   ├── providers
│   │   │   │   │   │   ├── anthropic.ts
│   │   │   │   │   │   ├── mistral.ts
│   │   │   │   │   │   ├── mock.ts
│   │   │   │   │   │   ├── openai.ts
│   │   │   │   │   │   ├── openrouter.ts
│   │   │   │   │   │   └── oss.ts
│   │   │   │   │   ├── registry.ts
│   │   │   │   │   ├── sovereignty.ts
│   │   │   │   │   ├── sql
│   │   │   │   │   │   ├── 001_llm_usage.sql
│   │   │   │   │   │   ├── 002_llm_global_budget.sql
│   │   │   │   │   │   └── 003_sandbox_events_v2.sql
│   │   │   │   │   ├── types.ts
│   │   │   │   │   └── usageLedger.ts
│   │   │   │   ├── llm.ts
│   │   │   │   ├── llm.v2.ts
│   │   │   │   ├── llmcontracts.ts
│   │   │   │   ├── orchestrator.ts
│   │   │   │   ├── orchestrator.v2.ts
│   │   │   │   ├── policy.v2.ts
│   │   │   │   ├── routes.snapshot.ts
│   │   │   │   ├── routes.voice.ts
│   │   │   │   ├── security
│   │   │   │   │   └── anonymousVision.rateShield.ts
│   │   │   │   ├── snapshot
│   │   │   │   │   └── verifySignedSnapshot.v1.ts
│   │   │   │   ├── types.ts
│   │   │   │   └── visionInterpreter.v1.ts
│   │   │   ├── system
│   │   │   │   └── health.route.ts
│   │   │   ├── voice
│   │   │   │   └── __tests__
│   │   │   └── worker.ts
│   │   ├── test
│   │   │   ├── env.d.ts
│   │   │   ├── index.spec.ts
│   │   │   └── tsconfig.json
│   │   ├── tsconfig.json
│   │   ├── vitest.config.mts
│   │   ├── worker-configuration.d.ts
│   │   └── wrangler.jsonc
│   ├── gateway
│   │   ├── .editorconfig
│   │   ├── .gitignore
│   │   ├── .prettierrc
│   │   ├── .vscode
│   │   │   └── settings.json
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   ├── public
│   │   │   └── index.html
│   │   ├── src
│   │   │   └── index.ts
│   │   ├── test
│   │   │   ├── env.d.ts
│   │   │   ├── index.spec.ts
│   │   │   └── tsconfig.json
│   │   ├── tsconfig.json
│   │   ├── vitest.config.mts
│   │   ├── worker-configuration.d.ts
│   │   └── wrangler.jsonc
│   ├── governance
│   │   ├── CANONICAL.json
│   │   └── STATE.md
│   ├── scratch
│   │   └── openai.ping.ts
│   └── ui
│       ├── index.html
│       ├── ui.css
│       ├── ui.layout.css
│       └── ui.tokens.css
├── source.md
└── source.v1.md

79 directories, 152 files
