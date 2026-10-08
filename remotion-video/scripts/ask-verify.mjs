// 「本草一问」的出片与验证。
//
// 与 verify-film.mjs / topic-verify.mjs 是同一件事：渲染之后**断言容器事实**。
// 为什么容器事实值得断言：ffprobe 报的是流，不是采样——六分钟的跨书专题曾经以
// 一条完全健康的 AAC 流配着最后 1:46 的数字静音上线。所以音床要解码，不能只看流。
//
// 这一系列每集 40 秒，比任何一首曲子都短，"音床跑完了"不是它的失效模式；
// 但它有另一种：**旁白与画面脱节**——改了 YAML 没重新合成，声音还是上一版。
// 那一类由 ask:check 的 sync 一节抓（比对朗读字序列），这里只管容器。
//
//   npm run ask:verify                 # 验证已有的母版
//   npm run ask:verify -- --render     # 先渲染再验证
//   npm run ask:verify -- --id=dazao-ye
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkAudioBed, runCapture } from "./lib/audio.ts";
import { checkProbe, parseProbe } from "./lib/ffprobe.ts";

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const asksDir = path.join(repo, "src", "asks");
const outDir = path.join(repo, "out", "asks");

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return [m?.[1] ?? a, m?.[2] ?? true];
  }),
);

/** `npx remotion ...`，和 verify-film 一样走异步捕获：这个沙箱里同步 spawn 返回 EBUSY。 */
const remotion = (() => {
  const dir = path.join(repo, "node_modules", "@remotion", "cli");
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
  const rel = typeof pkg.bin === "string" ? pkg.bin : pkg.bin?.remotion;
  const entry = rel ? path.join(dir, rel) : null;
  if (!entry || !fs.existsSync(entry)) return null;
  // 返回 `{ ok, out }` 整体，不是只返回 out：渲染失败与渲染成功都要能分辨。
  // 早先只取 `.out`，于是一次失败表现成"skip: no out/....mp4 yet"，像还没渲。
  return (...cliArgs) => runCapture(process.execPath, [entry, ...cliArgs]);
})();

/** 一集的 id 与 Composition id。`dazao-ye` → `AskDazaoYe`。 */
const compositionOf = (id) =>
  "Ask" + id.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("");

const episodes = (typeof args.id === "string" ? [args.id] : fs
  .readdirSync(asksDir)
  .filter((f) => f.endsWith(".content.ts"))
  .map((f) => f.replace(/\.content\.ts$/, ""))
).sort();

if (episodes.length === 0) {
  console.error("no episodes under src/asks/");
  process.exit(2);
}

let failures = 0;
for (const id of episodes) {
  const voicePath = path.join(asksDir, `${id}.voice.ts`);
  if (!fs.existsSync(voicePath)) {
    console.error(`FAIL ${id}: no ${id}.voice.ts — run \`npm run ask:voice -- --id=${id}\``);
    failures += 1;
    continue;
  }
  const { voice } = await import(new URL(`../src/asks/${id}.voice.ts`, import.meta.url).href);
  const composition = compositionOf(id);
  const file = path.join(outDir, `${id}.mp4`);

  if (args.render) {
    if (!remotion) {
      console.error("FAIL: @remotion/cli not found");
      process.exit(1);
    }
    console.log(`${id}: rendering ${composition} → out/asks/${id}.mp4`);
    // `--concurrency=1` 不是保守，是必须：`src/index.ts` 加载的霞鹜文楷是 24MB，
    // 默认并发下多个标签页同时等这个字体，`loadFont` 的 delayRender 会超时。
    // `--timeout` 同理——默认 30 秒对 24MB 的字体太紧，实测整片渲染会卡在
    // "Loading font LXGW WenKai ... was called but not cleared after 28000ms"，
    // 而同一份内容渲单帧静帧却过得去（静帧的等待窗口更宽）。verify-film.mjs
    // 用同样的参数渲染单味药线，原因相同。
    const result = await remotion(
      "render",
      composition,
      `out/asks/${id}.mp4`,
      "--codec=h264",
      "--concurrency=1",
      "--timeout=180000",
      "--overwrite",
      "--log=error",
    );
    // 渲染失败必须当场说出来。早先这里只取 `.out` 而丢掉 `.ok`，于是一次渲染失败
    // 表现为"下一句 skip: no out/....mp4 yet"——看起来像还没渲，其实已经错了。
    if (!result.ok) {
      console.error(`FAIL ${id}: remotion render exited non-zero`);
      console.error(result.out.trim().split("\n").slice(-25).join("\n"));
      failures += 1;
      continue;
    }
  }

  if (!fs.existsSync(file)) {
    console.log(`skip ${id}: no out/asks/${id}.mp4 yet`);
    continue;
  }

  console.log(`${id}  ${(voice.totalFrames / voice.fps).toFixed(1)}s expected  ${composition}`);
  const checks = remotion
    ? checkProbe(parseProbe((await remotion("ffprobe", `out/asks/${id}.mp4`)).out), {
        width: 1080,
        height: 1920,
        fps: voice.fps,
        durationSeconds: voice.totalFrames / voice.fps,
      })
    : [];
  checks.push(await checkAudioBed(file, repo));

  let ok = true;
  for (const check of checks) {
    console.log(`  ${check.passed ? "PASS" : "FAIL"} ${check.label} (${check.detail})`);
    ok = ok && check.passed;
    if (args.verbose && check.runs && check.runs.length > 0) {
      for (const run of check.runs.slice(0, 10)) {
        console.log(`         silence at ${run.at.toFixed(2)}s for ${run.length.toFixed(2)}s`);
      }
    }
  }
  if (!ok) failures += 1;
}

if (failures > 0) {
  console.error(`\n${failures} ask film(s) failed.`);
  process.exit(1);
}
console.log("\nask films OK.");
