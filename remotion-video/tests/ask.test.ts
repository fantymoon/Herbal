import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { compileEpisode, episodeIds, loadCredits, readOffset } from "../scripts/lib/ask.ts";
import {
  photoLicenceProblems,
  quoteSourceProblems,
  seriesCoverProblems,
  wordingProblems,
} from "../scripts/lib/ask-rules.ts";
import { COVER_PHOTO, coverRows, type CoverRow } from "../src/asks/series-cover.ts";
import type { AskContent, AskSegment } from "../src/asks/types.ts";

// 「本草一问」的门禁测试。
//
// 判据和这个仓库里其它测试一样：**它能不能在一个真实缺陷上变红？**
// 所以下面喂的全是坏输入——一个只会对好输入点头的检查器等于没有检查器。
// 这里不测单集的版式与措辞品味（"这句话我是不是已经说过"是判断，不是规则），
// 只测那三条规则各自在什么情况下必须响。唯一的例外是系列封面：它不是一集，
// 三条规则管不到它，而它的两处毛病（字压进平台 UI 区、一行顶出内容列）
// 恰好是缩到 200px 才看得出来、看静帧最容易放过的那一类。

const repo = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const credits = loadCredits(repo);

/** 封面门禁的调用形态：行数据 + 那张照片 + 图片台账。 */
const coverProblems = (rows: CoverRow[]) => seriesCoverProblems(rows, COVER_PHOTO, credits);

/** 一集最小可用的骨架；各用例只改它关心的那一处。 */
const makeContent = (overrides: Partial<AskContent> = {}): AskContent => {
  const segment = (role: AskSegment["role"], extra: Partial<AskSegment> = {}): AskSegment => ({
    role,
    narration: "这是一句旁白。",
    ...extra,
  });
  return {
    id: "test",
    entry: "大枣",
    question: "古书里，大枣的叶子为什么单占一行？",
    deck: "厨房里的本草 · 01",
    collection: "厨房里的本草",
    accent: "#a5613a",
    segments: [
      segment("ask", { photos: [{ file: "jujuba-fruit-cluster.jpg", caption: "果", credit: "古淑玲 / CC0" }] }),
      segment("object", {
        photos: [
          { file: "jujuba-flower-leaf.jpg", caption: "叶与花", credit: "ANDREW CONBOY / CC BY" },
          { file: "jujuba-fruit-branch.jpg", caption: "果", credit: "古淑玲 / CC0" },
        ],
      }),
      segment("book", {
        narration: "最后一句：叶覆麻黄，能令出汗。",
        read: "叶覆麻黄，能令出汗。",
        quote: { text: "叶覆麻黄，能令出汗。", source: "《神农本草经》卷一 · 上经" },
      }),
      segment("study", {
        evidence: [
          { text: "覆麻黄能令出汗，生河东平泽。", source: "《千金翼方》· 唐" },
          { text: "覆麻黄，则扬液成汗。", source: "《本草乘雅半偈》· 明" },
        ],
      }),
      segment("closing"),
    ],
    sources: ["《神农本草经》卷一·上经（汉）"],
    next: "下一味，橘柚。",
    disclaimer: "古籍内容展示，不构成诊疗建议",
    music: "music/fengguo-yanjiao.mp3",
    ...overrides,
  };
};

test("规则一：旁白里的现代功效词会让门禁变红", () => {
  const content = makeContent();
  content.segments[3].narration = "古人认为枣叶可以缓解头痛。";
  const findings = wordingProblems(content);
  assert.ok(
    findings.some((f) => f.rule === "banned-wording" && f.detail.includes("缓解")),
    "「缓解」出现在旁白里必须被判违规",
  );
});

test("规则一：引文里的功效词不判违规——那是书上说的", () => {
  // 这条界线就是这一系列敢在屏幕上放「能令出汗」的原因。
  // 如果它不成立，整个"引文照录、旁白不复述"的做法就站不住。
  const content = makeContent();
  content.segments[2].quote = { text: "叶覆麻黄，能令出汗。", source: "《神农本草经》卷一 · 上经" };
  content.segments[3].evidence = [
    { text: "覆麻黄，能令出汗（《本经》）。", source: "《本草纲目》· 明" },
    { text: "【主治】覆麻黄，能令出汗。", source: "《证类本草》· 宋" },
  ];
  assert.deepEqual(wordingProblems(content), [], "引文里的 主治 / 能令出汗 不该被判违规");
});

