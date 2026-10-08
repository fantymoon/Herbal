// 「本草一问」的门禁。
//
// 这一系列**只有三条内容规则**（用户定的），外加一节"产物是否与源同步"的检查。
//   1. 旁白与字幕里不出现功效词——功效只留在照录的引文里，旁白从不复述；
//   2. 每条引文都有出处；
//   3. 每张图都在 public/images/credits.json 里登记过，且许可非空。
//
// 为什么只有三条：这个系列的合规是**靠版式本身保证**的，不靠事后审词。
// 问法（"为什么单占一行"）已经决定了它不会变成功效主张；引文带出处上屏；
// 图来自开放授权通道。规则再多也换不来这三件事，只会在写作时把人逼成模板。
//
// 但"只有三条"不等于"不检查产物"：YAML 改了没重跑 ask:build、旁白改了没重跑
// ask:voice，都会渲染出一部画面与声音对不上的片子，而三条内容规则一条都不会响。
// 所以下面还有一节 **sync**，它不判内容，只判"你手上的东西是不是同一版"。
//
//   npm run ask:check [-- --id=<id>] [--verbose]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { compileEpisode, episodeIds, loadCredits } from "./lib/ask.ts";
import {
  ledgerWordingProblems,
  photoLicenceProblems,
  quoteSourceProblems,
  wordingProblems,
  type Finding,
} from "./lib/ask-rules.ts";
import { spokenChars, type AskContent, type AskVoice } from "../src/asks/types.ts";

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const idArg = args.find((a) => a.startsWith("--id="));
const verbose = args.includes("--verbose");
const only = idArg ? idArg.slice("--id=".length) : null;

const credits = loadCredits(repo);
const ids = episodeIds(repo).filter((id) => (only ? id === only : true));
if (ids.length === 0) {
  console.error(only ? `no such episode: ${only}` : "no episodes under asks/");
  process.exit(2);
}

/**
 * 台账里那三段文案。
 *
 * 解析 `## 标题` / `## 描述` / `## 话题` 后面那个围栏块——台账是给人看的文档，
 * 但平台真正吃进去的是那三块文字，所以它们要能被机器取出来。
 * 视频号的处罚落在标题和描述上，不落在某一帧上，只扫画面会放出一部画面合规、
 * 标题不合规的片（这个账号已经付过一次这个学费）。
 */
const ledgerCopy = (file: string): { title: string; description: string; topics: string } | null => {
  if (!fs.existsSync(file)) return null;
  const text = fs.readFileSync(file, "utf8");
  // 标题可以写成 `## 标题` 也可以写成 `## 一、标题`——台账是给人读的文档，
  // 序号是写作习惯，不该成为门禁的失败原因。所以只认"这一行里有这两个字"。
  const section = (heading: string): string => {
    const found = text.match(new RegExp(`^##[^\\n]*${heading}[^\\n]*$`, "m"));
    if (!found || found.index === undefined) return "";
    const block = text.slice(found.index + found[0].length).match(/```[a-z]*\n([\s\S]*?)```/);
    return block ? block[1].trim() : "";
  };
  return { title: section("标题"), description: section("描述"), topics: section("话题") };
};

