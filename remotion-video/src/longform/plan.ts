// 长视频《一句话的旅行》的镜头清单：schema、时间解析、版面几何。
//
// 分工：人或强模型写 src/topics/<id>/film.yaml（故事、引文、镜头类型）；
// scripts/longform/build.ts 用本文件把它校验并编译成 film.json；渲染器只读 film.json。
// 本文件是纯函数，不读文件，构建脚本、测试、渲染器三处共用同一份规则。
//
// 为什么 `at` 写旁白里的词而不是秒数：秒数换一次配音就全错，而且弱模型算不对；
// 词是稳定的锚点，构建期用 TTS 词级时间戳换算成秒。
import { z } from "zod";

// ---------- 版面常量（渲染器与几何检查共用） ----------
export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const LEAD = 0.6; // 片头到第一句旁白
export const GAP = 1.1; // 段与段之间的留白
export const TAIL = 4.2; // 最后一句到片尾卡结束
export const END_CARD_AFTER = 1.6; // 最后一句结束后多久出片尾卡

export const PAGE_CELL = 50; // 书页每字格高
export const PAGE_MAX_COL = 15; // 书页一列最多字数（再多就压字幕）
export const COLUMNS_MAX_CHARS = 16; // 竖排清单一行最多字数
export const LINEAGE_LANES = 7;
export const LINEAGE_LANE_Y0 = 320;
export const LINEAGE_LANE_DY = 72;
export const LINEAGE_YEAR0 = 780;
export const LINEAGE_YEAR1 = 1950;
export const MAX_STILL = 6.5; // 两次视觉变化之间最长秒数（超过即报错）
export const WARN_STILL = 5.0;

export const lineageX = (year: number) =>
  140 + ((year - LINEAGE_YEAR0) / (LINEAGE_YEAR1 - LINEAGE_YEAR0)) * 1640;

// ---------- schema ----------
/** 时间锚：段内秒数，或旁白里的词，可带偏移与第几次出现，如 "横行"、"横行+0.4"、"螃蟹#2"。 */
const At = z.union([z.number(), z.string().min(1)]);
const Mark = z.object({ text: z.string().min(1), at: At, to: At.optional() });
const Quote = {
  book: z.string(),
  meta: z.string(),
  /** 语料文件名，构建时逐字核对引文。 */
  file: z.string(),
  before: z.string().default(""),
  target: z.string().min(1),
  after: z.string().default(""),
  marks: z.array(Mark).default([]),
};

const ShotBase = { at: At };
export const ShotSchema = z.discriminatedUnion("type", [
  z.object({
    ...ShotBase,
    type: z.literal("page"),
    ...Quote,
    zoom: z.object({ from: At, to: At, scale: z.number().min(1).max(1.3).default(1.12) }).optional(),
  }),
  z.object({
    ...ShotBase,
    type: z.literal("photo"),
    image: z.string(),
    zoom: z.tuple([z.number(), z.number()]).default([1.05, 1.2]),
    pan: z.tuple([z.number(), z.number()]).default([0, 0]),
    y: z.number().default(0),
    title: z.string().optional(),
    gloss: z.string().optional(),
    titleAt: At.optional(),
  }),
  z.object({
    ...ShotBase,
    type: z.literal("dots"),
    /** 检索式（正则），构建时在全语料里跑，命中数写进 film.json。 */
    search: z.string(),
    /** 同书异本：这些文件序号算作一部。 */
    merge: z.array(z.array(z.number())).default([]),
    expect: z.number().int(),
    countLabel: z.string(),
    hitLabel: z.string(),
    note: z.string().default(""),
    hitAt: At,
  }),
  z.object({
    ...ShotBase,
    type: z.literal("lineage"),
    title: z.string(),
    burstAt: At,
    nodes: z.array(
      z.object({ name: z.string(), dyn: z.string(), year: z.number(), key: z.boolean().default(false), at: At.optional() }),
    ),
  }),
  z.object({
    ...ShotBase,
    type: z.literal("columns"),
    source: z.string(),
    file: z.string(),
    lines: z.array(z.string()).min(1).max(6),
    emphasize: z.number().int(),
    emphasizeAt: At,
  }),
  z.object({ ...ShotBase, type: z.literal("silent"), count: z.number().int().max(24), text: z.string() }),
  z.object({
    ...ShotBase,
    type: z.literal("confront"),
    image: z.string(),
    arrow: z.string(),
    arrowAt: At,
    ...Quote,
    morph: z.object({ from: z.string().length(2), to: z.string().length(2), at: At }),
  }),
  z.object({ ...ShotBase, type: z.literal("verdict"), char: z.string().length(1), seal: z.string().default("结案"), slamAt: At }),
]);
export type ShotSpec = z.infer<typeof ShotSchema>;

export const FilmSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  series: z.string(),
  title: z.string(),
  music: z.string(),
  musicVolume: z.number().default(0.1),
  voice: z.object({ name: z.string(), rate: z.string() }),
  images: z.record(z.string(), z.object({ file: z.string(), credit: z.string() })),
  /**
   * What the cover says. It is written out rather than derived from `title` because the
   * cover and the title have to be the same sentence — the viewer meets one of them first,
   * and both have to promise the same thing — and the film's internal title (螃蟹与横生)
   * is not that sentence. The question the episode answers is.
   */
  cover: z.object({ question: z.string(), deck: z.string().optional() }),
  segments: z
    .array(z.object({ chapter: z.string().optional(), narration: z.string().min(1), shots: z.array(ShotSchema).min(1) }))
    .min(1),
  end: z.object({ next: z.string(), sources: z.string(), disclaimer: z.string() }),
});
export type FilmSpec = z.infer<typeof FilmSchema>;

