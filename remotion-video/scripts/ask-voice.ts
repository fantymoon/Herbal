// 把词级配音产物编译成渲染器可以直接 import 的静态数据。
//
// 与跨书专题系列同一个理由：Remotion 的组件必须是纯函数，不能运行时读文件，
// 而这一系列的时间基准是旁白（每段的实际秒数），不是字数。所以构建期把
//   .ask-work/<id>/seg-NN.mp3   每段音频
//   .ask-work/<id>/seg-NN.json  edge-tts 的 WordBoundary 词级边界
// 编译成 `src/asks/<id>.voice.ts`。
//
// **为什么要逐字时间而不是逐句**：这一系列最不一样的一屏是「书」——
// 竖排原文上一个字一个字地朱红过去，读到哪个字哪个字亮。句级对齐做不到这件事，
// 只能整句一起亮；所以 tts_words.py 直接消费 WordBoundary，这里再把它摊平成
// `charTimes`：第 i 个汉字在何时被读出来。摊平放在构建期做，组件那边就只剩查表。
//
//   node --experimental-strip-types scripts/ask-voice.ts [--id=<id>] [--force]
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { spokenChars, type AskContent } from "../src/asks/types.ts";

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const idArg = args.find((a) => a.startsWith("--id="));
const force = args.includes("--force");

/** 固定的说书人声线。换声线等于换这一系列的人格，所以它在这里，不在每集的 YAML 里。 */
const VOICE = process.env.ASK_VOICE ?? "zh-CN-YunjianNeural";

/**
 * venv 里的 python。edge-tts 装在隔离环境里，而那个环境的 python 曾经失效过
 * （venv 指向一个被清理掉的符号链接，合成"成功"但产物为空）——所以这里只负责
 * 找到解释器，产物是否为空由 tts_words.py 自己判断并报错。
 */
const PYTHON =
  process.env.ASK_PYTHON ??
  (process.platform === "win32"
    ? path.join(os.homedir(), ".workbuddy-ai", "binaries", "python", "envs", "default", "Scripts", "python.exe")
    : "python3");

/** 每段尾部留出的呼吸帧数：旁白之间没有停顿，换屏会读成卡顿。也是墨晕转场的时间。 */
const TAIL_FRAMES = 12;
const FPS = 30;

const ids = fs
  .readdirSync(path.join(repo, "asks"))
  .filter((f) => f.endsWith(".yaml"))
  .map((f) => f.replace(/\.yaml$/, ""))
  .filter((id) => (idArg ? id === idArg.slice("--id=".length) : true))
  .sort();

if (ids.length === 0) {
  console.error(idArg ? `no such episode: ${idArg}` : "no episodes under asks/");
  process.exit(2);
}

/** 异步 spawn：这个沙箱里同步形式（execFileSync / spawnSync）返回 EBUSY。 */
const run = (command: string, argv: string[]): Promise<void> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, argv, { stdio: "inherit", cwd: repo });
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)),
    );
  });

const pad = (n: number) => String(n).padStart(2, "0");

type Cue = { text: string; start: number; end: number };

/**
 * 把词级边界摊成逐字时间。
 *
 * 边界里的 `text` 是**归一化后**的文本（`《神农本草经》` 回的是 `神农本草`、`经`），
 * 把它们的汉字首尾相接，正好等于旁白去标点后的字序列——所以下标可以直接对上，
 * 不需要模糊匹配。对不上就说明旁白里有 TTS 读不出来的字符，那时宁可报错：
 * 一屏朱红推进错了位，比不亮更难发现。
 */
const flatten = (cues: Cue[], spoken: string): number[] => {
  const times: number[] = [];
  let cursor = 0;
  for (const cue of cues) {
    const chars = spokenChars(cue.text);
    const span = Math.max(0, cue.end - cue.start);
    for (let i = 0; i < chars.length; i += 1) {
      // 一个边界里不止一个字时（"麻黄"、"出汗"），按字数均分它的时长。
      times[cursor] = cue.start + (span * i) / chars.length;
      cursor += 1;
    }
  }
  if (cursor !== spoken.length) {
    throw new Error(
      `word boundaries cover ${cursor} char(s) but the narration has ${spoken.length} — ` +
        `the TTS normalised something away; check for digits, latin letters or unusual punctuation`,
    );
  }
  return times.map((t) => Number(t.toFixed(3)));
};

/**
 * 字幕成行。
 *
 * 词级边界太碎，不能直接当字幕：实测一段 46 字的旁白回了 29 条边界，平均一条不到两个字，
 * 照它显示会一帧一跳。所以按旁白自己的标点切句，再把过短的句子并起来——
 * 一行至少 8 个字，否则读起来像在闪。
 *
 * 每行的起止时间取自它首尾两个字的**读出时刻**，不是边界的起止：
 * 这样"字亮到哪"和"字幕说到哪"是同一个时间轴，不会各走各的。
 */
