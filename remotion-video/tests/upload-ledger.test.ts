import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { isFrozen } from "../scripts/lib/frozen-films.ts";
import { readFilmId } from "../scripts/lib/film-files.ts";
import {
  checkLedgerCopy,
  checkTitleFrames,
  readLedgerField,
  renderLedger,
  titleFrame,
} from "../scripts/lib/ledger.ts";
import { STATS_COLUMNS } from "../scripts/lib/stats-import.ts";
import type { FilmContent } from "../src/layout.ts";

const finishedDir = new URL("../src/finished/", import.meta.url);
const uploadDir = new URL("../upload/", import.meta.url);

// Fields every upload ledger must declare. Values may stay empty while a film is
// still in production (copy is written after the final visual checks), but the
// skeleton has to be there — the previous 55 films were published with no ledger
// at all, which left nothing to cite when the platform pushed back.
const REQUIRED_LEDGER_FIELDS = [
  "film:",
  "标题：",
  "描述：",
  "话题：",
  "BGM：",
  "抖音：",
  "视频号：",
  "备注：",
];

// The stats table is what makes a ledger iterative rather than merely auditable. The
// platforms expose no open API for a personal account, so the numbers arrive from a
// creator-centre export and get merged into this fixed header.
const REQUIRED_STATS_HEADERS = [
  "## 数据回填",
  `| ${STATS_COLUMNS.join(" | ")} |`,
];

const newFilms = fs
  .readdirSync(finishedDir)
  .filter((f) => f.endsWith(".tsx") && !isFrozen(f))
  .sort();

test("every new film ships with an upload ledger naming that film", () => {
  for (const file of newFilms) {
    const kebab = file.replace(/\.tsx$/, "");
    const ledger = new URL(`${kebab}.md`, uploadDir);
    assert.equal(fs.existsSync(ledger), true, `upload/${kebab}.md is missing`);
    const copy = fs.readFileSync(ledger, "utf8");
    for (const field of [...REQUIRED_LEDGER_FIELDS, ...REQUIRED_STATS_HEADERS]) {
      assert.equal(copy.includes(field), true, `upload/${kebab}.md is missing "${field}"`);
    }
    const filmId = readFilmId(fs.readFileSync(new URL(file, finishedDir), "utf8"));
    assert.ok(filmId, `${file} declares no exported film component`);
    assert.equal(
      copy.includes(filmId),
      true,
      `upload/${kebab}.md does not name the film id ${filmId}`,
    );
  }
});

test("the upload ledger skeleton is in place for the next film", () => {
  // 黄芝 is the first film under the current rules; its ledger is written ahead of
  // the film itself, so this asserts the template is usable rather than empty.
  const next = new URL("huangzhi-first-film.md", uploadDir);
  assert.equal(fs.existsSync(next), true, "upload/huangzhi-first-film.md is missing");
  const copy = fs.readFileSync(next, "utf8");
  for (const field of [...REQUIRED_LEDGER_FIELDS, ...REQUIRED_STATS_HEADERS]) {
    assert.equal(copy.includes(field), true, `upload/huangzhi-first-film.md is missing "${field}"`);
  }
});

// ---- The copy nobody enjoys writing is derived, not typed --------------------

const sample: FilmContent = {
  id: "HuangzhiFirstFilm",
  entry: "黄芝",
  latin: "HUANG ZHI",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷一 · 上经",
  division: null,
  flavor: "味甘，平。",
  alias: "一名金芝",
  original: "主心腹五邪，益脾气，安神，忠信和乐。",
  translation: "古籍称其主心腹五种邪气，能增益脾气。",
  commentary: "古病名按原文用字保留。",
  historicalNote: "此为汉代认知，未经现代科学证实",
  facts: [
    { label: "别名", value: "金芝" },
    { label: "篇目位置", value: "卷一 · 上经" },
  ],
  photo: {
    file: "ganoderma-huangzhi.jpg",
    subject: "GANODERMA SP.",
    author: "SOMEONE",
    license: "CC BY 4.0",
  },
  music: "music/yuzhou-changwan.mp3",
  accent: "#a8812f",
  mode: "single-herb",
};

test("the ledger derives its copy fields from the content module", () => {
  const text = renderLedger(sample, null);
  assert.equal(readLedgerField(text, "film"), "`HuangzhiFirstFilm`");
  assert.equal(readLedgerField(text, "抖音"), "未发布");
  assert.equal(readLedgerField(text, "视频号"), "未发布");
  assert.equal(readLedgerField(text, "标题").length > 0, true, "a draft title must be filled");
  assert.equal(readLedgerField(text, "标题").length <= 18, true, "the title must stay short");
  assert.equal(readLedgerField(text, "描述").includes("《神农本草经》卷一·上经载黄芝。"), true);
  assert.equal(readLedgerField(text, "描述").includes("古籍内容展示，不构成诊疗建议。"), true);
  assert.equal(readLedgerField(text, "话题").includes("#古籍"), true);
  assert.equal(readLedgerField(text, "BGM").includes("music/yuzhou-changwan.mp3"), true);
});

test("re-rendering a ledger never overwrites what a human filled in", () => {
  const edited = renderLedger(sample, null)
    .replace(/- 标题：.*/, "- 标题：麻黄为何称“龙沙”？")
    .replace(/- 抖音：.*/, "- 抖音：已发布 2026-09-25");
  const again = renderLedger(sample, edited);
  assert.equal(readLedgerField(again, "标题"), "麻黄为何称“龙沙”？");
  assert.equal(readLedgerField(again, "抖音"), "已发布 2026-09-25");
  // ...and the fields that were still blank get filled on the way through.
  assert.equal(readLedgerField(again, "视频号"), "未发布");
  assert.equal(readLedgerField(again, "话题").includes("#古籍"), true);
});

