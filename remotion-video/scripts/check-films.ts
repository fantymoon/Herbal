// Pre-render gate for finished films.
//
//   npm run check                      # check every film
//   npm run check -- --film=DanshaFirstFilm
//   npm run check -- --verbose         # reading budget per screen, and every film's title
//
// Three states, and only one of them is a failure:
//
//   ok      a renderable film that satisfies every current rule
//   draft   a data-driven film whose content module still carries TODO placeholders.
//           Reported, never a failure — a draft has no Composition, so it cannot be
//           rendered or published. Clearing the placeholders is what makes it `ok`.
//   FAIL    anything else: a rule broken, repeated on-screen text, a missing ledger.
//
// Published films cannot be un-published by a verdict, so they are never failed. They are
// still *read*: a film that is live carrying a wrong fact is a fact about the channel, and
// hiding it behind an exemption is how 蓝实 and 紫芝 shipped a 产地 their own cited 经文
// contradicts while `npm run check` printed "0 gap(s)". So the run splits in two —
//
//   judgement   what a film may still be stopped from doing (a new film: FAIL is meaningful)
//   fact        what a film already says (printed for every film, published or not)
//
// `FROZEN_FILMS` is the 2026-09-21 snapshot of what was live then, which is all the legacy
// films can support — they have no ledgers. Everything published since is recognised by the
// date the platform export filled into its own ledger (`publishedOn`), so the exemption is a
// committed record rather than a file on my disk.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkNewFilm, hardViolations, isDraft, isWaived } from "./lib/compliance.ts";
import { findEntries, readCorpus, type Sutra } from "./lib/corpus.ts";
import { factProblems, ledgerProblems, musicProblems } from "./lib/film-rules.ts";
import { isFrozen } from "./lib/frozen-films.ts";
import { readFilmId, readKnownPhotos, toKebab } from "./lib/film-files.ts";
import { loadContent } from "./lib/film-content.ts";
import { publishedOn, readLedgerField } from "./lib/ledger.ts";
import { findRepeats, findRepeatsIn, formatRepeats } from "./lib/repeat-scan.ts";
import { adjacentTrackRepeats, readPublishPlan } from "./lib/publish-order.ts";
import { formatReadingBudget, planFilm, visibleText } from "../src/layout.ts";
import type { FilmContent } from "../src/layout.ts";
import { unrecordedLicences } from "../src/music.ts";

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const finishedDir = path.join(repo, "src", "finished");
const filmsDir = path.join(repo, "src", "films");
const uploadDir = path.join(repo, "upload", "films");
const outDir = path.join(repo, "out", "films");
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

/** The 标题 a film is going to be posted under, or "" if it has no ledger yet. */
const ledgerTitle = (copy: string): string => readLedgerField(copy, "标题");

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
/** Every ledger title in the run, printed by `--verbose`. */
const titles: { film: string; title: string }[] = [];
/** 条目 -> the track that film carries, for the films the schedule still has a say over. */
const trackByEntry = new Map<string, string>();
/** Entries already on a platform: their track is fixed and cannot be moved by this run. */
const liveEntries = new Set<string>();
let frozenCount = 0;
let liveCount = 0;
let draftCount = 0;

