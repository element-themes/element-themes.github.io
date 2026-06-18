import { execFile } from "node:child_process";
import { access, cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = new URL("../", import.meta.url).pathname;
const destination = join(root, "public", "themes");
const localRepository = join(root, ".themes-repository");
const repository = process.env.THEMES_REPOSITORY || "https://github.com/element-themes/themes.git";

async function exists(path: string) {
  try { await access(path); return true; } catch { return false; }
}

async function validate(source: string) {
  const manifestPath = join(source, "index.json");
  await access(manifestPath);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as { themes?: Array<{ file: string; preview: string | null }> };
  if (!manifest.themes?.length) throw new Error("The themes repository contains no manifest entries");
  for (const theme of manifest.themes) {
    await access(join(source, theme.file));
    if (!theme.preview) throw new Error(`${theme.file} has no preview image`);
    await access(join(source, theme.preview));
  }
  return manifest.themes.length;
}

async function main() {
  let checkout: string | null = null;
  let source: string;
  if (process.env.THEMES_SOURCE_DIR) {
    source = resolve(process.env.THEMES_SOURCE_DIR, "themes");
  } else if (!process.env.CI && await exists(join(localRepository, "themes", "index.json"))) {
    source = join(localRepository, "themes");
  } else {
    checkout = await mkdtemp(join(tmpdir(), "element-themes-"));
    await execFileAsync("git", ["clone", "--depth", "1", repository, checkout]);
    source = join(checkout, "themes");
  }
  try {
    const count = await validate(source);
    await rm(destination, { recursive: true, force: true });
    await cp(source, destination, { recursive: true });
    console.log(`Synced ${count} themes from ${process.env.THEMES_SOURCE_DIR || (source.startsWith(localRepository) ? localRepository : repository)}`);
  } finally {
    if (checkout) await rm(checkout, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
