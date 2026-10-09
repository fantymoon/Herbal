// 联络表：一张图看完整片。每个镜头取「最后一个动作完成后」的一帧，缩成 1/4 排成网格。
//
//   npx remotion still src/index.ts LongformPangxieSheet .longform-work/pangxie-sheet.png
//
// 同时在浏览器里量版面（只有渲染出来才量得准，字宽、折行都靠真实字体）：
//   - 标了 data-box 的元素跑出画面；
//   - data-box="content" 压进底部字幕区；
//   - data-box="label"（谱系图书名）互相重叠。
// 有问题的格子描红并写出原因，表头写「版面问题 N 处」。看图的人（或模型）只需要找红框。
import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import { LongformFilm } from "./LongformFilm";
import { H, W, type CompiledFilm } from "./plan";
import { FONT, INK, PAPER, RED } from "./shots";

const SCALE = 0.25;
const CW = W * SCALE;
const CH = H * SCALE;
const COLS = 4;
const LABEL_H = 64;
const SUBTITLE_TOP = H - 130; // 字幕条上沿（原尺寸坐标）

export const sheetFrames = (film: CompiledFilm) => {
  const picks = film.shots.map((s, i) => {
    const last = s.events.filter((e) => e <= s.to).reduce((m, e) => Math.max(m, e), s.from);
    const at = Math.min(s.to - 0.15, Math.max(s.from + 0.8, last + 0.9));
    return { at, label: `${i + 1} · ${s.type} · ${at.toFixed(1)}s` };
  });
  picks.push({ at: film.end.from + 1.2, label: `片尾 · ${(film.end.from + 1.2).toFixed(1)}s` });
  return picks;
};
export const sheetSize = (film: CompiledFilm) => {
  const n = sheetFrames(film).length;
  return { width: COLS * CW + 40, height: Math.ceil(n / COLS) * (CH + LABEL_H) + 110 };
};

const Cell: React.FC<{ film: CompiledFilm; at: number; label: string; onIssues: (n: number) => void }> = ({ film, at, label, onIssues }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [issues, setIssues] = useState<string[] | null>(null);
  const [handle] = useState(() => delayRender(`measure ${label}`));
  useLayoutEffect(() => {
    // 等字体加载完成再量，否则量的是回落字体
    document.fonts.ready.then(() =>
      requestAnimationFrame(() => {
        const root = ref.current;
        if (!root) return continueRender(handle);
        const cell = root.getBoundingClientRect();
        const rel = (el: Element) => {
          const r = el.getBoundingClientRect();
          return { x0: (r.left - cell.left) / SCALE, y0: (r.top - cell.top) / SCALE, x1: (r.right - cell.left) / SCALE, y1: (r.bottom - cell.top) / SCALE };
        };
        // 实际不透明度 = 自身乘以所有祖先（镜头淡入淡出挂在祖先上）
        const visible = (el: Element) => {
          let o = 1;
          for (let n: Element | null = el; n && n !== root; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
          return o > 0.3 && el.getBoundingClientRect().width > 0;
        };
        const found: string[] = [];
        const boxes = [...root.querySelectorAll("[data-box]")].filter(visible);
        for (const el of boxes) {
          const b = rel(el);
          const name = (el.textContent ?? "").slice(0, 8);
          if (b.x0 < -2 || b.y0 < -2 || b.x1 > W + 2 || b.y1 > H + 2) found.push(`出画：${name}`);
          else if (el.getAttribute("data-box") === "content" && b.y1 > SUBTITLE_TOP) found.push(`压字幕：${name}`);
        }
        const labels = boxes.filter((el) => el.getAttribute("data-box") === "label").map((el) => ({ el, b: rel(el) }));
        for (let i = 0; i < labels.length; i++)
          for (let j = i + 1; j < labels.length; j++) {
            const [p, q] = [labels[i].b, labels[j].b];
            if (p.x0 < q.x1 && q.x0 < p.x1 && p.y0 < q.y1 && q.y0 < p.y1) found.push(`重叠：${labels[i].el.textContent}/${labels[j].el.textContent}`);
          }
        setIssues(found);
        onIssues(found.length);
        continueRender(handle);
      }),
    );
  }, [handle, label, onIssues]);
  const bad = issues && issues.length > 0;
  return (
    <div style={{ width: CW, height: CH + LABEL_H }}>
      <div ref={ref} style={{ width: CW, height: CH, overflow: "hidden", position: "relative", outline: bad ? `6px solid ${RED}` : `1px solid #BFB096` }}>
        <div style={{ width: W, height: H, transform: `scale(${SCALE})`, transformOrigin: "0 0", position: "absolute" }}>
          <LongformFilm film={film} at={at} />
        </div>
      </div>
      <div style={{ fontFamily: FONT, fontSize: 18, color: bad ? RED : INK, marginTop: 6, lineHeight: 1.3 }}>
        {label}
        {bad ? <div style={{ fontSize: 15 }}>{issues!.slice(0, 2).join("；")}</div> : null}
      </div>
    </div>
  );
};

export const ContactSheet: React.FC<{ film: CompiledFilm }> = ({ film }) => {
  const frames = sheetFrames(film);
  const [reports, setReports] = useState<number[]>([]);
  const add = React.useCallback((n: number) => setReports((r) => [...r, n]), []);
  const count = reports.reduce((a, b) => a + b, 0);
  // 等每个格子都量完、表头的计数已经提交，才允许截图
  const [handle] = useState(() => delayRender("contact sheet"));
  React.useEffect(() => {
    if (reports.length === frames.length) continueRender(handle);
  }, [reports.length, frames.length, handle]);
  return (
    <AbsoluteFill style={{ background: PAPER, padding: 20 }}>
      <div style={{ fontFamily: FONT, fontSize: 34, color: count ? RED : INK, height: 70 }}>
        {film.series} · {film.title}{"\u3000"}{frames.length} 格{"\u3000"}{count ? `版面问题 ${count} 处（红框）` : "版面检查通过"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, ${CW}px)`, gap: 0 }}>
        {frames.map((f) => (
          <Cell key={f.label} film={film} at={f.at} label={f.label} onIssues={add} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
