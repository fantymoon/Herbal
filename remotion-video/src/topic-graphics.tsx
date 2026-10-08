// 跨书整合系列的信息图。
//
// 这些图形不是装饰，是内容本身：跨书整合的价值就在"把散落各处的材料摆到一起"，
// 而摆到一起这件事只有画出来才看得见。AI 生成图像恰恰做不了这个——
// 它需要精确的文字与结构，不能有任何一处编造。

import { Img, staticFile } from "remotion";

const PAPER = "#f2ead9";
const DIM = "#8d8272";
const ACCENT = "#c0503c";
const FAINT = "#4a443a";

const bodyFont = "STKaiti, KaiTi, serif";
const latinFont = "Arial, sans-serif";

/**
 * 古籍书影：证据的另一半。
 *
 * 信息图说明"这条说法跨了多长"，书影说明"这真的是书上写的"——少了后者，
 * 观众没有理由相信旁白。crop / highlight 都用**原图像素坐标**，
 * 这样换一页只需改数字，不必重新量版面。
 */
export const BookPlate: React.FC<{
  file: string;
  /** 原图总尺寸，用于换算缩放。 */
  natural: { w: number; h: number };
  /** 要显示的区域（原图像素）。 */
  crop: { x: number; y: number; w: number; h: number };
  /** 要框出的那一行（原图像素）。 */
  highlight?: { x: number; y: number; w: number; h: number };
  /** 显示宽度，默认铺满证据位。 */
  width?: number;
  frame: number;
}> = ({ file, natural, crop, highlight, width = 800, frame }) => {
  const scale = width / crop.w;
  const height = crop.h * scale;
  const appear = Math.min(1, frame / 26);
  // 缓慢推近：一屏停 15–25 秒，完全静止的书影会读成"一张图贴在画面上"。
  // 幅度压得很小（5%），目的是让人感到画面是活的，而不是让人注意到镜头在动。
  const drift = Math.min(1, frame / 900);
  const zoom = 1 + drift * 0.05;
  // 高亮框缓慢呼吸，把视线引到那一列上。
  const pulse = 0.5 + 0.5 * Math.abs(Math.sin(frame / 52));
  return (
    <div
      style={{
        width,
        height,
        overflow: "hidden",
        position: "relative",
        opacity: appear,
        border: "1px solid rgba(242,234,217,.16)",
        boxShadow: "0 24px 60px rgba(0,0,0,.45)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${zoom})`,
          transformOrigin: "58% 42%",
        }}
      >
        {/*
          用一层显式尺寸的 div 包住 Img：直接给 <Img> 设 width/height 时，
          Remotion 的 Img 不会按绝对定位的负偏移铺开，结果是书影只渲染出左侧一条，
          高亮框就落在了空白上。内层 div 定尺寸、Img 填满它，才可控。
        */}
        <div
          style={{
            position: "absolute",
            width: natural.w * scale,
            height: natural.h * scale,
            left: -crop.x * scale,
            top: -crop.y * scale,
          }}
        >
          <Img src={staticFile(file)} style={{ width: "100%", height: "100%", objectFit: "fill" }} />
        </div>
        {highlight ? (
          <div
            style={{
              position: "absolute",
              left: (highlight.x - crop.x) * scale,
              top: (highlight.y - crop.y) * scale,
              width: highlight.w * scale,
              height: highlight.h * scale,
              border: `2px solid ${ACCENT}`,
              backgroundColor: `rgba(192,80,60,${(0.1 + pulse * 0.12).toFixed(3)})`,
              boxShadow: `0 0 ${(10 + pulse * 14).toFixed(0)}px rgba(192,80,60,${(0.25 + pulse * 0.3).toFixed(3)})`,
            }}
          />
        ) : null}
      </div>
    </div>
  );
};

/** 一条说法在各朝的落点。highlight 用于点亮本期正在讲的那一环。 */
export type Era = {
  dynasty: string;
  years: string;
  books: string[];
};

const DEFAULT_ERAS: Era[] = [
  { dynasty: "汉", years: "前2世纪", books: ["《淮南子》"] },
  { dynasty: "隋唐", years: "610", books: ["《诸病源候论》", "《外台秘要》"] },
  { dynasty: "宋", years: "992", books: ["《太平圣惠方》", "《妇人大全良方》"] },
  { dynasty: "元", years: "1330", books: ["《饮膳正要》"] },
  { dynasty: "明清", years: "1578", books: ["《本草纲目》", "《疡医大全》"] },
];

export const EraTimeline: React.FC<{
  highlight: string | null;
  note: string | null;
  frame: number;
  eras?: Era[];
  /** 渲染宽度。横屏证据位 800，竖屏 904——svg 按 viewBox 等比缩放，不必改坐标。 */
  width?: number;
}> = ({ highlight, note, frame, eras = DEFAULT_ERAS, width = 800 }) => {
  // 轴放在容器中线附近：证据位是 560 高，内容约占 215，贴在顶上会留下大片空白。
  const axisY = 360;
  // 两端留出足够余量：首尾两列用 start / end 对齐，轴伸到边缘时书名会被裁掉。
  const left = 104;
  const right = 696;
  const step = (right - left) / (eras.length - 1);

  return (
    <svg width={width} height={Math.round((width * 560) / 800)} viewBox="0 0 800 560">
      <line
        x1={left}
        y1={axisY}
        x2={right}
        y2={axisY}
        stroke={FAINT}
        strokeWidth="1"
        style={{ opacity: Math.min(1, frame / 24) }}
      />
      {eras.map((era, i) => {
        const x = left + step * i;
        const lit = highlight === null || era.books.some((b) => b.includes(highlight));
        const color = lit ? PAPER : FAINT;
        // 首尾两列改用 start / end 对齐，否则书名会越出画布被裁掉。
        const anchor = i === 0 ? "start" : i === eras.length - 1 ? "end" : "middle";
        // 节点逐个亮起：时间线是"跨度"的证据，让观众看着它一格格长出来，
        // 比整条一起淡入更贴近旁白正在讲的事。
        const nodeIn = Math.min(1, Math.max(0, (frame - 10 - i * 7) / 18));
        return (
          <g key={era.dynasty} style={{ opacity: (lit ? 1 : 0.45) * nodeIn }}>
            <circle cx={x} cy={axisY} r={lit ? 6 : 4} fill={lit ? ACCENT : FAINT} />
            <text
              x={x}
              y={axisY - 34}
              fill={color}
              fontFamily={bodyFont}
              fontSize="30"
              textAnchor={anchor}
            >
              {era.dynasty}
            </text>
            <text
              x={x}
              y={axisY - 72}
              fill={DIM}
              fontFamily={latinFont}
              fontSize="17"
              textAnchor={anchor}
            >
              {era.years}
            </text>
            {era.books.map((book, j) => (
              <text
                key={book}
                x={x}
                y={axisY + 46 + j * 32}
                fill={color}
                fontFamily={bodyFont}
                fontSize="16"
                textAnchor={anchor}
              >
                {book}
              </text>
            ))}
          </g>
        );
      })}
      {note ? (
        <text x={left} y={510} fill={DIM} fontFamily={bodyFont} fontSize="24">
          {note}
        </text>
      ) : null}
    </svg>
  );
};
