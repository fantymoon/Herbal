// 长视频渲染器：只读 build 产出的 film.json，不做任何判断。
// 画面怎么排在 shots.tsx，时间怎么算在 build.ts，这里只负责把镜头按时间叠起来。
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FinishedMusic } from "../finished-shell";
import type { CompiledFilm, CompiledShot } from "./plan";
import {
  ColumnsShot,
  ConfrontShot,
  DIM,
  DotsShot,
  EndCard,
  FONT,
  INK,
  LineageShot,
  PAPER,
  PageShot,
  PhotoShot,
  RED,
  SilentShot,
  VerdictShot,
  ramp,
} from "./shots";

const FADE = 0.35;
const Layer: React.FC<{ t: number; from: number; to: number; children: React.ReactNode }> = ({ t, from, to, children }) => {
  if (t < from - FADE || t > to + FADE) return null;
  const o = Math.min(ramp(t, from - FADE, from), ramp(t, to, to + FADE, 1, 0));
    // 第一个镜头从第 0 帧起就完全可见：首帧即封面，不从黑场淡入
  return <AbsoluteFill style={{ opacity: from === 0 ? ramp(t, to, to + FADE, 1, 0) : o }}>{children}</AbsoluteFill>;
};

const renderShot = (s: CompiledShot, t: number): React.ReactNode => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = s as any;
  switch (s.type) {
    case "page":
      return <PageShot t={t} {...p} />;
    case "photo":
      return <PhotoShot t={t} {...p} />;
    case "dots":
      return <DotsShot t={t} {...p} />;
    case "lineage":
      return <LineageShot t={t} {...p} />;
    case "columns":
      return <ColumnsShot t={t} {...p} />;
    case "silent":
      return <SilentShot t={t} {...p} />;
    case "confront":
      return <ConfrontShot t={t} {...p} />;
    case "verdict":
      return <VerdictShot t={t} {...p} />;
  }
};

const Chapter: React.FC<{ t: number; film: CompiledFilm }> = ({ t, film }) => {
  if (t >= film.end.from) return null;
  let cur: { num: string; name: string; start: number } | null = null;
  for (const seg of film.segments) {
    if (seg.chapter && seg.chapterNum && t >= Math.max(0, seg.start - 0.6)) cur = { num: seg.chapterNum, name: seg.chapter, start: Math.max(0, seg.start - 0.6) };
  }
  if (!cur) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        top: 64,
        display: "flex",
        alignItems: "center",
        gap: 18,
        opacity: cur.start === 0 ? 1 : ramp(t, cur.start, cur.start + 0.5),
        background: "rgba(238,229,208,0.88)",
        padding: "8px 18px 8px 10px",
        borderRadius: 4,
      }}
    >
      <div style={{ width: 54, height: 54, border: `2px solid ${RED}`, color: RED, fontFamily: FONT, fontSize: 32, display: "grid", placeItems: "center" }}>{cur.num}</div>
      <div style={{ fontFamily: FONT, fontSize: 30, color: INK, letterSpacing: 8 }}>{cur.name}</div>
      <div style={{ fontFamily: FONT, fontSize: 22, color: DIM, letterSpacing: 4, marginLeft: 14 }}>
        {film.series} · {film.title}
      </div>
    </div>
  );
};

const Subtitle: React.FC<{ t: number; film: CompiledFilm }> = ({ t, film }) => {
  let text = "";
  for (const seg of film.segments) {
    const local = t - seg.start;
    if (local < -0.05 || local > seg.dur + 0.3) continue;
    for (const c of seg.cues) if (local >= c.s - 0.05) text = c.text;
  }
  if (!text) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 58, display: "flex", justifyContent: "center" }}>
      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 38, color: "#FBF6EA", background: "rgba(31,26,21,0.72)", padding: "8px 26px 10px", borderRadius: 4, letterSpacing: 2 }}>
        {text}
      </div>
    </div>
  );
};

/** `at` 给定时渲染那一秒的静帧且不出声（联络表用）。 */
export const LongformFilm: React.FC<{ film: CompiledFilm; at?: number }> = ({ film, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = at ?? frame / fps;
  const silent = at !== undefined;
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, ${PAPER} 0%, #E3D7BC 75%, #D3C4A3 100%)` }} />
      {silent ? null : <FinishedMusic src={staticFile(film.music)} peakVolume={film.musicVolume} />}
      {silent ? null : film.segments.map((seg, i) => (
        <Sequence key={i} from={Math.round(seg.start * fps)} durationInFrames={Math.ceil((seg.dur + 0.2) * fps)}>
          <Audio src={staticFile(`voice/${film.id}/seg-${String(i + 1).padStart(2, "0")}.mp3`)} />
        </Sequence>
      ))}
      {film.shots.map((s, i) => (
        <Layer key={i} t={t} from={s.from} to={s.to}>
          {renderShot(s, t)}
        </Layer>
      ))}
      <EndCard t={t} series={film.series} {...film.end} />
      <Chapter t={t} film={film} />
      <Subtitle t={t} film={film} />
    </AbsoluteFill>
  );
};
