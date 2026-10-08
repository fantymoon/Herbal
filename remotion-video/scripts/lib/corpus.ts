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
  /** How many characters the recension dropped. */
  gapCount: number;
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
  return { text, gaps, gapCount: gaps.length, dangling };
};

export type Entry = { name: string; volume: string | null; sutra: Sutra };

/**
 * The 生境 the 经文 names, or null when it names none.
 *
 * 神农本草经 closes 278 of its 350 entries with a 生山谷 / 生川泽 / 生平泽 clause, and
 * that clause is the only place a place-name comes from. Reading it out is what keeps the
 * 产地 fact a quotation rather than a recollection — 大枣's 经文 says 生平泽, and a
 * hand-written 产地 said 池泽, which is the 生境 of 藕实茎, the entry next to it.
 */
export const originOf = (sutra: Sutra): string | null =>
  /生([\u4e00-\u9fff]{2,3})。?$/.exec(sutra.text)?.[1] ?? null;

/** Punctuation and layout characters that carry no text, for comparing a quotation to its source. */
const quotePlain = (text: string): string =>
  text
    .replace(new RegExp(GAP_MARK, "g"), "□")
    .replace(/[\s，。、；：！？「」『』（）()《》·…—－-]/g, "");

/**
 * The 经文 on screen has to be the 经文 in the book.
 *
 * `original` is the one block every film quotes verbatim, and nothing re-derived it after
 * scaffolding: the gate compared 产地 against the text and left the quotation itself
 * unchecked. Measured against the corpus, four of six sampled films diverge — 络石 prints
 * 「水浆不下」 where the recension reads 「水浆不干」, 蓝实 silently deletes a character the
 * recension marked as lost, 大枣 and 胡麻 restore a character from another witness. The last
 * two are scholarship, the first two are errors, and on screen and to the checker all four
 * look the same.
 *
 * So the rule is not "never diverge" — it is *diverge on the record*. 原文照录 leaves no room
 * to change a character, and SKILL.md already requires a film following another witness to
 * say so in its 注释. A quotation that matches nothing in the book and names no witness is
 * what this catches.
 */
/** How a 注释 records a reading that is not the one printed in this recension. */
const WITNESS_MARKERS = /底本|别本|证类|吴普|名医|太平御览|今从|据|一作|当作|讹|阙|脱|异文|缺/;

/**
 * The 经文 on screen has to be the 经文 in the book.
 *
 * `original` is the one block every film quotes verbatim, and nothing re-derived it after
 * scaffolding: the gate compared 产地 against the text and left the quotation itself
 * unchecked. Measured against the corpus, four of six sampled films diverge — 络石 prints
 * 「水浆不下」 where the recension reads 「水浆不干」, 蓝实 silently deletes a character the
 * recension marked as lost, 大枣 and 胡麻 restore a character from another witness. The last
 * two are scholarship, the first two are errors, and on screen and to the checker all four
 * look the same.
 *
 * So the rule is not "never diverge" — it is *diverge on the record*. 原文照录 leaves no room
 * to change a character, and SKILL.md already requires a film following another witness to
 * name it in its 注释. The check therefore compares character by character and asks one
 * question of the 注释 at the exact place they part: does the film say which book it is
 * following, and does it carry the character it chose? A phrase list would have been guesswork
 * — 胡麻 writes 「底本此处缺一字，据《吴普本草》篇名补「襄」」 and matches nothing that a fixed
 * wording rule would look for.
 */
