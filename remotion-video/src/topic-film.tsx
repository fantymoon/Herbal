import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { createContext, useContext } from "react";
import { FinishedMusic } from "./finished-shell";
import { BED_GAIN } from "./topic-audio";
import type { Segment, TopicContent } from "./topics/tu-que";
import type { VoiceSegment } from "./topics/tu-que.voice";
import { BookPlate, EraTimeline } from "./topic-graphics";

// 跨书整合系列的渲染器。
//
// 与单味药短片系列的关系：只共享 Remotion 这个渲染工具，不共享任何业务代码。
// 那个系列的时间基准是"阅读量"，这个系列的时间基准是"旁白时长"——两条不同的线。
//
// 唯一的例外是 `FinishedMusic`：它没有自己的时间基准，只按 composition 时长铺一条
// 带淡入淡出的音床，两个系列对它的要求完全一样。这里的 `loop` 是必须的——见
// `finished-shell.tsx` 里那段注释：六分钟的片子比任何一首曲子都长。
//
// 版式取"左图右文"：深墨底、米白字、朱红作标记。横屏 1920x1080。
// 为什么是横屏：这个系列的证据是古籍书页、古画、时间线，它们天然是横向的，
// 竖屏要裁掉一半；观看场景也是"坐下来看"，不是"站着刷"。
// 四种屏各有各的画法，不能只靠引文兜底——role="stat" 的屏没有引文，
// 早先它因此渲染成一片空屏。

const INK = "#161310";
const PAPER = "#f2ead9";
const DIM = "#8d8272";
const ACCENT = "#c0503c";

const bodyFont = "STKaiti, KaiTi, serif";
const latinFont = "Arial, sans-serif";

/**
 * 两套几何，一套横屏一套竖屏。
 *
 * 竖屏**不是把横屏裁出来**：横屏是"左书影右问题"，竖屏是"上问题下书影"——
 * 直接裁会把书影切掉一半。抖音是竖屏信息流，横屏发上去会上下留黑边，
 * 全屏观感差、完播率受影响，所以两个平台各用各的排版，共用同一份内容与配音。
 */
export type Orientation = "landscape" | "portrait";

type Geometry = {
  width: number;
  height: number;
  safe: number;
  plate: { x: number; y: number; w: number; h: number };
  text: { x: number; top: number; w: number };
  quoteSize: number;
  statSize: number;
  headlineSize: number;
  kickerSize: number;
  caption: { size: number; bottom: number; width: number };
  foot: { bottom: number; width: number };
  rule: { w: number; gap: number };
};

const LAYOUTS: Record<Orientation, Geometry> = {
  landscape: {
    width: 1920,
    height: 1080,
    safe: 88,
    plate: { x: 88, y: 130, w: 800, h: 560 },
    text: { x: 968, top: 290, w: 864 },
    quoteSize: 62,
    statSize: 190,
    headlineSize: 80,
    kickerSize: 24,
    caption: { size: 38, bottom: 104, width: 1180 },
    foot: { bottom: 104, width: 460 },
    rule: { w: 72, gap: 36 },
  },
  portrait: {
    width: 1080,
    height: 1920,
    safe: 88,
    // 竖屏：文字在上、书影在下。书影按 1080-176=904 宽铺满，高度随比例。
    // y 取 780：书影下沿落在 1463，字幕区从约 1512 起，留出约 50px 净空——
    // 早先取 880，书影底边被字幕压住。
    plate: { x: 88, y: 780, w: 904, h: 683 },
    text: { x: 88, top: 250, w: 904 },
    quoteSize: 76,
    statSize: 240,
    headlineSize: 96,
    kickerSize: 26,
    caption: { size: 44, bottom: 210, width: 904 },
    foot: { bottom: 96, width: 904 },
    rule: { w: 84, gap: 40 },
  },
};

const GeoContext = createContext<Geometry>(LAYOUTS.landscape);
const useGeo = (): Geometry => useContext(GeoContext);

const fadeIn = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/** 左侧证据位：有书影就上书影，否则上时间线。两者都是内容，不是装饰。 */
const Plate: React.FC<{ seg: Segment; content: TopicContent; frame: number }> = ({
  seg,
  content,
  frame,
}) => {
  const appear = fadeIn(frame, 4, 30);
  const geo = useGeo();
  const plate = seg.plate;
  return (
    <div
      style={{
        position: "absolute",
        left: geo.plate.x,
        top: geo.plate.y,
        width: geo.plate.w,
        height: geo.plate.h,
        opacity: appear,
        transform: `translateY(${(1 - appear) * 14}px)`,
      }}
    >
      {plate?.file ? (
        <BookPlate
          file={plate.file}
          natural={plate.natural ?? { w: 1500, h: 1313 }}
          crop={plate.crop ?? { x: 520, y: 150, w: 940, h: 620 }}
          highlight={plate.box}
          width={geo.plate.w}
          frame={frame}
        />
      ) : (
        <EraTimeline
          highlight={plate?.highlight ?? null}
          note={plate?.note ?? null}
          frame={frame}
          width={geo.plate.w}
          eras={content.eras}
        />
      )}
    </div>
  );
};