const splitLines = (narration: string, charTimes: number[]): { text: string; start: number; end: number }[] => {
  const MIN_CHARS = 8;
  const clauses: { text: string; chars: number }[] = [];
  let buffer = "";
  for (const ch of narration) {
    buffer += ch;
    if (/[，。；：？！…]/.test(ch)) {
      clauses.push({ text: buffer, chars: spokenChars(buffer).length });
      buffer = "";
    }
  }
  if (buffer.length > 0) clauses.push({ text: buffer, chars: spokenChars(buffer).length });

  const merged: { text: string; chars: number }[] = [];
  for (const clause of clauses) {
    const last = merged[merged.length - 1];
    if (last && (last.chars < MIN_CHARS || clause.chars < MIN_CHARS)) {
      last.text += clause.text;
      last.chars += clause.chars;
    } else {
      merged.push({ text: clause.text, chars: clause.chars });
    }
  }

  const lines: { text: string; start: number; end: number }[] = [];
  let cursor = 0;
  for (const line of merged) {
    if (line.chars === 0) continue;
    const start = charTimes[cursor] ?? 0;
    const end = charTimes[cursor + line.chars - 1] ?? start;
    lines.push({ text: line.text, start, end: Number((end + 0.28).toFixed(3)) });
    cursor += line.chars;
  }
  return lines;
};

for (const id of ids) {
  const { content } = (await import(
    new URL(`../src/asks/${id}.content.ts`, import.meta.url).href
  )) as { content: AskContent };

  const workDir = path.join(repo, ".ask-work", id);
  const voiceDir = path.join(repo, "public", "voice", id);
  fs.mkdirSync(workDir, { recursive: true });
  fs.mkdirSync(voiceDir, { recursive: true });

  // 1. 每段一个文本文件。它们是 TTS 的输入，也是"这段旁白当时是什么"的记录。
  const jobs: { index: number; text: string; media: string; words: string }[] = [];
  content.segments.forEach((segment, i) => {
    const index = i + 1;
    const textPath = path.join(workDir, `seg-${pad(index)}.txt`);
    const media = path.join(voiceDir, `seg-${pad(index)}.mp3`);
    const words = path.join(workDir, `seg-${pad(index)}.json`);
    fs.writeFileSync(textPath, segment.narration, "utf8");
    // 已有产物就跳过：合成要走网络，四十秒的片子有五段，重跑一遍没有必要。
    // 改了旁白必须 --force，否则声音还是上一版——这正是要防的那种"看起来对"。
    if (!force && fs.existsSync(media) && fs.existsSync(words)) {
      console.log(`  seg-${pad(index)}  cached`);
      return;
    }
    jobs.push({ index, text: segment.narration, media, words });
  });

  if (jobs.length > 0) {
    const jobPath = path.join(workDir, "job.json");
    fs.writeFileSync(jobPath, JSON.stringify(jobs, null, 2), "utf8");
    console.log(`${id}: synthesising ${jobs.length} segment(s) with ${VOICE}`);
    await run(PYTHON, [path.join("scripts", "tts_words.py"), jobPath, VOICE]);
  }

  // 2. 编译成 voice 模块。
  const segments = content.segments.map((segment, i) => {
    const index = i + 1;
    const cues = JSON.parse(
      fs.readFileSync(path.join(workDir, `seg-${pad(index)}.json`), "utf8"),
    ) as Cue[];
    const spoken = spokenChars(segment.narration).join("");
    const seconds = Number((cues.length > 0 ? cues[cues.length - 1].end : 0).toFixed(3));
    const charTimes = flatten(cues, spoken);
    // 「书」段另外给一份：引文的每个字在何时被读出来。
    // read 是 narration 里与引文逐字对应的那一截，ask-build 已经核对过它确实在里面。
    let quoteTimes: number[] | undefined;
    if (segment.role === "book" && segment.read) {
      const offset = spoken.indexOf(spokenChars(segment.read).join(""));
      if (offset < 0) throw new Error(`${id} seg-${pad(index)}: read is not inside the narration`);
      quoteTimes = charTimes.slice(offset, offset + spokenChars(segment.read).length);
    }
    return {
      index,
      role: segment.role,
      seconds,
      frames: Math.round(seconds * FPS) + TAIL_FRAMES,
      startFrame: 0,
      cues,
      spoken,
      charTimes,
      lines: splitLines(segment.narration, charTimes),
      ...(quoteTimes ? { quoteTimes } : {}),
    };
  });

  let acc = 0;
  for (const segment of segments) {
    segment.startFrame = acc;
    acc += segment.frames;
  }

  const header = `// AUTO-GENERATED by scripts/ask-voice.ts — 不要手改。
// 数据来源：.ask-work/${id}/seg-NN.json（edge-tts 的 WordBoundary 词级边界）。
// 改旁白之后必须重跑 \`npm run ask:voice -- --id=${id} --force\`，否则画面与声音会脱节。
`;
  const body = `import type { AskVoice } from "./types";

export const voice: AskVoice = ${JSON.stringify({ id, fps: FPS, totalFrames: acc, segments }, null, 2)};
`;

  fs.writeFileSync(path.join(repo, "src", "asks", `${id}.voice.ts`), header + body, "utf8");
  console.log(
    `wrote src/asks/${id}.voice.ts — ${segments.length} segments, ` +
      `${acc} frames = ${(acc / FPS).toFixed(1)}s`,
  );
}
