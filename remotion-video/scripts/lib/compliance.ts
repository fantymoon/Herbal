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
  FPS,
  FRAME_MARKERS,
  NEGOTIABLE_RULES,
  REQUIRED_FRAME,
  REQUIRED_NOTE,
  STANDARD_DURATION_CAP,
  claimText,
  findOverflow,
  findOverlaps,
  findPacingProblems,
  findReadingProblems,
  findUnreadableScenes,
  isNegotiableRule,
  missingFrameParts,
  planFilm,
  type FilmContent,
} from "../../src/layout.ts";

export { REQUIRED_FRAME, REQUIRED_NOTE, DISCLAIMER_TEXT, missingFrameParts, NEGOTIABLE_RULES };

export type Violation = {
  rule: string;
  detail: string;
  /**
   * The film's own reason for breaking this rule, when its content module declared the
   * rule negotiable. Set means "reported, not failing": the finding still travels into
   * the check output and the test suite, so a waiver is visible rather than silent.
   * Only `NEGOTIABLE_RULES` can ever appear here — a safety rule has no waiver path.
   */
  waived?: string;
};

/** A finding that is reported but does not fail the run. */
export const isWaived = (violation: Violation): boolean => violation.waived !== undefined;
/** Findings that do fail the run. */
export const hardViolations = (violations: Violation[]): Violation[] =>
  violations.filter((v) => !isWaived(v));

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

/**
 * The class of claim the platform actually objected to, which the list above does not cover.
 *
 * 15 手挑 words are a blocklist: it catches the phrasings somebody thought of, and the
 * penalty was for a *kind* of sentence — "尚未被现代科学证实或夸大功效". Measured against
 * the current wording rules, a title reading 「长期服用可缓解头痛，消炎止痛，降血压」 with a
 * description of 「增强免疫，抗肿瘤」 passed with zero problems, because none of those five
 * words is on any list and nothing else looks at a title. These are the modern-pharmacology
 * verbs the old list was missing; the fix is not a longer list, it is that they now fail the
 * same one function as everything else.
 */
export const MODERN_CLAIM_WORDS = [
  "缓解",
  "止痛",
  "消炎",
  "抗菌",
  "抑菌",
  "抗癌",
  "抗肿瘤",
  "降血压",
  "降血糖",
  "降血脂",
  "增强免疫",
  "提高免疫",
  "提升免疫",
  "预防",
  "康复",
  "见效",
  "靶向",
] as const;

/**
 * Banned wording in a piece of prose, once, for whoever asks.
 *
 * The on-screen check and the upload-copy check used to be two loops over two lists in two
 * files, which is how a film ended up with a compliant screen and a non-compliant title —
 * the platform acts on the title. Both now call this.
 */
export const claimWordingProblems = (text: string): string[] => {
  const problems: string[] = [];
  for (const word of [...BANNED_THERAPEUTIC_WORDS, ...MODERN_CLAIM_WORDS]) {
    if (text.includes(word)) problems.push(word);
  }
  // 主治 is in the array's place but kept out of it: the published-film audit scans the
  // 经文 too, and there 主治 is the source talking rather than a claim we made.
  if (text.includes("主治")) problems.push("主治");
  return [...new Set(problems)];
};

export const formatViolations = (file: string, violations: Violation[]): string =>
  violations
    .map(
      (v) =>
        `${file}: [${v.rule}] ${v.detail}` + (v.waived ? ` (waived: ${v.waived})` : ""),
    )
    .join("\n");

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
  // The credit line the renderer draws is `subject / author / license`, so a placeholder
  // author is a placeholder on screen. It was missing from this list, which meant the film
  // was not a draft, passed `checkNewFilm`, and printed "TODO AUTHOR" to a platform.
  if (typeof content.photo.author === "string" && TODO.test(content.photo.author)) {
    fields.push("photo.author");
  }
  return fields;
};

/** A data-driven film that still carries scaffold placeholders. */
export const isDraft = (content: FilmContent | null): boolean =>
  content !== null && unfinishedFields(content).length > 0;

/**
 * The escape hatch has to be narrow, or it is just a hole.
 *
 * Two ways a declaration fails outright, both checked here rather than trusted:
 *
 *   - it names a rule outside `NEGOTIABLE_RULES`. A banned efficacy claim, an unframed
 *     主…… statement, a missing disclaimer, text off the canvas — these are not budget
 *     questions, and letting a film waive them would undo the property that anything
 *     renderable is compliant. The message says which rules *are* negotiable, because
 *     the likely author is a film that picked the wrong rule name.
 *   - it gives no reason. "We need 27 seconds" is a decision; "" is a hole. A blank
 *     `why` would otherwise waive a rule while recording nothing, which is strictly
 *     worse than not having the field.
 */
