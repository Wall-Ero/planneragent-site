import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseConversationalInterpretationResultV1 } from "../../../src/conversation/cognition/conversational.cognition.contracts.v1";

const sha = (value: Uint8Array) => createHash("sha256").update(value).digest("hex");
export async function verifyGcc4jResult(root: string): Promise<{ candidate_id: string; lifecycle_state: string; files_verified: number; canonical_outputs_verified: number }> {
  const manifest = JSON.parse(await readFile(resolve(root, "candidate.manifest.json"), "utf8")) as { candidate_id: string; lifecycle_state: string; corpus_digest: string; reloaded: boolean };
  if (manifest.candidate_id !== "PA-INTERPRETATION-STUDENT-v0.1" || manifest.lifecycle_state !== "TRAINED_CANDIDATE" || manifest.corpus_digest !== "sha256:4aefcf09cf09e550450fe738089e241fe4ab980e439c05926bc1be826ef8708c" || manifest.reloaded !== true) throw new Error("GCC4J_CANDIDATE_MANIFEST_INVALID");
  const lines = (await readFile(resolve(root, "SHA256SUMS.txt"), "utf8")).trim().split("\n");
  for (const line of lines) { const [expected, relative] = line.trimEnd().split(/\s{2}/); if (!expected || !relative || sha(await readFile(resolve(root, relative))) !== expected) throw new Error(`GCC4J_ARTIFACT_HASH_INVALID:${relative ?? "line"}`); }
  let canonicalOutputs = 0;
  for (const line of lines) {
    const relative = line.trimEnd().split(/\s{2}/)[1];
    if (!/^(?:baseline|trained|openai)\.(?:validation|qualification|holdout|adversarial|gold|train)\.json$/.test(relative)) continue;
    const evidence = JSON.parse(await readFile(resolve(root, relative), "utf8")) as { cases?: Array<{ parser_valid?: boolean; parsed_output?: unknown }> };
    for (const item of evidence.cases ?? []) if (item.parser_valid) { if (!parseConversationalInterpretationResultV1(item.parsed_output)) throw new Error(`GCC4J_CANONICAL_PARSER_PARITY_FAILED:${relative}`); canonicalOutputs++; }
  }
  return { candidate_id: manifest.candidate_id, lifecycle_state: manifest.lifecycle_state, files_verified: lines.length, canonical_outputs_verified: canonicalOutputs };
}

const root = process.argv[2];
if (root) verifyGcc4jResult(resolve(root)).then((value) => process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)).catch((error) => { process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`); process.exitCode = 1; });
