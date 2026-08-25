import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildInterpretationPilotCorpusV1, PILOT_SPLITS_V1 } from "./interpretation.pilot.corpus.v1";

async function main(): Promise<void> {
  const output = resolve(process.cwd(), "training-artifacts", "PA-INTERPRETATION-PILOT-v1");
  const built = buildInterpretationPilotCorpusV1();
  await mkdir(output, { recursive: true });
  for (const split of PILOT_SPLITS_V1) await writeFile(resolve(output, `${split.toLowerCase()}.jsonl`), built.jsonl[split], "utf8");
  await writeFile(resolve(output, "manifest.json"), `${JSON.stringify(built.manifest, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify({ output, total: built.manifest.total_records, splits: built.manifest.split_counts, interactions: built.manifest.interaction_distribution, product_focus: built.manifest.product_focus_distribution, languages: built.manifest.language_distribution, source_kinds: built.manifest.source_kind_distribution, critical_boundaries: built.manifest.critical_boundary_counts, audience: built.manifest.audience_declaration_count, ambiguity: built.manifest.ambiguity_count, corpus_digest: built.manifest.aggregate_corpus_digest }, null, 2)}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
