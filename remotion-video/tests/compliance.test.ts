import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { FROZEN_FILMS, isFrozen } from "../scripts/lib/frozen-films.ts";
import {
  REQUIRED_NOTE,
  checkNewFilm,
  formatViolations,
  type Violation,
} from "../scripts/lib/compliance.ts";

const finishedDir = new URL("../src/finished/", import.meta.url);
const finishedFiles = fs
  .readdirSync(finishedDir)
  .filter((f) => f.endsWith(".tsx"))
  .sort();
const newFilms = finishedFiles.filter((f) => !isFrozen(f));

// A minimal film that satisfies every rule. Mutated below to prove the checker
// actually reports each rule instead of passing everything.
const compliantFilm = `
import { Img, staticFile } from "remotion";
import { FinishedFilm } from "../finished-shell";
import { ink, mutedInk, SectionLabel, Seal } from "../herbal-stage";

const accent = "#a8812f";

const HeroScene: React.FC<{ frame: number }> = () => (
  <>
    <SectionLabel accent={accent} size={24}>SHENNONG BENCAO JING</SectionLabel>
    <div style={{ color: ink, fontFamily: "STKaiti, KaiTi, serif", fontSize: 158 }}>黄芝</div>
    <Seal text="药" size={104} glyphScale={0.55} rotation={-5} />
    <Img src={staticFile("images/ganoderma-chizhi.jpg")} style={{ objectFit: "cover" }} />
  </>
);

const ClassicalScene: React.FC<{ frame: number }> = () => (
  <>
    <SectionLabel accent={accent} size={24}>CLASSICAL ENTRY / 古籍原文</SectionLabel>
    <div style={{ color: ink, fontFamily: "STKaiti, KaiTi, serif", fontSize: 72 }}>主痈疽久败创。</div>
    <SectionLabel accent={accent} size={22}>MODERN READING / 今译</SectionLabel>
    <div style={{ color: ink, fontSize: 60 }}>古籍称其主痈疽和久不愈合的疮口。</div>
    <div style={{ color: mutedInk, fontSize: 34 }}>注释：${REQUIRED_NOTE}。</div>
  </>
);

const ClosingScene: React.FC<{ frame: number }> = () => (
  <>
    <SectionLabel accent={accent} size={24}>FIELD NOTE</SectionLabel>
    <div style={{ color: mutedInk, fontSize: 28 }}>古籍内容展示，不构成诊疗建议</div>
    <Img src={staticFile("sign-1.png")} style={{ objectFit: "contain" }} />
  </>
);

export const HuangzhiFirstFilm: React.FC = () => (
  <FinishedFilm
    accent={accent}
    durationInFrames={360}
    music={staticFile("music/yuzhou-changwan.mp3")}
    breaks={[120, 240]}
    scenes={[HeroScene, ClassicalScene, ClosingScene]}
  />
);
`;

const rulesOf = (violations: Violation[]): string[] => violations.map((v) => v.rule);

test("the compliance checker accepts a film that follows the rules", () => {
  const violations = checkNewFilm(compliantFilm);
  assert.deepEqual(violations, [], formatViolations("fixture", violations));
});

test("the compliance checker rejects a translation that drops the historical frame", () => {
  const broken = compliantFilm.replace("古籍称其主痈疽和久不愈合的疮口。", "主治痈疽和久不愈合的疮口。");
  const violations = checkNewFilm(broken);
  assert.ok(rulesOf(violations).includes("efficacy-frame"), "expected efficacy-frame");
  assert.ok(rulesOf(violations).includes("banned-wording"), "expected banned-wording for 主治");
});

test("the compliance checker rejects an undersized 今译 body", () => {
  const broken = compliantFilm.replace(
    'color: ink, fontSize: 60 }}>古籍称其主',
    'color: ink, fontSize: 42 }}>古籍称其主',
  );
  assert.ok(rulesOf(checkNewFilm(broken)).includes("readability"), "expected readability");
});

test("the compliance checker rejects Chinese text below the hard floor", () => {
  const broken = compliantFilm.replace("fontSize: 34 }}>注释", "fontSize: 20 }}>注释");
  assert.ok(rulesOf(checkNewFilm(broken)).includes("readability"), "expected readability");
});

test("the compliance checker ignores ASCII-only credit lines when applying the floor", () => {
  const withCredit = compliantFilm.replace(
    "<Img src={staticFile(\"sign-1.png\")} style={{ objectFit: \"contain\" }} />",
    '<div style={{ fontSize: 15 }}>ASTRAGALUS MEMBRANACEUS / NATURALIS / CC0</div>',
  );
  assert.deepEqual(checkNewFilm(withCredit), [], "an ASCII credit must not trip the CJK floor");
});

test("the compliance checker rejects a film with no credited photo", () => {
  const broken = compliantFilm.replace(
    '<Img src={staticFile("images/ganoderma-chizhi.jpg")} style={{ objectFit: "cover" }} />',
    '<div>本草图</div>',
  );
  assert.ok(rulesOf(checkNewFilm(broken)).includes("photo"), "expected photo");
});

test("the compliance checker rejects a missing 注释 block and note", () => {
  const broken = compliantFilm.replace(
    `<div style={{ color: mutedInk, fontSize: 34 }}>注释：${REQUIRED_NOTE}。</div>`,
    "",
  );
  const rules = rulesOf(checkNewFilm(broken));
  assert.ok(rules.includes("commentary"), "expected commentary");
});

test("the compliance checker rejects a missing disclaimer", () => {
  const broken = compliantFilm.replace("古籍内容展示，不构成诊疗建议", "感谢观看");
  assert.ok(rulesOf(checkNewFilm(broken)).includes("disclaimer"), "expected disclaimer");
});

test("the compliance checker rejects a film that bypasses the shared shell", () => {
  const broken = compliantFilm.replace("from \"../finished-shell\"", "from \"../herbal-stage\"");
  assert.ok(rulesOf(checkNewFilm(broken)).includes("shared-shell"), "expected shared-shell");
});

test("the compliance checker rejects a disallowed duration", () => {
  const broken = compliantFilm.replace("durationInFrames={360}", "durationInFrames={300}");
  assert.ok(rulesOf(checkNewFilm(broken)).includes("pacing"), "expected pacing");
});

test("the compliance checker rejects scenes shorter than four seconds", () => {
  const broken = compliantFilm.replace("breaks={[120, 240]}", "breaks={[90, 300]}");
  assert.ok(rulesOf(checkNewFilm(broken)).includes("pacing"), "expected pacing");
});

test("the compliance checker rejects a scene/break count mismatch", () => {
  const broken = compliantFilm.replace(
    "scenes={[HeroScene, ClassicalScene, ClosingScene]}",
    "scenes={[HeroScene, ClassicalScene, ClosingScene, HeroScene]}",
  );
  assert.ok(rulesOf(checkNewFilm(broken)).includes("pacing"), "expected pacing");
});

// The published films are frozen by decision (2026-09-21): their masters are live
// copies and rewriting them is out of scope. This number is deliberate, unlike the
// accidental counts this suite used to carry — the list may only shrink.
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
  assert.equal(
    frozenOnDisk.length + newFilms.length,
    finishedFiles.length,
    "every finished film must fall into exactly one bucket",
  );
});

for (const file of newFilms) {
  test(`compliance: ${file} follows the current rules`, () => {
    const source = fs.readFileSync(new URL(file, finishedDir), "utf8");
    const violations = checkNewFilm(source);
    assert.deepEqual(violations, [], formatViolations(file, violations));
  });
}
