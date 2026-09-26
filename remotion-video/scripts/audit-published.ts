// Audit every finished film against the current rules.
//
//   npm run audit                      # tab-separated, worst screen first
//   npm run audit -- --markdown        # markdown table for upload/_frozen-disposition.md
//
// Published films are frozen: the rules are not re-applied to them and nothing here
// fails the run. This is the evidence behind "which masters are worth taking down, and
// in what order", which previously had none.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isFrozen } from "./lib/frozen-films.ts";
import { loadContent } from "./lib/film-content.ts";
import { auditFilm, formatAuditMarkdown, formatAuditTable, summarizeAudit } from "./lib/published-audit.ts";

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const finishedDir = path.join(repo, "src", "finished");
const filmsDir = path.join(repo, "src", "films");

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return [m?.[1] ?? a, m?.[2] ?? true];
  }),
);

/** kebab film name -> the entry it covers, read off progress.json. */
const entryNames = (() => {
  const map = new Map();
  const ledger = path.join(repo, "progress.json");
  if (!fs.existsSync(ledger)) {
    return map;
  }
  const data = JSON.parse(fs.readFileSync(ledger, "utf8"));
  for (const entry of data.entries ?? []) {
    if (entry.film) {
      map.set(entry.film.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), entry.name);
    }
  }
  return map;
})();

const rows = [];
for (const file of fs.readdirSync(finishedDir).filter((f) => f.endsWith(".tsx")).sort()) {
  const source = fs.readFileSync(path.join(finishedDir, file), "utf8");
  const { content } = await loadContent(source, filmsDir);
  rows.push(auditFilm(file, source, content, isFrozen(file)));
}

const worstFirst = [...rows].sort((a, b) => b.worstRate - a.worstRate);
// The disposition list covers the masters that are already live; a film that has not
// shipped yet has nothing to dispose of.
const lines = args.markdown
  ? formatAuditMarkdown(rows.filter((row) => row.frozen), entryNames)
  : formatAuditTable(worstFirst);
for (const line of lines) {
  console.log(line);
}
console.log(`\n${summarizeAudit(rows)}`);