/** 引文屏：照录原文 + 出处，落在右侧文字区。 */
const Quote: React.FC<{ quote: Segment["quote"]; frame: number }> = ({ quote, frame }) => {
  const geo = useGeo();
  if (!quote) return null;
  const appear = fadeIn(frame, 8, 34);
  return (
    <div
      style={{
        position: "absolute",
        left: geo.text.x,
        top: geo.text.top,
        width: geo.text.w,
        opacity: appear,
        transform: `translateY(${(1 - appear) * 14}px)`,
      }}
    >
      <div
        style={{
          width: geo.rule.w,
          height: 3,
          backgroundColor: ACCENT,
          marginBottom: geo.rule.gap,
        }}
      />
      <div
        style={{
          color: PAPER,
          fontFamily: bodyFont,
          fontSize: geo.quoteSize,
          lineHeight: 1.5,
          letterSpacing: 2,
        }}
      >
        {quote.text}
      </div>
      <div
        style={{
          marginTop: geo.rule.gap,
          color: DIM,
          fontFamily: bodyFont,
          fontSize: Math.round(geo.quoteSize * 0.48),
          letterSpacing: 1,
        }}
      >
        {quote.source}
      </div>
    </div>
  );
};

/** 数据屏：一个大数字 + 一句注。没有它这一类屏会全空。 */
const Stat: React.FC<{ stat: NonNullable<Segment["stat"]>; frame: number }> = ({ stat, frame }) => {
  const geo = useGeo();
  const appear = fadeIn(frame, 8, 34);
  return (
    <div
      style={{
        position: "absolute",
        left: geo.text.x,
        top: geo.text.top + 50,
        width: geo.text.w,
        opacity: appear,
        transform: `translateY(${(1 - appear) * 14}px)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
        <div
          style={{
            color: PAPER,
            fontFamily: latinFont,
            fontSize: geo.statSize,
            fontWeight: 700,
            lineHeight: 0.9,
            letterSpacing: -6,
          }}
        >
          {stat.value}
        </div>
        <div
          style={{
            color: DIM,
            fontFamily: bodyFont,
            fontSize: Math.round(geo.statSize * 0.24),
          }}
        >
          {stat.unit}
        </div>
      </div>
      <div style={{ width: 96, height: 3, backgroundColor: ACCENT, margin: "42px 0 30px" }} />
      <div
        style={{
          color: DIM,
          fontFamily: bodyFont,
          fontSize: Math.round(geo.statSize * 0.18),
          lineHeight: 1.6,
        }}
      >
        {stat.note}
      </div>
    </div>
  );
};

/** 开场屏与收尾屏：一句大字标题。 */
const Headline: React.FC<{ kicker: string; text: string; frame: number }> = ({
  kicker,
  text,
  frame,
}) => {
  const geo = useGeo();
  const appear = fadeIn(frame, 8, 40);
  return (
    <div
      style={{
        position: "absolute",
        left: geo.text.x,
        top: geo.text.top + 50,
        width: geo.text.w,
        opacity: appear,
        transform: `translateY(${(1 - appear) * 14}px)`,
      }}
    >
      <div
        style={{
          color: DIM,
          fontFamily: latinFont,
          fontSize: geo.kickerSize,
          letterSpacing: 6,
          marginBottom: 28,
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          color: PAPER,
          fontFamily: bodyFont,
          fontSize: geo.headlineSize,
          lineHeight: 1.36,
          letterSpacing: 2,
        }}
      >
        {text}
      </div>
      <div style={{ width: 96, height: 3, backgroundColor: ACCENT, marginTop: 44 }} />
    </div>
  );
};

/** 旁白字幕：按分句时间高亮，当前句亮、前后句压暗。 */
const Caption: React.FC<{ seg: VoiceSegment; frame: number }> = ({ seg, frame }) => {
  const geo = useGeo();
  if (seg.cues.length === 0) return null;
  const seconds = frame / 30;
  const active = seg.cues.findIndex((c) => seconds >= c.start && seconds < c.end);
  const current = active >= 0 ? active : seg.cues.length - 1;
  const visible = seg.cues.slice(Math.max(0, current - 1), current + 2);

  return (
    <div
      style={{
        position: "absolute",
        left: geo.safe,
        bottom: geo.caption.bottom,
        width: geo.caption.width,
      }}
    >
      {visible.map((cue) => {
        const isActive = cue === seg.cues[current];
        return (
          <div
            key={`${cue.start}`}
            style={{
              color: isActive ? PAPER : "#5d564a",
              fontFamily: bodyFont,
              fontSize: geo.caption.size,
              lineHeight: 1.5,
              marginTop: 10,
            }}
          >
            {cue.text}
          </div>
        );
      })}
    </div>
  );
};

const SegmentView: React.FC<{
  content: TopicContent;
  seg: VoiceSegment;
  source: Segment;
  index: number;
  total: number;
  globalFrame: number;
  totalFrames: number;
}> = ({ content, seg, source, index, total, globalFrame, totalFrames }) => {
  const frame = useCurrentFrame();
  const geo = useGeo();
  const role = source.role ?? "plain";

  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      {/* 底纹：极淡的横向纸纹 + 四周压暗的暗角。
          纯色底在大屏上会显得"空"，而这一系列一屏只停 15–25 秒，
          底色有没有质感，直接决定它像"影像"还是像"幻灯片"。 */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(242,234,217,.016) 0px, rgba(242,234,217,.016) 1px, transparent 1px, transparent 4px)",
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 50% 45%, transparent 35%, rgba(0,0,0,.55) 100%)",
        }}
      />
      <Plate seg={source} content={content} frame={frame} />
      {role === "title" ? (
        <Headline kicker="TOPIC" text={content.question} frame={frame} />
      ) : role === "closing" ? (
        <Headline kicker="END" text={content.closingLine} frame={frame} />
      ) : source.stat ? (
        <Stat stat={source.stat} frame={frame} />
      ) : (
        <Quote quote={source.quote} frame={frame} />
      )}
      <Caption seg={seg} frame={frame} />
      <div
        style={{
          position: "absolute",
          right: geo.safe,
          bottom: geo.foot.bottom,
          width: geo.foot.width,
          textAlign: "right",
          opacity: fadeIn(frame, 0, 20),
        }}
      >
        <div style={{ color: DIM, fontFamily: latinFont, fontSize: 22, letterSpacing: 2 }}>
          {content.deck} {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </div>
        <div style={{ height: 1, backgroundColor: "#3a352c", marginTop: 16 }}>
          <div
            style={{
              height: 1,
              width: `${Math.min(1, Math.max(0, globalFrame / totalFrames)) * 100}%`,
              backgroundColor: ACCENT,
            }}
          />
        </div>
        <div
          style={{
            color: "#5d564a",
            fontFamily: latinFont,
            fontSize: 20,
            marginTop: 14,
            letterSpacing: 1,
          }}
        >
          {(globalFrame / 30 / 60).toFixed(1)} / {(totalFrames / 30 / 60).toFixed(1)} MIN
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const TopicFilm: React.FC<{
  content: TopicContent;
  voice: { topic: string; fps: number; totalFrames: number; segments: VoiceSegment[] };
  /** 默认横屏。竖屏给抖音 / 视频号，几何取自 LAYOUTS.portrait。 */
  orientation?: Orientation;
}> = ({ content, voice, orientation = "landscape" }) => {
  const globalFrame = useCurrentFrame();
  return (
    <GeoContext.Provider value={LAYOUTS[orientation]}>
      {/*
        `peakVolume` was left at `FinishedMusic`'s default, which is 0.12 — a value tuned for
        the 12-second short films, where the bed barely gets going before the film ends. This
        series is six minutes of continuous narration on top of a track mastered 7.4 dB hotter
        than the voice, so the default put the bed's peaks 4.5 dB above the voice. See
        `src/topic-audio.ts` for the measurement.
      */}
      <FinishedMusic src={staticFile(content.music)} loop peakVolume={BED_GAIN} />
      {voice.segments.map((seg, index) => {
        const source = content.segments[index];
        if (!source) return null;
        return (
          <Sequence key={seg.index} from={seg.startFrame} durationInFrames={seg.frames}>
            <SegmentView
              content={content}
              seg={seg}
              source={source}
              index={index}
              total={voice.segments.length}
              globalFrame={globalFrame}
              totalFrames={voice.totalFrames}
            />
            <Audio
              src={staticFile(`voice/${voice.topic}/seg-${String(seg.index).padStart(2, "0")}.mp3`)}
            />
          </Sequence>
        );
      })}
    </GeoContext.Provider>
  );
};
