// Upload-ledger rendering, shared by `npm run new-film` and `npm run ledger`.
//
// The ledger exists because the 55 published films had no record of what was posted,
// so when the platform pushed back there was nothing to cite. Keeping the skeleton in
// one place means the scaffold and the refresher cannot drift apart.
//
// Everything derivable is derived: the film id, the music, the source line, the scene
// summary and the tags all come from the content module. Only two kinds of field are
// left blank on purpose — the ones only a human knows (备注) and the ones that come
// back from the platform (发布状态, 数据回填).
import type { FilmContent } from "../../src/layout.ts";
import { BANNED_THERAPEUTIC_WORDS } from "./compliance.ts";
import { toKebab } from "./film-files.ts";
import { mergeStatsSection, statsHeader, STATS_PREAMBLE } from "./stats-import.ts";

/** `HuangzhiFirstFilm` → `huangzhi-first-film`, matching the content module and film. */
export const ledgerFileName = (content: FilmContent): string => `${toKebab(content.id)}.md`;

/** `卷一 · 上经` prints as `卷一·上经` in a citation. */
const tightVolume = (volume: string): string => volume.replace(/\s*·\s*/g, "·");

const aliasShort = (content: FilmContent): string | null =>
  content.alias ? content.alias.replace(/^一名/, "").trim() : null;

/**
 * Stable hash so consecutive entries do not all get the same question template —
 * SKILL.md forbids reusing one fixed phrasing across videos.
 */
const pick = (seed: string, count: number): number => {
  let h = 0;
  for (const ch of seed) {
    h = (h * 31 + (ch.codePointAt(0) ?? 0)) % 9973;
  }
  return h % count;
};

/**
 * A placeholder title, so the field is never empty.
 *
 * This is scaffolding, not authorship: the workflow is run by a model, and writing the
 * actual title is judgement — which alias or fact this particular entry turns on, and
 * how to say it without promising anything. A generator cannot do that from the fields
 * a content module carries, and trying turned into machinery nobody asked for. It
 * fills the field; whoever runs the workflow rewrites it.
 */
export const draftTitle = (content: FilmContent): string => {
  const alias = aliasShort(content);
  const options = alias
    ? [
        `${content.entry}为何称“${alias}”？`,
        `${content.entry}又叫${alias}，古书怎么说？`,
        `古书里的${content.entry}，别名“${alias}”`,
      ]
    : [
        `《${content.book}》里的${content.entry}`,
        `${tightVolume(content.volume)}的${content.entry}`,
      ];
  return options[pick(content.entry, options.length)];
};

export const draftDescription = (content: FilmContent): string[] => {
  const hasPhoto = content.photo.subject !== "" && !/TODO/.test(content.photo.subject);
  const head = `《${content.book}》${tightVolume(content.volume)}载${content.entry}。`;
  // When the reading is off-screen the description is the only place it can be read, so
  // it carries it in full. That is the trade the short shape makes: the film stops
  // holding a 145-character screen for six seconds nobody spends on it, and the
  // translation goes where a reader can take their time.
  if (content.reading === "copy") {
    return [
      head,
      `本片照录原文${hasPhoto ? "，并配实物照片" : ""}；今译与注释见下。`,
      `今译：${content.translation}`,
      `注释：${content.commentary}`,
      "古籍内容展示，不构成诊疗建议。",
    ];
  }
  return [
    head,
    `本片照录原文，逐句今译，附注释说明${hasPhoto ? "，并配实物照片" : ""}。`,
    "古籍内容展示，不构成诊疗建议。",
  ];
};

/**
 * The tag set follows the account's positioning, which is 文化 / 读书 — 「每日读一段本草
 * 古籍」 — not 养生.
 *
 * Tags are not decoration: they decide which audience the platform shows the video to,
 * and `#中草药` pulls in the audience the recommendation penalty was about. Leaving the
 * old set as the default is a trap for the next film — the same trap the copy scan
 * closes, one field over.
 */
export const draftTags = (content: FilmContent): string =>
  `#${content.book} #本草 #古籍 #传统文化 #读书`;

export const LEDGER_FIELDS = [
  "film",
  "标题",
  "描述",
  "话题",
  "BGM",
  "抖音",
  "视频号",
  "备注",
] as const;

