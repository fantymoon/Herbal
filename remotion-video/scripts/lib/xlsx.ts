// A minimal .xlsx reader.
//
// The platform exports a spreadsheet and nothing else, and the alternative to reading
// it here is a dependency the size of the renderer, or asking a human to re-save it as
// CSV every week. An .xlsx is a zip of XML, so this walks the zip's central directory
// and inflates the two parts that matter: `sharedStrings.xml` and the first worksheet.
//
// It handles what a platform export contains — shared strings, inline strings, numbers
// and empty cells — and nothing else. Formulas, styles and multiple sheets are ignored
// on purpose; a missing cell reads as null rather than throwing.
import { inflateRawSync } from "node:zlib";

const EOCD_SIG = 0x06054b50;
const CENTRAL_SIG = 0x02014b50;

type ZipEntry = { name: string; offset: number; compressedSize: number; method: number };

const findEndOfCentralDirectory = (buf: Buffer): number => {
  // The comment can be up to 64KB, so the record is somewhere in the last 64KB + 22.
  const from = Math.max(0, buf.length - 0xffff - 22);
  for (let i = buf.length - 22; i >= from; i -= 1) {
    if (buf.readUInt32LE(i) === EOCD_SIG) {
      return i;
    }
  }
  return -1;
};

const readCentralDirectory = (buf: Buffer): ZipEntry[] => {
  const eocd = findEndOfCentralDirectory(buf);
  if (eocd === -1) {
    throw new Error("not a zip: no end-of-central-directory record");
  }
  const count = buf.readUInt16LE(eocd + 10);
  let at = buf.readUInt32LE(eocd + 16);
  const entries: ZipEntry[] = [];
  for (let i = 0; i < count; i += 1) {
    if (buf.readUInt32LE(at) !== CENTRAL_SIG) {
      throw new Error(`zip: bad central directory entry at ${at}`);
    }
    const method = buf.readUInt16LE(at + 10);
    const compressedSize = buf.readUInt32LE(at + 20);
    const nameLength = buf.readUInt16LE(at + 28);
    const extraLength = buf.readUInt16LE(at + 30);
    const commentLength = buf.readUInt16LE(at + 32);
    const offset = buf.readUInt32LE(at + 42);
    entries.push({
      name: buf.toString("utf8", at + 46, at + 46 + nameLength),
      method,
      compressedSize,
      offset,
    });
    at += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
};

const readEntry = (buf: Buffer, entry: ZipEntry): string => {
  const nameLength = buf.readUInt16LE(entry.offset + 26);
  const extraLength = buf.readUInt16LE(entry.offset + 28);
  const start = entry.offset + 30 + nameLength + extraLength;
  const raw = buf.subarray(start, start + entry.compressedSize);
  // 0 = stored, 8 = deflate. Anything else is not something a spreadsheet export uses.
  return (entry.method === 0 ? raw : inflateRawSync(raw)).toString("utf8");
};

const decodeXml = (text: string): string =>
  text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    // Ampersand last, or "&amp;lt;" would decode twice.
    .replace(/&amp;/g, "&");

/** Column letters to a zero-based index: A -> 0, AA -> 26. */
export const columnIndex = (ref: string): number => {
  const letters = ref.match(/^[A-Z]+/)?.[0] ?? "A";
  let index = 0;
  for (const ch of letters) {
    index = index * 26 + (ch.charCodeAt(0) - 64);
  }
  return index - 1;
};

const sharedStrings = (xml: string | null): string[] => {
  if (!xml) {
    return [];
  }
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((si) =>
    decodeXml([...si[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join("")),
  );
};

const firstSheetPath = (workbook: string, rels: string | null): string => {
  const id = workbook.match(/<sheet[^>]*r:id="([^"]+)"/)?.[1];
  const target = id
    ? rels?.match(new RegExp(`Id="${id}"[^>]*Target="([^"]+)"`))?.[1]
    : null;
  if (!target) {
    return "xl/worksheets/sheet1.xml";
  }
  return target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^\.\//, "")}`;
};

/**
 * The first worksheet as a grid of strings and numbers, empty cells included.
 *
 * Rows are padded to the widest row so a caller can index by column without checking
 * every row's length — a platform export has trailing empties that would otherwise
 * shift a column.
 */
export const readXlsx = (file: Buffer): (string | number | null)[][] => {
  const entries = readCentralDirectory(file);
  const find = (name: string): ZipEntry | undefined => entries.find((e) => e.name === name);
  const workbookEntry = find("xl/workbook.xml");
  const shared = sharedStrings(find("xl/sharedStrings.xml") ? readEntry(file, find("xl/sharedStrings.xml")!) : null);
  const sheetPath = workbookEntry
    ? firstSheetPath(
        readEntry(file, workbookEntry),
        find("xl/_rels/workbook.xml.rels") ? readEntry(file, find("xl/_rels/workbook.xml.rels")!) : null,
      )
    : "xl/worksheets/sheet1.xml";
  const sheet = find(sheetPath) ?? find("xl/worksheets/sheet1.xml");
  if (!sheet) {
    throw new Error(`xlsx: no worksheet found (looked for ${sheetPath})`);
  }

  const rows: (string | number | null)[][] = [];
  for (const row of readEntry(file, sheet).matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: (string | number | null)[] = [];
    for (const cell of row[1].matchAll(/<c\s+r="([A-Z]+\d+)"([^>]*)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const at = columnIndex(cell[1]);
      const type = cell[2].match(/t="([^"]+)"/)?.[1] ?? "n";
      const body = cell[3] ?? "";
      let value: string | number | null = null;
      if (type === "inlineStr") {
        value = decodeXml([...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join(""));
      } else {
        const raw = body.match(/<v>([\s\S]*?)<\/v>/)?.[1];
        if (raw !== undefined) {
          value = type === "s" ? (shared[Number(raw)] ?? null) : Number(raw);
        }
      }
      while (cells.length < at) {
        cells.push(null);
      }
      cells[at] = value === "" ? null : value;
    }
    rows.push(cells);
  }
  const width = rows.reduce((w, row) => Math.max(w, row.length), 0);
  return rows.map((row) => [...row, ...Array<null>(width - row.length).fill(null)]);
};
