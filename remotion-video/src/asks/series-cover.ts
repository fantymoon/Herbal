// 「本草一问」系列总封面的内容。
//
// 与单集封面的分工：单集用**第 0 帧**（问屏的大字问题压在实物照上），那一帧本来就是
// 一集最好的入口。这里做的是**系列层面**的那一张——挂在合集入口、账号主页、跨线推荐位上，
// 它不能是任何一味药的叶子，否则整个系列就被读成一集。
//
// 所以这一张上没有实物照，只有这个系列的三样东西：系列名、它在讲什么、
// 以及它凭什么做得到（跨书对读）。底部 25% 是宣纸书页，不放字——与渲染器同一条线。
//
// **文案与几何都在这一份数据里**，渲染器只负责画它，门禁 `seriesCoverProblems` 只负责读它。
// 写在 JSX 里就没人能量：一行的字宽超出内容列、或者某行压进了平台 UI 区，
// 在成片静帧里都是要缩小了才看得出来的毛病。

// 必须写成 `./types.ts`：门禁与测试用 `node --test --experimental-strip-types` 直接读这个
// 模块，而 node 的 ESM 解析不做扩展名推断——渲染器里那种 `from "./types"` 到这儿会找不到文件。
import { ASK_H, ASK_SAFE, ASK_TEXT_FLOOR, ASK_W } from "./types.ts";

/** 画布与安全边：定义在 src/asks/types.ts，渲染器读的是同一份。 */
export const COVER_W = ASK_W;
export const COVER_H = ASK_H;
export const COVER_SAFE = ASK_SAFE;
/** 内容列宽。任何一行的估算宽度都不得超过它。 */
export const COVER_COLUMN = COVER_W - COVER_SAFE * 2;
/** 底部 25% 留给平台 UI：任何文字的**底边**都不得越过这条线。 */
export const COVER_TEXT_FLOOR = ASK_TEXT_FLOOR;
/** 行高倍数。渲染器用它排版，测试用它算底边——两边必须是同一个数。 */
export const COVER_LINE_HEIGHT = 1.4;

export type CoverTone = "paper" | "dim";

export type CoverRow = {
  /** 这一行的作用，报错时说得出是哪一行。 */
  kind: "kicker" | "title" | "tagline" | "label" | "books" | "disclaimer" | "credit";
  /**
   * 已经按语气断好的几行。**不做运行时测量**：断行是排版决定，
   * 让浏览器在中文里逐字断，就会把「你想问但没人讲过的」断成「…没人讲过／的」。
   */
  lines: string[];
  /** 行顶 y，px。 */
  y: number;
  /** 字号，px。 */
  size: number;
  tone: CoverTone;
  /** 字距，px。 */
  letterSpacing: number;
  /** 描边增重宽度，0 表示不加粗。 */
  weight: number;
  /** 行高倍数，默认 COVER_LINE_HEIGHT；标题要更紧所以可覆盖。 */
  lineHeight?: number;
};

/**
 * 一个字的宽度占几个字号。
 *
 * CJK 与全角标点（《》「」、中文间隔号）占一格，ASCII 与空格占半格。
 * 这是估算不是测量——它只用来判断一行会不会顶出内容列，而顶出列在静帧里是看得出来的。
 */
const advance = (ch: string): number => ((ch.codePointAt(0) ?? 0) >= 0x2000 ? 1 : 0.5);

/** 一行文字的估算宽度：每字 `advance * size + letterSpacing`。 */
export const rowWidth = (line: string, size: number, letterSpacing: number): number =>
  [...line].reduce((w, ch) => w + advance(ch) * size + letterSpacing, 0);

/** 一整行（可能含多截）占的竖直高度。 */
export const rowHeight = (row: CoverRow): number =>
  row.lines.length * row.size * (row.lineHeight ?? COVER_LINE_HEIGHT);

/** 一行的底边。平台 UI 区按这条线判，不按行顶。 */
export const rowBottom = (row: CoverRow): number => row.y + rowHeight(row);

/** 朱砂短线的位置——它是这个系列的视觉签名，与问屏同一道线。 */
export const COVER_RULE = { y: 588, width: 132, height: 7 };

