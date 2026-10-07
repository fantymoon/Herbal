import { Audio } from "@remotion/media";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneShell } from "./herbal-stage";
import { trackOf } from "./music";

export type FinishedScene = React.FC<{ frame: number }>;

/**
 * The music bed. Both series share it, and they need different things from it.
 *
 * The short films are 12 seconds and the tracks are 3:30 and 4:16, so the bed never runs
 * out and `loop` stays off. The long-form series runs to six minutes — longer than either
 * track — and the first cut of `tu-que-h.mp4` played its last 1:46 against digital silence,
 * because a bare `<Audio>` stops when the file stops. The quietest half-second of that film
 * before 4:16 measured -50 dBFS; after it, eleven half-seconds measured -180 dBFS, which is
 * true zero. Narration covers most of it, so it survived review; the gaps between sentences
 * are where it showed.
 *
 * `loop` alone is not the fix, and getting that wrong cost a render cycle. `@remotion/media`
 * takes the loop length from `trimAfter`, and when it cannot determine the asset duration it
 * treats the media as infinitely long — so a film-length `trimAfter` makes `loop` degenerate
 * into "play once", with no error and no warning. Measured: with `loop` and a film-length
 * `trimAfter`, the tail still read -180 dBFS; with `trimAfter` set to the track's own length,
 * the same window read -34.5. Hence the registry lookup below: the loop length has to be a
 * number that came from the file.
 *
 * `loopVolumeCurveBehavior` is the other half. It defaults to "repeat", which restarts the
 * volume curve at every seam — the bed would fade in again at 4:16, in the middle of the
 * film. "extend" lets the curve run across the seams, so the film keeps exactly one fade in
 * and one fade out.
 */
export const FinishedMusic: React.FC<{
  src: string;
  peakVolume?: number;
  loop?: boolean;
}> = ({ src, peakVolume = 0.12, loop = false }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const fadeFrames = Math.min(Math.round(fps * 0.6), Math.floor(durationInFrames / 2));
  const fadeOutStart = Math.max(fadeFrames, durationInFrames - fadeFrames);

  // A film shorter than its track needs nothing from the registry. A film longer than its
  // track cannot loop without knowing the track's length, and a silent non-loop is worse
  // than a loud failure — `npm run check` catches this earlier, in the ledger and the gate.
  const track = loop ? trackOf(src) : null;
  if (loop && !track) {
    throw new Error(
      `${src} is not in src/music-registry.ts, so it cannot be looped. ` +
        `Run \`npm run sync-music\`, then add the track to TRACKS in scripts/sync-music.mjs.`,
    );
  }

  return (
    <Audio
      src={src}
      loop={loop}
      loopVolumeCurveBehavior={loop ? "extend" : "repeat"}
      trimBefore={track ? track.leadFrames : 0}
      trimAfter={track ? track.frames : durationInFrames}
      volume={(frame) =>
        interpolate(
          frame,
          [0, fadeFrames, fadeOutStart, durationInFrames],
          [0, peakVolume, peakVolume, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        )
      }
    />
  );
};

export const FinishedFilm: React.FC<{
  accent: string;
  durationInFrames: number;
  music: string;
  /**
   * Scene start frames, ascending. `breaks.length` must be `scenes.length - 1`.
   * The original signature was a 2-tuple with exactly three scenes; widening it
   * keeps the 55 published films rendering identically (the index derivation
   * below reproduces the previous ternary for two breaks) while letting a new
   * film split a long 今译 across four or five scenes.
   */
  breaks: number[];
  scenes: FinishedScene[];
  peakVolume?: number;
  /** Narration audio, already resolved to a URL. See `FilmContent.narration`. */
  narration?: string;
}> = ({
  accent,
  durationInFrames,
  music,
  breaks,
  scenes,
  peakVolume = 0.12,
  narration,
}) => {
  const frame = useCurrentFrame();
  const found = breaks.findIndex((breakFrame) => frame < breakFrame);
  const index = found === -1 ? breaks.length : found;
  const start = index === 0 ? 0 : breaks[index - 1];
  const Scene = scenes[Math.min(index, scenes.length - 1)];

  return (
    <>
      <FinishedMusic src={music} peakVolume={peakVolume} />
      {/* The voice sits on top of the bed rather than replacing it; the caller lowers
          `peakVolume` so the two do not compete. */}
      {narration === undefined ? null : <Audio src={narration} />}
      <SceneShell accent={accent} mode="tall" durationInFrames={durationInFrames}>
        <Scene frame={frame - start} />
      </SceneShell>
    </>
  );
};
