// Automated version of SKILL.md's "repeated-string scan".
//
// SKILL.md asks for a final scan across all visible on-screen text before
// rendering. That used to be a hand-written `once: [...]` list per film in
// tests/finished-video.test.ts, which only ever covered the handful of strings
// somebody remembered to add. This module reads the film source and finds the
// duplicates itself, so the check no longer depends on recall.

/** Text nodes shorter than this are labels/numbers and not worth flagging. */
const MIN_LENGTH = 2;

/**
 * SKILL.md allows repeats only for "a required source credit or disclaimer".
 * Bibliographic citations (《…》…卷/篇/部) and the disclaimer are exempt; every
 * other repeated string is a content-repetition defect.
 */
export const isAllowedRepeat = (text: string): boolean =>
  text.includes("古籍内容展示，不构成诊疗建议") ||
  (text.includes("《") && /[卷篇部]/.test(text));

/** Extract the visible CJK text nodes from a film's JSX source. */
export const extractVisibleText = (source: string): string[] =>
  [...source.matchAll(/>([^<>{}\n]{2,60})</g)]
    .map((m) => m[1].trim())
    .filter((t) => t.length >= MIN_LENGTH && /[\u4e00-\u9fff]/.test(t));

export type Repeat = { text: string; count: number };

/** Repeated visible strings within a single film, excluding allowed repeats. */
export const findRepeats = (source: string): Repeat[] => {
  const counts = new Map<string, number>();
  for (const text of extractVisibleText(source)) {
    counts.set(text, (counts.get(text) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([text, count]) => count > 1 && !isAllowedRepeat(text))
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text));
};

export const formatRepeats = (file: string, repeats: Repeat[]): string =>
  repeats.map((r) => `${file}: "${r.text}" appears ${r.count} times`).join("\n");