test("规则一：考据小注与预告也在扫描范围内", () => {
  const content = makeContent();
  content.segments[3].evidence = [
    { text: "覆麻黄能令出汗。", source: "《千金翼方》· 唐", note: "古人用它消炎。" },
    { text: "覆麻黄，则扬液成汗。", source: "《本草乘雅半偈》· 明" },
  ];
  const findings = wordingProblems(content);
  assert.ok(findings.some((f) => f.detail.includes("消炎")), "考据小注是我们写的散文，不是引文");
});

test("规则二：没有出处的引文必须变红", () => {
  const content = makeContent();
  content.segments[3].evidence = [
    { text: "覆麻黄能令出汗。", source: "" },
    { text: "覆麻黄，则扬液成汗。", source: "《本草乘雅半偈》· 明" },
  ];
  const findings = quoteSourceProblems(content);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, "quote-source");
});

test("规则二：一条引文都没有的片子变红——那就不是读古书了", () => {
  const content = makeContent();
  content.segments[2].quote = undefined;
  content.segments[3].evidence = [];
  const findings = quoteSourceProblems(content);
  assert.ok(findings.some((f) => f.detail.includes("一条引文都没有")));
});

test("规则三：未登记的图必须变红", () => {
  const content = makeContent();
  content.segments[0].photos = [{ file: "not-in-the-ledger.jpg", caption: "果", credit: "x / CC0" }];
  const findings = photoLicenceProblems(content, credits);
  assert.ok(findings.some((f) => f.detail.includes("not-in-the-ledger.jpg")));
});

test("规则三：台账里许可为空必须变红", () => {
  const content = makeContent();
  const fake = new Map(credits);
  fake.set("jujuba-fruit-cluster.jpg", { file: "jujuba-fruit-cluster.jpg", subject: null, author: null, license: "" });
  const findings = photoLicenceProblems(content, fake);
  assert.ok(findings.some((f) => f.detail.includes("许可为空")));
});

test("规则三：片内署名为空必须变红——重编能修好它", () => {
  const content = makeContent();
  content.segments[0].photos = [{ file: "jujuba-fruit-cluster.jpg", caption: "果", credit: "" }];
  const findings = photoLicenceProblems(content, credits);
  assert.ok(findings.some((f) => f.detail.includes("片内署名")));
});

test("read 必须是旁白去掉标点后的连续子串", () => {
  assert.equal(readOffset("最后一句：叶覆麻黄，能令出汗。", "叶覆麻黄，能令出汗。") >= 0, true);
  // 字序被打乱就不是连续子串了——词级时间戳会落到错的字上。
  assert.equal(readOffset("最后一句：叶覆麻黄，能令出汗。", "麻黄叶覆"), -1);
  assert.equal(readOffset("最后一句：叶覆麻黄。", "叶覆麻黄，能令出汗。"), -1);
});

test("已上线的这一集本身是合规的", () => {
  const ids = episodeIds(repo);
  assert.ok(ids.length > 0, "asks/ 下至少要有一集");
  for (const id of ids) {
    const { content, problems } = compileEpisode(repo, id, credits);
    assert.deepEqual(problems, [], `${id} 的 YAML 结构有问题`);
    assert.ok(content, `${id} 编译不出内容`);
    assert.deepEqual(wordingProblems(content), [], `${id} 的旁白里有功效词`);
    assert.deepEqual(quoteSourceProblems(content), [], `${id} 有引文没出处`);
    assert.deepEqual(photoLicenceProblems(content, credits), [], `${id} 有图没授权`);
  }
});

test("每一张被这一系列引用的图都在图片台账里", () => {
  // 与 tests/finished-video.test.ts 的同名断言同源：那边扫 src/finished 与 src/films，
  // 这边扫 src/asks。两边合起来才是"public/images 下没有孤儿图"这个不变量。
  const referenced = new Set<string>();
  for (const id of episodeIds(repo)) {
    const { content } = compileEpisode(repo, id, credits);
    for (const segment of content?.segments ?? []) {
      for (const photo of segment.photos ?? []) referenced.add(photo.file);
    }
  }
  assert.ok(referenced.size > 0, "这一系列一张图都没引用");
  for (const file of referenced) {
    assert.ok(credits.has(file), `${file} 不在 credits.json 里`);
    assert.ok(
      fs.existsSync(new URL(`../public/images/${file}`, import.meta.url)),
      `${file} 登记了但文件不在 public/images 下`,
    );
  }
});

