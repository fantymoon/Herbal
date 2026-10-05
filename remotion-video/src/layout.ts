// Layout engine for data-driven films.
//
// Why this exists: the 55 hand-written films contained 46 distinct font sizes and
// 11-14 absolutely positioned blocks each, so "keep 50px of clearance and never let
// two blocks overlap" (SKILL.md) was a rule a human had to re-satisfy on every film
// by hand. Here the geometry is computed, and the invariants are asserted by
// tests/layout.test.ts instead of by eye.
//
// The visual language deliberately matches the existing films: same paper, same
// 74px inset, same framed photo insert, same block rhythm. This is a correctness
// fix, not a redesign.

export const CANVAS = { width: 1080, height: 1920 } as const;
/** Left/right margin used by every published film. */
export const SAFE_INSET = 74;
/** SKILL.md: at least 50px of vertical clearance between stacked blocks. */
export const MIN_CLEARANCE = 50;
/** Bottom reserve so nothing collides with the brand mark / disclaimer area. */
export const BOTTOM_RESERVE = 96;
/** Where a scene's content starts. */
export const SCENE_TOP = 140;
/** The brand mark's on-screen size, matching the published films. */
export const SIGN_SIZE = 224;

export const FPS = 30;
export const ALLOWED_DURATIONS = [360, 450, 540, 630, 720] as const;
export type AllowedDuration = (typeof ALLOWED_DURATIONS)[number];
/**
 * Rungs above the house cap. Not reachable by arithmetic: `requiredDuration` only
 * considers them when the content module declares a `duration` deviation, so a film
 * that outgrows 24 seconds has to say so in writing. See `NEGOTIABLE_RULES`.
 */
export const EXTENDED_DURATIONS = [810, 900] as const;
/** Every rung a plan may legitimately land on, declared or not. */
export const DURATION_LADDER = [...ALLOWED_DURATIONS, ...EXTENDED_DURATIONS] as const;
/** Any rung, including the extended ones. What a `FilmPlan` may carry. */
export type PlannedDuration = (typeof DURATION_LADDER)[number];
/** The longest film the series makes without a recorded reason: 24 seconds. */
export const STANDARD_DURATION_CAP = ALLOWED_DURATIONS[ALLOWED_DURATIONS.length - 1];
/** SKILL.md: at least 4 seconds per scene. */
export const MIN_SCENE_FRAMES = 120;

/**
 * A rule this film knowingly breaks, and why it must.
 *
 * The gate does two different jobs and they should not be negotiable on the same
 * terms. One is *safety*: a banned efficacy claim, an unframed 主…… statement, a
 * missing disclaimer, text running off the canvas. No reason makes those acceptable,
 * so `deviations` may not name them. The other is *budget*: the film is longer or
 * denser than the house standard. That is a judgement about this entry's text — the
 * corpus has entries whose 经文 cannot be read inside 24 seconds, and refusing to
 * make them is not a compliance decision, it is a scheduling one.
 *
 * So a declaration here buys exactly one thing: the named rule's finding is kept but
 * marked waived, and the film's own reason travels with it into `npm run check` and
 * the test suite. An unexplained waiver is not a waiver, and `checkDeviations`
 * rejects both an empty `why` and a `rule` outside this list.
 */
export type Deviation = {
  /** One of `NEGOTIABLE_RULES`. */
  rule: string;
  /** The reason. Required, and the reason this field exists at all. */
  why: string;
};

/** The only rules `deviations` may name. Everything else is a safety rule. */
export const NEGOTIABLE_RULES = ["duration", "reading-budget", "pacing"] as const;
export type NegotiableRule = (typeof NEGOTIABLE_RULES)[number];

export const isNegotiableRule = (rule: string): rule is NegotiableRule =>
  (NEGOTIABLE_RULES as readonly string[]).includes(rule);

/** Whether this film asked for a rung above `STANDARD_DURATION_CAP`. */
export const declaresDurationDeviation = (content: FilmContent): boolean =>
  (content.deviations ?? []).some((d) => d.rule === "duration" && d.why.trim().length > 0);

/** The rungs `requiredDuration` may pick from for this film. */
export const durationLadder = (content: FilmContent): readonly PlannedDuration[] =>
  declaresDurationDeviation(content) ? DURATION_LADDER : ALLOWED_DURATIONS;

/**
 * Reading speed ceiling, in Chinese characters per second.
 *
 * 5.5/s is the comfortable silent-reading rate; this is not that. A scrolling feed is
 * skimmed and re-watched, so a hard 5.5 would strangle the writing. 15/s is the
 * skimming ceiling this series is willing to ship.
 *
 * The number comes from the 55 published films: they asked for ~31 characters/second
 * in their middle scene (99 characters in 4 seconds), which is unreadable. Half of
 * that, rounded to a workable budget, is where this sits. Without it the engine
 * happily plans a screen that demands 42 characters/second and reports `ok`.
 */
export const READING_RATE_LIMIT = 15;
/**
 * A classical scene longer than this is split, so the picture changes at least every
 * 9 seconds. Splitting does not reduce the reading time a film needs — it only decides
 * how many screens that time is spread over.
 */
export const MAX_CLASSICAL_SCENE_FRAMES = 270;
/** hero + 3 classical + closing = 5 screens, which 630 frames still paces at 126 each. */
export const MAX_CLASSICAL_SCENES = 3;

/**
 * Wording the compliance gate requires. Kept here rather than in the checker so the
 * layout and the rules cannot drift apart.
 */
