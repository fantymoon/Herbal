import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const skillUrl = new URL("../../.agents/skills/herbal-short-video-production/SKILL.md", import.meta.url);

test("the herbal short-video skill captures the production guardrails", () => {
  assert.equal(fs.existsSync(skillUrl), true);
  const source = fs.readFileSync(skillUrl, "utf8");

  assert.equal(source.includes("single-herb"), true);
  assert.equal(source.includes("formula"), true);
  assert.equal(source.includes("药"), true);
  assert.equal(source.includes("方"), true);
  assert.equal(source.includes("public/images"), true);
  assert.equal(source.includes("Img"), true);
  assert.equal(source.includes("staticFile"), true);
  assert.equal(source.includes("1080×1920"), true);
  assert.equal(source.includes("不使用代码绘制"), true);
  assert.equal(source.includes("Platform Publishing"), true);
  assert.equal(source.includes("短标题"), true);
  assert.equal(source.includes("视频描述"), true);
  assert.equal(source.includes("不夸大疗效"), true);
  assert.equal(source.includes("npm test"), true);
  assert.equal(source.includes("ffprobe"), true);
  assert.equal(source.includes("Content Repetition"), true);
  assert.equal(source.includes("one scene only"), true);
  assert.equal(source.includes("repeated-string scan"), true);
  assert.equal(source.includes("longer contiguous original quote"), true);
  assert.equal(source.includes("original order"), true);
  assert.equal(source.includes("modern plain-language translation"), true);
  assert.equal(source.includes("Keep every translation distinct from medical advice"), true);
  assert.equal(source.includes("Translation is not commentary"), true);
  assert.equal(source.includes("逐句现代汉语翻译"), true);
  assert.equal(source.includes("不得以“这段主要谈及……”等概括、评论或释义替代今译"), true);
  assert.equal(source.includes("评论/说明"), true);
  assert.equal(source.includes("original order is an internal production rule"), true);
  assert.equal(source.includes("Do not display workflow order"), true);
  assert.equal(source.includes("卷、篇、部、章节"), true);
  assert.equal(source.includes("阅读顺序"), true);
  assert.equal(source.includes("ENTRY 04/05"), true);

  // Rules added after the 2026-09 platform warning. Each one has a matching gate in
  // scripts/lib/compliance.ts, so this file keeps the skill and the tests in step.
  assert.equal(source.includes("Published Films Are Frozen"), true);
  assert.equal(source.includes("scripts/lib/frozen-films.ts"), true);
  assert.equal(source.includes("Never add a new film to that list"), true);
  assert.equal(source.includes("npm run check"), true);
  assert.equal(source.includes("the `今译` body must be at least 56px"), true);
  assert.equal(source.includes("360 / 450 / 540 frames at 30 fps"), true);
  assert.equal(source.includes("Every film must carry a separate block explicitly labelled"), true);
  assert.equal(source.includes("upload/<kebab>.md"), true);
  assert.equal(source.includes("--sheet"), true);
  assert.equal(source.includes("tests/compliance.test.ts"), true);
  assert.equal(source.includes("`FinishedFilm` takes any number of scenes"), true);
});