test("系列封面：文案不越线、字不压进平台 UI 区", () => {
  assert.deepEqual(coverProblems(coverRows), [], "现在这张封面上有问题");
});

test("系列封面：一句功效措辞就会让它变红", () => {
  // 封面曾经不需要被扫——它是"系列宣传图"，不是某一集。但平台读的是文字，
  // 而这张图比任何一集的第 0 帧都更常出现在别人眼前。
  const bad = coverProblems(
    coverRows.map((row) =>
      row.kind === "tagline" ? { ...row, lines: ["每集四十秒，讲一味本草药效"] } : row,
    ),
  );
  assert.ok(
    bad.some((f) => f.rule === "cover-positioning" && f.detail.includes("药效")),
    "「药效」是账号定位词，封面必须报",
  );

  const claim = coverProblems(
    coverRows.map((row) =>
      row.kind === "label" ? { ...row, lines: ["古书里缓解头痛的说法"] } : row,
    ),
  );
  assert.ok(
    claim.some((f) => f.rule === "cover-wording" && f.detail.includes("缓解")),
    "「缓解」是功效措辞，封面必须报",
  );
});

test("系列封面：少了系列名或免责声明，就不是一张可发的封面", () => {
  const noTitle = coverProblems(coverRows.filter((row) => row.kind !== "title"));
  assert.ok(noTitle.some((f) => f.rule === "cover-title"), "没有系列名的封面必须报");

  const noDisclaimer = coverProblems(coverRows.filter((row) => row.kind !== "disclaimer"));
  assert.ok(noDisclaimer.some((f) => f.rule === "cover-disclaimer"), "缺免责声明必须报");
});

test("系列封面：任何一行压进底部平台区、或顶出内容列，都会变红", () => {
  // 这两条都是"缩到 200px 才看得出来"的毛病，静帧里看着正好不等于发出去能看。
  const low = coverProblems(
    coverRows.map((row) => (row.kind === "disclaimer" ? { ...row, y: 1420 } : row)),
  );
  assert.ok(
    low.some((f) => f.rule === "cover-geometry" && f.detail.includes("平台 UI 线")),
    "底边越过 y=1440 必须报",
  );

  const wide = coverProblems(
    coverRows.map((row) =>
      row.kind === "books"
        ? { ...row, lines: ["《神农本草经》《证类本草》《本草纲目》《千金翼方》"] }
        : row,
    ),
  );
  assert.ok(
    wide.some((f) => f.rule === "cover-geometry" && f.detail.includes("内容列")),
    "一行超出内容列必须报",
  );
});

test("封面上那句「七百部」数得出证据", () => {
  // 这是封面上唯一一句关于账号自己的事实。语料库哪天缩到 700 以下，这句话就从"资产"
  // 变成"吹的"——而封面是最不该吹的地方，这个账号已经因为一句夸张的描述被平台判过一次。
  const corpus = new URL("../../TCM-Ancient-Books-master", import.meta.url);
  const books = fs.readdirSync(corpus).filter((f) => f.endsWith(".txt"));
  assert.ok(
    books.length >= 700,
    `语料库只剩 ${books.length} 部，封面上那行「七百部古籍做底」要改`,
  );

  const label = coverRows.find((row) => row.kind === "label");
  assert.ok(
    label && label.lines.join("").includes("七百部"),
    "封面那行要说出这个规模，不能只列三部主干书",
  );
});

test("系列封面：那张照片也要有授权，署名要与台账逐字一致", () => {
  // 规则三对单集做的事，对封面同样成立：图上写一位作者、台账写另一位，
  // 平台上撤下来的是我们。
  const missing = seriesCoverProblems(coverRows, { ...COVER_PHOTO, file: "nobody.jpg" }, credits);
  assert.ok(
    missing.some((f) => f.rule === "cover-photo" && f.detail.includes("credits.json")),
    "没登记的图必须报",
  );

  const drifted = seriesCoverProblems(
    coverRows,
    { ...COVER_PHOTO, credit: "某位拍摄者 / CC0" },
    credits,
  );
  assert.ok(
    drifted.some((f) => f.rule === "cover-photo" && f.detail.includes("台账写的是")),
    "署名与台账不一致必须报",
  );
});
