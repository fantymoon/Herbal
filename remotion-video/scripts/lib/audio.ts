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

const toDb = (linear: number): number => (linear > 0 ? 20 * Math.log10(linear) : -200);

/**
 * Why a bed is too loud, stated with the sign it actually has. A negative headroom means the
 * bed is *above* the voice, which is the failure that was shipped; phrased as "only -8.4 dB
 * under" it reads as a rounding problem rather than as the bed drowning the narration.
 */
const whyTooLoud = (headroom: number, voiceDb: number, bedDb: number): string =>
  headroom < 0
    ? `bed peak ${bedDb.toFixed(1)} dBFS is ${Math.abs(headroom).toFixed(1)} dB ABOVE the voice at ${voiceDb.toFixed(1)} — the bed crosses the narration`
    : `bed peak ${bedDb.toFixed(1)} dBFS is only ${headroom.toFixed(1)} dB under the voice at ${voiceDb.toFixed(1)} — the bed sits too close to it`;

/** Average and loudest sample of a decoded track, in linear units. */
const levels = (decoded: Decoded): { rms: number; peak: number } => {
  let sq = 0;
  let peak = 0;
  let n = 0;
  for (let i = 0; i + 1 < decoded.samples.length; i += 2) {
    const v = decoded.samples.readInt16LE(i) / 32768;
    sq += v * v;
    n += 1;
    if (Math.abs(v) > peak) peak = Math.abs(v);
  }
  return { rms: Math.sqrt(sq / n), peak };
};

/**
 * The level the voice is actually *spoken* at — 50 ms frames, keeping only the ones above
 * -45 dBFS.
 *
 * The ungated average is the wrong reference and it is wrong in the direction that hides the
 * defect: 72% of the narration is speech and the rest is the ~0.67 s the synthesizer leaves
 * between sentences, so averaging over everything pulls the reference down by 1.4 dB and
 * makes a too-loud bed look better than it sounds. What masks a voice is the level of the
 * voice while it is talking.
 */
const SPEECH_GATE_DB = -45;
const SPEECH_FRAME = 400; // 50 ms at the 8 kHz this module decodes to

const speechLevel = (decoded: Decoded): number => {
  const count = decoded.samples.length / 2;
  let sq = 0;
  let n = 0;
  for (let at = 0; at + SPEECH_FRAME <= count; at += SPEECH_FRAME) {
    let fsq = 0;
    for (let i = at; i < at + SPEECH_FRAME; i += 1) {
      const v = decoded.samples.readInt16LE(i * 2) / 32768;
      fsq += v * v;
    }
    const frameRms = Math.sqrt(fsq / SPEECH_FRAME);
    if (toDb(frameRms) > SPEECH_GATE_DB) {
      sq += fsq;
      n += SPEECH_FRAME;
    }
  }
  return n === 0 ? 0 : Math.sqrt(sq / n);
};

/**
 * Stretches of near-silence in a decoded track, as `[from, to]` seconds.
 *
 * Frame RMS against a threshold rather than `silentRuns`' exact-zero test: a synthesised
 * voice does not pause on digital silence, and a threshold of "every sample is 0" finds
 * nothing in these files at all.
 */
export const quietRuns = (
  decoded: Decoded,
  {
    thresholdDb = -45,
    frame = 400,
    minLength = 0.3,
  }: { thresholdDb?: number; frame?: number; minLength?: number } = {},
): [number, number][] => {
  const count = decoded.samples.length / 2;
  const out: [number, number][] = [];
  let start = -1;
  let length = 0;
  const flush = () => {
    if (length >= minLength) out.push([start, start + length]);
    start = -1;
    length = 0;
  };
  for (let at = 0; at + frame <= count; at += frame) {
    let fsq = 0;
    for (let i = at; i < at + frame; i += 1) {
      const v = decoded.samples.readInt16LE(i * 2) / 32768;
      fsq += v * v;
    }
    if (toDb(Math.sqrt(fsq / frame)) < thresholdDb) {
      if (start < 0) start = at / decoded.rate;
      length += frame / decoded.rate;
    } else {
      flush();
    }
  }
  flush();
  return out;
};

/**
 * Where, in the finished film, the narration is silent — which is the only place the bed can
 * be heard on its own.
 *
 * Derived from the stems, not from the cue list. It has to be: edge-tts emits back-to-back
 * cues with a measured inter-cue gap of exactly 0.000 s, so a cue list says the voice never
 * stops, while the audio pauses for ~0.67 s between sentences. Reading the timings from the
 * subtitles therefore finds zero pauses and silently measures nothing.
 *
 * `inset` trims both ends of each run so the last syllable's decay and the next word's onset
 * do not leak into the bed measurement.
 */