export const checkDeviations = (content: FilmContent): Violation[] => {
  const violations: Violation[] = [];
  for (const [index, deviation] of (content.deviations ?? []).entries()) {
    const where = `deviations[${index}]`;
    if (!isNegotiableRule(deviation.rule)) {
      violations.push({
        rule: "deviation",
        detail:
          `${where} names "${deviation.rule}", which is not negotiable. Only ` +
          `${NEGOTIABLE_RULES.join(" / ")} may be waived — every other rule is a safety ` +
          `rule, and no reason makes it acceptable.`,
      });
    }
    if (deviation.why.trim().length === 0) {
      violations.push({
        rule: "deviation",
        detail: `${where} (${deviation.rule}) gives no reason — an unexplained waiver is just a broken rule`,
      });
    }
  }
  return violations;
};

/**
 * Attach each declaration's reason to the findings it covers.
 *
 * The finding is not removed. It stays in the list, marked, so `npm run check` prints
 * "waived [reading-budget] … — <reason>" and the test suite can assert on it. Deleting
 * the finding instead would make the waiver invisible in exactly the place a reviewer
 * looks.
 *
 * A declaration whose `rule` or `why` is bad waives nothing: `checkDeviations` has
 * already failed the film, and letting the waiver apply anyway would leave the
 * reported reason and the recorded one disagreeing.
 */
export const applyDeviations = (content: FilmContent, violations: Violation[]): Violation[] => {
  const reasons = new Map<string, string>();
  for (const deviation of content.deviations ?? []) {
    const why = deviation.why.trim();
    if (isNegotiableRule(deviation.rule) && why.length > 0) {
      reasons.set(deviation.rule, why);
    }
  }
  if (reasons.size === 0) return violations;
  return violations.map((violation) =>
    reasons.has(violation.rule) ? { ...violation, waived: reasons.get(violation.rule) } : violation,
  );
};

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
  if (content.historicalNote.trim().length === 0) {
    add("commentary", "historicalNote is empty");
  } else {
    // Three semantic requirements, not a fixed string — see `hasHistoricalFrame`.
    const missing = missingFrameParts(content.historicalNote);
    if (missing.length > 0) {
      add(
        "commentary",
        `historicalNote does not frame the claim as history — missing ${missing.join("; ")}. ` +
          `For example: "${REQUIRED_NOTE}"`,
      );
    }
  }

  // A 主…… efficacy statement has to be attributed to the book rather than asserted. Which
  // attribution wording to use is writing; that one is used is the rule. See `FRAME_MARKERS`.
  if (/主/.test(content.original) && !FRAME_MARKERS.some((marker) => content.translation.includes(marker))) {
    add(
      "efficacy-frame",
      `quotes 主…… but the 今译 never attributes it to the book — any of ` +
        `${FRAME_MARKERS.join(" / ")} + 主… would do, and the wording is yours to choose`,
    );
  }

  // Banned wording, read off the prose this film actually authors.
  //
  // This used to scan `translation` / `commentary` / `historicalNote` as fields, which is a
  // form rather than a behaviour: under `reading: "copy"` two of the three never reach a
  // screen, while the `hook` and the closing `facts` — which always do — were scanned by
  // nobody. `claimText` is the blocks the renderer draws and did not copy out of the book.
  for (const line of claimText(content)) {
    const shown = line.length > 24 ? `${line.slice(0, 24)}…` : line;
    for (const word of claimWordingProblems(line)) {
      add("banned-wording", `the screen shows 「${shown}」 containing "${word}"`);
    }
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
  // Past the hard floor the finding is not a budget complaint, so `deviations` cannot
  // speak it: naming duration / reading-budget / pacing used to switch off the density
  // guard entirely and a screen at 27 chars/s reported `ok`.
  for (const problem of findUnreadableScenes(plan)) {
    add("unreadable", problem);
  }
  // A film past the house cap says so out loud. `requiredDuration` will not reach an
  // extended rung without a declaration, so in practice this finding always arrives
  // already waived — but it is the line that puts "27s, because …" in the check output,
  // and it makes the permission a checked fact rather than a property of the planner.
  if (plan.durationInFrames > STANDARD_DURATION_CAP) {
    add(
      "duration",
      `runs ${(plan.durationInFrames / FPS).toFixed(1)}s, past the ${(
        STANDARD_DURATION_CAP / FPS
      ).toFixed(0)}s house cap`,
    );
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
  const findings = [
    ...checkContent(content, knownPhotos),
    ...checkPlan(content),
    ...checkDeviations(content),
  ];
  return applyDeviations(content, findings);
};
