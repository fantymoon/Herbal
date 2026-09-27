// Read one entry's 经文 out of the classical corpus, and say whether it fits a film.
//
//   npm run entry -- --name=卷柏
//   npm run entry -- --list                 # every entry, with its length
//   npm run entry -- --list --fits          # only the ones the current budget carries
//   npm run entry -- --grep=轻身            # search the whole corpus for a phrase
//
// Four jobs, all of which used to be manual `rg` work:
//
//   1. Confirm the name. At least 17 `<篇名>` values in 000-神农本草经.txt are truncated
//      (青 -> 青蘘, 木 -> 檗木), and the truncated string is not what belongs on screen.
//      The 经文's own first line is the evidence, so this prints it.
//   2. Measure it. The binding constraint on a film is total readable text, and the 今译
//      runs 1.5-2x the 原文, so an entry past `CAPACITY.tight` needs a declared `duration`
//      deviation and one past `CAPACITY.declared` cannot be made at all. Choosing an
//      entry without that number is how a film gets half-written before the gate
//      rejects it.
//   3. Search. `rg` is the wrong tool for this corpus and the docs used to say to use it:
//      every one of the 701 .txt files is GB18030, so ripgrep (and anything else reading
//      the bytes as UTF-8) matches *no* Chinese at all and returns "not found" for text
//      that is plainly there. `--grep` decodes first, so a miss means a miss.
//   4. Refuse the defective ones. A 经文 the recension dropped a character out of, or cut
//      short mid-sentence, cannot be quoted faithfully, and `原文照录` has no latitude.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GAP_MARK, defectOf, findEntries, readCorpus } from "./lib/corpus.ts";

const root = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(root, "..");
const booksDir = path.join(root, "books");

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return [m?.[1] ?? a, m?.[2] ?? true];
  }),
) as Record<string, string | true>;

const available = fs
  .readdirSync(booksDir)
  .filter((f) => f.endsWith(".mjs"))
  .sort();
const wanted = typeof args.book === "string" ? `${args.book}.mjs` : available[0];
if (!available.includes(wanted)) {
  console.error(`unknown book "${args.book}"; available: ${available.map((f) => f.replace(/\.mjs$/, "")).join(", ")}`);
  process.exit(1);
}
const config = (await import(new URL(wanted, `file://${booksDir}/`).href)).default;

// ---- --grep: search the corpus with the right decoder ------------------------
// The corpus is GB18030, so this is the only search that actually works here.
if (typeof args.grep === "string") {
  const corpusDir = path.join(repo, "..", path.dirname(config.source));
  const files = fs
    .readdirSync(corpusDir)
    .filter((f) => f.endsWith(".txt"))
    .sort();
  // Narrowed into locals: TypeScript does not carry the `typeof` guard into the closure.
  const fileFilter = typeof args.file === "string" ? args.file : null;
  const only = fileFilter === null ? files : files.filter((f) => f.includes(fileFilter));
  const limit = Number(args.limit ?? 60);
  let hits = 0;
  let scanned = 0;
  for (const file of only) {
    const body = readCorpus(path.join(corpusDir, file));
    scanned += 1;
    for (let i = 0; i < body.length; i += 1) {
      const line = body[i].trim();
      if (!line.includes(args.grep)) continue;
      hits += 1;
      if (hits <= limit) console.log(`${file}:${i + 1}  ${line}`);
    }
  }
  console.log(
    `\n${hits} hit(s) for "${args.grep}" across ${scanned} file(s)` +
      (hits > limit ? ` (showing first ${limit})` : "") +
      ".",
  );
  if (hits === 0) {
    console.log(
      "No hit. Note this decodes GB18030 — a miss here is a real miss, unlike `rg`,\n" +
        "which matches nothing at all in this corpus.",
    );
  }
  process.exit(hits > 0 ? 0 : 1);
}

const entries = findEntries(readCorpus(path.join(repo, "..", config.source)));

