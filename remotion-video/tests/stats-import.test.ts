import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  entryFromCopy,
  formatStatsRow,
  mergeLedgerStats,
  mergeStatsSection,
  parseCsv,
  parseExport,
  readStatsRows,
  renderPublishedLedger,
  statsHeader,
  syncPlatformFields,
  STATS_COLUMNS,
  type StatsRow,
} from "../scripts/lib/stats-import.ts";
import { readXlsx } from "../scripts/lib/xlsx.ts";

// The real exports, as the creator centres produced them. They are the fixture because
// the whole point of the importer is that the column names and the number formats are
// whatever the platform felt like: a hand-written fixture would only prove the parser
// matches the fixture.
const dataDir = new URL("../../dataExport/", import.meta.url);
const douyin = new URL("作品列表导出.xlsx", dataDir);
const channels = new URL("视频号动态数据明细.csv", dataDir);

const entryNames = async (): Promise<string[]> => {
  const progress = JSON.parse(
    fs.readFileSync(new URL("../progress.json", import.meta.url), "utf8"),
  ) as { entries: { name: string; film?: string }[] };
  const names = progress.entries.filter((entry) => entry.film).map((entry) => entry.name);
  // The book config declares the names a platform's copy may use when they differ from
  // the source heading — 卷一 calls 黄耆 "黄", which is too short to match on its own.
  const config = await import(new URL("../scripts/books/shennong-bencao-jing.mjs", import.meta.url).href);
  for (const aliases of Object.values(config.default?.titleAliases ?? {})) {
    names.push(...(aliases as string[]));
  }
  return names;
};

test("the csv reader survives the newlines a video description contains", () => {
  const rows = parseCsv('a,"line one\nline two",c\n1,2,3\n');
  assert.deepEqual(rows[0], ["a", "line one\nline two", "c"]);
  assert.deepEqual(rows[1], ["1", "2", "3"]);
  // A doubled quote is an escaped quote, not the end of the field.
  assert.deepEqual(parseCsv('"say ""hi""",b')[0], ['say "hi"', "b"]);
});

test("the entry is the name the copy opens with, not the longest name anywhere", () => {
  const known = ["硝石", "朴硝", "黄", "黄耆", "术"];
  assert.equal(entryFromCopy("朴硝：能化七十二种石，硝石是另一味。", known), "朴硝");
  assert.equal(entryFromCopy("硝石：本经主五脏积热。", known), "硝石");
  // 黄耆 opens with 黄耆 and also contains the one-character heading 黄 that 卷一 uses
  // for the same entry; the longer name wins on a tie.
  assert.equal(entryFromCopy("黄耆：痈疽久败创。", known), "黄耆");
  // 术 is one character and only safe anchored to the start of the copy.
  assert.equal(entryFromCopy("术：本经里长服山精的上品。", known), "术");
  assert.equal(entryFromCopy("这是一段不含药名的说明。", known), null);
});

test("the 抖音 export reads as a grid, with the numbers the platform wrote", async () => {
  const grid = readXlsx(fs.readFileSync(douyin));
  const header = grid[0].map((c) => String(c));
  assert.ok(header.includes("作品名称"));
  assert.ok(header.includes("2s跳出率"));

  const { rows, skipped } = parseExport(fs.readFileSync(douyin), ".xlsx", await entryNames());
  // The export belongs to the creator centre, so its row count is whatever that centre
  // wrote the last time the creator exported. Pinning it (this test used to say "49
  // videos plus the header") only turns the suite red on the next export — which is what
  // happened on 10-02, and the failure was about the fixture, not the parser. The
  // invariant is structural: every video row is either placed or reported, none dropped.
  assert.equal(
    rows.length + skipped.length,
    grid.length - 1,
    "every video row is either placed or reported as unplaced",
  );
  assert.equal(skipped.length, 0, `unplaced: ${skipped.join(" | ")}`);
  assert.ok(rows.length > 0);
  assert.ok(rows.every((row) => row.platform === "抖音"));
  const baizhi = rows.find((row) => row.entry === "白芝");
  assert.ok(baizhi);
  // 抖音 writes a ratio: 0.139808 is 14.0%, and 6.700458 is 6.7 seconds.
  // These numbers are read off the export and move whenever the creator exports again
  // (the 10-02 export nudged three of them). That is the point: what is under test is
  // the *format* — 0.343812 must become 34.4, not 0.3 and not 343812.
  assert.equal(baizhi.completion, 14.0);
  assert.equal(baizhi.fiveSecond, 34.4);
  assert.equal(baizhi.bounce2s, 27.3);
  assert.equal(baizhi.averageSeconds, 6.7);
  assert.equal(baizhi.date, "2026-09-25");
  assert.equal(baizhi.plays, 1961);
});

