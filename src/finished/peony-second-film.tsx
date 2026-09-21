import { Img, staticFile } from "remotion";
import { fade, rise } from "../herbal-cards";
import { ink, mutedInk, SectionLabel, Seal } from "../herbal-stage";
import { FinishedFilm } from "../finished-shell";

const accent = "#a23f58";

const PhotoPlate: React.FC<{ frame: number }> = ({ frame }) => (
  <div
    style={{
      position: "absolute",
      right: 74,
      top: 306,
      width: 468,
      height: 642,
      padding: 14,
      backgroundColor: "#f7f2e7",
      border: "1px solid rgba(23, 23, 22, .35)",
      boxShadow: "0 18px 36px rgba(47, 38, 25, .14)",
      opacity: fade(frame, 8, 28),
      transform: `translateY(${rise(frame, 8, 18)}px)`,
    }}
  >
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <Img
        src={staticFile("images/paeonia-lactiflora.jpg")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "52% 59%",
          filter: "saturate(.82) contrast(.94)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "13px 15px 12px",
          backgroundColor: "rgba(247, 242, 231, .93)",
          borderTop: `1px solid ${accent}`,
          color: mutedInk,
          fontFamily: "Arial, sans-serif",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: 0,
        }}
      >
        F. D. RICHARDS / CC BY-SA 2.0
      </div>
    </div>
  </div>
);

const HeroScene: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <div
      style={{
        position: "absolute",
        left: 74,
        top: 154,
        right: 550,
        opacity: fade(frame, 0, 20),
        transform: `translateY(${rise(frame, 0, 20)}px)`,
      }}
    >
      <SectionLabel accent={accent} size={24}>SHENNONG BENCAO JING</SectionLabel>
      <div
        style={{
          marginTop: 28,
          color: ink,
          fontFamily: "STKaiti, KaiTi, serif",
          fontSize: 164,
          lineHeight: 0.92,
        }}
      >
        芍药
      </div>
      <div
        style={{
          marginTop: 18,
          color: "rgba(23, 23, 22, .76)",
          fontFamily: "Arial, sans-serif",
          fontSize: 38,
          fontWeight: 700,
          letterSpacing: 0,
        }}
      >
        SHAO YAO
      </div>
      <div
        style={{
          marginTop: 24,
          color: accent,
          fontFamily: "STKaiti, KaiTi, serif",
          fontSize: 37,
        }}
      >
        中经 · 药中品
      </div>
    </div>

    <PhotoPlate frame={frame} />

    <div
      style={{
        position: "absolute",
        left: 74,
        top: 528,
        width: 434,
        padding: "24px 27px 25px",
        borderTop: `3px solid ${accent}`,
        backgroundColor: "rgba(247, 242, 231, .8)",
        color: ink,
        opacity: fade(frame, 16, 32),
      }}
    >
      <div style={{ color: accent, fontSize: 22, fontWeight: 700 }}>古籍开篇</div>
      <div
        style={{
          marginTop: 12,
          fontFamily: "STKaiti, KaiTi, serif",
          fontSize: 62,
          lineHeight: 1,
        }}
      >
        味苦，平。
      </div>
      <div style={{ marginTop: 15, color: mutedInk, fontSize: 25 }}>《神农本草经》· 卷二</div>
    </div>

    <div
      style={{
        position: "absolute",
        left: 74,
        right: 74,
        top: 1030,
        padding: "22px 0 24px",
        borderTop: "1px solid rgba(23, 23, 22, .3)",
        borderBottom: "1px solid rgba(23, 23, 22, .3)",
        color: ink,
        opacity: fade(frame, 22, 38),
      }}
    >
      <div style={{ color: accent, fontSize: 21, fontWeight: 700 }}>异名引文</div>
      <div style={{ marginTop: 10, fontFamily: "STKaiti, KaiTi, serif", fontSize: 47 }}>
        一名白术
      </div>
    </div>

    <div style={{ position: "absolute", right: 74, top: 72, opacity: fade(frame, 10, 28) }}>
      <Seal text="药" size={106} glyphScale={0.57} rotation={-5} />
    </div>

    <div
      style={{
        position: "absolute",
        left: 74,
        right: 74,
        bottom: 126,
        color: mutedInk,
        fontSize: 26,
        letterSpacing: 0,
        opacity: fade(frame, 20, 36),
      }}
    >
      古籍条目 · 本草正传 03
    </div>
  </>
);