/**
 * How much 经文 a film can carry.
 *
 * Measured against the real planner, not estimated: sweep the 经文 length with the 今译
 * following at 1.55x (the ratio 黄芝 / 紫芝 / 蓝实 / 防风 actually hit) and find where
 * `findReadingProblems` or `findOverflow` first fires. The classical scene carries 原文
 * + 今译 + 注释 + the historical note on one screen, so the 原文 is what binds.
 *
 * At 1.55x the standard ladder (cap 720 frames / 24s) carries 83 characters, and a
 * declared `duration` deviation (to 900 / 30s) carries 130. At 1.8x: 83 and 112.
 * At 2.1x: 66 and 102. The 720 rung is the wall — the next rung is 810, and reaching
 * it takes a deviation, so 84-130 is exactly the band `deviations` unlocks.
 */
const CAPACITY = { roomy: 60, tight: 83, declared: 130 };

const verdict = (n: number): string =>
  n <= CAPACITY.roomy
    ? "roomy"
    : n <= CAPACITY.tight
      ? "tight"
      : n <= CAPACITY.declared
        ? "ext"
        : "over";

const clean = (e: (typeof entries)[number]): boolean => defectOf(e.sutra) === null;

if (args.list) {
  const rows = args.fits
    ? entries.filter((e) => verdict(e.sutra.text.length) !== "over" && clean(e))
    : entries;
  for (const e of rows) {
    const flag = e.sutra.dangling
      ? "截断 "
      : e.sutra.gaps.length > 0
        ? `缺字${e.sutra.gaps.length} `
        : "     ";
    console.log(
      `${String(e.sutra.text.length).padStart(3)}  ${verdict(e.sutra.text.length).padEnd(5)} ${flag}${e.volume ?? "?"}  ${e.name}`,
    );
  }
  const fits = entries.filter((e) => verdict(e.sutra.text.length) !== "over" && clean(e));
  console.log(
    `\n${entries.length} entr(ies) with a 经文; ${fits.length} fit and read cleanly ` +
      `(${entries.filter((e) => e.sutra.dangling).length} truncated, ` +
      `${entries.filter((e) => !e.sutra.dangling && e.sutra.gaps.length > 0).length} with a dropped character).\n` +
      `ext = ${CAPACITY.tight + 1}-${CAPACITY.declared} 字 needs a declared \`duration\` deviation.`,
  );
  process.exit(0);
}

if (typeof args.name !== "string") {
  console.error(
    "usage: npm run entry -- --name=<条目名> | --list [--fits] | --grep=<词> [--file=<文件名子串>]",
  );
  process.exit(2);
}

// Narrowed once: the `typeof` guard above does not survive into the closures below.
const nameQuery = args.name as string;
const exact = entries.filter((e) => e.name === nameQuery);
const near = entries.filter((e) => e.name.includes(nameQuery));
const found = exact.length > 0 ? exact : near;
if (found.length === 0) {
  console.error(`no entry matching "${args.name}" in ${config.book}`);
  process.exit(1);
}
if (found.length > 1) {
  console.error(`"${args.name}" matches ${found.length} entries — be exact: ${found.map((e) => e.name).join(" / ")}`);
  process.exit(1);
}

const e = found[0];
const length = e.sutra.text.length;
console.log(`条目：${e.name}`);
console.log(`卷次：${e.volume ?? "?"}`);
console.log(
  `字数：${length}（${verdict(length)}，roomy<=${CAPACITY.roomy} / tight<=${CAPACITY.tight} / ` +
    `ext<=${CAPACITY.declared} 需声明 duration / over>${CAPACITY.declared}）`,
);
console.log(`经文：${e.sutra.text.split(GAP_MARK).join("□")}`);
if (e.sutra.gaps.length > 0) {
  console.log(
    `\n警告：经文里有 ${e.sutra.gaps.length} 处行内缺字（底本掉字，空格即证据）：\n` +
      e.sutra.gaps.map((g) => `        …${g}…`).join("\n") +
      `\n      照录会把缺字悄悄粘成通顺的句子，比明显的空缺更危险。\n` +
      `      换个底本核对补字，或跳过这一条。`,
  );
}
if (e.sutra.dangling) {
  console.log(
    `\n警告：经文断在连接词上（…、和《吴普》曰），语料此处残缺，不能直接照录上屏。\n` +
      `      换个底本核对，或跳过这一条。`,
  );
}
if (e.name !== args.name) {
  console.log(`\n注意：<篇名> 是 "${e.name}"，你查的是 "${args.name}"。`);
}
