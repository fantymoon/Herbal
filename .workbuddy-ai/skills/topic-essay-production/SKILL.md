---
name: topic-essay-production
description: 制作「一期一个问题 × 整个语料库」的跨书整合中长视频（竖屏 1080x1920，有旁白朗读）。当需要从 701 种古籍里检索、辨别、溯源、对读、批判，产出一期 4–10 分钟成片时使用。不适用于单味药精读短片——那条线是另一个系列，规范见 herbal-short-video-production。
---

# 跨书整合话题片

这条线**不是**"读一本书"，也**不是**有声书。有声书是把文本喂给 TTS，那是脚本活，没有壁垒。
这条线存在的唯一理由是**跨文本整合**——一期回答一个问题，答案来自整个语料库。

## 判据：什么题目值得做

**脚本能做的，不要做。** 分界线只有一条：

| 脚本能做 | 脚本做不了（= 本系列的取材区） |
| --- | --- |
| 单文本搬运：读、转写、拼接 | 跨文本整合 |
| 关键词检索、词频、共现 | **辨别**：同一个词在不同语境里是不是同一件事 |
| 按固定规则切分 | **溯源**：哪个说法是源头，哪个是转引 |
| | **对读**：找出材料之间的分歧与自相矛盾 |
| | **批判**：哪些是历史认知，哪些已被修正 |

**脚本不觉得两条材料矛盾，这就是壁垒所在。** 一个题目如果在库里找不到"矛盾"或"分歧"，
它就不属于这条线——它更适合去做单味药短片，或者不做。

选题的三个入口：
1. **同一个词，两件事**（如「缺唇」既是妊娠禁忌、又是外科病症）
2. **一条说法的流传链**（谁最早说、谁抄谁、谁质疑过）
3. **一处的自相矛盾**（同一批书一边传禁忌、一边做手术）

## 制作流程

### 1. 跨库检索

语料在 `TCM-Ancient-Books-master/`，**701 个文件全部是 GB18030**。
`rg`、`grep` 及任何 UTF-8 字节匹配**搜不到任何中文**，会把"有这一条"报成"没有"。

检索一律先解码再搜：

```bash
cd TCM-Ancient-Books-master && node -e "
const fs=require('fs');
const files=fs.readdirSync('.').filter(f=>f.endsWith('.txt')).sort();
const texts=files.map(f=>[f.replace(/\.txt\$/,''), new TextDecoder('gb18030').decode(fs.readFileSync(f))]);
const kw='<关键词>';
texts.forEach(([f,t])=>{let i=0;while((i=t.indexOf(kw,i))>=0){
  console.log('['+f+'] '+t.slice(Math.max(0,i-55),i+65).replace(/\s+/g,''));
  i+=kw.length;}});
"
```

命中数不是权威性。**先看上下文，再判断它是不是你要的那件事。**

### 2. 梳理线索

从命中里挑出四类材料，缺哪类就去补检索：

- **源头**：最早说这话的是哪本书（常是《淮南子》《礼记》《博物志》这类，被医书转引）
- **流传**：谁抄谁，跨了几个朝代（用书名 + 朝代排一条线）
- **质疑**：古人自己有没有反驳（常有，用「世云」「物有自然」「按」这类标记）
- **反转**：同一批书里有没有相反的证据（如外科书在做唇裂缝合手术）

### 3. 写旁白稿

写进 `src/topics/<id>.ts` 的 `segments[].narration`。

- **为耳朵写，不为眼睛写**：口语、短句、有节奏。写完念一遍。
- **引文一律照录**，出处随引文上屏（`quote.source`），不改字、不意译。
- **现代知识要准确**。说"现代医学认为"之前先确认它确实这么认为。
- **不要写成"古人错了"的嘲讽**。本系列的角度是"这个说法怎么来的"，不是"古人真蠢"。
  最有价值的收尾往往是：古人的**方向**对在哪、**归因**错在哪。
- 每段 70–130 字。段太短（<50 字）配音会赶，太长（>150 字）一屏字幕读不完。

### 4. 合成旁白

```bash
cd remotion-video
npm run topic:voice -- <id> dump        # 拆成 .topic-work/seg-NN.txt
# 逐段合成（17 段约 1m45s，用后台跑）：
VENV="$HOME/.workbuddy-ai/binaries/python/envs/default"
for f in .topic-work/seg-*.txt; do
  n=$(basename "$f" .txt)
  "$VENV/Scripts/edge-tts.exe" --voice zh-CN-YunjianNeural --file "$f" \
    --write-media "public/voice/<id>/$n.mp3" --write-subtitles ".topic-work/$n.srt"
done
npm run topic:voice -- <id> timeline    # 量时长
```

