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
  breaks: [number, number];
  scenes: [FinishedScene, FinishedScene, FinishedScene];
  peakVolume?: number;
}> = ({ accent, durationInFrames, music, breaks, scenes, peakVolume = 0.12 }) => {
  const frame = useCurrentFrame();
  const [HeroScene, ClassicalScene, ClosingScene] = scenes;
  const [firstBreak, secondBreak] = breaks;

  return (
    <>
      <FinishedMusic src={music} peakVolume={peakVolume} />
      <SceneShell accent={accent} mode="tall" durationInFrames={durationInFrames}>
        {frame < firstBreak ? (
          <HeroScene frame={frame} />
        ) : frame < secondBreak ? (
          <ClassicalScene frame={frame - firstBreak} />
        ) : (
          <ClosingScene frame={frame - secondBreak} />
        )}
      </SceneShell>
    </>
  );
};