/** Mandated opening for a 今译 clause that translates a 主…… efficacy statement. */
export const REQUIRED_FRAME = "古籍称其主";
/** The wording SKILL.md offers as an example. A 注释 line need not use it verbatim. */
export const REQUIRED_NOTE = "此为汉代认知，未经现代科学证实";
export const DISCLAIMER_TEXT = "古籍内容展示，不构成诊疗建议";

/**
 * What a 注释 line has to *do* to frame a claim as history — three requirements, none of
 * them a fixed string. SKILL.md says "诸如 `此为汉代认知，未经现代科学证实`", and the
 * checker used to enforce that example with `!==`, so any better sentence failed the gate
 * and improving the wording meant editing code. These are the properties that sentence
 * actually has:
 *
 *   1. names an era or a classical source — the claim is attributed, not asserted;
 *   2. denies that modern knowledge has settled it — the claim stays out of the present
 *      tense. The negation must reach the denial verb inside one clause, so
 *      "未经现代科学证实" passes while "未经删改，现代科学证实" does not;
 *   3. names a modern-knowledge domain. A bare "未经证实" is not enough: the platform's
 *      objection was specifically to modern-science claims, so the note has to answer it.
 */
const HISTORICAL_ERA = /(汉代|汉时|汉朝|古人|古代|古籍|古书|历代|旧说|旧时|先秦|本草经)/;
const MODERN_DENIAL =
  /未(?:经|获|被|得到|见|由|能|予|受)?[^。；;，,、！？!?\n]{0,10}(?:证实|验证|证明|确证|确认|检验)/;
const MODERN_DOMAIN = /(现代|科学|医学|实验|临床|药理)/;

/** The three parts of the historical frame, in the order `hasHistoricalFrame` tests them. */
export const FRAME_PARTS = [
  { name: "an era or classical source", test: HISTORICAL_ERA },
  { name: "a denial that modern knowledge confirms it", test: MODERN_DENIAL },
  { name: "a modern-knowledge domain", test: MODERN_DOMAIN },
] as const;

export const hasHistoricalFrame = (note: string): boolean =>
  FRAME_PARTS.every((part) => part.test.test(note));

/** Which parts of the frame a 注释 line is missing, for an actionable gate message. */
export const missingFrameParts = (note: string): string[] =>
  FRAME_PARTS.filter((part) => !part.test.test(note)).map((part) => part.name);

/**
 * The seal glyph for a mode. SKILL.md § Input And Mode: one large character, `药` for a
 * single herb and `方` for a formula — never the herb's or formula's name.
 *
 * It lives here, as a mapping, so that adding a mode is a compile error rather than a
 * silent fallback: the renderer used to hardcode `药`, which meant the gate validated a
 * `mode` field that changed nothing on screen.
 */
export const SEAL_GLYPH: Record<FilmContent["mode"], string> = {
  "single-herb": "药",
  formula: "方",
};

export const sealGlyph = (mode: FilmContent["mode"]): string => SEAL_GLYPH[mode];

/**
 * The only font sizes a film may use. The previous films drifted to 46 values
 * (14, 15, 19, 20, 21, 22, ...) because every screen was tuned by hand.
 */
export const TYPE = {
  heroTitle: 150,
  heroLatin: 36,
  heroVolume: 34,
  /** The hero's hook line: larger than the bibliographic lines, smaller than the name. */
  hook: 56,
  sectionLabel: 24,
  /** The hero's 原文 excerpt, set larger than the classical scene's copy. */
  heroClassical: 80,
  classical: 68,
  /** Comfortably above the enforced 56px floor. */
  translation: 60,
  commentary: 36,
  factValue: 48,
  factLabel: 24,
  closingTitle: 84,
  meta: 28,
  disclaimer: 28,
  /** ASCII-only credit line; exempt from the 24px Chinese floor. */
  credit: 16,
} as const;

/**
 * Line heights, per role.
 *
 * These are not cosmetic: the plan reserves a block's height from them, and a block
 * whose reserved height is taller than its rendered height pushes everything below it
 * down. The original 1.5-for-everything default over-reserved the 150px hero title by
 * ~87px, which is why the hero content sat far lower than the published films'.
 */
const BODY_LINE_HEIGHT = 1.5;
const COMMENTARY_LINE_HEIGHT = 1.5;
const CLASSICAL_LINE_HEIGHT = 1.35;
const TITLE_LINE_HEIGHT = 0.92;
const SUBTITLE_LINE_HEIGHT = 1.15;
const CLOSING_TITLE_LINE_HEIGHT = 1.05;
const META_LINE_HEIGHT = 1.2;

export type PhotoCredit = {
  file: string;
  /** Species or subject shown on screen, ASCII. */
  subject: string;
  /** Author as required by the licence, or null for public domain. */
  author: string | null;
  /** Licence string exactly as it must appear on screen. */
  license: string;
};

export type Fact = { label: string; value: string };

