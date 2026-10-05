// Reading a track's or a film's audio as samples, not as a stream list.
//
// ffprobe was happy with the defective master. It reported a healthy AAC stream at 317 kb/s
// for a six-minute film whose music is 4:16 long — because the failure was in the *samples*,
// not in the stream. Narration covered most of it, so review missed it too; the pauses
// between sentences played against true digital silence.
//
// The bundled ffmpeg is a stripped build with `silencedetect` and almost nothing else, so it
// is not asked to judge. It is asked to hand over raw PCM and the judging happens here: one
// rule, stated once, easy to change.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const SAMPLE_RATE = 8000;

export type Decoded = { samples: Buffer; rate: number };
export type SilentRun = { at: number; length: number };

export type BedCheck = {
  passed: boolean;
  label: string;
  detail: string;
  runs: SilentRun[];
  seconds: number;
};

/**
 * Run a command and collect its output.
 *
 * Asynchronous on purpose. The synchronous forms (`execFileSync`, `spawnSync`) are refused
 * outright in some sandboxes with `EBUSY` while the asynchronous form runs fine — the same
 * trap `verify-film.mjs` documents at its own `run` helper, and the reason a first attempt
 * at this file decoded nothing at all. A refused spawn here would look like "no audio",
 * which is exactly the wrong conclusion to draw from a sandbox quirk.
 */
export const runCapture = (
  cmd: string,
  cmdArgs: readonly string[],
): Promise<{ ok: boolean; out: string }> =>
  new Promise((resolve) => {
    const child = spawn(cmd, [...cmdArgs], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    child.stdout?.on("data", (chunk: Buffer) => {
      out += chunk.toString();
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      out += chunk.toString();
    });
    child.on("error", () => resolve({ ok: false, out }));
    child.on("close", (status) => resolve({ ok: status === 0, out }));
  });

/** The bundled ffmpeg, whichever platform's compositor package is installed. */
export const bundledFfmpeg = (repo: string): string | null => {
  const dir = path.join(repo, "node_modules", "@remotion");
  if (!fs.existsSync(dir)) return null;
  for (const pkg of fs.readdirSync(dir)) {
    if (!pkg.startsWith("compositor")) continue;
    for (const name of ["ffmpeg.exe", "ffmpeg"]) {
      const candidate = path.join(dir, pkg, name);
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return null;
};

/** Decode anything ffmpeg can read to mono 16-bit PCM, or null if it cannot. */
export const decodeMono = async (ffmpeg: string, file: string): Promise<Decoded | null> => {
  const wav = path.join(
    path.dirname(file),
    `.${path.basename(file, path.extname(file))}-${process.pid}.probe.wav`,
  );
  try {
    const { ok } = await runCapture(ffmpeg, [
      "-hide_banner",
      "-nostdin",
      "-y",
      "-i",
      file,
      "-vn",
      "-ac",
      "1",
      "-ar",
      String(SAMPLE_RATE),
      "-f",
      "wav",
      wav,
    ]);
    if (!ok || !fs.existsSync(wav)) return null;
    const buf = fs.readFileSync(wav);
    let at = 12;
    while (at + 8 <= buf.length) {
      const id = buf.toString("ascii", at, at + 4);
      const size = buf.readUInt32LE(at + 4);
      if (id === "data") {
        return { samples: buf.subarray(at + 8, at + 8 + size), rate: SAMPLE_RATE };
      }
      at += 8 + size + (size % 2);
    }
    return null;
  } catch {
    return null;
  } finally {
    if (fs.existsSync(wav)) fs.unlinkSync(wav);
  }
};

/**
 * Every stretch of true digital silence, as `{ at, length }` in seconds.
 *
 * "True" is meant literally: every sample zero. A quiet bed is not silence, and the gap
 * between the two is the whole point — the defect measured -180 dBFS, a floor no bed can
 * reach at any volume, only by nothing at all.
 */
export const silentRuns = (decoded: Decoded, minLength = 0.2): SilentRun[] => {
  const { samples, rate } = decoded;
  const runs: SilentRun[] = [];
  let start = -1;
  let run = 0;
  const flush = () => {
    if (run / rate >= minLength) runs.push({ at: start, length: run / rate });
    start = -1;
    run = 0;
  };
  for (let i = 0; i + 1 < samples.length; i += 2) {
    if (samples.readInt16LE(i) === 0) {
      if (start < 0) start = i / 2 / rate;
      run += 1;
    } else {
      flush();
    }
  }
  flush();
  return runs;
};

/** How much silence a track opens and closes on. `sync-music` records the head. */
export const edgeSilence = (decoded: Decoded): { head: number; tail: number } => {
  const runs = silentRuns(decoded, 0.05);
  const head = runs.find((run) => run.at === 0)?.length ?? 0;
  const total = decoded.samples.length / 2 / decoded.rate;
  const last = runs[runs.length - 1];
  const tail = last && Math.abs(last.at + last.length - total) < 0.05 ? last.length : 0;
  return { head, tail };
};

/**
 * The check, in the shape `verify-film.mjs` already prints.
 *
 * The head is skipped because a track may legitimately open on silence — `yuzhou-changwan.mp3`
 * spends its first 0.96s there — and a film inherits that. What a film may not do is lose its
 * bed once it has started. One second is about where a pause stops reading as a pause and
 * starts reading as a dropout.
 */
export const checkAudioBed = async (
  file: string,
  repo: string,
  { limitSeconds = 1, after = 2 }: { limitSeconds?: number; after?: number } = {},
): Promise<BedCheck> => {
  const label = "audio bed survives the film";
  const ffmpeg = bundledFfmpeg(repo);
  if (!ffmpeg) {
    return {
      passed: false,
      label,
      detail: "no bundled ffmpeg to decode with",
      runs: [],
      seconds: 0,
    };
  }
  const decoded = await decodeMono(ffmpeg, file);
  if (!decoded) {
    return { passed: false, label, detail: `${file} could not be decoded`, runs: [], seconds: 0 };
  }
  const runs = silentRuns(decoded, 0.2).filter((run) => run.at >= after);
  const silence = runs.reduce((longest, run) => Math.max(longest, run.length), 0);
  return {
    passed: silence < limitSeconds,
    label,
    detail:
      silence < limitSeconds
        ? `longest silence after ${after}s is ${silence.toFixed(2)}s`
        : `longest silence after ${after}s is ${silence.toFixed(2)}s — the music ran out before the film did`,
    runs,
    seconds: decoded.samples.length / 2 / decoded.rate,
  };
};
