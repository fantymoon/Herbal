import { AbsoluteFill, Img, staticFile } from "remotion";
import type { TopicContent } from "./tu-que";

// 封面。**不能从成片截帧**——缩略图尺寸下要重新构图：
// 信息流里封面只有 200px 宽，成片那一帧的字号到那里就成了一片灰。
//
// 横屏给 B 站 / YouTube（16:9），竖屏给抖音 / 视频号（9:16）。
// 两者不是同一张图裁两次：竖屏要重排，否则书影会被裁掉一半。

const INK = "#161310";
const PAPER = "#f2ead9";
const DIM = "#8d8272";
const ACCENT = "#c0503c";

const bodyFont = "STKaiti, KaiTi, serif";
const latinFont = "Arial, sans-serif";

/** 书影裁切：右半页「妊娠所忌」，框住「食兔肉令子無聲缺唇」那一列。 */
const PLATE = {
  file: "plates/yinshan-p06.jpg",
  natural: { w: 1500, h: 1313 },
  crop: { x: 640, y: 150, w: 820, h: 620 },
  box: { x: 1315, y: 298, w: 92, h: 428 },
};

const Plate: React.FC<{ width: number }> = ({ width }) => {
  const scale = width / PLATE.crop.w;
  const height = PLATE.crop.h * scale;
  return (
    <div
      style={{
        width,
        height,
        overflow: "hidden",
        position: "relative",
        border: "1px solid rgba(242,234,217,.18)",
        boxShadow: "0 30px 70px rgba(0,0,0,.5)",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: PLATE.natural.w * scale,
          height: PLATE.natural.h * scale,
          left: -PLATE.crop.x * scale,
          top: -PLATE.crop.y * scale,
        }}
      >
        <Img
          src={staticFile(PLATE.file)}
          style={{ width: "100%", height: "100%", objectFit: "fill" }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: (PLATE.box.x - PLATE.crop.x) * scale,
          top: (PLATE.box.y - PLATE.crop.y) * scale,
          width: PLATE.box.w * scale,
          height: PLATE.box.h * scale,
          border: `3px solid ${ACCENT}`,
          backgroundColor: "rgba(192,80,60,.18)",
        }}
      />
    </div>
  );
};

/** 横屏封面 1920x1080：左书影、右问题。 */
export const TopicCoverLandscape: React.FC<{ content: TopicContent }> = ({ content }) => (
  <AbsoluteFill style={{ backgroundColor: INK, flexDirection: "row", alignItems: "center" }}>
    <div style={{ position: "absolute", left: 96, top: 240 }}>
      <Plate width={800} />
    </div>
    <div style={{ position: "absolute", left: 980, top: 360, width: 840 }}>
      <div style={{ width: 84, height: 4, backgroundColor: ACCENT, marginBottom: 40 }} />
      <div
        style={{
          color: PAPER,
          fontFamily: bodyFont,
          fontSize: 104,
          lineHeight: 1.28,
          letterSpacing: 2,
        }}
      >
        {content.question}
      </div>
      <div
        style={{
          marginTop: 46,
          color: DIM,
          fontFamily: bodyFont,
          fontSize: 40,
          letterSpacing: 3,
        }}
      >
        {content.deck}
      </div>
    </div>
    <div
      style={{
        position: "absolute",
        left: 96,
        bottom: 96,
        color: DIM,
        fontFamily: latinFont,
        fontSize: 26,
        letterSpacing: 5,
      }}
    >
      {content.tagline}
    </div>
  </AbsoluteFill>
);

/** 竖屏封面 1080x1920：问题在上、书影在下，整体重排而不是裁切。 */
export const TopicCoverPortrait: React.FC<{ content: TopicContent }> = ({ content }) => (
  <AbsoluteFill style={{ backgroundColor: INK }}>
    <div style={{ position: "absolute", left: 88, top: 230, width: 904 }}>
      <div style={{ width: 84, height: 4, backgroundColor: ACCENT, marginBottom: 40 }} />
      <div
        style={{
          color: PAPER,
          fontFamily: bodyFont,
          fontSize: 104,
          lineHeight: 1.3,
          letterSpacing: 2,
        }}
      >
        {content.question}
      </div>
      <div
        style={{
          marginTop: 44,
          color: DIM,
          fontFamily: bodyFont,
          fontSize: 42,
          letterSpacing: 3,
        }}
      >
        {content.deck}
      </div>
    </div>
    <div style={{ position: "absolute", left: 88, top: 900 }}>
      <Plate width={904} />
    </div>
    <div
      style={{
        position: "absolute",
        left: 88,
        bottom: 130,
        color: DIM,
        fontFamily: latinFont,
        fontSize: 28,
        letterSpacing: 5,
      }}
    >
      {content.tagline}
    </div>
  </AbsoluteFill>
);
