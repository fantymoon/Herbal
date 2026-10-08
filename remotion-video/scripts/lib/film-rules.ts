// The rules that are about *facts*, shared by `npm run check` and `npm run verify`.
//
// They lived as two copies — one in each CLI — and the copies drifted: `verify` kept a
// weaker pre-flight, so a film could render through it with a music track missing from
// `src/music-registry.ts`, which is exactly the input the silent-`loop` bug needs. A rule
// implemented twice is a rule that is half-enforced, and nothing notices.
import { originProblems, quoteProblems, type Sutra } from "./corpus.ts";
import { checkLedgerCopy, readLedgerField, translationDrift } from "./ledger.ts";
import { trackOf } from "../../src/music.ts";
import type { FilmContent } from "../../src/layout.ts";

/**
 * What the film claims about the 经文, checked against the 经文.
 *
 * `facts` was the last block of on-screen prose outside any rule, and it is written from
 * memory: the scaffold derives 别名 and 篇目位置 out of the corpus but never derived 产地.
 * 大枣 shipped saying 池泽 under a citation of a text that says 生平泽 — the 生境 of 藕实茎,
 * the entry beside it. Every other block on that screen is a quotation; this one was a
 * recollection, and nothing compared the two. The quotation itself was never compared
 * either, which `quoteProblems` now does.
 */
export const factProblems = (
  sutras: ReadonlyMap<string, Sutra>,
  file: string,
  content: FilmContent,
): string[] => {
  const sutra = sutras.get(content.entry);
  if (!sutra) {
    // 29 of the 379 篇名 in this recension carry no 味…主… text to compare against, so the
    // gate cannot say anything about them. Saying "is not a 篇名" was wrong and sent the
    // reader hunting for a heading that is plainly there.
    return [`${file}: 「${content.entry}」 has no quotable 经文 in this recension — 产地 and 引文 unchecked`];
  }
  return [
    ...originProblems(content.facts, sutra),
    ...quoteProblems(content.original, sutra, content.commentary),
  ].map((problem) => `${file}: ${problem}`);
};

/**
 * The track a film names has to be one `npm run sync-music` has measured.
 *
 * Not bookkeeping. `FinishedMusic` only consults the registry when it has to loop, and an
 * unregistered track under `loop` throws — that is the loud version of this mistake. The
 * quiet version already shipped: a six-minute film whose 4:16 bed ran out and left the last
 * 1:46 playing against digital silence, because `loop` silently degenerates into "play
 * once" when it cannot work out how long the track is.
 */
export const musicProblems = (file: string, content: FilmContent): string[] =>
  trackOf(content.music) === null
    ? [`${file}: music「${content.music}」 is not in src/music-registry.ts — run \`npm run sync-music\``]
    : [];

/**
 * The ledger's own claims, checked against the film.
 *
 * Two of these are about *drift*, not absence: `BGM：` and the 今译 line are written at
 * scaffold time and `npm run ledger` never overwrites a filled field, so the record keeps
 * naming what the first run said while the content module moves on. The ledger is the only
 * answer to "what did that master actually carry", which makes it something to check rather
 * than trust.
 */
export const ledgerProblems = (
  kebab: string,
  filmId: string,
  content: FilmContent,
  copy: string,
): string[] => {
  const problems: string[] = [];
  // Only the fields the scaffold actually writes. 抖音：/视频号： were dropped from
  // `ledger.ts` when the workflow stopped recording publication state — but this list
  // kept demanding them, and the demand never fired because a master on disk short-circuits
  // the ledger check. Every film had a master, so the gate sat one render away from failing
  // every new film on a field nobody writes. Caught by moving one master aside and watching
  // it FAIL.
  for (const field of ["film:", "标题：", "描述：", "话题：", "BGM："]) {
    if (!copy.includes(field)) {
      problems.push(`upload/films/${kebab}.md is missing "${field}"`);
    }
  }
  if (!copy.includes(filmId)) {
    problems.push(`upload/films/${kebab}.md does not name the film id ${filmId}`);
  }
  const bgm = readLedgerField(copy, "BGM");
  if (bgm !== "" && !bgm.includes(content.music)) {
    const named = /`([^`]+)`/.exec(bgm)?.[1] ?? bgm;
    problems.push(`upload/films/${kebab}.md names ${named} but the film uses ${content.music}`);
  }
  const drift = translationDrift(content, copy);
  if (drift !== null) problems.push(`upload/films/${kebab}.md ${drift}`);
  // The copy is what the platforms read, and it used to be the only prose in the repo that
  // no rule looked at.
  for (const problem of checkLedgerCopy(copy)) {
    problems.push(`upload/films/${kebab}.md ${problem}`);
  }
  return problems;
};
