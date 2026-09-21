// One-command film verification: pre-flight rules + stills + render + ffprobe.
// Usage:
//   npm run verify -- --film=DanshaFirstFilm
//   npm run verify -- --film=DanshaFirstFilm --skip-render       (stills only)
//   npm run verify -- --film=DanshaFirstFilm --sheet             (contact sheet, every 30 frames)
//   npm run verify -- --film=DanshaFirstFilm --sheet=20          (contact sheet, every 20 frames)
// Frame positions derive from the film's breaks={[a, b]} and durationInFrames,
// so 360-frame and legacy 240-frame films each get true scene mids.
//
// Films that are not frozen must pass the current compliance rules, contain no
// repeated on-screen text, and ship with an upload ledger before anything renders.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkNewFilm, isDraft } from "./lib/compliance.ts";
import { isFrozen } from "./lib/frozen-films.ts";
import { readFilmId, readKnownPhotos } from "./lib/film-files.ts";
import { loadContent } from "./lib/film-content.ts";
import { findRepeats, findRepeatsIn, formatRepeats } from "./lib/repeat-scan.ts";
import { checkProbe, parseProbe } from "./lib/ffprobe.ts";
import { planFilm, visibleText } from "../src/layout.ts";

const root = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(root, "..");

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return [m?.[1] ?? a, m?.[2] ?? true];
  }),
);

const fail = (msg) => {
  console.error(`verify FAILED: ${msg}`);
  process.exit(1);
};

const film = args.film;
if (!film || typeof film !== "string" || !/^[A-Za-z0-9]+$/.test(film)) {
  fail("pass --film=CompositionId (e.g. npm run verify -- --film=DanshaFirstFilm)");
}
const kebab = film.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const filmFile = path.join(repo, "src", "finished", `${kebab}.tsx`);
if (!fs.existsSync(filmFile)) {
  fail(`no finished film at src/finished/${kebab}.tsx`);
}
const filmSource = fs.readFileSync(filmFile, "utf8");

// A data-driven film carries no geometry of its own: duration and scene breaks come
// from the same plan the renderer uses, so verify never has to guess. A film whose
// content module still has placeholders is a draft, and a draft is not renderable.
const { content, error } = await loadContent(filmSource, path.join(repo, "src", "films"));
if (error) {
  fail(`${kebab}.tsx: ${error}`);
}
if (isDraft(content)) {
  fail(`${kebab} is still a draft (fill in the TODOs in its content module, then npm run gen)`);
}
const plan = content ? planFilm(content) : null;

const compositionSource = fs.readFileSync(path.join(repo, "src", "Composition.tsx"), "utf8");
if (!compositionSource.includes(`id="${film}"`)) {
  fail(`${film} is not registered in src/Composition.tsx (run npm run gen)`);
}

const duration = plan
  ? plan.durationInFrames
  : Number(filmSource.match(/durationInFrames=\{(\d+)\}/)?.[1] ?? 0);
if (!duration) {
  fail(`${kebab}.tsx has no durationInFrames literal`);
}

// ---- Pre-flight: rules that used to be checked by eye, or not at all. --------
if (isFrozen(`${kebab}.tsx`)) {
  console.log(`pre-flight: ${kebab} is a published film (frozen) — rules not re-applied`);
} else {
  const knownPhotos = readKnownPhotos(path.join(repo, "public", "images", "credits.json"));
  const repeats = content ? findRepeatsIn(visibleText(content)) : findRepeats(filmSource);
  const problems = [
    ...checkNewFilm(filmSource, content, knownPhotos).map((v) => `[${v.rule}] ${v.detail}`),
    ...(repeats.length > 0 ? [formatRepeats(`${kebab}.tsx`, repeats)] : []),
  ];
  const filmId = readFilmId(filmSource);
  const ledger = path.join(repo, "upload", `${kebab}.md`);
  if (!filmId) {
    problems.push("declares no exported film component");
  } else if (!fs.existsSync(ledger)) {
    problems.push(`upload/${kebab}.md is missing`);
  } else if (!fs.readFileSync(ledger, "utf8").includes(filmId)) {
    problems.push(`upload/${kebab}.md does not name the film id ${filmId}`);
  }
  if (problems.length > 0) {
    console.error(`pre-flight FAILED for ${kebab}.tsx:`);
    for (const p of problems) {
      console.error(`  ${p}`);
    }
    fail("fix the rules above before rendering (see npm run check)");
  }
  console.log(`pre-flight: ${kebab} satisfies the current rules`);
}

