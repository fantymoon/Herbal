import test from "node:test";
import assert from "node:assert/strict";
import {
  auditFilm,
  auditHandWritten,
  dispositionOf,
  formatAuditMarkdown,
  formatAuditTable,
  summarizeAudit,
} from "../scripts/lib/published-audit.ts";
import { content as huangzhi } from "../src/films/huangzhi-first-film.ts";

// A hand-written film in the published shape: three scenes, copy on its own line
// between the tags. The old text extractor needed the text on the same line as the
// tags, so a fixture like this is what proves the audit reads real published films.
const published = `
const HeroScene: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <div>
      味甘，平。
    </div>
  </>
);

const ClassicalScene: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <div>
      主胸中结，益心气，补中，增智慧，不忘。久食，轻身、不老、延年、神仙。
    </div>
    <div>
      主治胸中结，益心气，补中，增长智慧、不忘。久食，身轻、不老、延年。
    </div>
  </>
);

const ClosingScene: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <div>
      古籍内容展示，不构成诊疗建议
    </div>
  </>
);

export const XFirstFilm: React.FC = () => (
  <FinishedFilm
    durationInFrames={360}
    breaks={[120, 240]}
    scenes={[HeroScene, ClassicalScene, ClosingScene]}
  />
);
`;

test("the audit reads a hand-written film's text off its own lines", () => {
  const { duration, screens } = auditHandWritten("x-first-film.tsx", published);
  assert.equal(duration, 360);
  assert.equal(screens.length, 3);
  // Chinese characters only — punctuation is not read — and each scene gets
  // 120 frames = 4 seconds.
  assert.equal(screens[0].chars, 3);
  assert.equal(screens[1].chars, 48);
  assert.equal(screens[2].chars, 13);
  assert.equal(screens[1].frames, 120);
  assert.equal(Number(screens[1].rate.toFixed(1)), 12.0);
});

test("the audit reports what a published master is missing", () => {
  const row = auditFilm("x-first-film.tsx", published, null, true);
  assert.equal(row.frozen, true);
  assert.equal(row.historicalFrame, false, "the fixture never opens a 今译 with 古籍称其主");
  assert.equal(row.historicalNote, false, "the fixture carries no historical note");
  assert.equal(row.zhuzhi, true, "the fixture says 主治, which is what the platform flagged");
  assert.deepEqual(row.banned, []);
  assert.equal(Number(row.worstRate.toFixed(1)), 12.0);
});

test("a data-driven film is measured off its plan, not its JSX", () => {
  // The wrapper has no Chinese in it at all, so an audit that only read JSX would
  // report this film as empty. Its content module is the only place the prose lives.
  const row = auditFilm("huangzhi-first-film.tsx", 'import { EntryFilm } from "../entry-film";', huangzhi, false);
  assert.equal(row.historicalFrame, true);
  assert.equal(row.historicalNote, true);
  assert.equal(row.zhuzhi, false);
  assert.equal(row.duration, 630);
  assert.ok(row.worstRate <= 15, `the compliant film asks for ${row.worstRate.toFixed(1)} chars/s`);
  assert.equal(row.screens.length, 4);
});

test("the audit table is worst screen first, with the entry named", () => {
  const rows = [
    auditFilm("a-first-film.tsx", published, null, true),
    auditFilm("huangzhi-first-film.tsx", "", huangzhi, false),
  ];
  const lines = formatAuditTable(rows);
  assert.equal(lines.length, 3);
  assert.ok(lines[0].startsWith("file\tdur"));

  const markdown = formatAuditMarkdown(rows, new Map([["huangzhi-first-film", "黄芝"]]));
  assert.ok(markdown[1].startsWith("| --- |"));
  // 黄芝's busiest screen is 13.2/s, the fixture's is 12.0/s, so the compliant film
  // leads a table sorted by how hard each one is to read.
  assert.ok(markdown[2].includes("黄芝"), "the worst screen must lead the table");
  assert.ok(markdown[2].includes("| 13.2 |"));
  assert.ok(markdown[3].includes("`a-first-film`"));
  assert.ok(markdown[3].includes("| 12.0 |"));
});

test("the disposition follows the reading load, not the wording", () => {
  // 主治 cannot rank the films (44 of 55 say it) and the historical framing cannot
  // either (none carry it), so the only thing left to sort them by is how hard the
  // film is to read.
  const at = (rate: number) => dispositionOf({ ...auditFilm("x-first-film.tsx", published, null, true), worstRate: rate });
  assert.equal(at(32.5), "重制");
  assert.equal(at(29.0), "观察");
  assert.equal(at(16.8), "留");
  assert.equal(at(12.0), "留");
});

test("the summary counts each gap rather than naming films", () => {
  const summary = summarizeAudit([
    auditFilm("a-first-film.tsx", published, null, true),
    auditFilm("huangzhi-first-film.tsx", "", huangzhi, false),
  ]);
  assert.ok(summary.includes("2 film(s)"));
  assert.ok(summary.includes("1 carry no 古籍称其主 frame"));
  assert.ok(summary.includes("1 still say 主治"));
  assert.ok(summary.includes("Disposition from reading load alone: 0 重制, 0 观察, 2 留"));
  assert.ok(summary.includes("0 contain a banned modern efficacy word"));
});
