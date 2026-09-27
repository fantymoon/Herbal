// Build progress.json: original-order coverage ledger for one classical book.
//
//   npm run progress                          # the default book
//   npm run progress -- --book=shennong-bencao-jing
//
// Reads the classical text (GB18030), walks <目录>/<篇名> in order, marks finished
// films done, and prints the next uncovered entry. Per-book configuration lives in
// scripts/books/, so moving to the next book does not mean editing this script.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFilmId } from "./lib/film-files.ts";
import { loadContent } from "./lib/film-content.ts";
import { isDraft } from "./lib/compliance.ts";

const root = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(root, "..");
const booksDir = path.join(root, "books");

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return [m?.[1] ?? a, m?.[2] ?? true];
  }),
);

const available = fs
  .readdirSync(booksDir)
  .filter((f) => f.endsWith(".mjs"))
  .sort();
if (available.length === 0) {
  console.error("no book configuration found in scripts/books/");
  process.exit(1);
}
const wanted = typeof args.book === "string" ? `${args.book}.mjs` : available[0];
if (!available.includes(wanted)) {
  console.error(`unknown book "${args.book}"; available: ${available.map((f) => f.replace(/\.mjs$/, "")).join(", ")}`);
  process.exit(1);
}
const config = (await import(new URL(wanted, `file://${booksDir}/`).href)).default;
const { book, source, skipped, notes, wrappers = {} } = config;

// The entry -> Composition id mapping used to live only in the book config's hand-written
// `done` map, which meant every new film needed a manual edit there — and `npm run
// progress` hard-failed until somebody made it. A data-driven film already carries both
// facts in its content module (`entry` and `id`), so new films register themselves and
// the hand map shrinks to a legacy supplement for the 55 films that predate content
// modules. The two are merged, with the content module winning on a conflict.
const finishedDir = path.join(repo, "src", "finished");
const filmsDir = path.join(repo, "src", "films");
const derived = {};
const drafts = [];
const onDisk = new Set();
for (const file of fs.readdirSync(finishedDir).filter((f) => f.endsWith(".tsx"))) {
  const filmSource = fs.readFileSync(path.join(finishedDir, file), "utf8");
  const id = readFilmId(filmSource);
  if (!id) {
    console.error(`no exported film component in ${file}`);
    process.exit(1);
  }
  const { content } = await loadContent(filmSource, filmsDir);
  if (isDraft(content)) {
    drafts.push(id);
    continue;
  }
  onDisk.add(id);
  if (content?.entry) {
    derived[content.entry] = id;
  }
}
const done = { ...config.done, ...derived };
const legacyDone = Object.keys(config.done).length;

const buf = fs.readFileSync(path.join(repo, "..", source));
const lines = new TextDecoder("gb18030").decode(buf).split("\n");
let volume = null;
let started = false;
const raw = [];
for (const line of lines) {
  const dir = line.trim().match(/^<目录>(.*)$/)?.[1].trim();
  if (dir) {
    volume = dir;
    if (/卷/.test(dir)) {
      started = true;
    }
    continue;
  }
  if (!started) {
    continue;
  }
  const name = line.trim().match(/^<篇名>(.*)$/)?.[1].trim();
  if (name) {
    raw.push({ name, volume });
  }
}

const HEADERS = new Set(["上经", "中经", "下经", "卷一", "卷二", "卷三"]);
const show = (v) => v.replace(/\\/g, " · ");
const seenNames = new Map();
const entries = [];
const push = (name, vol, status, film, note) => {
  const occurrence = (seenNames.get(name) ?? 0) + 1;
  seenNames.set(name, occurrence);
  const entry = { name, volume: show(vol), status };
  if (film) {
    entry.film = film;
  }
  if (occurrence > 1) {
    entry.occurrence = occurrence;
    entry.note = `duplicate 篇名 in the source (occurrence ${occurrence})`;
  } else if (note) {
    entry.note = note;
  }
  entries.push(entry);
};
for (const { name, volume: vol } of raw) {
  if (HEADERS.has(name) || /[，、]/.test(name)) {
    continue;
  }
  if (done[name]) {
    push(name, vol, "done", done[name], notes[name]);
  } else if (skipped[name]) {
    push(name, vol, "skipped", null, skipped[name]);
  } else {
    push(name, vol, "todo", null, null);
  }
  // 菟丝子 has no 篇名 of its own; it follows 术 in original order.
  if (name === "术") {
    push("菟丝子", vol, "done", done["菟丝子"], notes["菟丝子"]);
  }
  // TOC-listed with no 篇名 section: keep them visible in order as skipped.
  if (name === "滑石") {
    push("石胆", vol, "skipped", null, skipped["石胆"]);
  }
  if (name === "紫石英") {
    push("五色石脂", vol, "skipped", null, skipped["五色石脂"]);
  }
}

const out = {
  book,
  source,
  entryCount: entries.length,
  doneCount: entries.filter((e) => e.status === "done").length,
  entries,
};
fs.writeFileSync(path.join(repo, "progress.json"), JSON.stringify(out, null, 2) + "\n", "utf8");

const next = entries.find((e) => e.status === "todo");
console.log(`ledger: ${out.doneCount}/${out.entryCount} done`);
console.log(`next: ${next.name} [${next.volume}]`);

// Cross-check both directions, using each film's own exported component name
// instead of guessing it from the filename. The scan itself happened above, before
// the ledger was built, because the same pass is what derives new films' mappings.
const mapped = new Set([...Object.values(done), ...Object.keys(wrappers)]);
const unmapped = [...onDisk].filter((f) => !mapped.has(f));
if (unmapped.length > 0) {
  console.error("finished films missing from the book config: " + unmapped.join(", "));
  process.exit(1);
}
const stale = [...mapped].filter((f) => !onDisk.has(f));
if (stale.length > 0) {
  console.error("book config references films that no longer exist: " + stale.join(", "));
  process.exit(1);
}
const derivedCount = Object.keys(derived).length;
if (derivedCount > 0) {
  console.log(
    `${derivedCount} film(s) registered from their content module, ${legacyDone} from the legacy map`,
  );
}
if (drafts.length > 0) {
  console.log(`draft(s) in progress, still todo: ${drafts.join(", ")}`);
}
