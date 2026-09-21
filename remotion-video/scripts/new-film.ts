// Scaffold the next film from the book source.
//
//   npm run new-film                                  # next todo entry
//   npm run new-film -- --entry=黄芝 --id=HuangzhiFirstFilm --latin="HUANG ZHI"
//
// Creates three files at once so the five hand-maintained places collapse to one:
//   src/films/<kebab>.ts       content data (source text filled in, TODOs marked)
//   src/finished/<kebab>.tsx   ~10-line film that renders <EntryFilm content={...} />
//   upload/<kebab>.md          upload ledger
// The progress ledger derives itself from the content files, so there is no
// separate DONE map entry to remember.
//
// The scaffold does NOT pass `npm run check`: the translation, commentary and photo
// are deliberately left as TODOs. That failure is the gate working — fill them in
// and the gate goes green.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { toKebab } from "./lib/film-files.ts";

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return [m?.[1] ?? a, m?.[2] ?? true];
  }),
);

type BookConfig = { key: string; book: string; bookLatin: string; source: string };
type ProgressEntry = { name: string; volume: string; status: string; film?: string };
type Progress = { book: string; source: string; entries: ProgressEntry[] };

const booksDir = path.join(repo, "scripts", "books");
const bookFiles = fs.readdirSync(booksDir).filter((f) => f.endsWith(".mjs")).sort();
const bookFile = typeof args.book === "string" ? `${args.book}.mjs` : bookFiles[0];
if (!bookFiles.includes(bookFile)) {
  console.error(`unknown book "${args.book}"; available: ${bookFiles.join(", ")}`);
  process.exit(1);
}
const config = (await import(new URL(bookFile, `file://${booksDir}/`).href))
  .default as BookConfig;

const progress = JSON.parse(
  fs.readFileSync(path.join(repo, "progress.json"), "utf8"),
) as Progress;
const nextTodo = progress.entries.find((e) => e.status === "todo");
if (!nextTodo) {
  console.error("no todo entry left in progress.json");
  process.exit(1);
}

const entry = typeof args.entry === "string" ? args.entry : nextTodo.name;
const id = typeof args.id === "string" ? args.id : null;
if (!id || !/^[A-Za-z][A-Za-z0-9]*$/.test(id)) {
  console.error(
    [
      `pass --id=<CompositionId> (ASCII pinyin, e.g. --id=HuangzhiFirstFilm)`,
      `next entry in original order: ${nextTodo.name} [${nextTodo.volume}]`,
    ].join("\n"),
  );
  process.exit(1);
}
const latin = typeof args.latin === "string" ? args.latin.toUpperCase() : "TODO PINYIN";
const kebab = toKebab(id);

// ---- Read the entry out of the corpus ---------------------------------------
const sourcePath = path.join(repo, "..", config.source);
const text = new TextDecoder("gb18030").decode(fs.readFileSync(sourcePath));
const lines = text.split("\n");
let volume = null;
let body: string[] = [];
let found = false;
for (let i = 0; i < lines.length; i += 1) {
  const line = lines[i].trim();
  const dir = line.match(/^<目录>(.*)$/);
  if (dir) {
    volume = dir[1].trim();
    continue;
  }
  const name = line.match(/^<篇名>(.*)$/);
  if (name) {
    if (found) {
      break;
    }
    if (name[1].trim() === entry) {
      found = true;
    }
    continue;
  }
  if (found && line) {
    body.push(line);
  }
}
if (!found) {
  console.error(`entry "${entry}" has no <篇名> section in ${config.source}`);
  process.exit(1);
}

const contentLine = body.find((l) => l.startsWith("内容：")) ?? "";
const rest = contentLine.replace(/^内容：/, "").trim();
const flavorMatch = rest.match(/^(味[^。]*。)/);
const flavor = flavorMatch ? flavorMatch[1] : "";
const original = flavorMatch ? rest.slice(flavor.length).trim() : rest;
const aliases = body
  .filter((l) => l.startsWith("一名"))
  .map((l) => l.replace(/^一名/, "").replace(/。$/, "").trim())
  .filter((a) => a.length > 0);
if (!original) {
  console.error(`could not read a 内容 line for "${entry}"; add it by hand`);
  process.exit(1);
}

const showVolume = (v: string | null): string => (v ? v.replace(/\\/g, " · ") : "");

