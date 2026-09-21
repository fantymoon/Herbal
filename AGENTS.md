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
- `npm run check` — the pre-render gate: compliance rules, repeated-text scan and upload-ledger check for every film (`npm run check -- --film=<CompId>` for one). Frozen films are reported, never failed.
- `npm run gen` — regenerate `src/Composition.tsx` from `src/finished/` (see `scripts/generate-compositions.mjs`).
- `npm run verify -- --film=<CompId>` — runs the rule check as a pre-flight, then hero/source/closing stills to `out/stills/`, renders `out/<name>.mp4`, and asserts 1080x1920 / 30fps / H.264 / AAC / duration / file size via ffprobe (see `scripts/verify-film.mjs`). Add `--sheet` for a contact sheet.
- `npm run progress` — rebuild `progress.json`; per-book config lives in `scripts/books/`.
- `npm run manifest` — refresh `masters-manifest.json` (which masters exist and their sizes).

## Conventions

- One finished video = scenes + `<FinishedFilm>` shell from `src/finished-shell.tsx` in `src/finished/<kebab-name>.tsx`, registered via `npm run gen`. Film shape, pacing, music, and test literals are specified in `SKILL.md` (§ Template And Audio Boundaries, Verification) — follow it, don't duplicate it here.
- **Published films are frozen.** `scripts/lib/frozen-films.ts` lists the 55 films already live on the platforms; the current rules are not re-applied to them and never add a new film to that list. New films must pass `npm run check`.
- Rule gates live in `scripts/lib/` (`compliance.ts`, `repeat-scan.ts`, `frozen-films.ts`, `ffprobe.ts`, `film-files.ts`) so tests and CLIs share one implementation. `tests/compliance.test.ts` proves the checker fails on bad input before it is trusted.
- `HerbalFeature`, `HerbProfileTemplate` and `FormulaShortTemplate` in `src/HerbalVisuals.tsx` are legacy scaffolding: no finished film references them. Do not build a new film on them.
- Shared shell: `src/herbal-stage.tsx` (`SceneShell`, `Seal`, palette), `src/herbal-cards.tsx` (`fade`, `rise`) and `src/finished-shell.tsx` (`FinishedFilm`, `FinishedMusic`). Extend these only backward-compatibly — 55 published films render through them, and a change that alters their output is a regression.
- Assets: photos in `public/images/` with ASCII filenames + a `credits.json` entry, always rendered via Remotion `Img` + `staticFile` — never native `img` or CSS `backgroundImage`; never code-draw herbs.
- Tests live next to the rules they enforce (`tests/finished-video.test.ts` tables + sweeps). Add a focused failing test for a new video before implementing. Assert on derived values, not on counts of files or assets.
- `tests/herbal-short-video-skill.test.mjs` asserts specific phrases exist in `SKILL.md`; if you edit the skill, keep those assertions green.
- `out/` is gitignored; render output goes to `out/<name>.mp4`. The masters therefore have no history — `npm run manifest` records them, and `out/` needs a copy outside Git.
- Content language is Chinese (STKaiti for classical text); file/code identifiers stay English/ASCII.
