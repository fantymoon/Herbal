import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { FinishedMusic } from "./finished-shell";
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

const W = 1920;
const SAFE = 88;

/** 左侧证据区。四种屏共用同一几何，换屏时视觉不跳。 */
const PLATE = { x: SAFE, y: 130, w: 800, h: 560 };
const TEXT_X = PLATE.x + PLATE.w + 80;
const TEXT_W = W - SAFE - TEXT_X;

const fadeIn = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/** 左侧证据位：有书影就上书影，否则上时间线。两者都是内容，不是装饰。 */
const Plate: React.FC<{ seg: Segment; frame: number }> = ({ seg, frame }) => {
  const appear = fadeIn(frame, 4, 30);
  const plate = seg.plate;
  return (
    <div
      style={{
        position: "absolute",
        left: PLATE.x,
        top: PLATE.y,
        width: PLATE.w,
        height: PLATE.h,
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
          frame={frame}
        />
      ) : (
        <EraTimeline
          highlight={plate?.highlight ?? null}
          note={plate?.note ?? null}
          frame={frame}
        />
      )}
    </div>
  );
};

/** 引文屏：照录原文 + 出处，落在右侧文字区。 */
const Quote: React.FC<{ quote: Segment["quote"]; frame: number }> = ({ quote, frame }) => {
  if (!quote) return null;
  const appear = fadeIn(frame, 8, 34);
  return (
    <div
      style={{
        position: "absolute",
        left: TEXT_X,
        top: 200,
        width: TEXT_W,
        opacity: appear,
        transform: `translateY(${(1 - appear) * 14}px)`,
      }}
    >
      <div style={{ width: 72, height: 3, backgroundColor: ACCENT, marginBottom: 36 }} />
      <div
        style={{
          color: PAPER,
          fontFamily: bodyFont,
          fontSize: 62,
          lineHeight: 1.5,
          letterSpacing: 2,
        }}
      >
        {quote.text}
      </div>
      <div style={{ marginTop: 38, color: DIM, fontFamily: bodyFont, fontSize: 30, letterSpacing: 1 }}>
        {quote.source}
      </div>
    </div>
  );
};

/** 数据屏：一个大数字 + 一句注。没有它这一类屏会全空。 */
const Stat: React.FC<{ stat: NonNullable<Segment["stat"]>; frame: number }> = ({ stat, frame }) => {
  const appear = fadeIn(frame, 8, 34);
  return (
    <div
      style={{
        position: "absolute",
        left: TEXT_X,
        top: 250,
        width: TEXT_W,
        opacity: appear,
        transform: `translateY(${(1 - appear) * 14}px)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
        <div
          style={{
            color: PAPER,
            fontFamily: latinFont,
            fontSize: 190,
            fontWeight: 700,
            lineHeight: 0.9,
            letterSpacing: -6,
          }}
        >
          {stat.value}
        </div>
        <div style={{ color: DIM, fontFamily: bodyFont, fontSize: 46 }}>{stat.unit}</div>
      </div>
      <div style={{ width: 96, height: 3, backgroundColor: ACCENT, margin: "42px 0 30px" }} />
      <div style={{ color: DIM, fontFamily: bodyFont, fontSize: 34, lineHeight: 1.6 }}>{stat.note}</div>
    </div>
  );
};

/** 开场屏与收尾屏：一句大字标题。 */
const Headline: React.FC<{ kicker: string; text: string; frame: number }> = ({
  kicker,
  text,
  frame,
}) => {
  const appear = fadeIn(frame, 8, 40);
  return (
    <div
      style={{
        position: "absolute",
        left: TEXT_X,
        top: 250,
        width: TEXT_W,
        opacity: appear,
        transform: `translateY(${(1 - appear) * 14}px)`,
      }}
    >
      <div style={{ color: DIM, fontFamily: latinFont, fontSize: 24, letterSpacing: 6, marginBottom: 28 }}>
        {kicker}
      </div>
      <div
        style={{
          color: PAPER,
          fontFamily: bodyFont,
          fontSize: 80,
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
  if (seg.cues.length === 0) return null;
  const seconds = frame / 30;
  const active = seg.cues.findIndex((c) => seconds >= c.start && seconds < c.end);
  const current = active >= 0 ? active : seg.cues.length - 1;
  const visible = seg.cues.slice(Math.max(0, current - 1), current + 2);

  return (
    <div style={{ position: "absolute", left: SAFE, bottom: 104, width: 1180 }}>
      {visible.map((cue) => {
        const isActive = cue === seg.cues[current];
        return (
          <div
            key={`${cue.start}`}
            style={{
              color: isActive ? PAPER : "#5d564a",
              fontFamily: bodyFont,
              fontSize: 38,
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
  const role = source.role ?? "plain";

  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      <Plate seg={source} frame={frame} />
      {role === "title" ? (
        <Headline kicker="TOPIC" text={content.question} frame={frame} />
      ) : role === "closing" ? (
        <Headline kicker="END" text="古籍是人的记录，不是自然的记录。" frame={frame} />
      ) : source.stat ? (
        <Stat stat={source.stat} frame={frame} />
      ) : (
        <Quote quote={source.quote} frame={frame} />
      )}
      <Caption seg={seg} frame={frame} />
      <div
        style={{
          position: "absolute",
          right: SAFE,
          bottom: 104,
          width: 460,
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
}> = ({ content, voice }) => {
  const globalFrame = useCurrentFrame();
  return (
    <>
      <FinishedMusic src={staticFile(content.music)} loop />
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
    </>
  );
};
