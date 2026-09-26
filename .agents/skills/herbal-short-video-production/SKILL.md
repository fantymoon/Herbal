---
name: herbal-short-video-production
description: Use when creating, revising, or preparing upload copy for mobile-first Chinese herbal medicine or formula videos in Remotion from classical-book text, especially when style references, real images, readable copy, seals, music, attribution, and template isolation matter.
---

# Herbal Short Video Production

Use this workflow for educational 9:16 videos about a single Chinese herb or a formula. Build a new finished composition from the supplied book content; keep reusable templates unchanged.

## Input And Mode

Collect the exact source entry, visual references, optional cutout sign, music files, and target composition ID. Search book text with `rg`; preserve the source wording and do not turn historical descriptions into medical advice.

When a batch draws from multiple classical books, choose one book, finish every selected entry from that book, and only then move to another book. Keep the book name and volume consistent in all scenes and upload copy for that batch.

When continuing a book across several videos, choose the next uncovered entry in its **original order**. Do not jump between convenient entries unless the user explicitly changes the sequence. Track coverage in `progress.json` (rebuild with `npm run progress` inside `remotion-video/`); the next film is the first `todo` entry.

The **original order is an internal production rule**, not viewer-facing copy. **Do not display workflow order** in the video: do not show labels such as `阅读顺序`, `按原文顺序阅读`, `ENTRY 04/05`, or a batch sequence number. If a source marker is useful, show only the book's actual bibliographic location, such as `卷、篇、部、章节` (for example, `《神农本草经》卷二·中经`).

Choose the mode before layout:

| Mode | Use for | Upper-right seal |
| --- | --- | --- |
| `single-herb` | one herb or medicine profile | `药` |
| `formula` | a prescription with several ingredients | `方` |

The seal is a single large glyph, never the herb or formula name. Use a glyph scale around `0.5` to `0.6`; two characters leave half the seal visibly empty.

## Visual Rules

- Borrow color, paper texture, framing, and typography rhythm from reference images. Do not place a reference image directly as a video background.
- 不使用代码绘制药材、根、叶或药物主体。**首先尝试从网上获取真实图片**（license-compatible），实在找不到再省略。Put local photos in `public/images` with ASCII filenames. Render them with Remotion's `Img` and `staticFile`, never a native `img` or CSS background image.
- Photo source channels: Wikimedia Commons first — fetch file info via its REST API (`commons.wikimedia.org/w/rest.php/v1/file/File:<name>`) and read the JSON `original.url` for the direct download. Wikimedia rate-limits bursts with HTTP 429 (often for many minutes per IP), so space requests out and keep alternate channels ready. Fall back to Openverse (`api.openverse.org/v1/images/?q=<name>&license_type=commercial`), which aggregates Flickr, Europeana (incl. naturalis.nl), the Smithsonian, and other CC-licensed collections. Only accept CC0 / CC BY / CC BY-SA images; record the exact file, author, and license for the on-screen credit, and register the entry in `public/images/credits.json` (enforced by tests).
- Put local photos in `public/images` with ASCII filenames. Render them with Remotion's `Img` and `staticFile`, never a native `img` or CSS background image.
- Use a framed insert, not full bleed. Crop around the actual subject and include compact author/source/license credit when required.
- Use the supplied transparent sign only after confirming its edge/background is clean. It should read as a subtle brand mark, not an opaque pasted square.

```tsx
<Img src={staticFile("images/herb-photo.jpg")} style={{ objectFit: "cover" }} />
<Seal text={mode === "single-herb" ? "药" : "方"} glyphScale={0.55} />
```

## How A New Film Is Built

A new film is **data, not JSX**. Three files, and only one of them holds prose:

| File | Holds |
| --- | --- |
| `src/films/<kebab>.ts` | the `FilmContent` object — the only place prose is written |
| `src/finished/<kebab>.tsx` | a ~5-line wrapper: `<EntryFilm content={content} />` |
| `upload/<kebab>.md` | the upload ledger (platform copy, once written) |

`npm run new-film -- --id=<CompositionId> [--latin=...] [--entry=...]` writes all three at once, reading the entry's 原文 straight out of the corpus and marking the rest as `TODO`. Do not hand-edit the wrapper: geometry, type scale, scene split, duration and pacing all come from `src/layout.ts`, which `tests/layout.test.ts` covers.

