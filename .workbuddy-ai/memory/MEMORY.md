# MEMORY.md · 本草短视频项目

权威文档：`AGENTS.md`（工程约定）、`.agents/skills/herbal-short-video-production/SKILL.md`（制作规范）。命令全表见 `AGENTS.md`，这里不重复。只记它们没写、每次工作都要知道的事。**写完一条就压缩一条**——这份文件每次会话都被注入。

## 账号处境（最要紧）

- **视频号已放弃（2026-10-12 用户决定）**：解封要求提交**真人出镜**的视频，没有条件做。**不要再提这个平台**——不排期、不申诉、不算播放、不做处置、不再出现在报告和建议里。`upload/_incidents.md` 与 `upload/_frozen-disposition.md` 一并搁置，那份「转私密 33 部」的止血清单不再执行。
- 存档（只为防止重复提议，不要再拿出来讨论）：视频号 2026-08-19～08-21 起因「未被现代科学证实/夸大功效」减推（08-19 菟丝子 1642 → 08-21 起 0–29，完播率未变差）；申诉 08-23、08-31 + 工单 09-20 三次同一模板一字不差；恢复条件「持续 + 稳定 + 一段时间」，08-30 后停更。
- **抖音是唯一在运营的平台，也是基本盘**，无警告。它的病是「有量没粉」，诊断见 `docs/research/ai-account-benchmark.html`。
- 定位已转**文化/读书**向并机器强制：`OFF_POSITION_WORDS`（养生/调理/健康科普/疗效/药效/治病/防病）出现在标题/描述/话题即 FAIL；默认话题 `#<书名> #本草 #古籍 #传统文化 #读书`。
- **处罚落在文案上，不落在画面上**：门禁扫的不止片内文字，还有台账 `标题：`/`描述：`/`话题：`（`checkLedgerCopy` 与片内共用 `claimWordingProblems`）。两张词表：15 个疗效词 + 平台真正反对的现代药理词（缓解/止痛/消炎/抗菌/抗癌/降血压/增强免疫/预防…）。**黑名单拦不住「这一类句子」，别把它当唯一护栏。**
- **文案从 2026-10-24 起是「提示」不是「判决」**：`banned-wording` / `efficacy-frame` / 历史框定缺要素 / 台账文案都带 `advisory`，打印但不判 FAIL（`npm run check` 只打一行 `N note(s) on the wording`，`--verbose` 才列明细）。安全规则只剩：免责声明、几何、配图授权、`unreadable`。**用户明确表态「文案有问题我会说话」**——不要给文案加回门禁，也不要拿「能渲染=合规」去形容它了：现在 `ok` 只代表「这部片能出」。
- **写新规则前先问「它会不会判一部在线片 FAIL」**。在线片 = `frozen-films.ts`（2026-09-21 快照，老片无台账）**或**台账 `数据回填` 有日期（`publishedOn`，`npm run stats` 从平台导出并进）。**`out/` 里的母版不是信号**——渲染不是发布，out/ 被 gitignore、CI 里没有，按磁盘判会让同一部片在不同机器上得到两个裁决。2026-10-24 按 AGENTS.md 统一：`check-films.ts` 删掉了 `|| existsSync(mp4)`（`verify-film.mjs` 早就只认日期）。**代价：19 部只有母版、台账没日期的片从「豁免」变成「被审」**（实测全部 ok）；要恢复「不判失败」就补回填：`npm run stats -- --file=../dataExport/作品列表导出.xlsx`。豁免语义：不判失败，但事实照读照打。
- ~~转私密处置~~：**随视频号一起搁置**（2026-10-12）。名单仍留 `upload/_frozen-disposition.md` 备查，但不再执行、不再催、不再在报告里出现。

## 内容硬约束

