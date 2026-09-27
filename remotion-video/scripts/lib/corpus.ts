// Read the classical corpus.
//
// Two callers need the same answer to "what is this entry's 经文": `new-film.ts`, which
// writes it into a content module, and `entry-text.ts`, which reports it. They used to
// carry separate readers and they drifted — `new-film` read only the *first* line of the
// 内容 block, so every entry whose 经文 wraps across lines was scaffolded with a truncated
// original. 决明子 came out as "…久服，益精光（《太平御览》", which reads like a plausible
// sentence and would have gone on screen as one. 防风 lost its 一名铜芸。生川泽 the same
// way. One implementation, two front-ends, so the next fix lands in both.
import fs from "node:fs";

/**
 * Every file in the corpus is GB18030, not UTF-8.
 *
 * This is the reason the docs used to be wrong about searching: ripgrep (and every other
 * byte-wise UTF-8 matcher) finds *no* Chinese in these files and reports "not found" for
 * text that is plainly there. Decode first, then search.
 */
export const readCorpus = (sourcePath: string): string[] =>
  new TextDecoder("gb18030").decode(fs.readFileSync(sourcePath)).split("\n");

/** Stands in for a character the recension dropped. Never reaches a screen. */
export const GAP_MARK = "\u0000";

/**
 * A space *inside* a line, between two CJK characters, is a dropped character.
 *
 * The recension wraps lines mid-sentence, so a line break is normal and must not be read
 * as a defect — but a space in the middle of a line is not typography. 龙骨 reads
 * "主小儿、大人惊痫 疾狂走"; 黄连 reads "主热气目痛、 伤泣出". Collapsing whitespace
 * silently welds those into a fluent sentence that is *missing characters*, which is
 * worse than an obvious gap because nothing on screen looks wrong.
 *
 * CJK punctuation counts on either side: requiring a Han character on both sides missed
 * 黄连, whose gap follows 、. The appendix sections ("丹砂 云母 玉泉") are full of CJK
 * spaces too, but none of them carries 味/主, so they are rejected before they get here.
 */
const markInlineGaps = (raw: string): string =>
  raw
    .replace(/\r/g, "")
    .replace(
      /([\u3000-\u9fff\uff00-\uffef])[ \t]+([\u3000-\u9fff\uff00-\uffef])/g,
      `$1${GAP_MARK}$2`,
    );

/**
 * Where the entry's own text stops and later hands begin.
 *
 * 《吴普》曰, 《名医》曰, 案 — these are commentary added by 孙星衍's recension and by
 * earlier editors. They are not what the film reads out.
 */
const COMMENTARY_CUTS = [
  "《吴普》", "《名医》", "《御览》", "《太平御览》", "《大观》", "《大观本》",
  "《说文》", "《尔雅》", "《广雅》", "《博物志》", "《范子计然》", "《中山经》",
  "《诗》", "《传》", "案∶", "案：", "旧作", "旧在",
];

export type Sutra = {
  /** The 经文, with `GAP_MARK` standing in for each dropped character. */
  text: string;
  /** ±5 characters around each gap, with the gap shown as □. */
  gaps: string[];
  /** The text ends on a conjunction, so the recension truncated it mid-sentence. */
  dangling: boolean;
};

/**
 * The 经文 out of one entry's body: 味…，…。主…，…。一名…。生山谷。
 *
 * Parenthesised notes come out *first*, because the recension uses them for inline
 * variant readings inside the 经文 ("骨节疼痹（《御览》作痛），烦满"). Cutting at the
 * bracket instead of removing it drops everything after it. Only then does the text get
 * cut at the first marker that opens commentary.
 *
 * Returns null for a body that is not an entry's 经文 at all — the appendix sections and
 * the several 内容 lines that are nothing but a parenthetical note.
 */
export const sutraOf = (body: string): Sutra | null => {
  const flat = markInlineGaps(body)
    .replace(/\s+/g, "")
    .replace(/\\x[0-9a-fA-F]+/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/^内容：/, "")
    // Inline editorial notes, innermost first, so nested brackets resolve.
    .replace(/（[^（）]*）/g, "");
  const cuts = COMMENTARY_CUTS.map((m) => flat.indexOf(m)).filter((i) => i > 0);
  const cut = cuts.length > 0 ? Math.min(...cuts) : flat.length;
  const text = flat.slice(0, cut).replace(/。+$/, "") + "。";
  if (!/主/.test(text) || !/味/.test(text)) return null;
  // Each gap is one lost character, so it counts toward the length like any other —
  // the film still has to make room for it once the character is restored.
  const gaps = [...text.matchAll(new RegExp(`.{0,5}${GAP_MARK}.{0,5}`, "g"))].map((m) =>
    m[0].replace(GAP_MARK, "□"),
  );
  // 卷柏's 经文 is truncated in this recension: "…久服，轻身、和《吴普》曰" — the sentence
  // is cut mid-list and what is left ends on a conjunction. That is the signature of a
  // defect, not of a short entry, and the words would go on screen.
  const dangling = /[、，和与及]$/.test(flat.slice(0, cut));
  return { text, gaps, dangling };
};

export type Entry = { name: string; volume: string | null; sutra: Sutra };

/** Every `<篇名>` in the file that carries a readable 经文, in original order. */
export const findEntries = (lines: string[]): Entry[] => {
  const entries: Entry[] = [];
  let volume: string | null = null;
  for (let i = 0; i < lines.length; i += 1) {
    const dir = lines[i].trim().match(/^<目录>(.*)$/);
    if (dir) volume = dir[1].trim();
    const head = lines[i].trim().match(/^<篇名>(.*)$/);
    if (!head) continue;
    const body: string[] = [];
    for (let j = i + 1; j < lines.length; j += 1) {
      if (/^<(篇名|目录)>/.test(lines[j].trim())) break;
      body.push(lines[j]);
    }
    const sutra = sutraOf(body.join("\n"));
    if (sutra) entries.push({ name: head[1].trim(), volume, sutra });
  }
  return entries;
};

/**
 * A 经文 that cannot be quoted faithfully.
 *
 * `原文照录` is the one rule with no editorial latitude: if the recension dropped a
 * character or cut a sentence short, the film has nothing correct to show. Both CLIs
 * refuse rather than guess, because a fluent sentence with a hole in it is the one
 * failure a reader cannot catch.
 */
export const defectOf = (sutra: Sutra): string | null => {
  if (sutra.dangling) {
    return "经文断在连接词上（…、和《吴普》曰），语料此处残缺";
  }
  if (sutra.gaps.length > 0) {
    return `经文有 ${sutra.gaps.length} 处行内缺字：${sutra.gaps.join(" / ")}`;
  }
  return null;
};
