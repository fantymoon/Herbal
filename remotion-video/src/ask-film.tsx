import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { ReactNode } from "react";
import { FinishedMusic } from "./finished-shell";
import {
  ASK_H as H,
  ASK_SAFE as SAFE,
  ASK_TEXT_FLOOR as TEXT_FLOOR,
  ASK_W as W,
  SEAL_GLYPH,
  spokenChars,
  spokenIndexOf,
  type AskContent,
  type AskSegment,
  type AskVoice,
  type AskVoiceSegment,
} from "./asks/types";

// 「本草一问」系列的渲染器。竖屏 1080x1920。
//
// 三条线的分工：单味药短片（src/films/）讲一味药的原文，跨书专题（src/topics/）讲一条
// 说法的一千五百年，这一条讲**一个问题**——每集 40 秒，答一个你想问但没人讲过的本草问题。
// 它只共享 Remotion 与 FinishedMusic（后者没有自己的时间基准，只按 composition 时长铺音床）。
//
// 视觉语言：三色（宣纸米 / 墨黑 / 朱砂红），每个部类另加一个辅色。三种镜头轮着走——
// 微距实物照 → 古书竖排 → 对读。每集都按这个节奏，形成辨识度。
// 版式要点：**古文是画，字幕是话**。竖排原文一个字一个字朱红过去，横排字幕在下面说话，
// 两者不重复劳动——竖排负责"这真是书上写的"，字幕负责"我在说什么"。
// **底部 25% 留给平台 UI：放画面，不放字。**

// 画布与安全边（`W` / `H` / `SAFE` / `TEXT_FLOOR`）来自 src/asks/types.ts，
// 系列封面与渲染器共用同一套数。

// 这几个常量与下面的 `brush` / `heavy` / `AskSeal` 导出给 src/asks/series-cover-film.tsx 用。
// 系列总封面与单集共用一套三色、一款字、一枚印章——写在封面里另起一份常量，
// 封面就会在某次改色后悄悄变成"看起来不太像这个系列"的那一张。
export const PAPER = "#efe6d3";
export const INK = "#17140f";
export const CINNABAR = "#b93a2b";
export const DIM = "#8d8272";
const PAPER_DIM = "#7c7161";

/**
 * 只嵌一款字：霞鹜文楷（SIL OFL 1.1，可商用，由 src/index.ts 加载）。
 *
 * 字幕本想用黑体，但那会引入一个平台依赖——系统黑体在 Windows 上有、在 Linux 上没有，
 * 同一份内容就会渲染出两种片子（这个仓库为此已经付出过 24MB 的字体代价）。
 * 所以全片统一走文楷，字幕与问题用**描边增重**（`-webkit-text-stroke`）来获得
 * "粗一点"的观感：描边是渲染器算的，不依赖任何字体文件，换机器结果一样。
 * 代价是楷体不如黑体易读——这是一个已知取舍，见 asks/README.md 的「还没做的」。
 */
export const brush = "'LXGW WenKai', STKaiti, KaiTi, serif";

/** 描边增重：颜色与字色相同，于是字看起来更粗，而不是多了一圈轮廓。 */
export const heavy = (color: string, width = 1.6) => ({
  WebkitTextStrokeWidth: `${width}px`,
  WebkitTextStrokeColor: color,
});

const clamp01 = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/**
 * 墨晕开：这一系列**唯一**的转场。
 *
 * 做成遮罩而不是贴一张墨点图：遮罩是渲染器算出来的，没有素材依赖，也不会有
 * "素材背景色和画面底色对不上"的问题。内容在一个扩张的圆里显出来，边缘留一点羽化，
 * 看上去像墨在宣纸上洇开。第一屏不用它——第 0 帧就是封面，封面不能是黑的。
 */
const InkReveal: React.FC<{ frame: number; children: ReactNode }> = ({ frame, children }) => {
  const radius = interpolate(frame, [0, 14], [0, 168], { extrapolateRight: "clamp" });
  const mask = `radial-gradient(circle 780px at 50% 44%, #000 ${radius}%, rgba(0,0,0,0) ${radius + 7}%)`;
  return (
    <AbsoluteFill style={{ WebkitMaskImage: mask, maskImage: mask }}>{children}</AbsoluteFill>
  );
};

