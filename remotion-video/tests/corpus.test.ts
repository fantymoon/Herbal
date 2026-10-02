import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  GAP_MARK,
  defectOf,
  findEntries,
  originOf,
  originProblems,
  readCorpus,
  sutraOf,
} from "../scripts/lib/corpus.ts";

// The corpus is read-only source material, so these tests assert against the real file
// rather than a fixture. A fixture would have let the multi-line bug through: the bug
// was never in the parsing *rules*, it was that the caller only looked at one line.
const repo = new URL("../", import.meta.url);
const source = fileURLToPath(new URL("../TCM-Ancient-Books-master/000-神农本草经.txt", repo));
const entries = findEntries(readCorpus(source));
const byName = (name: string) => {
  const found = entries.filter((e) => e.name === name);
  assert.equal(found.length, 1, `expected exactly one 篇名 "${name}", got ${found.length}`);
  return found[0];
};

test("the corpus decodes as GB18030, not UTF-8", () => {
  // The reason every doc that said "search with rg" was wrong. `rg` reads these bytes as
  // UTF-8, matches no Chinese at all, and reports "not found" for text that is there.
  const lines = readCorpus(source);
  assert.ok(lines.some((l) => l.includes("神农本草经")), "the title should decode");
});

test("a 经文 that wraps across lines is read whole", () => {
  // 决明子's 内容 block spans two lines and its 经文 ends on the second. Reading only the
  // first produced "主青盲、…益精光（《太平御览》" — a sentence that reads as if complete.
  const sutra = byName("决明子").sutra.text;
  assert.ok(sutra.includes("轻身"), `lost the clause after the wrap: ${sutra}`);
  assert.ok(sutra.includes("生川泽"), `lost the habitat: ${sutra}`);
  assert.ok(!sutra.includes("太平御览"), "the 校注 is not part of the 经文");
  assert.equal(sutra, "味咸，平。主青盲、目淫、肤赤、白膜、眼赤痛、泪出。久服，益精光，轻身。生川泽。");
});

test("an inline editorial note is removed without dropping what follows", () => {
  // 防风 carries "骨节疼痹（《御览》作痛），烦满" and "一名铜芸（《御览》作芒）。生川泽。"
  // Cutting at the bracket instead of deleting it loses 烦满 and the habitat.
  const sutra = byName("防风").sutra.text;
  assert.ok(sutra.includes("烦满"), `lost the clause after the note: ${sutra}`);
  assert.ok(sutra.includes("一名铜芸"), `lost the alias: ${sutra}`);
  assert.ok(sutra.includes("生川泽"), `lost the habitat: ${sutra}`);
  assert.ok(!sutra.includes("御览"), "the 校注 is not part of the 经文");
});

test("a dropped character is flagged, with the context that shows it", () => {
  // 龙骨 reads "主小儿、大人惊痫 疾狂走" in the recension. Welding the space shut yields a
  // fluent sentence that is missing a character — the one defect a reader cannot see.
  const { sutra } = byName("龙骨");
  assert.equal(sutra.gaps.length, 1, `expected one gap, got ${JSON.stringify(sutra.gaps)}`);
  assert.match(sutra.gaps[0], /惊痫□疾狂走/, "the context should show the hole");
  assert.ok(sutra.text.includes(GAP_MARK), "the marker survives into the text");
  assert.match(defectOf(sutra) ?? "", /缺字/);
});

test("a dropped character next to punctuation is flagged too", () => {
  // 黄连's gap follows 、, so requiring a Han character on both sides missed it entirely.
  const { sutra } = byName("黄连");
  assert.equal(sutra.gaps.length, 1, `expected one gap, got ${JSON.stringify(sutra.gaps)}`);
  assert.match(sutra.gaps[0], /目痛、□伤泣出/);
});

test("a 经文 cut off mid-sentence is flagged as truncated", () => {
  // 卷柏 ends on a conjunction: "…久服，轻身、和《吴普》曰". Not a short entry — a defect.
  const { sutra } = byName("卷柏");
  assert.equal(sutra.dangling, true);
  assert.match(defectOf(sutra) ?? "", /断在连接词上/);
});

test("a clean entry reports no defect", () => {
  // The positive case, so `defectOf` is not a function that always says yes.
  const { sutra } = byName("决明子");
  assert.equal(defectOf(sutra), null);
  assert.deepEqual(sutra.gaps, []);
  assert.equal(sutra.dangling, false);
});

