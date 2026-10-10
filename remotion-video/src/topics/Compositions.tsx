import React from "react";
import { Composition } from "remotion";
import { TopicCoverLandscape, TopicCoverPortrait } from "./covers";
import { LongformFilm } from "../longform/LongformFilm";
import { ContactSheet, sheetSize } from "../longform/ContactSheet";
import { longformCompId, longformFilms } from "./longform-films";

// 跨书整合系列的 Composition 注册表。
//
// 中文这一条线已经全部搬到《一句话的旅行》那套（一份 film.yaml → longform:voice/build/sheet）。
// 旧的一期（tu-que）是手写 TS + `topic-film.tsx` 渲染的，那套代码还在，
// **因为英文线 `src/topics-en/` 仍然用它**——组件不是中文线私有的。
// 英文线搬完之后，`topic-film.tsx` / `topic-graphics.tsx` / `topic-audio.ts` /
// `scripts/topic-*.ts` 才能一起删。
//
// 加一期新片：写 `src/topics/<id>/film.yaml`，跑 longform 三步，登记进 ./longform-films.ts。
// 这里不再手写 <Composition>。

export const TopicCompositions: React.FC = () => (
  <>
    {longformFilms.map((film) => (
      <React.Fragment key={film.id}>
        <Composition
          id={longformCompId(film.id)}
          component={LongformFilm}
          durationInFrames={film.totalFrames}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{ film }}
        />
        <Composition
          id={`${longformCompId(film.id)}Sheet`}
          component={ContactSheet}
          durationInFrames={1}
          fps={30}
          {...sheetSize(film)}
          defaultProps={{ film }}
        />
        <Composition
          id={`${longformCompId(film.id)}CoverH`}
          component={TopicCoverLandscape}
          durationInFrames={1}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{ film }}
        />
        <Composition
          id={`${longformCompId(film.id)}CoverV`}
          component={TopicCoverPortrait}
          durationInFrames={1}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ film }}
        />
      </React.Fragment>
    ))}
  </>
);