- **功效句必须框定为历史认知**：`今译` 把功效归回书上（`FRAME_MARKERS`：古籍称其主/古书说其主/古人谓其主/经中言其/书称其）；`注释` 那行框定须同时做到三件事、**且不得反过来肯定**：点名时代或古籍 + 同一小句内否定现代已证实 + 点出现代知识领域。**只认一个五字开头会把文体压成模板**（19 部今译同字起头）。
- **屏幕上引的经文必须是底本那一段**（`quoteProblems`）：逐字对读找分叉字，再看 `注释` 有没有同时点名据本与该字。补字且注明据本＝过；改字没记＝FAIL；**把底本标出的缺字直接删掉＝FAIL**（空格一粘，残缺消失）。
- 被禁疗效动词（片内今译/注释、标题、描述、话题）：治疗/主治/改善/有效/根治/特效/治愈/秘方/神效/必备/包治/断根/奇效/立竿见影/药到病除。
- `今译` 是逐句翻译，评论一律放 `注释`；两者**不得互相矛盾**（无门禁，渲染前逐条核对）。
- **一个词的读法要找「对本条作证」的那条证据，后世语料不能替本条作证**（龙眼「安志厌食」的「厌」＝饱足，《本草经解》对本条有直接训释；我曾按全库 79 处「厌食」写成「不欲饮食」）。**`--grep` 的命中数不是权威性。**
- 三屏 hero/classical/closing。`ALLOWED_DURATIONS=[360,450,540,630,720]`，**实际只到 450/540/630/720**（360 不可达：每场景 ≥120 帧 × 3 屏 + 阅读预算）；`EXTENDED_DURATIONS=[810,900]` 须声明 `duration`。
- **容量上限**（今译×1.55）：标准档 83 字原文；声明 `duration` 后 130 字（×1.8→83/112；×2.1→66/102）。古典屏同屏装原文+今译+注释+历史框定，**原文长度才是约束**。
- **屏幕上只有 `产地` 是凭记忆写的，所以它现在是门禁**：`originProblems` 要求 `产地` 是经文点名的地名，脚手架用 `originOf(sutra)` 派生。已知同病且在线、不能改的三部：蓝实、紫芝、黄芝（`tests/corpus.test.ts` 钉住，只减不增）。
- **`deviations` 是「预算可谈、安全不可谈」的分界**（`NEGOTIABLE_RULES`）。安全规则（违禁词、历史框定、免责声明、几何、配图、**每屏 >20 字/秒的 `unreadable`**）无豁免通道；预算规则（duration/reading-budget/pacing）可凭**非空理由**豁免，只盖 `waived` 戳。**豁免必须有底线**（曾三条一起点名，等于关掉整条密度守卫，一部片 27 字/秒报 ok）。

## 协作方式

- **工作流由大模型驱动，不要为「判断类」的事写生成器**（标题、描述模型自己写；`draftTitle` 只是保证字段非空的占位）。**判据：需要品味用判断，需要重复才用代码。**
- **能自己产出的就别问**。只有决定依赖只有用户知道的信息（平台后台、他的偏好）时才问。
- **门禁和生成器是两份东西，删字段要同时删两处**（`ledger` 停写 `抖音：`/`视频号：` 后 `check-films` 必填清单还在要）。**验证办法：把一部片的母版临时移开再跑 `--film=`**——唯一能让「只对新片生效」的门禁现形的办法。

## 测试与门禁的取舍

- **判据：这条测试能不能在一个真实缺陷上变红？**
  - **该删**：断言源码字面量、断言文档措辞、对已冻结影片逐片断言其自身字面量（测一个常量）。
  - **该留**：喂门禁一个坏输入看它拒绝（`compliance.test.ts` 27 条全是）；覆盖**每一部**片的集合性扫描。（2026-10-05 按此从 218 条删到 151 条。）
- **集合性质的不变量只有 `check-films.ts` 查得了**（它看得见全集），如 `adjacentTrackRepeats` 按发布顺序比相邻两部是否同曲。**「句子像不像」不属于这类**：`checkTitleFrames` 已删（是品味；机器给得出的是集合，`--verbose` 列出所有台账标题）。
- **fixture 不要钉平台自己的数字**：`stats-import.test.ts` 曾硬编码抖音导出行数，平台换导出就把套件弄红。改成结构不变式。

## 生产约定

- **三条线各有自己的文件夹，名字与源码那边一致**：`src/films|topics|asks` → `upload/films|topics|asks` 与 `out/films|topics|asks`（各自再带 `stills/`、`covers/`、`_verify/`）。跨线的记录（`upload/_incidents.md`、`upload/_frozen-disposition.md`）留在 `upload/` 根下。
- 新片是**数据不是 JSX**：`npm run new-film -- --id=<CompId> [--latin=] [--entry=]` 一次生成内容模块、影片包装、台账。默认取 `progress.json` 首个 todo。**生产顺序 ≠ 发布顺序**（后者见 `publish-plan.md`）。
- **`--id=` 会撞车，撞的是同音字**：ID 就是拼音，`BaizhiFirstFilm` 早被**白芝**占用，**白芷**只能用 `BaizhiAngelicaFirstFilm`。`new-film` 撞车只报 `film already exists` 就退出——**开新片前先 `grep` `frozen-films.ts` / `progress.json` 有没有同音条目**。同音的图名也要带属名（`angelica-dahurica-baizhi.jpg`）。
- 内容模块留 TODO 即为 draft：`gen` 不注册、`verify` 拒绝渲染，draft 无法上线。
- 不要手写 `position: absolute` 或自选字号，全走 `src/layout.ts` 的 `TYPE`。
- **已发布的片子：不改，也不改回去**（两个方向都浪费 token；蒲黄先补旁白又撤掉，两次都不该做）。`verify` 在母版存在时渲到 `out/_verify/`，替换母版要显式 `--force`。已发布影片在 `scripts/lib/frozen-films.ts` 冻结，只减不增。
- **两个预算都要过**：几何（不重叠、不溢出、每屏 ≥120 帧）与阅读（`READING_RATE_LIMIT=15` 字/秒）。
- **台账不要手写**：文案由 `ledger` 生成，数据列由 `stats` 从平台导出并进。

