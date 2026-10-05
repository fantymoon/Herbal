// The order the audience will meet the films in.
//
// `progress.json` runs in 卷次 order and is the *production* order — it exists so nothing
// gets skipped. `publish-plan.md` is the order the films go out in, grouped into themed
// collections. The two are different, and treating one as the other produces a wrong answer
// that looks right: walking the book order, the fourteen new films looked like they repeated
// their BGM eight times in a row. Walking the publish order, the first batch alternates
// cleanly, because that is how it was assigned. The number was never wrong; the sequence was.
//
// Parsed from the markdown table rather than duplicated here, because a second copy of the
// order would drift from the document the publishing actually follows.
import fs from "node:fs";

export type PlannedEntry = {
  /** The 条目 name as the plan writes it. */
  entry: string;
  /** The plan's own numbering, 1-based. */
  order: number;
};

/**
 * The 条目 in publish order, read out of the plan's tables.
 *
 * A table row is `| 1 | 大枣 | 卷一·上经 | A | … | 450 |`; headers and separators have a
 * non-numeric first cell and fall out on their own. Rows are sorted by their own number
 * rather than by position, so re-ordering the document's sections cannot silently re-order
 * the schedule.
 */
export const readPublishPlan = (planPath: string): PlannedEntry[] => {
  const text = fs.readFileSync(planPath, "utf8");
  const seen = new Map<number, string>();
  for (const line of text.split(/\r?\n/)) {
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 4) continue;
    const order = Number(cells[1]);
    if (!Number.isInteger(order) || order <= 0) continue;
    const entry = cells[2];
    if (entry === "" || /^[-:]+$/.test(entry)) continue;
    seen.set(order, entry);
  }
  return [...seen.entries()]
    .map(([order, entry]) => ({ order, entry }))
    .sort((a, b) => a.order - b.order);
};

/**
 * Plan rows that share a music track with the row right before them.
 *
 * Adjacency means adjacency *in the plan*, not in the subsequence that happens to have
 * films. Two rows separated by a row that has not been shot yet are not yet consecutive
 * for anyone, and once that row is shot they will not be — so flagging them would be a
 * false alarm, and a gate that cries wolf is a gate people stop reading.
 */
export const adjacentTrackRepeats = (
  planned: readonly PlannedEntry[],
  trackByEntry: ReadonlyMap<string, string>,
): string[] => {
  const problems: string[] = [];
  let previous: PlannedEntry | null = null;
  for (const row of planned) {
    const track = trackByEntry.get(row.entry);
    const before = previous ? trackByEntry.get(previous.entry) : undefined;
    if (track && before && track === before) {
      problems.push(
        `publish order ${previous?.entry} -> ${row.entry} (row ${row.order}) both use ${track}; ` +
          `two videos a viewer may see back to back should not sound the same`,
      );
    }
    previous = row;
  }
  return problems;
};
