import { Composition } from "remotion";
import { TopicFilm } from "../topic-film";
import { content as tuQue } from "./tu-que";
import { voice as tuQueVoice } from "./tu-que.voice";
import { TopicCoverLandscape, TopicCoverPortrait } from "./covers";

// 跨书整合系列的 Composition 注册表。
//
// 为什么手写而不进 scripts/generate-compositions.mjs：那个生成器服务的是单味药
// 短片系列（从 src/finished/*.tsx 扫），它会把 src/Composition.tsx 整个重写。
// 两个系列各管各的注册，互不覆盖——这是"只共享渲染工具"的具体落法。
//
// 加一期新片：在 src/topics/ 放内容模块，跑 npm run topic:build 生成 voice 模块，
// 然后在这里加一个 <Composition>。

export const TopicCompositions: React.FC = () => (
  <>
    <Composition
      id="TuQueTopic"
      component={TopicFilm}
      durationInFrames={tuQueVoice.totalFrames}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ content: tuQue, voice: tuQueVoice }}
    />
    {/* 竖屏版：内容与配音完全相同，只换几何（文字在上、书影在下）。
        抖音是竖屏信息流，横屏发上去会上下留黑边。**不是把横屏裁出来**——
        直接裁会把书影切掉一半。 */}
    <Composition
      id="TuQueTopicV"
      component={TopicFilm}
      durationInFrames={tuQueVoice.totalFrames}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ content: tuQue, voice: tuQueVoice, orientation: "portrait" as const }}
    />
    {/* 封面单独构图，不从成片截帧：缩略图只有 200px 宽，成片的字号到那里就糊了。
        横屏给 B 站 / YouTube，竖屏给抖音 / 视频号——竖屏是重排，不是裁切。
        用 `npx remotion still` 渲染，只需要第 0 帧。 */}
    <Composition
      id="TuQueCoverH"
      component={TopicCoverLandscape}
      durationInFrames={1}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ content: tuQue }}
    />
    <Composition
      id="TuQueCoverV"
      component={TopicCoverPortrait}
      durationInFrames={1}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ content: tuQue }}
    />
  </>
);
