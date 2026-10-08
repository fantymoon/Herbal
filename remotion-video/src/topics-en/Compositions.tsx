import { Composition } from "remotion";
import { TopicFilm } from "../topic-film";
import { content as tuQueEn } from "./tu-que-en";
import { voice as tuQueEnVoice } from "./tu-que-en.voice";

// 英文系列的 Composition 注册表。
//
// 与中文系列（src/topics/）的关系：**共享渲染器、图形组件、语料库和书影**，
// 独立的是内容模块、配音、封面与台账。放在同一个仓库是因为语料库（701 种、
// 6689 万汉字）是两个系列共同的只读基础，复制一份既浪费又会不同步。
//
// 加一期新片：在 src/topics-en/ 放内容模块，然后
//   npm run topic:voice -- <id> dump --dir=topics-en
//   合成配音（--voice en-US-ChristopherNeural）
//   npm run topic:build -- <id> --dir=topics-en
// 再在这里加一个 <Composition>。

export const TopicEnCompositions: React.FC = () => (
  <>
    <Composition
      id="TuQueTopicEn"
      component={TopicFilm}
      durationInFrames={tuQueEnVoice.totalFrames}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ content: tuQueEn, voice: tuQueEnVoice }}
    />
  </>
);
