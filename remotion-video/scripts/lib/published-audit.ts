// Audit the films that are already live against the rules the current engine enforces.
//
// Why this exists: 55 films shipped before the reading budget and the historical
// framing existed, so "which masters are worth taking down, and in what order" was a
// question with no evidence behind it. The published films are frozen — the rules are
// not re-applied to them — but they are still the thing the account is judged on, so
// the gaps are measured rather than guessed.
//
// Two kinds of film, one report: a data-driven film answers from its layout plan (the
// same numbers `npm run check` gates on), a hand-written one from its JSX plus its
// duration and breaks.
import {
  countCJK,
  planFilm,
  readingBudget,
  visibleText,
  type FilmContent,
} from "../../src/layout.ts";
import { BANNED_THERAPEUTIC_WORDS, REQUIRED_FRAME, REQUIRED_NOTE } from "./compliance.ts";
import { extractVisibleText } from "./repeat-scan.ts";

export type ScreenReading = {
  /** Chinese characters a viewer has to read on this screen. */
  chars: number;
  frames: number;
  rate: number;
};

export type FilmAudit = {
  file: string;
  kebab: string;
  duration: number;
  screens: ScreenReading[];
  /** Characters per second the busiest screen asks for. */
  worstRate: number;
  /** Carries the mandated historical framing for a 主…… efficacy clause. */
  historicalFrame: boolean;
  /** Carries the mandated "未经现代科学证实" line. */
  historicalNote: boolean;
  banned: string[];
  /**
   * Uses 主治. Grandfathered for published films, and the phrasing the platform's
   * "夸大功效" judgement most plausibly landed on.
   */
  zhuzhi: boolean;
  frozen: boolean;
  /** The date the ledger records for each platform, or null when it records none. */
  douyin: string | null;
  channels: string | null;
};

/**
 * Which platforms a film is live on, read off its ledger.
 *
 * This is the column the disposition list could not fill when it was first written: the
 * 55 masters shipped before ledgers existed, so "which ones are still public on the
 * account that pushed back" had no answer. `npm run stats` now writes that ledger from
 * the platform export, so the answer exists and belongs in the same table.
 */
export const readPlatformStatus = (
  ledger: string | null,
): Pick<FilmAudit, "douyin" | "channels"> => {
  const dateFor = (label: string): string | null =>
    ledger?.match(new RegExp(`^- ${label}：已发布 (\\d{4}-\\d{2}-\\d{2})`, "m"))?.[1] ?? null;
  return { douyin: dateFor("抖音"), channels: dateFor("视频号") };
};

const toKebab = (file: string): string => file.replace(/\.tsx$/, "");

/** Labels and the ASCII credit line are chrome; nobody reads them as prose. */
const CHROME = /^(SHENNONG|CLASSICAL ENTRY|MODERN READING|COMMENTARY|FIELD NOTE|PUBLICATION NOTE|TCM|ENTRY)/;

/** Same measure as the data-driven path: Chinese characters, not punctuation. */
const chars = (texts: string[]): number => countCJK(texts.join(""));

/**
 * Per-screen reading load of a hand-written film.
 *
 * The scene components are split apart by name (`const HeroScene: React.FC`) and each
 * one's text attributed to its own interval. That is the only scene boundary a JSX
 * film has — the layout engine computes the boundaries for a data-driven film, but a
 * published one only ever wrote `breaks={[a, b]}` by hand.
 */
export const auditHandWritten = (
  file: string,
  source: string,
  fps = 30,
): Pick<FilmAudit, "duration" | "screens"> => {
  const duration = Number(source.match(/durationInFrames=\{(\d+)\}/)?.[1] ?? 0);
  const breaks = (source.match(/breaks=\{\[([\d\],\s]+)\]\}/)?.[1] ?? "")
    .split(",")
    .map((n) => Number(n.trim()))
    .filter((n) => Number.isFinite(n));

  const parts = source.split(/const\s+\w+Scene\s*:\s*React\.FC/);
  const perScene = parts.slice(1).map((body) =>
    chars(extractVisibleText(body).filter((text) => !CHROME.test(text))),
  );
  const bounds = duration > 0 ? [0, ...breaks, duration] : [];
  const screens = perScene.map((count, index) => {
    const frames =
      bounds.length >= 2
        ? (bounds[index + 1] ?? duration) - (bounds[index] ?? 0)
        : 0;
    return { chars: count, frames, rate: frames > 0 ? count / (frames / fps) : 0 };
  });
  return { duration, screens };
};

/** Per-screen reading load of a data-driven film, straight off its plan. */
export const auditDataDriven = (
  content: FilmContent,
  fps = 30,
): Pick<FilmAudit, "duration" | "screens"> => {
  const plan = planFilm(content);
  return {
    duration: plan.durationInFrames,
    screens: readingBudget(plan).map((scene) => ({
      chars: scene.chars,
      frames: scene.allotted,
      rate: scene.rate,
    })),
  };
};

