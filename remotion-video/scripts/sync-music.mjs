// Sync music from ../../music (original Chinese filenames) into
// public/music (ASCII names used at render time).
// Usage: npm run sync-music
// New tracks: drop the mp3 into music/ and extend TRACKS below.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(root, "..", "..", "music");
const dstDir = path.join(root, "..", "public", "music");

const TRACKS = new Map([
  ["高山流水 - 轻音乐网.mp3", "gaoshan-liushui.mp3"],
  ["渔舟唱晚（古筝）_爱给网_aigei_com.mp3", "yuzhou-changwan.mp3"],
]);

const hash = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");

let changed = 0;
for (const [src, dst] of TRACKS) {
  const srcFile = path.join(srcDir, src);
  const dstFile = path.join(dstDir, dst);
  if (!fs.existsSync(srcFile)) {
    console.error(`missing source: music/${src}`);
    process.exitCode = 1;
    continue;
  }
  if (!fs.existsSync(dstFile) || hash(srcFile) !== hash(dstFile)) {
    fs.copyFileSync(srcFile, dstFile);
    changed += 1;
    console.log(`copied music/${src} -> public/music/${dst}`);
  } else {
    console.log(`ok public/music/${dst}`);
  }
}

for (const f of fs.readdirSync(srcDir).filter((f) => f.endsWith(".mp3"))) {
  if (!TRACKS.has(f)) {
    console.warn(`unmapped source (add to TRACKS in scripts/sync-music.mjs): music/${f}`);
  }
}
console.log(changed === 0 ? "music in sync" : `synced ${changed} track(s)`);
