import { Img, staticFile } from "remotion";
import { fade, rise } from "../herbal-cards";
import { ink, mutedInk, SectionLabel, Seal } from "../herbal-stage";
import { FinishedFilm } from "../finished-shell";

const accent = "#9f392c";

const HeroScene: React.FC<{ frame: number }> = ({ frame }) => {
  const reveal = fade(frame, 0, 20);

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 74,
          top: 152,
          right: 538,
          opacity: reveal,
          transform: `translateY(${rise(frame, 0, 20)}px)`,
        }}
      >
        <SectionLabel accent={accent} size={24}>SHENNONG BENCAO JING</SectionLabel>
        <div style={{ marginTop: 28, color: ink, fontFamily: "STKaiti, KaiTi, serif", fontSize: 158, lineHeight: 0.92 }}>
          人参
        </div>
        <div style={{ marginTop: 18, color: "rgba(23, 23, 22, .76)", fontFamily: "Arial, sans-serif", fontSize: 36, fontWeight: 700 }}>
          REN SHEN
        </div>
        <div style={{ marginTop: 24, color: accent, fontFamily: "STKaiti, KaiTi, serif", fontSize: 34 }}>
          上经 · 草上品
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 74,
          top: 326,
          width: 470,
          height: 636,
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
            src={staticFile("images/panax-ginseng-kitchen.jpg")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "52% 66%",
              filter: "saturate(.8) contrast(.94) sepia(.1)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              padding: "14px 16px 13px",
              backgroundColor: "rgba(247, 242, 231, .92)",
              borderTop: `1px solid ${accent}`,
              color: mutedInk,
              fontFamily: "Arial, sans-serif",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: 0,
            }}
          >
            FRESH GINSENG / PEACHYEUNG316 / CC BY-SA 4.0
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 74,
          top: 514,
          width: 430,
          padding: "23px 26px 24px",
          borderTop: `3px solid ${accent}`,
          backgroundColor: "rgba(247, 242, 231, .78)",
          color: ink,
          opacity: fade(frame, 16, 32),
        }}
      >
        <div style={{ color: accent, fontSize: 20, fontWeight: 700 }}>古籍原文</div>
        <div style={{ marginTop: 12, fontFamily: "STKaiti, KaiTi, serif", fontSize: 55, lineHeight: 1 }}>
          味甘，微寒
        </div>
        <div style={{ marginTop: 14, color: mutedInk, fontSize: 23 }}>《神农本草经》· 卷一</div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 74,
          right: 74,
          top: 1020,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          borderTop: "1px solid rgba(23, 23, 22, .3)",
          borderBottom: "1px solid rgba(23, 23, 22, .3)",
          opacity: fade(frame, 22, 38),
        }}
      >
        <div style={{ padding: "22px 24px 24px 0", color: ink }}>
          <div style={{ color: accent, fontSize: 19, fontWeight: 700 }}>别名</div>
          <div style={{ marginTop: 9, fontFamily: "STKaiti, KaiTi, serif", fontSize: 36 }}>人衔 · 鬼盖</div>
        </div>
        <div style={{ padding: "22px 0 24px 26px", borderLeft: "1px solid rgba(23, 23, 22, .2)", color: ink }}>
          <div style={{ color: accent, fontSize: 19, fontWeight: 700 }}>生境</div>
          <div style={{ marginTop: 9, fontFamily: "STKaiti, KaiTi, serif", fontSize: 36 }}>生山谷</div>
        </div>
      </div>

      <div style={{ position: "absolute", right: 74, top: 72, opacity: fade(frame, 10, 28) }}>
        <Seal text="药" size={104} glyphScale={0.55} rotation={-5} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 74,
          right: 74,
          bottom: 126,
          color: mutedInk,
          fontSize: 25,
          letterSpacing: 0,
          opacity: fade(frame, 20, 36),
        }}
      >
        古籍条目 · 本草正传 01
      </div>
    </>
  );
};