for (const file of all) {
  const source = fs.readFileSync(path.join(finishedDir, file), "utf8");
  const kebab = file.replace(/\.tsx$/, "");
  const frozen = isFrozen(file);
  const ledgerPath = path.join(uploadDir, `${kebab}.md`);
  const copy = fs.existsSync(ledgerPath) ? fs.readFileSync(ledgerPath, "utf8") : null;
  // What makes a film untouchable is that a platform has it. Two signals, and both are
  // needed, because each covers what the other cannot see.
  //
  // The export is one: `npm run stats` merges it into 数据回填, and a row means the platform
  // has data for the film. It works in CI, where there is no `out/`.
  //
  // The master is the other, and it is the stronger one in this workflow: the creator
  // publishes as soon as a film renders, so a master in `out/` is a film that is already up.
  // Treating it as unpublished because the next export has not landed is how a style change
  // gets rendered over a film that is live — which is exactly what happened to 蒲黄.
  //
  // A draft cannot abuse the master signal: the gate refuses to render one, so no draft has
  // a master to hide behind.
  const live = (copy !== null && publishedOn(copy) !== null) || fs.existsSync(path.join(outDir, `${kebab}.mp4`));
  const { content, error } = await loadContent(source, filmsDir);
  const violations = checkNewFilm(source, content, knownPhotos);
  const repeats = content ? findRepeatsIn(visibleText(content)) : findRepeats(source);
  // Facts about what the film says, as opposed to judgements about whether it may still be
  // made. These are computed for every film that can be read, published or not.
  const facts = content
    ? [...factProblems(sutras, file, content), ...musicProblems(file, content)]
    : [];
  // A film that declares narration and has no audio for it would render in silence and pass
  // every other check. The declaration is what makes the audio load-bearing, so the missing
  // file is a fact about the film rather than a warning about the environment.
  if (content?.narration && !fs.existsSync(path.join(repo, "public", "voice", `${content.id}.mp3`))) {
    facts.push(
      `declares narration but public/voice/${content.id}.mp3 is missing — run npm run film:voice`,
    );
  }
  if (content) {
    trackByEntry.set(content.entry, content.music);
    if (frozen || live) liveEntries.add(content.entry);
  }
  const title = copy === null ? "" : ledgerTitle(copy);
  if (title !== "") titles.push({ film: file, title });

  // A verdict cannot un-publish a film, so it does not fail one — but it does say what the
  // film says. `FROZEN_FILMS` is the 2026-09-21 snapshot and has no master logic of its own;
  // everything published since is recognised from its own ledger.
  if (frozen || live) {
    if (frozen) {
      frozenCount += 1;
    } else {
      liveCount += 1;
    }
    console.log(
      `${frozen ? "frozen" : "live"} ${file}: ` +
        `${frozen ? `${violations.length} known compliance gap(s)` : `${violations.length} gap(s)`}, ` +
        `${facts.length} fact(s), ${repeats.length} repeated phrase(s) — not re-judged`,
    );
    // Printed without `--verbose`, for the films published *after* the ledgers began: a film
    // that is public carrying a wrong 产地 or a quotation the book does not support is a fact
    // about the channel, and an exemption that hides it is the difference between a known
    // defect and a discovered one. `FROZEN_FILMS` is a snapshot of 55 films whose copy nobody
    // will ever act on, so those stay a count.
    if (live) {
      for (const fact of facts) console.log(`     ${fact}`);
      if (repeats.length > 0) console.log(`     ${formatRepeats(file, repeats)}`);
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
  // A declared budget deviation renders and reports, but does not fail. `npm run check`
  // prints the film's own reason on the waived line, so "27s because the 经文 is 90
  // characters" is visible in the gate's output instead of being inferred from absence.
  const waived = violations.filter(isWaived);
  const problems = [
    ...hardViolations(violations).map((v) => `${file}: [${v.rule}] ${v.detail}`),
    ...(repeats.length > 0 ? [formatRepeats(file, repeats)] : []),
    ...facts,
    ...(filmId === null
      ? [`${file}: declares no exported film component`]
      : copy === null
        ? [`upload/films/${kebab}.md is missing`]
        : ledgerProblems(kebab, filmId, content, copy)),
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

// Titles are not a gate: "is this sentence one I have already written" is judgement, and a
// regex that strips 「」 slots misses the case it claims to catch (古书里的X是什么 and
// 古书里的Y是什么 compare as two frames). What a regex can supply is the *set* — 74 titles is
// more than anyone holds in memory, so `--verbose` prints them and the writer looks instead of
// remembering.
if (args.verbose) {
  console.log(`\nledger titles in this run (${titles.length}):`);
  for (const { film, title } of titles) console.log(`  ${film.padEnd(32)} ${title}`);
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
  const bgmProblems = adjacentTrackRepeats(planned, trackByEntry, liveEntries);
  if (bgmProblems.length > 0) {
    failures.push(...bgmProblems);
    console.error("\nFAIL two films in a row share a music track");
    for (const p of bgmProblems) {
      console.error(`  ${p}`);
    }
  }
}

const renderable = all.length - frozenCount - liveCount - draftCount;
console.log(
  `\nchecked ${all.length} film(s): ${renderable} renderable, ${draftCount} draft, ` +
    `${frozenCount} frozen, ${liveCount} live`,
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
