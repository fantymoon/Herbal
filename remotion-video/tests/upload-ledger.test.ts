import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { isFrozen } from "../scripts/lib/frozen-films.ts";
import { readFilmId } from "../scripts/lib/film-files.ts";
import {
  checkLedgerCopy,
  publishedOn,
  readLedgerField,
  renderLedger,
  translationDrift,
} from "../scripts/lib/ledger.ts";
import { STATS_COLUMNS } from "../scripts/lib/stats-import.ts";
import { content as puhuang } from "../src/films/puhuang-first-film.ts";
import type { FilmContent } from "../src/layout.ts";

const finishedDir = new URL("../src/finished/", import.meta.url);
const uploadDir = new URL("../upload/films/", import.meta.url);

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
    assert.equal(fs.existsSync(ledger), true, `upload/films/${kebab}.md is missing`);
    const copy = fs.readFileSync(ledger, "utf8");
    for (const field of [...REQUIRED_LEDGER_FIELDS, ...REQUIRED_STATS_HEADERS]) {
      assert.equal(copy.includes(field), true, `upload/films/${kebab}.md is missing "${field}"`);
    }
    const filmId = readFilmId(fs.readFileSync(new URL(file, finishedDir), "utf8"));
    assert.ok(filmId, `${file} declares no exported film component`);
    assert.equal(
      copy.includes(filmId),
      true,
      `upload/films/${kebab}.md does not name the film id ${filmId}`,
    );
  }
});

test("the upload ledger skeleton is in place for the next film", () => {
  // 黄芝 is the first film under the current rules; its ledger is written ahead of
  // the film itself, so this asserts the template is usable rather than empty.
  const next = new URL("huangzhi-first-film.md", uploadDir);
  assert.equal(fs.existsSync(next), true, "upload/films/huangzhi-first-film.md is missing");
  const copy = fs.readFileSync(next, "utf8");
  for (const field of [...REQUIRED_LEDGER_FIELDS, ...REQUIRED_STATS_HEADERS]) {
    assert.equal(copy.includes(field), true, `upload/films/huangzhi-first-film.md is missing "${field}"`);
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
  assert.equal(readLedgerField(text, "标题").length > 0, true, "a draft title must be filled");
  assert.equal(readLedgerField(text, "标题").length <= 18, true, "the title must stay short");
  assert.equal(readLedgerField(text, "描述").includes("《神农本草经》卷一·上经载黄芝。"), true);
  assert.equal(readLedgerField(text, "描述").includes("古籍内容展示，不构成诊疗建议。"), true);
  assert.equal(readLedgerField(text, "话题").includes("#古籍"), true);
  assert.equal(readLedgerField(text, "BGM").includes("music/yuzhou-changwan.mp3"), true);
});

test("re-rendering a ledger never overwrites what a human filled in", () => {
  const edited = renderLedger(sample, null)
    .replace(/- 标题：.*/, "- 标题：麻黄为何称“龙沙”？");
  const again = renderLedger(sample, edited);
  assert.equal(readLedgerField(again, "标题"), "麻黄为何称“龙沙”？");
  // ...and the fields that were still blank get filled on the way through.
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
    assert.deepEqual(checkLedgerCopy(copy), [], `upload/films/${kebab}.md`);
  }
});

// ---- The upload copy is scanned for the *kind* of claim, not for fifteen words --------

test("a title written as modern pharmacology is caught", () => {
  // The channel was penalised for 夸大功效, and a hand-picked word list only catches the
  // phrasings somebody thought of first. These are the sentences the old list let through:
  // none of 缓解 / 消炎 / 降血压 / 增强免疫 / 抗肿瘤 appeared in it, so a title made entirely
  // of them passed `checkLedgerCopy` with zero problems.
  const problems = checkLedgerCopy(
    ["- 标题：长期服用可缓解头痛，消炎止痛，降血压", "- 描述：增强免疫，抗肿瘤。", "- 话题：#读书"].join("\n"),
  );
  for (const word of ["缓解", "消炎", "降血压", "增强免疫", "抗肿瘤"]) {
    assert.ok(
      problems.some((p) => p.includes(word)),
      `expected a problem naming "${word}", got: ${problems.join(" | ")}`,
    );
  }
});

