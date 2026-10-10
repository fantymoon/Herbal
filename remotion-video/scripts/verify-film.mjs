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
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkNewFilm, hardViolations, isDraft, isWaived } from "./lib/compliance.ts";
import { findEntries, readCorpus } from "./lib/corpus.ts";
import { factProblems, ledgerProblems, musicProblems } from "./lib/film-rules.ts";
import { isFrozen } from "./lib/frozen-films.ts";
import { readFilmId, readKnownPhotos } from "./lib/film-files.ts";
import { loadContent } from "./lib/film-content.ts";
import { publishedOn } from "./lib/ledger.ts";
import { findRepeats, findRepeatsIn, formatRepeats } from "./lib/repeat-scan.ts";
import { checkProbe, parseProbe } from "./lib/ffprobe.ts";
import { checkAudioBed } from "./lib/audio.ts";
import { planFilm, visibleText } from "../src/layout.ts";

const root = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(root, "..");

// The 经文 each entry quotes, so pre-flight can check what a film says *about* the text.
const sutras = new Map(
  findEntries(readCorpus(path.join(repo, "..", "TCM-Ancient-Books-master", "000-神农本草经.txt"))).map(
    (e) => [e.name, e.sutra],
  ),
);

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
/** Replacing a master is deliberate: without this the render goes to out/films/_verify/. */
const force = args.force === true;
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

// ---- Pre-flight: the same rules `npm run check` applies, from the same functions. -------
// A film already on a platform is not re-judged, whether it is in the 2026-09-21 snapshot
// or carries a publish date in its ledger. Otherwise a rule that tightened after the upload
// would block a re-render of a film whose live copy cannot be recalled. The date comes from
// the ledger rather than from a master sitting in `out/`: a local render is not a publication,
// and `out/` does not exist in CI.
const ledgerPath = path.join(repo, "upload", "films", `${kebab}.md`);
const ledgerCopy = fs.existsSync(ledgerPath) ? fs.readFileSync(ledgerPath, "utf8") : "";
const live = publishedOn(ledgerCopy) !== null;
if (isFrozen(`${kebab}.tsx`) || live) {
  console.log(`pre-flight: ${kebab} is already published — rules not re-applied`);
} else {
  const knownPhotos = readKnownPhotos(path.join(repo, "public", "images", "credits.json"));
  const repeats = content ? findRepeatsIn(visibleText(content)) : findRepeats(filmSource);
  const findings = checkNewFilm(filmSource, content, knownPhotos);
  // A declared budget deviation is reported and rendered, not blocked. Everything else
  // stops the render — the gate's whole value is that a rendered film is a compliant one.
  const waivers = findings.filter(isWaived);
  const filmId = readFilmId(filmSource);
  const problems = [
    ...hardViolations(findings).map((v) => `[${v.rule}] ${v.detail}`),
    ...(repeats.length > 0 ? [formatRepeats(`${kebab}.tsx`, repeats)] : []),
    ...(content ? [...factProblems(sutras, `${kebab}.tsx`, content), ...musicProblems(`${kebab}.tsx`, content)] : []),
    ...(filmId === null
      ? ["declares no exported film component"]
      : ledgerCopy === ""
        ? [`upload/films/${kebab}.md is missing`]
        : ledgerProblems(kebab, filmId, content, ledgerCopy)),
  ];
  for (const w of waivers) {
    console.log(`pre-flight: waived [${w.rule}] ${w.detail}\n            reason: ${w.waived}`);
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

/**
 * Run a child process and resolve with its combined output.
 *
 * Async `spawn`, not `spawnSync`: a render occupies the process for minutes, and the
 * synchronous form is refused outright in some sandboxes (`spawnSync <exe> EBUSY`)
 * where the async form runs — this repo is developed in one of them, so `verify` was
 * unrunnable there even though every individual Remotion command worked by hand.
 */
const run = (cmd, cmdArgs, opts = {}) =>
  new Promise((resolve) => {
    const child = spawn(cmd, cmdArgs, { cwd: repo, timeout: 600000, ...opts });
    let out = "";
    child.stdout?.on("data", (chunk) => {
      out += chunk;
    });
    child.stderr?.on("data", (chunk) => {
      out += chunk;
    });
    child.on("error", (error) => {
      fail(`${cmd} ${cmdArgs.join(" ")}\n${error}`);
    });
    child.on("close", (status) => {
      if (status !== 0) {
        fail(`${cmd} ${cmdArgs.join(" ")}\n${out.split("\n").slice(-15).join("\n")}`);
      }
      resolve(out);
    });
  });

/**
 * The Remotion CLI, run through node instead of `npx remotion`.
 *
 * `npx` needs a shell, and on Windows a shell means spawning `cmd.exe`, which fails
 * in the same locked-down environments; it also re-resolves the package on every one
 * of the 30+ stills a contact sheet renders. The CLI is already installed, so run its
 * own bin entry with the node that is running this script. `npx` stays as the
 * fallback for an unusual layout.
 */
const remotionCommand = (() => {
  const dir = path.join(repo, "node_modules", "@remotion", "cli");
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
    const rel = typeof pkg.bin === "string" ? pkg.bin : pkg.bin?.remotion;
    const entry = rel ? path.join(dir, rel) : null;
    if (entry && fs.existsSync(entry)) {
      return (...args) => run(process.execPath, [entry, ...args]);
    }
  } catch {
    // No local install to point at; fall back to npx below.
  }
  return (...args) => run("npx", ["remotion", ...args], { shell: process.platform === "win32" });
})();

const stillsDir = path.join(repo, "out", "films", "stills");
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
  await remotionCommand("still", film, dest, `--frame=${frame}`, "--overwrite");
  console.log(`  still ${name} frame=${frame} -> out/films/stills/${kebab}-${name}.png`);
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
  console.log(`contact sheet: ${frames.length} frames every ${every} -> out/films/stills/${kebab}-sheet/`);
  for (const frame of frames) {
    const dest = path.join(sheetDir, `f${String(frame).padStart(4, "0")}.png`);
    await remotionCommand("still", film, dest, `--frame=${frame}`, "--overwrite");
  }
}

