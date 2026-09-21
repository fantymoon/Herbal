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
export const ALLOWED_DURATIONS = [360, 450, 540] as const;
export type AllowedDuration = (typeof ALLOWED_DURATIONS)[number];
/** SKILL.md: at least 4 seconds per scene. */
export const MIN_SCENE_FRAMES = 120;

/**
 * Wording the compliance gate requires. Kept here rather than in the checker so the
 * layout and the rules cannot drift apart.
 */
/** Mandated opening for a 今译 clause that translates a 主…… efficacy statement. */
export const REQUIRED_FRAME = "古籍称其主";
/** Mandated 注释 line framing efficacy as historical belief. Verbatim from SKILL.md. */
export const REQUIRED_NOTE = "此为汉代认知，未经现代科学证实";
export const DISCLAIMER_TEXT = "古籍内容展示，不构成诊疗建议";

/**
 * The only font sizes a film may use. The previous films drifted to 46 values
 * (14, 15, 19, 20, 21, 22, ...) because every screen was tuned by hand.
 */
export const TYPE = {
  heroTitle: 150,
  heroLatin: 36,
  heroVolume: 34,
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
  /** Faithful original excerpt. */
  original: string;
  /** Clause-by-clause modern translation. Must open with 古籍称其主 for 主…… clauses. */
  translation: string;
  /** Commentary block text, without the 注释 label. */
  commentary: string;
  /** Mandated historical framing line. */
  historicalNote: string;
  facts: Fact[];
  photo: PhotoCredit;
  music: string;
  accent: string;
  mode: "single-herb" | "formula";
};

export type BlockKind =
  | "sectionLabel"
  | "heroTitle"
  | "heroLatin"
  | "heroVolume"
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
};

export type ScenePlan = {
  kind: "hero" | "classical" | "closing";
  blocks: Block[];
};

export type FilmPlan = {
  durationInFrames: AllowedDuration;
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

export const textHeight = (
  text: string,
  fontSize: number,
  lineHeight = BODY_LINE_HEIGHT,
  width = CONTENT_WIDTH,
): number => Math.ceil(wrappedLineCount(text, fontSize, width) * fontSize * lineHeight);

type Draft = {
  kind: BlockKind;
  text: string;
  fontSize: number;
  height: number;
  detail?: string;
  /** Override the content width (e.g. the square brand mark). */
  width?: number;
  align?: "left" | "right";
};

const draft = (
  kind: BlockKind,
  text: string,
  fontSize: number,
  height: number,
  detail?: string,
  extra: { width?: number; align?: "left" | "right" } = {},
): Draft => ({ kind, text, fontSize, height, detail, ...extra });

const bodyDraft = (
  kind: BlockKind,
  text: string,
  fontSize: number,
  detail?: string,
  lineHeight = BODY_LINE_HEIGHT,
): Draft => draft(kind, text, fontSize, textHeight(text, fontSize, lineHeight), detail);

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
    });
    y += d.height;
  });
  return { blocks, used: y - top };
};

/** Photo insert height, matching the published films' framed 932x500 insert. */
const PHOTO_HEIGHT = 500;
const PHOTO_CHROME = 28;

export const planHeroScene = (content: FilmContent): ScenePlan => {
  const cite = citation(content);
  const drafts: Draft[] = [
    draft("sectionLabel", content.bookLatin, TYPE.sectionLabel, TYPE.sectionLabel),
    bodyDraft("heroTitle", content.entry, TYPE.heroTitle, content.entry, TITLE_LINE_HEIGHT),
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
        drafts.push(
          draft(
            "classicalLabel",
            "CLASSICAL ENTRY / 古籍原文（续）",
            TYPE.sectionLabel,
            TYPE.sectionLabel,
          ),
        );
      }
      drafts.push(
        draft("translationLabel", "MODERN READING / 今译", TYPE.sectionLabel, TYPE.sectionLabel),
        bodyDraft("translation", chunk, TYPE.translation, chunk, BODY_LINE_HEIGHT),
      );
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

  // Split only when a single scene genuinely does not fit. Splitting a short
  // translation across two scenes just adds an extra scene and eats the pacing.
  const single = build([content.translation]);
  if (findOverflow(single).length === 0) {
    return single;
  }
  return build(splitTranslation(content.translation, 2));
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
 * Duration follows the amount of reading, and must always leave every scene at
 * least MIN_SCENE_FRAMES. A scene that is too tall cannot be fixed by adding
 * duration, so findOverflow reports that separately.
 */
export const requiredDuration = (scenes: ScenePlan[], content: FilmContent): AllowedDuration => {
  const chars = [
    content.original,
    content.translation,
    content.commentary,
    content.historicalNote,
  ].reduce((total, text) => total + [...text].length, 0);
  const textDriven = chars <= 130 ? 360 : chars <= 220 ? 450 : 540;
  const pacingFloor = scenes.length * MIN_SCENE_FRAMES;
  const needed = Math.max(textDriven, pacingFloor);
  return ALLOWED_DURATIONS.find((d) => d >= needed) ?? 540;
};

export const planFilm = (content: FilmContent): FilmPlan => {
  const hero = planHeroScene(content);
  const classical = planClassicalScenes(content);
  const closing = planClosingScene(content);
  const scenes = [hero, ...classical, closing];
  const durationInFrames = requiredDuration(scenes, content);

  // Every scene gets the 4s minimum first; only the surplus is shared out by weight,
  // so a 540-frame four-scene film cannot starve its first scene down to 90 frames.
  const weights = scenes.map((s) => (s.kind === "classical" ? 2 : 1));
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const surplus = Math.max(0, durationInFrames - MIN_SCENE_FRAMES * scenes.length);
  const breaks: number[] = [];
  let acc = 0;
  for (let i = 0; i < scenes.length - 1; i += 1) {
    acc += MIN_SCENE_FRAMES + Math.round((surplus * weights[i]) / weightSum);
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
export const findPacingProblems = (plan: FilmPlan): string[] => {  const problems: string[] = [];
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
  if (!ALLOWED_DURATIONS.includes(plan.durationInFrames)) {
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
  const chrome: BlockKind[] = ["sectionLabel", "classicalLabel", "translationLabel", "commentaryLabel", "sign"];
  return planFilm(content)
    .scenes.flatMap((scene) => scene.blocks)
    .filter((block) => !chrome.includes(block.kind))
    .flatMap((block) =>
      block.kind === "panel" && block.detail ? [block.text, block.detail] : [block.text],
    )
    .filter((text) => /[\u4e00-\u9fff]/.test(text));
};