export type FilmContent = {
  /** Composition id, e.g. HuangzhiFirstFilm. */
  id: string;
  entry: string;
  /** Latin/pinyin line under the title. */
  latin: string;
  book: string;
  /** Romanised book name, printed as the hero's top label. */
  bookLatin: string;
  /** e.g. 卷一 · 上经 */
  volume: string;
  /** e.g. 上经 · 草部, optional. */
  division: string | null;
  flavor: string;
  alias: string | null;
  /**
   * One short line that gives a viewer who does not know the entry a reason to stay,
   * rendered on the hero under the title block.
   *
   * Why it exists: the hero was a reference card — book, name, pinyin, division, photo,
   * flavour line — and every one of those describes the entry to someone who already
   * cares about it. The hook was carried entirely by the upload copy, but the platform's
   * 2-second bounce is measured on the *video*, so the opening seconds were spent on a
   * name the viewer had no reason to recognise. Write it as the on-screen twin of the
   * title's tail; do not spend it on a fact the closing scene already states.
   */
  hook?: string;
  /** Faithful original excerpt. */
  original: string;
  /** Clause-by-clause modern translation. Must open with 古籍称其主 for 主…… clauses. */
  translation: string;
  /** Commentary block text, without the 注释 label. */
  commentary: string;
  /**
   * Where the reading lives: on screen, or in the upload copy. Defaults to "screen".
   *
   * "screen" is the shape the series shipped with — hero, then one or more classical
   * scenes carrying 原文 + 今译 + 注释, then the closing. It runs 18-24 seconds, and the
   * platform numbers say the last seventeen of those are watched by nobody: average
   * watch time is 7.2s on a 24-second film and 7.3s on a 12-second one, so the extra
   * length buys nothing and the dense screens are exactly the part that goes unread.
   *
   * "copy" drops 今译 and 注释 to the description and leaves the film with what the book
   * says, where it says it, and the mandated framing — three scenes, 12 seconds. The
   * reading is not lost, it moves somewhere it can actually be read: nobody reads a
   * 145-character screen in the six seconds it is up, and anyone who wants the
   * translation can read it in the description at their own pace.
   */
  reading?: "screen" | "copy";
  /** Mandated historical framing line. */
  historicalNote: string;
  facts: Fact[];
  photo: PhotoCredit;
  music: string;
  accent: string;
  mode: "single-herb" | "formula";
  /**
   * Budget rules this film knowingly breaks, each with its reason. Absent means the
   * film claims to fit the house standard. See `Deviation`.
   */
  deviations?: Deviation[];
};

export type BlockKind =
  | "sectionLabel"
  | "heroTitle"
  | "heroLatin"
  | "heroVolume"
  | "hook"
  | "photo"
  | "classicalLabel"
  | "classical"
  | "translationLabel"
  | "translation"
  | "commentaryLabel"
  | "commentary"
  | "closingTitle"
  | "fact"
  /** A bordered panel: one large line with a small citation beneath it. */
  | "panel"
  | "publicationNote"
  | "disclaimer"
  | "sign";

/**
 * The frame each of a scene's blocks starts appearing on.
 *
 * The hero's first two blocks are already fully on when the film starts. The platform
 * shows frame 0 as the cover, and the previous schedule began at frame 2 — so the cover
 * was a blank card and the most valuable half-second of the film showed nothing at all.
 * Later scenes still open from a blank card, which is what makes a cut read as a cut
 * rather than as more of the same screen.
 */
export const REVEAL_DELAYS = {
  hero: [-26, -26, 0, 4, 8, 12, 16, 20],
  scene: [2, 6, 10, 14, 18, 22, 26, 30],
} as const;

/**
 * Which reveal schedule a scene uses.
 *
 * A film with a hook opens on its title card; a film without one keeps the schedule the
 * published films use, so nothing already rendered changes under it. The hook and the
 * instant opening are one change — the new opening — and they ship together.
 */
export const openingFor = (kinds: readonly BlockKind[]): "hero" | "scene" =>
  kinds.includes("hook") ? "hero" : "scene";

/**
 * The blocks already on screen on frame 0.
 *
 * Frame 0 is the cover, and a cover that is only the name is a pale rectangle with two
 * characters on it: legible at thumbnail size, which is what the name is for, but not
 * something anyone stops on. The photo is what a thumbnail is actually read for, so it
 * joins the name and the book label in being present from the start rather than fading in
 * with the rest of the hero. Only the hero uses this; later scenes still open from blank.
 */
export const COVER_BLOCKS: readonly BlockKind[] = ["sectionLabel", "heroTitle", "photo"];

/** A negative delay means the block is already at full opacity on the scene's frame 0. */
export const revealDelay = (scene: "hero" | "scene", index: number): number => {
  const schedule = REVEAL_DELAYS[scene];
  if (index < schedule.length) {
    return schedule[index];
  }
  return schedule[schedule.length - 1] + (index - schedule.length + 1) * 4;
};

export type Block = {
  kind: BlockKind;
  text: string;
  fontSize: number;
  /** Resolved geometry, absolute within the 1080x1920 canvas. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Extra data for composite blocks (photo credits, fact pairs). */
  detail?: string;
  /** Break lines at punctuation instead of anywhere. See `clauseLines`. */
  wrap?: "clause";
  /** How much larger the block opens on frame 0. See `coverScale`. */
  coverScale?: number;
};

export type ScenePlan = {
  kind: "hero" | "classical" | "closing";
  blocks: Block[];
};

export type FilmPlan = {
  durationInFrames: PlannedDuration;
  /** Scene start frames, ascending; length is scenes.length - 1. */
  breaks: number[];
  scenes: ScenePlan[];
};

export const CONTENT_WIDTH = CANVAS.width - SAFE_INSET * 2;

/**
 * Bibliographic citation, printed exactly as the published films print it.
 *
 * The 《》 are not decoration: the repetition scan exempts a repeated string only when
 * it is a bracketed citation, so the citation has to be built here rather than by
 * concatenating the book and volume at each call site — otherwise the hero and the
 * closing note silently become a content-repetition defect.
 */