if (args["skip-render"]) {
  console.log("skip-render: done (stills only). Refresh Remotion Studio to leave the composition previewable.");
  process.exit(0);
}

// A master that already exists is not overwritten by a verification run.
//
// It used to be, and that is how a rule as simple as "do not touch a rendered film" turned
// out to be unenforceable with this tooling: verifying a change to a film re-rendered that
// film, so the one command for checking your work was also the command that invalidated it.
// Render to a scratch path instead and say where it went; `--force` is the deliberate way to
// replace a master.
const master = path.join(repo, "out", "films", `${kebab}.mp4`);
const replacing = force || !fs.existsSync(master);
const target = replacing ? `out/films/${kebab}.mp4` : `out/films/_verify/${kebab}.mp4`;
if (!replacing) {
  fs.mkdirSync(path.join(repo, "out", "films", "_verify"), { recursive: true });
  console.log(
    `  a master already exists at out/films/${kebab}.mp4 — rendering to ${target} instead, pass --force to replace it`,
  );
}
await remotionCommand("render", film, target, "--codec=h264", "--concurrency=1", "--timeout=180000", "--overwrite");
console.log(`  render -> ${target}`);

const probe = await remotionCommand("ffprobe", target);
const info = parseProbe(probe);
const checks = checkProbe(info, {
  width: 1080,
  height: 1920,
  fps: 30,
  durationSeconds: duration / 30,
});
// ffprobe reports the stream, not the samples. A film whose music stops halfway has a
// perfectly healthy AAC stream — that is how `out/topics/tu-que-h.mp4` passed every check while
// playing its last 1:46 against digital silence. So the samples get read too.
checks.push(await checkAudioBed(target, repo));
let ok = true;
for (const check of checks) {
  console.log(`  ${check.passed ? "PASS" : "FAIL"} ${check.label} (${check.detail})`);
  ok = ok && check.passed;
}
if (!ok) {
  console.log(probe.split("\n").slice(-25).join("\n"));
  fail(`${target} does not meet 1080x1920 / 30fps / H.264 / AAC / duration`);
}

let size = 0;
try {
  size = fs.statSync(target).size;
  console.log(`  size ${(size / 1024 / 1024).toFixed(1)} MB`);
} catch {
  fail(`expected output missing: ${target}`);
}
// A 12s 1080x1920 clip lands well inside this band; outside it something went wrong
// (silent/blank render, or an accidental multi-minute export).
const MIN_BYTES = 200 * 1024;
const MAX_BYTES = 200 * 1024 * 1024;
if (size < MIN_BYTES || size > MAX_BYTES) {
  fail(`${target} is ${size} bytes, outside the expected range`);
}
console.log(`verify OK: ${film}. Refresh Remotion Studio to leave the composition previewable.`);