test("a multi-line field survives being read back and rendered again", () => {
  // A 描述 read out of an existing ledger arrives as one string with embedded newlines.
  // Treating that as a single line collapses the block onto the field line, and the
  // second run then loses every line after the first.
  const first = renderLedger(sample, null);
  assert.equal(readLedgerField(first, "描述").split("\n").length, 3);
  const second = renderLedger(sample, first);
  assert.equal(readLedgerField(second, "描述").split("\n").length, 3, "the block must not collapse");
  assert.equal(second, first, "an untouched ledger must be stable across runs");
});

test("the stats table survives a re-render", () => {
  const withData = renderLedger(sample, null).replace(
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n| 09-25 | 抖音 | 12000 | 31% | 480 | 62 | 21 | 35 | 推荐 |",
  );
  const again = renderLedger(sample, withData);
  assert.equal(again.includes("| 09-25 | 抖音 | 12000 | 31% | 480 | 62 | 21 | 35 | 推荐 |"), true);
});

// ---- The copy the platforms actually read ------------------------------------
//
// The rules scanned the film's frames and left the title and description alone. The
// channel's penalty was applied against copy, not against a frame, so a compliant
// film could still ship with a title that promised a cure.

test("the generated copy passes the ledger check", () => {
  assert.deepEqual(checkLedgerCopy(renderLedger(sample, null)), []);
});

test("a banned claim in the title is reported, with the field that carries it", () => {
  const text = renderLedger(sample, null).replace(
    /- 标题：.*/,
    "- 标题：黄芝能治疗失眠吗",
  );
  const problems = checkLedgerCopy(text);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /^标题 contains "治疗"/);
});

test("a banned claim in the description is reported too, not just the title", () => {
  const text = renderLedger(sample, null).replace(
    "  古籍内容展示，不构成诊疗建议。",
    "  古籍内容展示，不构成诊疗建议。\n  本品可根治久咳。",
  );
  const problems = checkLedgerCopy(text);
  assert.equal(problems.length, 1, problems.join("; "));
  assert.match(problems[0], /^描述 contains "根治"/);
});

test("copy that reads as health advice is off-position, even with no banned word", () => {
  // The account is 文化 / 读书 now. "养生" is not a banned therapeutic claim in the
  // sense the penalty used, but it is exactly the framing the channel moved away from.
  const text = renderLedger(sample, null).replace(/- 话题：.*/, "- 话题：#黄芝 #养生 #中草药");
  const problems = checkLedgerCopy(text);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /话题 contains "养生"/);
  assert.match(problems[0], /文化\/读书/);
});

test("an empty field is not reported twice", () => {
  // `ledgerProblems` already fails a ledger with a missing field; the copy check
  // staying quiet here is what keeps one gap from producing two failures.
  const text = renderLedger(sample, null).replace(/- 话题：.*\n/, "- 话题：\n");
  assert.deepEqual(checkLedgerCopy(text), []);
});

test("every new film's upload copy passes the ledger check", () => {
  for (const file of newFilms) {
    const kebab = file.replace(/\.tsx$/, "");
    const copy = fs.readFileSync(new URL(`${kebab}.md`, uploadDir), "utf8");
    assert.deepEqual(checkLedgerCopy(copy), [], `upload/${kebab}.md`);
  }
});

// ---- Titles are read as a set, because "reused" is a property of the set ---------

test("the entry name and the quoted term are the slots, not the frame", () => {
  assert.equal(titleFrame("防风：古书说的「大风」是什么"), "古书说的「」是什么");
  assert.equal(
    titleFrame("防风：古书说的「大风」是什么"),
    titleFrame("决明子：古书说的「青盲」是什么"),
  );
  assert.notEqual(titleFrame("紫芝：六芝之一，形如桑"), titleFrame("决明子：又名草决明"));
});

test("two titles that are one sentence with the noun swapped are reported", () => {
  const problems = checkTitleFrames([
    { film: "fangfeng-first-film.tsx", title: "防风：古书说的「大风」是什么" },
    { film: "juemingzi-first-film.tsx", title: "决明子：古书说的「青盲」是什么" },
  ]);
  assert.equal(problems.length, 1, problems.join("; "));
  assert.match(problems[0], /^fangfeng-first-film\.tsx \/ juemingzi-first-film\.tsx share one title frame/);
});

test("titles that ask different things are not reported", () => {
  assert.deepEqual(
    checkTitleFrames([
      { film: "a.tsx", title: "紫芝：六芝之一，形如桑" },
      { film: "b.tsx", title: "蓝实：古书里的染青草" },
      { film: "c.tsx", title: "防风：古书说的「大风」是什么" },
      { film: "d.tsx", title: "决明子：又名草决明" },
    ]),
    [],
  );
});

test("no two new films reuse one title frame", () => {
  // The rule is in SKILL.md, and it is the easiest one to break without noticing:
  // every title looks fine on its own. This is the version of the check that runs
  // over the copy actually about to be posted.
  const lines = newFilms.map((file) => {
    const kebab = file.replace(/\.tsx$/, "");
    const copy = fs.readFileSync(new URL(`${kebab}.md`, uploadDir), "utf8");
    return { film: file, title: readLedgerField(copy, "标题") };
  });
  assert.deepEqual(checkTitleFrames(lines), []);
});
