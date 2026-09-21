// Parsing and validation for `npx remotion ffprobe` output.
//
// Extracted from scripts/verify-film.mjs so the checks can be unit-tested with a
// recorded ffprobe sample instead of only being exercised by a full render.

export type ProbeInfo = {
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  videoCodec: string | null;
  audioCodec: string | null;
  bitrateKbps: number | null;
};

export type ProbeExpectation = {
  width: number;
  height: number;
  fps: number;
  durationSeconds: number;
};

export type ProbeCheck = { label: string; passed: boolean; detail: string };

/** Duration tolerance: encoders round to the frame, so allow half a second. */
const DURATION_TOLERANCE_SECONDS = 0.5;

export const parseProbe = (output: string): ProbeInfo => {
  const duration = output.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  const video = output.match(/Video:\s*(\w+)[^\n]*?(\d{3,4})x(\d{3,4})/);
  const fps = output.match(/([\d.]+)\s*fps/);
  const audio = output.match(/Audio:\s*(\w+)/);
  const bitrate = output.match(/bitrate:\s*(\d+)\s*kb\/s/);

  return {
    durationSeconds: duration
      ? Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3])
      : null,
    width: video ? Number(video[2]) : null,
    height: video ? Number(video[3]) : null,
    fps: fps ? Number(fps[1]) : null,
    videoCodec: video ? video[1] : null,
    audioCodec: audio ? audio[1] : null,
    bitrateKbps: bitrate ? Number(bitrate[1]) : null,
  };
};

export const checkProbe = (info: ProbeInfo, expected: ProbeExpectation): ProbeCheck[] => {
  const checks: ProbeCheck[] = [];
  const push = (label: string, passed: boolean, detail: string) =>
    checks.push({ label, passed, detail });

  push(
    `${expected.width}x${expected.height}`,
    info.width === expected.width && info.height === expected.height,
    `got ${info.width ?? "?"}x${info.height ?? "?"}`,
  );
  push(`${expected.fps} fps`, info.fps === expected.fps, `got ${info.fps ?? "?"} fps`);
  push("H.264 video", info.videoCodec === "h264", `got ${info.videoCodec ?? "none"}`);
  push("AAC audio", info.audioCodec === "aac", `got ${info.audioCodec ?? "none"}`);

  if (info.durationSeconds === null) {
    push("duration matches the composition", false, "no Duration reported");
  } else {
    const delta = Math.abs(info.durationSeconds - expected.durationSeconds);
    push(
      "duration matches the composition",
      delta <= DURATION_TOLERANCE_SECONDS,
      `got ${info.durationSeconds.toFixed(2)}s, expected ${expected.durationSeconds.toFixed(2)}s`,
    );
  }

  return checks;
};
