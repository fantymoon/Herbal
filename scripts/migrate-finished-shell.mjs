// Migrate src/finished/*.tsx to the shared FinishedFilm shell.
// Usage: node scripts/migrate-finished-shell.mjs [--write]
// Dry-run by default; prints per-file status. Aborts on any unexpected shape.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const finishedDir = path.join(root, "..", "src", "finished");
const write = process.argv.includes("--write");

const MUSIC_BLOCK = (track, volume) =>
  `const BackgroundMusic: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const fadeFrames = Math.min(Math.round(fps * 0.6), Math.floor(durationInFrames / 2));
  const fadeOutStart = Math.max(fadeFrames, durationInFrames - fadeFrames);

  return (
    <Audio
      src={staticFile("${track}")}
      trimAfter={durationInFrames}
      volume={(frame) =>
        interpolate(
          frame,
          [0, fadeFrames, fadeOutStart, durationInFrames],
          [0, ${volume}, ${volume}, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        )
      }
    />
  );
};`;

const files = fs
  .readdirSync(finishedDir)
  .filter((f) => f.endsWith(".tsx"))
  .sort();

let migrated = 0;
for (const file of files) {
  if (file === "angelica-fourth-film-real-photo.tsx") {
    console.log("skip (wrapper): " + file);
    continue;
  }
  const full = path.join(finishedDir, file);
  let s = fs.readFileSync(full, "utf8");

  if (s.includes("<FinishedFilm")) {
    console.log("skip (already migrated): " + file);
    continue;
  }

  const musicMatch = s.match(/const BackgroundMusic[\s\S]*?src=\{staticFile\("([^"]+)"\)\}[\s\S]*?\[0, (0\.\d+), \2, 0\]/);
  const track = musicMatch?.[1];
  const volume = musicMatch?.[2];
  if (!track || !volume) {
    throw new Error("no BackgroundMusic track/volume in " + file);
  }
  const blockMatch = s.match(/^const BackgroundMusic: React\.FC = \(\) => \{[\s\S]*?^};$/m);
  if (!blockMatch) {
    throw new Error("BackgroundMusic block not matched in " + file);
  }
  if (blockMatch[0] !== MUSIC_BLOCK(track, volume)) {
    throw new Error("BackgroundMusic body drifted in " + file);
  }

  const shellMatch = s.match(
    /^export const (\w+): React\.FC = \(\) => \{$[\s\S]*?^};$/m,
  );
  if (!shellMatch) {
    throw new Error("export shell not matched in " + file);
  }
  const exportName = shellMatch[1];
  const dur = shellMatch[0].match(/durationInFrames=\{(\d+)\}/)?.[1];
  const scenes = [...shellMatch[0].matchAll(/<(\w+) frame=\{frame(?: - \d+)?\} \/>/g)].map((m) => m[1]);
  const breaks = [...shellMatch[0].matchAll(/frame < (\d+) \?/g)].map((m) => m[1]);
  if (!dur || scenes.length !== 3 || breaks.length !== 2) {
    throw new Error("shell shape unexpected in " + file + ": " + JSON.stringify({ dur, scenes, breaks }));
  }

  const volumeProp = volume === "0.12" ? "" : `\n    peakVolume={${volume}}`;
  const replacement = `export const ${exportName}: React.FC = () => (
  <FinishedFilm
    accent={accent}
    durationInFrames={${dur}}
    music={staticFile("${track}")}${volumeProp}
    breaks={[${breaks.join(", ")}]}
    scenes={[${scenes.join(", ")}]}
  />
);`;

  s = s.replace(blockMatch[0] + "\n\n", "").replace(shellMatch[0], replacement);

  // Rebuild imports from actual usage in the remainder (ignoring the
  // import lines themselves, which would self-count as usage).
  s = s.replace(/^import \{ Audio \} from "@remotion\/media";\n/m, "");
  const bodyOnly = s.replace(/^import .*$/gm, "");
  const remotionNames = ["Img", "interpolate", "staticFile", "useCurrentFrame", "useVideoConfig"];
  const usedRemotion = remotionNames.filter((n) => new RegExp(`\\b${n}\\b`).test(bodyOnly));
  s = s.replace(
    /^import \{ [^}]* \} from "remotion";$/m,
    `import { ${usedRemotion.join(", ")} } from "remotion";`,
  );
  const stageNames = ["ink", "mutedInk", "SceneShell", "SectionLabel", "Seal"];
  const usedStage = stageNames.filter((n) => new RegExp(`\\b${n}\\b`).test(bodyOnly));
  s = s.replace(
    /^import \{ [^}]* \} from "\.\.\/herbal-stage";$/m,
    `import { ${usedStage.join(", ")} } from "../herbal-stage";`,
  );
  if (!s.includes('"../finished-shell"')) {
    s = s.replace(
      /^import \{ [^}]* \} from "\.\.\/herbal-stage";$/m,
      (m) => m + '\nimport { FinishedFilm } from "../finished-shell";',
    );
  }

  // Post-conditions: no leftovers, canonical strings present.
  for (const banned of ["BackgroundMusic", "useCurrentFrame()", "SceneShell accent"]) {
    if (s.includes(banned)) {
      throw new Error(`leftover "${banned}" in ${file}`);
    }
  }
  for (const required of [
    "<FinishedFilm",
    `durationInFrames={${dur}}`,
    `staticFile("${track}")`,
    `breaks={[${breaks.join(", ")}]}`,
  ]) {
    if (!s.includes(required)) {
      throw new Error(`missing "${required}" in ${file}`);
    }
  }

  if (write) {
    fs.writeFileSync(full, s);
  }
  migrated += 1;
  console.log((write ? "migrated: " : "ok: ") + file);
}
console.log((write ? "migrated " : "would migrate ") + migrated + " films");