const ClassicalScene: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <div
      style={{
        position: "absolute",
        left: 74,
        right: 74,
        top: 170,
        opacity: fade(frame, 0, 18),
        transform: `translateY(${rise(frame, 0, 18)}px)`,
      }}
    >
      <SectionLabel accent={accent} size={24}>CLASSICAL ENTRY</SectionLabel>
      <div style={{ marginTop: 32, color: accent, fontSize: 35, fontWeight: 700 }}>古籍原文</div>
      <div
        style={{
          marginTop: 28,
          color: ink,
          fontFamily: "STKaiti, KaiTi, serif",
          fontSize: 67,
          lineHeight: 1.18,
        }}
      >
        主邪气腹痛，除血痹，
        <br />
        破坚积、寒热、疝瘕。
      </div>
    </div>

    <div
      style={{
        position: "absolute",
        left: 74,
        right: 74,
        top: 730,
        paddingTop: 25,
        borderTop: "1px solid rgba(23, 23, 22, .26)",
        color: ink,
        opacity: fade(frame, 16, 34),
      }}
    >
      <SectionLabel accent={accent} size={21}>READING CONTINUED</SectionLabel>
      <div
        style={{
          marginTop: 26,
          fontFamily: "STKaiti, KaiTi, serif",
          fontSize: 70,
          lineHeight: 1.08,
        }}
      >
        止痛，利小便，益气。
      </div>
    </div>

    <div
      style={{
        position: "absolute",
        left: 74,
        right: 74,
        top: 1032,
        padding: "24px 28px 22px",
        borderTop: `3px solid ${accent}`,
        backgroundColor: "rgba(247, 242, 231, .82)",
        color: mutedInk,
        fontSize: 28,
        lineHeight: 1.55,
        opacity: fade(frame, 18, 34),
      }}
    >
      <div style={{ color: accent, fontSize: 24, fontWeight: 700 }}>SOURCE / 原文整理</div>
      <div style={{ marginTop: 8 }}>《神农本草经》· 卷二 · 中经</div>
    </div>
  </>
);

const ClosingScene: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <div
      style={{
        position: "absolute",
        left: 74,
        right: 74,
        top: 170,
        opacity: fade(frame, 0, 18),
        transform: `translateY(${rise(frame, 0, 18)}px)`,
      }}
    >
      <SectionLabel accent={accent} size={24}>FIELD NOTE</SectionLabel>
      <div
        style={{
          marginTop: 30,
          color: ink,
          fontFamily: "STKaiti, KaiTi, serif",
          fontSize: 85,
          lineHeight: 1.05,
        }}
      >
        原文末句
      </div>
      <div
        style={{
          marginTop: 42,
          color: ink,
          fontFamily: "STKaiti, KaiTi, serif",
          fontSize: 72,
          lineHeight: 1.15,
        }}
      >
        生川谷
      </div>
      <div style={{ marginTop: 22, color: mutedInk, fontSize: 29, lineHeight: 1.55 }}>
        古籍内容展示，不构成诊疗建议
      </div>
    </div>

    <div
      style={{
        position: "absolute",
        left: 74,
        right: 74,
        top: 760,
        padding: "25px 0 29px",
        borderTop: "1px solid rgba(23, 23, 22, .26)",
        borderBottom: "1px solid rgba(23, 23, 22, .26)",
        color: ink,
        opacity: fade(frame, 14, 30),
      }}
    >
      <SectionLabel accent={accent} size={21}>TEXT NOTE</SectionLabel>
      <div style={{ marginTop: 19, color: mutedInk, fontSize: 34, lineHeight: 1.4 }}>
        原条目后文在底本中另有续录。
      </div>
    </div>

    <div
      style={{
        position: "absolute",
        right: 78,
        top: 1120,
        width: 230,
        height: 230,
        opacity: fade(frame, 14, 30),
        transform: `translateY(${rise(frame, 14, 14)}px) rotate(-6deg)`,
      }}
    >
      <Img
        src={staticFile("sign-1.png")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          filter: "drop-shadow(0 3px 5px rgba(23, 23, 22, .14))",
        }}
      />
    </div>
  </>
);

export const PeonySecondFilm: React.FC = () => (
  <FinishedFilm
    accent={accent}
    durationInFrames={240}
    music={staticFile("music/yuzhou-changwan.mp3")}
    peakVolume={0.1}
    breaks={[78, 162]}
    scenes={[HeroScene, ClassicalScene, ClosingScene]}
  />
);