// ---- Emit the three files ----------------------------------------------------
const filmsDir = path.join(repo, "src", "films");
const finishedDir = path.join(repo, "src", "finished");
const uploadDir = path.join(repo, "upload");
for (const dir of [filmsDir, finishedDir, uploadDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

const dataPath = path.join(filmsDir, `${kebab}.ts`);
const filmPath = path.join(finishedDir, `${kebab}.tsx`);
const ledgerPath = path.join(uploadDir, `${kebab}.md`);
for (const [p, label] of [
  [dataPath, "content data"],
  [filmPath, "film"],
]) {
  if (fs.existsSync(p)) {
    console.error(`${label} already exists: ${path.relative(repo, p)}`);
    process.exit(1);
  }
}
// The upload ledger is legitimately written ahead of the film (its skeleton is what
// makes the platform-copy fields impossible to forget), so an existing ledger is kept
// rather than treated as a collision. Overwriting it would throw away copy that was
// already drafted.
const keptLedger = fs.existsSync(ledgerPath);

const factAlias = aliases[0] ?? null;
fs.writeFileSync(
  dataPath,
  `import type { FilmContent } from "../layout";

// ${entry} — ${config.book} ${showVolume(volume)}
// Source: ${config.source} (原文照录，不要改动 original 字段)
//
// TODO while this film is a draft:
//   Until these are filled in, the film is a draft: \`npm run check\` reports it,
//   \`npm run gen\` does not register it, and \`npm run verify\` refuses to render it.
//   1. translation — 逐句今译；功效句必须以「古籍称其主……」开头
//   2. commentary  — 注释：古病名、字义、底本差异等（不得写成疗效说明）
//   3. photo       — 真实授权图片，ASCII 文件名，并登记到 public/images/credits.json
export const content: FilmContent = {
  id: "${id}",
  entry: "${entry}",
  latin: "${latin}",
  book: "${config.book}",
  bookLatin: "${config.bookLatin}",
  volume: "${showVolume(volume)}",
  division: null, // TODO 部类，如 "上经 · 草部"；不需要就保持 null
  flavor: "${flavor}",
  alias: ${factAlias ? `"一名${factAlias}"` : "null"},
  original: "${original}",
  translation: "TODO 逐句今译",
  commentary: "TODO 注释",
  historicalNote: "此为汉代认知，未经现代科学证实",
  facts: [
${factAlias ? `    { label: "别名", value: "${factAlias}" },\n` : ""}    { label: "篇目位置", value: "${showVolume(volume)}" },
  ],
  photo: {
    file: "TODO-<ascii-name>.jpg",
    subject: "TODO SPECIES",
    author: "TODO AUTHOR",
    license: "TODO LICENSE",
  },
  music: "music/yuzhou-changwan.mp3",
  accent: "#a8812f",
  mode: "single-herb",
};
`,
  "utf8",
);

fs.writeFileSync(
  filmPath,
  `import { EntryFilm } from "../entry-film";
import { content } from "../films/${kebab}";

// Geometry, type scale, scene split and pacing all come from src/layout.ts.
export const ${id}: React.FC = () => <EntryFilm content={content} />;
`,
  "utf8",
);

if (!keptLedger) {
  fs.writeFileSync(
    ledgerPath,
    `# ${entry} · 上传台账

- film: \`${id}\`
- 标题：
- 描述：
- 话题：
- BGM： 母版配 \`music/yuzhou-changwan.mp3\`，上传时用平台曲库同款替换
- 今译句式： \`古籍称其主……\`（功效句强制框定）+ 注释 \`此为汉代认知，未经现代科学证实\`
- 抖音： 未发布
- 视频号： 未发布
- 备注：
`,
    "utf8",
  );
}

console.log(`created:
  src/films/${kebab}.ts
  src/finished/${kebab}.tsx
  upload/${kebab}.md${keptLedger ? " (already existed, kept)" : ""}

next:
  1. fill in translation, commentary and photo in src/films/${kebab}.ts
  2. register the photo in public/images/credits.json
  3. npm run gen && npm run check      (until step 1 is done this film is a draft:
                                        reported, not registered, not renderable)
  4. npm run verify -- --film=${id}
  5. npm run progress                  (picks the film up from the content file)`);
