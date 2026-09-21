import { Img, staticFile } from "remotion";
import { fade, rise } from "../herbal-cards";
import { ink, mutedInk, SectionLabel, Seal } from "../herbal-stage";
import { FinishedFilm } from "../finished-shell";

const accent = "#b3861f";

const HeroScene: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <div
      style={{
        position: "absolute",
        left: 74,
        top: 140,
        right: 74,
        opacity: fade(frame, 0, 30),
        transform: `translateY(${rise(frame, 0, 24)}px)`,
      }}
    >
      <SectionLabel accent={accent} size={24}>SHENNONG BENCAO JING</SectionLabel>
      <div style={{ marginTop: 28, color: ink, fontFamily: "STKaiti, KaiTi, serif", fontSize: 158, lineHeight: 0.92 }}>
        鞠华
      </div>
      <div style={{ marginTop: 18, color: "rgba(23, 23, 22, .76)", fontFamily: "Arial, sans-serif", fontSize: 38, fontWeight: 700 }}>
        JU HUA
      </div>
      <div style={{ marginTop: 24, color: accent, fontFamily: "STKaiti, KaiTi, serif", fontSize: 34 }}>
        上经 · 草部
      </div>
    </div>

    <div
      style={{
        position: "absolute",
        left: 74,
        top: 492,
        width: 932,
        height: 500,
        padding: 14,
        backgroundColor: "#f7f2e7",
        border: "1px solid rgba(23, 23, 22, .35)",
        boxShadow: "0 18px 36px rgba(47, 38, 25, .14)",
        opacity: fade(frame, 12, 40),
        transform: `translateY(${rise(frame, 12, 22)}px)`,
      }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
        <Img
          src={staticFile("images/chrysanthemum-juhua.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "saturate(.85) contrast(.95) sepia(.08)",
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
          CHRYSANTHEMUM SP. / JAMES ST. JOHN / CC BY 2.0
        </div>
      </div>
    </div>

    <div
      style={{
        position: "absolute",
        left: 74,
        top: 1064,
        width: 932,
        padding: "24px 28px 26px",
        borderTop: `3px solid ${accent}`,
        backgroundColor: "rgba(247, 242, 231, .78)",
        color: ink,
        opacity: fade(frame, 20, 44),
      }}
    >
      <div style={{ color: accent, fontSize: 20, fontWeight: 700 }}>古籍原文</div>
      <div style={{ marginTop: 12, fontFamily: "STKaiti, KaiTi, serif", fontSize: 80, lineHeight: 1 }}>
        味苦，平。
      </div>
      <div style={{ marginTop: 14, color: mutedInk, fontSize: 26 }}>《神农本草经》· 卷一 · 上经</div>
    </div>

    <div
      style={{
        position: "absolute",
        left: 74,
        right: 74,
        top: 1328,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        borderTop: "1px solid rgba(23, 23, 22, .3)",
        borderBottom: "1px solid rgba(23, 23, 22, .3)",
        opacity: fade(frame, 28, 52),
      }}
    >
      <div style={{ padding: "24px 26px 26px 0", color: ink }}>
        <div style={{ color: accent, fontSize: 19, fontWeight: 700 }}>篇目位置</div>
        <div style={{ marginTop: 10, fontFamily: "STKaiti, KaiTi, serif", fontSize: 52 }}>上经 · 药上品</div>
      </div>
      <div style={{ padding: "24px 0 26px 28px", borderLeft: "1px solid rgba(23, 23, 22, .2)", color: ink }}>
        <div style={{ color: accent, fontSize: 19, fontWeight: 700 }}>别名</div>
        <div style={{ marginTop: 10, fontFamily: "STKaiti, KaiTi, serif", fontSize: 52 }}>一名节华</div>
      </div>
    </div>

    <div style={{ position: "absolute", right: 74, top: 72, opacity: fade(frame, 16, 44) }}>
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
        opacity: fade(frame, 32, 56),
      }}
    >
      古籍条目 · 本草经
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
        top: 166,
        opacity: fade(frame, 0, 30),
        transform: `translateY(${rise(frame, 0, 24)}px)`,
      }}
    >
      <SectionLabel accent={accent} size={24}>CLASSICAL ENTRY / 古籍原文</SectionLabel>
      <div
        style={{
          marginTop: 34,
          color: ink,
          fontFamily: "STKaiti, KaiTi, serif",
          fontSize: 72,
          lineHeight: 1.35,
        }}
      >
        主风，头眩肿痛，目欲脱，泪出，皮肤死肌，恶风湿痹。久服，利血气，轻身、耐老、延年。
      </div>
    </div>

    <div
      style={{
        position: "absolute",
        left: 74,
        right: 74,
        top: 640,
        padding: "28px 30px 30px",
        borderTop: `3px solid ${accent}`,
        borderBottom: "1px solid rgba(23, 23, 22, .25)",
        backgroundColor: "rgba(247, 242, 231, .82)",
        opacity: fade(frame, 20, 44),
      }}
    >
      <SectionLabel accent={accent} size={22}>MODERN READING / 今译</SectionLabel>
      <div style={{ marginTop: 22, color: ink, fontSize: 42, lineHeight: 1.5 }}>
        主治风邪所致的眩晕、头部肿痛，目如欲脱，泪出，皮肤麻木如死肌，恶风、风湿痹痛。久服，气血和利，身体轻健，耐老延年。
      </div>
      <div style={{ marginTop: 18, color: mutedInk, fontSize: 26 }}>
        "目欲脱"即眼珠胀痛如欲脱出；今译不作现代病症理解。
      </div>
    </div>

    <div
      style={{
        position: "absolute",
        left: 74,
        right: 74,
        top: 1160,
        color: mutedInk,
        fontFamily: "STKaiti, KaiTi, serif",
        fontSize: 34,
        lineHeight: 1.5,
        opacity: fade(frame, 30, 54),
      }}
    >
      经文之外，《名医》另录产地、别名与四时采期。
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
        opacity: fade(frame, 0, 30),
        transform: `translateY(${rise(frame, 0, 24)}px)`,
      }}
    >
      <SectionLabel accent={accent} size={24}>FIELD NOTE</SectionLabel>
      <div style={{ marginTop: 28, color: ink, fontFamily: "STKaiti, KaiTi, serif", fontSize: 86, lineHeight: 1.05 }}>
        本草初识
      </div>
      <div style={{ marginTop: 36, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ padding: "22px 24px", border: "1px solid rgba(23, 23, 22, .2)", color: ink }}>
          <div style={{ color: accent, fontSize: 24, fontWeight: 700 }}>生境</div>
          <div style={{ marginTop: 12, fontFamily: "STKaiti, KaiTi, serif", fontSize: 42 }}>生川泽及田野</div>
        </div>
        <div style={{ padding: "22px 24px", border: "1px solid rgba(23, 23, 22, .2)", color: ink }}>
          <div style={{ color: accent, fontSize: 24, fontWeight: 700 }}>采集</div>
          <div style={{ marginTop: 12, fontFamily: "STKaiti, KaiTi, serif", fontSize: 42 }}>九月采花</div>
        </div>
      </div>
      <div
        style={{
          marginTop: 26,
          padding: "21px 26px 23px",
          borderLeft: `4px solid ${accent}`,
          backgroundColor: "rgba(247, 242, 231, .76)",
          color: ink,
        }}
      >
        <div style={{ color: accent, fontSize: 22, fontWeight: 700 }}>《名医》补录</div>
        <div style={{ marginTop: 12, fontFamily: "STKaiti, KaiTi, serif", fontSize: 42, lineHeight: 1.4 }}>
          生雍州。一名日精，一名女节，一名女华，一名女茎
        </div>
      </div>
    </div>

    <div
      style={{
        position: "absolute",
        left: 74,
        right: 74,
        top: 900,
        padding: "24px 0 28px",
        borderTop: "1px solid rgba(23, 23, 22, .26)",
        borderBottom: "1px solid rgba(23, 23, 22, .26)",
        color: ink,
        opacity: fade(frame, 22, 46),
      }}
    >
      <SectionLabel accent={accent} size={20}>PUBLICATION NOTE</SectionLabel>
      <div style={{ marginTop: 18, fontFamily: "STKaiti, KaiTi, serif", fontSize: 46, lineHeight: 1.12 }}>
        《神农本草经》· 卷一 · 上经
      </div>
      <div style={{ marginTop: 16, color: mutedInk, fontFamily: "STKaiti, KaiTi, serif", fontSize: 32 }}>
        原书按上、中、下三品分类收载。
      </div>
    </div>

    <div style={{ position: "absolute", left: 74, right: 74, top: 1152, color: mutedInk, fontSize: 28, lineHeight: 1.55 }}>
      古籍内容展示，不构成诊疗建议
    </div>

    <div
      style={{
        position: "absolute",
        right: 78,
        top: 1340,
        width: 224,
        height: 224,
        opacity: fade(frame, 22, 46),
        transform: `translateY(${rise(frame, 22, 16)}px) rotate(-6deg)`,
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

export const JuhuaFirstFilm: React.FC = () => (
  <FinishedFilm
    accent={accent}
    durationInFrames={360}
    music={staticFile("music/yuzhou-changwan.mp3")}
    breaks={[120, 240]}
    scenes={[HeroScene, ClassicalScene, ClosingScene]}
  />
);
