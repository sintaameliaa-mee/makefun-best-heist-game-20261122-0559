// Output contract: mkdir the output dir, empty ONLY its contents
// (never rm the dir itself — on the grader it is a mounted volume),
// copy game/ + screenshots/ there, then write dossier.json.
// main.ts — hands the Velvet Vault heist game in.
// Copies game/ and screenshots/ from this repository to the output
// directory and writes dossier.json there with the kit's buildDossier.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.
//
// The output directory itself is never removed: on the grader it is a
// mounted volume, and removing it fails. Only its contents are emptied.

import { mkdir, readdir, rm, cp, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

async function emptyDirectoryContents(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
  const contents = await readdir(dir);
  for (const entry of contents) {
    await rm(join(dir, entry), { recursive: true, force: true });
  }
}

async function main(): Promise<void> {
  await emptyDirectoryContents(outDir);
  await cp(join(repoRoot, "game"), join(outDir, "game"), { recursive: true });
  await cp(join(repoRoot, "screenshots"), join(outDir, "screenshots"), { recursive: true });
  const dossier = await buildDossier(repoRoot, { text_max_bytes: 163840 });
  await writeFile(join(outDir, "dossier.json"), dossier);
}

await main();