/**
 * 印章：与问屏同一个字（`SEAL_GLYPH.ask`）、同一种框。
 * `frame` 取一个入场动画早已走完的帧号——封面是单帧图，而 `AskSeal` 的淡入在 12–36 帧，
 * 传 0 会得到一枚**透明**的印章。
 */
export const COVER_SEAL = { x: COVER_W - COVER_SAFE - 104, y: 150, size: 104, frame: 999 };

export type CoverPhoto = {
  /** public/images/ 下的文件名，必须在 credits.json 里登记过。 */
  file: string;
  /** 署名行，必须与台账的 `作者 / 许可` 逐字一致——`ask:build` 给单集做的就是这件事。 */
  credit: string;
  /** 横向裁切时的取景位置。这张是藤叶占中下三分之二。 */
  position: string;
};

/**
 * 底部平台 UI 区放的那张实物照。
 *
 * 「放画面，不放字」在这里是字面意思：那 480px 交给一张照片，而不是留给一张空白宣纸——
 * 空白在静帧里读起来是"忘了放东西"，不是"从容"。选**全株/藤叶**这种非诊断性的画面，
 * 是因为系列封面不能是任何一味药的答案：那是单集第 0 帧的活。
 */
export const COVER_PHOTO: CoverPhoto = {
  file: "sinomenium-acutum-habit.jpg",
  credit: "WATANABE HITOSHI 渡辺仁 / CC BY",
  position: "50% 62%",
};

/**
 * 封面文案。
 *
 * 「名物 · 文字 · 历史」与「你想问但没人讲过」来自 asks/README.md 的系列定位。
 * 那行「七百部古籍」说的是语料库的实际规模（`TCM-Ancient-Books-master/` 下 701 个文件，
 * README 与 AGENTS.md 都写作 700 部），不是这一系列已经引过的书数——五集实际引到 10 部。
 * 下面三行是本系列的对读主干（本经 → 证类 → 纲目），**是主干不是全部**，所以它不能配
 * 「三部书」这种计数：那会把做过的事说小，而平台上的观众只会照字面读。
 * 朝代沿用各集出处行的写法（汉 / 宋 / 明）。
 */
export const coverRows: CoverRow[] = [
  {
    kind: "kicker",
    lines: ["名物 · 文字 · 历史"],
    y: 190,
    size: 44,
    tone: "dim",
    letterSpacing: 10,
    weight: 0,
  },
  {
    kind: "title",
    lines: ["本草一问"],
    y: 272,
    size: 232,
    tone: "paper",
    letterSpacing: 0,
    weight: 2.6,
    lineHeight: 1.15,
  },
  {
    kind: "tagline",
    lines: ["每集四十秒，答一个", "你想问但没人讲过的本草问题"],
    y: 660,
    size: 70,
    tone: "paper",
    letterSpacing: 1,
    weight: 1.4,
  },
  {
    kind: "label",
    lines: ["七百部古籍做底，同一味药看它历代怎么写"],
    y: 916,
    size: 40,
    tone: "paper",
    letterSpacing: 6,
    weight: 1.0,
  },
  {
    kind: "books",
    lines: ["《神农本草经》· 汉", "《证类本草》· 宋", "《本草纲目》· 明"],
    y: 986,
    size: 46,
    tone: "paper",
    letterSpacing: 2,
    weight: 1.2,
  },
  {
    kind: "disclaimer",
    lines: ["古籍内容展示，不构成诊疗建议"],
    y: 1336,
    size: 34,
    tone: "dim",
    letterSpacing: 3,
    weight: 0,
  },
  {
    // 署名行紧跟免责声明，两者一起压在照片带**上方**——照片带就是平台 UI 区，
    // 那一段字会被标题条切掉，所以它不能是署名。
    kind: "credit",
    lines: [COVER_PHOTO.credit],
    y: 1394,
    size: 28,
    tone: "dim",
    letterSpacing: 1,
    weight: 0,
  },
];

/** 免责声明必须是封面上的一行——账号吃过定位词的亏，这一句是最便宜的距离。 */
export const COVER_DISCLAIMER = "古籍内容展示，不构成诊疗建议";