export const citation = (content: Pick<FilmContent, "book" | "volume">): string =>
  `《${content.book}》· ${content.volume}`;

/** A CJK glyph is about as wide as its font size, so this is a good estimate. */
export const wrappedLineCount = (text: string, fontSize: number, width = CONTENT_WIDTH): number => {
  const perLine = Math.max(1, Math.floor(width / fontSize));
  return Math.max(1, Math.ceil([...text].length / perLine));
};

/**
 * Break a quotation where a Chinese typesetter would: after the punctuation, never inside
 * a clause.
 *
 * Browsers break CJK anywhere, so at 102px the 原文 split as 破症结积 / 聚 and 久 / 服 —
 * a mid-word break in a passage the series exists to reproduce faithfully, which is worse
 * than leaving the screen half empty. Whole clauses are packed onto a line and a hard
 * break is used only when one clause is wider than the line.
 *
 * The renderer applies the same rule by inserting a zero-width space after each mark, so
 * the reserved height and the drawn text agree.
 */
export const BREAK_AFTER = /[，。、；：！？）」』]/;

export const clauseLines = (text: string, perLine: number): string[] => {
  const clauses = text.match(/[^，。、；：！？）」』]*[，。、；：！？）」』]?/g) ?? [];
  const lines: string[] = [];
  let line = "";
  for (const clause of clauses) {
    if (clause === "") continue;
    if (line !== "" && [...line, ...clause].length > perLine) {
      lines.push(line);
      line = "";
    }
    line += clause;
    // A clause wider than the whole line still has to go somewhere.
    while ([...line].length > perLine) {
      lines.push([...line].slice(0, perLine).join(""));
      line = [...line].slice(perLine).join("");
    }
  }
  if (line !== "") lines.push(line);
  return lines.length > 0 ? lines : [""];
};

export const clauseLineCount = (text: string, fontSize: number, width = CONTENT_WIDTH): number =>
  clauseLines(text, Math.max(1, Math.floor(width / fontSize))).length;

export const textHeight = (
  text: string,
  fontSize: number,
  lineHeight = BODY_LINE_HEIGHT,
  width = CONTENT_WIDTH,
  wrap?: "clause",
): number => {
  const lines =
    wrap === "clause" ? clauseLineCount(text, fontSize, width) : wrappedLineCount(text, fontSize, width);
  return Math.ceil(lines * fontSize * lineHeight);
};

type Draft = {
  kind: BlockKind;
  text: string;
  fontSize: number;
  height: number;
  detail?: string;
  /** Override the content width (e.g. the square brand mark). */
  width?: number;
  align?: "left" | "right";
  /** Break lines at punctuation instead of anywhere. See `clauseLines`. */
  wrap?: "clause";
  /** How much larger the block opens on frame 0. See `coverScale`. */
  coverScale?: number;
};

const draft = (
  kind: BlockKind,
  text: string,
  fontSize: number,
  height: number,
  detail?: string,
  extra: { width?: number; align?: "left" | "right"; wrap?: "clause"; coverScale?: number } = {},
): Draft => ({ kind, text, fontSize, height, detail, ...extra });

const bodyDraft = (
  kind: BlockKind,
  text: string,
  fontSize: number,
  detail?: string,
  lineHeight = BODY_LINE_HEIGHT,
  wrap?: "clause",
): Draft =>
  draft(kind, text, fontSize, textHeight(text, fontSize, lineHeight, CONTENT_WIDTH, wrap), detail, {
    ...(wrap === undefined ? {} : { wrap }),
  });

/** A labelled fact is a small label plus a large value, so its height covers both. */
const FACT_HEIGHT =
  Math.ceil(TYPE.factLabel * META_LINE_HEIGHT) + 12 + Math.ceil(TYPE.factValue * META_LINE_HEIGHT);

/** The hero's bordered 原文 panel: padding, the excerpt, then the citation. */
const PANEL_PADDING_TOP = 24;
const PANEL_PADDING_BOTTOM = 26;
const PANEL_PADDING_X = 28;
const PANEL_GAP = 14;
const PANEL_INNER_WIDTH = CONTENT_WIDTH - PANEL_PADDING_X * 2;
const panelHeight = (flavor: string, citationText: string): number =>
  PANEL_PADDING_TOP +
  textHeight(flavor, TYPE.heroClassical, 1, PANEL_INNER_WIDTH) +
  PANEL_GAP +
  textHeight(citationText, TYPE.meta, META_LINE_HEIGHT, PANEL_INNER_WIDTH) +
  PANEL_PADDING_BOTTOM;

/**
 * Stack blocks from the top of a scene, inserting MIN_CLEARANCE between them.
 * Returns the blocks with absolute geometry, plus the total height consumed.
 */
export const stackBlocks = (
  drafts: Draft[],
  top = SCENE_TOP,
  width = CONTENT_WIDTH,
): { blocks: Block[]; used: number } => {
  const blocks: Block[] = [];
  let y = top;
  drafts.forEach((d, index) => {
    if (index > 0) {
      y += MIN_CLEARANCE;
    }
    const blockWidth = d.width ?? width;
    const x =
      d.align === "right" ? CANVAS.width - SAFE_INSET - blockWidth : SAFE_INSET;
    blocks.push({
      kind: d.kind,
      text: d.text,
      fontSize: d.fontSize,
      x,
      y,
      width: blockWidth,
      height: d.height,
      ...(d.detail === undefined ? {} : { detail: d.detail }),
      ...(d.wrap === undefined ? {} : { wrap: d.wrap }),
      ...(d.coverScale === undefined ? {} : { coverScale: d.coverScale }),
    });
    y += d.height;
  });
  return { blocks, used: y - top };
};