- 音色用 `zh-CN-YunjianNeural`（男·浑厚）。备选 `YunyangNeural`（播报）、`XiaoxiaoNeural`（女）。
- **`--write-subtitles` 必须给**：分句时间从 SRT 来，不另跑对齐（Node 在本沙箱不能 spawn，
  ffprobe 那条路不通）。
- 实测朗读速度 **4.5–5.8 字/秒**，标点少则快。**1350 字 ≈ 5 分钟**。

**踩过的坑：SRT 每行有两个时间戳，取错一个就会切掉每段的最后一句。**
`timeline` 必须读 `-->` **之后**那个（一句的结束）。早先的正则匹配的是箭头前面那个
（一句的开始），于是每段都被算短，成片里表现为"话说一半突然断"；同时语速看起来
忽快忽慢（4.8–9.4 字/秒），那其实是算错的产物。修好后语速回到均匀的 4.1–5.1，
片长从 4.4 分钟变回真实的 5.8 分钟。
**改完务必用 `ffprobe` 抽查一两段 mp3 的实际时长，跟算出来的秒数对一下。**

### 5. 编译渲染数据

```bash
npm run topic:build -- <id>     # 生成 src/topics/<id>.voice.ts
```

组件必须是纯函数，不能运行时读文件，所以时长与分句在构建期编译成静态模块。
**改了旁白就必须重新合成并重跑本步**，否则画面与声音脱节。
每段尾部固定留 24 帧呼吸，否则换屏读成卡顿。

### 6. 注册与渲染

在 `src/topics/Compositions.tsx` 手写加一个 `<Composition>`。
**不要走 `scripts/generate-compositions.mjs`**——那个生成器服务单味药系列，会重写
`src/Composition.tsx`。两个系列各管各的注册。

```bash
npx remotion still <CompId> out/stills/probe.png --frame=<段内某帧>   # 先出静帧目检
npx remotion render <CompId> out/<id>.mp4 \
  --bundle-cache=false --concurrency=1 --timeout=180000
npx remotion ffprobe out/<id>.mp4    # 断言 1920x1080 / 30fps / H.264 / AAC / 时长
```

**这条线必须 `--concurrency=1 --timeout=180000`。** `src/index.ts` 加载的 24 MB 霞鹜
文楷在默认参数下 `loadFont` 的 delayRender 会超时（静帧却过得去，所以静帧目检查不出）。
**而且失败的渲染会把 `out/<id>.mp4` 删掉**——旧母版也没了，只能重渲。

**改了组件代码之后，`render` 必须加 `--bundle-cache=false`。**
Remotion 会复用缓存的 webpack bundle，于是 `still` 用的是新代码、`render` 用的是旧代码——
**静帧看着是对的，成片却是旧的**。这个坑很难自己发现，因为两边都"成功"了，
只有从成片里抽帧对比才会露馅：

```bash
npx remotion ffmpeg -ss <秒> -i out/<id>.mp4 -frames:v 1 -y out/stills/from-video.png
```

**判据：凡"静帧对了、视频没变"，先怀疑 bundle 缓存，不要怀疑代码。**

### 7. 目检

静帧必须人眼看：引文有没有断行难看、字幕当前句高亮对不对、四种屏是否都有内容。
**每一种 `role` 都要在渲染器里有对应分支**——早先 `role="stat"` 的屏没有引文，
组件只按引文兜底，渲染成一片空屏。

## 版式约定

**两套几何，一份内容。** `src/topic-film.tsx` 用 `LAYOUTS: Record<Orientation, Geometry>`
加 `GeoContext` 提供两套坐标与字号，`TopicFilm` 接 `orientation` 参数：

| | 横屏 landscape | 竖屏 portrait |
| --- | --- | --- |
| 画布 | 1920x1080 | 1080x1920 |
| 构图 | 左书影、右文字 | 上文字、中书影、下字幕 |
| 证据位 | x88 y130 800x560 | x88 y880 904x683 |
| 引文 / 数据字号 | 62 / 190 | 76 / 240 |
| 字幕字号 · 底距 | 38 · 104 | 44 · 210 |
| Composition | `TuQueTopic` | `TuQueTopicV` |

**竖屏不是把横屏裁出来。** 直接裁会把书影切掉一半。抖音是竖屏信息流，横屏发上去
上下留黑边、全屏观感差、完播率受影响——所以两个平台各用各的排版，**共用同一份
内容与同一套配音**（配音时长不变，帧数不变，只是几何不同）。