- **Draft state.** While the content module still contains `TODO` placeholders the film is a *draft*: `npm run check` reports it, `npm run gen` does not register it, and `npm run verify` refuses to render it. A draft therefore has no Composition and cannot reach a platform — that is what makes it safe for the gate to report a draft without failing. Clear every placeholder and the film becomes renderable.
- **Never hand-position a block or hand-pick a font size.** A film file that carries its own `position: "absolute"` fails the gate, and every size must come from `TYPE` in `src/layout.ts`. The 55 published films drifted to 46 distinct font sizes and 11–14 hand-placed blocks each, which is exactly the maintenance this replaces.
- Text heights are reserved from each block's own line-height, so a block never reserves more space than it renders. `tests/layout.test.ts` asserts this — a 1.5 line box on the 150px hero title once pushed the whole hero ~87px below where the published films put it.
- The reveal is front-loaded: blocks finish appearing by roughly frame 56 of a 120-frame scene, matching the published films.

## Mobile-First Layout

- Compose at `1080×1920`. Inspect frames at phone scale before export.
- Pace for reading, not skimming: at least 4 seconds per scene, and a total length of 15, 18, 21 or 24 seconds (450 / 540 / 630 / 720 frames at 30 fps). 360 frames stays in the accepted set but is no longer reachable: it would leave 120 frames for a classical scene that has to carry the original, the `今译`, the `注释` and the historical note. `tests/compliance.test.ts` enforces the duration set, the per-scene minimum, and that the number of `breaks` is one less than the number of scenes. Choose the longer durations instead of shrinking type. Entrance animations should be gentle (around one second of fade/rise).
- **The reading budget is a gate, not advice.** `READING_RATE_LIMIT` in `src/layout.ts` is 15 Chinese characters per second — a skimming ceiling, roughly three times the comfortable reading rate. `npm run check` fails a film whose busiest scene asks for more, *even when nothing overlaps and nothing overflows*: geometry and reading time are separate budgets, and the 55 published films shipped with their middle scene at ~31 characters/second because only the first one was ever checked. Fix an overload by shortening the text or letting the split spread it across another scene — never by speeding the viewer up. `npm run check -- --verbose` prints the per-scene rate.
- The geometry invariants are machine-checked, not eyeballed: `src/layout.ts` stacks every block with at least 50px of vertical clearance, and `npm run check` fails a film whose plan has an overlap, an overflow past the bottom reserve, or a scene shorter than 4 seconds. You still inspect the stills — the checker cannot judge whether a photo shows the right species.
- Keep the title dominant. Two floors are enforced by tests and are not negotiable: the `今译` body must be at least 56px, and any element that renders Chinese must be at least 24px. ASCII-only photo credits are exempt from the 24px floor. Aim for secondary Chinese at least 34px and pinyin/English labels at least 24px. Keep photo credits concise and subordinate.
- Do not solve a full screen by shrinking the translation. The original quotation is allowed to be large, but the `今译` — the part that makes the entry readable — must never end up smaller than the classical text. When the material does not fit, the layout splits the translation across up to three classical scenes; if it still overflows, that is a content problem and `npm run check` reports it rather than hiding it behind smaller type.
- Fill the vertical story with meaningful material: identity, a short quote, photo or factual strip, continuation from the source, and a closing/source note. Calm spacing is good; an unoccupied middle third is not.
- Do not nest cards. Use a few paper rules, framed inserts, and aligned strips instead of unrelated floating boxes.
- Put the long original quotation, aliases, habitat, and bibliographic details into later scenes to prevent both tiny type and empty screens.
- Text that lands on the decorative landscape needs its own backing. The hero's 原文 excerpt and its citation share one bordered panel for exactly this reason; a bare line over the hills reads as a grey smudge.
- The brand mark is anchored to the bottom of the closing frame, not stacked after the disclaimer, so it does not float in the middle of the empty lower half.

## Content Repetition

- Make a fact map before writing: assign every source fact, alias, habitat phrase, and short quote to **one scene only**.
- Do not repeat the herb/formula name, an alias, habitat, or a short source phrase across hero, source, closing, and post copy unless a required source credit or disclaimer needs it.
- Fill a source scene with a **longer contiguous original quote** or a previously unused supporting detail. Do not recycle the hero line merely to fill space.
- Keep direct quotations faithful, but split a long entry into distinct, non-overlapping excerpts when it serves the pacing.
- Before rendering, run `npm run check`, which performs the **repeated-string scan** across all visible on-screen text automatically. It reads the film's rendered text — the content module and its layout plan for a data-driven film, the JSX for the frozen hand-written ones — rather than a hand-written list, so a phrase you forgot to declare is still caught. Credits and the required disclaimer are the only normal exceptions; bibliographic citations (`《…》…卷/篇/部`) are allowed to repeat, which is why the citation is printed as `《书名》· 卷 · 篇` rather than concatenated bare.

## Original And Modern Reading