/** 宣纸底：米色 + 极淡的横向纸纹 + 四周压暗。纯色底在大屏上会读成"空"。 */
const Paper: React.FC<{ tint?: string }> = ({ tint }) => (
  <>
    <AbsoluteFill style={{ backgroundColor: PAPER }} />
    {tint ? <AbsoluteFill style={{ backgroundColor: tint, opacity: 0.05 }} /> : null}
    <AbsoluteFill
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(23,20,15,.035) 0px, rgba(23,20,15,.035) 1px, transparent 1px, transparent 5px)",
      }}
    />
    <AbsoluteFill
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 50% 45%, transparent 42%, rgba(23,20,15,.18) 100%)",
      }}
    />
  </>
);

/** 墨底：给实物屏、对读屏与收尾屏用。 */
export const Ink: React.FC = () => (
  <>
    <AbsoluteFill style={{ backgroundColor: INK }} />
    <AbsoluteFill
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(239,230,211,.018) 0px, rgba(239,230,211,.018) 1px, transparent 1px, transparent 4px)",
      }}
    />
    <AbsoluteFill
      style={{
        backgroundImage: "radial-gradient(ellipse at 50% 45%, transparent 34%, rgba(0,0,0,.58) 100%)",
      }}
    />
  </>
);

/** 印章标记章节：一段一个字。盖印动画只用在收尾屏。 */
export const AskSeal: React.FC<{ glyph: string; frame: number; size?: number; stamp?: boolean }> = ({
  glyph,
  frame,
  size = 104,
  stamp = false,
}) => {
  const appear = stamp ? clamp01(frame, 0, 10) : clamp01(frame, 12, 36);
  // 盖印：从大到小砸下来，过冲一点点再回位。
  const scale = stamp
    ? interpolate(frame, [0, 12, 20], [2.3, 0.93, 1], { extrapolateRight: "clamp" })
    : 1;
  const rotation = stamp
    ? interpolate(frame, [0, 20], [-16, -6], { extrapolateRight: "clamp" })
    : -6;
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `5px solid ${CINNABAR}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: appear,
        transform: `scale(${scale}) rotate(${rotation}deg)`,
        borderRadius: 6,
      }}
    >
      <div
        style={{
          color: CINNABAR,
          fontFamily: brush,
          fontSize: Math.round(size * 0.62),
          lineHeight: 1,
        }}
      >
        {glyph}
      </div>
    </div>
  );
};

/**
 * 横排字幕：当前行亮、下一行压暗。
 *
 * `tone` 是必须的：「书」屏是这一系列唯一的**浅底**屏（宣纸米），
 * 而字幕默认是按深墨底配的米色字——直接放上去就是米色字压在米色纸上，
 * 静帧里几乎读不出来。所以底色浅时字要反过来用墨色，并给一点米色光晕把它托住。
 */
const Caption: React.FC<{ seg: AskVoiceSegment; frame: number; tone?: "dark" | "light" }> = ({
  seg,
  frame,
  tone = "dark",
}) => {
  if (seg.lines.length === 0) return null;
  const seconds = frame / 30;
  let current = 0;
  for (let i = 0; i < seg.lines.length; i += 1) {
    if (seconds >= seg.lines[i].start) current = i;
  }
  const visible = seg.lines.slice(current, current + 2);
  const onLight = tone === "light";
  const strong = onLight ? INK : PAPER;
  const weak = onLight ? "rgba(23,20,15,.40)" : "rgba(239,230,211,.42)";
  const halo = onLight ? "0 1px 14px rgba(239,230,211,.95)" : "0 2px 18px rgba(0,0,0,.85)";
  return (
    <div style={{ position: "absolute", left: SAFE, bottom: H - TEXT_FLOOR + 30, width: W - SAFE * 2 }}>
      {visible.map((line, i) => (
        <div
          key={`${line.start}-${i}`}
          style={{
            color: i === 0 ? strong : weak,
            fontFamily: brush,
            fontSize: i === 0 ? 46 : 38,
            lineHeight: 1.45,
            marginTop: i === 0 ? 0 : 10,
            textShadow: halo,
            ...(i === 0 ? heavy(strong, 1.2) : {}),
          }}
        >
          {line.text}
        </div>
      ))}
    </div>
  );
};

/** 问：全幅实物照 + 大字问题。**第 0 帧即封面**，所以问题不打入场动画。 */
const AskScene: React.FC<{ content: AskContent; segment: AskSegment; seg: AskVoiceSegment; frame: number }> = ({
  content,
  segment,
  seg,
  frame,
}) => {
  const photo = (segment.photos ?? [])[0];
  const push = 1 + clamp01(frame, 0, seg.frames) * 0.05;
  return (
    <AbsoluteFill>
      {photo ? (
        <Img
          src={staticFile(`images/${photo.file}`)}
          style={{
            width: W,
            height: H,
            objectFit: "cover",
            objectPosition: "52% 42%",
            transform: `scale(${push})`,
          }}
        />
      ) : null}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(23,20,15,.74) 0%, rgba(23,20,15,.34) 34%, rgba(23,20,15,.52) 62%, rgba(23,20,15,.92) 100%)",
        }}
      />
      <div style={{ position: "absolute", right: SAFE, top: 150, opacity: clamp01(frame, 6, 26) }}>
        <AskSeal glyph={SEAL_GLYPH.ask} frame={frame} />
      </div>
      <div style={{ position: "absolute", left: SAFE, top: 340, width: W - SAFE * 2 }}>
        <div style={{ color: PAPER_DIM, fontFamily: brush, fontSize: 32, letterSpacing: 8 }}>
          {content.deck}
        </div>
        <div
          style={{
            color: PAPER,
            fontFamily: brush,
            fontSize: 92,
            lineHeight: 1.32,
            letterSpacing: 2,
            marginTop: 40,
            ...heavy(PAPER, 2),
          }}
        >
          {content.question}
        </div>
        <div style={{ width: 132, height: 7, backgroundColor: CINNABAR, marginTop: 52 }} />
      </div>
      <Caption seg={seg} frame={frame} />
    </AbsoluteFill>
  );
};

/** 物：2–3 张实物照慢推切换。它今天是什么、你在哪见过它。 */
const ObjectScene: React.FC<{ segment: AskSegment; seg: AskVoiceSegment; frame: number }> = ({
  segment,
  seg,
  frame,
}) => {
  const photos = segment.photos ?? [];
  const span = seg.frames / Math.max(1, photos.length);
  const active = Math.min(photos.length - 1, Math.floor(frame / span));
  const appear = clamp01(frame, 4, 30);
  const push = 1 + clamp01(frame, 0, seg.frames) * 0.06;
  const current = photos[active];
  return (
    <AbsoluteFill>
      <Ink />
      <div
        style={{
          position: "absolute",
          left: SAFE,
          top: 250,
          width: W - SAFE * 2,
          height: 700,
          overflow: "hidden",
          opacity: appear,
          transform: `translateY(${(1 - appear) * 18}px)`,
          border: "1px solid rgba(239,230,211,.22)",
          boxShadow: "0 30px 70px rgba(0,0,0,.55)",
        }}
      >
        {photos.map((photo, i) => (
          <Img
            key={photo.file}
            src={staticFile(`images/${photo.file}`)}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: i === active ? 1 : 0,
              transform: i === active ? `scale(${push})` : "scale(1)",
              transformOrigin: "54% 46%",
            }}
          />
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: SAFE,
          top: 986,
          width: W - SAFE * 2,
          display: "flex",
          justifyContent: "space-between",
          opacity: appear,
        }}
      >
        <div style={{ color: PAPER, fontFamily: brush, fontSize: 34 }}>{current?.caption ?? ""}</div>
        <div style={{ color: PAPER_DIM, fontFamily: brush, fontSize: 22 }}>{current?.credit ?? ""}</div>
      </div>
      <div
        style={{ position: "absolute", left: SAFE, top: 1064, width: 96, height: 5, backgroundColor: CINNABAR }}
      />
      <Caption seg={seg} frame={frame} />
    </AbsoluteFill>
  );
};

/**
 * 书：宣纸底上竖排原文，读到哪个字哪个字朱红。
 *
 * 这一屏是全系列最不一样的一屏，也是唯一一屏浅底——一集里最亮的一下留给出处。
 * 逐字高亮靠 `seg.quoteTimes`：引文每个字被读出的时刻（秒，相对本段起点）。
 * 标点不朗读，所以"显示字符 → 朗读字号"的映射要跳过标点——下面的 indexMap 干这件事。
 */
/**
 * 「书」段的版面。竖排引文与出处行并排在同一个流式容器里，见 `BookScene`。
 *
 * 上边界让开右上角的印章，下边界让开字幕——字幕在 `TEXT_FLOOR` 以下，所以这一屏的内容
 * 永远不可能再压到它。中间多高都不需要算：列数由高度决定，宽度由 flex 分。
 */
const QUOTE_BAND_TOP = 290;
const QUOTE_BAND_BOTTOM = 660;

const BookScene: React.FC<{ segment: AskSegment; seg: AskVoiceSegment; frame: number; accent: string }> = ({
  segment,
  seg,
  frame,
  accent,
}) => {
  const quote = segment.quote;
  const times = seg.quoteTimes ?? [];
  const appear = clamp01(frame, 4, 30);
  if (!quote) return null;

  const chars = [...quote.text];
  // 一屏能摆几列由容器高度决定，字越大列越少。长引文降一档字号不是为了塞进去——
  // flex 会自己处理宽度——是为了别让它宽到把出处挤成一条竖缝。
  const quoteFontSize = chars.length > 60 ? 64 : chars.length > 40 ? 72 : 80;
  const indexMap: number[] = [];
  let spokenCursor = 0;
  for (const ch of chars) {
    if (spokenChars(ch).length > 0) {
      indexMap.push(spokenCursor);
      spokenCursor += 1;
    } else {
      indexMap.push(-1);
    }
  }

  // 屏幕上摆的是整段原文，旁白只读其中一句，所以朱红要从 read 在引文里的位置开始亮。
  // 两个偏移都由逐字比对得出（ask-build 已经核对过 read 同时是旁白与引文的连续子串），
  // 这里只负责把它接到时间轴上。
  const quoteOffset = segment.read ? Math.max(0, spokenIndexOf(quote.text, segment.read)) : 0;

  const seconds = frame / 30;
  const litUpTo = (() => {
    let last = -1;
    for (let i = 0; i < indexMap.length; i += 1) {
      const at = indexMap[i] - quoteOffset;
      if (at >= 0 && times[at] !== undefined && seconds >= times[at]) last = i;
    }
    return last;
  })();

  return (
    <AbsoluteFill>
      <Paper tint={accent} />
      <div style={{ position: "absolute", right: SAFE, top: 150, opacity: appear }}>
        <AskSeal glyph={SEAL_GLYPH.book} frame={frame} />
      </div>
      {/* 出处与竖排引文在**同一个流式容器里并排**，两块都不再摆绝对坐标。
          它们原先各自 absolute：出处按"左边整片空着"给了固定宽度，引文一长就折成几列
          横穿过来——防己成片里「（引李杲语）」被「可」「亦」压过去就是这个。现在引文按
          内容占宽、出处吃掉剩下的并自己折行，重叠在结构上不再可能发生。 */}
      <div
        style={{
          position: "absolute",
          left: SAFE,
          right: SAFE,
          top: QUOTE_BAND_TOP,
          bottom: QUOTE_BAND_BOTTOM,
          display: "flex",
          alignItems: "flex-start",
          gap: 44,
          opacity: appear,
        }}
      >
        <div style={{ flex: "1 1 auto", minWidth: 0, opacity: clamp01(frame, 24, 48) }}>
          <div style={{ width: 96, height: 5, backgroundColor: CINNABAR, marginBottom: 26 }} />
          <div style={{ color: INK, fontFamily: brush, fontSize: 34, lineHeight: 1.5 }}>
            {quote.source}
          </div>
          <div style={{ color: PAPER_DIM, fontFamily: brush, fontSize: 24, marginTop: 14 }}>
            照录原文，未改一字
          </div>
        </div>
        <div
          style={{
            flex: "0 0 auto",
            writingMode: "vertical-rl",
            textOrientation: "upright",
            fontFamily: brush,
            fontSize: quoteFontSize,
            lineHeight: 1.2,
            letterSpacing: 4,
          }}
        >
          {chars.map((ch, i) => (
            <span
              key={`${ch}-${i}`}
              style={{
                color: i <= litUpTo ? CINNABAR : INK,
                // 正在读的那一个字再重一点，朱红才有"点在动"的感觉。
                ...(i === litUpTo ? heavy(CINNABAR, 2.4) : {}),
              }}
            >
              {ch}
            </span>
          ))}
        </div>
      </div>
      <Caption seg={seg} frame={frame} tone="light" />
    </AbsoluteFill>
  );
};

/**
 * 考：跨书对读。同一句话在唐、宋、明的书里各是什么样。
 *
 * 逐条亮起的时刻按旁白时长均分，最后一条留得最久——那是答案。
 * 用均分而不是去匹配旁白里的书名：书名是旁白说的、引文是书上写的，两者没有稳定的
 * 对应关系，硬去匹配只会在换一集的时候悄悄错位。均分至少每次都对得上节奏。
 */
const StudyScene: React.FC<{ content: AskContent; segment: AskSegment; seg: AskVoiceSegment; frame: number }> = ({
  content,
  segment,
  seg,
  frame,
}) => {
  const evidence = segment.evidence ?? [];
  const narrationFrames = Math.max(1, seg.seconds * 30);
  const appear = clamp01(frame, 4, 30);
  return (
    <AbsoluteFill>
      <Ink />
      <div style={{ position: "absolute", right: SAFE, top: 150, opacity: appear }}>
        <AskSeal glyph={SEAL_GLYPH.study} frame={frame} />
      </div>
      {/* 标题与三条对读证据在**同一个流式列**里，整列止于字幕之上。
          原先是两块各自 absolute（标题 top 156、证据 top 430），于是它们之间的间距是
          两个魔数之差——标题折成两行就会压上第一条，而证据多一条就顶穿字幕。 */}
      <div
        style={{
          position: "absolute",
          left: SAFE,
          right: SAFE,
          top: 156,
          bottom: QUOTE_BAND_BOTTOM,
          display: "flex",
          flexDirection: "column",
          gap: 40,
          opacity: appear,
        }}
      >
        <div style={{ paddingRight: 170 }}>
          <div style={{ color: DIM, fontFamily: brush, fontSize: 26, letterSpacing: 8 }}>跨书对读</div>
          <div style={{ color: PAPER, fontFamily: brush, fontSize: 44, lineHeight: 1.35, marginTop: 18 }}>
            {content.question}
          </div>
        </div>
        {evidence.map((item, i) => {
          const at = (0.08 + i * 0.2) * narrationFrames;
          const shown = clamp01(frame, at, at + 16);
          const isAnswer = i === evidence.length - 1;
          return (
            <div
              key={item.source}
              style={{
                // 未轮到的那几条留在**看得见的暗处**，不是不存在。
                //
                // 原来 `opacity: shown` 从 0 起，于是这一屏在开头几秒只有一行字飘在黑底上、
                // 下面全是空的——观众看到的不是"正在一条条讲"，而是"这一屏没做完"。
                // 三本书并排是这个段落的看点，先把结构摆出来，亮起的那条再走到前面。
                opacity: 0.22 + 0.78 * shown,
                transform: `translateY(${(1 - shown) * 16}px)`,
                borderLeft: `5px solid ${isAnswer ? CINNABAR : "rgba(239,230,211,.2)"}`,
                paddingLeft: 26,
              }}
            >
              <div
                style={{
                  color: isAnswer ? CINNABAR : PAPER,
                  fontFamily: brush,
                  fontSize: isAnswer ? 40 : 36,
                  lineHeight: 1.45,
                }}
              >
                {item.text}
              </div>
              <div style={{ color: DIM, fontFamily: brush, fontSize: 24, marginTop: 12 }}>
                {item.source}
                {item.note ? ` · ${item.note}` : ""}
              </div>
            </div>
          );
        })}
      </div>
      <Caption seg={seg} frame={frame} />
    </AbsoluteFill>
  );
};

/** 收：盖印 + 下集问题预告 + 小字免责。 */
const ClosingScene: React.FC<{ content: AskContent; seg: AskVoiceSegment; frame: number }> = ({
  content,
  seg,
  frame,
}) => {
  const appear = clamp01(frame, 30, 54);
  return (
    <AbsoluteFill>
      <Ink />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 230,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <AskSeal glyph={SEAL_GLYPH.closing} frame={frame} size={168} stamp />
      </div>
      <div
        style={{
          position: "absolute",
          left: SAFE,
          top: 520,
          width: W - SAFE * 2,
          textAlign: "center",
          opacity: appear,
          transform: `translateY(${(1 - appear) * 16}px)`,
        }}
      >
        <div style={{ color: DIM, fontFamily: brush, fontSize: 26, letterSpacing: 10 }}>下一味</div>
        <div
          style={{
            color: PAPER,
            fontFamily: brush,
            fontSize: 48,
            lineHeight: 1.45,
            marginTop: 26,
            ...heavy(PAPER, 1.4),
          }}
        >
          {content.next}
        </div>
      </div>
      {/* 出处一行一本。挤成一段会把书名从中间断开（《证类 / 本草》），
          而书名正是这一屏最该被看清楚的东西。 */}
      <div
        style={{
          position: "absolute",
          left: SAFE,
          top: 830,
          width: W - SAFE * 2,
          textAlign: "center",
          opacity: appear,
        }}
      >
        {content.sources.map((source) => (
          <div
            key={source}
            style={{ color: DIM, fontFamily: brush, fontSize: 22, lineHeight: 1.75 }}
          >
            {source}
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: SAFE,
          top: 1180,
          width: W - SAFE * 2,
          textAlign: "center",
          opacity: clamp01(frame, 40, 64),
        }}
      >
        <div style={{ color: PAPER_DIM, fontFamily: brush, fontSize: 24 }}>{content.disclaimer}</div>
      </div>
      <Caption seg={seg} frame={frame} />
    </AbsoluteFill>
  );
};

/**
 * 一屏。
 *
 * `frame` 必须由 Sequence 内部的组件用 useCurrentFrame 取——它返回的是**相对本段起点**
 * 的帧号，而所有时间戳（charTimes / lines / quoteTimes）也都是相对段起点的。
 * 在 Sequence 外面取会拿到整片的帧号，两边差一个 startFrame，字幕会整段错位。
 */
const Scene: React.FC<{
  content: AskContent;
  segment: AskSegment;
  seg: AskVoiceSegment;
  reveal: boolean;
}> = ({ content, segment, seg, reveal }) => {
  const frame = useCurrentFrame();
  const body = (() => {
    switch (segment.role) {
      case "ask":
        return <AskScene content={content} segment={segment} seg={seg} frame={frame} />;
      case "object":
        return <ObjectScene segment={segment} seg={seg} frame={frame} />;
      case "book":
        return <BookScene segment={segment} seg={seg} frame={frame} accent={content.accent} />;
      case "study":
        return <StudyScene content={content} segment={segment} seg={seg} frame={frame} />;
      case "closing":
        return <ClosingScene content={content} seg={seg} frame={frame} />;
    }
  })();
  // 第一屏不做墨晕：第 0 帧是封面，封面不能是一张黑纸。
  return reveal ? <InkReveal frame={frame}>{body}</InkReveal> : <AbsoluteFill>{body}</AbsoluteFill>;
};

export const AskFilm: React.FC<{ content: AskContent; voice: AskVoice }> = ({ content, voice }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      <FinishedMusic src={staticFile(content.music)} loop />
      {voice.segments.map((seg, index) => {
        const segment = content.segments[index];
        if (!segment) return null;
        return (
          <Sequence key={seg.index} from={seg.startFrame} durationInFrames={seg.frames}>
            <Scene content={content} segment={segment} seg={seg} reveal={index > 0} />
            <Audio
              src={staticFile(`voice/${voice.id}/seg-${String(seg.index).padStart(2, "0")}.mp3`)}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
