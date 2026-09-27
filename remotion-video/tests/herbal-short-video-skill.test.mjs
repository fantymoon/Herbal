import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const skillUrl = new URL("../../.agents/skills/herbal-short-video-production/SKILL.md", import.meta.url);

// The skill is written in Chinese, so the assertions are Chinese: they quote the
// normative sentence itself rather than a paraphrase, which is what keeps this file
// from drifting into "the skill mentions something vaguely like this".
//
// Code identifiers, paths and commands stay ASCII on purpose — they are what a reader
// types — so those assertions are unchanged.
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
  assert.equal(source.includes("平台发布"), true);
  assert.equal(source.includes("短标题"), true);
  assert.equal(source.includes("视频描述"), true);
  assert.equal(source.includes("不夸大疗效"), true);
  assert.equal(source.includes("npm test"), true);
  assert.equal(source.includes("ffprobe"), true);
  assert.equal(source.includes("内容重复"), true);
  assert.equal(source.includes("只出现在一屏"), true);
  assert.equal(source.includes("重复字符串扫描"), true);
  assert.equal(source.includes("更长的一段连续原文"), true);
  assert.equal(source.includes("原序"), true);
  assert.equal(source.includes("明显分开的现代白话翻译"), true);
  assert.equal(source.includes("每一处今译都要与医疗建议保持距离"), true);
  assert.equal(source.includes("今译不是注释"), true);
  assert.equal(source.includes("逐句现代汉语翻译"), true);
  assert.equal(source.includes("不得以“这段主要谈及……”等概括、评论或释义替代今译"), true);
  assert.equal(source.includes("评论/说明"), true);
  assert.equal(source.includes("原序是内部生产规则"), true);
  assert.equal(source.includes("不要在片内展示工作流顺序"), true);
  assert.equal(source.includes("卷、篇、部、章节"), true);
  assert.equal(source.includes("阅读顺序"), true);
  assert.equal(source.includes("ENTRY 04/05"), true);

  // Rules added after the 2026-09 platform warning. Each one has a matching gate in
  // scripts/lib/compliance.ts, so this file keeps the skill and the tests in step.
  assert.equal(source.includes("已发布影片是冻结的"), true);
  assert.equal(source.includes("scripts/lib/frozen-films.ts"), true);
  assert.equal(source.includes("永远不要往这个名单里加新片"), true);
  assert.equal(source.includes("npm run check"), true);
  assert.equal(source.includes("`今译` 正文至少 56px"), true);
  assert.equal(source.includes("450 / 540 / 630 / 720 帧"), true);
  // The reading budget is the second budget the engine checks, next to geometry.
  assert.equal(source.includes("阅读预算是门禁，不是建议"), true);
  assert.equal(source.includes("READING_RATE_LIMIT"), true);
  assert.equal(source.includes("每部片必须有一个单独成块、明确标注的"), true);
  assert.equal(source.includes("upload/<kebab>.md"), true);
  assert.equal(source.includes("--sheet"), true);
  assert.equal(source.includes("tests/compliance.test.ts"), true);
  assert.equal(source.includes("`FinishedFilm` 接受任意数量的场景"), true);

  // The data-driven workflow. A new film is content data + a thin wrapper, and the
  // draft state is what lets the gate report an unfinished film without failing.
  assert.equal(source.includes("新片如何构成"), true);
  assert.equal(source.includes("src/films/<kebab>.ts"), true);
  assert.equal(source.includes("npm run new-film"), true);
  assert.equal(source.includes("草稿态"), true);
  assert.equal(source.includes("src/layout.ts"), true);
  assert.equal(source.includes("永远不要手写块的位置或自选字号"), true);
  // The first frame is a blank card: the reveal starts at frame 2, so a platform that
  // defaults the cover to frame 0 gets an empty one.
  assert.equal(source.includes("第 0 帧是一张空白纸"), true);
  assert.equal(source.includes("拒绝草稿"), true);
});