- Present a faithful original excerpt first, then a visibly separate **modern plain-language translation** in the same or following scene.
- **Translation is not commentary.** The `今译` block must be a **逐句现代汉语翻译**: follow the displayed original clause by clause, preserve subjects, actions, objects, qualifiers, and uncertainty, and put the resulting plain-language meaning on screen. Do not omit the difficult clauses merely because they are archaic.
- 不得以“这段主要谈及……”等概括、评论或释义替代今译。原文说了什么，就先翻成现代汉语；无法确定的字词应在今译中保留不确定性，例如“此处字义待考”或“底本注作……”。
- Every film must carry a separate block explicitly labelled `注释` / `说明` / `COMMENTARY`, placed outside the `今译`. Use it for historical background, textual variants, terminology notes, and safety framing. 评论/说明 may explain context, but must never stand in for the translation. This block is required, not optional: `tests/compliance.test.ts` fails a film that omits it or that omits the historical framing line below.
- **Frame efficacy as history, not advice.** Whenever the original ascribes an effect with `主……`, the corresponding `今译` clause must open with the historical frame `古籍称其主……`, and the `注释` block must carry one line such as `此为汉代认知，未经现代科学证实`. The `主` stays faithful to the source; the frame marks it as historical belief. Modern therapeutic verbs — `治疗`, `主治`, `改善`, `有效`, `根治`, `特效`, `治愈` — never appear in `今译` or `注释` outside direct quotation from the source text.
- Keep every translation distinct from medical advice: do not turn the text into a diagnosis, treatment instruction, modern efficacy claim, dose, or safety conclusion.
- Before rendering, run a clause check: every visible original clause must have a corresponding modern clause; confirm that no `今译` sentence begins by summarizing or evaluating the passage instead of translating it.

## Template And Audio Boundaries

- Create or edit only the finished composition and its focused tests. The shared layer a finished film may build on is `src/entry-film.tsx` (`EntryFilm`), `src/layout.ts` (geometry and type scale), `src/finished-shell.tsx` (`FinishedFilm`, `FinishedMusic`), `src/herbal-stage.tsx` (`SceneShell`, `Seal`, palette) and `src/herbal-cards.tsx` (`fade`, `rise`). Extend that layer only in backward-compatible ways — a new optional prop is fine, a changed default is not, because 55 published films render through it. After touching the shared layer, render a frozen film's still and confirm it is byte-identical to the pre-change still before committing.
- `HerbalFeature`, `HerbProfileTemplate` and `FormulaShortTemplate` are legacy scaffolding: no finished film references them, and code-drawn illustration (`RootIllustration`) is forbidden. Do not use them as a starting point for a new film.
- A new film renders through `EntryFilm`; that is what the gate checks for. `FinishedFilm` takes any number of scenes as long as `breaks.length === scenes.length - 1`, and the plan supplies both, so a data-driven film never writes a `durationInFrames` or `breaks` literal of its own.
- Register the film with `npm run gen` instead of hand-editing `src/Composition.tsx`. `gen` reads the duration from the plan and skips drafts.
- Store music under `public/music`; name it as `music/<file>.mp3` in the content module. The shell plays it through `Audio` with `staticFile`, `trimAfter={durationInFrames}`, and gentle fade-in/out at a low background volume.
- The disclaimer `古籍内容展示，不构成诊疗建议` is part of the closing scene by construction, and the gate fails a plan that lost it. It is required whenever a historical source describes medicinal use — which, for this corpus, is always.
- The block below is the **frozen hand-written shape** — it is what the 55 published films look like and what a retired film would be re-made from, not a template for a new one. A new film must not copy it.

```tsx
export const XFirstFilm: React.FC = () => (
  <FinishedFilm
    accent={accent}
    durationInFrames={360}
    music={staticFile("music/yuzhou-changwan.mp3")}
    breaks={[120, 240]}
    scenes={[HeroScene, ClassicalScene, ClosingScene]}
  />
);
```

## Platform Publishing

Prepare upload copy after the final visual and media checks. When the user does not name a platform, use a short-video-safe default rather than inventing platform-specific limits.

