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
// never fail the run. `FROZEN_FILMS` is the 2026-09-21 snapshot, which is all the legacy
// films can support — they have no ledgers. Films published since carry the date in
// `upload/<kebab>.md`, so the gate reads it and treats them the same way.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkNewFilm, hardViolations, isDraft, isWaived } from "./lib/compliance.ts";
import { findEntries, originProblems, readCorpus, type Sutra } from "./lib/corpus.ts";
import { isFrozen } from "./lib/frozen-films.ts";
import { readFilmId, readKnownPhotos, toKebab } from "./lib/film-files.ts";
import { loadContent } from "./lib/film-content.ts";
import { checkLedgerCopy, checkTitleFrames, readLedgerField } from "./lib/ledger.ts";
import type { TitleLine } from "./lib/ledger.ts";
import { findRepeats, findRepeatsIn, formatRepeats } from "./lib/repeat-scan.ts";
import { adjacentTrackRepeats, readPublishPlan } from "./lib/publish-order.ts";
import { formatReadingBudget, planFilm, visibleText } from "../src/layout.ts";
import type { FilmContent } from "../src/layout.ts";
import { trackOf, unrecordedLicences } from "../src/music.ts";

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const finishedDir = path.join(repo, "src", "finished");
const filmsDir = path.join(repo, "src", "films");
const uploadDir = path.join(repo, "upload");
const outDir = path.join(repo, "out");
const corpusFile = path.join(repo, "..", "TCM-Ancient-Books-master", "000-神农本草经.txt");

/**
 * The 经文 each entry is quoting, so the gate can check what a film says *about* the text
 * and not only what the text says. Read once; GB18030, so it goes through `readCorpus`.
 */
const sutras = new Map<string, Sutra>(
  findEntries(readCorpus(corpusFile)).map((e) => [e.name, e.sutra]),
);

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return [m?.[1] ?? a, m?.[2] ?? true];
  }),
);

const knownPhotos = readKnownPhotos(path.join(repo, "public", "images", "credits.json"));

/**
 * The per-scene reading budget, printed by `--verbose`.
 *
 * SKILL.md promises this: "npm run check -- --verbose prints the per-scene rate". A
 * pass/fail gate alone cannot show that a screen is sitting at 14.6 of the 15/s
 * ceiling with no room for one more clause.
 */
const readingReport = (content: FilmContent): string[] => formatReadingBudget(planFilm(content));

