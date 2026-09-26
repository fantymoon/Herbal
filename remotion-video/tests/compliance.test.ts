import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { FROZEN_FILMS, isFrozen } from "../scripts/lib/frozen-films.ts";
import {
  REQUIRED_NOTE,
  checkContent,
  checkFilmFile,
  checkNewFilm,
  checkPlan,
  formatViolations,
  isDraft,
  unfinishedFields,
  type Violation,
} from "../scripts/lib/compliance.ts";
import { readFilmId, readKnownPhotos } from "../scripts/lib/film-files.ts";
import { loadContent } from "../scripts/lib/film-content.ts";
import { TYPE, findPacingProblems, planFilm, type FilmContent } from "../src/layout.ts";

const repo = new URL("../", import.meta.url);
const finishedDir = new URL("src/finished/", repo);
const filmsDir = fileURLToPath(new URL("src/films/", repo));
// `new URL(...).pathname` yields "/D:/..." on Windows, which fs then resolves against
// the drive root as D:\D:\... — fileURLToPath is the only portable spelling.
const knownPhotos = readKnownPhotos(
  fileURLToPath(new URL("public/images/credits.json", repo)),
);

const finishedFiles = fs
  .readdirSync(finishedDir)
  .filter((f) => f.endsWith(".tsx"))
  .sort();
const newFilms = finishedFiles.filter((f) => !isFrozen(f));

const compliantContent: FilmContent = {
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
  commentary: "古病名与功效描述按原文用字保留，不作现代病症理解。",
  historicalNote: REQUIRED_NOTE,
  facts: [
    { label: "别名", value: "金芝" },
    { label: "篇目位置", value: "上经 · 芝部" },
  ],
  photo: {
    file: "ganoderma-chizhi.jpg",
    subject: "GANODERMA SP.",
    author: "MOTOKO C. K.",
    license: "CC BY 4.0",
  },
  music: "music/yuzhou-changwan.mp3",
  accent: "#a8812f",
  mode: "single-herb",
};

const compliantFilmFile = `import { EntryFilm } from "../entry-film";
import { content } from "../films/huangzhi-first-film";

export const HuangzhiFirstFilm: React.FC = () => <EntryFilm content={content} />;
`;

const rulesOf = (violations: Violation[]): string[] => violations.map((v) => v.rule);

// ---- The gate must be provably able to fail ---------------------------------

test("the gate accepts a compliant content module and film file", () => {
  const violations = checkNewFilm(compliantFilmFile, compliantContent, knownPhotos);
  assert.deepEqual(violations, [], formatViolations("fixture", violations));
});

test("the gate rejects a translation that drops the historical frame", () => {
  const broken = { ...compliantContent, translation: "主治心腹五种邪气，增益脾气。" };
  const rules = rulesOf(checkContent(broken, knownPhotos));
  assert.ok(rules.includes("efficacy-frame"), "expected efficacy-frame");
  assert.ok(rules.includes("banned-wording"), "expected banned-wording for 主治");
});

test("the gate rejects a missing or reworded historical note", () => {
  const broken = { ...compliantContent, historicalNote: "古代说法，仅供参考" };
  assert.ok(rulesOf(checkContent(broken, knownPhotos)).includes("commentary"));
});

test("the gate rejects an unfinished scaffold", () => {
  const broken = {
    ...compliantContent,
    translation: "TODO 逐句今译",
    photo: { ...compliantContent.photo, file: "TODO-<ascii-name>.jpg" },
  };
  const rules = rulesOf(checkContent(broken, knownPhotos));
  assert.ok(rules.includes("unfinished"), "expected unfinished");
  assert.ok(rules.includes("photo"), "expected photo");
});

test("a scaffold is a draft, and a completed content module is not", () => {
  const scaffold: FilmContent = {
    ...compliantContent,
    latin: "TODO PINYIN",
    translation: "TODO 逐句今译",
    commentary: "TODO 注释",
    photo: {
      file: "TODO-<ascii-name>.jpg",
      subject: "TODO SPECIES",
      author: "TODO AUTHOR",
      license: "TODO LICENSE",
    },
  };
  assert.equal(isDraft(scaffold), true);
  assert.ok(unfinishedFields(scaffold).includes("translation"));
  assert.ok(unfinishedFields(scaffold).includes("photo.file"));
  assert.equal(isDraft(compliantContent), false);
  assert.equal(isDraft(null), false, "a hand-written film is not a draft");
});

test("the gate rejects a photo that is not registered in the credits ledger", () => {
  const broken = {
    ...compliantContent,
    photo: { ...compliantContent.photo, file: "not-registered.jpg" },
  };
  assert.ok(rulesOf(checkContent(broken, knownPhotos)).includes("photo"));
});

test("the gate rejects a film file that keeps its own layout", () => {
  const broken = compliantFilmFile.replace(
    "<EntryFilm content={content} />",
    '<div style={{ position: "absolute", top: 10 }} />',
  );
  assert.ok(rulesOf(checkFilmFile(broken)).includes("thin-wrapper"));
});

test("the gate rejects a film file that bypasses the shared renderer", () => {
  const handWritten = `import { FinishedFilm } from "../finished-shell";

export const DanshaFirstFilm: React.FC = () => <FinishedFilm />;
`;
  const rules = rulesOf(checkFilmFile(handWritten));
  assert.ok(rules.includes("data-driven"), "expected data-driven");
});

test("the gate rejects a film file that imports the legacy templates", () => {
  const broken = compliantFilmFile.replace(
    'import { content } from "../films/huangzhi-first-film";',
    'import { content } from "../films/huangzhi-first-film";\nimport { HerbalFeature } from "../HerbalVisuals";',
  );
  assert.ok(rulesOf(checkFilmFile(broken)).includes("legacy-template"));
});