export const bedWindows = async (
  ffmpeg: string,
  voiceDir: string,
  files: readonly string[],
  segmentAt: readonly number[],
  { inset = 0.1, minLength = 0.3 }: { inset?: number; minLength?: number } = {},
): Promise<[number, number][]> => {
  const windows: [number, number][] = [];
  for (let i = 0; i < files.length; i += 1) {
    const decoded = await decodeMono(ffmpeg, files[i]!);
    if (!decoded) continue;
    const at = segmentAt[i] ?? 0;
    for (const [from, to] of quietRuns(decoded, { minLength: minLength + inset * 2 })) {
      if (to - from > minLength + inset * 2) {
        windows.push([at + from + inset, at + to - inset]);
      }
    }
  }
  return windows;
};

export type MixBalance = {
  passed: boolean;
  label: string;
  detail: string;
  /** The loudest sample the master reaches while the narration is silent: the bed alone. */
  bedPeakDb: number;
  bedRmsDb: number;
  /** The master's level while the narration is speaking. */
  voiceRmsDb: number;
  headroomDb: number;
  seconds: { pause: number; speech: number };
};

/**
 * The same question as `checkBedBalance`, answered from the rendered film instead of from
 * the stems.
 *
 * Why both exist: the stem check decides the number and catches a bad value the moment it
 * is typed, but it reads a constant, and a constant is not a film. This one reads the
 * delivered master, so it is the check that would have caught the day the render silently
 * reused a cached bundle and shipped the previous level — the stem check stayed green that
 * day, and so did every other check, because all of them were looking at source.
 */
export const checkMixBalance = async (
  {
    file,
    voiceDir,
    voiceFiles,
    segmentAt,
  }: {
    file: string;
    voiceDir: string;
    voiceFiles: readonly string[];
    /** Film time, in seconds, at which each narration segment begins. */
    segmentAt: readonly number[];
  },
  repo: string,
  { minHeadroom = 4, maxHeadroom = 25 }: { minHeadroom?: number; maxHeadroom?: number } = {},
): Promise<MixBalance> => {
  const label = "music bed sits under the narration (in the master)";
  const ffmpeg = bundledFfmpeg(repo);
  const empty: MixBalance = {
    passed: false,
    label,
    detail: "",
    bedPeakDb: 0,
    bedRmsDb: 0,
    voiceRmsDb: 0,
    headroomDb: 0,
    seconds: { pause: 0, speech: 0 },
  };

  if (!ffmpeg) return { ...empty, detail: "no bundled ffmpeg to decode with" };
  const pauses = await bedWindows(
    ffmpeg,
    voiceDir,
    voiceFiles.map((f) => path.join(voiceDir, f)),
    segmentAt,
  );
  if (pauses.length === 0) {
    return {
      ...empty,
      detail: "no pause in the narration long enough to hear the bed alone",
    };
  }

  const decoded = await decodeMono(ffmpeg, file);
  if (!decoded) return { ...empty, detail: `${file} could not be decoded` };

  // One mask over the whole film, so every sample is classified exactly once and the two
  // measurements partition the master rather than sampling it.
  const total = decoded.samples.length / 2;
  const isPause = new Uint8Array(total);
  for (const [from, to] of pauses) {
    const a = Math.max(0, Math.floor(from * decoded.rate));
    const b = Math.min(total, Math.floor(to * decoded.rate));
    for (let i = a; i < b; i += 1) isPause[i] = 1;
  }

  let bedSq = 0;
  let bedPeak = 0;
  let bedN = 0;
  let voiceSq = 0;
  let voiceN = 0;
  for (let i = 0; i < total; i += 1) {
    const v = decoded.samples.readInt16LE(i * 2) / 32768;
    const a = Math.abs(v);
    if (isPause[i]) {
      bedSq += v * v;
      bedN += 1;
      if (a > bedPeak) bedPeak = a;
    } else {
      voiceSq += v * v;
      voiceN += 1;
    }
  }
  if (bedN === 0 || voiceN === 0) {
    return { ...empty, detail: "the pause/speech split produced an empty half" };
  }

  const bedPeakDb = toDb(bedPeak);
  const bedRmsDb = toDb(Math.sqrt(bedSq / bedN));
  // The speech half contains the bed too, but at a level far enough below it that the
  // contamination is a fraction of a decibel — which is the point of the check.
  const voiceRmsDb = toDb(Math.sqrt(voiceSq / voiceN));
  const headroomDb = voiceRmsDb - bedPeakDb;

  const passed = headroomDb >= minHeadroom && headroomDb <= maxHeadroom;
  return {
    passed,
    label,
    detail: passed
      ? `bed peak ${bedPeakDb.toFixed(1)} dBFS is ${headroomDb.toFixed(1)} dB under the voice at ${voiceRmsDb.toFixed(1)}`
      : headroomDb < minHeadroom
        ? whyTooLoud(headroomDb, voiceRmsDb, bedPeakDb)
        : `bed peak ${bedPeakDb.toFixed(1)} dBFS is ${headroomDb.toFixed(1)} dB under the voice — too far down to hear`,
    bedPeakDb,
    bedRmsDb,
    voiceRmsDb,
    headroomDb,
    seconds: { pause: bedN / decoded.rate, speech: voiceN / decoded.rate },
  };
};

