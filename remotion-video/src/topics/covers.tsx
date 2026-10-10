import { AbsoluteFill } from "remotion";
import type { CompiledFilm } from "../longform/plan";
// 配色从片子那里 import，不另抄一套。第一版照着旧封面写死了深底
// （#161310），而长视频是纸白底（PAPER #EEE5D0）——封面和成片摆在一起就是两个账号。
// **一份调色板只有一个出处**，抄第二份就会漂移。
import { DIM, INK, PAPER, RED } from "../longform/shots";

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

const ACCENT = RED;

const bodyFont = "'LXGW WenKai', STKaiti, KaiTi, serif";
const latinFont = "Arial, sans-serif";

/**
 * 这一期在书页上点出来的那一页。
 *
 * 编译产物里的 `marks` 不是文本而是**下标**（`{a, b, from, to}` 指向 `text` 里的一段），
 * 因为渲染时要按时间逐字点亮，存下标比存字符串省事。封面要的是整页 + 那一段的范围。
 *
 * **要整页，不要只取那一句。** 第一版只把点出的 13 个字竖排出来，结果下半幅空着、
 * 引文缩在角上——它成了装饰。片子里的书页是整页照录文排成多列的，封面照做才对得上，
 * 而"点出哪一句"靠朱红，不靠只剩一句。
 */
const pageOf = (film: CompiledFilm): { text: string; a: number; b: number } | null => {
  const page = film.shots.find((s) => s.type === "page");
  const text = page?.text;
  if (typeof text !== "string" || text === "") return null;
  const marks = page?.marks;
  const first = Array.isArray(marks) ? (marks[0] as { a?: unknown; b?: unknown } | undefined) : undefined;
  return {
    text,
    a: typeof first?.a === "number" ? first.a : 0,
    b: typeof first?.b === "number" ? first.b : 0,
  };
};

/**
 * 照录文排成的竖排书页：多列，从右往左读，被点出的那段是朱红。
 *
 * 字号按**列**算：一列装得下 `高 / (字号 × 1.5)` 个字，列数 = 字数 / 每列，
 * 而 `列数 × 字号 × 1.6`（列距）要装进给定的宽。取装得下的最大字号，
 * 所以框给多大就排多满——**这正是封面和成片对得上、而不像贴了张图的原因。**
 *
 * 一个字一个 div。**不要用 `writing-mode: vertical-rl` + `text-orientation: upright`**：
 * 在本机的 Chromium 里那两行没有生效，字被横倒了 90°，而封面是 200px 缩略图，
 * 横倒的字比排错更难发现。一列 div 没有那个自由度，也就没有这个失败方式。
 */
const PageBlock: React.FC<{ film: CompiledFilm; width: number; height: number }> = ({
  film,
  width,
  height,
}) => {
  const page = pageOf(film);
  const text = page?.text ?? film.title;
  const size =
    [72, 66, 60, 54, 48, 44, 40, 36, 32, 28, 24].find((s) => {
      const perColumn = Math.floor(height / (s * 1.5));
      if (perColumn < 1) return false;
      return Math.ceil(text.length / perColumn) * s * 1.6 <= width;
    }) ?? 24;
  const perColumn = Math.max(1, Math.floor(height / (size * 1.5)));
  const columns: string[] = [];
  for (let i = 0; i < text.length; i += perColumn) columns.push(text.slice(i, i + perColumn));

  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "row-reverse",
        justifyContent: "flex-start",
        gap: size * 0.6,
        fontFamily: bodyFont,
        fontSize: size,
        lineHeight: 1.5,
        color: INK,
      }}
    >
      {columns.map((column, ci) => (
        <div key={ci} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {[...column].map((ch, i) => {
            const index = ci * perColumn + i;
            const marked = page !== null && index >= page.a && index < page.b;
            return (
              <span key={i} style={marked ? { color: ACCENT } : undefined}>
                {ch}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const Rule: React.FC = () => <div style={{ width: 84, height: 4, backgroundColor: ACCENT }} />;

/** 横屏封面 1920x1080：左引文、右问题。 */
export const TopicCoverLandscape: React.FC<{ film: CompiledFilm }> = ({ film }) => (
  <AbsoluteFill style={{ backgroundColor: PAPER }}>
    <div style={{ position: "absolute", left: 120, top: 150 }}>
      <PageBlock film={film} width={680} height={780} />
    </div>
    <div style={{ position: "absolute", left: 900, top: 330, width: 900 }}>
      <div style={{ marginBottom: 40 }}>
        <Rule />
      </div>
      <div
        style={{
          color: INK,
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
  <AbsoluteFill style={{ backgroundColor: PAPER }}>
    <div style={{ position: "absolute", left: 88, top: 240, width: 904 }}>
      <div style={{ marginBottom: 40 }}>
        <Rule />
      </div>
      <div
        style={{
          color: INK,
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
    <div style={{ position: "absolute", left: 88, top: 820 }}>
      {/* 820 + 860 = 1680，系列名在 1762——中间留 80px。
          第一版给了 960 + 820 = 1780，正好压到系列名上：**框高要给到，位置也要算到**。 */}
      <PageBlock film={film} width={904} height={860} />
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