- 深墨底 `#161310`、米白字 `#f2ead9`、朱红 `#c0503c`。
- 字幕按 SRT 分句高亮：当前句亮、前后句压暗，最多同屏三句。
- `EraTimeline` 接 `width` 参数，svg 按 viewBox 等比缩放——换方向不必改坐标，
  但**轴的两端要留够余量**（首尾两列用 start/end 对齐，轴伸到边缘时书名会被裁）。
  列距随容器宽度变化，5 列时每列最多放两条书名，否则相邻两列会挤在一起。

### 证据位放什么：书影优先，没有书影才用时间线

`Plate` 组件按 `segment.plate.file` 分派：有书影上 `BookPlate`，否则上 `EraTimeline`。

**书影的来源**（2026-10 实测）：`shuge.org`（书格）可达，且是 WordPress，可以用它的
REST API 直接搜到条目，再抓页面上的图片直链。

```bash
# 1) 搜书（中文要 URL 编码）
curl -sSL "https://www.shuge.org/wp-json/wp/v2/search?search=<urlencoded>&per_page=5"
# 2) 抓该页所有 1500px 直链
curl -sSL "https://www.shuge.org/view/<slug>/" \
  | grep -oE 'https://www.shuge.org/wp-content/uploads/[0-9]+/[0-9]+/[a-z_]+[0-9]+-1500x[0-9]+\.jpg' | sort -u
# 3) 下载到 remotion-video/public/plates/
```

- 页面是**影印的两页展开**，所以先看图定位，再用 `plate.crop` 裁出需要的那半页。
- **`crop` 和 `box` 都是原图像素坐标**，不是屏幕坐标。换算：
  `屏幕偏移 = (原图坐标 − crop 原点) × (显示宽 / crop 宽)`。
- **`<Img>` 不能直接设 width/height 再靠负偏移定位**——Remotion 的 Img 不会那样铺开，
  结果是书影只渲染出左侧一条，高亮框落到空白上。要套一层显式尺寸的 `<div>`，
  再让 `<Img>` 填满它（`width/height: 100%`）。

**定位高亮框：不要在整页缩略图上目测。** 列与列只隔约 80px，缩略图上分不出来。
实测踩了两次坑（一次偏左一列、一次偏左两列），可靠做法是：

```bash
# 把目标区域裁成窄带、放大 2 倍、叠 40px 一格的标尺，再读坐标
python -c "
from PIL import Image, ImageDraw
im = Image.open('public/plates/<file>.jpg').convert('RGB')
X0,Y0,X1,Y1 = 1120,240,1460,720
c = im.crop((X0,Y0,X1,Y1)); d = ImageDraw.Draw(c)
for x in range(X0,X1,40):
    d.line([(x-X0,0),(x-X0,c.height)], fill=(255,0,0), width=1)
    d.text((x-X0+2,2), str(x), fill=(255,0,0))
c.resize((c.width*2,c.height*2)).save('.workbuddy-ai/tmp/narrow.png')
"
```

- **古籍是竖排**：引文是一整**列**，所以高亮框窄而高（本例 92×428，9 个字），
  不是横向的一行。第一版按横框写，框到的是标题而不是引文。
- 书格的书影是公有领域影印本，**仍要在片尾或描述里注明来源**。

### 时间线（没有书影时用）

### 图形踩过的坑

- **首尾两列必须改用 `start` / `end` 对齐**。全部用 `middle` 时，最右一列的书名会
  越出画布被裁掉（「本草纲目」只显示到「本草纲」）。
- **列间距要按最长书名反推**。5 列时相邻两列的书名会挤在一起，字号从 21 降到 17
  才拉开；年份也要收短（「1314–1330」→「1330」）。
- 时间轴不要贴在顶部，`axisY` 取容器中线附近，否则下方留一大块空白。

## 禁止事项

- **不要用 `rg` / `grep` 搜语料**（GB18030，必然搜不到，且会误导你以为没有）。
- **不要改引文的字**。照录；要采他本读法就在旁白里说明是哪个版本。
- **不要把古籍描述改写成现代医疗建议**，也不要反过来说"古籍证明了 XX"。
- **不要为了凑时长注水**。时长由旁白决定；内容不够就换更厚的题目，不要拉长句子。
- **不要把这条线的规范套到单味药短片系列上**，反之亦然。两条线只共享 Remotion。

## 封面：单独构图，不从成片截帧

**封面不能用成片截帧。** 信息流里封面只有约 200px 宽，成片的字号到那里就糊成一片灰。

- 组件在 `src/topics/covers.tsx`，注册为 `TopicCoverLandscape`（1920x1080）与
  `TopicCoverPortrait`（1080x1920），`durationInFrames={1}`，用 `npx remotion still` 渲染。
