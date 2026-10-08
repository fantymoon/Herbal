import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { compileEpisode, episodeIds, loadCredits, readOffset } from "../scripts/lib/ask.ts";
import {
  photoLicenceProblems,
  quoteSourceProblems,
  wordingProblems,
} from "../scripts/lib/ask-rules.ts";
import type { AskContent, AskSegment } from "../src/asks/types.ts";

// 「本草一问」的门禁测试。
//
// 判据和这个仓库里其它测试一样：**它能不能在一个真实缺陷上变红？**
// 所以下面喂的全是坏输入——一个只会对好输入点头的检查器等于没有检查器。
// 这里不测版式、不测措辞品味（"这句话我是不是已经说过"是判断，不是规则），
// 只测那三条规则各自在什么情况下必须响。

const repo = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const credits = loadCredits(repo);

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
