# AGENTS.md

Chinese herbal medicine short-video production: mobile-first 9:16 Remotion videos built from classical TCM book texts.

## Layout

- The git repo is the **workspace root**: code lives in `remotion-video/`, and the workflow skill, this file, the corpus, the music and the brand assets are tracked alongside it. Run npm commands inside `remotion-video/`; CI does the same via `working-directory`.
- `remotion-video/` — all code work happens here.
- `TCM-Ancient-Books-master/` — read-only corpus of ~700 classical texts (e.g. `000-神农本草经.txt`). Search with `rg`, preserve source wording. Tracked, because `progress.json` and every 今译 are derived from it.
- `.agents/skills/herbal-short-video-production/SKILL.md` — authoritative production workflow. Load the `herbal-short-video-production` skill before any video work; its rules (mode/seal, 今译 vs 注释, content-repetition, platform copy, verification order) override defaults.
- `music/` — source mp3s (Chinese filenames). Sync into `remotion-video/public/music/` under ASCII names via `npm run sync-music` (see `scripts/sync-music.mjs`); only those ASCII names exist at render time.
- `sign-1.png` — brand seal asset, duplicated into `remotion-video/public/`.
- `v2-858c5bf7e3c2516f6993f74a5140169d_b.jpg` — scanned 神农本草经 title page, used as a visual reference for paper texture and typography rhythm. Its provenance is unrecorded, so never place it in a film.
- `remotion-video/progress.json` — original-order coverage ledger for the current book (rebuild via `npm run progress`); next film = first `todo` entry.
- `.github/workflows/ci.yml` — runs from the repo root with `working-directory: remotion-video`.

## Commands (run inside `remotion-video/`)

- `npm run dev` — Remotion Studio preview.
- `npm test` — `node --test --experimental-strip-types` over the files listed in `package.json`. `node --test tests/` silently skips the TypeScript files, so the list is explicit and `tests/suite.test.ts` fails if it drifts.
- `npm run lint` — `eslint src && tsc`; run after tests, before rendering.
- `npm run check` — the pre-render gate: compliance rules, repeated-text scan and upload-ledger check for every film (`npm run check -- --film=<CompId>` for one). Reports three states — `ok`, `draft`, `FAIL` — and only `FAIL` exits non-zero. Frozen films are reported, never failed.
- `npm run new-film -- --id=<CompId> [--latin=...] [--entry=...]` — scaffold the next `todo` entry: writes the content module, the film file and the upload ledger in one shot (see `scripts/new-film.ts`). The scaffold is a draft by construction.
- `npm run gen` — regenerate `src/Composition.tsx` from `src/finished/` (see `scripts/generate-compositions.mjs`). Drafts are skipped, so a half-finished film never becomes renderable.
- `npm run verify -- --film=<CompId>` — runs the rule check as a pre-flight, then hero/source/closing stills to `out/stills/`, renders `out/<name>.mp4`, and asserts 1080x1920 / 30fps / H.264 / AAC / duration / file size via ffprobe (see `scripts/verify-film.mjs`). Add `--sheet` for a contact sheet. Refuses to render a draft.
- `npm run progress` — rebuild `progress.json`; per-book config lives in `scripts/books/`. A data-driven film's entry→id mapping is derived from its own content module, so a new film needs **no** book-config edit; the config's `done` map is now a legacy supplement for the 55 hand-written films.
- `npm run manifest` — refresh `masters-manifest.json` (which masters exist and their sizes).

## Conventions