/**
 * Labels, the brand mark and the ASCII credit line are chrome, not prose: nobody reads
 * "CLASSICAL ENTRY / 古籍原文" as content. Everything else on screen has to be read.
 */
const CHROME_KINDS: readonly BlockKind[] = [
  "sectionLabel",
  "classicalLabel",
  "translationLabel",
  "commentaryLabel",
  "sign",
];

/**
 * Chinese characters, excluding punctuation and any ASCII.
 *
 * Exported because the published-film audit has to measure a hand-written film the
 * same way: counting punctuation on one side and not the other made a legacy film's
 * screen look ~15% heavier than a data-driven one carrying the same copy.
 */
export const countCJK = (text: string): number => (text.match(/[\u4e00-\u9fff]/g) ?? []).length;

/** The Chinese characters a viewer actually has to read in one scene. */
export const readableChars = (scene: ScenePlan): number =>
  scene.blocks
    .filter((block) => !CHROME_KINDS.includes(block.kind))
    .reduce((total, block) => total + countCJK(block.text), 0);

/**
 * Frames the scene needs if it is to be read at READING_RATE_LIMIT.
 *
 * This is the measurement the engine was missing: `findOverflow` only knows whether a
 * block's bottom edge passes 1728px, which says nothing about whether the viewer has
 * time to read it. Geometry and reading time are separate budgets.
 */
export const readingFrames = (scene: ScenePlan): number =>
  Math.ceil((readableChars(scene) / READING_RATE_LIMIT) * FPS);

export type SceneReading = {
  kind: ScenePlan["kind"];
  chars: number;
  /** Frames the scene needs at the ceiling. */
  frames: number;
  /** Frames the scene actually gets. */
  allotted: number;
  /** Characters per second the viewer is asked for. */
  rate: number;
  over: boolean;
};

/** Per-scene reading budget of a finished plan. */
export const readingBudget = (plan: FilmPlan): SceneReading[] => {
  const bounds = [0, ...plan.breaks, plan.durationInFrames];
  return plan.scenes.map((scene, index) => {
    const allotted = bounds[index + 1] - bounds[index];
    const chars = readableChars(scene);
    const seconds = allotted / FPS;
    return {
      kind: scene.kind,
      chars,
      frames: readingFrames(scene),
      allotted,
      rate: seconds > 0 ? chars / seconds : Number.POSITIVE_INFINITY,
      over: readingFrames(scene) > allotted,
    };
  });
};

/** Scenes that ask the viewer to read faster than READING_RATE_LIMIT. */
export const findReadingProblems = (plan: FilmPlan): string[] =>
  readingBudget(plan)
    .filter((scene) => scene.over)
    .map(
      (scene) =>
        `${scene.kind}: ${scene.chars} characters in ${(scene.allotted / FPS).toFixed(1)}s ` +
        `= ${scene.rate.toFixed(1)} chars/s, over the ${READING_RATE_LIMIT}/s ceiling. ` +
        `This is a budget rule, not a safety one: split the scene, shorten the text, or ` +
        `declare \`deviations: [{ rule: "reading-budget", why: "…" }]\` and keep the prose ` +
        `you meant to write. A recorded reason is enough.`,
    );

/**
 * The per-scene reading budget, one line per screen, for `npm run check -- --verbose`.
 *
 * SKILL.md promises this output, and it is the only way to see *which* screen is tight
 * before rendering: the gate only says pass or fail, and a film sitting at 14.6 of the
 * 15/s ceiling passes while having no room for one more clause.
 */
export const formatReadingBudget = (plan: FilmPlan): string[] =>
  readingBudget(plan).map(
    (scene, index) =>
      `    scene ${index + 1} ${scene.kind.padEnd(9)} ${String(scene.chars).padStart(3)} chars` +
      ` / ${(scene.allotted / FPS).toFixed(1)}s = ${scene.rate.toFixed(1)}/s` +
      `${scene.over ? "  OVER" : ""}`,
  );

/** Photo insert height, matching the published films' framed 932x500 insert. */
const PHOTO_HEIGHT = 500;
const PHOTO_CHROME = 28;

/**
 * The size the entry name settles at, and how much larger it opens.
 *
 * A fixed 150px was sized for the longest names in the book, so a two-character entry
 * like 蒲黄 drew 300px of a 932px column — a third of the width, on the one element the
 * cover and the feed thumbnail are read from. A feed thumbnail is roughly a quarter of
 * the canvas, which puts 150px type at about 35px on a phone: fine for a reader who
 * already knows the herb, useless for a 中老年 viewer meeting the name for the first
 * time. 抖音's own cover tool enlarges the name for the same reason.
 *
 * The name now takes the width it needs and no more. Three characters and under reach
 * the cap; from four up it scales down, which is also where a fixed size starts looking
 * cramped. A ladder rather than one number so the sizes stay declared — `DECLARED_TYPE_SIZES`
 * is what the "no ad-hoc font sizes" rule checks against.
 */
export const HERO_TITLE_LADDER = [260, 233, 186, 155, 133, 116] as const;

export const heroTitleSize = (entry: string): number => {
  const chars = Math.max(1, [...entry].length);
  return (
    HERO_TITLE_LADDER.find((size) => size * chars <= CONTENT_WIDTH) ??
    HERO_TITLE_LADDER[HERO_TITLE_LADDER.length - 1]
  );
};

