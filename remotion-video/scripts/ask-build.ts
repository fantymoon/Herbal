// 把 `asks/<id>.yaml` 编译成渲染器可以直接 import 的静态数据。
//
// 为什么需要这一步：Remotion 的组件必须是纯函数，不能运行时读文件。这也不是新约定——
// 跨书专题系列同样把旁白时长在构建期编译成 `src/topics/<id>.voice.ts`。
// YAML 是给人写的（一句话一行、加亮哪一句一眼可见），TS 是给渲染器读的，
// 两者中间隔一次编译，而不是让组件在渲染时去开文件。
//
// 编译期做三件渲染期做不了的事：
//   1. 把 YAML 里写的"哪张图"接到 `public/images/credits.json` 的**授权行**上，
//      于是片内署名与图片台账不可能各说一套——图只有一处登记。
//   2. 校验五段齐全、顺序正确，以及「书」段的 `read` 确实是 `narration` 去掉标点后的
//      连续子串。词级时间戳要落到原文的字上，靠的就是这个对应关系；
//      对不上就当场报错，而不是渲染出一屏谁也不亮或乱亮的朱红。
//   3. 把引文与旁白分开存：门禁只扫旁白/字幕，引文是"书上说的"，不受措辞规则管。
//
//   node --experimental-strip-types scripts/ask-build.ts            # 编译全部
//   node --experimental-strip-types scripts/ask-build.ts --id=dazao-ye
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spokenChars } from "../src/asks/types.ts";
import { compileEpisode, episodeIds, loadCredits, renderContentModule } from "./lib/ask.ts";

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(repo, "src", "asks");

const idArg = process.argv.slice(2).find((a) => a.startsWith("--id="));
const only = idArg ? idArg.slice("--id=".length) : null;

const credits = loadCredits(repo);
const ids = episodeIds(repo).filter((id) => (only ? id === only : true));

if (ids.length === 0) {
  console.error(only ? `no asks/${only}.yaml` : "no *.yaml under asks/");
  process.exit(2);
}

let failed = false;
for (const id of ids) {
  const { content, problems } = compileEpisode(repo, id, credits);
  if (!content) {
    console.error(`FAIL ${id}`);
    for (const problem of problems) console.error(`  ✗ ${problem}`);
    failed = true;
    continue;
  }
  fs.writeFileSync(path.join(outDir, `${id}.content.ts`), renderContentModule(content), "utf8");
  const chars = content.segments.reduce((n, s) => n + spokenChars(s.narration).length, 0);
  console.log(
    `wrote src/asks/${id}.content.ts — ${content.segments.length} segments, ${chars} spoken chars ` +
      `(≈${(chars / 5).toFixed(0)}s at 5 chars/s)`,
  );
}

if (failed) process.exit(1);
