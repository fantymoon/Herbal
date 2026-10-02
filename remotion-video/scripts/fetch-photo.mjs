// Fetch a real, openly-licensed photo for a film's framed insert.
//
// Why this exists: the skill's two documented channels — Wikimedia Commons and Openverse
// — both time out on this machine's proxy, so "download a photo by hand" was the one step
// in the pipeline that could not be done here, and every new film was blocked on it.
//
// iNaturalist is reachable, and its API hands back the licence and the attribution
// alongside the photo id, so the credit line is data rather than something to transcribe.
// The open-data bucket it points at serves the image at several sizes.
//
//   npm run fetch-photo -- --taxon="Ganoderma lucidum" --check
//   npm run fetch-photo -- --taxon="Ganoderma lucidum" --file=ganoderma-zizhi --pick=2
//
// Only CC0 / CC BY / CC BY-SA are accepted: the films are published on commercial
// platforms, so the -NC and -ND variants are not usable. `--check` reports coverage
// without downloading, which is how an entry gets chosen in the first place.
//
// Both `public/images/` and `credits.json` are written together, because
// tests/finished-video.test.ts asserts the ledger covers exactly the files on disk and
// that no entry is orphaned — a photo downloaded without a film to show it in is a
// broken build, not a spare asset.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Node's fetch ignores http_proxy unless it is told to read it, and spawning curl is
// blocked in this sandbox (EBUSY), so the proxy has to be opted into in-process.
// Set before the first fetch: undici builds its proxy agent lazily.
process.env.NODE_USE_ENV_PROXY = "1";

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const imagesDir = path.join(repo, "public", "images");
const creditsPath = path.join(imagesDir, "credits.json");

/** The insert is a 932x500 landscape crop; this is the source width it needs. */
const INSERT_WIDTH = 932;
/** iNaturalist's `large` caps the long side here. */
const LARGE_LONG_SIDE = 1024;

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return [m?.[1] ?? a, m?.[2] ?? true];
  }),
);

if (!args.taxon) {
  console.error(
    'usage: npm run fetch-photo -- --taxon="<Latin name>" --file=<ascii-name> [--check] [--pick=N | --id=<photoId>]',
  );
  process.exit(2);
}

/**
 * One request, retried.
 *
 * Everything here goes out through this machine's proxy, which resets a connection often
 * enough that a single ECONNRESET is noise, not a signal. Without the retry a flaky
 * second of proxy turns into "no usable photo for this taxon" — the same wrong answer
 * the missing extension used to give, and just as hard to tell apart from the truth.
 */
const get = async (url, as = "buffer") => {
  const attempts = Number(args.retries ?? 3);
  let last = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "WorkBuddy-Herbal/1.0" },
        signal: AbortSignal.timeout(Number(args.timeout ?? 90) * 1000),
      });
      return as === "json"
        ? await res.json()
        : { status: res.status, body: Buffer.from(await res.arrayBuffer()) };
    } catch (error) {
      last = error;
      if (attempt < attempts) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }
  throw last;
};

const LICENSES = [
  { code: "cc0", label: "CC0", rank: 0 },
  { code: "cc-by", label: "CC BY", rank: 1 },
  { code: "cc-by-sa", label: "CC BY-SA", rank: 2 },
];

/** "(c) Elena_Sherehora, some rights reserved (CC BY)" -> "Elena_Sherehora". */
const authorOf = (attribution) => {
  const m = /^(?:\(c\)|©)\s*([^,]+?)(?:\s*,\s*(?:some|no) rights reserved.*)?$/.exec(attribution ?? "");
  return m ? m[1].trim() : null;
};

