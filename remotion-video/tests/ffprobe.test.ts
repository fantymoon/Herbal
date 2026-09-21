import test from "node:test";
import assert from "node:assert/strict";
import { checkProbe, parseProbe } from "../scripts/lib/ffprobe.ts";

// Recorded shape of `npx remotion ffprobe out/<film>.mp4` for a 360-frame film.
const sample = `Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'out/dansha-first-film.mp4':
  Metadata:
    major_brand     : isom
    encoder         : Lavf61.7.100
  Duration: 00:00:12.00, start: 0.000000, bitrate: 2318 kb/s
  Stream #0:0[0x1](und): Video: h264 (High) (avc1 / 0x31637661), yuv420p(progressive), 1080x1920, 2183 kb/s, 30 fps, 30 tbr, 15360 tbn
  Stream #0:1[0x2](und): Audio: aac (LC) (mp4a / 0x6134706D), 44100 Hz, stereo, fltp, 128 kb/s
`;

test("parseProbe reads the container facts out of ffprobe output", () => {
  const info = parseProbe(sample);
  assert.equal(info.width, 1080);
  assert.equal(info.height, 1920);
  assert.equal(info.fps, 30);
  assert.equal(info.videoCodec, "h264");
  assert.equal(info.audioCodec, "aac");
  assert.equal(info.durationSeconds, 12);
  assert.equal(info.bitrateKbps, 2318);
});

test("checkProbe passes a film that meets the spec", () => {
  const checks = checkProbe(parseProbe(sample), {
    width: 1080,
    height: 1920,
    fps: 30,
    durationSeconds: 12,
  });
  assert.deepEqual(
    checks.filter((c) => !c.passed).map((c) => c.label),
    [],
  );
});

test("checkProbe catches a duration that does not match the composition", () => {
  const short = sample.replace("00:00:12.00", "00:00:09.50");
  const checks = checkProbe(parseProbe(short), {
    width: 1080,
    height: 1920,
    fps: 30,
    durationSeconds: 12,
  });
  const failed = checks.filter((c) => !c.passed).map((c) => c.label);
  assert.deepEqual(failed, ["duration matches the composition"]);
});

test("checkProbe catches a missing audio stream", () => {
  const silent = sample
    .split("\n")
    .filter((line) => !line.includes("Audio:"))
    .join("\n");
  const checks = checkProbe(parseProbe(silent), {
    width: 1080,
    height: 1920,
    fps: 30,
    durationSeconds: 12,
  });
  assert.ok(checks.some((c) => c.label === "AAC audio" && !c.passed));
});

test("checkProbe catches a wrong aspect ratio", () => {
  const wide = sample.replace("1080x1920", "1280x720");
  const checks = checkProbe(parseProbe(wide), {
    width: 1080,
    height: 1920,
    fps: 30,
    durationSeconds: 12,
  });
  assert.ok(checks.some((c) => c.label === "1080x1920" && !c.passed));
});