const ClassicalScene: React.FC<{ frame: number }> = ({ frame }) => {
  const reveal = fade(frame, 0, 18);

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 74,
          right: 74,
          top: 170,
          opacity: reveal,
          transform: `translateY(${rise(frame, 0, 18)}px)`,
        }}
      >
        <SectionLabel accent={accent} size={24}>CLASSICAL NOTE</SectionLabel>
        <div style={{ marginTop: 32, color: accent, fontSize: 34, fontWeight: 700 }}>
          古籍原文
        </div>
        <div style={{ marginTop: 28, color: ink, fontFamily: "STKaiti, KaiTi, serif", fontSize: 76, lineHeight: 1.1 }}>
          味甘，微寒
        </div>
        <div style={{ marginTop: 24, color: ink, fontFamily: "STKaiti, KaiTi, serif", fontSize: 56, lineHeight: 1.28, maxWidth: 880 }}>
          主补五脏，安精神，定魂魄
        </div>
        <div style={{ marginTop: 20, color: mutedInk, fontFamily: "STKaiti, KaiTi, serif", fontSize: 48, lineHeight: 1.45 }}>
          止惊悸 · 除邪气 · 明目 · 开心 · 益智
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 74,
          right: 74,
          top: 704,
          paddingTop: 24,
          borderTop: "1px solid rgba(23, 23, 22, .26)",
          color: ink,
          opacity: fade(frame, 16, 34),
        }}
      >
        <SectionLabel accent={accent} size={20}>READING CONTINUED</SectionLabel>
        <div style={{ marginTop: 26, fontFamily: "STKaiti, KaiTi, serif", fontSize: 68, lineHeight: 1.08 }}>
          久服，轻身、延年
        </div>
        <div style={{ marginTop: 22, color: mutedInk, fontFamily: "STKaiti, KaiTi, serif", fontSize: 40, lineHeight: 1.35 }}>
          一名人衔，一名鬼盖。生山谷。
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 74,
          right: 74,
          top: 1030,
          padding: "24px 28px 22px",
          borderTop: `3px solid ${accent}`,
          backgroundColor: "rgba(247, 242, 231, .82)",
          color: mutedInk,
          fontSize: 27,
          lineHeight: 1.55,
          opacity: fade(frame, 18, 34),
        }}
      >
        <div style={{ color: accent, fontSize: 24, fontWeight: 700 }}>SOURCE / 原文整理</div>
        <div style={{ marginTop: 8 }}>《神农本草经》 · 卷一 · 上经</div>
      </div>
    </>
  );
};

const ClosingScene: React.FC<{ frame: number }> = ({ frame }) => {
  const reveal = fade(frame, 0, 18);

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 74,
          right: 74,
          top: 170,
          opacity: reveal,
          transform: `translateY(${rise(frame, 0, 18)}px)`,
        }}
      >
        <SectionLabel accent={accent} size={24}>FIELD NOTE</SectionLabel>
        <div style={{ marginTop: 28, color: ink, fontFamily: "STKaiti, KaiTi, serif", fontSize: 86, lineHeight: 1.05 }}>
          人参 · 本草初识
        </div>
        <div style={{ marginTop: 34, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div style={{ padding: "22px 24px", border: "1px solid rgba(23, 23, 22, .2)", color: ink }}>
            <div style={{ color: accent, fontSize: 24, fontWeight: 700 }}>别名</div>
            <div style={{ marginTop: 12, fontFamily: "STKaiti, KaiTi, serif", fontSize: 52 }}>人衔 · 鬼盖</div>
          </div>
          <div style={{ padding: "22px 24px", border: "1px solid rgba(23, 23, 22, .2)", color: ink }}>
            <div style={{ color: accent, fontSize: 24, fontWeight: 700 }}>生境</div>
            <div style={{ marginTop: 12, fontFamily: "STKaiti, KaiTi, serif", fontSize: 52 }}>山谷</div>
          </div>
        </div>
        <div style={{ marginTop: 42, color: ink, fontFamily: "STKaiti, KaiTi, serif", fontSize: 68, lineHeight: 1.15 }}>
          久服，轻身、延年
        </div>
        <div style={{ marginTop: 16, color: mutedInk, fontSize: 28, lineHeight: 1.55 }}>
          古籍内容展示，不构成诊疗建议
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 74,
          right: 74,
          top: 830,
          padding: "24px 0 28px",
          borderTop: "1px solid rgba(23, 23, 22, .26)",
          borderBottom: "1px solid rgba(23, 23, 22, .26)",
          color: ink,
          opacity: fade(frame, 14, 30),
        }}
      >
        <SectionLabel accent={accent} size={20}>PUBLICATION NOTE</SectionLabel>
        <div style={{ marginTop: 18, fontFamily: "STKaiti, KaiTi, serif", fontSize: 46, lineHeight: 1.12 }}>
          《神农本草经》· 卷一 · 上经
        </div>
        <div style={{ marginTop: 16, color: mutedInk, fontFamily: "STKaiti, KaiTi, serif", fontSize: 34 }}>
          原文记载：人参生山谷。
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 78,
          top: 1124,
          width: 224,
          height: 224,
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
};

export const GinsengFirstFilm: React.FC = () => (
  <FinishedFilm
    accent={accent}
    durationInFrames={240}
    music={staticFile("music/yuzhou-changwan.mp3")}
    breaks={[78, 162]}
    scenes={[HeroScene, ClassicalScene, ClosingScene]}
  />
);