const query = new URL("https://api.inaturalist.org/v1/observations");
query.searchParams.set("taxon_name", args.taxon);
query.searchParams.set("photo_license", LICENSES.map((l) => l.code).join(","));
query.searchParams.set("per_page", "50");
query.searchParams.set("order_by", "votes");
query.searchParams.set("order", "desc");
// A hero insert has to show what the entry *is*. For a fruit entry, foliage does not —
// 龙眼's default ranking returns 96 usable photos and the first ten are all leaves, because
// the ranking can only see orientation, resolution and licence. iNaturalist's plant
// phenology annotation is the one signal that says "this photo has the fruit in it", so
// ask for it directly: term 12 is Plant Phenology, value 14 is Fruiting.
if (args.fruiting) {
  query.searchParams.set("term_id", "12");
  query.searchParams.set("term_value_id", "14");
}

const payload = await get(query.href, "json");
const candidates = [];
for (const observation of payload.results ?? []) {
  for (const photo of observation.photos ?? []) {
    const license = LICENSES.find((l) => l.code === photo.license_code);
    const dims = photo.original_dimensions;
    if (!license || !dims) continue;
    const landscape = dims.width >= dims.height;
    // `large` is enough whenever it still covers the insert: 1024 wide for a landscape
    // original, proportionally less for a portrait one. Downloading `original` when
    // `large` would do costs four times the bytes over a slow proxy for no visible gain.
    const largeWidth = landscape
      ? LARGE_LONG_SIDE
      : Math.round((LARGE_LONG_SIDE * dims.width) / dims.height);
    candidates.push({
      id: photo.id,
      license,
      author: authorOf(photo.attribution),
      observer: observation.user?.name || observation.user?.login || null,
      attribution: photo.attribution,
      width: dims.width,
      height: dims.height,
      landscape,
      size: largeWidth >= INSERT_WIDTH ? "large" : "original",
      largeWidth,
      observation: observation.id,
      taxon: observation.taxon?.name ?? args.taxon,
      // The bucket serves .jpg for some photos and .jpeg for others, and there is no rule
      // to it — 166792593 is .jpeg, 585667156 is .jpg, both CC BY and both in the same
      // bucket. Hardcoding either extension silently halves the catalogue: an entire
      // taxon can look like it has no downloadable photo when it has a hundred. The API
      // already tells us which one this photo uses, so read it off `photo.url` instead
      // of guessing, and keep the other as a fallback for when the two disagree.
      ext: /\.(jpe?g)$/i.exec(photo.url ?? "")?.[1] ?? "jpg",
    });
  }
}

// Landscape first: the insert is a wide crop, so a portrait original loses its subject to
// the centre crop and no amount of resolution buys it back. Then resolution, then licence
// rank — CC0 is a convenience, not a reason to pick a worse photograph.
candidates.sort(
  (a, b) =>
    Number(b.landscape) - Number(a.landscape) ||
    b.width * b.height - a.width * a.height ||
    a.license.rank - b.license.rank,
);

const usable = candidates.filter((c) => c.largeWidth >= 700);

if (args.check) {
  console.log(`${args.taxon}: ${payload.total_results} observation(s), ${candidates.length} open-licensed photo(s), ${usable.length} usable`);
  // Ten is the default because the list is metadata, not pictures — but a taxon whose
  // whole top ten is leaves needs a longer list to pick from, not a different tool.
  const limit = Number(args.list ?? 10);
  if (!Number.isFinite(limit) || limit <= 0) {
    console.error("--list takes a positive count, e.g. --list=25");
    process.exit(2);
  }
  for (const c of usable.slice(0, limit)) {
    console.log(
      `  [${usable.indexOf(c)}] ${c.id}  ${c.width}x${c.height} ${c.landscape ? "landscape" : "portrait "} ` +
        `${c.size.padEnd(8)} ${c.license.label.padEnd(9)} ${c.author ?? c.observer ?? "(no author)"}`,
    );
  }
  process.exit(usable.length > 0 ? 0 : 1);
}

if (!args.file) {
  console.error("--file=<ascii-name> is required (the name the film will reference)");
  process.exit(2);
}

if (usable.length === 0) {
  console.error(`no usable open-licensed photo for "${args.taxon}"`);
  process.exit(1);
}

