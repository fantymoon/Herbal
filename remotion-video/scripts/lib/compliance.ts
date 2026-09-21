// Compliance rules for NEW films (anything not listed in scripts/lib/frozen-films.ts).
//
// These rules mirror SKILL.md. They exist because the previous enforcement was
// backwards: tests/herbal-short-video-skill.test.mjs only checked that SKILL.md
// *contains* certain phrases, so a film could violate every rule while the suite
// stayed green. This module checks the film itself.
//
// Kept as a pure function (source string in, violations out) so the test suite
// can prove it actually fails on bad input instead of just being armed.

export type Violation = { rule: string; detail: string };

export const BANNED_THERAPEUTIC_WORDS = [
  "治疗",
  "改善",
  "有效",
  "根治",
  "特效",
  "治愈",
  "秘方",
  "神效",
  "必备",
  "包治",
  "断根",
  "奇效",
  "立竿见影",
  "药到病除",
] as const;

/** Mandated 注释 line framing efficacy as historical belief. Verbatim from SKILL.md. */
export const REQUIRED_NOTE = "此为汉代认知，未经现代科学证实";
/** Mandated opening for a 今译 clause that translates a 主…… efficacy statement. */
export const REQUIRED_FRAME = "古籍称其主";
export const DISCLAIMER = "古籍内容展示，不构成诊疗建议";

/** New films may breathe: 12s / 15s / 18s at 30fps. Legacy films are locked to 360. */
export const ALLOWED_DURATIONS = [360, 450, 540] as const;
/** SKILL.md: at least 4 seconds per scene. */
export const MIN_SCENE_FRAMES = 120;
/** SKILL.md readability floor: the 今译 body must be at least 56px. */
export const MIN_TRANSLATION_FONT = 56;
/**
 * Hard floor for any on-screen Chinese. ASCII-only lines (photo credits such as
 * "ASTRAGALUS MEMBRANACEUS / NATURALIS / CC0") are exempt, which is why this is
 * checked per-element rather than as a blanket minimum over every fontSize.
 * SKILL.md's "secondary Chinese >= 34px" stays guidance, not a hard gate.
 */
export const MIN_CJK_FONT = 24;

const numbersAfter = (source: string, marker: string): number[] => {
  const at = source.indexOf(marker);
  if (at < 0) {
    return [];
  }
  return [...source.slice(at).matchAll(/fontSize:\s*(\d+)/g)].map((m) => Number(m[1]));
};

export const checkNewFilm = (source: string): Violation[] => {
  const violations: Violation[] = [];
  const add = (rule: string, detail: string) => violations.push({ rule, detail });

  // 1. Structural: built on the shared shell, seal, disclaimer.
  if (!source.includes("<FinishedFilm")) {
    add("shared-shell", "does not render through FinishedFilm");
  }
  if (!source.includes('from "../finished-shell"')) {
    add("shared-shell", 'missing import from "../finished-shell"');
  }
  if (!source.includes('<Seal text="')) {
    add("seal", "missing the mode seal");
  }
  if (!source.includes(DISCLAIMER)) {
    add("disclaimer", `missing "${DISCLAIMER}"`);
  }
  // SKILL.md: never code-draw a herb — use a real, credited photo.
  if (!/staticFile\("images\/[^"]+"\)/.test(source)) {
    add("photo", "references no photo from public/images");
  }

  // 2. Original + modern reading must both be present.
  if (!source.includes("今译")) {
    add("translation", "missing the 今译 block");
  }
  if (!source.includes("MODERN READING")) {
    add("translation", "missing the MODERN READING label");
  }

  // 3. 注释 block is required and must carry the historical framing note.
  if (!/注释|COMMENTARY/.test(source)) {
    add("commentary", "missing a 注释 / COMMENTARY block");
  }
  if (!source.includes(REQUIRED_NOTE)) {
    add("commentary", `missing the required note "${REQUIRED_NOTE}"`);
  }

  // 4. Whenever an efficacy statement (主……) is present, the translation must
  //    open with the historical frame instead of a modern therapeutic verb.
  if (/主/.test(source) && !source.includes(REQUIRED_FRAME)) {
    add("efficacy-frame", `quotes 主…… but the 今译 never opens with "${REQUIRED_FRAME}"`);
  }

  // 5. Banned wording. 主治 is included here: it is only grandfathered in frozen films.
  for (const word of BANNED_THERAPEUTIC_WORDS) {
    if (source.includes(word)) {
      add("banned-wording", `contains "${word}"`);
    }
  }
  if (source.includes("主治")) {
    add("banned-wording", 'contains "主治" (only frozen films may keep it)');
  }

  // 6. Readability floors.
  const translationSizes = numbersAfter(source, "MODERN READING");
  if (translationSizes.length === 0) {
    add("readability", "cannot read the 今译 body font size");
  } else if (translationSizes[0] < MIN_TRANSLATION_FONT) {
    add(
      "readability",
      `今译 body is ${translationSizes[0]}px, below the ${MIN_TRANSLATION_FONT}px floor`,
    );
  }
  // Per-element floor: only elements that actually render Chinese are held to it.
  for (const m of source.matchAll(/fontSize:\s*(\d+)/g)) {
    const size = Number(m[1]);
    if (size >= MIN_CJK_FONT) {
      continue;
    }
    const context = source.slice(m.index ?? 0, (m.index ?? 0) + 240);
    if (/[\u4e00-\u9fff]/.test(context)) {
      add("readability", `Chinese text at ${size}px, below the ${MIN_CJK_FONT}px floor`);
    }
  }

  // 7. Pacing: allowed duration, ascending breaks, one fewer break than scenes,
  //    and no scene shorter than 4 seconds.
  const duration = Number(source.match(/durationInFrames=\{(\d+)\}/)?.[1] ?? 0);
  if (!ALLOWED_DURATIONS.includes(duration as (typeof ALLOWED_DURATIONS)[number])) {
    add(
      "pacing",
      `durationInFrames=${duration || "missing"} is not one of ${ALLOWED_DURATIONS.join(" / ")}`,
    );
  }
  const breaksMatch = source.match(/breaks=\{\[([\d,\s]+)\]\}/);
  if (!breaksMatch) {
    add("pacing", "missing a breaks={[...]} literal");
  } else {
    const breaks = breaksMatch[1]
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((v) => !Number.isNaN(v));
    const scenesMatch = source.match(/scenes=\{\[([^\]]*)\]\}/);
    const sceneCount = scenesMatch
      ? scenesMatch[1].split(",").filter((s) => s.trim().length > 0).length
      : 0;
    if (sceneCount === 0) {
      add("pacing", "cannot read the scenes={[...]} list");
    } else if (breaks.length !== sceneCount - 1) {
      add("pacing", `${sceneCount} scenes need ${sceneCount - 1} breaks, found ${breaks.length}`);
    }
    const ascending = breaks.every((b, i) => i === 0 || b > breaks[i - 1]);
    if (!ascending) {
      add("pacing", `breaks must ascend, got [${breaks.join(", ")}]`);
    }
    const bounds = [0, ...breaks, duration];
    for (let i = 0; i < bounds.length - 1; i += 1) {
      const length = bounds[i + 1] - bounds[i];
      if (length < MIN_SCENE_FRAMES) {
        add("pacing", `scene ${i + 1} is ${length} frames, below ${MIN_SCENE_FRAMES} (4s)`);
      }
    }
  }

  return violations;
};

export const formatViolations = (file: string, violations: Violation[]): string =>
  violations.map((v) => `${file}: [${v.rule}] ${v.detail}`).join("\n");
