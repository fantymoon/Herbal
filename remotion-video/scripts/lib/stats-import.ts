// Import a platform's performance export into the upload ledgers.
//
// Why: the ledger's data table was the one field a human had to fill, and the export
// columns are platform-specific and undocumented, so "weekly, by hand" meant nobody
// ever did it. The two platforms disagree on almost every column name and on how they
// format a number — 抖音 writes 完播率 as 0.1398 and 视频号 writes it as "13.98%", one
// writes a date as `2026-09-25 08:00:00` and the other as `2026/08/30` — so both are
// normalised here and the ledger records one shape.
//
// The row is keyed by date + platform, so re-importing an overlapping export replaces
// the row instead of appending a duplicate.
import { readXlsx } from "./xlsx.ts";

export type Platform = "抖音" | "视频号";

export type StatsRow = {
  date: string;
  platform: Platform;
  plays: number | null;
  /** Percentage of viewers who leave within two seconds — the hook metric. */
  bounce2s: number | null;
  /** Percentage who are still watching at five seconds. */
  fiveSecond: number | null;
  completion: number | null;
  averageSeconds: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  followers: number | null;
  /** The entry the platform's copy leads with, resolved against progress.json. */
  entry: string;
};

/**
 * The ledger's data table. `主要来源` is gone: neither export has a traffic-source
 * column, and a column that can never be filled is a column that makes the table look
 * broken. The two 抖音-only metrics are here because the hook is the thing the data
 * actually moved on.
 */
export const STATS_COLUMNS = [
  "日期",
  "平台",
  "播放",
  "2s跳出",
  "5s完播",
  "完播率",
  "均时",
  "点赞",
  "评论",
  "分享",
  "涨粉",
] as const;

/**
 * The table's explanatory line. Kept here so the ledger template and the importer cannot
 * drift: they did, and an untouched ledger stopped being byte-stable across runs.
 */
export const STATS_PREAMBLE =
  "平台不提供开放接口，数据来自创作者中心导出，每周回填一次。\n" +
  "`npm run stats -- --file=<导出文件>` 按日期合并，重复导入同一天不会追加第二行。";

/** The table's identity. Two exports covering the same day replace, never append. */
export const rowKey = (row: Pick<StatsRow, "date" | "platform">): string =>
  `${row.date}|${row.platform}`;

const num = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  const text = String(value).trim().replace(/,/g, "");
  if (text === "" || text === "-") {
    return null;
  }
  const parsed = Number(text.replace(/%$/, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

/** 抖音 writes a ratio (0.1398), 视频号 writes a percentage ("13.98%"). Both -> 14.0. */
const asPercent = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  const text = String(value).trim();
  if (text === "" || text === "-") {
    return null;
  }
  const parsed = num(text);
  if (parsed === null) {
    return null;
  }
  const percent = text.endsWith("%") ? parsed : parsed <= 1 ? parsed * 100 : parsed;
  return Number(percent.toFixed(1));
};

/** "7.80秒" | "6.700458" | "0" -> seconds, or null when the platform has nothing. */
const asSeconds = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  const text = String(value).trim().replace(/秒$/, "");
  if (text === "" || text === "-") {
    return null;
  }
  const parsed = Number(text);
  return Number.isFinite(parsed) && parsed > 0 ? Number(parsed.toFixed(1)) : null;
};

/** "2026/08/30" | "2026-09-25 08:00:00" | a Date -> YYYY-MM-DD. */
const asDate = (value: unknown): string | null => {
  const text = String(value ?? "").trim();
  const match = text.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (!match) {
    return null;
  }
  return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
};

/**
 * Which entry a piece of platform copy is about.
 *
 * The platforms do not export a film id, and their copy templates have changed over
 * time ("《神农本草经》里的扁青：…", "《神农本草经》如何记载柴胡？"), so parsing the
 * name out of the sentence is hopeless. The longest known entry name that appears in
 * the copy is not: it is also what makes 黄耆 win over the 黄 that the source text uses
 * for the same entry.
 */
export const entryFromCopy = (copy: string, known: readonly string[]): string | null => {
  const head = copy.trimStart();
  let best: string | null = null;
  let bestAt = Number.POSITIVE_INFINITY;
  for (const entry of known) {
    const at = copy.indexOf(entry);
    if (at === -1) {
      continue;
    }
    // A one-character heading (术, 黄) is too short to match anywhere in a sentence
    // without hitting unrelated words, but the platform's copy always leads with the
    // drug's name, so those are anchored to the start.
    if (entry.length < 2 && !new RegExp(`^${entry}[：:]`).test(head)) {
      continue;
    }
    // Earliest wins, then longest. The copy opens with the drug's name, so the first
    // occurrence is the one being posted about; 朴硝's copy mentions 硝石 further in,
    // and picking by length alone gave the row to whichever name was iterated first.
    if (at < bestAt || (at === bestAt && best !== null && entry.length > best.length)) {
      best = entry;
      bestAt = at;
    }
  }
  return best;
};

