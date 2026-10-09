// 长视频镜头组件。设计在这里写死（配色、字号、留白、动效曲线），镜头清单只给内容与时间。
// 每个组件收到的时间都是「整片绝对秒」，由 scripts/longform/build.ts 预先算好。
// 新增镜头类型：在 plan.ts 加 schema，在 build.ts 加编译分支，在这里加组件，三处缺一不可。
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile } from "remotion";
import {
  LINEAGE_LANE_DY,
  LINEAGE_LANE_Y0,
  PAGE_CELL,
  lineageX,
} from "./plan";

export const PAPER = "#EEE5D0";
export const INK = "#1F1A15";
export const RED = "#A8322A";
export const DIM = "#7A6E60";
export const LIGHT = "#F6EEDC";
/** 霞鹜文楷由 src/index.ts 全局加载（只有 Regular，粗体由浏览器合成）。 */
export const FONT = '"LXGW WenKai", serif';

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.33, 0, 0.2, 1);
export const ramp = (t: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(t, [a, b], [from, to], { ...clamp, easing: ease });

type Mark = { a: number; b: number; from: number; to: number };
type ImageRef = { file: string; credit: string };

// ---------- 书页（据语料录文，竖排右起） ----------
export type PageProps = {
  t: number;
  book: string;
  meta: string;
  text: string;
  colLen: number;
  targetCol: number;
  marks: Mark[];
  zoom?: { from: number; to: number; scale: number };
  width?: number;
};
export const PageShot: React.FC<PageProps> = ({ t, book, meta, text, colLen, targetCol, marks, zoom, width = 1920 }) => {
  const chars = [...text];
  const cols = Math.ceil(chars.length / colLen);
  const colW = PAGE_CELL * 1.25;
  const pageW = cols * colW + 120;
  const pageH = colLen * PAGE_CELL + 100;
  const z = zoom ? ramp(t, zoom.from, zoom.to, 1, zoom.scale) : 1;
  const targetX = pageW - 60 - (targetCol + 0.5) * colW;
  const shiftX = zoom ? ramp(t, zoom.from, zoom.to, 0, pageW / 2 - targetX) : 0;
  const firstMark = marks.length ? Math.min(...marks.map((m) => m.from)) : Infinity;
  const dimAll = ramp(t, firstMark - 0.6, firstMark);
  const litOf = (i: number) => {
    let lit = 0;
    for (const m of marks) {
      if (i < m.a || i >= m.b) continue;
      const p = m.b - m.a > 1 ? (i - m.a) / (m.b - m.a - 1) : 0;
      const start = m.from + p * (m.to - m.from);
      lit = Math.max(lit, ramp(t, start, start + 0.25));
    }
    return lit;
  };
  return (
    <AbsoluteFill style={{ width, overflow: "hidden" }}>
      <div
        data-box="content"
        style={{
          position: "absolute",
          left: width / 2 - pageW / 2,
          top: 500 - pageH / 2,
          width: pageW,
          height: pageH,
          background: "#F3EBD8",
          boxShadow: "0 18px 50px rgba(60,40,20,0.25)",
          transform: `scale(${z}) translateX(${shiftX}px)`,
          border: "1px solid #CDBB98",
        }}
      >
        {Array.from({ length: cols }).map((_, c) => (
          <div
            key={c}
            style={{
              position: "absolute",
              right: 60 + c * colW,
              top: 50,
              width: colW,
              height: colLen * PAGE_CELL,
              borderLeft: c === cols - 1 ? "1px solid #C9A88A" : undefined,
              borderRight: "1px solid #C9A88A",
            }}
          >
            {chars.slice(c * colLen, (c + 1) * colLen).map((ch, r) => {
              const lit = litOf(c * colLen + r);
              return (
                <div
                  key={r}
                  style={{
                    height: PAGE_CELL,
                    display: "grid",
                    placeItems: "center",
                    fontFamily: FONT,
                    fontSize: 38,
                    color: lit > 0 ? RED : INK,
                    opacity: Math.max(1 - dimAll * 0.55, lit),
                    background: lit > 0 ? `rgba(168,50,42,${0.1 * lit})` : undefined,
                  }}
                >
                  {ch}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", right: 80, top: 70, fontFamily: FONT, fontSize: 24, color: DIM, letterSpacing: 3, textAlign: "right" }}>
        《{book}》· {meta}
        <div style={{ fontSize: 18, marginTop: 6, opacity: 0.8 }}>据语料录文 · 非原书影</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 实拍 + 大字 ----------
export const PhotoShot: React.FC<{
  t: number;
  from: number;
  to: number;
  image: ImageRef;
  zoom: [number, number];
  pan: [number, number];
  y: number;
  title: string | null;
  gloss: string | null;
  titleAt: number;
}> = ({ t, from, to, image, zoom, pan, y, title, gloss, titleAt }) => {
  const z = interpolate(t, [from, to], zoom, clamp);
  const x = interpolate(t, [from, to], pan, clamp);
  const big = title && [...title].length <= 3;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: INK }}>
      <Img
        src={staticFile(image.file)}
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z}) translate(${x}px, ${y}px)`, filter: "sepia(0.25) saturate(0.85)" }}
      />
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(20,15,10,0.55) 0%, rgba(20,15,10,0) 45%)" }} />
      {title ? (
        <div data-box="content" style={{ position: "absolute", left: 150, top: big ? 250 : 380, opacity: ramp(t, titleAt, titleAt + 0.6) }}>
          <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: big ? 210 : 120, color: LIGHT, letterSpacing: big ? 20 : 10, lineHeight: 1 }}>{title}</div>
          {gloss ? <div style={{ fontFamily: FONT, fontSize: 40, color: "#EADFC8", marginTop: 34, letterSpacing: 4 }}>{gloss}</div> : null}
        </div>
      ) : null}
      <Credit text={image.credit} />
    </AbsoluteFill>
  );
};

const Credit: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: "absolute", right: 24, bottom: 18, fontSize: 15, color: "rgba(255,255,255,0.6)", fontFamily: "sans-serif" }}>{text}</div>
);

// ---------- 检索点阵：总数 → 命中 ----------
export const DotsShot: React.FC<{
  t: number;
  from: number;
  total: number;
  hits: number[];
  countLabel: string;
  hitLabel: string;
  note: string;
  hitAt: number;
}> = ({ t, from, total, hits, countLabel, hitLabel, note, hitAt }) => {
  const COLS = 39;
  const hitSet = new Set(hits);
  const appear = ramp(t, from, from + 1.2);
  const count = Math.round(interpolate(t, [from, from + 1.4], [0, total], clamp));
  const hitP = ramp(t, hitAt - 0.2, hitAt + 0.6);
  const shown = hitP > 0 ? Math.round(interpolate(hitP, [0, 1], [total, hits.length])) : count;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 140, top: 300, fontFamily: FONT }}>
        <div style={{ fontSize: 190, color: hitP > 0.5 ? RED : INK, lineHeight: 1, fontWeight: 600 }}>{shown}</div>
        <div style={{ fontSize: 40, color: DIM, marginTop: 20, letterSpacing: 4 }}>{hitP > 0.5 ? hitLabel : countLabel}</div>
        <div style={{ fontSize: 24, color: DIM, marginTop: 14, opacity: hitP }}>{note}</div>
      </div>
      <div style={{ position: "absolute", left: 760, top: 250, display: "grid", gridTemplateColumns: `repeat(${COLS}, 24px)`, gap: 3 }}>
        {Array.from({ length: total }).map((_, i) => {
          const isHit = hitSet.has(i);
          const o = i / total < appear ? appear : 0;
          return (
            <div
              key={i}
              style={{
                width: 24,
                height: 24,
                borderRadius: 2,
                background: isHit && hitP > 0 ? RED : INK,
                opacity: isHit ? Math.max(o * 0.25, hitP) : o * (0.25 - 0.15 * hitP),
                transform: isHit ? `scale(${1 + 0.35 * hitP})` : undefined,
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------- 谱系图 ----------
type LNode = { name: string; dyn: string; year: number; key: boolean; at: number; lane: number };
export const LineageShot: React.FC<{ t: number; title: string; nodes: LNode[] }> = ({ t, title, nodes }) => {
  const laneY = (l: number) => LINEAGE_LANE_Y0 + l * LINEAGE_LANE_DY;
  const axisY = 860;
  const sorted = [...nodes].sort((a, b) => a.year - b.year);
  const eras: [string, number][] = [
    ["唐", 820],
    ["宋", 1100],
    ["元", 1310],
    ["明", 1520],
    ["清", 1760],
    ["民国", 1925],
  ];
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <line x1={120} x2={1800} y1={axisY} y2={axisY} stroke={INK} strokeWidth={2} opacity={0.6} />
        {sorted.slice(1).map((n, i) => {
          const p = sorted[i];
          const prog = ramp(t, n.at - 0.5, n.at);
          const [x1, y1, x2, y2] = [lineageX(p.year), laneY(p.lane), lineageX(n.year), laneY(n.lane)];
          const mx = (x1 + x2) / 2;
          const len = Math.hypot(x2 - x1, y2 - y1) * 1.3 + 40;
          return (
            <path
              key={n.name}
              d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
              fill="none"
              stroke={RED}
              strokeWidth={n.key ? 3 : 2}
              opacity={0.75}
              strokeDasharray={len}
              strokeDashoffset={len * (1 - prog)}
            />
          );
        })}
      </svg>
      {eras.map(([e, y]) => (
        <div key={e} style={{ position: "absolute", left: lineageX(y) - 40, width: 80, top: axisY + 18, textAlign: "center", fontFamily: FONT, fontSize: 34, color: INK }}>
          {e}
        </div>
      ))}
      {nodes.map((n) => {
        const o = ramp(t, n.at - 0.1, n.at + 0.3);
        return (
          <div
            key={n.name}
            style={{
              position: "absolute",
              left: lineageX(n.year),
              top: laneY(n.lane),
              transform: `translate(-50%, -12px) scale(${interpolate(o, [0, 1], [0.6, 1])})`,
              opacity: o,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ width: n.key ? 22 : 14, height: n.key ? 22 : 14, borderRadius: "50%", background: RED, border: `3px solid ${PAPER}` }} />
            <div data-box="label" style={{ marginTop: 6, fontFamily: FONT, fontSize: n.key ? 34 : 21, fontWeight: n.key ? 600 : 400, color: INK, whiteSpace: "nowrap", background: "rgba(238,229,208,0.85)", padding: "0 6px" }}>
              {n.key ? `《${n.name}》` : n.name}
            </div>
            {n.key ? <div style={{ fontFamily: FONT, fontSize: 22, color: DIM }}>{n.dyn}</div> : null}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 140, top: 200, fontFamily: FONT, fontSize: 30, color: DIM, letterSpacing: 3 }}>{title}</div>
    </AbsoluteFill>
  );
};

// ---------- 竖排清单（一句一列） ----------
export const ColumnsShot: React.FC<{ t: number; from: number; source: string; lines: string[]; emphasize: number; emphasizeAt: number }> = ({
  t,
  from,
  source,
  lines,
  emphasize,
  emphasizeAt,
}) => {
  const red = ramp(t, emphasizeAt, emphasizeAt + 0.4);
  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "row-reverse", justifyContent: "center", alignItems: "flex-start", gap: 80, paddingTop: 170 }}>
      {lines.map((l, i) => {
        const on = i === emphasize;
        const o = ramp(t, from + i * 0.35, from + i * 0.35 + 0.4);
        return (
          <div
            key={l}
            data-box="content"
            style={{
              writingMode: "vertical-rl",
              // 竖排元素默认会撑满可用高度（一直到画面底），收紧到内容高度，超出 760 就折列
              height: "fit-content",
              maxHeight: 760,
              fontFamily: FONT,
              fontSize: 42,
              letterSpacing: 4,
              color: on && red > 0.5 ? RED : INK,
              opacity: o * (on ? 1 : 1 - 0.5 * red),
              fontWeight: on ? 600 : 400,
            }}
          >
            {l}
          </div>
        );
      })}
      <div style={{ position: "absolute", right: 80, top: 70, fontFamily: FONT, fontSize: 24, color: DIM, letterSpacing: 3 }}>{source}</div>
    </AbsoluteFill>
  );
};

// ---------- 无言：N 部书都不说理由 ----------
export const SilentShot: React.FC<{ t: number; from: number; count: number; text: string }> = ({ t, from, count, text }) => (
  <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", opacity: ramp(t, from, from + 0.6) }}>
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${count}, 56px)`, gap: 14 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 56,
            height: 80,
            border: `2px solid ${INK}`,
            opacity: 0.45 * ramp(t, from + i * 0.04, from + i * 0.04 + 0.3),
            display: "grid",
            placeItems: "center",
            fontFamily: FONT,
            fontSize: 30,
            color: DIM,
          }}
        >
          ？
        </div>
      ))}
    </div>
    <div style={{ fontFamily: FONT, fontSize: 40, color: INK, marginTop: 50, letterSpacing: 6 }}>{text}</div>
  </AbsoluteFill>
);

// ---------- 对质：左实拍，右书页，最后两字变形 ----------
export const ConfrontShot: React.FC<
  Omit<PageProps, "width" | "zoom"> & {
    from: number;
    to: number;
    image: ImageRef;
    arrow: string;
    arrowAt: number;
    morph: { from: string; to: string; at: number };
  }
> = (p) => {
  const { t, from, to, image, arrow, arrowAt, morph } = p;
  const split = ramp(t, from, from + 0.7);
  const m = ramp(t, morph.at, morph.at + 0.8);
  const swap = ramp(t, morph.at + 0.6, morph.at + 1.4);
  const [a0, a1] = [...morph.from];
  const b1 = [...morph.to][1];
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, top: 0, width: 960 * split, height: 1080, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: -480, width: 1920, height: 1080 }}>
          <PhotoShot t={t} from={from} to={to} image={image} zoom={[1.15, 1.15]} pan={[-60, 110]} y={0} title={null} gloss={null} titleAt={from} />
        </div>
        <div style={{ position: "absolute", left: 120, top: 760, fontFamily: FONT, fontSize: 64, color: LIGHT, letterSpacing: 10, opacity: ramp(t, arrowAt, arrowAt + 0.4) }}>{arrow}</div>
      </div>
      <div style={{ position: "absolute", left: 960, top: 0, width: 960, height: 1080, overflow: "hidden", opacity: split * (1 - m) }}>
        <PageShot {...p} width={960} />
      </div>
      <div style={{ position: "absolute", left: 960, top: 0, width: 960, height: 1080, opacity: m, display: "flex", alignItems: "center", justifyContent: "center", background: PAPER }}>
        <div style={{ fontFamily: FONT, fontSize: 150, letterSpacing: 16, color: INK, display: "flex", gap: 10 }}>
          <span style={{ color: RED }}>{a0}</span>
          <span style={{ position: "relative", width: 150, height: 160 }}>
            <span style={{ position: "absolute", left: 0, opacity: 1 - swap }}>{a1}</span>
            <span style={{ position: "absolute", left: 0, opacity: swap }}>{b1}</span>
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 结案：一个字砸下来，盖印 ----------
export const VerdictShot: React.FC<{ t: number; char: string; seal: string; slamAt: number }> = ({ t, char, seal, slamAt }) => {
  const s = interpolate(t, [slamAt, slamAt + 0.35], [2.4, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const sealP = ramp(t, slamAt + 1.0, slamAt + 1.25);
  return (
    <AbsoluteFill style={{ display: "grid", placeItems: "center" }}>
      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 520, color: INK, transform: `scale(${s})`, opacity: ramp(t, slamAt, slamAt + 0.2), lineHeight: 1 }}>{char}</div>
      <div
        style={{
          position: "absolute",
          left: 1230,
          top: 650,
          width: 150,
          height: 150,
          border: `6px solid ${RED}`,
          color: RED,
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 56,
          display: "grid",
          placeItems: "center",
          transform: `rotate(-8deg) scale(${interpolate(sealP, [0, 1], [1.6, 1])})`,
          opacity: sealP * 0.9,
          writingMode: "vertical-rl",
        }}
      >
        {seal}
      </div>
    </AbsoluteFill>
  );
};

// ---------- 片尾卡 ----------
export const EndCard: React.FC<{ t: number; from: number; series: string; next: string; sources: string; disclaimer: string }> = ({
  t,
  from,
  series,
  next,
  sources,
  disclaimer,
}) => (
  <AbsoluteFill style={{ background: INK, opacity: ramp(t, from, from + 0.6), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
    <div style={{ color: "#F3EAD6", fontSize: 76, letterSpacing: 18 }}>{series}</div>
    <div style={{ color: "#C9BBA0", fontSize: 34, marginTop: 30, letterSpacing: 6 }}>{next}</div>
    <div style={{ color: "#8E826F", fontSize: 22, marginTop: 70, letterSpacing: 2, textAlign: "center", lineHeight: 1.8 }}>
      {sources}
      <br />
      {disclaimer}
    </div>
  </AbsoluteFill>
);
