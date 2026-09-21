import test from "node:test";
import assert from "node:assert/strict";
import {
  ALLOWED_DURATIONS,
  CANVAS,
  MIN_CLEARANCE,
  MIN_SCENE_FRAMES,
  SAFE_INSET,
  TYPE,
  findOverflow,
  findOverlaps,
  findPacingProblems,
  planFilm,
  splitTranslation,
  textHeight,
  wrappedLineCount,
  type FilmContent,
} from "../src/layout.ts";

const base: FilmContent = {
  id: "HuangzhiFirstFilm",
  entry: "黄芝",
  latin: "HUANG ZHI",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷一 · 上经",
  division: "上经 · 芝部",
  flavor: "味甘，平。",
  alias: "一名金芝",
  original: "主心腹五邪，益脾气，安神，忠信和乐。久食，轻身、不老、延年、神仙。",
  translation:
    "古籍称其主心腹五种邪气，能增益脾气，安定神志，令人忠信和乐。长期食用，可使身体轻健、不衰老、延长寿命。",
  commentary: "古病名与功效描述按原文用字保留，不作现代病症或疗效理解。",
  historicalNote: "此为汉代认知，未经现代科学证实",
  facts: [
    { label: "别名", value: "金芝" },
    { label: "篇目位置", value: "上经 · 芝部" },
  ],
  photo: {
    file: "ganoderma-huangzhi.jpg",
    subject: "GANODERMA SP.",
    author: "TEST AUTHOR",
    license: "CC BY-SA 4.0",
  },
  music: "music/yuzhou-changwan.mp3",
  accent: "#a8812f",
  mode: "single-herb",
};

test("the layout engine produces a plan inside the canvas with no overlaps", () => {
  const plan = planFilm(base);
  assert.deepEqual(findOverlaps(plan.scenes), []);
  assert.deepEqual(findOverflow(plan.scenes), []);
  assert.deepEqual(findPacingProblems(plan), []);
});

test("every block keeps at least 50px of clearance from the one above it", () => {
  const plan = planFilm(base);
  for (const scene of plan.scenes) {
    const sorted = [...scene.blocks].sort((a, b) => a.y - b.y);
    for (let i = 1; i < sorted.length; i += 1) {
      const gap = sorted[i].y - (sorted[i - 1].y + sorted[i - 1].height);
      assert.ok(gap >= MIN_CLEARANCE, `${scene.kind}: gap ${gap} < ${MIN_CLEARANCE}`);
    }
  }
});

test("every block stays inside the safe horizontal inset", () => {
  const plan = planFilm(base);
  for (const scene of plan.scenes) {
    for (const block of scene.blocks) {
      assert.ok(block.x >= SAFE_INSET, block.text);
      assert.ok(block.x + block.width <= CANVAS.width - SAFE_INSET, block.text);
      assert.ok(block.y >= 0 && block.y + block.height <= CANVAS.height, block.text);
    }
  }
});

test("the plan only uses the declared type scale", () => {
  const allowed = new Set<number>(Object.values(TYPE));
  const plan = planFilm(base);
  for (const scene of plan.scenes) {
    for (const block of scene.blocks) {
      assert.ok(allowed.has(block.fontSize), `"${block.text}" uses ${block.fontSize}px`);
    }
  }
});

test("the 今译 body is never shrunk below the 56px floor", () => {
  const long = {
    ...base,
    translation: base.translation.repeat(4),
    original: base.original.repeat(3),
  };
  const plan = planFilm(long);
  const bodies = plan.scenes.flatMap((s) => s.blocks.filter((b) => b.kind === "translation"));
  assert.ok(bodies.length > 0);
  for (const block of bodies) {
    assert.ok(block.fontSize >= 56, `translation rendered at ${block.fontSize}px`);
  }
});

test("a long translation is split across scenes instead of shrunk", () => {
  // Long enough that one classical scene genuinely cannot hold it.
  const long = { ...base, translation: base.translation.repeat(4) };
  const plan = planFilm(long);
  const classical = plan.scenes.filter((s) => s.kind === "classical");
  assert.equal(classical.length, 2, "expected the translation to occupy two scenes");
  assert.ok(plan.scenes.length <= 4, "at most four scenes so 540 frames still paces at 135 each");
  assert.deepEqual(findOverlaps(plan.scenes), []);
  assert.deepEqual(findOverflow(plan.scenes), []);
  assert.deepEqual(findPacingProblems(plan), []);
});

test("a translation that fits stays in one scene", () => {
  const plan = planFilm(base);
  assert.equal(plan.scenes.filter((s) => s.kind === "classical").length, 1);
});

test("the split translation rejoins into the original text", () => {
  const text = "第一句。第二句。第三句。第四句。";
  const chunks = splitTranslation(text, 2);
  assert.equal(chunks.length, 2);
  assert.equal(chunks.join(""), text);
});

test("a short entry still gets the shortest allowed duration", () => {
  const plan = planFilm(base);
  assert.equal(plan.durationInFrames, 360);
  assert.equal(plan.breaks.length, plan.scenes.length - 1);
  assert.deepEqual(
    [...plan.breaks].sort((a, b) => a - b),
    plan.breaks,
    "breaks must ascend",
  );
});

