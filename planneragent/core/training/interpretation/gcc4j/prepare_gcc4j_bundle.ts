import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { CONVERSATIONAL_INTERPRETATION_GOLD_CORPUS_V1 } from "../../../src/conversation/evaluation/conversational.interpretation.gold.corpus.v1";
import { parseConversationalInterpretationResultV1 } from "../../../src/conversation/cognition/conversational.cognition.contracts.v1";

export const GCC4J_EXPECTED_CORPUS_DIGEST = "sha256:4aefcf09cf09e550450fe738089e241fe4ab980e439c05926bc1be826ef8708c";
const audienceRoles: Readonly<Record<string, string>> = Object.freeze({
  "audience-scm-manager": "supply chain manager", "audience-scm-typo": "suppy chain manager", "audience-scm": "SCM",
  "audience-production": "production planner", "audience-cfo": "CFO", "it-audience-scm": "supply chain manager",
  "it-audience-planning": "responsabile della pianificazione",
});
const sha = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
const normalize = (value: string) => value.toLowerCase().trim().replace(/\s+/g, " ");

export function buildGoldExportV1(): string {
  return CONVERSATIONAL_INTERPRETATION_GOLD_CORPUS_V1.map((fixture) => {
    const target = parseConversationalInterpretationResultV1({ version: 1, interaction: fixture.expected_interaction, ...(fixture.expected_product_focus ? { product_focus: fixture.expected_product_focus } : {}), ...(fixture.expects_audience_declaration ? { audience_declaration: { declared_role: audienceRoles[fixture.input_id] } } : {}), resolution: fixture.expected_resolution, interpretation_only: true, requester_content_non_authoritative: true, grants_authority: false, grants_execution: false });
    if (!target) throw new Error(`INVALID_GOLD_EXPORT:${fixture.input_id}`);
    return JSON.stringify({ input_id: fixture.input_id, category: fixture.category, input_text: fixture.message, target });
  }).join("\n") + "\n";
}

export async function prepareGcc4jInputBundle(repoCore = resolve(process.cwd()), destination = resolve(process.cwd(), "training-artifacts", "gcc4j", "PA-INTERPRETATION-STUDENT-v0.1-INPUT")) {
  const manifest = JSON.parse(await readFile(resolve(repoCore, "training-artifacts", "PA-INTERPRETATION-PILOT-v1", "manifest.json"), "utf8")) as { corpus_id: string; corpus_version: string; aggregate_corpus_digest: string; split_counts: Record<string, number> };
  if (manifest.corpus_id !== "PA-INTERPRETATION-PILOT-v1" || manifest.corpus_version !== "1" || manifest.aggregate_corpus_digest !== GCC4J_EXPECTED_CORPUS_DIGEST || JSON.stringify(manifest.split_counts) !== JSON.stringify({ TRAIN: 120, VALIDATION: 20, QUALIFICATION: 20, HOLDOUT: 20, ADVERSARIAL: 20 })) throw new Error("GCC4J_CORPUS_GATE_FAILED");
  const corpusRoot = resolve(repoCore, "training-artifacts", "PA-INTERPRETATION-PILOT-v1");
  const gold = buildGoldExportV1();
  const train = (await readFile(resolve(corpusRoot, "train.jsonl"), "utf8")).trim().split("\n").map((line) => normalize((JSON.parse(line) as { input_text: string }).input_text));
  const trainSet = new Set(train);
  for (const name of ["validation", "qualification", "holdout", "adversarial"] as const) for (const line of (await readFile(resolve(corpusRoot, `${name}.jsonl`), "utf8")).trim().split("\n")) if (trainSet.has(normalize((JSON.parse(line) as { input_text: string }).input_text))) throw new Error(`GCC4J_SPLIT_LEAKAGE:${name}`);
  for (const line of gold.trim().split("\n")) if (trainSet.has(normalize((JSON.parse(line) as { input_text: string }).input_text))) throw new Error("GCC4J_GOLD_LEAKAGE");
  await rm(destination, { recursive: true, force: true });
  await mkdir(resolve(destination, "corpus"), { recursive: true });
  await mkdir(resolve(destination, "scripts"), { recursive: true });
  for (const name of ["train", "validation", "qualification", "holdout", "adversarial", "manifest"] as const) await cp(resolve(corpusRoot, `${name}.${name === "manifest" ? "json" : "jsonl"}`), resolve(destination, "corpus", `${name}.${name === "manifest" ? "json" : "jsonl"}`));
  await writeFile(resolve(destination, "corpus", "gold.jsonl"), gold, "utf8");
  const source = resolve(repoCore, "training", "interpretation", "gcc4j");
  for (const name of ["experiment.config.json", "evaluate_interpretation_student.py", "train_first_local_student.py"] as const) await cp(resolve(source, name), resolve(destination, "scripts", name));
  const files = ["corpus/train.jsonl", "corpus/validation.jsonl", "corpus/qualification.jsonl", "corpus/holdout.jsonl", "corpus/adversarial.jsonl", "corpus/gold.jsonl", "corpus/manifest.json", "scripts/experiment.config.json", "scripts/evaluate_interpretation_student.py", "scripts/train_first_local_student.py"];
  const hashes = [];
  for (const relative of files) hashes.push(`${sha(await readFile(resolve(destination, relative)))}  ${relative.replaceAll("\\", "/")}`);
  await writeFile(resolve(destination, "SHA256SUMS.txt"), `${hashes.join("\n")}\n`, "utf8");
  return { destination, file_count: files.length + 1, bundle_tree_digest: `sha256:${sha(hashes.join("\n"))}` };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(__filename)) prepareGcc4jInputBundle().then((value) => process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)).catch((error) => { process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`); process.exitCode = 1; });
