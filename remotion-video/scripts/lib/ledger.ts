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
  return [
    `《${content.book}》${tightVolume(content.volume)}载${content.entry}。`,
    `本片照录原文，逐句今译，附注释说明${hasPhoto ? "，并配实物照片" : ""}。`,
    "古籍内容展示，不构成诊疗建议。",
  ];
};

export const draftTags = (content: FilmContent): string =>
  `#${content.entry} #${content.book} #本草 #中草药`;

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
 */
export const renderLedger = (content: FilmContent, existing: string | null): string => {
  const keep = (label: LedgerField, fallback: string | string[]): string | string[] => {
    const current = existing ? readLedgerField(existing, label) : "";
    return current || fallback;
  };

  const fields: string[] = [
    renderField("film", keep("film", `\`${content.id}\``)),
    renderField("标题", keep("标题", draftTitle(content))),
    renderField("描述", keep("描述", draftDescription(content))),
    renderField("话题", keep("话题", draftTags(content))),
    renderField(
      "BGM",
      keep("BGM", `母版配 \`${content.music}\`，上传时用平台曲库同款替换`),
    ),
    renderField("抖音", keep("抖音", "未发布")),
    renderField("视频号", keep("视频号", "未发布")),
    renderField("备注", keep("备注", "")),
  ];

  return `# ${content.entry} · 上传台账

<!-- 由 \`npm run ledger\` 从该片的内容模块生成。
     已填写的字段不会被覆盖；标题/描述是草稿，可按条目改写。 -->

${fields.join("\n")}

${statsSection(existing)}`;
};