/**
 * How much larger the name opens on frame 0 than it settles.
 *
 * Frame 0 is the cover, and 抖音 reads the still at roughly a quarter of the canvas — so
 * the settled title is still too small to recognise in a feed. The name therefore opens
 * at the full width of the column and settles into the layout over the first second.
 *
 * The boost is capped by the width, not fixed, because the settled size already fills the
 * column from four characters up: there is nothing left to grow into, and a four-character
 * entry opens at its settled size.
 */
export const COVER_SCALE_MAX = 1.8;

export const coverScale = (entry: string): number => {
  const chars = Math.max(1, [...entry].length);
  return Math.min(COVER_SCALE_MAX, CONTENT_WIDTH / (heroTitleSize(entry) * chars));
};

/** Every size the layout may put on screen. The rule against ad-hoc sizes checks this. */
export const DECLARED_TYPE_SIZES: readonly number[] = [
  ...new Set([...Object.values(TYPE), ...HERO_TITLE_LADDER]),
];

export const planHeroScene = (content: FilmContent): ScenePlan => {
  const cite = citation(content);
  const drafts: Draft[] = [
    draft("sectionLabel", content.bookLatin, TYPE.sectionLabel, TYPE.sectionLabel),
    draft(
      "heroTitle",
      content.entry,
      heroTitleSize(content.entry),
      textHeight(content.entry, heroTitleSize(content.entry), TITLE_LINE_HEIGHT),
      undefined,
      { coverScale: coverScale(content.entry) },
    ),
    draft(
      "heroLatin",
      content.latin,
      TYPE.heroLatin,
      Math.ceil(TYPE.heroLatin * SUBTITLE_LINE_HEIGHT),
    ),
  ];
  if (content.division) {
    drafts.push(
      draft(
        "heroVolume",
        content.division,
        TYPE.heroVolume,
        Math.ceil(TYPE.heroVolume * SUBTITLE_LINE_HEIGHT),
      ),
    );
  }
  // The hook sits with the title block, above the photo, so the opening seconds show it.
  // Everything above it — the book, the name, the pinyin, the division — says what the
  // entry *is*; none of it gives a viewer who does not already know the herb a reason to
  // stay. See `FilmContent.hook`.
  if (content.hook) {
    drafts.push(
      bodyDraft("hook", content.hook, TYPE.hook, content.hook, SUBTITLE_LINE_HEIGHT),
    );
  }
  drafts.push(
    draft(
      "photo",
      content.photo.subject,
      TYPE.credit,
      PHOTO_HEIGHT + PHOTO_CHROME,
      `${content.photo.subject} / ${content.photo.author ?? "PUBLIC DOMAIN"} / ${content.photo.license}`,
    ),
    // The excerpt and its citation share one bordered panel: by this point in the
    // scene the decorative landscape has begun, and bare text over it is unreadable.
    draft("panel", content.flavor, TYPE.heroClassical, panelHeight(content.flavor, cite), cite),
  );
  if (content.alias) {
    drafts.push(draft("fact", content.alias, TYPE.factValue, FACT_HEIGHT, "别名"));
  }
  // No trailing citation: the panel above already prints it, and a second copy lands
  // on the landscape where it reads as a grey smudge.
  return { kind: "hero", blocks: stackBlocks(drafts).blocks };
};

const CLASSICAL_TOP = 166;

/**
 * Split the translation across at most `maxScenes` classical scenes, at sentence
 * boundaries, balanced. Lengthening the duration does not make a scene fit on
 * screen, so the number of scenes is bounded instead: hero + 2 classical + closing
 * = 4 scenes, which 540 frames still pace at 135 frames each. A translation too long
 * for two scenes is a content problem, reported by findOverflow rather than hidden
 * by shrinking type.
 */
