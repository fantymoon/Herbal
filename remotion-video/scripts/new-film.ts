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
import { defectOf, findEntries, readCorpus } from "./lib/corpus.ts";
import { toKebab } from "./lib/film-files.ts";
import { renderLedger } from "./lib/ledger.ts";
import type { FilmContent } from "../src/layout.ts";

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
//
// Through `scripts/lib/corpus.ts`, the same reader `npm run entry` uses. This file used
// to walk the lines itself and take only the *first* line of the 内容 block, which meant
// every entry whose 经文 wraps across lines got scaffolded with a truncated `original`:
// 决明子 came out as "主青盲、…益精光（《太平御览》" — a sentence that reads as if it were
// complete. The scaffold is a draft, but a draft with a *plausible* wrong 原文 is worse
// than one with a TODO, because nothing marks it for a second look.
const entries = findEntries(readCorpus(path.join(repo, "..", config.source)));
const exact = entries.filter((e) => e.name === entry);
const near = entries.filter((e) => e.name.includes(entry));
const found = exact.length > 0 ? exact : near;
if (found.length === 0) {
  console.error(`entry "${entry}" has no readable 经文 in ${config.source}`);
  process.exit(1);
}
if (found.length > 1) {
  console.error(
    `"${entry}" matches ${found.length} entries — be exact: ${found.map((e) => e.name).join(" / ")}`,
  );
  process.exit(1);
}
const { name: entryName, volume, sutra } = found[0];
if (entryName !== entry) {
  console.warn(`note: <篇名> is "${entryName}"; the 经文 below is the evidence for it.`);
}

// A defective 经文 has nothing correct to put on screen, and guessing the missing
// character is exactly what `原文照录` forbids. Refuse, and say which entry to use.
const defect = defectOf(sutra);
if (defect) {
  console.error(
    `${entry}: ${defect}\n` +
      `  照录会把缺陷带上屏，而「原文照录」不允许改字。\n` +
      `  换个底本核对，或改用 --entry=<另一条目>。`,
  );
  process.exit(1);
}

const text = sutra.text;
const flavorMatch = text.match(/^(味[^。]*。)/);
const flavor = flavorMatch ? flavorMatch[1] : "";
const original = flavorMatch ? text.slice(flavor.length).trim() : text;
const aliases = original
  .split("。")
  .map((clause) => clause.match(/^一名(.+)$/)?.[1]?.trim())
  .filter((a): a is string => Boolean(a));
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
  // The ledger is rendered from the same shape the film will load, so its copy fields
  // are already filled the moment the scaffold lands.
  const scaffold: FilmContent = {
    id,
    entry,
    latin,
    book: config.book,
    bookLatin: config.bookLatin,
    volume: showVolume(volume),
    division: null,
    flavor,
    alias: factAlias ? `一名${factAlias}` : null,
    original,
    translation: "TODO 逐句今译",
    commentary: "TODO 注释",
    historicalNote: "此为汉代认知，未经现代科学证实",
    facts: [
      ...(factAlias ? [{ label: "别名", value: factAlias }] : []),
      { label: "篇目位置", value: showVolume(volume) },
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
  // Same renderer as `npm run ledger`, so the scaffold and the refresher cannot drift.
  fs.writeFileSync(ledgerPath, renderLedger(scaffold, null), "utf8");
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
  5. npm run progress                  (registers the film by reading its own entry/id
                                        off this content module — no book-config edit)`);
