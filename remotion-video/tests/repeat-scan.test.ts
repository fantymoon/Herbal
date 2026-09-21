import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { isFrozen } from "../scripts/lib/frozen-films.ts";
import { findRepeats, formatRepeats } from "../scripts/lib/repeat-scan.ts";

const finishedDir = new URL("../src/finished/", import.meta.url);
const finishedFiles = fs
  .readdirSync(finishedDir)
  .filter((f) => f.endsWith(".tsx"))
  .sort();

// Grandfathered content-repetition in one published film. It shows 别名 / 生境 /
// 人衔 · 鬼盖 twice; the master is live, so it stays as-is. New films must be clean.
const legacyRepeatFilms = new Set(["ginseng-first-film.tsx"]);

test("the repeat scanner finds a duplicated visible string", () => {
  const source = `
    <div>本草初识</div>
    <div>生境</div>
    <div>生境</div>
  `;
  const repeats = findRepeats(source);
  assert.equal(repeats.length, 1);
  assert.deepEqual(repeats[0], { text: "生境", count: 2 });
});

test("the repeat scanner ignores the disclaimer and bibliographic citations", () => {
  const source = `
    <div>古籍内容展示，不构成诊疗建议</div>
    <div>古籍内容展示，不构成诊疗建议</div>
    <div>《神农本草经》· 卷一 · 上经</div>
    <div>《神农本草经》· 卷一 · 上经</div>
  `;
  assert.deepEqual(findRepeats(source), []);
});

test("the repeat scanner ignores ASCII-only credit lines", () => {
  const source = `
    <div>ASTRAGALUS MEMBRANACEUS / NATURALIS / CC0</div>
    <div>ASTRAGALUS MEMBRANACEUS / NATURALIS / CC0</div>
  `;
  assert.deepEqual(findRepeats(source), []);
});

test("every new film keeps each visible phrase in one scene only", () => {
  const offenders: string[] = [];
  for (const file of finishedFiles.filter((f) => !isFrozen(f))) {
    const source = fs.readFileSync(new URL(file, finishedDir), "utf8");
    const repeats = findRepeats(source);
    if (repeats.length > 0) {
      offenders.push(formatRepeats(file, repeats));
    }
  }
  assert.deepEqual(offenders, [], offenders.join("\n"));
});

test("repeated text in published films stays limited to the grandfathered set", () => {
  const withRepeats = finishedFiles.filter(
    (file) => findRepeats(fs.readFileSync(new URL(file, finishedDir), "utf8")).length > 0,
  );
  assert.deepEqual(withRepeats.sort(), [...legacyRepeatFilms].sort());
});
