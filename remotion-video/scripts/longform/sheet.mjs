// 渲染联络表：npm run longform:sheet -- pangxie
// 输出 .longform-work/<id>-sheet.png。表头写「版面检查通过」或「版面问题 N 处（红框）」。
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const id = process.argv[2];
if (!id) {
  console.error("用法：npm run longform:sheet -- <id>");
  process.exit(1);
}
const compId = "Longform" + id.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("") + "Sheet";
const out = path.join(repo, ".longform-work", `${id}-sheet.png`);
fs.mkdirSync(path.dirname(out), { recursive: true });
const serveUrl = await bundle({ entryPoint: path.join(repo, "src/index.ts") });
const composition = await selectComposition({ serveUrl, id: compId });
await renderStill({ composition, serveUrl, output: out });
console.log(`联络表 → ${path.relative(repo, out)}（打开看：标题行写着有没有版面问题）`);