const ledgerProblems = (kebab: string, filmId: string, music: string): string[] => {
  const ledger = path.join(uploadDir, `${kebab}.md`);
  if (!fs.existsSync(ledger)) {
    return [`upload/${kebab}.md is missing`];
  }
  const copy = fs.readFileSync(ledger, "utf8");
  const problems: string[] = [];
  // Only the fields the scaffold actually writes. 抖音：/视频号： were dropped from
  // `ledger.ts` when the workflow stopped recording publication state — but this list
  // kept demanding them, and the demand never fired because a master on disk short-circuits
  // the ledger check. Every film had a master, so the gate sat one render away from
  // failing every new film on a field nobody writes. Caught by moving one master aside
  // and watching it FAIL.
  for (const field of ["film:", "标题：", "描述：", "话题：", "BGM："]) {
    if (!copy.includes(field)) {
      problems.push(`upload/${kebab}.md is missing "${field}"`);
    }
  }
  if (!copy.includes(filmId)) {
    problems.push(`upload/${kebab}.md does not name the film id ${filmId}`);
  }
  // The BGM line is written once, at scaffold time, from the content module. Change the
  // module's music afterwards and the ledger keeps naming the old track — the ledger is
  // the only record of what the master actually carries, so it has to be checked, not
  // trusted. `npm run ledger` fills blanks and will not correct it.
  const bgm = readLedgerField(copy, "BGM");
  if (bgm !== "" && !bgm.includes(music)) {
    const named = /`([^`]+)`/.exec(bgm)?.[1] ?? bgm;
    problems.push(`upload/${kebab}.md names ${named} but the film uses ${music}`);
  }
  // The copy is what the platforms read, and it used to be the only prose in the repo
  // that no rule looked at.
  for (const problem of checkLedgerCopy(copy)) {
    problems.push(`upload/${kebab}.md ${problem}`);
  }
  return problems;
};

/** The 标题 a film is going to be posted under, or "" if it has no ledger yet. */
const ledgerTitle = (kebab: string): string => {
  const ledger = path.join(uploadDir, `${kebab}.md`);
  if (!fs.existsSync(ledger)) {
    return "";
  }
  return readLedgerField(fs.readFileSync(ledger, "utf8"), "标题");
};

/**
 * What the film claims about the 经文, checked against the 经文.
 *
 * `facts` was the last block of on-screen prose outside any rule, and it is written from
 * memory: the scaffold derives 别名 and 篇目位置 out of the corpus but never derived 产地.
 * 大枣 shipped saying 池泽 under a citation of a text that says 生平泽 — the 生境 of
 * 藕实茎, the entry beside it. Every other block on that screen is a quotation; this one
 * was a recollection, and nothing compared the two.
 */
const factProblems = (file: string, content: FilmContent): string[] => {
  const sutra = sutras.get(content.entry);
  if (!sutra) {
    return [`${file}: entry「${content.entry}」 is not a 篇名 in the corpus`];
  }
  return originProblems(content.facts, sutra).map((p) => `${file}: ${p}`);
};

/**
 * The track a film names has to be one `npm run sync-music` has measured.
 *
 * Not bookkeeping. `FinishedMusic` only consults the registry when it has to loop, and an
 * unregistered track under `loop` throws — that is the loud version of this mistake. The
 * quiet version already shipped: a six-minute film whose 4:16 bed ran out and left the last
 * 1:46 playing against digital silence, because `loop` silently degenerates into "play
 * once" when it cannot work out how long the track is.
 */
const musicProblems = (file: string, content: FilmContent): string[] =>
  trackOf(content.music) === null
    ? [`${file}: music「${content.music}」 is not in src/music-registry.ts — run \`npm run sync-music\``]
    : [];

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
const titleLines: TitleLine[] = [];
/** 条目 -> the track that film carries, for the films the schedule still has a say over. */
const trackByEntry = new Map<string, string>();
let frozenCount = 0;
let renderedCount = 0;
let draftCount = 0;

