// Merge a platform export into the upload ledgers.
//
//   npm run stats -- --file=../dataExport/作品列表导出.xlsx
//   npm run stats -- --file=../dataExport/视频号动态数据明细.csv
//   npm run stats -- --file=<导出文件> --dry-run
//
// The export is the only way to get this data — neither platform has an open API — and
// it is keyed by copy, not by film id, so the row is matched to a film by the entry
// name that appears in the platform's own text.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  mergeLedgerStats,
  parseExport,
  renderPublishedLedger,
  rowKey,
  type StatsRow,
} from "./lib/stats-import.ts";

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const uploadDir = path.join(repo, "upload", "films");
const progressPath = path.join(repo, "progress.json");
const booksDir = path.join(repo, "scripts", "books");

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return [m?.[1] ?? a, m?.[2] ?? true];
  }),
);

const file = args.file;
if (!file || typeof file !== "string") {
  console.error("pass --file=<export.csv|export.xlsx> (e.g. npm run stats -- --file=../dataExport/视频号动态数据明细.csv)");
  process.exit(1);
}
const absolute = path.resolve(repo, file);
if (!fs.existsSync(absolute)) {
  console.error(`no such export: ${absolute}`);
  process.exit(1);
}

const progress = JSON.parse(fs.readFileSync(progressPath, "utf8"));
const toKebab = (id: string): string => id.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

/** Entry name -> the film that covers it, plus the composition id for a new ledger. */
const byEntry = new Map<string, { kebab: string; id: string }>();
for (const entry of progress.entries ?? []) {
  if (entry.film) {
    byEntry.set(entry.name, { kebab: toKebab(entry.film), id: entry.film });
  }
}

/**
 * Extra names a platform's copy may use for an entry.
 *
 * The copy names the drug, not the source heading, and the two do not always agree —
 * 卷一 calls 黄耆 "黄", and a one-character name is too short to match on safely, so
 * the book config declares the alternative rather than the matcher guessing.
 */
const aliases = new Map<string, string>();
for (const config of fs.readdirSync(booksDir).filter((f) => f.endsWith(".mjs"))) {
  const module = await import(new URL(config, `file://${booksDir}/`).href);
  for (const [entry, names] of Object.entries(module.default?.titleAliases ?? {})) {
    for (const name of names as string[]) {
      aliases.set(name, entry);
    }
  }
}
for (const [alias, entry] of aliases) {
  const target = byEntry.get(entry);
  if (target) {
    byEntry.set(alias, target);
  }
}

const known = [...byEntry.keys()];
const extension = path.extname(absolute).toLowerCase();
const { rows, skipped } = parseExport(fs.readFileSync(absolute), extension, known);

if (rows.length === 0) {
  console.error(`parsed 0 rows out of ${path.basename(absolute)} — check the export's columns`);
  process.exit(1);
}

const byFilm = new Map<string, { id: string; rows: StatsRow[] }>();
const unmatched = [];
for (const row of rows) {
  const film = byEntry.get(row.entry);
  if (!film) {
    unmatched.push(row.entry);
    continue;
  }
  const current = byFilm.get(film.kebab) ?? { id: film.id, rows: [] };
  current.rows.push(row);
  byFilm.set(film.kebab, current);
}

const dryRun = Boolean(args["dry-run"]);
let written = 0;
let added = 0;
let replaced = 0;
let created = 0;
for (const [kebab, film] of byFilm) {
  const filmRows = film.rows;
  const ledger = path.join(uploadDir, `${kebab}.md`);
  // A film that shipped before ledgers existed has nowhere to record the numbers, and
  // the platform it is live on is exactly what could not be answered when the account
  // was pushed back on. Write the ledger rather than skipping the data.
  const existed = fs.existsSync(ledger);
  const text = existed ? fs.readFileSync(ledger, "utf8") : renderPublishedLedger(film.id, filmRows);
  const before = existed
    ? (text.slice(text.indexOf("## 数据回填")).match(/^\| \d{4}-/gm) ?? []).length
    : 0;
  const next = mergeLedgerStats(text, filmRows);
  const after = (next.match(/^\| \d{4}-/gm) ?? []).length;
  added += after - before;
  replaced += filmRows.length - (after - before);
  // A new ledger's generated text already contains the merged table, so comparing
  // content alone would skip the write and leave the file on disk missing entirely.
  if (!dryRun && (!existed || next !== text)) {
    fs.writeFileSync(ledger, next, "utf8");
    written += 1;
    if (!existed) {
      created += 1;
    }
  } else if (dryRun && !existed) {
    created += 1;
  }
}

const platforms = [...new Set(rows.map((row) => row.platform))].join(" / ");
console.log(
  `${path.basename(absolute)}: ${rows.length} row(s) from ${platforms}, ${byFilm.size} film(s) matched`,
);
console.log(`  ${added} new row(s), ${replaced} row(s) refreshed, ${written} ledger(s) written${dryRun ? " (dry run)" : ""}`);
if (skipped.length > 0) {
  console.log(`  ${skipped.length} row(s) could not be placed: ${skipped.join(" | ")}`);
}
if (unmatched.length > 0) {
  console.log(`  ${unmatched.length} row(s) name no film: ${[...new Set(unmatched)].join(", ")}`);
}
if (created > 0) {
  console.log(`  ${created} ledger(s) created for films that shipped before ledgers existed`);
}
if (dryRun) {
  console.log("\nfirst three rows as they would be written:");
  for (const row of rows.slice(0, 3)) {
    console.log(`  ${rowKey(row)} ${row.entry}`);
  }
}