- **竖屏是重新排版，不是裁横屏**：横屏是"左书影右问题"，竖屏是"上问题下书影"。
  直接裁会把书影切掉一半。
- 封面字号比成片大得多（问题用 104px），元素更少——缩略图里只认得出大字。
- 封面上的话要和标题说同一句。

```bash
npx remotion still TuQueCoverH out/covers/<slug>-cover-h.png --frame=0 --bundle-cache=false
npx remotion still TuQueCoverV out/covers/<slug>-cover-v.png --frame=0 --bundle-cache=false
```

## 发布文案

台账写在 `upload/topics/<slug>.md`，含标题（分平台）、描述、话题、发布注意、数据回填表。

- **标题要有搜索词**（药名、书名、那个说法本身），不要只写悬念。
- **不要把内容包装成指导**。这一期讲的是"古人怎么说"，不是"孕妇该怎么做"。
  「孕妇必看」「孕期饮食禁忌」这类写法越出定位，也正撞平台对医疗建议的判定。
- **禁用词**：养生、调理、健康科普、疗效、药效、治病、防病——账号被降权时针对的
  就是这些定位词，新系列同样不用。
- **描述首行给出处**，然后是内容概要，最后是免责声明（"本片为古籍文献展示，
  不构成医疗建议"）。
- **书影署名**：书格（shuge.org）的影印本属公有领域，仍要在描述里注明来源。
- **平台匹配**：横屏 16:9 在抖音/视频号的信息流里会上下留黑边。若主发这两个平台，
  优先用竖屏封面，并考虑裁一版竖屏成片。

## 多语言系列（英文）

同仓库、新目录 `src/topics-en/`。**共享**语料库、渲染器、图形组件、书影；
**独立**内容模块、配音、封面、台账。

**为什么同仓库**：语料库（701 种、6689 万汉字）是两个系列共同的只读基础，
复制一份既浪费又会不同步；而渲染管线对两个系列完全一样，英文版换的只是文本。

**英文不是翻译。** 中文版开场直接上「食兔肉，令子无声缺唇」——对中文观众有效，
因为「兔唇」这个词就在他们的语言里。英文观众没有这个联想，不知道为什么要关心。
所以英文版从更普遍的问题切进去（"一个名字怎么变成了一条禁忌"）。
**同一批史料、同一页书影、同一套图形，但叙事是重写的。**

脚本用 `--dir=` 区分系列：

```bash
npm run topic:voice -- <id> dump --dir=topics-en
# 合成（英文语音用 en-US-ChristopherNeural，沉稳，配历史题材）
npm run topic:build -- <id> --dir=topics-en
```

中间产物也分开：`.topic-work/`（中文）与 `.topic-work-en/`（英文），
否则两边的 `seg-NN.txt` 会互相覆盖。

**引文处理**：屏上给英译，书名保留中文原名 + 英文/年代——观众看得懂，出处也不丢。

## 配音通道的坑：venv 会静默失效

edge-tts 装在 `~/.workbuddy-ai/binaries/python/envs/default`。

**这个 venv 原本基于 WorkBuddy 自带的 python（`versions/3.13.12`，一个符号链接）。
那个目标被清理掉之后 venv 就失效了——而它失效时不报错，只是什么都不生成。**
表现是：循环跑完、`done seg-NN` 全部打印、但 `public/voice/<id>/` 是空的，
下游 `timeline` 于是量出全部 0 秒。

**判据：合成"成功"但产物为空，先查 venv 的 python 还在不在。**

```bash
"$VENV/Scripts/python.exe" --version
# 报 "did not find executable at ..." 就是它
```

**重建**（改用系统 python，不再依赖那个符号链接）：

```bash
PY="/d/Python3.11/python.exe"
VENV="$HOME/.workbuddy-ai/binaries/python/envs/default"
rm -rf "$VENV" && "$PY" -m venv "$VENV"
"$VENV/Scripts/python.exe" -m pip install --quiet edge-tts
```

## 混音：床声的音量必须量出来，不能听出来

`FinishedMusic` 的默认 `peakVolume` 是 **0.12**，那是为 12 秒短片定的。长片系列一直
**没有传这个参数**，于是继承了它——这是"共享组件的默认值静默套到新调用者"的又一处。

**为什么 0.12 在长片上是错的**（实测，见 `src/topic-audio.ts`）：

| | RMS | 峰值 | 动态范围 |
| --- | --- | --- | --- |
| `yuzhou-changwan.mp3` | -16.9 dBFS | **0.0 dBFS** | **15.9 LU** |
| 旁白（17 段，说话时） | -22.9 dBFS | -4.5 dBFS | 2.7 LU |

