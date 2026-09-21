import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/HerbalVisuals.tsx", import.meta.url), "utf8");
const stageSource = fs.readFileSync(new URL("../src/herbal-stage.tsx", import.meta.url), "utf8");
const cardsSource = fs.readFileSync(new URL("../src/herbal-cards.tsx", import.meta.url), "utf8");

test("reference images are not used as full-bleed scene backgrounds", () => {
  assert.equal(source.includes('staticFile("paper-herbs.png")'), false);
  assert.equal(source.includes('staticFile("ink-portrait.png")'), false);
  assert.equal(source.includes('staticFile("ink-title.png")'), false);
});

test("the cutout sign mark and tall ingredient text stay legible", () => {
  assert.equal(stageSource.includes('staticFile("sign-1.png")'), true);
  assert.equal(stageSource.includes('staticFile("sign.png")'), false);
  assert.equal(source.includes("<SignMark frame={props.frame} size={200} rotation={-6} />"), true);
  assert.equal(cardsSource.includes("fontSize: compact ? 60 : 30"), true);
  assert.equal(cardsSource.includes("fontSize: compact ? 28 : 16"), true);
});

test("tall formula pinyin and English labels are sized for mobile viewing", () => {
  assert.equal(source.includes('size={tall ? 24 : 13}'), true);
  assert.equal(source.includes('fontSize: tall ? 34 : 13'), true);
  assert.equal(stageSource.includes('fontSize: mode === "tall" ? 18 : 12'), true);
});

test("tall formula seal has a readable size and safe inset", () => {
  assert.equal(source.includes('right: tall ? 64 : 74'), true);
  assert.equal(source.includes('top: tall ? 72 : 82'), true);
  assert.equal(source.includes('size={tall ? 110 : 78}'), true);
  assert.equal(source.includes('glyphScale={tall ? 0.52 : 0.28}'), true);
  assert.equal(stageSource.includes("glyphScale?: number"), true);
  assert.equal(stageSource.includes("fontSize: size * glyphScale"), true);
});

test("templates use trimmed background music with gentle fades", () => {
  assert.equal(source.includes('import { Audio } from "@remotion/media"'), true);
  assert.equal(source.includes("src={staticFile(source)}"), true);
  assert.equal(source.includes('source="music/gaoshan-liushui.mp3"'), true);
  assert.equal(source.includes('source="music/yuzhou-changwan.mp3"'), true);
  assert.equal(source.includes("trimAfter={durationInFrames}"), true);
  assert.equal(source.includes("interpolate("), true);
});

test("the scene shell falls back to the composition duration instead of a magic number", () => {
  assert.equal(stageSource.includes("durationInFrames?: number"), true);
  assert.equal(stageSource.includes("durationInFrames = 151"), false);
  assert.equal(stageSource.includes("useVideoConfig"), true);
  assert.equal(stageSource.includes("durationInFrames ?? compositionDuration"), true);
});

test("finished films share one music/film shell instead of copying it", () => {
  const shell = fs.readFileSync(new URL("../src/finished-shell.tsx", import.meta.url), "utf8");
  assert.equal(shell.includes("export const FinishedMusic"), true);
  assert.equal(shell.includes("export const FinishedFilm"), true);
  assert.equal(shell.includes("trimAfter={durationInFrames}"), true);
  assert.equal(shell.includes("peakVolume = 0.12"), true);
  assert.equal(shell.includes("[0, peakVolume, peakVolume, 0]"), true);
  assert.equal(shell.includes("<SceneShell"), true);
  assert.equal(shell.includes("<svg"), false);
});
