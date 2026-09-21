import { Img, staticFile } from "remotion";
import { fade, rise } from "../herbal-cards";
import { ink, mutedInk, SectionLabel, Seal } from "../herbal-stage";
import { FinishedFilm } from "../finished-shell";

const accent = "#9b6053";
const sourceQuote = "主咳逆上气，温疟、寒热，洗在皮肤中。";
const modernReading = "这段记载列出气逆咳嗽、冷热反复等描述；其中“洗”字，底本另注“洗音癣”。";

const HeroScene: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <div
      style={{
        position: "absolute",
        left: 74,
        top: 154,
        right: 74,
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
          fontSize: 166,
          lineHeight: 0.92,
        }}
      >
        当归
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
        DANG GUI
      </div>
    </div>

    <div
      style={{
        position: "absolute",
        left: 74,
        right: 74,
        top: 510,
        padding: "31px 31px 34px",
        borderTop: `4px solid ${accent}`,
        borderBottom: "1px solid rgba(23, 23, 22, .28)",
        backgroundColor: "rgba(247, 242, 231, .74)",
        opacity: fade(frame, 12, 30),
        transform: `translateY(${rise(frame, 12, 18)}px)`,
      }}
    >
      <div style={{ color: accent, fontSize: 24, fontWeight: 700 }}>原文开篇</div>
      <div
        style={{
          marginTop: 16,
          color: ink,
          fontFamily: "STKaiti, KaiTi, serif",
          fontSize: 80,
          lineHeight: 1.08,
        }}
      >
        味甘，温。
      </div>
      <div style={{ marginTop: 20, color: mutedInk, fontSize: 30 }}>《神农本草经》· 卷二 · 中经</div>
    </div>

    <div
      style={{
        position: "absolute",
        left: 74,
        right: 74,
        top: 860,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        borderTop: "1px solid rgba(23, 23, 22, .28)",
        borderBottom: "1px solid rgba(23, 23, 22, .28)",
        opacity: fade(frame, 18, 36),
      }}
    >
      <div style={{ padding: "28px 28px 30px 0", color: ink }}>
        <div style={{ color: accent, fontSize: 22, fontWeight: 700 }}>篇目位置</div>
        <div style={{ marginTop: 12, fontFamily: "STKaiti, KaiTi, serif", fontSize: 52 }}>中经 · 药中品</div>
      </div>
      <div
        style={{
          padding: "28px 0 30px 30px",
          borderLeft: "1px solid rgba(23, 23, 22, .22)",
          color: ink,
        }}
      >
        <div style={{ color: accent, fontSize: 22, fontWeight: 700 }}>阅读顺序</div>
        <div style={{ marginTop: 12, fontFamily: "Arial, sans-serif", fontSize: 47, fontWeight: 700 }}>
          ENTRY 05
        </div>
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
        opacity: fade(frame, 22, 38),
      }}
    >
      古籍条目 · 按原文顺序阅读
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
        opacity: fade(frame, 0, 18),
        transform: `translateY(${rise(frame, 0, 18)}px)`,
      }}
    >
      <SectionLabel accent={accent} size={24}>CLASSICAL ENTRY / 原文</SectionLabel>
      <div
        style={{
          marginTop: 32,
          color: ink,
          fontFamily: "STKaiti, KaiTi, serif",
          fontSize: 70,
          lineHeight: 1.26,
        }}
      >
        {sourceQuote}
      </div>
    </div>

    <div
      style={{
        position: "absolute",
        left: 74,
        right: 74,
        top: 735,
        padding: "28px 30px 30px",
        borderTop: `3px solid ${accent}`,
        borderBottom: "1px solid rgba(23, 23, 22, .25)",
        backgroundColor: "rgba(247, 242, 231, .82)",
        opacity: fade(frame, 16, 34),
      }}
    >
      <SectionLabel accent={accent} size={22}>MODERN READING / 今译</SectionLabel>
      <div style={{ marginTop: 22, color: ink, fontSize: 40, lineHeight: 1.48 }}>{modernReading}</div>
      <div style={{ marginTop: 18, color: mutedInk, fontSize: 26 }}>此处仅解释原文语义，不构成诊疗建议</div>
    </div>

    <div
      style={{
        position: "absolute",
        left: 74,
        right: 74,
        top: 1186,
        color: mutedInk,
        fontFamily: "STKaiti, KaiTi, serif",
        fontSize: 31,
        lineHeight: 1.45,
        opacity: fade(frame, 22, 38),
      }}
    >
      《神农本草经》卷二 · 中经
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
        top: 168,
        opacity: fade(frame, 0, 18),
        transform: `translateY(${rise(frame, 0, 18)}px)`,
      }}
    >
      <SectionLabel accent={accent} size={24}>READING CONTINUED</SectionLabel>
      <div
        style={{
          marginTop: 34,
          color: ink,
          fontFamily: "STKaiti, KaiTi, serif",
          fontSize: 68,
          lineHeight: 1.17,
        }}
      >
        妇人漏下绝子，诸恶创疡、金创。煮饮之。
      </div>
      <div
        style={{
          marginTop: 28,
          padding: "23px 27px 25px",
          borderLeft: `4px solid ${accent}`,
          backgroundColor: "rgba(247, 242, 231, .76)",
          color: ink,
        }}
      >
        <div style={{ color: accent, fontSize: 22, fontWeight: 700 }}>别名与生境</div>
        <div style={{ marginTop: 12, fontFamily: "STKaiti, KaiTi, serif", fontSize: 54 }}>一名干归。生川谷。</div>
      </div>
      <div style={{ marginTop: 27, color: mutedInk, fontSize: 29, lineHeight: 1.55 }}>
        古籍内容展示，不构成诊疗建议
      </div>
    </div>

    <div
      style={{
        position: "absolute",
        left: 74,
        right: 74,
        top: 920,
        padding: "24px 0 27px",
        borderTop: "1px solid rgba(23, 23, 22, .26)",
        borderBottom: "1px solid rgba(23, 23, 22, .26)",
        color: mutedInk,
        fontSize: 31,
        lineHeight: 1.45,
        opacity: fade(frame, 14, 30),
      }}
    >
      原条目后接《吴普》注，记其“或生羌胡地”。
    </div>

    <div
      style={{
        position: "absolute",
        right: 78,
        top: 1170,
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

export const AngelicaFourthFilm: React.FC = () => (
  <FinishedFilm
    accent={accent}
    durationInFrames={240}
    music={staticFile("music/yuzhou-changwan.mp3")}
    peakVolume={0.1}
    breaks={[78, 162]}
    scenes={[HeroScene, ClassicalScene, ClosingScene]}
  />
);