曲目**本身就比人声响 6 dB**，而且有 15.9 LU 的内部动态——**平均值说明不了扫弦那一
下有多响**。0.12 时床声峰值落在 -18.4 dBFS，比人声说话电平**还高 4.5 dB**。

**判据：拿床声的峰值去比人声的说话电平，不是拿平均值比平均值。** 人声是被合成出来
的、动态极小（2.7 LU），所以它"平均"和"峰值"差不多；曲目不是。用平均值比对会说出
"床声低 11 dB，没问题"这种话，而观众的抱怨出现在扫弦那一瞬间。

实测参考电平要**门控**（50ms 帧、只留 -45 dBFS 以上的）：旁白有约 28% 的时间是句间
停顿，不门控会把参考拉低 1.4 dB，正好往"掩盖缺陷"的方向偏。

**目标**：床声峰值低于人声说话电平 4–25 dB。取 0.04 时峰值 -28.0（-5.1 dB）、
平均 -44.8（-21.9 dB），是纪录片的常规配比。

**两个门禁，缺一不可**（`scripts/lib/audio.ts`）：

- `checkBedBalance` —— 读**素材**（曲目 + 旁白 + 常量），在数字被改坏的那一刻就报。
- `checkMixBalance` —— 读**成片母版**。判据很硬：常量不是成片。今天渲染器静默复用了
  缓存 bundle 那天，所有读源码的检查都是绿的，只有读母版的检查会变红。

**成片里怎么把床声单独量出来**：成片是混好的，拆不开。办法是从**旁白素材**里找停顿
（`quietRuns`，50ms 帧 RMS < -45 dBFS、≥0.3s），映射到成片时间轴，那些窗口里就只剩
床声。**别从 SRT cue 找停顿——edge-tts 的 cue 首尾相接，句间间隔实测 0.000 s，
而音频里实际停 0.67 s**，按 cue 找会一个都找不到，然后静默地什么都不测。

`npx remotion ffmpeg` 是**精简构建**：没有 `ebur128`、`volumedetect`、`astats`、`s16le`
muxer、`acompressor`、`highpass`。有 `loudnorm`（能报输入响度）、`silencedetect`、
`amix`、`volume`、`wav`。要算 RMS 就解成 wav 自己算（`scripts/lib/audio.ts` 就是这么
做的）。

## 文字归属：渲染器不该替作者说话

**凡是会被观众读到的文字，都归内容模块管。** 这条是踩出来的：收尾屏那句、
封面底部那句、时间线的朝代名与书名，原本都写死在渲染器里——于是英文版**照搬了中文**，
而且是同一类错误重复了三处。

`TopicContent` 现在有 `closingLine` / `tagline` / `eras?`，两个语言版本各自提供。

**判据：加一种语言版本时，只要渲染器里还有一句硬编码，它就一定会漏。**
改完用这个自查：

```bash
grep -nP '[\x{4e00}-\x{9fff}]{3,}' src/topic-film.tsx src/topic-graphics.tsx src/topics/covers.tsx \
  | grep -vE '^\s*[0-9]+:\s*(//|\*|/\*)'
```

英文版的 `eras` 还有后续问题：**罗马字比中文长得多**（"Taiping Shenghui Fang" 21 个字符），
五列并排必然重叠。英文版只给朝代和年代，书名交给旁白去说。

## 视觉：别让画面变成"静止的版式"

一屏停 15–25 秒、整片 13–17 屏。如果每屏只有淡入，观众看到的是**同一张版式重复十几次**——
这就是"表现力差"的来源。

已经做的（成本最低、感受最直接）：

- **底纹 + 暗角**：极淡的横向纸纹（`repeating-linear-gradient`）+ 四周压暗
  （`radial-gradient`）。纯色底在大屏上读成"空"，有质感才像影像。
- **书影缓慢推近**（Ken Burns）：`frame / 900` 推 5%，`transformOrigin: 58% 42%`。
  **幅度要小到让人感到画面是活的，而不是让人注意到镜头在动。**
- **高亮框呼吸**：`Math.abs(Math.sin(frame / 52))` 驱动背景色与 boxShadow。
- **时间线节点逐个亮起**：`(frame - 10 - i * 7) / 18`，配合旁白正在讲的跨度。
- **内容垂直居中**：证据位与文字区的 `top` 都要居中，否则内容全挤在上半部、中间空一大片。

还没做：**加入更多图像**（目前只有 1 页书影 + 1 条时间线，其余全是文字；
`ltfc.net` 中华珍宝馆可达，可取古画文物）、**版式变化**（每屏结构一样）、
**节奏长短交替**。
