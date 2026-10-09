# 长视频《一句话的旅行》制作手册

> 一句古书里的话，追它走过的一千年。

本手册写给做片的人和本地 agent。**设计已经写死在代码里**，做一期新片只需要写一份 `film.yaml`，其余交给脚本：引文对不上、时间锚找不到、画面停太久、文字压字幕，都会被拦下来。

金样例：`src/topics/pangxie/film.yaml`（螃蟹与横生，71 秒）。**新一期先复制它，再改内容。**

## 一期片子的流程

```bash
# 0. 建目录，复制金样例
mkdir src/topics/<id> && cp src/topics/pangxie/film.yaml src/topics/<id>/

# 1. 写 film.yaml（见下文规则）

# 2. 配音：每段旁白 → mp3 + 词级时间戳（只重做改过的段）
npm run longform:voice -- <id>

# 3. 构建：校验 + 换算时间 → film.json。有 FAIL 就按提示改 yaml，回到 1 或 2
npm run longform:build -- <id>

# 4. 在 src/topics/longform-films.ts 登记一行（只有第一次需要）

# 5. 联络表：每个镜头一帧，自动查版面
npm run longform:sheet -- <id>
#    打开 .longform-work/<id>-sheet.png：标题写「版面检查通过」才往下走；
#    有红框就按红框下的原因改 yaml，回到 3

# 6. 出片（母版按系列落目录：out/topics/，`npm run manifest` 只认这个位置）
npx remotion render src/index.ts Longform<Id> out/topics/<id>.mp4
```

**每一步都看脚本输出的最后一行。** `ok` 才往下走；`FAIL` 的信息里写了哪一段、哪个镜头、怎么改。不要绕过检查。

## 五幕结构

| 章 | 时长 | 要做到的事 | 常用镜头 |
|---|---|---|---|
| 立案（冷开场） | 0–10 秒 | 第一帧就是书页，直接念那句最反常的话。不放片头 | `page` |
| 立案 | 10–25 秒 | 解释关键词，亮出检索结果（多少部书写过） | `photo` `dots` |
| 追踪 | 中段 | 这句话按年代走过哪些书 | `lineage` `columns` |
| 对质 | 中段 | 找到说出原因的那一句，和实物/另一本书对照 | `photo` `silent` `confront` |
| 结案 | 最后 10 秒 | 后人的质疑或结论，一个字/一个词落下，盖印 | `page` `verdict` |

章节名写在每段的 `chapter`，没有写的段沿用上一章。

## 硬规则（脚本会查）

1. **引文只能从语料复制。** `page` / `confront` 的 `before + target + after`、`columns` 的每一行，去掉标点后必须是 `file` 指定的书里连续的一段。凭记忆写的引文必然 FAIL。
2. **`at` 写旁白里的词，不写秒数。** 可加偏移 `横行+0.4`、`清初-0.2`，同一段里第二次出现写 `螃蟹#2`。负数秒（如 `-0.4`）只用于换段时提前切画面。
3. **数字以检索为准。** `dots` 的 `search` 现场跑全语料，命中数必须等于 `expect`；旁白里说的数字也要和构建输出的那行一致。同书异本写进 `merge`。
4. **最多 6.5 秒没有视觉变化**（超过 5 秒警告）。镜头开始、高亮开始、谱系节点出现、变形、落字都算变化。超了就加镜头或加一个 `marks`。
5. **版面上限**：书页目标句 ≤ 15 字时整句占一列，更长按 13 字折列；`columns` 一行 ≤ 16 字（含标点）、最多 6 行；谱系图同一年代挤不下会 FAIL（删几部或拉开年份）。
6. **联络表必须「版面检查通过」**：出画、压字幕、谱系标签重叠都会描红。

## 写作约定（脚本查不了，靠自觉）

- 旁白比讲解稿少三成：书上写着的字让观众自己读，旁白只念最关键的一句。
- 每段 1–3 句、10–16 秒。
- 书页一律标「据语料录文 · 非原书影」（组件自动加），不要冒充影印本。
- 谱系图的连线只表示年代先后，标题里要写明「非考定的抄录关系」，旁白也不要说「谁抄了谁」，除非有书证。
- 涉及医药的结论只讲文献史，不讲疗效；片尾 `end.disclaimer` 保留医嘱提示。
- 图片放 `public/images/`（ASCII 文件名），登记进 `public/images/credits.json`，`credit` 里要包含账本上的作者和许可证（测试会查）。

## 镜头类型速查

| type | 用途 | 必填 |
|---|---|---|
| `page` | 竖排书页推镜，逐字点亮 | `book meta file target marks`，可选 `before after zoom` |
| `photo` | 实拍 + 大标题（≤3 字用巨字，否则用问句字号） | `image`，可选 `title gloss titleAt zoom pan y` |
| `dots` | 全语料点阵，总数跳到命中数 | `search expect countLabel hitLabel hitAt`，可选 `merge note` |
| `lineage` | 年代轴谱系图，关键书随旁白出现，其余在 `burstAt` 连发 | `title burstAt nodes[name dyn year key? at?]` |
| `columns` | 一句一列的竖排清单，强调其中一行 | `source file lines emphasize emphasizeAt` |
| `silent` | N 个问号：书都不说理由 | `count text` |
| `confront` | 左实拍、右书页，两字变形（横行→横生） | `image arrow arrowAt book meta file target marks morph` |
| `verdict` | 一个字砸下来，盖印 | `char slamAt`，可选 `seal` |

字段的准确定义在 `src/longform/plan.ts` 的 schema 里；组件在 `src/longform/shots.tsx`。

## 新增镜头类型（改设计时才需要）

三处一起改：`plan.ts` 加 schema → `build.ts` 加编译分支（算出绝对时间、记录 `events`）→ `shots.tsx` 加组件并在 `LongformFilm.tsx` 的 `renderShot` 里接上。需要被版面检查的元素加 `data-box="content"`（或 `"label"`）。

## 环境备注

- 配音用 Python 的 `edge-tts`（`pip install edge-tts pyyaml`），声线写在 `film.yaml` 的 `voice`。代理变量带冒号时 aiohttp 会报错，先 `unset HTTP_PROXY HTTPS_PROXY`。
- 字体是霞鹜文楷（OFL），`src/index.ts` 全局加载 `public/fonts/LXGWWenKai-Regular.ttf`；粗体由浏览器合成，不另带字重文件。
- 背景音乐的授权要覆盖所有发布平台，换曲前先确认。