// Scene mids, generalised past the old three-scene assumption: hero, the last
// classical scene, and the closing scene. A 4-scene film has 4 intervals, so the
// hard-coded [0, 1, 2] indexing used to sample the wrong frames.
const bounds = plan ? [0, ...plan.breaks, plan.durationInFrames] : null;
const breaks = filmSource.match(/breaks=\{\[(\d+),\s*(\d+)\]\}/);
const legacyBounds = breaks
  ? [0, Number(breaks[1]), Number(breaks[2]), duration]
  : [0, Math.round(duration / 3), Math.round((2 * duration) / 3), duration];
const sceneBounds = bounds ?? legacyBounds;
const intervals = sceneBounds.length - 1;
const midOf = (index) => Math.floor((sceneBounds[index] + sceneBounds[index + 1]) / 2);
const sampleIndices = [0, Math.max(0, intervals - 2), intervals - 1];
const mids = sampleIndices.map(midOf);
const [heroFrame, sourceFrame, closingFrame] = mids;

const run = (cmd, cmdArgs, opts = {}) => {
  const r = spawnSync(cmd, cmdArgs, {
    cwd: repo,
    encoding: "utf8",
    timeout: 600000,
    shell: process.platform === "win32",
    ...opts,
  });
  const out = (r.stdout ?? "") + (r.stderr ?? "") + (r.error ? String(r.error) : "");
  if (r.status !== 0) {
    fail(`${cmd} ${cmdArgs.join(" ")}\n${out.split("\n").slice(-15).join("\n")}`);
  }
  return out;
};

const stillsDir = path.join(repo, "out", "stills");
fs.mkdirSync(stillsDir, { recursive: true });

console.log(
  `verifying ${film} (${duration} frames, ${intervals} scene(s); stills at ${mids.join("/")})`,
);
const stills = [
  ["hero", heroFrame],
  ["source", sourceFrame],
  ["closing", closingFrame],
];
for (const [name, frame] of stills) {
  const dest = path.join(stillsDir, `${kebab}-${name}.png`);
  run("npx", ["remotion", "still", film, dest, `--frame=${frame}`, "--overwrite"]);
  console.log(`  still ${name} frame=${frame} -> out/stills/${kebab}-${name}.png`);
}
console.log("Inspect the three stills for overlap, readability, seal, and credits before shipping.");

// ---- Optional contact sheet: catches the mid-scene crowding a 3-frame sample misses.
if (args.sheet) {
  const every = typeof args.sheet === "string" ? Number(args.sheet) : 30;
  if (!Number.isFinite(every) || every <= 0) {
    fail("--sheet takes a positive frame interval, e.g. --sheet=20");
  }
  const sheetDir = path.join(stillsDir, `${kebab}-sheet`);
  fs.mkdirSync(sheetDir, { recursive: true });
  const frames = [];
  for (let f = 0; f < duration; f += every) {
    frames.push(f);
  }
  console.log(`contact sheet: ${frames.length} frames every ${every} -> out/stills/${kebab}-sheet/`);
  for (const frame of frames) {
    const dest = path.join(sheetDir, `f${String(frame).padStart(4, "0")}.png`);
    run("npx", ["remotion", "still", film, dest, `--frame=${frame}`, "--overwrite"]);
  }
}

if (args["skip-render"]) {
  console.log("skip-render: done (stills only). Refresh Remotion Studio to leave the composition previewable.");
  process.exit(0);
}

const mp4 = path.join(repo, "out", `${kebab}.mp4`);
run("npx", ["remotion", "render", film, `out/${kebab}.mp4`, "--codec=h264", "--concurrency=1", "--overwrite"]);
console.log(`  render -> out/${kebab}.mp4`);

const probe = run("npx", ["remotion", "ffprobe", `out/${kebab}.mp4`]);
const info = parseProbe(probe);
const checks = checkProbe(info, {
  width: 1080,
  height: 1920,
  fps: 30,
  durationSeconds: duration / 30,
});
let ok = true;
for (const check of checks) {
  console.log(`  ${check.passed ? "PASS" : "FAIL"} ${check.label} (${check.detail})`);
  ok = ok && check.passed;
}
if (!ok) {
  console.log(probe.split("\n").slice(-25).join("\n"));
  fail(`out/${kebab}.mp4 does not meet 1080x1920 / 30fps / H.264 / AAC / duration`);
}

let size = 0;
try {
  size = fs.statSync(mp4).size;
  console.log(`  size ${(size / 1024 / 1024).toFixed(1)} MB`);
} catch {
  fail(`expected output missing: out/${kebab}.mp4`);
}
// A 12s 1080x1920 clip lands well inside this band; outside it something went wrong
// (silent/blank render, or an accidental multi-minute export).
const MIN_BYTES = 200 * 1024;
const MAX_BYTES = 200 * 1024 * 1024;
if (size < MIN_BYTES || size > MAX_BYTES) {
  fail(`out/${kebab}.mp4 is ${size} bytes, outside the expected range`);
}
console.log(`verify OK: ${film}. Refresh Remotion Studio to leave the composition previewable.`);
