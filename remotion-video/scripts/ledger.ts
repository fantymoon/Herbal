// Generate and refresh the upload ledgers from the content modules.
//
//   npm run ledger                       # every data-driven film
//   npm run ledger -- --check            # report what would change, write nothing
//   npm run ledger -- --film=HuangzhiFirstFilm
//
// Only blanks are filled. A title a human rewrote stays rewritten, a platform status
// someone recorded stays recorded, and the 数据回填 table is never touched — so this is
// safe to re-run at any point in a film's life.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadContent } from "./lib/film-content.ts";
import { readFilmId } from "./lib/film-files.ts";
import { ledgerFileName, renderLedger } from "./lib/ledger.ts";

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const finishedDir = path.join(repo, "src", "finished");
const filmsDir = path.join(repo, "src", "films");
const uploadDir = path.join(repo, "upload", "films");

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return [m?.[1] ?? a, m?.[2] ?? true];
  }),
);

fs.mkdirSync(uploadDir, { recursive: true });

const files = fs
  .readdirSync(finishedDir)
  .filter((f) => f.endsWith(".tsx"))
  .sort();

let created = 0;
let refreshed = 0;
let unchanged = 0;
let skipped = 0;

for (const file of files) {
  const source = fs.readFileSync(path.join(finishedDir, file), "utf8");
  const filmId = readFilmId(source) ?? file;
  if (typeof args.film === "string" && args.film !== filmId) {
    continue;
  }
  const { content, error } = await loadContent(source, filmsDir);
  if (error) {
    console.error(`FAIL ${file}: ${error}`);
    process.exitCode = 1;
    continue;
  }
  if (!content) {
    // Hand-written film (all 55 frozen ones). It never had a ledger and cannot be
    // reconstructed; that is exactly why the ledger starts with the data-driven films.
    skipped += 1;
    continue;
  }

  const ledgerPath = path.join(uploadDir, ledgerFileName(content));
  const existed = fs.existsSync(ledgerPath);
  const existing = existed ? fs.readFileSync(ledgerPath, "utf8") : null;
  const next = renderLedger(content, existing);

  if (existing === next) {
    unchanged += 1;
    continue;
  }
  if (args.check) {
    console.log(`${existed ? "would refresh" : "would create"} upload/films/${path.basename(ledgerPath)}`);
    continue;
  }
  fs.writeFileSync(ledgerPath, next, "utf8");
  if (existed) {
    refreshed += 1;
  } else {
    created += 1;
  }
  console.log(`${existed ? "refreshed" : "created"} upload/films/${path.basename(ledgerPath)}`);
}

if (args.check) {
  console.log(`\nledger check: ${files.length} film(s), ${skipped} hand-written without a content module`);
} else {
  console.log(
    `\nledger: ${created} created, ${refreshed} refreshed, ${unchanged} unchanged, ${skipped} hand-written skipped`,
  );
  if (created + refreshed > 0) {
    console.log("标题与描述是草稿：按条目改写后再上传。数据回填表每周更新一次。");
  }
}
