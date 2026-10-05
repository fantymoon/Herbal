import { Composition } from "remotion";
import { TopicFilm } from "../topic-film";
import { content as tuQue } from "./tu-que";
import { voice as tuQueVoice } from "./tu-que.voice";

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
  </>
);