/** RFC4180-ish rows, tolerant of the embedded newlines a 视频描述 contains. */
export const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
};

const gridToRows = (
  grid: (string | number | null)[][],
  known: readonly string[],
): { rows: StatsRow[]; skipped: string[] } => {
  const header = (grid[0] ?? []).map((c) => String(c ?? "").trim());
  const at = (name: string): number => header.indexOf(name);
  const column = {
    copy: at("视频描述") !== -1 ? at("视频描述") : at("作品名称"),
    date: at("发布时间"),
    plays: at("播放量"),
    bounce: at("2s跳出率"),
    five: at("5s完播率"),
    completion: at("完播率"),
    average: at("平均播放时长"),
    likes: at("喜欢") !== -1 ? at("喜欢") : at("点赞量"),
    comments: at("评论量"),
    shares: at("分享量"),
    followers: at("关注量") !== -1 ? at("关注量") : at("粉丝增量"),
  };
  const platform: Platform = at("视频ID") !== -1 ? "视频号" : "抖音";
  const pick = (row: (string | number | null)[], index: number): unknown =>
    index === -1 ? null : row[index];

  const rows: StatsRow[] = [];
  const skipped: string[] = [];
  for (const row of grid.slice(1)) {
    const copy = String(pick(row, column.copy) ?? "");
    const date = asDate(pick(row, column.date));
    const entry = entryFromCopy(copy, known);
    if (!date || !entry) {
      // A blank trailing row is normal; a row with copy but no date or no known entry
      // is a row this importer cannot place, and silently dropping it would understate
      // what the account has posted.
      if (copy.trim() !== "") {
        skipped.push(!date ? `${copy.slice(0, 20)}… (no date)` : `${copy.slice(0, 20)}…`);
      }
      continue;
    }
    rows.push({
      date,
      platform,
      entry,
      plays: num(pick(row, column.plays)),
      bounce2s: asPercent(pick(row, column.bounce)),
      fiveSecond: asPercent(pick(row, column.five)),
      completion: asPercent(pick(row, column.completion)),
      averageSeconds: asSeconds(pick(row, column.average)),
      likes: num(pick(row, column.likes)),
      comments: num(pick(row, column.comments)),
      shares: num(pick(row, column.shares)),
      followers: num(pick(row, column.followers)),
    });
  }
  return { rows, skipped };
};

/** Parse either platform's export. The extension decides how it is unpacked. */
export const parseExport = (
  file: Buffer,
  extension: string,
  known: readonly string[],
): { rows: StatsRow[]; skipped: string[] } => {
  if (extension === ".xlsx") {
    return gridToRows(readXlsx(file), known);
  }
  const text = file.toString("utf8").replace(/^\uFEFF/, "");
  return gridToRows(parseCsv(text), known);
};

const cell = (value: number | null, suffix = ""): string =>
  value === null ? "-" : `${value}${suffix}`;

/** One ledger row. `-` rather than an empty cell, so the column stays aligned. */
export const formatStatsRow = (row: StatsRow): string =>
  `| ${row.date} | ${row.platform} | ${cell(row.plays)} | ${cell(row.bounce2s, "%")} | ` +
  `${cell(row.fiveSecond, "%")} | ${cell(row.completion, "%")} | ${cell(row.averageSeconds, "s")} | ` +
  `${cell(row.likes)} | ${cell(row.comments)} | ${cell(row.shares)} | ${cell(row.followers)} |`;

/** `| 日期 | 平台 | … |` plus the separator, matching `STATS_COLUMNS`. */
export const statsHeader = (): string[] => [
  `| ${STATS_COLUMNS.join(" | ")} |`,
  `| ${STATS_COLUMNS.map(() => "---").join(" | ")} |`,
];

const isHeaderOrRule = (line: string): boolean =>
  line.includes("日期") && line.includes("平台") || /^\|\s*-{3}/.test(line);