test("a longer entry earns a longer duration rather than cramped type", () => {
  const long = {
    ...base,
    original: base.original.repeat(3),
    translation: base.translation.repeat(3),
    commentary: base.commentary.repeat(2),
  };
  const plan = planFilm(long);
  assert.ok(plan.durationInFrames > 360, `expected a longer film, got ${plan.durationInFrames}`);
  assert.ok(
    (ALLOWED_DURATIONS as readonly number[]).includes(plan.durationInFrames),
    "duration must stay in the allowed set",
  );
  assert.deepEqual(findPacingProblems(plan), []);
});

test("every scene gets at least four seconds", () => {
  const plan = planFilm(base);
  const bounds = [0, ...plan.breaks, plan.durationInFrames];
  for (let i = 0; i < bounds.length - 1; i += 1) {
    assert.ok(bounds[i + 1] - bounds[i] >= MIN_SCENE_FRAMES);
  }
});

test("the overlap checker actually reports an overlap", () => {
  const plan = planFilm(base);
  const broken = {
    ...plan,
    scenes: plan.scenes.map((scene) =>
      scene.kind === "hero"
        ? {
            ...scene,
            blocks: scene.blocks.map((b, i) => (i === 1 ? { ...b, y: scene.blocks[0].y } : b)),
          }
        : scene,
    ),
  };
  const problems = findOverlaps(broken.scenes);
  assert.ok(problems.length > 0, "an overlapping pair must be reported");
  assert.ok(problems[0].includes("overlaps"));
});

test("the overflow checker reports a block that runs past the canvas", () => {
  const plan = planFilm(base);
  const broken = plan.scenes.map((scene) =>
    scene.kind === "closing"
      ? { ...scene, blocks: scene.blocks.map((b) => ({ ...b, y: CANVAS.height - 10 })) }
      : scene,
  );
  assert.ok(findOverflow(broken).length > 0);
});

test("text measurement scales with length and font size", () => {
  assert.equal(wrappedLineCount("短句", 60), 1);
  assert.equal(wrappedLineCount("字".repeat(40), 60), 3);
  assert.ok(textHeight("字".repeat(40), 60) > textHeight("字".repeat(40), 36));
  assert.ok(textHeight("字".repeat(20), 60) < textHeight("字".repeat(80), 60));
});

test("a block reserves the height its own line-height actually renders", () => {
  // The original code measured every block with a 1.5 line box, so the 150px hero
  // title reserved 225px for a 138px line and pushed the whole hero ~87px lower than
  // the published films. The reserved height has to follow the rendered line-height.
  const hero = planFilm(base).scenes[0];
  const title = hero.blocks.find((b) => b.kind === "heroTitle");
  assert.ok(title);
  assert.ok(title.height < TYPE.heroTitle * 1.2, `hero title reserved ${title.height}px`);

  const classical = planFilm(base)
    .scenes.filter((s) => s.kind === "classical")
    .flatMap((s) => s.blocks)
    .find((b) => b.kind === "classical");
  assert.ok(classical);
  assert.ok(
    classical.height < textHeight(classical.text, classical.fontSize, 1.5),
    "the classical excerpt renders at 1.35, so it must not reserve a 1.5 line box",
  );
});

test("the hero scene carries the title, photo and the cited flavour panel", () => {
  const plan = planFilm(base);
  const hero = plan.scenes[0];
  assert.equal(hero.kind, "hero");
  const kinds = hero.blocks.map((b) => b.kind);
  for (const kind of ["heroTitle", "photo", "panel"] as const) {
    assert.ok(kinds.includes(kind), `hero is missing ${kind}`);
  }
  // The citation lives in the panel; a second, stacked copy would land on the
  // decorative landscape and read as a grey smudge.
  assert.equal(kinds.includes("publicationNote"), false, "the hero must not repeat the citation");
  const title = hero.blocks.find((b) => b.kind === "heroTitle");
  assert.equal(title?.text, "黄芝");
  // The flavour excerpt and its citation share the panel, so the citation is printed
  // in 《》 and stays exempt from the repetition scan.
  const panel = hero.blocks.find((b) => b.kind === "panel");
  assert.ok(panel);
  assert.equal(panel.text, "味甘，平。");
  assert.equal(panel.detail?.includes("《神农本草经》"), true);
});

test("the classical scenes carry the original, the 今译 and the 注释", () => {
  const plan = planFilm(base);
  const kinds = plan.scenes.filter((s) => s.kind === "classical").flatMap((s) => s.blocks.map((b) => b.kind));
  assert.ok(kinds.includes("classical"));
  assert.ok(kinds.includes("translation"));
  assert.ok(kinds.includes("commentary"));
});

test("the closing scene carries the disclaimer", () => {
  const plan = planFilm(base);
  const closing = plan.scenes[plan.scenes.length - 1];
  assert.equal(closing.kind, "closing");
  assert.ok(closing.blocks.some((b) => b.text.includes("不构成诊疗建议")));
});