- **A gate rule must bind to behaviour, not to a field's shape.** The seal rule used to validate `mode` while the renderer hardcoded `药`, so `mode: "formula"` passed and still drew 药. Anything the gate checks has to change what a viewer sees; if it cannot, either wire it up or drop it. Mappings that the renderer reads (e.g. `SEAL_GLYPH` / `sealGlyph(mode)` in `src/layout.ts`) are preferred over inline literals, because a `Record<mode, …>` makes a missing case a compile error instead of a silent fallback.
- **…and bind to meaning, not to one string.** The historical-frame rule used to demand `content.historicalNote !== REQUIRED_NOTE`, so it enforced the *example* SKILL.md offered and every better sentence failed the gate — improving the wording meant editing the checker. It is now `hasHistoricalFrame` (`src/layout.ts`): three semantic requirements, each named in `FRAME_PARTS`, and the gate message says which one is missing. `REQUIRED_NOTE` survives as the suggested wording, not the only accepted one. When a rule has to be strict, say so in the rule's name or comment (`published-audit.ts` still matches the literal, because there the question is factual: did that published film carry that sentence).
- **A new film is data, not JSX.** Content goes in `src/films/<kebab>.ts` (a `FilmContent` object); `src/finished/<kebab>.tsx` is a ~5-line wrapper that renders `<EntryFilm content={content} />`; `src/layout.ts` computes every block's geometry, the scene split, the duration and the pacing; `src/entry-film.tsx` draws it. Never hand-position a block in a film file, and never hand-tune a font size outside `TYPE` in `src/layout.ts` — `npm run check` fails on both.
- **Draft state.** A data-driven film whose content module still carries `TODO` placeholders is a *draft*: `npm run check` reports it, `npm run gen` does not register it and `npm run verify` refuses to render it. That is what makes the gate's leniency towards drafts safe — a draft has no Composition, so it cannot reach a platform. `tests/compliance.test.ts` asserts no draft is ever registered.
- Film shape, pacing, music, and test literals are specified in `SKILL.md` (§ Template And Audio Boundaries, Verification) — follow it, don't duplicate it here.
- **Published films are frozen.** `scripts/lib/frozen-films.ts` lists the 55 films already live on the platforms; the current rules are not re-applied to them and never add a new film to that list. New films must pass `npm run check`.
- Rule gates live in `scripts/lib/` (`compliance.ts`, `repeat-scan.ts`, `frozen-films.ts`, `ffprobe.ts`, `film-files.ts`, `film-content.ts`) so tests and CLIs share one implementation. `tests/compliance.test.ts` proves the checker fails on bad input before it is trusted.
- `HerbalFeature`, `HerbProfileTemplate` and `FormulaShortTemplate` in `src/HerbalVisuals.tsx` are legacy scaffolding: no finished film references them. Do not build a new film on them.
- Shared shell: `src/herbal-stage.tsx` (`SceneShell`, `Seal`, palette), `src/herbal-cards.tsx` (`fade`, `rise`) and `src/finished-shell.tsx` (`FinishedFilm`, `FinishedMusic`). Extend these only backward-compatibly — 55 published films render through them, and a change that alters their output is a regression. After touching one, render a frozen film's still and diff it against the pre-change still (byte-identical md5) before committing.
- `FinishedFilm` takes `breaks: number[]` + `scenes: FinishedScene[]`; the 2-tuple/3-scene form it replaced must stay derivable, and `scripts/verify-film.mjs` samples the hero, the last classical scene and the closing scene from the same plan the renderer uses.
- Assets: photos in `public/images/` with ASCII filenames + a `credits.json` entry, always rendered via Remotion `Img` + `staticFile` — never native `img` or CSS `backgroundImage`; never code-draw herbs. A data-driven film names its photo in the content module, and `tests/finished-video.test.ts` asserts the module's author/licence match the ledger exactly.
- Tests live next to the rules they enforce (`tests/layout.test.ts` for geometry, `tests/finished-video.test.ts` tables + sweeps). Add a focused failing test for a new video before implementing. Assert on derived values, not on counts of files or assets. Sweeps that treat a file as a shipped film must iterate `renderableFiles` (drafts excluded).
- `tests/herbal-short-video-skill.test.mjs` asserts specific phrases exist in `SKILL.md`; if you edit the skill, keep those assertions green.
- `out/` is gitignored; render output goes to `out/<name>.mp4`. The masters therefore have no history — `npm run manifest` records them, and `out/` needs a copy outside Git.
- Content language is Chinese (STKaiti for classical text); file/code identifiers stay English/ASCII.
- Do not edit the same file with two parallel edits — the second write wins and silently drops the first.
