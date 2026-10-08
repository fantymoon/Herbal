// 「本草一问」系列的内容类型。
//
// 一句话定位：**每集 40 秒，答一个你想问但没人讲过的本草问题。**
// 讲名物、文字、历史，不讲功效——古书里的功效句只作为带出处的原文出现在画面上，
// 旁白从不复述。合规靠样式本身保证，不靠事后审词。
//
// 与另外两条线的关系：单味药短片（src/films/）的时间基准是阅读量，
// 跨书专题（src/topics/）的时间基准是旁白；这一条的时间基准也是旁白，
// 但它的**结构是固定的五段**——问、物、书、考、收。固定结构就是这个系列的辨识度：
// 每集都按同一个节奏走，观众看第二集就认得出。
//
// 三条硬约束，由 scripts/ask-check.ts 强制（用户定的是"只留三条"）：
//   1. 旁白与字幕里不出现功效词——功效只留在照录的引文里；
//   2. 每条引文都有出处；
//   3. 每张图都在 public/images/credits.json 里登记过。
// 其余的一切（版式、时长、节奏）都不设门禁：这一系列靠判断，不靠规则表。

/**
 * 一集的五段。顺序固定，缺一段就是结构不全。
 *
 * - `ask`     问：全幅实物照 + 大字问题。**第 0 帧即封面**，所以这一段的问题必须能独立成图。
 * - `object`  物：它今天是什么、你在哪见过它。实物照慢推切换。
 * - `book`    书：宣纸底上竖排原文，读到哪个字哪个字朱红。旁白读的正是这段原文。
 * - `study`   考：跨书对读。同一句话在唐、宋、明的书里各是什么样。
 * - `closing` 收：盖印 + 下集问题预告 + 小字免责。
 */
export type AskRole = "ask" | "object" | "book" | "study" | "closing";

/** 五段的固定顺序。渲染器按它排屏，门禁按它查完整性。 */
export const ASK_ROLES: AskRole[] = ["ask", "object", "book", "study", "closing"];

/** 印章上那个字。一段一个字，用印章标记章节。 */
export const SEAL_GLYPH: Record<AskRole, string> = {
  ask: "问",
  object: "物",
  book: "书",
  study: "考",
  closing: "收",
};

/** 一张实物照。`file` 必须在 public/images/credits.json 里登记过。 */
export type AskPhoto = {
  /** public/images/ 下的文件名。 */
  file: string;
  /** 画面里到底是什么。写给人看，不是学名。 */
  caption: string;
  /**
   * 片内署名行（作者 / 许可）。**由 ask-build 从 credits.json 烘进来，不要手写**——
   * 台账是图片授权的唯一登记处，片内另存一份就是"片内署名与台账不一致"的温床。
   */
  credit: string;
};

/** 一条引文。text 是照录的原文，source 是出处——两者都必须有。 */
export type AskQuote = {
  /** 照录原文。**不朗读**（朗读的是 narration）。 */
  text: string;
  /** 出处。必须非空——这是三条门禁里的第二条。 */
  source: string;
};

/** 「考」段的一条对读证据。 */
export type AskEvidence = {
  /** 照录原文。 */
  text: string;
  /** 出处。必须非空。 */
  source: string;
  /** 这一条在说什么，一行小字。可选。 */
  note?: string;
};

export type AskSegment = {
  role: AskRole;
  /**
   * 旁白。被朗读，同时作为字幕。**从不复述功效**——功效只留在引文里。
   * 写口语，为耳朵写，不为眼睛写。
   */
  narration: string;
  /** 「书」段的引文。 */
  quote?: AskQuote;
  /**
   * 「书」段专用：narration 里**与引文逐字对应的那一截**。
   *
   * 有了它，词级时间戳才能落到原文的字上：把 narration 去掉标点后找到 read 的位置，
   * 于是引文的第 i 个字对应朗读的第 (offset + i) 个字，读到哪个字哪个字朱红。
   * 门禁核对 read 确实是 narration 去掉标点后的连续子串。
   */
  read?: string;
  /** 「问」与「物」段的实物照。 */
  photos?: AskPhoto[];
  /** 「考」段的对读证据，2–3 条。 */
  evidence?: AskEvidence[];
};