export const splitTranslation = (translation: string, maxScenes = 2): string[] => {
  const sentences = translation
    .split(/(?<=[。！？；])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (sentences.length <= 1 || maxScenes <= 1) {
    return [translation];
  }
  const chunks: string[] = [];
  const perChunk = Math.ceil(sentences.length / maxScenes);
  for (let i = 0; i < sentences.length; i += perChunk) {
    chunks.push(sentences.slice(i, i + perChunk).join(""));
  }
  return chunks;
};

export const planClassicalScenes = (content: FilmContent): ScenePlan[] => {
  if (content.reading === "copy") {
    // The short shape. What the book says, where it says it, and the framing that keeps
    // an efficacy clause a historical claim rather than an instruction — nothing else.
    // The 今译 and 注释 are in the upload copy; see `FilmContent.reading`.
    // The 原文 is set as large as it will fit. This screen carries four short blocks and
    // nothing else, so at the long shape's 68px the quotation left the canvas 60% empty
    // wherever it was placed — centring it only moved the void from below to above. A
    // ladder rather than one size, because 原文 run from 30 to 130 characters and a size
    // that fills a short one overflows a long one. `wrap: "clause"` is what keeps the
    // larger type from breaking mid-clause. Every rung stays under the 150px hero title.
    const room = CANVAS.height - BOTTOM_RESERVE - CLASSICAL_TOP;
    const at = (quoteSize: number): { blocks: Block[]; used: number } =>
      stackBlocks(
        [
          draft("classicalLabel", "CLASSICAL ENTRY / 古籍原文", TYPE.sectionLabel, TYPE.sectionLabel),
          bodyDraft(
            "classical",
            content.original,
            quoteSize,
            content.original,
            CLASSICAL_LINE_HEIGHT,
            "clause",
          ),
          // A quotation carries its source on the same screen, the way the hero's panel
          // does. Bibliographic citations may repeat across scenes, which is why the
          // citation is printed as 《书名》· 卷 · 篇 rather than concatenated bare.
          draft("publicationNote", citation(content), TYPE.meta, TYPE.meta),
          bodyDraft(
            "commentary",
            content.historicalNote,
            TYPE.commentary,
            content.historicalNote,
            COMMENTARY_LINE_HEIGHT,
          ),
        ],
        CLASSICAL_TOP,
      );
    const fitting = [1.6, 1.45, 1.3, 1.15, 1]
      .map((scale) => at(Math.round(TYPE.classical * scale)))
      .find((plan) => plan.used <= room);
    return [{ kind: "classical", blocks: (fitting ?? at(TYPE.classical)).blocks }];
  }

  const build = (chunks: string[]): ScenePlan[] =>
    chunks.map((chunk, index) => {
      const last = index === chunks.length - 1;
      const drafts: Draft[] = [];
      if (index === 0) {
        drafts.push(
          draft("classicalLabel", "CLASSICAL ENTRY / 古籍原文", TYPE.sectionLabel, TYPE.sectionLabel),
          bodyDraft(
            "classical",
            content.original,
            TYPE.classical,
            content.original,
            CLASSICAL_LINE_HEIGHT,
          ),
        );
      } else {
        // A continuation scene carries no 原文, so a "CLASSICAL ENTRY / 古籍原文（续）"
        // label would sit above empty space and read as a missing block. The label
        // belongs on the block that is actually there.
        drafts.push(
          draft("translationLabel", "MODERN READING / 今译（续）", TYPE.sectionLabel, TYPE.sectionLabel),
        );
      }
      if (index === 0) {
        drafts.push(
          draft("translationLabel", "MODERN READING / 今译", TYPE.sectionLabel, TYPE.sectionLabel),
        );
      }
      drafts.push(bodyDraft("translation", chunk, TYPE.translation, chunk, BODY_LINE_HEIGHT));
      if (last) {
        drafts.push(
          draft("commentaryLabel", "COMMENTARY / 注释", TYPE.sectionLabel, TYPE.sectionLabel),
          bodyDraft(
            "commentary",
            content.commentary,
            TYPE.commentary,
            content.commentary,
            COMMENTARY_LINE_HEIGHT,
          ),
          bodyDraft(
            "commentary",
            content.historicalNote,
            TYPE.commentary,
            content.historicalNote,
            COMMENTARY_LINE_HEIGHT,
          ),
        );
      }
      return { kind: "classical" as const, blocks: stackBlocks(drafts, CLASSICAL_TOP).blocks };
    });

  // Split when a single scene either does not fit on screen or cannot be read inside a
  // watchable stretch of time. Both tests have to say no before a short translation is
  // kept whole: splitting one just adds a scene and eats the pacing.
  const single = build([content.translation]);
  const unreadable = readingFrames(single[0]) > MAX_CLASSICAL_SCENE_FRAMES;
  if (findOverflow(single).length === 0 && !unreadable) {
    return single;
  }
  const screens = Math.ceil(readingFrames(single[0]) / MAX_CLASSICAL_SCENE_FRAMES);
  const count = Math.min(MAX_CLASSICAL_SCENES, Math.max(2, screens));
  return build(splitTranslation(content.translation, count));
};

export const planClosingScene = (content: FilmContent): ScenePlan => {
  const drafts: Draft[] = [
    draft("sectionLabel", "FIELD NOTE", TYPE.sectionLabel, TYPE.sectionLabel),
    draft(
      "closingTitle",
      "本草初识",
      TYPE.closingTitle,
      Math.ceil(TYPE.closingTitle * CLOSING_TITLE_LINE_HEIGHT),
    ),
  ];
  for (const fact of content.facts) {
    drafts.push(draft("fact", fact.value, TYPE.factValue, FACT_HEIGHT, fact.label));
  }
  drafts.push(
    draft("sectionLabel", "PUBLICATION NOTE", TYPE.sectionLabel, TYPE.sectionLabel),
    bodyDraft(
      "publicationNote",
      citation(content),
      TYPE.meta,
      content.volume,
      META_LINE_HEIGHT,
    ),
    draft("disclaimer", DISCLAIMER_TEXT, TYPE.disclaimer, Math.ceil(TYPE.disclaimer * META_LINE_HEIGHT)),
  );

  const { blocks } = stackBlocks(drafts);
  // The brand mark is anchored to the bottom of the frame rather than stacked, matching
  // the published films: stacked, it floats in the middle of the empty lower half.
  const signY = CANVAS.height - BOTTOM_RESERVE - SIGN_SIZE;
  blocks.push({
    kind: "sign",
    text: "sign",
    fontSize: TYPE.disclaimer,
    x: CANVAS.width - SAFE_INSET - SIGN_SIZE,
    y: signY,
    width: SIGN_SIZE,
    height: SIGN_SIZE,
  });
  return { kind: "closing", blocks };
};

/**
 * Duration follows how long the film takes to *read*, not how many characters it
 * happens to contain. Counting characters alone is what let a 12-second film carry 99
 * characters in one scene: the total looked small, but it was all in one place.
 *
 * A scene too tall for the canvas cannot be rescued by a longer duration, so
 * findOverflow still reports that separately.
 */
export const requiredDuration = (
  scenes: ScenePlan[],
  ladder: readonly PlannedDuration[] = ALLOWED_DURATIONS,
): PlannedDuration => {
  const needed = scenes.reduce(
    (total, scene) => total + Math.max(MIN_SCENE_FRAMES, readingFrames(scene)),
    0,
  );
  // Past the last rung the content simply does not fit. Cap there and let
  // findReadingProblems report the overload rather than invent a duration.
  return ladder.find((d) => d >= needed) ?? ladder[ladder.length - 1];
};

export const planFilm = (content: FilmContent): FilmPlan => {
  const hero = planHeroScene(content);
  const classical = planClassicalScenes(content);
  const closing = planClosingScene(content);
  const scenes = [hero, ...classical, closing];
  const durationInFrames = requiredDuration(scenes, durationLadder(content));

  // Give every scene the time it needs to be read, then share the leftover in the same
  // proportion. The old split handed the hero and the closing the same weight as the
  // classical scene carrying three quarters of the text, which is how the middle of a
  // 12-second film ended up at 31 characters/second while the hero sat at 2.5.
  const need = scenes.map((scene) => Math.max(MIN_SCENE_FRAMES, readingFrames(scene)));
  const needSum = need.reduce((a, b) => a + b, 0);
  const frames =
    needSum <= durationInFrames
      ? (() => {
          const leftover = durationInFrames - needSum;
          const allocated = need.map((n) => n + Math.floor((leftover * n) / needSum));
          // Floor rounding drops a few frames; the last scene absorbs them so the plan
          // still adds up to exactly durationInFrames.
          allocated[allocated.length - 1] +=
            durationInFrames - allocated.reduce((a, b) => a + b, 0);
          return allocated;
        })()
      : // The content outran the longest film this series makes. Split the time evenly
        // and let findReadingProblems report the overload rather than hide it.
        scenes.map((_, index) =>
          index === scenes.length - 1
            ? durationInFrames - Math.floor(durationInFrames / scenes.length) * (scenes.length - 1)
            : Math.floor(durationInFrames / scenes.length),
        );

  const breaks: number[] = [];
  let acc = 0;
  for (let i = 0; i < scenes.length - 1; i += 1) {
    acc += frames[i];
    breaks.push(acc);
  }
  return { durationInFrames, breaks, scenes };
};

/** Blocks that overlap in the same scene. Empty is the only acceptable answer. */
export const findOverlaps = (scenes: ScenePlan[]): string[] => {
  const problems: string[] = [];
  for (const scene of scenes) {
    const sorted = [...scene.blocks].sort((a, b) => a.y - b.y);
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1];
      const next = sorted[i];
      const gap = next.y - (prev.y + prev.height);
      if (gap < 0) {
        problems.push(`${scene.kind}: "${prev.text}" overlaps "${next.text}" by ${-gap}px`);
      } else if (gap < MIN_CLEARANCE) {
        problems.push(`${scene.kind}: only ${gap}px between "${prev.text}" and "${next.text}"`);
      }
    }
  }
  return problems;
};