/** Existing rows in the ledger's table, keyed so a re-import replaces rather than appends. */
export const readStatsRows = (section: string): Map<string, string> => {
  const rows = new Map<string, string>();
  for (const line of section.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|") || isHeaderOrRule(trimmed)) {
      continue;
    }
    const [, date, platform] = trimmed.split("|").map((c) => c.trim());
    if (date && platform) {
      rows.set(`${date}|${platform}`, trimmed);
    }
  }
  return rows;
};

/**
 * Merge an export into a ledger's data table.
 *
 * Rows the export does not mention are kept: a weekly export usually covers a window,
 * and dropping everything outside it would erase the weeks before.
 */
export const mergeStatsSection = (section: string, incoming: StatsRow[]): string => {
  const heading = "## 数据回填";
  const preamble = section.includes(heading)
    ? section.slice(section.indexOf(heading) + heading.length).split("\n\n")[0].trim()
    : "";
  const rows = readStatsRows(section);
  for (const row of incoming) {
    rows.set(rowKey(row), formatStatsRow(row));
  }
  const sorted = [...rows.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, line]) => line);
  return [
    heading,
    "",
    preamble || STATS_PREAMBLE,
    "",
    ...statsHeader(),
    ...sorted,
    "",
  ].join("\n");
};

/** `已发布 2026-09-25` for the earliest row on a platform, `未发布` for none. */
const platformStatus = (rows: StatsRow[], platform: Platform): string => {
  const dates = rows
    .filter((row) => row.platform === platform)
    .map((row) => row.date)
    .sort();
  return dates.length > 0 ? `已发布 ${dates[0]}` : "未发布";
};

/**
 * A ledger for a film that shipped before ledgers existed.
 *
 * The copy is gone: nobody recorded the title, the description or the music, and the
 * export carries only the text the platform was given, not the tags or the track. Those
 * fields are left empty rather than invented. What the export *does* carry is which
 * platform the film is on and how it performed — which is the question that had no
 * answer when the account was pushed back on, because there was nothing to read.
 */
export const renderPublishedLedger = (filmId: string, rows: StatsRow[]): string => {
  const entries = [...new Set(rows.map((row) => row.entry))].join(" / ");
  return [
    `# ${entries} · 上传台账（存量回填）`,
    "",
    "<!-- 由 `npm run stats` 从平台导出生成。本片发布于台账存在之前，",
    "     标题 / 描述 / 话题 / BGM 均已不可考，留空而不臆造；",
    "     平台状态与数据表来自创作者中心导出。 -->",
    "",
    `- film: \`${filmId}\``,
    "- 标题：",
    "- 描述：",
    "- 话题：",
    "- BGM：",
    `- 抖音：${platformStatus(rows, "抖音")}`,
    `- 视频号：${platformStatus(rows, "视频号")}`,
    "- 备注：存量影片，文案不可考；平台数据由导出回填。",
    "",
    mergeStatsSection("", rows),
  ].join("\n");
};

/**
 * Bring `- 抖音：` / `- 视频号：` in line with the data table.
 *
 * The two platforms are imported separately, so the first import can only see one of
 * them: 丹沙's 视频号 field was written `未发布` by the 抖音 export and stayed wrong
 * after the 视频号 export arrived. Deriving both from the merged table makes the answer
 * independent of import order.
 *
 * A platform with no rows is left alone rather than reset to `未发布` — a human may have
 * recorded the post before the first export that covers it.
 */
export const syncPlatformFields = (ledger: string): string => {
  const rows = readStatsRows(ledger);
  const datesFor = (platform: Platform): string[] =>
    [...rows.keys()]
      .filter((key) => key.endsWith(`|${platform}`))
      .map((key) => key.split("|")[0])
      .sort();
  let next = ledger;
  for (const platform of ["抖音", "视频号"] as const) {
    const dates = datesFor(platform);
    if (dates.length === 0) {
      continue;
    }
    next = next.replace(new RegExp(`^- ${platform}：.*$`, "m"), `- ${platform}：已发布 ${dates[0]}`);
  }
  return next;
};

/**
 * Merge rows into a whole ledger.
 *
 * This is the entry point callers want. `mergeStatsSection` returns the table section on
 * its own — passing it a whole ledger silently drops every field above the table, which
 * is a mistake that leaves a film's ledger looking empty rather than looking wrong.
 */
export const mergeLedgerStats = (ledger: string, rows: StatsRow[]): string => {
  const heading = "## 数据回填";
  const merged = mergeStatsSection(ledger, rows);
  const next = ledger.includes(heading)
    ? ledger.slice(0, ledger.indexOf(heading)) + merged
    : `${ledger.trimEnd()}\n\n${merged}`;
  return syncPlatformFields(next);
};