export type AskContent = {
  /** 同时也是 Composition id 的来源（Ask<Id>）。 */
  id: string;
  /** 药名。 */
  entry: string;
  /** 这一集回答的那个问题，也是封面上的大字。 */
  question: string;
  /** 副题：系列位置。 */
  deck: string;
  /** 合集名。按观众兴趣编，不按卷次。 */
  collection: string;
  /**
   * 部类辅色。三色（宣纸米 / 墨黑 / 朱砂红）是底，每个部类另加一个辅色：
   * 草部青 `#4a6b5a`、果部赭 `#a5613a`、石部灰蓝 `#4a5a6b`。
   */
  accent: string;
  segments: AskSegment[];
  /** 这一集真正引到的书，收尾屏列出。 */
  sources: string[];
  /** 下集问题预告。 */
  next: string;
  /** 免责声明。固定一句，按构造属于收尾屏。 */
  disclaimer: string;
  /** public/music 下的曲目，必须已过 sync-music 登记。 */
  music: string;
};

/** 旁白去掉标点后的汉字序列——词级对齐与字数统计都用它。 */
export const spokenChars = (text: string): string[] =>
  [...text].filter((ch) => !/[\s，。、；：？！「」『』（）()《》〈〉·—…,.;:?!"'-]/.test(ch));

/**
 * `needle` 在 `haystack` 去掉标点后、首尾相接的那串字里的起点；找不到返回 -1。
 *
 * 这一系列有两处靠它：旁白与引文的对应（「读到哪个字哪个字朱红」），
 * 以及引文与「只读其中一句」的对应。**两处都要求逐字连续**——
 * 允许模糊匹配的话，一屏朱红会悄悄地推进到错的字上，而那比不亮更难发现。
 */
export const spokenIndexOf = (haystack: string, needle: string): number => {
  const hay = spokenChars(haystack).join("");
  const pin = spokenChars(needle).join("");
  if (pin.length === 0) return -1;
  return hay.indexOf(pin);
};

/** 一条引文的字数（不含标点），用于阅读预算。 */
export const quoteLength = (text: string): number => spokenChars(text).length;

// ---------------------------------------------------------------------------
// 配音模块的形态（由 scripts/ask-voice.ts 生成，渲染器只读）
// ---------------------------------------------------------------------------

/** 一条词级边界，秒，相对所在段起点。 */
export type AskCue = { text: string; start: number; end: number };

/** 一行字幕。由旁白的标点切分而来，起止时间取自首尾两个字的读出时刻。 */
export type AskLine = { text: string; start: number; end: number };

export type AskVoiceSegment = {
  index: number;
  role: AskRole;
  /** 该段旁白的实际秒数。 */
  seconds: number;
  /** 该段占用的帧数，含尾部呼吸（也是墨晕转场的时间）。 */
  frames: number;
  /** 该段在整片中的起始帧。 */
  startFrame: number;
  /** 词级边界。字幕成行之后主要留给对齐用。 */
  cues: AskCue[];
  /** 朗读字序列（去标点），与 charTimes 一一对应。 */
  spoken: string;
  /** 第 i 个汉字被读出的时刻（秒，相对该段起点）。竖排原文的朱红推进用。 */
  charTimes: number[];
  /** 「书」段：引文每个字的读出时刻，与 quote.text 去标点后一一对应。 */
  quoteTimes?: number[];
  /** 字幕行。 */
  lines: AskLine[];
};

export type AskVoice = {
  id: string;
  fps: number;
  totalFrames: number;
  segments: AskVoiceSegment[];
};