/** A scene taller than the canvas cannot be rescued by a longer duration. */
export const findOverflow = (scenes: ScenePlan[]): string[] => {
  const limit = CANVAS.height - BOTTOM_RESERVE;
  const problems: string[] = [];
  for (const scene of scenes) {
    for (const block of scene.blocks) {
      const bottom = block.y + block.height;
      if (bottom > limit) {
        problems.push(`${scene.kind}: "${block.text}" ends at ${bottom}px, past the ${limit}px limit`);
      }
    }
  }
  return problems;
};

/** Every scene must be long enough to read. */
export const findPacingProblems = (plan: FilmPlan): string[] => {
  const problems: string[] = [];
  const bounds = [0, ...plan.breaks, plan.durationInFrames];
  if (plan.breaks.length !== plan.scenes.length - 1) {
    problems.push(`${plan.scenes.length} scenes need ${plan.scenes.length - 1} breaks`);
  }
  for (let i = 0; i < bounds.length - 1; i += 1) {
    const length = bounds[i + 1] - bounds[i];
    if (length < MIN_SCENE_FRAMES) {
      problems.push(`scene ${i + 1} is ${length} frames, below ${MIN_SCENE_FRAMES}`);
    }
  }
  // Against the full ladder, not the standard one: the plan already encodes whether
  // this film was allowed a rung above the cap, and `checkPlan` reports that
  // separately under `duration`. Re-deciding it here would report it twice.
  if (!(DURATION_LADDER as readonly number[]).includes(plan.durationInFrames)) {
    problems.push(`duration ${plan.durationInFrames} is not an allowed value`);
  }
  return problems;
};

/**
 * The CJK strings a viewer actually reads, in render order.
 *
 * Hand-written films could be scanned by regexing their JSX; a data-driven film's
 * visible text lives here in the content module instead, so the repetition scan
 * reads it off the plan rather than off the wrapper file (which has no Chinese at
 * all). Labels, the brand mark and the ASCII credit line are excluded — they are
 * chrome, not prose.
 */
export const visibleText = (content: FilmContent): string[] => {
  return planFilm(content)
    .scenes.flatMap((scene) => scene.blocks)
    .filter((block) => !CHROME_KINDS.includes(block.kind))
    .flatMap((block) =>
      block.kind === "panel" && block.detail ? [block.text, block.detail] : [block.text],
    )
    .filter((text) => /[\u4e00-\u9fff]/.test(text));
};
