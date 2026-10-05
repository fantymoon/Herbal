import test from "node:test";
import assert from "node:assert/strict";
import {
  ALLOWED_DURATIONS,
  COVER_BLOCKS,
  DECLARED_TYPE_SIZES,
  openingFor,
  revealDelay,
  CANVAS,
  MIN_CLEARANCE,
  MIN_SCENE_FRAMES,
  READING_RATE_LIMIT,
  SAFE_INSET,
  SEAL_GLYPH,
  findOverflow,
  findOverlaps,
  findPacingProblems,
  findReadingProblems,
  formatReadingBudget,
  planFilm,
  readingBudget,
  sealGlyph,
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
  // `DECLARED_TYPE_SIZES` is `TYPE` plus the hero-title ladder. The hero name is sized to
  // its own length rather than to one number, and the rule this test defends is that no
  // size is invented at a call site — not that every size is a constant.
  const allowed = new Set<number>(DECLARED_TYPE_SIZES);
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

test("even a short entry lands on 540 frames, because the 注释 and disclaimer are read too", () => {
  // 360 frames leaves 120 for the classical scene, which carries the original, the
  // 今译, the 注释 and the historical note. At READING_RATE_LIMIT that is not enough
  // for any real entry, so the shortest step of the scale is effectively unreachable
  // and a new film starts at 18 seconds.
  const plan = planFilm(base);
  assert.equal(plan.durationInFrames, 540);
  assert.deepEqual(findReadingProblems(plan), []);
});

test("the plan's breaks ascend and every scene is non-empty", () => {
  const plan = planFilm(base);
  assert.equal(plan.breaks.length, plan.scenes.length - 1);
  assert.deepEqual(
    [...plan.breaks].sort((a, b) => a - b),
    plan.breaks,
    "breaks must ascend",
  );
  const bounds = [0, ...plan.breaks, plan.durationInFrames];
  for (let i = 0; i < bounds.length - 1; i += 1) {
    assert.ok(bounds[i + 1] > bounds[i], "every scene must be non-empty");
  }
});

// ---- Reading budget ---------------------------------------------------------

test("every scene of a well-formed film is readable at the ceiling", () => {
  const plan = planFilm(base);
  assert.deepEqual(findReadingProblems(plan), []);
  for (const scene of readingBudget(plan)) {
    assert.ok(
      scene.rate <= READING_RATE_LIMIT,
      `${scene.kind} asks for ${scene.rate.toFixed(1)} characters/second`,
    );
  }
});

test("the reading budget catches a screen that is geometrically fine but unreadable", () => {
  // The failure the old engine could not see: no overlap, no overflow, no pacing
  // problem — yet the middle scene asks for ~23 characters per second. This entry is
  // long enough that the split has already run out (three classical scenes is the cap),
  // so the overload can only be reported, not laid out away.
  const cramped = { ...base, translation: base.translation.repeat(6) };
  const plan = planFilm(cramped);
  assert.deepEqual(findOverlaps(plan.scenes), []);
  assert.deepEqual(findOverflow(plan.scenes), []);
  assert.deepEqual(findPacingProblems(plan), []);
  assert.ok(
    findReadingProblems(plan).length > 0,
    "a screen asking for more than the ceiling must be reported",
  );
});

test("the time a scene gets follows what it has to be read, not an equal split", () => {
  // The old plan gave hero, classical and closing equal weight, so the classical scene
  // carrying three quarters of the text got the same 120 frames as the hero.
  const plan = planFilm(base);
  const budget = readingBudget(plan);
  const classical = budget.find((s) => s.kind === "classical");
  const hero = budget.find((s) => s.kind === "hero");
  assert.ok(classical && hero);
  assert.ok(
    classical.allotted > hero.allotted,
    `classical got ${classical.allotted} frames and hero ${hero.allotted}`,
  );
  assert.ok(classical.chars > hero.chars * 4, "the fixture must actually carry the text");
});

test("the verbose reading report names every scene and its rate", () => {
  // `npm run check -- --verbose` promises the per-scene rate (SKILL.md). The gate only
  // says pass or fail, so without this a film sitting at 14.6 of the 15/s ceiling looks
  // identical to one at 6/s.
  const plan = planFilm(base);
  const lines = formatReadingBudget(plan);
  assert.equal(lines.length, plan.scenes.length);
  for (const [index, scene] of readingBudget(plan).entries()) {
    assert.ok(
      lines[index].includes(scene.kind),
      `line ${index} does not name the ${scene.kind} scene: ${lines[index]}`,
    );
    assert.ok(
      lines[index].includes(`${scene.rate.toFixed(1)}/s`),
      `line ${index} does not print the rate: ${lines[index]}`,
    );
  }
  // An overloaded scene is flagged in the same line, so the report points at the screen
  // to fix rather than only at the film.
  const cramped = planFilm({ ...base, translation: base.translation.repeat(6) });
  assert.ok(formatReadingBudget(cramped).some((line) => line.includes("OVER")));
});

test("the reading ceiling is what decides the duration, not a character count", () => {
  // Two entries with the same total character count but a different distribution get
  // different durations, because the duration follows the busiest scene.
  const spread = { ...base, commentary: base.commentary.repeat(3) };
  const plain = planFilm(base);
  const heavy = planFilm(spread);
  assert.ok(
    heavy.durationInFrames > plain.durationInFrames,
    `expected ${heavy.durationInFrames} > ${plain.durationInFrames}`,
  );
  assert.deepEqual(findReadingProblems(heavy), []);
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
  assert.ok(
    title.height < title.fontSize * 1.2,
    `hero title reserved ${title.height}px for a ${title.fontSize}px line`,
  );

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

test("a continuation screen does not label a block it does not have", () => {
  // Every continuation scene used to open with "CLASSICAL ENTRY / 古籍原文（续）" and
  // then go straight to the 今译, so the screen led with a heading for a block that was
  // not on it. The 原文 is printed once, on the first classical scene.
  const split = planFilm({ ...base, translation: base.translation.repeat(2) });
  const classical = split.scenes.filter((s) => s.kind === "classical");
  assert.ok(classical.length > 1, "the fixture must actually split across screens");
  assert.ok(classical[0].blocks.some((b) => b.kind === "classical"));
  for (const scene of classical.slice(1)) {
    assert.equal(
      scene.blocks.some((b) => b.kind === "classical"),
      false,
      "a continuation screen carries no 原文",
    );
    assert.equal(
      scene.blocks.some((b) => b.kind === "classicalLabel"),
      false,
      "and therefore must not label one",
    );
    assert.ok(
      scene.blocks.some((b) => b.kind === "translationLabel"),
      "the 今译 it does carry is labelled",
    );
  }
});

test("the hero carries a hook, and its name is on screen from the first frame", () => {
  // Two things the platform numbers pointed at. The hero was a reference card — name,
  // pinyin, division, photo, flavour — with nothing that gives a viewer who does not
  // already know the herb a reason to stay; the hook lived only in the upload copy,
  // while the 2s bounce the platform reports is measured on the video. And the reveal
  // started at frame 2, so frame 0 — which is what the platform shows as the cover —
  // was a blank card.
  const plan = planFilm({ ...base, hook: "古书说它黄如紫金" });
  const hero = plan.scenes[0];
  const kinds = hero.blocks.map((b) => b.kind);
  assert.equal(hero.blocks.find((b) => b.kind === "hook")?.text, "古书说它黄如紫金");
  assert.ok(
    kinds.indexOf("hook") > kinds.indexOf("heroVolume"),
    "the hook belongs under the title block",
  );
  assert.ok(
    kinds.indexOf("hook") < kinds.indexOf("photo"),
    "and above the photo, where the opening seconds will actually show it",
  );
  assert.deepEqual(findOverflow(plan.scenes), []);
  assert.deepEqual(findOverlaps(plan.scenes), []);

  // Frame 0 is already the title card...
  assert.ok(revealDelay("hero", 0) <= -26, "the hero's first block starts fully on");
  assert.ok(revealDelay("hero", 1) <= -26, "so does the name");
  // ...while a later scene still opens from a blank card, which is what makes a cut
  // read as a cut rather than as more of the same screen.
  assert.ok(revealDelay("scene", 0) >= 0);

  // The instant opening belongs to the hook, and only to the hook: a film without one
  // renders exactly as it did before, so no master already on disk changes under it.
  assert.equal(openingFor(hero.blocks.map((b) => b.kind)), "hero");
  assert.equal(openingFor(planFilm(base).scenes[0].blocks.map((b) => b.kind)), "scene");
});

test("the short shape shows the original and the framing, and nothing else", () => {
  // 12 seconds instead of 24. Average watch time is 7.2s on a 24-second film and 7.3s on
  // a 12-second one, so the last seventeen seconds are watched by nobody — and the dense
  // screens carrying 今译 and 注释 are exactly the part that goes unread. They move to the
  // upload copy, where a reader can take their time. What stays is what the book says,
  // where it says it, and the framing that keeps 主…… a historical claim.
  const plan = planFilm({ ...base, reading: "copy" });
  const kinds = plan.scenes.flatMap((s) => s.blocks.map((b) => b.kind));
  assert.equal(plan.scenes.length, 3, "hero, one classical scene, closing");
  assert.ok(kinds.includes("classical"));
  assert.equal(kinds.includes("translation"), false, "the 今译 is not on screen");
  assert.equal(kinds.includes("commentaryLabel"), false, "nor is the 注释 label");
  assert.ok(
    plan.scenes.some((s) => s.blocks.some((b) => b.text.includes("未经现代科学证实"))),
    "the historical note stays on screen",
  );
  assert.ok(
    plan.durationInFrames <= 450,
    "expected a short film, got " + plan.durationInFrames + " frames",
  );
  assert.deepEqual(findOverflow(plan.scenes), []);
  assert.deepEqual(findPacingProblems(plan), []);
});

test("the cover carries the photo as well as the name", () => {
  // A cover that is only the name is a pale rectangle with two characters on it. The name
  // is the only thing legible at thumbnail size and has to stay, but a thumbnail is read
  // for its picture, so the photo is on screen from frame 0 rather than fading in with the
  // rest of the hero.
  assert.deepEqual([...COVER_BLOCKS].sort(), ["heroTitle", "photo", "sectionLabel"]);
  const hero = planFilm({ ...base, hook: "一句钩子" }).scenes[0];
  for (const kind of COVER_BLOCKS) {
    assert.ok(
      hero.blocks.some((b) => b.kind === kind),
      `the cover needs a ${kind} block to draw`,
    );
  }
});

test("a film with no hook still plans", () => {
  const plan = planFilm(base);
  assert.equal(plan.scenes[0].blocks.some((b) => b.kind === "hook"), false);
  assert.deepEqual(findOverflow(plan.scenes), []);
});

test("the closing scene carries the disclaimer", () => {
  const plan = planFilm(base);
  const closing = plan.scenes[plan.scenes.length - 1];
  assert.equal(closing.kind, "closing");
  assert.ok(closing.blocks.some((b) => b.text.includes("不构成诊疗建议")));
});

test("the seal glyph follows the mode instead of being fixed", () => {
  // The gate validates `mode`; if the renderer ignored it, a formula film would pass
  // the rules and still come out stamped 药. A mapping that is asserted here is what
  // makes that rule about behaviour rather than about a field's shape.
  assert.equal(sealGlyph("single-herb"), "药");
  assert.equal(sealGlyph("formula"), "方");
  assert.equal(
    new Set(Object.values(SEAL_GLYPH)).size,
    Object.keys(SEAL_GLYPH).length,
    "two modes must not share a glyph",
  );
});
