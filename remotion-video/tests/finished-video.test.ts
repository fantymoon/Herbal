import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDraft } from "../scripts/lib/compliance.ts";
import { loadContent } from "../scripts/lib/film-content.ts";
import { MAX_PHOTO_EDGE, photoOversize } from "../scripts/lib/image.ts";
import { planFilm, type FilmContent } from "../src/layout.ts";

// Sweeps over every finished film. There is deliberately no per-film test here: a film
// with a master in `out/` is not going to change (see SKILL.md 「渲染过的片子不动」), so
// a test that pins one film's literals can only ever fail on a refactor. The 55 such
// assertions this file used to carry were testing constants. What survives is the set of
// properties that have to hold for *every* film, including the next one.
//
// Hoisted above every `test(...)` registration on purpose. This block awaits
// `loadContent`, and node:test begins running registered tests while a top-level await
// is still pending — so a test declared above it could read `renderableFiles` before
// the line that assigns it, which is a TDZ error rather than a stale value. It stayed
// hidden until the corpus grew enough films to change when the await yielded.
const finishedDirUrl = new URL("../src/finished/", import.meta.url);
const filmsDirPath = fileURLToPath(new URL("../src/films/", import.meta.url));
const finishedFiles = fs.readdirSync(finishedDirUrl).filter((f) => f.endsWith(".tsx")).sort();

// A draft (content module still carrying TODOs) is not a finished film: `npm run gen`
// does not register it, so it has no Composition and cannot be rendered. The sweeps
// that treat a file as a shipped film therefore cover renderable files only; the
// source-hygiene sweep still covers every file, drafts included.
const draftFiles = new Set<string>();
const contentOf = new Map<string, FilmContent | null>();
for (const f of finishedFiles) {
  const source = fs.readFileSync(new URL(f, finishedDirUrl), "utf8");
  const { content } = await loadContent(source, filmsDirPath);
  contentOf.set(f, content);
  if (isDraft(content)) {
    draftFiles.add(f);
  }
}
const renderableFiles = finishedFiles.filter((f) => !draftFiles.has(f));

const compositionSource = fs.readFileSync(new URL("../src/Composition.tsx", import.meta.url), "utf8");

test("every finished film renders through the shared FinishedFilm shell (except the photo wrapper)", () => {
  assert.ok(renderableFiles.length > 0, "no finished films found");
  for (const f of renderableFiles) {
    if (f === "angelica-fourth-film-real-photo.tsx") {
      continue;
    }
    const source = fs.readFileSync(new URL(f, finishedDirUrl), "utf8");
    // A data-driven film reaches the shared shell through <EntryFilm>, which is the
    // only sanctioned way to build a new film — the point is that no film copies the
    // shell, not that every file names it directly.
    if (contentOf.get(f)) {
      assert.equal(source.includes("<EntryFilm"), true, f);
      assert.equal(source.includes('from "../entry-film"'), true, f);
      assert.equal(
        fs
          .readFileSync(new URL("../src/entry-film.tsx", import.meta.url), "utf8")
          .includes("<FinishedFilm"),
        true,
        "entry-film.tsx must render through the shared shell",
      );
    } else {
      assert.equal(source.includes("<FinishedFilm"), true, f);
      assert.equal(source.includes('from "../finished-shell"'), true, f);
    }
    assert.equal(source.includes("const BackgroundMusic"), false, f);
  }
});

// Grandfathered on-screen violations in two first-generation films: they show
// a workflow-order label the skill now forbids for new films. The videos stay
// untouched; only new films are held to the rule.
const legacyWorkflowOrderFilms = new Set(["angelica-fourth-film.tsx", "bupleurum-third-film.tsx"]);
// First-generation films with a summary instead of a clause-by-clause translation.
const legacySummaryFilms = new Set([
  "ginseng-first-film.tsx",
  "licorice-second-film.tsx",
  "peony-second-film.tsx",
  "angelica-fourth-film-real-photo.tsx",
]);

test("no finished film carries code-drawn illustrations, css backgrounds, or workflow-order labels", () => {
  assert.ok(finishedFiles.length > 0, "no finished films found");
  for (const f of finishedFiles) {
    const source = fs.readFileSync(new URL(f, finishedDirUrl), "utf8");
    assert.equal(source.includes("<svg"), false, f);
    assert.equal(source.includes("RootIllustration"), false, f);
    assert.equal(source.includes("backgroundImage"), false, f);
    // HerbalVisuals holds the legacy templates; SKILL.md says a finished film must
    // not be built on them.
    assert.equal(source.includes('from "../HerbalVisuals"'), false, f);
    if (!legacyWorkflowOrderFilms.has(f)) {
      assert.equal(source.includes("阅读顺序"), false, f);
      assert.equal(source.includes("ENTRY 0"), false, f);
    }
  }
});

