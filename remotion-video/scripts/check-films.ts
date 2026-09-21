// Pre-render gate for finished films.
//
//   npm run check                      # check every film
//   npm run check -- --film=DanshaFirstFilm
//   npm run check -- --verbose         # also list the frozen films' known issues
//
// Three states, and only one of them is a failure:
//
//   ok      a renderable film that satisfies every current rule
//   draft   a data-driven film whose content module still carries TODO placeholders.
//           Reported, never a failure — a draft has no Composition, so it cannot be
//           rendered or published. Clearing the placeholders is what makes it `ok`.
//   FAIL    anything else: a rule broken, repeated on-screen text, a missing ledger.
//
// Published films are frozen: their known issues are reported for information but
// never fail the run.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkNewFilm, isDraft } from "./lib/compliance.ts";
import { isFrozen } from "./lib/frozen-films.ts";
import { readFilmId, readKnownPhotos, toKebab } from "./lib/film-files.ts";
import { loadContent } from "./lib/film-content.ts";
import { findRepeats, findRepeatsIn, formatRepeats } from "./lib/repeat-scan.ts";
import { visibleText } from "../src/layout.ts";

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const finishedDir = path.join(repo, "src", "finished");
const filmsDir = path.join(repo, "src", "films");
const uploadDir = path.join(repo, "upload");

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return [m?.[1] ?? a, m?.[2] ?? true];
  }),
);

const knownPhotos = readKnownPhotos(path.join(repo, "public", "images", "credits.json"));

const ledgerProblems = (kebab: string, filmId: string): string[] => {
  const ledger = path.join(uploadDir, `${kebab}.md`);
  if (!fs.existsSync(ledger)) {
    return [`upload/${kebab}.md is missing`];
  }
  const copy = fs.readFileSync(ledger, "utf8");
  const problems: string[] = [];
  for (const field of ["film:", "标题：", "描述：", "话题：", "BGM：", "抖音：", "视频号："]) {
    if (!copy.includes(field)) {
      problems.push(`upload/${kebab}.md is missing "${field}"`);
    }
  }
  if (!copy.includes(filmId)) {
    problems.push(`upload/${kebab}.md does not name the film id ${filmId}`);
  }
  return problems;
};

let all = fs
  .readdirSync(finishedDir)
  .filter((f) => f.endsWith(".tsx"))
  .sort();
if (typeof args.film === "string") {
  const wanted = `${toKebab(args.film)}.tsx`;
  if (!all.includes(wanted)) {
    console.error(`no finished film at src/finished/${wanted}`);
    process.exit(1);
  }
  all = [wanted];
}

const failures: string[] = [];
let frozenCount = 0;
let draftCount = 0;

for (const file of all) {
  const source = fs.readFileSync(path.join(finishedDir, file), "utf8");
  const kebab = file.replace(/\.tsx$/, "");
  const frozen = isFrozen(file);
  const { content, error } = await loadContent(source, filmsDir);
  const violations = checkNewFilm(source, content, knownPhotos);
  const repeats = content ? findRepeatsIn(visibleText(content)) : findRepeats(source);

  if (frozen) {
    frozenCount += 1;
    if (args.verbose) {
      console.log(
        `frozen ${file}: ${violations.length} known compliance gap(s), ${repeats.length} repeated phrase(s)`,
      );
    }
    continue;
  }

  // A content module that is named but missing/unloadable is a hard failure: the
  // rules cannot be verified at all.
  if (error) {
    failures.push(`${file}: ${error}`);
    console.error(`FAIL ${file}\n  ${error}`);
    continue;
  }

  if (isDraft(content)) {
    draftCount += 1;
    const unfinished = violations.filter((v) => v.rule === "unfinished").map((v) => v.detail);
    console.log(`draft ${file}: ${unfinished.length} placeholder(s) left — not renderable yet`);
    if (args.verbose) {
      for (const detail of unfinished) {
        console.log(`        ${detail}`);
      }
    }
    continue;
  }

  const filmId = readFilmId(source);
  const problems = [
    ...violations.map((v) => `${file}: [${v.rule}] ${v.detail}`),
    ...(repeats.length > 0 ? [formatRepeats(file, repeats)] : []),
    ...(filmId ? ledgerProblems(kebab, filmId) : [`${file}: declares no exported film component`]),
  ];
  if (problems.length > 0) {
    failures.push(...problems);
    console.error(`FAIL ${file}`);
    for (const p of problems) {
      console.error(`  ${p}`);
    }
  } else {
    console.log(`ok   ${file}`);
  }
}

const renderable = all.length - frozenCount - draftCount;
console.log(
  `\nchecked ${all.length} film(s): ${renderable} renderable, ${draftCount} draft, ${frozenCount} frozen`,
);
if (failures.length > 0) {
  console.error(`\n${failures.length} problem(s) found.`);
  process.exit(1);
}
