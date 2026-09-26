// Compliance rules for NEW films (anything not listed in scripts/lib/frozen-films.ts).
//
// These rules mirror SKILL.md. The previous enforcement was backwards:
// tests/herbal-short-video-skill.test.mjs only checked that SKILL.md *contains*
// certain phrases, so a film could violate every rule while the suite stayed green.
//
// New films are data-driven, so the gate checks the content module and the layout
// plan instead of regexing JSX. That turns the layout invariants — no overlap, the
// 50px clearance, the type floor — into machine-checked facts rather than something
// a human is asked to eyeball on every film.
import {
  DISCLAIMER_TEXT,
  REQUIRED_FRAME,
  REQUIRED_NOTE,
  findOverflow,
  findOverlaps,
  findPacingProblems,
  findReadingProblems,
  planFilm,
  type FilmContent,
} from "../../src/layout.ts";

export { REQUIRED_FRAME, REQUIRED_NOTE, DISCLAIMER_TEXT };

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

export const formatViolations = (file: string, violations: Violation[]): string =>
  violations.map((v) => `${file}: [${v.rule}] ${v.detail}`).join("\n");

const TODO = /TODO/;

/**
 * Fields still carrying a scaffold placeholder.
 *
 * This is the single source of the "draft" signal. A draft film is deliberately
 * incomplete: `npm run gen` refuses to register it and `npm run verify` refuses to
 * render it, so a draft can never reach a platform. That is what keeps the gate's
 * leniency towards drafts from being an escape hatch — the only way to get a
 * renderable film is to clear every placeholder and pass the full rules.
 */
export const unfinishedFields = (content: FilmContent): string[] => {
  const fields: string[] = [];
  for (const field of ["entry", "latin", "translation", "commentary"] as const) {
    if (TODO.test(content[field])) {
      fields.push(field);
    }
  }
  for (const field of ["file", "subject", "license"] as const) {
    if (TODO.test(content.photo[field])) {
      fields.push(`photo.${field}`);
    }
  }
  return fields;
};

/** A data-driven film that still carries scaffold placeholders. */
export const isDraft = (content: FilmContent | null): boolean =>
  content !== null && unfinishedFields(content).length > 0;

/** Rules that live in the content module. */
export const checkContent = (content: FilmContent, knownPhotos: Set<string>): Violation[] => {
  const violations: Violation[] = [];
  const add = (rule: string, detail: string) => violations.push({ rule, detail });

  for (const field of unfinishedFields(content)) {
    add("unfinished", `${field} is still a TODO placeholder`);
  }
  if (content.entry.trim().length === 0) {
    add("identity", "entry is empty");
  }

  // The 注释 block is required and must carry the mandated historical framing.
  if (!content.commentary || content.commentary.trim().length === 0) {
    add("commentary", "commentary is empty");
  }
  if (content.historicalNote !== REQUIRED_NOTE) {
    add("commentary", `historicalNote must be exactly "${REQUIRED_NOTE}"`);
  }

  // A 主…… efficacy statement must be translated behind the historical frame.
  if (/主/.test(content.original) && !content.translation.includes(REQUIRED_FRAME)) {
    add("efficacy-frame", `quotes 主…… but the 今译 never opens with "${REQUIRED_FRAME}"`);
  }

  // Banned wording. 主治 is included: it is only grandfathered in the frozen films.
  const prose = [content.translation, content.commentary, content.historicalNote].join("\n");
  for (const word of BANNED_THERAPEUTIC_WORDS) {
    if (prose.includes(word)) {
      add("banned-wording", `contains "${word}"`);
    }
  }
  if (prose.includes("主治")) {
    add("banned-wording", 'contains "主治" (only frozen films may keep it)');
  }

  // A real, credited photo — never a code-drawn herb.
  const photoPlaceholder = (["file", "subject", "license"] as const).some((field) =>
    TODO.test(content.photo[field]),
  );
  if (photoPlaceholder) {
    add("photo", "photo file, subject or licence is still a TODO placeholder");
  } else {
    if (!/\.(jpe?g|png)$/i.test(content.photo.file)) {
      add("photo", `photo file "${content.photo.file}" must be a jpg or png`);
    }
    if (!knownPhotos.has(content.photo.file)) {
      add("photo", `${content.photo.file} is not registered in public/images/credits.json`);
    }
  }
  if (!["single-herb", "formula"].includes(content.mode)) {
    add("seal", `mode "${content.mode}" has no seal glyph`);
  }
  if (!content.music.startsWith("music/")) {
    add("music", `music "${content.music}" must live under public/music`);
  }
  return violations;
};

/** Rules about the film file itself: it must stay a thin wrapper. */
export const checkFilmFile = (source: string): Violation[] => {
  const violations: Violation[] = [];
  const add = (rule: string, detail: string) => violations.push({ rule, detail });

  if (!source.includes("<EntryFilm")) {
    add("data-driven", "does not render through <EntryFilm>");
  }
  if (!source.includes('from "../entry-film"')) {
    add("data-driven", 'missing import from "../entry-film"');
  }
  if (!/from "\.\.\/films\//.test(source)) {
    add("data-driven", "does not import its content from src/films/");
  }
  // A thin wrapper cannot carry its own layout — that is the point of the split.
  if (source.includes('position: "absolute"')) {
    add("thin-wrapper", "contains hand-written absolute positioning");
  }
  if (source.includes('from "../HerbalVisuals"')) {
    add("legacy-template", "imports the legacy HerbalVisuals templates");
  }
  if (source.includes("<svg")) {
    add("code-drawn", "contains a code-drawn illustration");
  }
  if (source.includes("backgroundImage")) {
    add("code-drawn", "uses a CSS background image");
  }
  const exports = [...source.matchAll(/export const (\w+)/g)].map((m) => m[1]);
  if (exports.length !== 1) {
    add("identity", `expected exactly one exported film component, found ${exports.length}`);
  }
  return violations;
};

/** Rules the layout plan can prove: spacing, overflow, scene split, pacing. */
export const checkPlan = (content: FilmContent): Violation[] => {
  const plan = planFilm(content);
  const violations: Violation[] = [];
  const add = (rule: string, detail: string) => violations.push({ rule, detail });

  for (const problem of findOverlaps(plan.scenes)) {
    add("layout-overlap", problem);
  }
  for (const problem of findOverflow(plan.scenes)) {
    add("layout-overflow", problem);
  }
  for (const problem of findPacingProblems(plan)) {
    add("pacing", problem);
  }
  // Geometry says the text fits on screen; it says nothing about whether the viewer has
  // time to read it. The two budgets are checked separately.
  for (const problem of findReadingProblems(plan)) {
    add("reading-budget", problem);
  }
  // The disclaimer is part of the closing scene by construction; assert it survived.
  const closing = plan.scenes[plan.scenes.length - 1];
  if (!closing.blocks.some((b) => b.text.includes(DISCLAIMER_TEXT))) {
    add("disclaimer", `the closing scene does not carry "${DISCLAIMER_TEXT}"`);
  }
  return violations;
};

export const checkNewFilm = (
  filmSource: string,
  content: FilmContent | null,
  knownPhotos: Set<string>,
): Violation[] => {
  const violations = checkFilmFile(filmSource);
  if (!content) {
    violations.push({ rule: "data-driven", detail: "content module could not be loaded" });
    return violations;
  }
  violations.push(...checkContent(content, knownPhotos), ...checkPlan(content));
  return violations;
};
