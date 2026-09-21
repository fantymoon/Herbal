import { Audio } from "@remotion/media";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneShell } from "./herbal-stage";

export type FinishedScene = React.FC<{ frame: number }>;

export const FinishedMusic: React.FC<{ src: string; peakVolume?: number }> = ({
  src,
  peakVolume = 0.12,
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  const fadeFrames = Math.min(Math.round(fps * 0.6), Math.floor(durationInFrames / 2));
  const fadeOutStart = Math.max(fadeFrames, durationInFrames - fadeFrames);

  return (
    <Audio
      src={src}
      trimAfter={durationInFrames}
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
}> = ({ accent, durationInFrames, music, breaks, scenes, peakVolume = 0.12 }) => {
  const frame = useCurrentFrame();
  const found = breaks.findIndex((breakFrame) => frame < breakFrame);
  const index = found === -1 ? breaks.length : found;
  const start = index === 0 ? 0 : breaks[index - 1];
  const Scene = scenes[Math.min(index, scenes.length - 1)];

  return (
    <>
      <FinishedMusic src={music} peakVolume={peakVolume} />
      <SceneShell accent={accent} mode="tall" durationInFrames={durationInFrames}>
        <Scene frame={frame - start} />
      </SceneShell>
    </>
  );
};