export type BedBalance = {
  passed: boolean;
  label: string;
  detail: string;
  /** The bed's loudest moment after the gain, in dBFS. */
  bedPeakDb: number;
  /** The bed's average after the gain, in dBFS. */
  bedRmsDb: number;
  /** The level the narration is spoken at, in dBFS. */
  voiceSpeechDb: number;
  /** voiceSpeechDb − bedPeakDb. Positive means the voice wins. */
  headroomDb: number;
};

/**
 * Is the music bed sitting under the narration, or on top of it.
 *
 * `checkAudioBed` asks whether the bed is *there*. This asks whether it is *out of the way*,
 * which is a separate question and the one that shipped wrong: the first cut of the series
 * had a bed present for every second of six minutes and still read green, because "present"
 * and "competing" are not the same thing and nothing was measuring the second.
 *
 * The judgement is on the bed's **peak**, not its average. Our tracks run to 15.9 LU of
 * internal dynamics, so an average tells you almost nothing about the plucked passage that
 * actually swallows a sentence — which is why the complaint was about specific moments
 * rather than about the film overall.
 */
export const checkBedBalance = async (
  {
    music,
    bedGain,
    voiceFiles,
  }: { music: string; bedGain: number; voiceFiles: readonly string[] },
  repo: string,
  { minHeadroom = 4, maxHeadroom = 25 }: { minHeadroom?: number; maxHeadroom?: number } = {},
): Promise<BedBalance> => {
  const label = "music bed sits under the narration";
  const ffmpeg = bundledFfmpeg(repo);
  const fail = (detail: string): BedBalance => ({
    passed: false,
    label,
    detail,
    bedPeakDb: 0,
    bedRmsDb: 0,
    voiceSpeechDb: 0,
    headroomDb: 0,
  });

  if (!ffmpeg) return fail("no bundled ffmpeg to decode with");
  const track = await decodeMono(ffmpeg, music);
  if (!track) return fail(`${music} could not be decoded`);

  let voiceSq = 0;
  let voiceFrames = 0;
  let decodedAny = false;
  for (const file of voiceFiles) {
    const d = await decodeMono(ffmpeg, file);
    if (!d) continue;
    decodedAny = true;
    const level = speechLevel(d);
    const frames = Math.floor(d.samples.length / 2 / SPEECH_FRAME) * SPEECH_FRAME;
    voiceSq += level * level * frames;
    voiceFrames += frames;
  }
  if (!decodedAny) return fail("no narration could be decoded");

  const gainDb = toDb(bedGain);
  const { rms, peak } = levels(track);
  const bedPeakDb = toDb(peak) + gainDb;
  const bedRmsDb = toDb(rms) + gainDb;
  const voiceSpeechDb = toDb(Math.sqrt(voiceSq / voiceFrames));
  const headroomDb = voiceSpeechDb - bedPeakDb;

  const passed = headroomDb >= minHeadroom && headroomDb <= maxHeadroom;
  return {
    passed,
    label,
    detail: passed
      ? `bed peak ${bedPeakDb.toFixed(1)} dBFS is ${headroomDb.toFixed(1)} dB under the voice at ${voiceSpeechDb.toFixed(1)}`
      : headroomDb < minHeadroom
        ? whyTooLoud(headroomDb, voiceSpeechDb, bedPeakDb)
        : `bed peak ${bedPeakDb.toFixed(1)} dBFS is ${headroomDb.toFixed(1)} dB under the voice — too far down to hear`,
    bedPeakDb,
    bedRmsDb,
    voiceSpeechDb,
    headroomDb,
  };
};
