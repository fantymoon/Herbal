// 跨书整合系列（**旧线**）的内容与配音类型。
//
// 这些类型原先住在 `src/topics/tu-que.ts` 里——也就是某一期的内容模块里。
// 类型不该挂在某一期片上：中文那一期搬进 `src/topics/tu-que/film.yaml` 之后，
// 渲染器和脚本就没地方 import 它们了。所以搬到这里。
//
// 旧线还剩英文一条（`src/topics-en/`，它自带一份同名类型）。等它也搬到
// 《一句话的旅行》那套，这个文件和 `topic-film.tsx` / `topic-graphics.tsx` /
// `topic-audio.ts` / `scripts/topic-*.ts` 可以一起删。

export type Quote = {
  /** 屏上大字，照录原文。 */
  text: string;
  /** 出处，随引文上屏。 */
  source: string;
};

export type Segment = {
  /** 旁白：被朗读，同时作为字幕。口语化，为耳朵写，不为眼睛写。 */
  narration: string;
  /** 屏上引文（不朗读）。 */
  quote?: Quote;
  /** 数据屏的大数字。没有它，role="stat" 的屏会只剩字幕。 */
  stat?: { value: string; unit: string; note: string };
  /** 左侧证据位：给了 file 就渲染书影，否则渲染时间线。 */
  plate?: {
    file?: string;
    natural?: { w: number; h: number };
    crop?: { x: number; y: number; w: number; h: number };
    box?: { x: number; y: number; w: number; h: number };
    highlight?: string;
    note?: string;
  };
  /** 这一屏的视觉角色。 */
  role?: "title" | "quote" | "stat" | "closing";
};

export type TopicContent = {
  id: string;
  /** 片名，也是那个问题。 */
  question: string;
  /** 副题，一句话说明这期在做什么。 */
  deck: string;
  /** 收尾屏那句话。 */
  closingLine: string;
  /** 封面底部那句。 */
  tagline: string;
  /** 时间线的朝代数据。不给则用内置的中文默认值。 */
  eras?: { dynasty: string; years: string; books: string[] }[];
  segments: Segment[];
  /** 这一期真正引用到的书，片尾列出。 */
  sources: string[];
  music: string;
  accent: string;
};

export type VoiceCue = { text: string; start: number; end: number };

export type VoiceSegment = {
  index: number;
  role: string;
  /** 该段旁白的实际秒数。 */
  seconds: number;
  /** 该段占用的帧数，含尾部呼吸。 */
  frames: number;
  /** 该段在整片中的起始帧。 */
  startFrame: number;
  /** 分句时间，相对该段起点，用于字幕高亮。 */
  cues: VoiceCue[];
};

export type VoiceTrack = {
  topic: string;
  fps: number;
  totalFrames: number;
  segments: VoiceSegment[];
};