## 语料（`TCM-Ancient-Books-master/`）

- **GB18030，不是 UTF-8——`rg` 在整条语料线上完全失效**（会把「明明有这一条」报成「查无此条」）。检索一律 `npm run entry -- --grep=<词>`，核对单条 `--name=`。
- **条目名有残缺**：`000-神农本草经.txt` 至少 17 条 `<篇名>` 被截断（`青`→青蘘、`KT`→编码残缺）。开新片前核对内容行首句，把全名写进 `entry`。
- **残缺三类，前两类看得见**：① 断在连接词上（卷柏）；② 行内掉字——底本用空格占位（龙骨「惊痫 疾狂走」），**空格归一化会悄悄粘成通顺句子**。`npm run entry` 拦这两类（350 条里 3 截断 + 28 掉字）。遇缺字跳过或换底本，**不要猜字**；确要补用 `new-film --recension=<字> --why=<据何本>`（必须同时给）。
- ③ **讹字**：写错、读起来通顺、行内无空格，`corpus.ts` 抓不到（大枣底本「肋十二经」／证类「助十二经」）。**开新片前跑 `npm run variants`。**
- **`npm run variants` 是报告不是门禁**：底本与《证类本草》逐条 LCS 对读，645 处单字差异，按「只有一侧得到全库作证」筛出 24 处。**判据要两半**——两侧不同 × 底本那一读法全库几乎无人作证；只取一半都不行。剩下的仍有半数古今字（创/疮、利/痢、注/疰），**分类留给眼睛**。
- **语料读取统一走 `scripts/lib/corpus.ts`**（`findEntries`/`sutraOf`/`defectOf`/`originOf`/`originProblems`/`fillGaps`）——不要在调用处自己走行。

## 配图通道

- **可用通道是 iNaturalist**，只取 CC0/CC BY/CC BY-SA，`npm run fetch-photo` 一条命令完成查询+下载+登记。维基媒体/Openverse/archive.org/pixabay/gitee 在这台机器上全超时或 403；备用：`plants.sc.egov.usda.gov`、`calphotos.berkeley.edu`。**三个坑**：① 扩展名因图而异（`.jpg`/`.jpeg`），硬编码任一种会静默砍掉一半图库；② 有些 id 404，要逐个试；③ 代理偶发 `ECONNRESET`，脚本已重试。
- **自动排序看不见内容**：`--check` 列候选、肉眼看、`--id=` 取是正常流程；**`--id=` 查的是未过滤列表**，要 `--fruiting --id=` 一起给。`--check` 会打**观察者自己的鉴定名**（与搜索属名不同时标 ⚠）——搜 `Citrus reticulata` 返回的果实照其实是 `Citrus × aurantium`（酸橙）。**矿物类在这个通道做不了**（mindat/Smithsonian/Commons/BHL 全 403 或超时，iNaturalist 只有生物）。
- **插框现在是 1.53:1（932×610）中心裁切**（旧记录写的 1.9:1 已过期）。**判据是「主体在不在中线附近」，不是横竖**：竖构图只要能保住中部就行（丹参 1126×2000 过得去），而**横构图但主体在上三分之一照样被切**（白芷伞形花序在顶部，中心裁切只剩茎叶）。取图前先按裁切比例算一遍带的位置。
- **换图用 `--id=` + 同一个 `--file=`**：覆盖同一张 jpg 并**更新** credits.json 里那条（不追加重复行）。所以「先取一张看、不满意再换」不必先清 credits。
- **`credits.json` 必须与 `public/images/` 完全一致，且每张图都要被某部成片引用**——下载与建片必须成对，不能先囤图。
- **Node 走代理**：`process.env.NODE_USE_ENV_PROXY="1"`。**子进程：异步 `spawn` 可用，同步形式（`execFileSync`/`spawnSync`）返回 EBUSY**——用同步形式会让 ffmpeg 解码静默失败，假象成「这个文件没有音频」。