test("every ledger's own copy still passes the wording scan", () => {
  for (const file of newFilms) {
    const kebab = file.replace(/\.tsx$/, "");
    const copy = fs.readFileSync(new URL(`${kebab}.md`, uploadDir), "utf8");
    assert.deepEqual(checkLedgerCopy(copy), [], `upload/films/${kebab}.md`);
  }
});

// ---- A publication is a date in the ledger, not a file on this machine ---------------

test("publishedOn reads the date the platform export filled in", () => {
  const withRow = ["## 数据回填", "", "| 日期 | 平台 |", "| --- | --- |", "| 2026-09-30 | 抖音 | 1863 |"].join(
    "\n",
  );
  assert.equal(publishedOn(withRow), "2026-09-30");
  // The earliest row, because that is the day the film became untouchable.
  assert.equal(publishedOn(`${withRow}\n| 2026-10-04 | 视频号 | 12 |`), "2026-09-30");
});

test("an untouched ledger is not a publication", () => {
  // A blank platform field used to be readable as "not published" while a rendered master
  // said the opposite. Both signals now come from one place, and an empty table is not a date.
  assert.equal(publishedOn("- 标题：\n\n## 数据回填\n\n| 日期 | 平台 |\n| --- | --- |\n"), null);
  assert.equal(publishedOn(""), null);
});

// ---- A film that is live is not re-judged ---------------------------------------

test("the ledger does not ask anyone to report a publication", () => {
  // The creator publishes several films a week and will not come back to say so, so a
  // hand-typed status field is a field that rots: it starts as 未发布, stays 未发布, and the
  // gate then trusts a record nobody maintains. Publication is read out of the 数据回填 table
  // instead, which `npm run stats` fills from the platform's own export — the same evidence,
  // without anyone remembering to type it.
  const text = renderLedger(sample, null);
  assert.equal(text.includes("- 抖音："), false);
  assert.equal(text.includes("- 视频号："), false);
  // The fields that do carry weight are still there.
  for (const field of ["film:", "标题：", "描述：", "话题：", "BGM："]) {
    assert.equal(text.includes(field), true, `${field} should still be rendered`);
  }
});

test("a hand-written status line is not a publication", () => {
  // `publishedOn` must key on the imported table alone. If a typed 已发布 countered it, the
  // exemption would be granted by whoever wrote the line — which is the record that used to
  // rot, back as the thing the gate trusts.
  const typed = renderLedger(sample, null) + "- 抖音：已发布 2026-09-25\n";
  assert.equal(publishedOn(typed), null);
});

test("a ledger's 今译 that drifts from the film is caught", () => {
  // Under `reading: "copy"` the description *is* the 今译, and the ledger only ever fills
  // blanks — so the gate was validating `content.translation` for the mandated framing while
  // the platform published whatever line was pasted in first. Same class as the BGM row.
  const ledger = fs.readFileSync(new URL("puhuang-first-film.md", uploadDir), "utf8");
  assert.equal(translationDrift(puhuang, ledger), null);
  const edited = ledger.replace("古籍称其主", "本品善治");
  assert.notEqual(translationDrift(puhuang, edited), null);
  // A copy-mode film whose description carries no 今译 at all is the other way to break it.
  assert.notEqual(
    translationDrift(puhuang, ledger.replace(/\s*今译：[^\n]*/, "")),
    null,
  );
});

test("a ledger that still carries the old status fields is read, not rejected", () => {
  // Ledgers written before this change have the fields, and hand-written ones still do.
  // Nothing reads them any more, and an extra line must not fail the gate.
  const withStatus = renderLedger(sample, null) + "- 抖音：已发布 2026-09-25\n- 视频号：未发布\n";
  assert.equal(readLedgerField(withStatus, "标题").length > 0, true);
  assert.equal(checkLedgerCopy(withStatus).length, 0);
});
