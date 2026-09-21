import { Audio } from "@remotion/media";
import {
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { HerbalVideoProps } from "./herbal-data";
import {
  fade,
  HerbChip,
  IngredientList,
  rise,
  RootIllustration,
} from "./herbal-cards";
import {
  ink,
  mutedInk,
  SceneShell,
  SectionLabel,
  Seal,
  SignMark,
} from "./herbal-stage";

const BackgroundMusic: React.FC<{ source: string }> = ({ source }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const fadeFrames = Math.min(
    Math.round(fps * 0.6),
    Math.floor(durationInFrames / 2),
  );
  const fadeOutStart = Math.max(fadeFrames, durationInFrames - fadeFrames);

  return (
    <Audio
      src={staticFile(source)}
      trimAfter={durationInFrames}
      volume={(frame) =>
        interpolate(
          frame,
          [0, fadeFrames, fadeOutStart, durationInFrames],
          [0, 0.12, 0.12, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        )
      }
      from={-29}
    />
  );
};

const CoverScene: React.FC<HerbalVideoProps & { frame: number }> = (props) => {
  const leftFade = fade(props.frame, 0, 20);
  const titleShift = rise(props.frame, 0, 16);
  const grid = [
    ["人参", "补气", "#eadbc0"],
    ["白术", "健脾", "#efe4cf"],
    ["茯苓", "渗湿", "#e7dcc7"],
    ["炙甘草", "调和", "#f0e6d6"],
    ["陈皮", "理气", "#e8d5b0"],
    ["山药", "补益", "#e9dfcf"],
    ["当归", "养血", "#ead8c2"],
    ["黄芪", "固表", "#f3e9d6"],
  ] as const;

  return (
    <SceneShell accent={props.accent} mode="wide">
      <div
        style={{
          position: "absolute",
          left: 74,
          top: 74,
          width: 470,
          opacity: leftFade,
          transform: `translateY(${titleShift}px)`,
        }}
      >
        <SectionLabel accent={props.accent}>ANCIENT HERBAL ATLAS</SectionLabel>
        <div
          style={{
            marginTop: 28,
            color: ink,
            fontFamily: "STKaiti, KaiTi, serif",
            fontSize: 102,
            lineHeight: 0.9,
          }}
        >
          本草一味
        </div>
        <div
          style={{
            marginTop: 20,
            color: mutedInk,
            fontSize: 17,
            lineHeight: 1.7,
            maxWidth: 360,
          }}
        >
          读一味草木，见四时之气。以纸为地，以墨为山，以药性为骨。
        </div>
        <div
          style={{
            marginTop: 42,
            color: props.accent,
            fontFamily: "STKaiti, KaiTi, serif",
            fontSize: 32,
          }}
        >
          {props.title} · {props.category}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 72,
          bottom: 74,
          width: 560,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
        }}
      >
        {grid.map(([name, subtext, tone], index) => (
          <HerbChip
            key={name}
            name={name}
            subtext={subtext}
            tone={tone}
            frame={props.frame}
            delay={index * 5}
            wide
          />
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          right: 94,
          top: 92,
          opacity: fade(props.frame, 8, 26),
        }}
      >
        <Seal text="本草" size={84} rotation={-4} />
      </div>
      <div
        style={{
          position: "absolute",
          right: 74,
          bottom: 92,
          opacity: fade(props.frame, 20, 40),
        }}
      >
        <SignMark frame={props.frame} size={120} rotation={-6} />
      </div>
    </SceneShell>
  );
};

const ProfileScene: React.FC<HerbalVideoProps & { frame: number }> = (
  props,
) => {
  const { fps } = useVideoConfig();
  const entrance = spring({
    frame: props.frame,
    fps,
    config: { damping: 200 },
    durationInFrames: 28,
  });
  const leftFade = fade(props.frame, 0, 20);
  const rightFade = fade(props.frame, 10, 30);

  return (
    <SceneShell accent={props.accent} mode="wide">
      <div
        style={{
          position: "absolute",
          left: 74,
          top: 74,
          width: 420,
          opacity: leftFade,
          transform: `translateY(${(1 - entrance) * 26}px)`,
        }}
      >
        <SectionLabel accent={props.accent}>HERBAL PROFILE</SectionLabel>
        <div
          style={{
            marginTop: 24,
            color: ink,
            fontFamily: "STKaiti, KaiTi, serif",
            fontSize: 96,
            lineHeight: 0.92,
          }}
        >
          {props.name}
        </div>
        <div
          style={{
            marginTop: 10,
            color: mutedInk,
            fontFamily: "Arial, sans-serif",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {props.pinyin}
        </div>
        <div
          style={{
            marginTop: 26,
            color: props.accent,
            fontFamily: "STKaiti, KaiTi, serif",
            fontSize: 30,
          }}
        >
          {props.nature} · {props.meridians}
        </div>
        <div
          style={{
            marginTop: 22,
            color: mutedInk,
            fontSize: 16,
            lineHeight: 1.7,
          }}
        >
          {props.modernNote}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 72,
          right: 444,
          bottom: 76,
          padding: "20px 24px 18px",
          backgroundColor: "rgba(247, 242, 231, .86)",
          borderTop: `3px solid ${props.accent}`,
          opacity: rightFade,
          transform: `translateY(${rise(props.frame, 8, 16)}px)`,
        }}
      >
        <div
          style={{
            color: props.accent,
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 14,
          }}
        >
          本草性味
        </div>
        <div
          style={{
            fontFamily: "STKaiti, KaiTi, serif",
            fontSize: 28,
            lineHeight: 1.45,
          }}
        >
          {props.classicalLine}
        </div>
      </div>

      <RootIllustration frame={props.frame} orientation="wide" />
      <div
        style={{
          position: "absolute",
          right: 74,
          top: 92,
          opacity: fade(props.frame, 14, 34),
        }}
      >
        <Seal text="山药" size={84} rotation={-4} />
      </div>
      <div
        style={{
          position: "absolute",
          right: 72,
          bottom: 92,
          width: 286,
          padding: "18px 20px 16px",
          backgroundColor: "rgba(247, 242, 231, .86)",
          opacity: fade(props.frame, 16, 36),
          transform: `translateY(${rise(props.frame, 16, 14)}px)`,
        }}
      >
        <div style={{ color: mutedInk, fontSize: 13, fontWeight: 700 }}>
          常见取向
        </div>
        <div
          style={{
            marginTop: 8,
            color: ink,
            fontFamily: "STKaiti, KaiTi, serif",
            fontSize: 30,
          }}
        >
          以平和之性，托脾胃之气。
        </div>
      </div>
    </SceneShell>
  );
};

const FormulaScene: React.FC<
  HerbalVideoProps & { frame: number; tall?: boolean }
> = (props) => {
  const tall = props.tall ?? false;
  const mode = tall ? "tall" : "wide";
  const titleFade = fade(props.frame, 0, 18);
  const cardFade = fade(props.frame, 14, 34);

  return (
    <SceneShell accent={props.accent} mode={mode}>
      <div
        style={{
          position: "absolute",
          left: tall ? 74 : 76,
          top: tall ? 126 : 76,
          right: tall ? 74 : "auto",
          width: tall ? "auto" : 430,
          opacity: titleFade,
          transform: `translateY(${rise(props.frame, 0, 18)}px)`,
        }}
      >
        <SectionLabel accent={props.accent} size={tall ? 24 : 13}>
          CLASSICAL FORMULA
        </SectionLabel>
        <div
          style={{
            marginTop: 24,
            color: ink,
            fontFamily: "STKaiti, KaiTi, serif",
            fontSize: tall ? 148 : 74,
            lineHeight: 0.95,
          }}
        >
          {props.formula.name}
        </div>
        <div
          style={{
            marginTop: 18,
            color: "rgba(23, 23, 22, .76)",
            fontFamily: "Arial, sans-serif",
            fontSize: tall ? 34 : 13,
            fontWeight: 700,
          }}
        >
          {props.formula.pronunciation}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: tall ? 64 : 74,
          top: tall ? 72 : 82,
          opacity: fade(props.frame, 10, 30),
        }}
      >
        <Seal
          text="方"
          size={tall ? 110 : 78}
          glyphScale={tall ? 0.52 : 0.28}
          rotation={-5}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: tall ? 74 : 76,
          right: tall ? 74 : 76,
          top: tall ? 392 : 230,
          padding: tall ? "30px 32px" : "24px 26px",
          backgroundColor: "rgba(247, 242, 231, .9)",
          opacity: cardFade,
          transform: `translateY(${rise(props.frame, 16, 20)}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: tall ? 28 : 24,
            alignItems: "flex-start",
            flexDirection: tall ? "column" : "row",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                color: props.accent,
                fontSize: tall ? 28 : 13,
                fontWeight: 700,
                marginBottom: 24,
              }}
            >
              四味配伍
            </div>
            <IngredientList
              formula={props.formula}
              accent={props.accent}
              compact={tall}
            />
          </div>
          <div
            style={{
              width: tall ? "100%" : 246,
              marginTop: tall ? 16 : 0,
              padding: tall ? "20px 0 0" : "0 0 0 18px",
              borderTop: tall ? "1px solid rgba(23, 23, 22, .18)" : "none",
              borderLeft: tall ? "none" : "1px solid rgba(23, 23, 22, .18)",
              color: mutedInk,
              fontSize: tall ? 26 : 13,
              lineHeight: 1.7,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 10 }}>方义</div>
            <div>{props.formula.focus}</div>
            <div style={{ marginTop: 10 }}>{props.formula.source}</div>
          </div>
        </div>
      </div>

      {tall ? (
        <div
          style={{
            position: "absolute",
            left: 74,
            right: 74,
            top: 930,
            display: "flex",
            alignItems: "stretch",
            gap: 18,
            opacity: fade(props.frame, 26, 48),
            transform: `translateY(${rise(props.frame, 26, 16)}px)`,
          }}
        >
          <div
            style={{ width: 4, backgroundColor: props.accent, flexShrink: 0 }}
          />
          <div>
            <div
              style={{
                color: props.accent,
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: 0,
              }}
            >
              FORMULA NOTE
            </div>
            <div
              style={{
                marginTop: 14,
                color: ink,
                fontFamily: "STKaiti, KaiTi, serif",
                fontSize: 88,
                lineHeight: 1,
              }}
            >
              {props.formula.focus}
            </div>
            <div
              style={{
                marginTop: 14,
                color: mutedInk,
                fontSize: tall ? 28 : 14,
                lineHeight: 1.7,
              }}
            >
              {props.subtitle} · 先辨证，再用药
            </div>
          </div>
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          left: tall ? 74 : 76,
          right: tall ? 74 : 76,
          bottom: tall ? 112 : 72,
          display: "flex",
          justifyContent: "space-between",
          alignItems: tall ? "flex-start" : "flex-end",
          flexDirection: tall ? "column" : "row",
          gap: 12,
          color: "rgba(23, 23, 22, .66)",
          opacity: fade(props.frame, 22, 44),
        }}
      >
        <div
          style={{
            maxWidth: tall ? "100%" : 460,
            fontFamily: "STKaiti, KaiTi, serif",
            fontSize: tall ? 64 : 24,
            lineHeight: 1.45,
          }}
        >
          方中有序，剂里有章。先辨证，再用药。
        </div>
        <div
          style={{
            textAlign: tall ? "left" : "right",
            fontSize: tall ? 26 : 12,
            lineHeight: 1.6,
          }}
        >
          传统文化示例
          <br />
          仅供内容展示与学习
        </div>
      </div>

      {tall ? (
        <div
          style={{
            position: "absolute",
            right: 74,
            bottom: 112,
            opacity: fade(props.frame, 20, 40),
          }}
        >
          <SignMark frame={props.frame} size={200} rotation={-6} />
        </div>
      ) : null}
    </SceneShell>
  );
};

const HerbalFeature: React.FC<HerbalVideoProps> = (props) => {
  const frame = useCurrentFrame();
  return (
    <>
      <BackgroundMusic source="music/gaoshan-liushui.mp3" />
      {frame < 60 ? (
        <CoverScene {...props} frame={frame} />
      ) : frame < 142 ? (
        <ProfileScene {...props} frame={frame - 60} />
      ) : (
        <FormulaScene {...props} frame={frame - 142} />
      )}
    </>
  );
};

const HerbProfileTemplate: React.FC<HerbalVideoProps> = (props) => {
  const frame = useCurrentFrame();
  return (
    <>
      <BackgroundMusic source="music/gaoshan-liushui.mp3" />
      <ProfileScene {...props} frame={frame} />
    </>
  );
};

const FormulaShortTemplate: React.FC<HerbalVideoProps> = (props) => {
  const frame = useCurrentFrame();
  return (
    <>
      <BackgroundMusic source="music/yuzhou-changwan.mp3" />
      <FormulaScene {...props} frame={frame} tall />
    </>
  );
};

export { FormulaShortTemplate, HerbProfileTemplate, HerbalFeature };
