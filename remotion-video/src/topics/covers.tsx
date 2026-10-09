import { AbsoluteFill } from "remotion";
import type { CompiledFilm } from "../longform/plan";

// 封面。**不能从成片截帧**——缩略图尺寸下要重新构图：
// 信息流里封面只有 200px 宽，成片那一帧的字号到那里就成了一片灰。
//
// 横屏给 B 站 / YouTube（16:9），竖屏给抖音 / 视频号（9:16）。
// 两者不是同一张图裁两次：竖屏要重排，否则左边的字会被裁掉。
//
// 这里曾经放一张《饮膳正要》的扫描件，并把「食兔肉令子無聲缺唇」那一列框红。
// 那个封面只对得上一期片子：扫描件写死了文件名和裁切坐标，换一期就没有图。
// 长视频线的书页一律是**照语料录文排出来的字**（手册 § 写作约定：标「据语料录文 · 非原书影」），
// 所以封面也用同一套字：把这一期那句关键的话竖排出来，它既是图，也是这一期的证据。

const INK = "#161310";
const PAPER = "#f2ead9";
const DIM = "#8d8272";
const ACCENT = "#c0503c";

const bodyFont = "'LXGW WenKai', STKaiti, KaiTi, serif";
const latinFont = "Arial, sans-serif";

/**
 * 这一期在书页上点出来的那一句。
 *
 * 编译产物里的 `marks` 不是文本而是**下标**（`{a, b, from, to}` 指向 `text` 里的一段），
 * 因为渲染时要按时间逐字点亮，存下标比存字符串省事。封面只要那段字，所以按第一个 mark 切。
 */
const keyLine = (film: CompiledFilm): string => {
  const page = film.shots.find((s) => s.type === "page");
  const marks = page?.marks;
  const first = Array.isArray(marks) ? (marks[0] as { a?: unknown; b?: unknown } | undefined) : undefined;
  const text = page?.text;
  if (typeof text === "string" && typeof first?.a === "number" && typeof first?.b === "number") {
    return text.slice(first.a, first.b);
  }
  return film.title;
};

/** 竖排的引文条。竖排不是装饰：书页本来就是竖的，缩略图里它一眼就是"古书"。 */
const Strip: React.FC<{ film: CompiledFilm; height: number }> = ({ film, height }) => {
  const text = keyLine(film);
  // 字号要按**行高**算，不是按字数：15 个字 × 字号 × 1.5 才是这一列真正占的高度。
  // 少除那个 1.5，字列会比声明的框高出三分之一，压到底部的系列名上。
  const size = Math.max(22, Math.min(Math.round(height / (text.length * 1.5)), 46));
  return (
    <div
      style={{
        height,
        // 一字一格排成一列。**不要用 `writing-mode` + `text-orientation: upright`**：
        // 在本机的 Chromium 里那两行没有生效，字被横倒了 90°，而封面是 200px 缩略图，
        // 横倒的字比排错更难发现。一列 div 没有这个自由度，也就没有这个失败方式。
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        color: PAPER,
        fontFamily: bodyFont,
        fontSize: size,
        lineHeight: 1.5,
        borderRight: `2px solid ${ACCENT}`,
        paddingRight: size * 0.5,
      }}
    >
      {[...text].map((ch, i) => (
        <span key={i}>{ch}</span>
      ))}
    </div>
  );
};

const Rule: React.FC = () => <div style={{ width: 84, height: 4, backgroundColor: ACCENT }} />;

/** 横屏封面 1920x1080：左引文、右问题。 */
export const TopicCoverLandscape: React.FC<{ film: CompiledFilm }> = ({ film }) => (
  <AbsoluteFill style={{ backgroundColor: INK }}>
    <div style={{ position: "absolute", left: 120, top: 150 }}>
      <Strip film={film} height={780} />
    </div>
    <div style={{ position: "absolute", left: 560, top: 330, width: 1240 }}>
      <div style={{ marginBottom: 40 }}>
        <Rule />
      </div>
      <div
        style={{
          color: PAPER,
          fontFamily: bodyFont,
          fontSize: 108,
          lineHeight: 1.3,
          letterSpacing: 2,
        }}
      >
        {film.cover.question}
      </div>
      {film.cover.deck === undefined ? null : (
        <div
          style={{
            marginTop: 48,
            color: DIM,
            fontFamily: bodyFont,
            fontSize: 42,
            letterSpacing: 3,
          }}
        >
          {film.cover.deck}
        </div>
      )}
    </div>
    <div
      style={{
        position: "absolute",
        left: 560,
        bottom: 96,
        color: DIM,
        fontFamily: latinFont,
        fontSize: 26,
        letterSpacing: 5,
      }}
    >
      {film.series}
    </div>
  </AbsoluteFill>
);

/** 竖屏封面 1080x1920：问题在上、引文在下，整体重排而不是裁切。 */
export const TopicCoverPortrait: React.FC<{ film: CompiledFilm }> = ({ film }) => (
  <AbsoluteFill style={{ backgroundColor: INK }}>
    <div style={{ position: "absolute", left: 88, top: 240, width: 904 }}>
      <div style={{ marginBottom: 40 }}>
        <Rule />
      </div>
      <div
        style={{
          color: PAPER,
          fontFamily: bodyFont,
          fontSize: 108,
          lineHeight: 1.3,
          letterSpacing: 2,
        }}
      >
        {film.cover.question}
      </div>
      {film.cover.deck === undefined ? null : (
        <div
          style={{
            marginTop: 46,
            color: DIM,
            fontFamily: bodyFont,
            fontSize: 42,
            letterSpacing: 3,
          }}
        >
          {film.cover.deck}
        </div>
      )}
    </div>
    <div style={{ position: "absolute", left: 88, top: 960 }}>
      <Strip film={film} height={820} />
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
      {film.series}
    </div>
  </AbsoluteFill>
);
