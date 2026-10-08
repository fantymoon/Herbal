import "./index.css";
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { HerbalCompositions } from "./Composition";
import { TopicCompositions } from "./topics/Compositions";
import { TopicEnCompositions } from "./topics-en/Compositions";
import { AskCompositions } from "./asks/Compositions";

// 霞鹜文楷（SIL OFL 1.1）随仓库走：原来的字体栈只有 STKaiti/KaiTi，那两个名字只在
// macOS 和 Windows 存在，换一台机器渲染就静默回退成系统 serif——同一个内容模块渲出
// 两种样子。文件 24MB，是「字形不依赖渲染机器」的代价。
//
// `loadFont()` 必须在一个组件的渲染过程中调用，不能放在入口文件顶层。它内部是
// `delayRender()` → `font.load()` → `continueRender()`，而句柄登记在调用时所在的
// scope 里；顶层调用发生在 bundle 求值那一刻，句柄落在所有帧 scope 之外，于是永远没有
// 人来 clear 它。表现不是报错，而是从页面加载起倒计时：到 `--timeout` 那一秒整个渲染
// 任务被取消，而崩在哪一帧只取决于当时的墙上时间。短片的 900 帧在超时前渲得完，所以
// 它们看起来一切正常；六分钟的长片必崩。调大 `--timeout` 只是把这件事盖住。
let fontRequested = false;

const requestFont = () => {
  if (fontRequested) {
    return;
  }
  fontRequested = true;
  loadFont({
    family: "LXGW WenKai",
    url: staticFile("fonts/LXGWWenKai-Regular.ttf"),
    weight: "400",
  });
};

export const RemotionRoot: React.FC = () => {
  requestFont();
  return (
    <>
      <HerbalCompositions />
      <TopicCompositions />
      <TopicEnCompositions />
      <AskCompositions />
    </>
  );
};
