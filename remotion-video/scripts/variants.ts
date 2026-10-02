// Where does the 底本 stand alone in its reading?
//
//   npm run variants            # every entry that has a counterpart in 证类本草
//   npm run variants -- --all   # also print the pairs the corpus backs on both sides
//
// `corpus.ts` catches a character the recension *lost* — it leaves a space, and a space
// inside a line is not typography. It cannot catch a character the recension got *wrong*:
// 大枣's 「肋十二经」 for 「助十二经」 reads as valid Chinese and sat in the corpus unnoticed
// until a film was being made from it.
//
// Two weaker tests came first, and both are in here as the reason this one is shaped the
// way it is. "Diff against 证类本草" flags 174 places, but almost all are 异体字 (创/疮,
// 利/痢, 藏/脏) or the 辑本 folding 别录 material into the 经文 — treating every
// disagreement as an error would mean rewriting the text. "Windows attested nowhere else"
// flags 291 of 377 entries, because a phrase can be unique to this book without being
// wrong.
//
// What isolates a real 讹字 needs both halves: the 底本 and 证类 disagree on the character
// AND the corpus overwhelmingly backs 证类. 大枣's 养脾，肋十二经 appears in 0 other files;
// 养脾，助十二经 in 7.
//
// The filter is deliberately loose. 创/疮, 利/痢, 注/疰 are 古今字 — the 底本's reading is
// defensible — yet they survive, because as *windows* the 底本's spelling is rare in the
// corpus. Tightening until only 讹字 remain would mean encoding a judgement about every
// pair into the filter, and then the report would only ever show what I already believe.
// So it prints 24 and leaves the sorting to the eye.
//
// This reports; it does not fail. Detection is mechanical, but deciding whether a flagged
// pair is a 讹字 or a 古今字 is a judgement about the word — and 24 across 356 entries is
// read in a minute.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return [m?.[1] ?? a, m?.[2] ?? true];
  }),
);

const root = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "TCM-Ancient-Books-master",
);
const base = path.join(root, "000-神农本草经.txt");
const witness = path.join(root, "645-证类本草.txt");

const CJK = /[\u4e00-\u9fff]/;

const decode = (p: string): string => new TextDecoder("gb18030").decode(fs.readFileSync(p));
const clean = (s: string): string => s.replace(/（[^）]*）/g, "").replace(/\s/g, "");

const readEntries = (file: string, opens: RegExp, stop: (s: string) => boolean): Map<string, string> => {
  const lines = decode(file).split("\n").map((s) => s.replace(/\r/g, ""));
  const out = new Map<string, string>();
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(/^<篇名>(.+)$/);
    if (!m) continue;
    const at = lines.findIndex((l, k) => k > i && opens.test(l.trim()));
    if (at === -1) continue;
    let text = lines[at].trim().replace(opens, "");
    for (let k = at + 1; k < lines.length; k += 1) {
      const next = lines[k].trim();
      if (next === "" || stop(next)) break;
      text += next;
    }
    out.set(m[1].trim(), clean(text));
  }
  return out;
};

const a = readEntries(base, /^内容：/, (s) => s.startsWith("<") || s.startsWith("《") || s.startsWith("案"));
const b = readEntries(witness, /^味[甘苦辛酸咸涩]/, (s) => s.startsWith("<") || s.startsWith("\\x") || s.startsWith("陶隐居"));

/** Character-level LCS, returning aligned pairs so a disagreement keeps its context. */
const align = (x: string, y: string): { x: number; y: number }[] => {
  const n = x.length;
  const m = y.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] = x[i] === y[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const pairs: { x: number; y: number }[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (x[i] === y[j]) {
      pairs.push({ x: i, y: j });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      pairs.push({ x: i, y: -1 });
      i += 1;
    } else {
      pairs.push({ x: -1, y: j });
      j += 1;
    }
  }
  while (i < n) pairs.push({ x: i++, y: -1 });
  while (j < m) pairs.push({ x: -1, y: j++ });
  return pairs;
};

const CONTEXT = 3;
const suspects: { name: string; from: string; to: string; here: string; there: string }[] = [];
const windows = new Set<string>();

for (const [name, text] of a) {
  const other = b.get(name);
  if (other === undefined) continue;
  const pairs = align(text.slice(0, 40), other.slice(0, 120));
  for (let k = 0; k < pairs.length - 1; k += 1) {
    const del = pairs[k];
    const ins = pairs[k + 1];
    if (del.x === -1 || del.y !== -1 || ins.x !== -1 || ins.y === -1) continue;
    const lo = Math.max(0, del.x - CONTEXT);
    const hi = Math.min(text.length, del.x + CONTEXT + 1);
    const here = text.slice(lo, hi);
    const there = `${text.slice(lo, del.x)}${other[ins.y]}${text.slice(del.x + 1, hi)}`;
    if (here.length < CONTEXT * 2 + 1 || there.length < CONTEXT * 2 + 1) continue;
    suspects.push({ name, from: text[del.x], to: other[ins.y], here, there });
    windows.add(here);
    windows.add(there);
  }
}

const files = fs.readdirSync(root).filter((f) => f.endsWith(".txt") && path.join(root, f) !== base);
const count = new Map<string, number>();
for (const gram of windows) count.set(gram, 0);
for (const file of files) {
  const text = clean(decode(path.join(root, file)).replace(/\r/g, ""));
  for (const gram of windows) {
    if (text.includes(gram)) count.set(gram, (count.get(gram) ?? 0) + 1);
  }
}

/** A 讹字 is a Chinese character written as another; a 、／， swap is style, not error. */
const isCharacter = (s: { from: string; to: string }): boolean =>
  CJK.test(s.from) && CJK.test(s.to);

const scored = suspects.filter(isCharacter);
const flagged = scored.filter(
  (s) => (count.get(s.there) ?? 0) >= 5 && (count.get(s.here) ?? 0) <= 1,
);

const shown = args.all === true ? scored : flagged;
const at = (s: { here: string; there: string }, which: "here" | "there"): number =>
  count.get(which === "here" ? s.here : s.there) ?? 0;

console.log(
  `${suspects.length} disagreements between 底本 and 证类本草, ${scored.length} between two characters`,
);
console.log(
  `${flagged.length} where the corpus backs 证类 and not the 底本` +
    (args.all === true ? ` (showing all ${scored.length})` : "") +
    "\n",
);
for (const s of shown) {
  const mark = flagged.includes(s) ? "  ← " : "    ";
  console.log(
    `${s.name}：底本「${s.here}」(${at(s, "here")} 处) ／ 证类「${s.there}」(${at(s, "there")} 处)` +
      `${mark}「${s.from}」应为「${s.to}」`,
  );
}