let failures = 0;
for (const id of ids) {
  const findings: Finding[] = [];
  const add = (rule: string, detail: string) => findings.push({ rule, detail });

  // ── sync：你手上的东西是不是同一版 ──────────────────────────────────────
  const { content, problems } = compileEpisode(repo, id, credits);
  if (!content) {
    console.log(`FAIL ${id}`);
    for (const problem of problems) console.log(`       [structure] ${problem}`);
    failures += 1;
    continue;
  }

  const generatedPath = path.join(repo, "src", "asks", `${id}.content.ts`);
  if (!fs.existsSync(generatedPath)) {
    add("sync", `src/asks/${id}.content.ts is missing — run \`npm run ask:build\``);
  } else {
    const generated = (await import(pathToFileURL(generatedPath).href)) as { content: AskContent };
    if (JSON.stringify(generated.content) !== JSON.stringify(content)) {
      add("sync", `src/asks/${id}.content.ts does not match asks/${id}.yaml — run \`npm run ask:build\``);
    }
  }

  const voicePath = path.join(repo, "src", "asks", `${id}.voice.ts`);
  let voice: AskVoice | null = null;
  if (!fs.existsSync(voicePath)) {
    add("sync", `src/asks/${id}.voice.ts is missing — run \`npm run ask:voice -- --id=${id}\``);
  } else {
    voice = ((await import(pathToFileURL(voicePath).href)) as { voice: AskVoice }).voice;
    if (voice.segments.length !== content.segments.length) {
      add(
        "sync",
        `voice has ${voice.segments.length} segment(s), the content has ${content.segments.length}`,
      );
    }
    content.segments.forEach((segment, i) => {
      const seg = voice?.segments[i];
      if (!seg) return;
      const tag = `seg-${String(i + 1).padStart(2, "0")}`;
      // 最硬的一条同步检查：朗读字序列必须与旁白逐字一致。
      // 改了旁白没重新合成，这里立刻响——否则画面按新旁白排、声音还是旧的。
      const expected = spokenChars(segment.narration).join("");
      if (seg.spoken !== expected) {
        add(
          "sync",
          `${tag}: the audio reads 「${seg.spoken}」 but the YAML says 「${expected}」 — ` +
            `run \`npm run ask:voice -- --id=${id} --force\``,
        );
      }
      if (segment.role === "book" && segment.quote && seg.quoteTimes === undefined) {
        add("sync", `${tag}: the 书 screen has no quoteTimes — nothing on it can light up`);
      }
    });
  }

  // ── 三条内容规则 ────────────────────────────────────────────────────────
  findings.push(...wordingProblems(content));
  findings.push(...quoteSourceProblems(content));
  findings.push(...photoLicenceProblems(content, credits));

  const ledgerFile = path.join(repo, "upload", "asks", `${id}.md`);
  const copy = ledgerCopy(ledgerFile);
  if (!copy) {
    add("ledger", `upload/asks/${id}.md is missing — 每集都要有台账，平台文案从它来`);
  } else {
    if (copy.title.length === 0) add("ledger", "the ledger has no 标题 block");
    if (copy.description.length === 0) add("ledger", "the ledger has no 描述 block");
    if (copy.topics.length === 0) add("ledger", "the ledger has no 话题 block");
    if (copy.description.length > 0 && copy.description.indexOf(content.disclaimer) < 0) {
      add("ledger", `the 描述 does not carry the disclaimer 「${content.disclaimer}」`);
    }
    findings.push(...ledgerWordingProblems("ledger.标题", copy.title));
    findings.push(...ledgerWordingProblems("ledger.描述", copy.description));
    findings.push(...ledgerWordingProblems("ledger.话题", copy.topics));
  }

  // ── 报告 ────────────────────────────────────────────────────────────────
  const duration = voice ? voice.totalFrames / voice.fps : 0;
  const photos = content.segments.reduce((n, s) => n + (s.photos ?? []).length, 0);
  const quotes = content.segments.reduce(
    (n, s) => n + (s.quote ? 1 : 0) + (s.evidence ?? []).length,
    0,
  );
  console.log(
    `${findings.length === 0 ? "ok  " : "FAIL"} ${id}  ${content.entry}  ` +
      `${duration.toFixed(1)}s  ${photos} photo(s)  ${quotes} quote(s)`,
  );
  if (verbose && voice) {
    for (const seg of voice.segments) {
      const chars = spokenChars(seg.spoken).length;
      const rate = seg.seconds > 0 ? (chars / seg.seconds).toFixed(1) : "?";
      console.log(
        `       ${seg.role.padEnd(7)} ${seg.seconds.toFixed(1).padStart(5)}s  ` +
          `${String(chars).padStart(3)} chars  ${rate}/s  ${seg.lines.length} line(s)`,
      );
    }
    // 三条规则之外的事实照打：这一系列不判它们，但它们是关于这一集的事实。
    console.log(`       music ${content.music}`);
    for (const source of content.sources) console.log(`       据 ${source}`);
  }
  for (const finding of findings) {
    console.log(`       [${finding.rule}] ${finding.detail}`);
  }
  if (findings.length > 0) failures += 1;
}

if (failures > 0) {
  console.error(`\n${failures} episode(s) failed.`);
  process.exit(1);
}
console.log("\nask films OK — 三条规则全过。");