export type LedgerField = (typeof LEDGER_FIELDS)[number];

/** `film` is a code key and keeps an ASCII colon; the rest are prose labels. */
const fieldPrefix = (label: LedgerField): string =>
  label === "film" ? "- film: " : `- ${label}：`;

/** Read a field back out of an existing ledger. `- 描述：` may own an indented block. */
export const readLedgerField = (text: string, label: LedgerField): string => {
  const lines = text.split(/\r?\n/);
  const prefix = fieldPrefix(label);
  const start = lines.findIndex((line) => line.startsWith(prefix));
  if (start === -1) {
    return "";
  }
  const inline = lines[start].slice(prefix.length).trim();
  const block: string[] = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    if (!lines[i].startsWith("  ") || lines[i].trim() === "") {
      break;
    }
    block.push(lines[i].trim());
  }
  return inline || block.join("\n");
};

/**
 * The date a ledger records the film going live, or null while it is unpublished.
 *
 * `FROZEN_FILMS` is a snapshot of the 55 films that were live on 2026-09-21, and it is a
 * snapshot because the legacy films have no ledgers to read — there is no other record of
 * what they carried. Films published since *do* have one, so the gate can ask instead of
 * guessing, and a film already on a platform cannot be un-published by a gate verdict: the
 * same reason a frozen film is reported and never failed. 蓝实, 紫芝, 黄芝, 防风 and
 * 决明子 are live and outside the snapshot; without this they would be judged as new work.
 *
 * Only a date counts. A blank `抖音：` means "not yet published", which keeps the default
 * fail-closed — forgetting to record a date leaves the film gated, not exempt.
 */
export const publishedOn = (copy: string): string | null => {
  for (const platform of ["抖音", "视频号"] as const) {
    const m = /已发布\s*(\d{4}-\d{2}-\d{2})/.exec(readLedgerField(copy, platform));
    if (m) return m[1];
  }
  return null;
};

/**
 * Positioning words the account moved away from after the platform's recommendation
 * penalty. The brief is 文化 / 读书 — "每日读一段本草古籍" — so copy that reads as
 * health advice is the failure mode this guards, and it is the copy the platform reads
 * first, not the frames.
 */
export const OFF_POSITION_WORDS = ["养生", "调理", "健康科普", "疗效", "药效", "治病", "防病"] as const;

/**
 * The one place a banned claim can still reach a platform.
 *
 * `checkContent` scans what the film *says* on screen. Nothing scanned the upload copy,
 * and the copy is the part the platforms act on — the channel's penalty was applied
 * against a title and a description, not against a frame. So 标题 / 描述 / 话题 get the
 * same treatment as the film's prose, plus the positioning words above.
 *
 * A field that is absent or empty is not reported here: `ledgerProblems` already fails
 * a ledger with a missing field, and saying so twice helps nobody.
 */
export const checkLedgerCopy = (text: string): string[] => {
  const problems: string[] = [];
  for (const field of ["标题", "描述", "话题"] as const) {
    const value = readLedgerField(text, field);
    if (value === "") continue;
    for (const word of BANNED_THERAPEUTIC_WORDS) {
      if (value.includes(word)) problems.push(`${field} contains "${word}"`);
    }
    if (value.includes("主治")) problems.push(`${field} contains "主治"`);
    for (const word of OFF_POSITION_WORDS) {
      if (value.includes(word)) {
        problems.push(`${field} contains "${word}" — the account is positioned as 文化/读书`);
      }
    }
  }
  return problems;
};

/**
 * The title frame, with the parts that are supposed to vary taken out.
 *
 * SKILL.md forbids reusing one fixed question template across videos: "古书说的「X」
 * 是什么" asked four times is one template, not four titles. The entry name and any
 * quoted term are the slots — what survives is the frame, and two films sharing a
 * frame is the thing the rule is about.
 *
 * The interrogative tail is stripped too. Without that, 「古书说的「青盲」是什么」 and
 * 「古书说的「厌食」」 compare as different frames because one carries a trailing 是什么
 * — and they are plainly the same template. Whatever the template is, adding or
 * dropping a question word does not make it a different one.
 */