// `--id` names one photo from a `--check` listing. The automatic order is a heuristic
// (landscape, then resolution, then licence) and it cannot tell that a cluttered frame
// of leaves makes a worse hero insert than a clean one of the whole plant in flower —
// so picking by eye and then fetching that exact photo has to be possible.
const order =
  args.id !== undefined
    ? candidates.filter((c) => String(c.id) === String(args.id))
    : args.pick !== undefined
      ? [usable[Number(args.pick)]].filter(Boolean)
      : usable.slice(0, 6);

if (order.length === 0) {
  console.error(
    args.id !== undefined
      ? `no candidate with photo id ${args.id} for "${args.taxon}" — run --check for the list`
      : `no usable open-licensed photo for "${args.taxon}"`,
  );
  process.exit(1);
}

let chosen = null;
let bytes = null;
for (const candidate of order) {
  const other = candidate.ext === "jpg" ? "jpeg" : "jpg";
  for (const ext of [candidate.ext, other]) {
    const url = `https://inaturalist-open-data.s3.amazonaws.com/photos/${candidate.id}/${candidate.size}.${ext}`;
    try {
      const { body } = await get(url);
      // A 404 from the bucket is XML and an error page is HTML; only a JPEG is a photo.
      if (body.length > 100_000 && body[0] === 0xff && body[1] === 0xd8) {
        chosen = candidate;
        bytes = body;
        break;
      }
    } catch (error) {
      console.warn(`  ${candidate.id}.${ext}: ${error.name} — trying the next candidate`);
    }
  }
  if (chosen) break;
}

if (!chosen) {
  console.error(`found ${usable.length} candidate(s) for "${args.taxon}" but none downloaded`);
  process.exit(1);
}

// `--file` is a stem, not a filename: the extension is always .jpg. Stripping one if the
// caller passed it anyway, because `--file=x.jpg` used to produce `x.jpg.jpg` — which
// then has to match a credits.json entry exactly, so the typo travels into the ledger.
const stem = String(args.file ?? `${args.taxon.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`)
  .replace(/\.(jpe?g|png)$/i, "");
const file = `${stem}.jpg`;
fs.mkdirSync(imagesDir, { recursive: true });
fs.writeFileSync(path.join(imagesDir, file), bytes);

// The subject line on screen is the scientific name, upper-cased — same shape as the
// 55 published films. Overridable because the corpus name and the sequenced species do
// not always agree (神农本草经's 紫芝 is Ganoderma sinense, not G. lucidum).
//
// The author falls back to the observer: a CC0 photo often carries no "(c) Name" at all,
// and a blank author makes the film print "PUBLIC DOMAIN / CC0", which reads as two
// licences. Crediting the observer is also just true.
const entry = {
  file,
  subject: (args.subject ?? chosen.taxon).toUpperCase(),
  author: (chosen.author ?? chosen.observer ?? "").toUpperCase() || null,
  license: chosen.license.label,
};

const ledger = JSON.parse(fs.readFileSync(creditsPath, "utf8"));
const next = [...ledger.filter((e) => e.file !== file), entry].sort((a, b) =>
  a.file.localeCompare(b.file),
);
const line = (e) =>
  `  { "file": ${JSON.stringify(e.file)}, "subject": ${JSON.stringify(e.subject)}, ` +
  `"author": ${e.author === null ? "null" : JSON.stringify(e.author)}, "license": ${JSON.stringify(e.license)} }`;
fs.writeFileSync(creditsPath, `[\n${next.map(line).join(",\n")}\n]\n`);

console.log(`wrote public/images/${file}  ${chosen.size}  ${chosen.width}x${chosen.height}  ${(bytes.length / 1024).toFixed(0)}KB`);
console.log(`credits.json: ${JSON.stringify(entry)}`);
console.log(`source: https://www.inaturalist.org/photos/${chosen.id} (observation ${chosen.observation})`);
