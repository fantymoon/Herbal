// Synthesise the narration a film declares.
//
//   npm run film:voice [-- --film=<CompId>] [--force]
//
// The Python side is `scripts/tts_words.py`, the same helper the ask series uses: it consumes
// edge-tts's WordBoundary stream and writes the audio in the same pass. Reused rather than
// reimplemented — one TTS helper in this repo, not two — and it is spawned once with every
// film in the job rather than once per film.
//
// The voice is a choice, not a default: `FILM_VOICE` overrides it. 云健 is the calm male
// read; a 古籍 account wants a reader, not a presenter.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadContent } from "./lib/film-content.ts";

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const only = args.find((a) => a.startsWith("--film="))?.slice("--film=".length);
const force = args.includes("--force");

const VOICE = process.env.FILM_VOICE ?? "zh-CN-YunjianNeural";
const PYTHON =
  process.env.FILM_PYTHON ??
  (process.platform === "win32"
    ? path.join(os.homedir(), ".workbuddy-ai", "binaries", "python", "envs", "default", "Scripts", "python.exe")
    : "python3");

const filmsDir = path.join(repo, "src", "films");
const finishedDir = path.join(repo, "src", "finished");
const voiceDir = path.join(repo, "public", "voice");
const work = path.join(repo, ".voice-work");

const wanted = fs
  .readdirSync(finishedDir)
  .filter((f) => f.endsWith(".tsx"))
  .map((f) => f.replace(/\.tsx$/, ""))
  .filter((kebab) => only === undefined || kebab === only);

const jobs = [];
for (const kebab of wanted) {
  const source = fs.readFileSync(path.join(finishedDir, `${kebab}.tsx`), "utf8");
  const { content } = await loadContent(source, filmsDir);
  if (!content?.narration) continue;
  const media = path.join(voiceDir, `${content.id}.mp3`);
  if (fs.existsSync(media) && !force) {
    console.log(`  ${kebab}: narration already synthesised, --force to redo`);
    continue;
  }
  fs.mkdirSync(voiceDir, { recursive: true });
  jobs.push({ index: jobs.length + 1, text: content.narration, media, words: path.join(work, `${content.id}.json`), kebab });
}

if (jobs.length === 0) {
  console.log("nothing to synthesise");
  process.exit(0);
}

fs.mkdirSync(work, { recursive: true });
const jobPath = path.join(work, "job.json");
fs.writeFileSync(jobPath, JSON.stringify(jobs.map(({ kebab, ...rest }) => rest), null, 2), "utf8");

await new Promise<void>((resolve, reject) => {
  // `spawn` and not `execFileSync`: the synchronous form returns EBUSY on this machine.
  const child = spawn(PYTHON, [path.join(repo, "scripts", "tts_words.py"), jobPath, VOICE], {
    stdio: "inherit",
    env: process.env,
  });
  child.on("error", reject);
  child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`tts_words.py exited ${code}`))));
});

// A file that exists is not a file with sound in it: the helper has written an empty mp3
// before, when the venv it was pointed at had lost its interpreter. Measure, do not assume.
for (const job of jobs) {
  const bytes = fs.existsSync(job.media) ? fs.statSync(job.media).size : 0;
  if (bytes < 4096) {
    console.error(`  ${job.kebab}: ${bytes} bytes — the synthesis produced nothing usable`);
    process.exit(1);
  }
  console.log(`  ${job.kebab}: ${Math.round(bytes / 1024)}KB -> public/voice/${path.basename(job.media)}`);
}