export const auditFilm = (
  file: string,
  source: string,
  content: FilmContent | null,
  frozen: boolean,
  ledger: string | null = null,
): FilmAudit => {
  const measured = content
    ? auditDataDriven(content)
    : auditHandWritten(file, source);
  const prose = content
    ? [content.translation, content.commentary, content.original, ...visibleText(content)].join("\n")
    : extractVisibleText(source).join("\n");
  return {
    file,
    kebab: toKebab(file),
    duration: measured.duration,
    screens: measured.screens,
    worstRate: measured.screens.reduce((worst, s) => Math.max(worst, s.rate), 0),
    historicalFrame: prose.includes(REQUIRED_FRAME),
    historicalNote: prose.includes(REQUIRED_NOTE),
    banned: BANNED_THERAPEUTIC_WORDS.filter((word) => prose.includes(word)),
    zhuzhi: prose.includes("主治"),
    frozen,
    ...readPlatformStatus(ledger),
  };
};

export type Disposition = "私密·重制" | "私密" | "重制" | "留";

/**
 * What to do with a published master.
 *
 * Two facts, in this order. First, the platform: 视频号 cut distribution between 08-19
 * and 08-21 — 菟丝子 went from 1642 plays to nothing — and the films still public there
 * are the ones the account is still being judged on. Taking them down is a single
 * action, so it comes before anything that has to be done one film at a time.
 *
 * Second, the reading load. It is the only thing that separates the films from each
 * other: 主治 is on 44 of 55 and the historical framing is on none, so neither can rank
 * them. A screen asking for more than 30 characters per second is unreadable at any
 * playback speed, which is the defect the engine rewrite was about — worth re-making
 * whether or not the platform ever objected.
 *
 * A starting position, not a verdict: it does not know whether a master was already
 * taken down by hand, or how the account was repositioned.
 */
export const dispositionOf = (row: FilmAudit): Disposition => {
  const unreadable = row.worstRate > 30;
  if (row.channels !== null) {
    return unreadable ? "私密·重制" : "私密";
  }
  return unreadable ? "重制" : "留";
};

const round = (n: number): string => n.toFixed(1);

export const formatAuditTable = (rows: FilmAudit[]): string[] => {
  const header = "file\tdur\tscreens\tworst/s\tframe\tnote\tbanned\t主治";
  return [
    header,
    ...rows.map((row) =>
      [
        row.file,
        row.duration,
        row.screens.length,
        round(row.worstRate),
        row.historicalFrame ? "Y" : "-",
        row.historicalNote ? "Y" : "-",
        row.banned.join(",") || "-",
        row.zhuzhi ? "Y" : "-",
      ].join("\t"),
    ),
  ];
};

/**
 * The same report as a markdown table, worst screen first, for the disposition list.
 *
 * `names` maps a kebab name to the entry it covers so the table is readable without
 * cross-referencing `progress.json`.
 */
export const formatAuditMarkdown = (
  rows: FilmAudit[],
  names: Map<string, string> = new Map(),
): string[] => {
  const sorted = [...rows].sort((a, b) => b.worstRate - a.worstRate);
  const lines = [
    "| 影片 | 条目 | 时长 | 中屏字/秒 | 主治 | 帧定 | 注释 | 平台 | 处置 |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ];
  const on = (date: string | null): string => (date ? date.slice(5) : "—");
  for (const row of sorted) {
    lines.push(
      `| \`${row.kebab}\` | ${names.get(row.kebab) ?? "—"} | ${(row.duration / 30).toFixed(0)}s ` +
        `| ${round(row.worstRate)} | ${row.zhuzhi ? "有" : "无"} | ${row.historicalFrame ? "有" : "无"} ` +
        `| ${row.historicalNote ? "有" : "无"} | 抖${on(row.douyin)} / 视${on(row.channels)} ` +
        `| ${dispositionOf(row)} |`,
    );
  }
  return lines;
};

export const summarizeAudit = (rows: FilmAudit[]): string => {
  const over = rows.filter((row) => row.worstRate > 15);
  const buckets = (["私密·重制", "私密", "重制", "留"] as const).map(
    (label) => `${rows.filter((row) => dispositionOf(row) === label).length} ${label}`,
  );
  return (
    `${rows.length} film(s): ${over.length} ask for more than 15 chars/s on some screen, ` +
    `${rows.filter((r) => !r.historicalFrame).length} carry no 古籍称其主 frame, ` +
    `${rows.filter((r) => !r.historicalNote).length} carry no historical note, ` +
    `${rows.filter((r) => r.zhuzhi).length} still say 主治, ` +
    `${rows.filter((r) => r.banned.length > 0).length} contain a banned modern efficacy word. ` +
    `Disposition: ${buckets.join(", ")}`
  );
};