test("the gate rejects a content module with a code-drawn style background", () => {
  const broken = `${compliantFilmFile}const bg = { backgroundImage: "url(x)" };`;
  assert.ok(rulesOf(checkFilmFile(broken)).includes("code-drawn"));
});

test("the layout gate rejects a content module whose text cannot fit", () => {
  // A translation far too long for the two classical scenes the split allows.
  const broken = { ...compliantContent, translation: compliantContent.translation.repeat(40) };
  const rules = rulesOf(checkPlan(broken));
  assert.ok(
    rules.includes("layout-overflow") || rules.includes("pacing"),
    `expected a layout failure, got ${rules.join(", ")}`,
  );
});

test("the layout gate rejects a film whose middle scene cannot be read in time", () => {
  // Geometry alone would pass this: no overlap, no overflow, no pacing problem. What
  // fails is the reading load, which is the budget the engine did not have before.
  const broken = { ...compliantContent, translation: compliantContent.translation.repeat(6) };
  const rules = rulesOf(checkPlan(broken));
  assert.ok(rules.includes("reading-budget"), `expected reading-budget, got ${rules.join(", ")}`);
});

test("the planner never starves a scene, however long the translation", () => {
  // The scene count is capped at four (hero + at most two classical + closing), so the
  // 540-frame ceiling can never fall below the 4s-per-scene floor: 4 * 120 = 480. A
  // translation too long to read is therefore reported as overflow, not as bad pacing.
  // This asserts that structural guarantee rather than a particular long string.
  for (const repeats of [1, 2, 6, 40]) {
    const content = {
      ...compliantContent,
      translation: compliantContent.translation.repeat(repeats),
    };
    assert.deepEqual(
      findPacingProblems(planFilm(content)),
      [],
      `pacing broke at translation.repeat(${repeats})`,
    );
  }
});

test("the pacing checker is not vacuous", () => {
  // Guards the rule above: if findPacingProblems could not fail, the invariant test
  // would pass for the wrong reason.
  const plan = planFilm(compliantContent);
  const starved = { ...plan, durationInFrames: 360 as const, breaks: [60, 300] };
  assert.ok(findPacingProblems(starved).length > 0, "expected a 60-frame scene to be rejected");
});


test("the layout gate passes a well-formed plan and reports no overlaps", () => {
  const plan = planFilm(compliantContent);
  assert.deepEqual(checkPlan(compliantContent), []);
  assert.ok(plan.scenes.length >= 3 && plan.scenes.length <= 4);
});

test("every declared type size is one the layout engine can produce", () => {
  const allowed = new Set<number>(Object.values(TYPE));
  const plan = planFilm(compliantContent);
  for (const scene of plan.scenes) {
    for (const block of scene.blocks) {
      assert.ok(allowed.has(block.fontSize), block.text);
    }
  }
});

// ---- The published films are frozen -----------------------------------------

// Deliberate freeze (2026-09-21): the masters are live copies and rewriting them is
// out of scope. Unlike the accidental counts this suite used to carry, the list may
// only shrink.
const PUBLISHED_FILMS_AT_FREEZE = 55;

test("the frozen list matches the published films and does not rot", () => {
  assert.equal(FROZEN_FILMS.length, PUBLISHED_FILMS_AT_FREEZE);
  assert.equal(new Set(FROZEN_FILMS).size, FROZEN_FILMS.length, "no duplicates in the frozen list");
  for (const f of FROZEN_FILMS) {
    assert.equal(fs.existsSync(new URL(f, finishedDir)), true, `${f} is frozen but missing on disk`);
  }
});

test("every film is either frozen or checked against the current rules", () => {
  const frozenOnDisk = finishedFiles.filter((f) => isFrozen(f));
  assert.equal(frozenOnDisk.length, FROZEN_FILMS.length);
  assert.equal(frozenOnDisk.length + newFilms.length, finishedFiles.length);
});

for (const file of newFilms) {
  test(`compliance: ${file} follows the current rules`, async () => {
    const source = fs.readFileSync(new URL(file, finishedDir), "utf8");
    const { content, error } = await loadContent(source, filmsDir);
    assert.equal(error, null, error ?? "");
    if (isDraft(content)) {
      // A draft may be incomplete, but only because it is not renderable — the test
      // below asserts that. It must genuinely have work left, so "draft" can never be
      // used to park a film that is actually finished but non-compliant.
      assert.ok(
        unfinishedFields(content!).length > 0,
        `${file} is marked as a draft but has no placeholders left`,
      );
      return;
    }
    const violations = checkNewFilm(source, content, knownPhotos);
    assert.deepEqual(violations, [], formatViolations(file, violations));
  });
}

test("no draft is registered as a renderable composition", async () => {
  // The whole leniency towards drafts rests on this: a draft has no Composition, so it
  // cannot be rendered, and therefore cannot reach a platform. If a draft ever showed
  // up in src/Composition.tsx, the gate's draft state would become an escape hatch.
  const composition = fs.readFileSync(fileURLToPath(new URL("src/Composition.tsx", repo)), "utf8");
  for (const file of newFilms) {
    const source = fs.readFileSync(new URL(file, finishedDir), "utf8");
    const { content } = await loadContent(source, filmsDir);
    if (!isDraft(content)) {
      continue;
    }
    const filmId = readFilmId(source);
    assert.ok(filmId, `${file} declares no exported film component`);
    assert.equal(
      composition.includes(`id="${filmId}"`),
      false,
      `${filmId} is a draft but is registered in src/Composition.tsx (run npm run gen)`,
    );
  }
});
