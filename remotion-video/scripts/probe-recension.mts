// One-off probe: which single characters is the 底本 alone in reading?
//
// Two weaker probes came first. "Diff against 证类本草" flagged 174 places, but almost
// all are 异体字 (创/疮, 利/痢, 藏/脏) — variants, not errors. "Windows attested nowhere
// else" flagged 291 of 377 entries, because a phrase can be unique to this book without
// being wrong.
//
// The signal that actually isolates 大枣's 「肋十二经」 needs both halves: the 底本 and
// 证类 disagree on the character AND the corpus overwhelmingly backs 证类. 肋十二经
// appears in 2 files; 助十二经 in 53. A variant like 创/疮 is backed on both sides, so it
// drops out on its own.
import fs from "node:fs";
import path from "node:path";

const root = "D:/CodeProject/Herbal/TCM-Ancient-Books-master";
const base = path.join(root, "000-神农本草经.txt");
const witness = path.join(root, "645-证类本草.txt");

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

const flagged = suspects.filter(
  (s) => (count.get(s.there) ?? 0) >= 5 && (count.get(s.here) ?? 0) <= 1,
);

console.log(`${suspects.length} single-character disagreements between 底本 and 证类本草`);
console.log(`${flagged.length} where the corpus backs 证类 and not the 底本\n`);
for (const s of flagged) {
  console.log(`${s.name}：底本「${s.here}」(${count.get(s.here)} 处) ／ 证类「${s.there}」(${count.get(s.there)} 处)  ← 「${s.from}」应为「${s.to}」`);
}