// ---------- 配音（scripts/longform/voice.py 产出） ----------
export type Word = { t: string; s: number; e: number };
export type VoiceSeg = { text: string; dur: number; words: Word[] };

/** 把词级时间戳展开成逐字时间：字符串检索比逐词匹配稳（TTS 的分词与我们的词不一致）。 */
export const charTimes = (words: Word[]) => {
  let text = "";
  const times: number[] = [];
  for (const w of words) {
    const cs = [...w.t];
    cs.forEach((c, i) => {
      text += c;
      times.push(w.s + ((w.e - w.s) * i) / cs.length);
    });
  }
  return { text, times };
};

/** 段内时间锚 → 段内秒数。找不到词时抛错，信息里带上可用的旁白。 */
export const resolveAt = (spec: string | number, seg: VoiceSeg): number => {
  if (typeof spec === "number") return spec;
  const m = spec.match(/^(.+?)(?:#(\d+))?([+-]\d+(?:\.\d+)?)?$/);
  if (!m) throw new Error(`时间锚格式不对：${spec}`);
  const word = m[1];
  const nth = Number(m[2] ?? 1);
  const offset = Number(m[3] ?? 0);
  const { text, times } = charTimes(seg.words);
  let idx = -1;
  for (let k = 0; k < nth; k++) {
    idx = text.indexOf(word, idx + 1);
    if (idx < 0) break;
  }
  if (idx < 0) throw new Error(`时间锚「${spec}」不在这一段旁白里：${seg.text}`);
  const charIdx = [...text.slice(0, idx)].length;
  return times[charIdx] + offset;
};

// ---------- 字幕 ----------
const SKIP = /[，。：；？、“”《》！「」]/;
const BREAK = /[，。：；？！]/;
export const cuesOf = (seg: VoiceSeg) => {
  const { times } = charTimes(seg.words);
  const out: { text: string; s: number }[] = [];
  let buf = "";
  let k = 0;
  let s = -1;
  for (const ch of seg.text) {
    if (SKIP.test(ch)) {
      if (BREAK.test(ch) && buf) {
        out.push({ text: buf, s });
        buf = "";
        s = -1;
      }
      continue;
    }
    if (s < 0) s = times[Math.min(k, times.length - 1)] ?? 0;
    buf += ch;
    k++;
  }
  if (buf) out.push({ text: buf, s });
  return out;
};

// ---------- 书页 ----------
/** 让 target 恰好从一列开头起排：前文按列长截齐。 */
export const alignPage = (before: string, target: string, after: string, colLen: number) => {
  const b = [...before];
  const keep = Math.floor(b.length / colLen) * colLen;
  const pre = b.slice(b.length - keep).join("");
  const text = pre + target + after;
  const a = [...pre].length;
  return { text, a, b: a + [...target].length, col: a / colLen };
};

/** 目标句不超过一列时整句占一列；更长的句子按 13 字一列折行。 */
export const pageColLen = (target: string) => {
  const n = [...target].length;
  return n <= PAGE_MAX_COL ? Math.max(10, n) : 13;
};

// ---------- 谱系图：自动分道，标签不重叠 ----------
export const labelBox = (name: string, key: boolean, year: number) => {
  const text = key ? `《${name}》` : name;
  const fs = key ? 34 : 21;
  const w = [...text].length * fs + 12;
  const x = lineageX(year);
  return { x0: x - w / 2, x1: x + w / 2 };
};

/** 贪心分道：按年份排，每个节点放进第一条与已有标签不相交的道。放不下就抛错。 */
export const assignLanes = (nodes: { name: string; key: boolean; year: number }[]) => {
  const lanes: { x0: number; x1: number }[][] = Array.from({ length: LINEAGE_LANES }, () => []);
  const order = nodes.map((n, i) => ({ n, i })).sort((p, q) => p.n.year - q.n.year);
  const result: number[] = new Array(nodes.length).fill(0);
  // 关键节点（大字）只用中间几道，避开最上和最下
  for (const { n, i } of order) {
    const box = labelBox(n.name, n.key, n.year);
    const candidates = n.key ? [1, 2, 0, 3] : [...Array(LINEAGE_LANES).keys()];
    // 道距 72px，标签高不到 66px，所以只需和同一道里的标签比
    const lane = candidates.find((l) => lanes[l].every((b) => box.x1 + 8 < b.x0 || box.x0 - 8 > b.x1));
    if (lane === undefined) throw new Error(`谱系图放不下「${n.name}」：同一年代的书太挤，删几部或拉开年份`);
    lanes[lane].push(box);
    result[i] = lane;
  }
  return result;
};

export const CHAPTER_NUMS = ["壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌"];

// ---------- 编译产物 ----------
export type CompiledShot = Record<string, unknown> & { type: ShotSpec["type"]; from: number; to: number; events: number[] };
export type CompiledFilm = {
  id: string;
  series: string;
  title: string;
  music: string;
  musicVolume: number;
  images: Record<string, { file: string; credit: string }>;
  cover: { question: string; deck?: string };
  totalFrames: number;
  segments: { start: number; dur: number; chapter: string | null; chapterNum: string | null; cues: { text: string; s: number }[] }[];
  shots: CompiledShot[];
  end: { from: number; next: string; sources: string; disclaimer: string };
};