test("the 视频号 export reads the same shape out of different columns", async () => {
  const { rows, skipped } = parseExport(fs.readFileSync(channels), ".csv", await entryNames());
  assert.ok(rows.every((row) => row.platform === "视频号"));
  assert.ok(rows.length >= 32, `parsed ${rows.length} rows`);
  // 芍药 is a 中经 entry with no film, so it is reported rather than silently dropped.
  assert.ok(skipped.some((copy) => copy.includes("芍药")));
  const muxiang = rows.find((row) => row.entry === "木香");
  assert.ok(muxiang);
  // 视频号 writes a percentage and appends a unit: "37.93%" and "7.80秒".
  assert.equal(muxiang.completion, 37.9);
  assert.equal(muxiang.averageSeconds, 7.8);
  assert.equal(muxiang.date, "2026-08-29");
  // Neither column exists in this export, and a missing number is null, not zero.
  assert.equal(muxiang.bounce2s, null);
  assert.equal(muxiang.fiveSecond, null);
});

test("a row the export does not mention survives a merge", () => {
  const section = ["## 数据回填", "", "说明。", "", ...statsHeader(), formatStatsRow(fakeRow("2026-08-01", 999))].join("\n");
  const merged = mergeStatsSection(section, [fakeRow("2026-09-01", 5)]);
  const rows = readStatsRows(merged);
  assert.equal(rows.size, 2, "the older row must not be erased by a newer export");
  assert.ok(merged.includes("| 999 |"));
  assert.ok(merged.includes("| 5 |"));
  // Merging the same export twice is a no-op: rows are keyed by date + platform.
  assert.equal(mergeStatsSection(merged, [fakeRow("2026-09-01", 5)]), merged);
});

test("the table header follows the schema, not the ledger it came from", () => {
  const stale = ["## 数据回填", "", "表头固定，行按日期追加。", "", "| 日期 | 平台 | 播放 | 完播率 | 点赞 | 评论 | 分享 | 涨粉 | 主要来源 |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- |", "| 2026-08-01 | 抖音 | 999 | 12.0% | 1 | 0 | 0 | 0 | - |"].join("\n");
  const merged = mergeStatsSection(stale, []);
  assert.ok(merged.includes(`| ${STATS_COLUMNS.join(" | ")} |`));
  assert.equal(merged.includes("主要来源"), false, "a column no platform exports is not kept");
  assert.ok(merged.includes("| 2026-08-01 | 抖音 | 999 |"), "the row itself survives");
});

test("a ledger written for a pre-ledger film admits what is unknown", () => {
  const ledger = renderPublishedLedger("DanshaFirstFilm", [
    fakeRow("2026-08-14", 156, { platform: "抖音" }),
    fakeRow("2026-08-14", 487, { platform: "视频号" }),
  ]);
  assert.ok(ledger.includes("film: `DanshaFirstFilm`"));
  assert.ok(ledger.includes("- 抖音：已发布 2026-08-14"));
  assert.ok(ledger.includes("- 视频号：已发布 2026-08-14"));
  // The copy is not recoverable, so the fields are present and empty rather than
  // invented — the ledger test requires the field, and a made-up title would be worse.
  for (const field of ["标题：", "描述：", "话题：", "BGM："]) {
    assert.ok(new RegExp(`^- ${field}$`, "m").test(ledger), `${field} should be present and empty`);
  }
  assert.ok(ledger.includes("## 数据回填"));
});

const fakeRow = (
  date: string,
  plays: number,
  overrides: Partial<StatsRow> = {},
): StatsRow => ({
  date,
  platform: "抖音",
  entry: "丹沙",
  plays,
  bounce2s: 12.3,
  fiveSecond: 34.5,
  completion: 14.0,
  averageSeconds: 6.7,
  likes: 1,
  comments: 0,
  shares: 0,
  followers: 0,
  ...overrides,
});

test("the platform fields follow the table, whatever order the exports arrive in", () => {
  // The two platforms are imported separately, so a 抖音-only import writes 视频号 as
  // 未发布 — and that stayed wrong once the 视频号 export arrived, because the merge
  // only ever touched the table.
  const douyinOnly = renderPublishedLedger("DanshaFirstFilm", [fakeRow("2026-08-14", 156)]);
  assert.ok(douyinOnly.includes("- 视频号：未发布"));
  const both = mergeLedgerStats(douyinOnly, [fakeRow("2026-08-14", 487, { platform: "视频号" })]);
  assert.ok(both.includes("- 抖音：已发布 2026-08-14"));
  assert.ok(both.includes("- 视频号：已发布 2026-08-14"));
  // A platform with no rows is left as the human wrote it rather than reset.
  const untouched = syncPlatformFields("- 视频号：已发布 2026-09-28\n\n## 数据回填\n");
  assert.ok(untouched.includes("- 视频号：已发布 2026-09-28"));
});