export const quoteProblems = (original: string, sutra: Sutra, commentary = ""): string[] => {
  const quote = quotePlain(original);
  const text = quotePlain(sutra.text);
  if (quote === "" || text.includes(quote)) return [];

  // Align the quotation with wherever it starts in the 经文 (films open on 主…, dropping the
  // 味 clause), then walk to the first character where the two disagree.
  let best = { at: 0, matched: -1 };
  for (let start = 0; start <= text.length - 1; start += 1) {
    let i = 0;
    while (i < quote.length && start + i < text.length && quote[i] === text[start + i]) i += 1;
    if (i > best.matched) best = { at: start, matched: i };
  }
  const ours = quote[best.matched] ?? "";
  const source = text[best.at + best.matched] ?? "";
  const context = quote.slice(Math.max(0, best.matched - 5), best.matched + 5);
  const tailMatches = (fromOurs: number, fromSource: number): boolean => {
    let i = 0;
    while (
      fromOurs + i < quote.length &&
      fromSource + i < text.length &&
      quote[fromOurs + i] === text[fromSource + i]
    ) {
      i += 1;
    }
    return fromOurs + i >= quote.length;
  };
  // The two ways a character disappears from a damaged text are different acts. Filling a
  // marked gap from another witness is scholarship; letting the gap vanish makes the sentence
  // read whole and leaves the loss invisible — which is why the recension's space is treated as
  // evidence in the first place.
  const restoration = source === "□" && tailMatches(best.matched + 1, best.at + best.matched + 1);
  const droppedGap =
    source === "□" && !restoration && tailMatches(best.matched, best.at + best.matched + 1);
  const namesWitness = commentary.includes(ours) && WITNESS_MARKERS.test(commentary);
  if (droppedGap) {
    if (/缺|阙|脱|残/.test(commentary)) return [];
    return [
      `引文在「${context}」处把底本标记的缺字删掉了 —— 空格掉字要么补、要么照录成「□」，` +
        `抹掉它等于把残缺藏成通顺`,
    ];
  }
  if (namesWitness) return [];

  if (source === "□") {
    return [
      `引文在「${context}」处补了一个底本掉落的字（作「${ours}」），而注释没有交代据本 —— ` +
        `补字必须留痕：底本此行缺字，据何本作「${ours}」`,
    ];
  }
  return [
    `引文与底本在「${context}」处分叉：底本作「${source || "（此处无字）"}」，屏幕上作「${ours}」，` +
      `而注释没有记录这处异文 —— 照录底本，或写明据本与改字理由`,
  ];
};

/**
 * The 产地 shown on screen has to be a place the cited 经文 names.
 *
 * `facts` is the one block of on-screen prose that no rule looked at, and it is the only
 * one written from memory rather than read out of the corpus — the scaffold derives 别名
 * from the 一名 clause and 篇目位置 from the 目录, but it never derived 产地, so the value
 * was whatever the author remembered. That is how 大枣 came to say 池泽 while quoting a
 * text that says 生平泽, on a screen that cites 《神农本草经》· 卷一 · 上经.
 *
 * A place the 经文 names is checkable. A place it merely omits is not this rule's business
 * — 别录 supplies 生境 for the 72 entries that have none, and 黄芝's 嵩山 is one of those.
 */
export const originProblems = (
  facts: readonly { label: string; value: string }[],
  sutra: Sutra,
): string[] => {
  const origin = facts.find((f) => f.label === "产地");
  if (!origin || sutra.text.includes(origin.value)) return [];
  const named = originOf(sutra);
  // A 经文 that names no habitat cannot be contradicted by one. The rule exists to stop
  // a film printing a place the source argues against — 大枣 shipped 池泽 while its own
  // 经文 said 生平泽, and 池泽 is the *next* entry's habitat. Where the source is silent
  // the value has to come from elsewhere (usually 别录), and the 注释 is what has to say
  // where. Flagging that as a defect made the honest case indistinguishable from the
  // careless one, which is how 黄芝's 嵩山 sat on the list.
  if (!named) return [];
  return [`产地「${origin.value}」 is not named by the 经文, which says 生${named}`];
};

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

/**
 * Put back a character the recension dropped, from a witness that kept it.
 *
 * SKILL.md sanctions two answers to a damaged 经文 — 跳过 or 换底本核对补字 — and the
 * second one needs a way to be *said*. Without it the CLI can only refuse, so the
 * sanctioned action gets taken by hand-editing the scaffold, and a hand-edited 经文
 * leaves no record of where the character came from. 胡麻 is the case: the recension
 * reads 「叶，名青□」, 《吴普本草》 has 青襄 as a 篇名, and 蘘 — the reading an editor
 * might assume — appears nowhere in the 701 files. Naming the witness is what makes
 * that a correction rather than a guess, so the caller has to name it.
 */
export const fillGaps = (sutra: Sutra, reading: string): Sutra => {
  const chars = [...reading];
  if (chars.length !== sutra.gapCount) {
    return sutra;
  }
  let i = 0;
  const text = sutra.text.replace(new RegExp(GAP_MARK, "g"), () => chars[i++] ?? "");
  return { text, gaps: [], gapCount: 0, dangling: sutra.dangling };
};
