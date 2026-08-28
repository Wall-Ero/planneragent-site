import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, rm } from "node:fs/promises";
import { basename, resolve } from "node:path";

const ADAPTER = "PA-INTERPRETATION-STUDENT-v0.5-ADAPTER-GCC4T.zip";
const EVALUATE = "PA-INTERPRETATION-STUDENT-v0.5-GCC4T-EVALUATE.zip";
const TRAIN_RUN = "PA-INTERPRETATION-STUDENT-v0.5-TRAIN-RUN.json";
const TRAIN_SUMS = "PA-INTERPRETATION-STUDENT-v0.5-TRAIN-SHA256SUMS.txt";
const EXPECTED_ADAPTER = "a7c85bcf71dc2e97743f454c5bf3222ec4e5abc238867dc078dd3218983dc09a";
const EXPECTED_EVALUATE = "886d4f218b3f2239b1bcfb12d798f3f05d24212c41a6ddccc9854dddcb6d52a7";
const sha = (value: Uint8Array) => createHash("sha256").update(value).digest("hex");

export async function prepareGcc4tOpaqueHandoff(source: string, destination = resolve(process.cwd(), "training-artifacts", "gcc4t", "PA-INTERPRETATION-STUDENT-v0.5-GCC4T-KAGGLE-EVALUATE-OPAQUE")) {
  if (!source) throw new Error("GCC4T_PHYSICAL_TRAIN_HANDOFF_SOURCE_REQUIRED");
  const adapter = new Uint8Array(await readFile(resolve(source, ADAPTER))), evaluate = new Uint8Array(await readFile(resolve(source, EVALUATE)));
  if (sha(adapter) !== EXPECTED_ADAPTER) throw new Error("GCC4T_ADAPTER_SOURCE_SHA_MISMATCH");
  if (sha(evaluate) !== EXPECTED_EVALUATE) throw new Error("GCC4T_EVALUATE_SOURCE_SHA_MISMATCH");
  const trainRun = JSON.parse(await readFile(resolve(source, TRAIN_RUN), "utf8"));
  if (trainRun?.adapter_zip_sha256 !== EXPECTED_ADAPTER) throw new Error("GCC4T_TRAIN_RUN_ADAPTER_SHA_MISMATCH");
  await rm(destination, { recursive: true, force: true }); await mkdir(destination, { recursive: true });
  await copyFile(resolve(source, ADAPTER), resolve(destination, `${ADAPTER}.blob`));
  await copyFile(resolve(source, EVALUATE), resolve(destination, `${EVALUATE}.blob`));
  await copyFile(resolve(source, TRAIN_RUN), resolve(destination, TRAIN_RUN));
  await copyFile(resolve(source, TRAIN_SUMS), resolve(destination, TRAIN_SUMS));
  const names = (await readdir(destination)).sort(), expected = [`${ADAPTER}.blob`, `${EVALUATE}.blob`, TRAIN_RUN, TRAIN_SUMS].sort();
  if (JSON.stringify(names) !== JSON.stringify(expected)) throw new Error("GCC4T_OPAQUE_HANDOFF_CONTENTS_INVALID");
  if (sha(new Uint8Array(await readFile(resolve(destination, `${ADAPTER}.blob`)))) !== EXPECTED_ADAPTER || sha(new Uint8Array(await readFile(resolve(destination, `${EVALUATE}.blob`)))) !== EXPECTED_EVALUATE) throw new Error("GCC4T_OPAQUE_CARRIER_IDENTITY_MISMATCH");
  return { status: "GCC4T_KAGGLE_OPAQUE_ARCHIVE_HANDOFF_READY", destination, files: names, adapter_sha256: EXPECTED_ADAPTER, evaluate_sha256: EXPECTED_EVALUATE };
}
if (basename(process.argv[1] ?? "").startsWith("prepare_gcc4t_opaque_handoff")) prepareGcc4tOpaqueHandoff(process.argv[2] ?? "").then(value => process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)).catch(error => { process.stderr.write(`${error instanceof Error ? error.stack : error}\n`); process.exitCode = 1; });