- **短标题**: lead with the herb or formula name and a source-led question or fact. Keep the default below 18 Chinese characters. Avoid clickbait, treatment promises, or absolute wording. Do not reuse one fixed question template across videos (such as "古书里写了什么？"): vary the phrasing with the entry — a question about the herb's name, its alias, its main sentence, or its place in the book all work.
- **视频描述**: describe what this video actually shows rather than a generic formula: name the source entry, the scene flow (identity, original quote, 今译, closing facts), and any featured photo, then the disclaimer. Two to four short lines. Add three to five neutral tags only when the platform supports tags.
- **医疗表述**: 不夸大疗效，不把古籍描述改写成“治疗”“改善”“必备”“有效”等承诺，也不补充未在素材中出现的现代医学结论。以下词语不得出现在片内今译/注释、标题、描述、话题中的任何位置（直接引用古籍原文除外）：`治疗`、`主治`、`改善`、`有效`、`根治`、`特效`、`治愈`、`秘方`、`神效`、`必备`、`包治`、`断根`、`奇效`、`立竿见影`、`药到病除`。该表由测试强制执行（2026年9月前的存量影片`主治`表述除外，见测试内名单）。
- **来源标注**: 视频描述首行必须为出处，格式如`《神农本草经》卷一·上经载……`；照片署名保留作者/来源/许可（见 `public/images/credits.json`）。
- **账号定位**: 账号分类选文化/读书；简介如“每日读一段本草古籍”，不出现养生、调理、健康科普字样，不承诺任何功效。
- **署名**: retain required photo credit in-video. Repeat it in the description only when the source license or platform requires it.
- **上传台账**: every new film needs `upload/<kebab>.md` declaring `film:`, `标题：`, `描述：`, `话题：`, `BGM：`, `抖音：`, `视频号：` before it can be rendered. The 55 published films have no ledger and cannot be reconstructed — the ledger starts here so a platform question can be answered with evidence instead of memory. `tests/upload-ledger.test.ts` and `npm run check` enforce the file and its fields; the values themselves may stay empty until the copy is written.
- **母版与发布版本**: masters bake in a local BGM that is replaced by the platform library at upload time, so the master is not byte-identical to the published video. Record the platform track in the ledger, and keep a copy of `out/` outside Git (`npm run manifest` records what should be there).

```text
标题：麻黄为何称"龙沙"？

描述：
《神农本草经》卷二如何记载麻黄？
本片照录原文，逐句今译，附麻黄植株照片。
古籍内容展示，不构成诊疗建议。
#麻黄 #神农本草经 #本草 #中草药
```

## Verification

1. Add a focused test before implementation and run it until it fails for the missing behavior.
2. Implement the smallest change, then run `npm test` and `npm run lint`.
3. Run `npm run check` (or `npm run check -- --film=<CompositionId>`). It applies the compliance rules, the repeated-text scan, and the upload-ledger check. A new film that fails any of these cannot be rendered. A `draft` line is not a failure: it means placeholders are still open, and the film is not renderable until they are cleared.
4. Run `npm run verify -- --film=<CompositionId>`: it re-runs the rule check as a pre-flight (and refuses a draft), renders hero/source/closing stills to `out/stills/`, exports `out/<name>.mp4`, and asserts the container facts via `npx remotion ffprobe` — 1080x1920, 30fps, H.264 video, AAC audio, a duration matching the composition, and a plausible file size. The three still frames are sampled from the plan, so they are true scene mids whatever the scene count. Add `--sheet` (optionally `--sheet=20`) to sample a contact sheet instead of three frames; three frames out of 360 is a thin sample for a film whose main failure mode is text crowding mid-scene.
5. Inspect the stills yourself for subject, seal, pinyin, English, and Chinese readability on mobile; the script cannot judge that for you. Compare a new film's hero and closing against a frozen film's at the same frame — that is the only reliable way to catch a departure from the series' visual language.
6. Refresh Studio and leave the final composition previewable.

## Published Films Are Frozen

`scripts/lib/frozen-films.ts` lists the films already published to the platforms. They are frozen: their masters are live copies, so the rules in this document are **not** re-applied to them, and their known gaps are reported for information only.

- Never add a new film to that list. A new film must satisfy the current rules instead.
- The list may only shrink, and only by retiring a film and re-making it.
- `tests/compliance.test.ts` asserts the list matches the published films exactly, so an accidental addition fails the suite.

## Avoid

- Code-drawn medicine illustrations, reference images used as backgrounds, or unlicensed/uncredited web photos.
- Tiny pinyin, English, labels, or source text just to fit more material.
- A two-character seal, an invisible sign, or a sign with an uncut white block.
- Rendering a finished video before inspecting key frames, or rendering one that `npm run check` rejects.
- Adding a new film to `scripts/lib/frozen-films.ts` to get past the rules, or re-applying the current rules to a published master.
- Polluting the shared shell (`FinishedFilm`, `SceneShell`, `fade`/`rise`) while producing a one-off finished video.
- Modern therapeutic verbs in `今译`/`注释` outside direct source quotation.
- Shrinking the `今译` below 56px to fit a long entry, instead of splitting the translation or moving to a 450/540-frame duration.