test("every finished film shows the seal, disclaimer, and sign (except the photo wrapper)", () => {
  for (const f of renderableFiles) {
    if (f === "angelica-fourth-film-real-photo.tsx") {
      continue;
    }
    const source = fs.readFileSync(new URL(f, finishedDirUrl), "utf8");
    // A data-driven film delegates all of this to <EntryFilm>, so assert the shared
    // renderer carries it rather than demanding the literals in the wrapper.
    const content = contentOf.get(f) ?? null;
    if (content) {
      const entryFilm = fs.readFileSync(new URL("../src/entry-film.tsx", import.meta.url), "utf8");
      // The seal glyph follows `mode` (药 for a single herb, 方 for a formula) rather
      // than being a literal, so the assertion is that the renderer reads the field —
      // otherwise the gate would be validating a `mode` that changes nothing on screen.
      assert.equal(entryFilm.includes("sealGlyph(mode)"), true, f);
      assert.equal(entryFilm.includes('staticFile("sign-1.png")'), true, f);
      assert.equal(content.historicalNote.length > 0, true, f);
      continue;
    }
    assert.equal(source.includes('<Seal text="药"'), true, f);
    assert.equal(source.includes("古籍内容展示，不构成诊疗建议"), true, f);
    assert.equal(source.includes('staticFile("sign-1.png")'), true, f);
  }
});

test("every current-format film carries a clause-by-clause modern translation", () => {
  for (const f of renderableFiles) {
    if (legacySummaryFilms.has(f)) {
      continue;
    }
    const source = fs.readFileSync(new URL(f, finishedDirUrl), "utf8");
    if (contentOf.get(f)) {
      // The 今译 label is rendered by the shared shell; the text itself is checked
      // against the rules in tests/compliance.test.ts.
      assert.equal(source.includes("<EntryFilm"), true, f);
      continue;
    }
    assert.equal(source.includes("今译"), true, f);
    assert.equal(source.includes("MODERN READING"), true, f);
  }
});

