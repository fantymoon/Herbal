// Record which rendered masters exist, so losing out/ is detectable.
//
//   npm run manifest
//
// out/ is gitignored (173 MB of mp4), which means the masters have no history and
// no off-site copy. This writes a small tracked ledger of film id -> file -> size
// so a lost or stale master shows up instead of going unnoticed. It is a record,
// not a backup: keep a real copy of out/ somewhere else as well.
//
// out/ 按系列分目录，名字与源码那边一致（src/films|topics|asks → out/films|topics|asks）。
// 三条线各有各的清单：**分开记而不是并成一份**——它们回答的是三个不同的问题
//（哪条线缺母版），混在一起就看不出来了。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFilmId, toKebab } from "./lib/film-files.ts";

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const finishedDir = path.join(repo, "src", "finished");
const topicsDir = path.join(repo, "src", "topics");
const asksDir = path.join(repo, "src", "asks");
const outRoot = path.join(repo, "out");
const manifestPath = path.join(repo, "masters-manifest.json");

/** 清单里记的路径一律是 `out/…` 的正斜杠形式，两台机器上读起来一样。 */
const displayPath = (mp4) => `out/${path.relative(outRoot, mp4).split(path.sep).join("/")}`;

const collect = (outDir, ids, nameOf, key) => {
  const found = [];
  const missing = [];
  for (const id of ids) {
    const mp4 = path.join(outDir, nameOf(id));
    if (!fs.existsSync(mp4)) {
      missing.push(id);
      continue;
    }
    const stat = fs.statSync(mp4);
    found.push({
      [key]: id,
      file: displayPath(mp4),
      bytes: stat.size,
      modified: stat.mtime.toISOString(),
    });
  }
  return { found, missing };
};

const report = (label, ids, { found, missing }) => {
  if (ids.length === 0) return;
  console.log(`${label}: ${found.length}/${ids.length} rendered`);
  if (missing.length > 0) {
    console.log(`  not rendered (${missing.length}): ${missing.join(", ")}`);
  }
};

// ── 单味药线 ──────────────────────────────────────────────────────────────
const films = fs
  .readdirSync(finishedDir)
  .filter((f) => f.endsWith(".tsx"))
  .sort();
const filmIds = [];
for (const file of films) {
  const id = readFilmId(fs.readFileSync(path.join(finishedDir, file), "utf8"));
  if (!id) {
    console.warn(`skip ${file}: no exported film component`);
    continue;
  }
  filmIds.push(id);
}
const single = collect(path.join(outRoot, "films"), filmIds, (id) => `${toKebab(id)}.mp4`, "film");

// ── 跨书专题线 ────────────────────────────────────────────────────────────
const topicIds = fs.existsSync(topicsDir)
  ? fs
      .readdirSync(topicsDir)
      .filter((f) => f.endsWith(".ts") && !f.endsWith(".voice.ts"))
      .map((f) => f.replace(/\.ts$/, ""))
      .sort()
  : [];
const topics = collect(path.join(outRoot, "topics"), topicIds, (id) => `${id}-h.mp4`, "topic");

// ── 本草一问线 ────────────────────────────────────────────────────────────
const askIds = fs.existsSync(asksDir)
  ? fs
      .readdirSync(asksDir)
      .filter((f) => f.endsWith(".content.ts"))
      .map((f) => f.replace(/\.content\.ts$/, ""))
      .sort()
  : [];
const asks = collect(path.join(outRoot, "asks"), askIds, (id) => `${id}.mp4`, "episode");

const payload = {
  note: "out/ is gitignored. This ledger records the masters that existed so a lost or stale render is detectable. It is not a backup.",
  filmCount: filmIds.length,
  masterCount: single.found.length,
  missingMasters: single.missing,
  masters: single.found,
  topicCount: topicIds.length,
  topicMasterCount: topics.found.length,
  topicMissingMasters: topics.missing,
  topicMasters: topics.found,
  askEpisodeCount: askIds.length,
  askMasterCount: asks.found.length,
  askMissingMasters: asks.missing,
  askMasters: asks.found,
};
fs.writeFileSync(manifestPath, JSON.stringify(payload, null, 2) + "\n", "utf8");

report("masters", filmIds, single);
report("topic masters", topicIds, topics);
report("ask masters", askIds, asks);
console.log(`wrote ${path.relative(repo, manifestPath)}`);