for (const file of all) {
  const source = fs.readFileSync(path.join(finishedDir, file), "utf8");
  const kebab = file.replace(/\.tsx$/, "");
  const frozen = isFrozen(file);
  // A master on disk is what makes a film untouchable: re-rendering it is the one thing
  // that would change what a viewer sees, and the answer to a style change is the next
  // film, not this one. Nothing is reported by the creator — the file is the record.
  const rendered = fs.existsSync(path.join(outDir, `${kebab}.mp4`));
  const { content, error } = await loadContent(source, filmsDir);
  const violations = checkNewFilm(source, content, knownPhotos);
  const repeats = content ? findRepeatsIn(visibleText(content)) : findRepeats(source);

  // A verdict cannot un-render a master, so it is information rather than a failure.
  // `FROZEN_FILMS` is the 2026-09-21 snapshot of what was live then and has no master
  // logic of its own; everything rendered since is found by looking at `out/`.
  if (frozen || rendered) {
    if (frozen) {
      frozenCount += 1;
    } else {
      renderedCount += 1;
    }
    // Printed whether or not --verbose is on: a rendered film is not re-judged, but a
    // finding it carries is still a fact about a master that exists, and "do not touch a
    // rendered film" has one exception — a real defect. Hiding those behind --verbose
    // would make the exception unreachable.
    if ((!frozen && violations.length > 0) || repeats.length > 0 || args.verbose) {
      console.log(
        frozen
          ? `frozen ${file}: ${violations.length} known compliance gap(s), ${repeats.length} repeated phrase(s)`
          : `rendered ${file}: master on disk, not re-judged — ${violations.length} gap(s), ${repeats.length} repeated phrase(s)`,
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

  // A new film with no content module at all. `checkNewFilm` already reports it under
  // `data-driven`; the guard is here so the reading report has a plan to read, and it
  // has to fail the run rather than fall through to the `ok` branch.
  if (content === null) {
    failures.push(`${file}: no content module to plan from`);
    console.error(`FAIL ${file}\n  no content module to plan from`);
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
      for (const line of readingReport(content)) {
        console.log(line);
      }
    }
    continue;
  }

  const filmId = readFilmId(source);
  const title = ledgerTitle(kebab);
  if (title !== "") {
    titleLines.push({ film: file, title });
  }
  trackByEntry.set(content.entry, content.music);
  // A declared budget deviation renders and reports, but does not fail. `npm run check`
  // prints the film's own reason on the waived line, so "27s because the 经文 is 90
  // characters" is visible in the gate's output instead of being inferred from absence.
  const waived = violations.filter(isWaived);
  const problems = [
    ...hardViolations(violations).map((v) => `${file}: [${v.rule}] ${v.detail}`),
    ...(repeats.length > 0 ? [formatRepeats(file, repeats)] : []),
    ...factProblems(file, content),
    ...musicProblems(file, content),
    ...(filmId ? ledgerProblems(kebab, filmId, content.music) : [`${file}: declares no exported film component`]),
  ];
  for (const w of waived) {
    console.log(`     waived [${w.rule}] ${w.detail}\n            reason: ${w.waived}`);
  }
  if (problems.length > 0) {
    failures.push(...problems);
    console.error(`FAIL ${file}`);
    for (const p of problems) {
      console.error(`  ${p}`);
    }
  } else {
    console.log(`ok   ${file}${waived.length > 0 ? ` (${waived.length} declared deviation(s))` : ""}`);
  }
  if (args.verbose) {
    for (const line of readingReport(content)) {
      console.log(line);
    }
  }
}

// One rule cannot be checked a film at a time: SKILL.md forbids reusing one fixed
// question template across videos, and "reused" is a property of the set. It is also
// the rule that is easiest to break without noticing — each title looks fine alone.
const frameProblems = checkTitleFrames(titleLines);
if (frameProblems.length > 0) {
  failures.push(...frameProblems);
  console.error("\nFAIL title frames reused across films");
  for (const p of frameProblems) {
    console.error(`  ${p}`);
  }
}

// The second set-level rule. Which track a film carries is a per-film field, but whether
// two films in a row sound the same is a property of the sequence — and the sequence that
// matters is the publish order, not `progress.json`'s 卷次 order. Reading the plan instead
// of assuming is the whole point: measured against the book order, this batch looked like it
// repeated eight times in a row, and it does not.
const planPath = path.join(repo, "..", "publish-plan.md");
const planned = readPublishPlan(planPath);
if (planned.length < 20) {
  // A parse that quietly returns nothing would make this check quietly pass, which is the
  // failure mode the check exists to prevent.
  failures.push(
    `publish-plan.md yielded only ${planned.length} scheduled row(s); expected the first 30`,
  );
  console.error(`\nFAIL publish order could not be read from ${planPath}`);
} else {
  const bgmProblems = adjacentTrackRepeats(planned, trackByEntry);
  if (bgmProblems.length > 0) {
    failures.push(...bgmProblems);
    console.error("\nFAIL two films in a row share a music track");
    for (const p of bgmProblems) {
      console.error(`  ${p}`);
    }
  }
}

const renderable = all.length - frozenCount - renderedCount - draftCount;
console.log(
  `\nchecked ${all.length} film(s): ${renderable} renderable, ${draftCount} draft, ` +
    `${frozenCount} frozen, ${renderedCount} rendered`,
);

// The images have public/images/credits.json and a gate that keeps it exact. The music has
// a registry that records where each track came from and nothing that records what it may
// be used for, because nobody has written that down. Reported on every run rather than
// fixed by assumption: an invented licence is worse than a missing one, and a channel
// already carrying a platform warning is the last place to guess.
const unlicensed = unrecordedLicences();
if (unlicensed.length > 0) {
  console.log(
    `note ${unlicensed.length} track(s) have no recorded licence: ` +
      unlicensed.map((t) => `${t.file} (${t.source})`).join(", "),
  );
}

if (failures.length > 0) {
  console.error(`\n${failures.length} problem(s) found.`);
  process.exit(1);
}