## 音乐通道

- **曲长是门禁的输入，不是注释**：`npm run sync-music` 复制曲目并写 `src/music-registry.ts`（曲长、开头静音、来源）。**加曲目：mp3 丢进仓库根 `music/`（原始中文名），在 `scripts/sync-music.mjs` 的 `TRACKS` 加一条，再跑它。**
- **`@remotion/media` 的 `loop` 会静默失效**：它从 `trimAfter` 推循环长度；取不到资源时长时把媒体当无限长 → 「`loop` + 整片长度 `trimAfter`」只播一遍，无报错无警告。`FinishedMusic` 因此查注册表，`trimAfter`＝曲子自身长度，`trimBefore`＝开头静音。**判据：库的「聪明默认」在取不到输入时退化成无操作，而退化路径不报警。改完要量。**
- **`ffprobe` 通过不代表音轨没问题**（它报的是流不是采样）。`verify`/`topic:verify` 都会解码音轨，断言曲子起播后无 ≥1 秒纯零段（`-180 dBFS` 地板）。**六分钟母版 `out/tu-que-h.mp4` 最后 1:46 曾是数字静音。**
- **发布顺序 ≠ 书内原序**：按 `progress.json` 原序量，14 部新片相邻同曲 8 处；按 `publish-plan.md` 顺序量，前六部完美交替。**数字没错，是序列错了。**
- **线上听到的就是母版里那一首**（BGM 混进母版音轨，平台配乐只能叠加）。**换曲必须重渲。**
- 曲库 5 首（曲长见 `music-registry.ts`）：渔舟唱晚·古筝、高山流水、古镇旅行、箜音古涧·箜篌、风过檐角轻。前两首承载全部 72 部旧片，**新片不要默认回落**；每部只用 12–30 秒，**缺的不是素材量，是「不同的曲子」**。
- **可达音乐源只剩 incompetech**（2026-10-05，CC-BY 但声纹不搭）；FMA/musopen/爱给网/archive.org/Commons/Openverse/Pixabay 全不可用。**「再找几首 BGM」是最浅的一层**——真正没用过的杠杆是**身份层（固定开场/收尾音、口播）**，而它的缺陷无自动化能看见。

## 平台调研通道（2026-10-12 实测，细节见当日日志）

- **抖音 / 小红书：都用 MediaCrawler**（`C:\Users\18845\.workbuddy-ai\tools\MediaCrawler`，已扫码登录、登录态存 `browser_data/`）：`./.venv/Scripts/python.exe main.py --platform dy|xhs --lt qrcode --type search`（`--platform` 覆盖 config 里的 `PLATFORM`）。抖音裸抓会跳「验证码中间页」；小红书未登录报「IP存在风险」300012——**后者拦的是匿名请求，登录后同一 IP 正常**。抖音返回的昵称**被平台打码**。
- **B 站**：`api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=`（无需登录/签名）+ `/x/web-interface/card?mid=` 拿粉丝数。**先打 `/x/frontend/finger/spi` 取 buvid3/4 塞 Cookie，否则几页就 412**；`space/arc/search` 恒 -799。
- **接管本机浏览器登录态这条路不通**：Chrome 各 profile 无抖音/小红书登录，Edge 的 Cookie 库被运行进程锁死。`agent-browser` + Chromium 155 已装。**验证网络要用目标站点，别用 `example.com`**——这台机器上它不通（curl 也 000），会假象成代理坏了。
- **抖音自家数据（2026-10-17，n=79，详见报告第 01 节）**：**2s 跳出率是「开关」不是变量**——分桶播放中位 4,293（<20%）→ 205（>40%），**差 21 倍**；疑问句标题 +116%。**前 2 秒改造已见效（播放 +142%），但粉丝/千播 1.81→0.97——瓶颈已移到「看完 → 进主页」（标本：徐长卿播放 5,448、2s 跳出 16.3%、主页访问 0）。P0 重排为：片尾关注引导 > 前 2 秒。**
- 竞品结论存 `docs/research/ai-account-benchmark.html` + 同目录的 `{douyin,xhs}-benchmark-raw.csv`、`ai-account-benchmark.csv`（2026-10-24 从根目录归入 `docs/research/`，爬虫原始 JSON 在 `docs/research/douyin-scrape/`）。**要点：① 抖音点赞 P10 = 6,104，我们最高一部 35；② 跑出来的账号几乎都做「第 N 集」式系列化；③ 三平台是三套游戏——抖音吃点赞（中位 64,991）、小红书吃收藏（925 > 点赞 666，67% 图文）、B 站头部全是 30 分钟以上长内容。**

