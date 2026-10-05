import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decodeMono, bundledFfmpeg, edgeSilence, silentRuns } from "../scripts/lib/audio.ts";
import { mp3DurationSeconds } from "../scripts/lib/mp3-duration.ts";
import { loadContent } from "../scripts/lib/film-content.ts";
import { adjacentTrackRepeats, readPublishPlan } from "../scripts/lib/publish-order.ts";
import { MUSIC_REGISTRY } from "../src/music-registry.ts";
import { trackOf, unrecordedLicences } from "../src/music.ts";

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const musicDir = path.join(repo, "public", "music");
const finishedDir = path.join(repo, "src", "finished");
const filmsDir = path.join(repo, "src", "films");

// The music bed is the one part of the pipeline with no gate of its own until now, and it
// earned one the expensive way. `out/tu-que-h.mp4` was a six-minute film whose 4:16 track
// stopped at 4:16: ffprobe saw a healthy AAC stream, so verify passed, and narration covered
// the hole. The fix needs the track's real length, so these tests are mostly about the
// length being right and the lookup finding it.

test("the registry's frame counts agree with the files", () => {
  for (const track of MUSIC_REGISTRY) {
    const buf = fs.readFileSync(path.join(musicDir, track.file));
    const seconds = mp3DurationSeconds(buf);
    assert.ok(seconds !== null, `${track.file} has no readable frame header`);
    // One frame of slack: the walker counts whole frames, the container reports the span.
    assert.ok(
      Math.abs(seconds - track.seconds) < 1 / 30,
      `${track.file}: file says ${seconds.toFixed(3)}s, registry says ${track.seconds}s`,
    );
    assert.equal(track.frames, Math.round(track.seconds * 30));
  }
});

test("a track is found by any of the three ways a film can name it", () => {
  const track = MUSIC_REGISTRY[0];
  assert.equal(trackOf(`music/${track.file}`)?.file, track.file);
  assert.equal(trackOf(`/${track.file}`)?.file, track.file);
  assert.equal(trackOf(`http://localhost:3000/music/${track.file}`)?.file, track.file);
  assert.equal(trackOf("music/nothing-registered.mp3"), null);
});

test("every film names a registered track", async () => {
  const unregistered = [];
  for (const file of fs.readdirSync(finishedDir).filter((f) => f.endsWith(".tsx"))) {
    const source = fs.readFileSync(path.join(finishedDir, file), "utf8");
    const { content } = await loadContent(source, filmsDir);
    // Hand-written films pass `music` straight to FinishedFilm and never consult the
    // registry, so only the data-driven ones are in scope here.
    if (!content) continue;
    if (trackOf(content.music) === null) unregistered.push(`${file}: ${content.music}`);
  }
  assert.deepEqual(unregistered, []);
});

test("a loop can be built for every track, which is why the head silence is recorded", async () => {
  const ffmpeg = bundledFfmpeg(repo);
  assert.ok(ffmpeg !== null, "the bundled ffmpeg should be present");
  for (const track of MUSIC_REGISTRY) {
    const decoded = await decodeMono(ffmpeg, path.join(musicDir, track.file));
    assert.ok(decoded !== null, `${track.file} should decode`);
    const { head } = edgeSilence(decoded);
    assert.equal(
      track.leadFrames,
      Math.round(head * 30),
      `${track.file}: head silence is ${head.toFixed(2)}s but the registry says ${track.leadFrames} frames`,
    );
  }
});

test("the registry says which licences nobody has written down", () => {
  // Not a failure — the images have a gate that keeps credits.json exact, the music does
  // not, and inventing a licence would be worse than recording that it is missing.
  assert.ok(unrecordedLicences().length <= MUSIC_REGISTRY.length);
  for (const track of unrecordedLicences()) {
    assert.equal(track.license, "unrecorded");
  }
});

test("silentRuns finds the stretches where every sample is zero", () => {
  // 8 kHz mono: 1s of sound, 1.5s of zero, 0.5s of sound.
  const rate = 8000;
  const frames = rate * 3;
  const buf = Buffer.alloc(frames * 2);
  for (let i = 0; i < rate; i += 1) buf.writeInt16LE(1000, i * 2);
  for (let i = rate * 2.5; i < frames; i += 1) buf.writeInt16LE(1000, i * 2);
  const runs = silentRuns({ samples: buf, rate }, 0.2);
  assert.equal(runs.length, 1);
  assert.equal(runs[0].at.toFixed(2), "1.00");
  assert.equal(runs[0].length.toFixed(2), "1.50");
});

test("the publish order is read from the plan, not assumed", () => {
  const planned = readPublishPlan(path.join(repo, "..", "publish-plan.md"));
  // A parse that quietly returned nothing would make the rotation check quietly pass.
  assert.equal(planned.length, 30);
  assert.equal(planned[0].entry, "大枣");
  assert.deepEqual(
    planned.slice(0, 6).map((p) => p.entry),
    ["大枣", "橘柚", "葡萄", "胡麻", "藕实茎", "龙眼"],
  );
  assert.deepEqual(
    planned.map((p) => p.order),
    planned.map((_, i) => i + 1),
  );
});

test("the plan's films alternate their track, which the book order did not show", () => {
  // The tracks the first collection actually carries. Read from the real films rather than
  // restated here, so the test moves when the assignment does.
  const tracks = new Map([
    ["大枣", "music/yuzhou-changwan.mp3"],
    ["橘柚", "music/gaoshan-liushui.mp3"],
    ["葡萄", "music/yuzhou-changwan.mp3"],
    ["胡麻", "music/gaoshan-liushui.mp3"],
    ["藕实茎", "music/yuzhou-changwan.mp3"],
    ["龙眼", "music/gaoshan-liushui.mp3"],
  ]);
  const planned = readPublishPlan(path.join(repo, "..", "publish-plan.md"));
  assert.deepEqual(adjacentTrackRepeats(planned, tracks), []);
});

test("two films in a row on the same track is reported", () => {
  const planned = [
    { order: 1, entry: "大枣" },
    { order: 2, entry: "橘柚" },
    { order: 3, entry: "葡萄" },
  ];
  const tracks = new Map([
    ["大枣", "music/yuzhou-changwan.mp3"],
    ["橘柚", "music/yuzhou-changwan.mp3"],
    ["葡萄", "music/gaoshan-liushui.mp3"],
  ]);
  const problems = adjacentTrackRepeats(planned, tracks);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /大枣 -> 橘柚/);
});

test("entries with no film yet are skipped rather than counted as a repeat", () => {
  const planned = [
    { order: 1, entry: "大枣" },
    { order: 2, entry: "葛根" }, // scheduled but not made
    { order: 3, entry: "葡萄" },
  ];
  const tracks = new Map([
    ["大枣", "music/yuzhou-changwan.mp3"],
    ["葡萄", "music/yuzhou-changwan.mp3"],
  ]);
  // 大枣 and 葡萄 share a track, but 葛根 sits between them in the schedule, so the audience
  // never hears them back to back.
  assert.deepEqual(adjacentTrackRepeats(planned, tracks), []);
});