test("every image and music file referenced by a finished film exists on disk", () => {
  const images = new Set<string>();
  const tracks = new Set<string>();
  for (const f of renderableFiles) {
    const source = fs.readFileSync(new URL(f, finishedDirUrl), "utf8");
    for (const m of source.matchAll(/staticFile\("images\/([^"]+)"\)/g)) {
      images.add(m[1]);
    }
    for (const m of source.matchAll(/staticFile\("music\/([^"]+)"\)/g)) {
      tracks.add(m[1]);
    }
    // A data-driven film names its photo and track in the content module, not in the
    // wrapper, so those references have to be collected from there.
    const content = contentOf.get(f);
    if (content) {
      images.add(content.photo.file);
      tracks.add(content.music.replace(/^music\//, ""));
    }
  }
  assert.ok(images.size > 0, "no photo is referenced by any film");
  for (const img of images) {
    assert.equal(fs.existsSync(new URL(`../public/images/${img}`, import.meta.url)), true, img);
  }
  for (const track of tracks) {
    assert.equal(fs.existsSync(new URL(`../public/music/${track}`, import.meta.url)), true, track);
  }
});

test("each finished film's duration matches its Composition registration", () => {
  const registered = new Map(
    [...compositionSource.matchAll(/<Composition\s+id="(\w+)"\s+component=\{\w+\}\s+durationInFrames=\{(\d+)\}/g)].map(
      (m) => [m[1], m[2]] as const,
    ),
  );
  for (const f of renderableFiles) {
    // The photo wrapper renders the base film and inherits its duration;
    // see scripts/generate-compositions.mjs.
    if (f === "angelica-fourth-film-real-photo.tsx") {
      continue;
    }
    const source = fs.readFileSync(new URL(f, finishedDirUrl), "utf8");
    const component = source.match(/export const (\w*(?:Film|Photo))\b/)?.[1];
    // A data-driven film has no duration literal: the plan computes it, and that is
    // exactly the value `npm run gen` registers.
    const content = contentOf.get(f) ?? null;
    const duration = content
      ? String(planFilm(content).durationInFrames)
      : source.match(/durationInFrames=\{(\d+)\}/)?.[1];
    if (!component || !duration) {
      assert.fail(f);
    }
    assert.equal(registered.get(component), duration, f);
  }
});

test("every film image is registered in the credits ledger with its on-screen author and license", () => {
  const imagesDir = new URL("../public/images/", import.meta.url);
  // Derived, not a hard-coded count: the ledger must cover exactly the image files
  // on disk, so adding a photo never means editing this test.
  const onDisk = fs
    .readdirSync(imagesDir)
    .filter((f) => f !== "credits.json")
    .sort();
  const ledger = JSON.parse(
    fs.readFileSync(new URL("credits.json", imagesDir), "utf8"),
  ) as { file: string; subject: string | null; author: string | null; license: string }[];
  assert.deepEqual(
    ledger.map((e) => e.file).sort(),
    onDisk,
    "credits.json must cover exactly the images in public/images",
  );
  const byFile = new Map(ledger.map((e) => [e.file, e]));
  const referenced = new Set<string>();
  for (const f of renderableFiles) {
    const source = fs.readFileSync(new URL(f, finishedDirUrl), "utf8");
    const content = contentOf.get(f) ?? null;
    const files = content
      ? [content.photo.file]
      : [...source.matchAll(/staticFile\("images\/([^"]+)"\)/g)].map((m) => m[1]);
    for (const file of files) {
      referenced.add(file);
      const entry = byFile.get(file);
      assert.ok(entry, `${f}: ${file} missing from credits.json`);
      assert.ok(entry.license.length > 0, file);
      if (content) {
        // The credit line a data-driven film shows is built straight from the content
        // module, so the ledger and the module must agree exactly — a typo in either
        // would put a wrong credit on screen.
        assert.equal(content.photo.license, entry.license, `${f}: licence differs from credits.json`);
        assert.equal(
          content.photo.author ?? null,
          entry.author ?? null,
          `${f}: author differs from credits.json`,
        );
        continue;
      }
      assert.ok(source.includes(entry.license), `${f} missing license ${entry.license}`);
      if (entry.author) {
        assert.ok(source.includes(entry.author), `${f} missing author ${entry.author}`);
      }
    }
  }
  // The 「本草一问」 series (src/asks/) is a third set of films with its own renderer, so
  // its photos have to be counted as references too — otherwise every image that series
  // downloads would be reported as an orphan in the ledger. Read off the generated
  // content modules rather than the YAML: the build has already checked them against the
  // ledger, and the modules are what the renderer actually reads.
  const asksDir = new URL("../src/asks/", import.meta.url);
  for (const f of fs.readdirSync(asksDir).filter((n) => n.endsWith(".content.ts"))) {
    const source = fs.readFileSync(new URL(f, asksDir), "utf8");
    for (const m of source.matchAll(/"file":\s*"([^"]+)"/g)) {
      referenced.add(m[1]);
    }
  }
  // 长视频（src/topics/<id>/film.yaml → film.json）的图片同样要进 credits.json，
  // 且片中署名要和账本一致。读 film.json 而不是 yaml：渲染器读的是前者。
  const topicsDir = new URL("../src/topics/", import.meta.url);
  for (const d of fs.readdirSync(topicsDir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const filmUrl = new URL(`${d.name}/film.json`, topicsDir);
    if (!fs.existsSync(filmUrl)) continue;
    const film = JSON.parse(fs.readFileSync(filmUrl, "utf8")) as {
      images: Record<string, { file: string; credit: string }>;
    };
    for (const img of Object.values(film.images)) {
      const file = img.file.replace(/^images\//, "");
      referenced.add(file);
      const entry = byFile.get(file);
      assert.ok(entry, `${d.name}: ${file} missing from credits.json`);
      assert.ok(img.credit.includes(entry.license), `${d.name}: ${file} credit missing license ${entry.license}`);
      if (entry.author) {
        assert.ok(img.credit.includes(entry.author), `${d.name}: ${file} credit missing author ${entry.author}`);
      }
    }
  }
  for (const entry of ledger) {
    assert.equal(fs.existsSync(new URL(`../public/images/${entry.file}`, import.meta.url)), true, entry.file);
    assert.ok(referenced.has(entry.file), `${entry.file} orphaned in credits.json`);
  }
});

test("every registered photo is within the size a film can actually draw", () => {
  // The insert is 932 px wide and the blurred bed is 1080 px, but iNaturalist serves
  // research-grade originals: the folder reached 134 MB with 3248×4872 files in it, all of
  // which a CI run has to check out to render one 12-second video. `fetch-photo` shrinks at
  // the door now; this is what keeps a hand-placed image from undoing that.
  const dir = fileURLToPath(new URL("../public/images/", import.meta.url));
  const oversized = fs
    .readdirSync(dir)
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .map((f) => ({ f, problem: photoOversize(path.join(dir, f)) }))
    .filter((row) => row.problem !== null);
  assert.deepEqual(
    oversized,
    [],
    `photos over ${MAX_PHOTO_EDGE}px: ${oversized.map((o) => `${o.f} (${o.problem})`).join(", ")}`,
  );
});

test("progress.json tracks every finished film in original book order", () => {
  const progress = JSON.parse(fs.readFileSync(new URL("../progress.json", import.meta.url), "utf8")) as {
    book: string;
    source: string;
    entries: { name: string; volume: string; status: string; film?: string; occurrence?: number }[];
  };
  assert.equal(progress.book, "神农本草经");
  const keys = progress.entries.map((e) => e.name + (e.occurrence ? `#${e.occurrence}` : ""));
  assert.equal(new Set(keys).size, keys.length);
  const done = progress.entries.filter((e) => e.status === "done");
  assert.equal(new Set(done.map((e) => String(e.film))).size, done.length);
  const finished = renderableFiles.filter((f) => f !== "angelica-fourth-film-real-photo.tsx");
  for (const f of finished) {
    const comp = f
      .replace(/\.tsx$/, "")
      .split("-")
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join("");
    assert.ok(done.some((e) => e.film === comp), `${f} missing from progress.json`);
  }
  for (const e of progress.entries) {
    if (e.status === "done") {
      const kebab = String(e.film)
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .toLowerCase();
      assert.equal(fs.existsSync(new URL(`../src/finished/${kebab}.tsx`, import.meta.url)), true, e.name);
      assert.equal(compositionSource.includes(`id="${e.film}"`), true, e.name);
    } else {
      assert.ok(e.status === "todo" || e.status === "skipped", e.name);
    }
  }
  const next = progress.entries.find((e) => e.status === "todo");
  assert.ok(next, "no todo entry left");
});

// Banned modern therapeutic verbs, mirrored from SKILL.md § Platform Publishing
// 医疗表述. 主治 survives in 44 legacy films (made before 2026-09) and is
// grandfathered there only; every other word below must appear nowhere, and
// 主治 in no new film and no upload copy.
const bannedTherapeuticWords = [
  "治疗", "改善", "有效", "根治", "特效", "治愈", "秘方", "神效",
  "必备", "包治", "断根", "奇效", "立竿见影", "药到病除",
];
const legacyZhuzhiFilms = new Set(
  "baihao baiqing baishiying baiying baizhi bianqing changpu cheqianzi chizhi chongweizi dansha duhuo ephedra fangkui gandihuang huangqi huashi juhua kongqing longdan maimendong nieshi niuxi nvwei puxiao shihu shizhongru shu shuyu taiyi tianmendong tusizi xiaoshi xixin xizi yanlvzi yiyiren yuanzhi yunmu yuquan yuyuliang zengqing zexie zishiying"
    .split(" ")
    .map((kebab) => `${kebab}-first-film.tsx`),
);

test("no banned therapeutic wording in films or upload copy", () => {
  const withZhuzhi: string[] = [];
  for (const f of renderableFiles) {
    const source = fs.readFileSync(new URL(f, finishedDirUrl), "utf8");
    // A data-driven film's prose lives in its content module. Only the film's own
    // modern wording is in scope: `original` is 原文照录, so a classical 主治 there is
    // a quotation, not a claim the film makes. Same scope as scripts/lib/compliance.ts.
    const content = contentOf.get(f) ?? null;
    const haystack = content
      ? [source, content.translation, content.commentary, content.historicalNote].join("\n")
      : source;
    for (const w of bannedTherapeuticWords) {
      assert.equal(haystack.includes(w), false, `${f}: ${w}`);
    }
    if (haystack.includes("主治")) {
      withZhuzhi.push(f);
    }
  }
  assert.deepEqual(withZhuzhi.sort(), [...legacyZhuzhiFilms].sort());
  const uploadDir = new URL("../upload/films/", import.meta.url);
  if (fs.existsSync(uploadDir)) {
    for (const f of fs.readdirSync(uploadDir).filter((f) => f.endsWith(".md") && !f.startsWith("_"))) {
      const copy = fs.readFileSync(new URL(f, uploadDir), "utf8");
      assert.equal(copy.includes("主治"), false, `upload/films/${f}`);
      for (const w of bannedTherapeuticWords) {
        assert.equal(copy.includes(w), false, `upload/films/${f}: ${w}`);
      }
    }
  }
});