## 已知缺口

- 远端 `git@github.com:fantymoon/Herbal.git`（**必须 SSH**：HTTPS push 会挂死）。`out/` 母版仅本地单点，约 180MB 不在仓库（`npm run manifest` 记录应有内容）。
- **方剂线（`mode:"formula"`/"方"印）从未产出**（印章已是 `sealGlyph(mode)`，无内容验证过）。
- **曲库没有授权记录**（`music-registry.ts` 的 `license` 全 `unrecorded`，`check` 每次打一行 note）。**不要猜一个许可证填进去。**
- 无口播/人格；封面未与首帧分离。**C 项（多部位条目）待做**：桑根白皮（91 字，四部位 + `∶` U+2236 字体风险）。**B 项（声明 `duration`）已用于生产**（大枣 900 帧）；810 帧那条仍未跑过真片。
- **两个会话可能同时在改同一个工作区**：提交前先 `git status`，只暂存自己的文件；对方可能留下编译不过的中间状态。
- 文档：过拟合审计 `docs/research/overfit-audit.html`（A 项已定并实施）、优化计划 `docs/research/optimization-plan.html`、发布排期 `publish-plan.md`（**必须留在根目录**：`scripts/check-films.ts` 与 `tests/music.test.ts` 按 `../publish-plan.md` 读它）。
- **旧方案 `docs/research/opus.md` 已核过，不必再读**（2026-10-07 逐条对账）：视觉 9 条做了 6 条（缺**全幅照片**、转场动效、收尾屏），字体内嵌 ✅ / 音乐授权 ❌，**技术路线 7 条全未做**。其中「全幅照片」是它自己列的「建议先做」三项里的最后一项，只做了不碰封面的 Ken Burns 那半（照片缓推 7%）。
- **长视频线（跨书专题）**：现形态见 `docs/longform.md`（`film.yaml` → `longform:voice|build|sheet`），金样例 `src/topics/pangxie/`；旧一期 `tu-que` 是上一版。中文 `src/topics/` + 英文 `src/topics-en/`（非翻译、题材复用）**共享**语料与全部组件/配置，**独立**内容模块、配音、封面、台账；`--dir=` 区分，中间产物分 `.topic-work/` 与 `.topic-work-en/`。英文语音 `en-US-ChristopherNeural`。
- **第三条线「本草一问」**（2026-10-07 新建）：B 站竖屏，每集 40 秒答一个本草名物/文字/历史问题，**不讲功效**。单集＝一个 YAML（`remotion-video/asks/<id>.yaml`，五段 问/物/书/考/收）→ `ask:build` → `ask:voice` → `ask:compositions`（**加一集＝加一个 YAML**）→ `ask:check`（**只三条规则**：旁白/字幕无功效词（**引文豁免**）· 每条引文有出处 · 每张图有授权）→ `ask:verify --render`。规则在 `scripts/lib/ask-rules.ts`，`tests/ask.test.ts` 喂坏输入验它。**渲染必须 `--concurrency=1 --timeout=180000`**（`src/index.ts` 的 24MB 霞鹜文楷会让默认参数的 `loadFont` delayRender 超时）。已出 9 集，发布链 大枣→橘柚→王不留行→防己→天雄→藕实茎→徐长卿→败酱→百合→白棘（未做）。
  - **考据先读整条，别只读经文那一行**——答案常常就在**它自己的案语**里。**判据：底本与证类不一致时，先看有没有第二个抄本支持底本**（百合 1:5，那 1 处正是《名医别录》抄的《本经》→ 判成古今字而不是讹字）。
  - **写一集前必查的三件事、断行、朱红不变式、取图守卫**：全在 `remotion-video/asks/README.md`（怎么做对）与 `asks/pitfalls.md`（为什么是这样）。其中**三条门禁都不核对引文与语料是否逐字一致**——开一集前先 `npm run entry -- --name=` 看有没有缺字。
  - **`edge-tts` 的边界类型默认是句级**：词级要显式 `Communicate(..., boundary="WordBoundary")`，**`proxy` 也必须显式传**；`scripts/tts_words.py` 走这条路，对齐靠不变式「边界 `text` 首尾相接 == 旁白去标点后的字序列」。
- **新开一条线时，集合性质的不变量要一起扩**：`tests/finished-video.test.ts` 的「图片台账无孤儿」原本只扫 `src/finished` + `src/films`。
- **凡是会被观众读到的文字都归内容模块管**——渲染器不该替作者说话，否则第二个语言版本一定会漏（`TopicContent` 有 `closingLine`/`tagline`/`eras?`）。
