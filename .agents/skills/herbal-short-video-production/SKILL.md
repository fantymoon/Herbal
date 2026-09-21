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

## Mobile-First Layout

- Compose at `1080×1920`. Inspect frames at phone scale before export.
- Pace for reading, not skimming: at least 4 seconds per scene, and a total length of 12, 15, or 18 seconds (360 / 450 / 540 frames at 30 fps). These three durations are the only accepted ones; `tests/compliance.test.ts` enforces the set, the per-scene minimum, and that the number of `breaks` is one less than the number of scenes. Choose the longer durations instead of shrinking type. On-screen text must be readable at a normal pace without forcing the viewer to pause; entrance animations should be gentle (around one second of fade/rise).
- Plan block geometry before writing scenes: a CJK glyph is about as wide as its font size, so estimate every block's height, keep at least 50px of vertical clearance between stacked blocks, and never let two absolutely-positioned blocks overlap. Recheck the hero, source, and closing stills for overlap before rendering.
- Keep the title dominant. Two floors are enforced by tests and are not negotiable: the `今译` body must be at least 56px, and any element that renders Chinese must be at least 24px. ASCII-only photo credits are exempt from the 24px floor. Aim for secondary Chinese at least 34px and pinyin/English labels at least 24px. Keep photo credits concise and subordinate.
- Do not solve a full screen by shrinking the translation. The original quotation is allowed to be large, but the `今译` — the part that makes the entry readable — must never end up smaller than the classical text. When the material does not fit, split the translation across two scenes or move the duration up to 450/540 frames.
- Fill the vertical story with meaningful material: identity, a short quote, photo or factual strip, continuation from the source, and a closing/source note. Calm spacing is good; an unoccupied middle third is not.
- Do not nest cards. Use a few paper rules, framed inserts, and aligned strips instead of unrelated floating boxes.
- Put the long original quotation, aliases, habitat, and bibliographic details into later scenes to prevent both tiny type and empty screens.

## Content Repetition

- Make a fact map before writing: assign every source fact, alias, habitat phrase, and short quote to **one scene only**.
- Do not repeat the herb/formula name, an alias, habitat, or a short source phrase across hero, source, closing, and post copy unless a required source credit or disclaimer needs it.
- Fill a source scene with a **longer contiguous original quote** or a previously unused supporting detail. Do not recycle the hero line merely to fill space.
- Keep direct quotations faithful, but split a long entry into distinct, non-overlapping excerpts when it serves the pacing.
- Before rendering, run `npm run check`, which performs the **repeated-string scan** across all visible on-screen text automatically. It reads each film's own JSX rather than a hand-written list, so a phrase you forgot to declare is still caught. Credits and the required disclaimer are the only normal exceptions; bibliographic citations (`《…》…卷/篇/部`) are allowed to repeat.

## Original And Modern Reading

- Present a faithful original excerpt first, then a visibly separate **modern plain-language translation** in the same or following scene.
- **Translation is not commentary.** The `今译` block must be a **逐句现代汉语翻译**: follow the displayed original clause by clause, preserve subjects, actions, objects, qualifiers, and uncertainty, and put the resulting plain-language meaning on screen. Do not omit the difficult clauses merely because they are archaic.
- 不得以“这段主要谈及……”等概括、评论或释义替代今译。原文说了什么，就先翻成现代汉语；无法确定的字词应在今译中保留不确定性，例如“此处字义待考”或“底本注作……”。
- Every film must carry a separate block explicitly labelled `注释` / `说明` / `COMMENTARY`, placed outside the `今译`. Use it for historical background, textual variants, terminology notes, and safety framing. 评论/说明 may explain context, but must never stand in for the translation. This block is required, not optional: `tests/compliance.test.ts` fails a film that omits it or that omits the historical framing line below.
- **Frame efficacy as history, not advice.** Whenever the original ascribes an effect with `主……`, the corresponding `今译` clause must open with the historical frame `古籍称其主……`, and the `注释` block must carry one line such as `此为汉代认知，未经现代科学证实`. The `主` stays faithful to the source; the frame marks it as historical belief. Modern therapeutic verbs — `治疗`, `主治`, `改善`, `有效`, `根治`, `特效`, `治愈` — never appear in `今译` or `注释` outside direct quotation from the source text.
- Keep every translation distinct from medical advice: do not turn the text into a diagnosis, treatment instruction, modern efficacy claim, dose, or safety conclusion.
- Before rendering, run a clause check: every visible original clause must have a corresponding modern clause; confirm that no `今译` sentence begins by summarizing or evaluating the passage instead of translating it.

## Template And Audio Boundaries

- Create or edit only the finished composition and its focused tests. The shared layer a finished film may build on is `src/finished-shell.tsx` (`FinishedFilm`, `FinishedMusic`), `src/herbal-stage.tsx` (`SceneShell`, `Seal`, palette) and `src/herbal-cards.tsx` (`fade`, `rise`). Extend that layer only in backward-compatible ways — a new optional prop is fine, a changed default is not, because 55 published films render through it.
- `HerbalFeature`, `HerbProfileTemplate` and `FormulaShortTemplate` are legacy scaffolding: no finished film references them, and code-drawn illustration (`RootIllustration`) is forbidden. Do not use them as a starting point for a new film.
- Build the finished component on the shared shell: define `HeroScene` / `ClassicalScene` / `ClosingScene` as `React.FC<{ frame: number }>` scene parts, then render them through `FinishedFilm` from `src/finished-shell.tsx`. Never copy a `BackgroundMusic` / `SceneShell` wrapper into the film file. Keep `music={staticFile("music/…")}`, a `durationInFrames` literal (360 / 450 / 540) and the matching `breaks` array in the film file so tests, `npm run check` and `npm run gen` keep working.
- Register the film with `npm run gen` instead of hand-editing `src/Composition.tsx`.
- When a film needs more room, raise the duration and add a scene plus its break. `FinishedFilm` takes any number of scenes as long as `breaks.length === scenes.length - 1`.
- Store music under `public/music`; use `Audio` with `staticFile`, `trimAfter={durationInFrames}`, and gentle fade-in/out at a low background volume.
- Keep a disclaimer such as `古籍内容展示，不构成诊疗建议` whenever a historical source describes medicinal use.

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
3. Run `npm run check` (or `npm run check -- --film=<CompositionId>`). It applies the compliance rules, the repeated-text scan, and the upload-ledger check. A new film that fails any of these cannot be rendered.
4. Run `npm run verify -- --film=<CompositionId>`: it re-runs the rule check as a pre-flight, renders hero/source/closing stills to `out/stills/`, exports `out/<name>.mp4`, and asserts the container facts via `npx remotion ffprobe` — 1080x1920, 30fps, H.264 video, AAC audio, a duration matching the composition, and a plausible file size. Add `--sheet` (optionally `--sheet=20`) to sample a contact sheet instead of three frames; three frames out of 360 is a thin sample for a film whose main failure mode is text crowding mid-scene.
5. Inspect the stills yourself for subject, seal, pinyin, English, and Chinese readability on mobile; the script cannot judge that for you.
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
