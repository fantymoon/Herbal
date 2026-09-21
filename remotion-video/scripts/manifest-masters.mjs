// Record which rendered masters exist, so losing out/ is detectable.
//
//   npm run manifest
//
// out/ is gitignored (173 MB of mp4), which means the masters have no history and
// no off-site copy. This writes a small tracked ledger of film id -> file -> size
// so a lost or stale master shows up instead of going unnoticed. It is a record,
// not a backup: keep a real copy of out/ somewhere else as well.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFilmId, toKebab } from "./lib/film-files.ts";

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const finishedDir = path.join(repo, "src", "finished");
const outDir = path.join(repo, "out");
const manifestPath = path.join(repo, "masters-manifest.json");

const films = fs
  .readdirSync(finishedDir)
  .filter((f) => f.endsWith(".tsx"))
  .sort();

const masters = [];
const missing = [];

for (const file of films) {
  const source = fs.readFileSync(path.join(finishedDir, file), "utf8");
  const id = readFilmId(source);
  if (!id) {
    console.warn(`skip ${file}: no exported film component`);
    continue;
  }
  const mp4 = path.join(outDir, `${toKebab(id)}.mp4`);
  if (!fs.existsSync(mp4)) {
    missing.push(id);
    continue;
  }
  const stat = fs.statSync(mp4);
  masters.push({
    film: id,
    file: `out/${path.basename(mp4)}`,
    bytes: stat.size,
    modified: stat.mtime.toISOString(),
  });
}

const payload = {
  note: "out/ is gitignored. This ledger records the masters that existed so a lost or stale render is detectable. It is not a backup.",
  filmCount: films.length,
  masterCount: masters.length,
  missingMasters: missing,
  masters,
};
fs.writeFileSync(manifestPath, JSON.stringify(payload, null, 2) + "\n", "utf8");

console.log(`masters: ${masters.length}/${films.length} rendered`);
if (missing.length > 0) {
  console.log(`not rendered (${missing.length}): ${missing.join(", ")}`);
}
console.log(`wrote ${path.relative(repo, manifestPath)}`);
