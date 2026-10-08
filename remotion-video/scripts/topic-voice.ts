// 把一期话题片的旁白拆成逐段文本，供 TTS 逐段合成。
//
// 为什么逐段而不是整篇一次合成：时长必须能落到"屏"上。整篇合成只能得到一个总长，
// 而排版需要知道每一段各自多长——旁白是这一系列的时间基准，不是文字长度。
//
//   node --experimental-strip-types scripts/topic-voice.ts <topic> dump
//   node --experimental-strip-types scripts/topic-voice.ts <topic> timeline
//
// dump 写出 .topic-work/seg-NN.txt；timeline 读 .topic-work/seg-NN.srt 算出每段时长，
// 写出 .topic-work/timeline.json。中间产物不进版本库。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const topicId = process.argv[2] ?? "tu-que";
const mode = process.argv[3] ?? "dump";
// 第二个系列（英文）放在 src/topics-en/，用 `--dir=topics-en` 指定。
// 目录不同、语言不同，但"旁白 → 分句 → 时长"这条流水线完全一样。
const dirArg = process.argv.find((a) => a.startsWith("--dir="));
const dir = dirArg ? dirArg.slice("--dir=".length) : "topics";
// 中间产物按系列分目录，否则中英文的 seg-NN.txt 会互相覆盖。
const workDir = path.join(repo, dir === "topics" ? ".topic-work" : ".topic-work-en");

const modulePath = path.join(repo, "src", dir, `${topicId}.ts`);
const { content } = (await import(pathToFileURL(modulePath).href)) as {
  content: import("../src/topics/tu-que.ts").TopicContent;
};

const pad = (n: number) => String(n).padStart(2, "0");

if (mode === "dump") {
  fs.mkdirSync(workDir, { recursive: true });
  content.segments.forEach((seg, i) => {
    fs.writeFileSync(path.join(workDir, `seg-${pad(i + 1)}.txt`), seg.narration, "utf8");
  });
  const chars = content.segments.reduce((n, s) => n + [...s.narration].length, 0);
  console.log(`dumped ${content.segments.length} segments, ${chars} chars total`);
  console.log(`estimated ${(chars / 4.5 / 60).toFixed(1)} min at 4.5 chars/s`);
} else if (mode === "timeline") {
  // edge-tts 的 SRT 末条时间戳就是该段时长。用它而不是 ffprobe：Node 在本沙箱里
  // 不能 spawn 子进程，而 SRT 是合成时顺手写出来的，零额外依赖。
  //
  // 取的是 `-->` **之后**那个时间（一句的结束）。早先这个正则匹配的是箭头前面那个
  // （一句的开始），于是每段都被算短了最后一句的长度，成片里表现为"话说一半突然断"。
  const lastTime = (srt: string): number => {
    const stamps = [...srt.matchAll(/-->\s*(\d\d):(\d\d):(\d\d),(\d\d\d)/g)];
    const last = stamps[stamps.length - 1];
    if (!last) return 0;
    return (
      Number(last[1]) * 3600 + Number(last[2]) * 60 + Number(last[3]) + Number(last[4]) / 1000
    );
  };
  const rows = content.segments.map((seg, i) => {
    const srtPath = path.join(workDir, `seg-${pad(i + 1)}.srt`);
    const seconds = fs.existsSync(srtPath) ? lastTime(fs.readFileSync(srtPath, "utf8")) : 0;
    return {
      index: i + 1,
      role: seg.role ?? "plain",
      chars: [...seg.narration].length,
      seconds: Number(seconds.toFixed(2)),
    };
  });
  const total = rows.reduce((n, r) => n + r.seconds, 0);
  fs.writeFileSync(
    path.join(workDir, "timeline.json"),
    JSON.stringify({ topic: content.id, total, segments: rows }, null, 2),
    "utf8",
  );
  for (const r of rows) {
    const rate = r.seconds > 0 ? (r.chars / r.seconds).toFixed(1) : "?";
    console.log(
      `seg ${pad(r.index)}  ${r.role.padEnd(7)} ${String(r.chars).padStart(3)} chars  ` +
        `${r.seconds.toFixed(1).padStart(5)}s  ${rate}/s`,
    );
  }
  console.log(`TOTAL ${total.toFixed(1)}s = ${(total / 60).toFixed(2)} min`);
} else {
  console.error(`unknown mode: ${mode}`);
  process.exit(1);
}
