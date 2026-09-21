// Pre-render gate for finished films.
//
//   npm run check                      # check every film
//   npm run check -- --film=DanshaFirstFilm
//   npm run check -- --verbose         # also list the frozen films' known issues
//
// New films must pass the compliance rules, contain no repeated on-screen text,
// and ship with an upload ledger. Published films are frozen: their known issues
// are reported for information but never fail the run.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkNewFilm } from "./lib/compliance.ts";
import { isFrozen } from "./lib/frozen-films.ts";
import { readFilmId, toKebab } from "./lib/film-files.ts";
import { findRepeats, formatRepeats } from "./lib/repeat-scan.ts";

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const finishedDir = path.join(repo, "src", "finished");
const uploadDir = path.join(repo, "upload");

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return [m?.[1] ?? a, m?.[2] ?? true];
  }),
);

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

for (const file of all) {
  const source = fs.readFileSync(path.join(finishedDir, file), "utf8");
  const kebab = file.replace(/\.tsx$/, "");
  const frozen = isFrozen(file);
  const violations = checkNewFilm(source);
  const repeats = findRepeats(source);

  if (frozen) {
    frozenCount += 1;
    if (args.verbose) {
      console.log(
        `frozen ${file}: ${violations.length} known compliance gap(s), ${repeats.length} repeated phrase(s)`,
      );
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

console.log(
  `\nchecked ${all.length} film(s): ${all.length - frozenCount} under the current rules, ${frozenCount} frozen`,
);
if (failures.length > 0) {
  console.error(`\n${failures.length} problem(s) found.`);
  process.exit(1);
}