export const titleFrame = (title: string): string =>
  title
    .replace(/^[^：:]*[：:]/, "")
    .replace(/「[^」]*」/g, "「」")
    .replace(/[，,。.？?！!、\s]/g, "")
    .replace(/(是什么|指什么|为什么|有哪些|是谁|吗|呢)$/, "");

export type TitleLine = { film: string; title: string };

/** Films whose titles are the same sentence with the noun swapped. */
export const checkTitleFrames = (titles: readonly TitleLine[]): string[] => {
  const byFrame = new Map<string, string[]>();
  for (const { film, title } of titles) {
    const frame = titleFrame(title);
    if (frame === "") continue;
    byFrame.set(frame, [...(byFrame.get(frame) ?? []), film]);
  }
  return [...byFrame.entries()]
    .filter(([, films]) => films.length > 1)
    .map(([frame, films]) => `${films.join(" / ")} share one title frame: "${frame}"`);
};

const renderField = (label: LedgerField, value: string | string[]): string => {
  // A value read back out of an existing ledger arrives as one string with embedded
  // newlines, so splitting it here is what keeps a multi-line 描述 a block instead of
  // collapsing it onto the field line on the second run.
  const raw = Array.isArray(value) ? value : value.split("\n");
  const lines = raw.map((line) => line.trim()).filter((line) => line !== "");
  const prefix = fieldPrefix(label);
  if (lines.length <= 1) {
    return `${prefix}${lines[0] ?? ""}`;
  }
  return [prefix.trimEnd(), ...lines.map((line) => `  ${line}`)].join("\n");
};

const STATS_HEADING = "## 数据回填";

const DEFAULT_STATS = [STATS_HEADING, "", STATS_PREAMBLE, "", ...statsHeader(), ""].join("\n");

/**
 * The stats block is appended to by the importer, so its rows are carried over
 * verbatim. Rebuilding them from the template would silently delete every recorded
 * week.
 *
 * The header is not data: it is the schema, and it follows `STATS_COLUMNS`. An older
 * ledger whose header names columns the platforms never export is normalised here
 * rather than left to drift.
 */
const statsSection = (existing: string | null): string => {
  const at = existing?.indexOf(STATS_HEADING) ?? -1;
  if (existing === null || at === -1) {
    return DEFAULT_STATS;
  }
  return mergeStatsSection(existing.slice(at), []);
};

/**
 * Build the ledger for one film, keeping any value that is already filled in.
 *
 * Filling only blanks is what makes this safe to re-run: the draft title a human
 * rewrote stays rewritten, and the platform fields a human recorded stay recorded.
 *
 * `note` is the one thing the content module cannot state about itself — a 经文 the
 * recension damaged and another witness repaired. It belongs in the ledger because the
 * ledger is what answers a question about a published film months later.
 */
export const renderLedger = (
  content: FilmContent,
  existing: string | null,
  note = "",
  /**
   * Leave 标题 / 描述 / 话题 empty. The scaffold sets this: it writes the ledger before the
   * prose exists, and the fill-only-blanks rule below then freezes whatever it wrote —
   * so a film scaffolded in the morning kept that morning's placeholder copy forever,
   * and `npm run ledger` could never refresh it from the finished content module. Empty
   * fields are what let the first real run fill them.
   */
  blankCopy = false,
): string => {
  const keep = (label: LedgerField, fallback: string | string[]): string | string[] => {
    const current = existing ? readLedgerField(existing, label) : "";
    return current || fallback;
  };

  const fields: string[] = [
    renderField("film", keep("film", `\`${content.id}\``)),
    renderField("标题", keep("标题", blankCopy ? "" : draftTitle(content))),
    renderField("描述", keep("描述", blankCopy ? "" : draftDescription(content))),
    renderField("话题", keep("话题", blankCopy ? "" : draftTags(content))),
    renderField(
      "BGM",
      keep("BGM", `母版配 \`${content.music}\`，上传时用平台曲库同款替换`),
    ),
    renderField("抖音", keep("抖音", "未发布")),
    renderField("视频号", keep("视频号", "未发布")),
    renderField("备注", keep("备注", note)),
  ];

  return `# ${content.entry} · 上传台账

<!-- 由 \`npm run ledger\` 从该片的内容模块生成。
     已填写的字段不会被覆盖；标题/描述是草稿，可按条目改写。 -->

${fields.join("\n")}

${statsSection(existing)}`;
};
