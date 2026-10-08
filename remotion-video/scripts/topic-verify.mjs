// The long-form series had no verification at all, which is where the music defect lived.
//
// `verify-film.mjs` covers `src/finished/` — the 12-to-30-second single-herb films. The
// cross-book series in `src/topics/` renders through a different composition and had nothing
// looking at its output, so a six-minute film whose 4:16 music track stopped at 4:16 shipped
// with every check green: ffprobe was never run on it, and if it had been it would have
// reported a perfectly healthy AAC stream.
//
//   npm run topic:verify                 # every topic with a rendered master
//   npm run topic:verify -- --topic=tu-que
//
// The audio bed is the check that matters here. A long film is longer than any track we
// have, so it is the one place where "the music ran out" is a live possibility.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BED_GAIN,
  BED_HEADROOM_MAX_DB,
  BED_HEADROOM_MIN_DB,
} from "../src/topic-audio.ts";
import {
  checkAudioBed,
  checkBedBalance,
  checkMixBalance,
  runCapture,
} from "./lib/audio.ts";
import { checkProbe, parseProbe } from "./lib/ffprobe.ts";

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const topicsDir = path.join(repo, "src", "topics");
const outDir = path.join(repo, "out", "topics");

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return [m?.[1] ?? a, m?.[2] ?? true];
  }),
);

/** `npx remotion ffprobe`, run the same way verify-film runs it: async, never `spawnSync`. */
const remotionCommand = (() => {
  const dir = path.join(repo, "node_modules", "@remotion", "cli");
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
  const rel = typeof pkg.bin === "string" ? pkg.bin : pkg.bin?.remotion;
  const entry = rel ? path.join(dir, rel) : null;
  if (!entry || !fs.existsSync(entry)) return null;
  return async (...cliArgs) => (await runCapture(process.execPath, [entry, ...cliArgs])).out;
})();

const topics = (typeof args.topic === "string" ? [args.topic] : fs
  .readdirSync(topicsDir)
  .filter((f) => f.endsWith(".ts") && !f.endsWith(".voice.ts"))
  .map((f) => f.replace(/\.ts$/, ""))
).sort();

let failures = 0;
for (const topic of topics) {
  // The voice module carries the duration the composition was registered with, so the
  // expected length comes from the same place the render did.
  const voicePath = path.join(topicsDir, `${topic}.voice.ts`);
  if (!fs.existsSync(voicePath)) {
    console.error(`FAIL ${topic}: no ${topic}.voice.ts — run \`npm run topic:build\``);
    failures += 1;
    continue;
  }
  const { voice } = await import(new URL(`../src/topics/${topic}.voice.ts`, import.meta.url).href);
  const { content } = await import(new URL(`../src/topics/${topic}.ts`, import.meta.url).href);
  const file = path.join(outDir, `${topic}-h.mp4`);
  if (!fs.existsSync(file)) {
    console.log(`skip ${topic}: no out/topics/${topic}-h.mp4 yet`);
    continue;
  }

  console.log(`${topic}  ${(voice.totalFrames / voice.fps).toFixed(1)}s expected`);
  const checks = remotionCommand
    ? checkProbe(parseProbe(await remotionCommand("ffprobe", `out/topics/${topic}-h.mp4`)), {
        width: 1920,
        height: 1080,
        fps: voice.fps,
        durationSeconds: voice.totalFrames / voice.fps,
      })
    : [];

  // Both audio checks run on the stems, not on the film: the mix cannot be un-mixed, so
  // "is the bed quieter than the voice" is only answerable before they are combined.
  checks.push(await checkAudioBed(file, repo));

  const voiceDir = path.join(repo, "public", "voice", voice.topic);
  const voiceFiles = fs
    .readdirSync(voiceDir)
    .filter((f) => f.endsWith(".mp3"))
    .sort()
    .map((f) => path.join(voiceDir, f));
  checks.push(
    await checkBedBalance(
      {
        music: path.join(repo, "public", content.music),
        bedGain: BED_GAIN,
        voiceFiles,
      },
      repo,
      { minHeadroom: BED_HEADROOM_MIN_DB, maxHeadroom: BED_HEADROOM_MAX_DB },
    ),
  );
  checks.push(
    await checkMixBalance(
      {
        file,
        voiceDir,
        voiceFiles: voiceFiles.map((f) => path.basename(f)),
        segmentAt: voice.segments.map((seg) => seg.startFrame / voice.fps),
      },
      repo,
      { minHeadroom: BED_HEADROOM_MIN_DB, maxHeadroom: BED_HEADROOM_MAX_DB },
    ),
  );

  let ok = true;
  for (const check of checks) {
    console.log(`  ${check.passed ? "PASS" : "FAIL"} ${check.label} (${check.detail})`);
    ok = ok && check.passed;
    // Where the silence is, not just how long it got. A film longer than its track has a
    // seam in the middle, and "is the seam audible" is a question about a timestamp.
    if (args.verbose && check.runs && check.runs.length > 0) {
      for (const run of check.runs.slice(0, 10)) {
        const m = Math.floor(run.at / 60);
        const s = (run.at % 60).toFixed(2).padStart(5, "0");
        console.log(`         silence at ${m}:${s} for ${run.length.toFixed(2)}s`);
      }
      if (check.runs.length > 10) {
        console.log(`         … and ${check.runs.length - 10} more`);
      }
    }
  }
  if (!ok) failures += 1;
}

if (failures > 0) {
  console.error(`\n${failures} topic film(s) failed.`);
  process.exit(1);
}
console.log("\ntopic films OK.");