test("the appendix sections are not entries", () => {
  // 诸药制使's lines are "内容：龙骨 得人参、牛黄，良；畏石膏。" — a list of pairings with
  // no 味 and no 主. Treating one as an entry would put a fragment on screen.
  for (const name of ["龙骨", "玉泉"]) {
    const found = entries.filter((e) => e.name === name);
    assert.equal(found.length, 1, `${name} should appear exactly once, as a real entry`);
  }
  const bodies = entries.map((e) => e.sutra.text);
  assert.ok(
    !bodies.some((t) => t.includes("得人参")),
    "an appendix pairing leaked in as a 经文",
  );
});

test("every entry carries a 味 and a 主, and a volume", () => {
  assert.ok(entries.length > 300, `expected the full book, got ${entries.length}`);
  for (const entry of entries) {
    assert.match(entry.sutra.text, /味/, `${entry.name} has no 味`);
    assert.match(entry.sutra.text, /主/, `${entry.name} has no 主`);
    assert.ok(entry.volume, `${entry.name} has no <目录>`);
  }
});

test("a body with no 经文 is rejected rather than guessed at", () => {
  assert.equal(sutraOf("内容：（旧作矾石，据郭璞注，《山海经》引作涅石）"), null);
  assert.equal(sutraOf("内容：上药一百二十种，为君，主养命以应天，无毒。"), null);
  assert.equal(sutraOf(""), null);
});

// ---- The 产地 a film shows is a quotation, not a recollection ------------------

test("the 生境 is read out of the 经文", () => {
  assert.equal(originOf(byName("大枣").sutra), "平泽");
  assert.equal(originOf(byName("藕实茎").sutra), "池泽");
  assert.equal(originOf(byName("龙眼").sutra), "山谷");
  // 黄芝's 经文 stops at 一名金芝 — 别录 supplies its 生境, so there is nothing to quote.
  assert.equal(originOf(byName("黄芝").sutra), null);
  assert.ok(
    entries.filter((e) => originOf(e.sutra) !== null).length > 250,
    "most entries name a 生境; a drop means the extraction stopped matching",
  );
});

test("a 产地 the 经文 does not name is reported", () => {
  const dazao = byName("大枣").sutra;
  // The bug this rule exists for: 池泽 is 藕实茎's 生境, one entry away in the corpus,
  // and it sat on 大枣's closing screen under a citation of a text that says 平泽.
  assert.deepEqual(originProblems([{ label: "产地", value: "池泽" }], dazao), [
    "产地「池泽」 is not named by the 经文, which says 生平泽",
  ]);
  assert.deepEqual(originProblems([{ label: "产地", value: "平泽" }], dazao), []);
  // A place the 经文 merely omits is not this rule's business: 别录 names 黄芝's 嵩山.
  assert.deepEqual(originProblems([{ label: "产地", value: "嵩山" }], byName("黄芝").sutra), [
    "产地「嵩山」 is not named by the 经文, which names no 生境",
  ]);
  // No 产地 fact, nothing to check — and the other facts are not places.
  assert.deepEqual(originProblems([{ label: "部类", value: "果部" }], dazao), []);
  assert.deepEqual(originProblems([], dazao), []);
});

test("no film on screen names a 产地 its 经文 does not", () => {
  // The same question `npm run check` asks, asked of every content module so that a
  // regression is caught by `npm test` too. `check` skips films that are already
  // published; this does not, because the point here is to keep the known ones visible.
  const filmsDir = fileURLToPath(new URL("src/films/", repo));
  const stray = [];
  for (const file of readdirSync(filmsDir).filter((f) => f.endsWith(".ts"))) {
    const text = readFileSync(`${filmsDir}${file}`, "utf8");
    const entry = /^\s*entry:\s*"([^"]+)"/m.exec(text)?.[1];
    const origin = /label:\s*"产地",\s*value:\s*"([^"]+)"/.exec(text)?.[1];
    if (!entry || !origin) continue;
    const sutra = entries.find((e) => e.name === entry)?.sutra;
    if (!sutra || sutra.text.includes(origin)) continue;
    stray.push(`${file}: ${entry} 产地=${origin}, 经文 says 生${originOf(sutra) ?? "—"}`);
  }
  // 蓝实, 紫芝 and 黄芝 are live on 抖音 and carry this defect. A published master cannot
  // be recalled, so they are named here instead of quietly rewritten — the same reason
  // `FROZEN_FILMS` is a snapshot. This list may only shrink, and it shrinks by retiring a
  // film and redoing it, never by editing the expectation to match a new film.
  assert.deepEqual(stray, [
    "huangzhi-first-film.ts: 黄芝 产地=嵩山, 经文 says 生—",
    "lanshi-first-film.ts: 蓝实 产地=河内, 经文 says 生平泽",
    "zizhi-first-film.ts: 紫芝 产地=高夏, 经文 says 生山谷",
  ]);
});
