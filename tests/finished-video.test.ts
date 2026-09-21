import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const compositionSource = fs.readFileSync(new URL("../src/Composition.tsx", import.meta.url), "utf8");
const finishedUrl = new URL("../src/finished/ginseng-first-film.tsx", import.meta.url);
const licoriceUrl = new URL("../src/finished/licorice-second-film.tsx", import.meta.url);
const peonyUrl = new URL("../src/finished/peony-second-film.tsx", import.meta.url);
const bupleurumUrl = new URL("../src/finished/bupleurum-third-film.tsx", import.meta.url);
const angelicaUrl = new URL("../src/finished/angelica-fourth-film.tsx", import.meta.url);
const angelicaPhotoUrl = new URL("../src/finished/angelica-fourth-film-real-photo.tsx", import.meta.url);
const stageSource = fs.readFileSync(new URL("../src/herbal-stage.tsx", import.meta.url), "utf8");

const countOccurrences = (source: string, phrase: string) =>
  source.split(phrase).length - 1;

test("the first finished video is an independent ginseng composition", () => {
  assert.equal(fs.existsSync(finishedUrl), true);
  const source = fs.readFileSync(finishedUrl, "utf8");

  assert.equal(compositionSource.includes('id="GinsengFirstFilm"'), true);
  assert.equal(compositionSource.includes("durationInFrames={240}"), true);
  assert.equal(compositionSource.includes("width={1080}"), true);
  assert.equal(compositionSource.includes("height={1920}"), true);
  assert.equal(source.includes('durationInFrames={240}'), true);
  assert.equal(source.includes('<Seal text="药"'), true);
  assert.equal(stageSource.includes("durationInFrames?: number"), true);
  assert.equal(source.includes("《神农本草经》"), true);
  assert.equal(source.includes("味甘，微寒"), true);
  assert.equal(source.includes("主补五脏，安精神，定魂魄"), true);
  assert.equal(source.includes('staticFile("music/yuzhou-changwan.mp3")'), true);
  assert.equal(source.includes('import { Img, staticFile } from "remotion"'), true);
  assert.equal(source.includes('staticFile("images/panax-ginseng-kitchen.jpg")'), true);
  assert.equal(source.includes('staticFile("sign-1.png")'), true);
  assert.equal(source.includes("GinsengIllustration"), false);
  assert.equal(source.includes("READING CONTINUED"), true);
  assert.equal(source.includes("PUBLICATION NOTE"), true);
  assert.equal(
    fs.existsSync(new URL("../public/images/panax-ginseng-kitchen.jpg", import.meta.url)),
    true,
  );
  assert.equal(source.includes("古籍内容展示，不构成诊疗建议"), true);
});

test("the licorice film stays independent, photo-led, and avoids repeated habitat copy", () => {
  assert.equal(fs.existsSync(licoriceUrl), true);
  const source = fs.readFileSync(licoriceUrl, "utf8");

  assert.equal(compositionSource.includes('id="LicoriceSecondFilm"'), true);
  assert.equal(source.includes('durationInFrames={240}'), true);
  assert.equal(source.includes('<Seal text="药"'), true);
  assert.equal(source.includes('staticFile("images/gancao-rhizome.jpg")'), true);
  assert.equal(source.includes('staticFile("music/gaoshan-liushui.mp3")'), true);
  assert.equal(source.includes('staticFile("sign-1.png")'), true);
  assert.equal(source.includes("RootIllustration"), false);
  assert.equal(source.includes("<svg"), false);
  assert.equal(source.includes("味甘，平。"), true);
  assert.equal(countOccurrences(source, "生川谷"), 1);
  assert.equal(
    fs.existsSync(new URL("../public/images/gancao-rhizome.jpg", import.meta.url)),
    true,
  );
});

test("the peony film follows the same source book without repeating its habitat copy", () => {
  assert.equal(fs.existsSync(peonyUrl), true);
  const source = fs.readFileSync(peonyUrl, "utf8");

  assert.equal(compositionSource.includes('id="PeonySecondFilm"'), true);
  assert.equal(source.includes('durationInFrames={240}'), true);
  assert.equal(source.includes('<Seal text="药"'), true);
  assert.equal(source.includes('staticFile("images/paeonia-lactiflora.jpg")'), true);
  assert.equal(source.includes('staticFile("music/yuzhou-changwan.mp3")'), true);
  assert.equal(source.includes('staticFile("sign-1.png")'), true);
  assert.equal(source.includes("RootIllustration"), false);
  assert.equal(source.includes("<svg"), false);
  assert.equal(source.includes("味苦，平。"), true);
  assert.equal(countOccurrences(source, "生川谷"), 1);
  assert.equal(
    fs.existsSync(new URL("../public/images/paeonia-lactiflora.jpg", import.meta.url)),
    true,
  );
});

test("the bupleurum film stays photo-led and keeps each source phrase in one scene", () => {
  assert.equal(fs.existsSync(bupleurumUrl), true);
  const source = fs.readFileSync(bupleurumUrl, "utf8");

  assert.equal(compositionSource.includes('id="BupleurumThirdFilm"'), true);
  assert.equal(source.includes('durationInFrames={240}'), true);
  assert.equal(source.includes('<Seal text="药"'), true);
  assert.equal(source.includes('staticFile("images/'), false);
  assert.equal(source.includes('staticFile("music/gaoshan-liushui.mp3")'), true);
  assert.equal(source.includes('staticFile("sign-1.png")'), true);
  assert.equal(source.includes("RootIllustration"), false);
  assert.equal(source.includes("<svg"), false);
  assert.equal(source.includes("味苦，平。"), true);
  assert.equal(source.includes("主心腹，去肠胃中结气，饮食积聚，寒热邪气，推陈致新。"), true);
  assert.equal(source.includes("MODERN READING"), true);
  assert.equal(source.includes("这段话主要谈及胸腹不适"), true);
  assert.equal(countOccurrences(source, "一名地熏"), 1);
});

test("the angelica film remains in the same book batch and avoids repeated habitat copy", () => {
  assert.equal(fs.existsSync(angelicaUrl), true);
  const source = fs.readFileSync(angelicaUrl, "utf8");

  assert.equal(compositionSource.includes('id="AngelicaFourthFilm"'), true);
  assert.equal(source.includes('durationInFrames={240}'), true);
  assert.equal(source.includes('<Seal text="药"'), true);
  assert.equal(source.includes('staticFile("images/'), false);
  assert.equal(source.includes('staticFile("music/yuzhou-changwan.mp3")'), true);
  assert.equal(source.includes('staticFile("sign-1.png")'), true);
  assert.equal(source.includes("RootIllustration"), false);
  assert.equal(source.includes("<svg"), false);
  assert.equal(source.includes("味甘，温。"), true);
  assert.equal(source.includes("主咳逆上气，温疟、寒热，洗在皮肤中"), true);
  assert.equal(source.includes("MODERN READING"), true);
  assert.equal(source.includes("这段记载列出气逆咳嗽"), true);
  assert.equal(countOccurrences(source, "生川谷"), 1);
});

test("the angelica photo variant uses a real credited image without changing the text variant", () => {
  assert.equal(fs.existsSync(angelicaPhotoUrl), true);
  const source = fs.readFileSync(angelicaPhotoUrl, "utf8");

  assert.equal(compositionSource.includes('id="AngelicaFourthFilmRealPhoto"'), true);
  assert.equal(source.includes('staticFile("images/dried-angelica-slices-cc0.jpg")'), true);
  assert.equal(source.includes("Wikimedia Commons"), true);
  assert.equal(source.includes("CC0 1.0"), true);
  assert.equal(source.includes("<Img"), true);
  assert.equal(source.includes("border: `1px solid"), true);
  assert.equal(source.includes("backgroundImage"), false);
});

// The Huangqi-to-Tusizi films are covered row by row in shangjingContinuation below.

const herbBatch = [
  { id: "DuhuoFirstFilm", cn: "独活", img: "angelica-duhuo.jpg", credit: "KOICHI ODA", music: "yuzhou-changwan.mp3", flavor: "味苦，平。", phrases: ["风寒所击", "女子疝瘕"], alias: "一名羌青", habitat: "生川谷", harvest: "二月、八月采根", extra: "无风自动" },
  { id: "CheqianziFirstFilm", cn: "车前子", img: "plantago-cheqianzi.jpg", credit: "SHIZHAO", music: "gaoshan-liushui.mp3", flavor: "味甘，寒，无毒。", phrases: ["利水道小便", "除湿痹"], alias: "一名当道", habitat: "生平泽", harvest: "五月五日采", extra: "喜在牛迹中生" },
  { id: "MuxiangFirstFilm", cn: "木香", img: "costus-muxiang.jpg", credit: "PLANTAGENET", music: "yuzhou-changwan.mp3", flavor: "味辛。", phrases: ["辟毒疫温鬼", "不梦寤魇寐"], alias: "一名蜜香", habitat: "生山谷", harvest: "生永昌", extra: "致神仙" },
  { id: "ShuyuFirstFilm", cn: "署豫", img: "dioscorea-shuyu.jpg", credit: "USDA FOREST SERVICE", music: "gaoshan-liushui.mp3", flavor: "味甘，温。", phrases: ["补虚羸", "益气力"], alias: "一名山芋", habitat: "生山谷", harvest: "二月、八月采根", extra: "秦楚名玉延" },
  { id: "YiyirenFirstFilm", cn: "薏苡仁", img: "coix-yiyiren.jpg", credit: "FOREST & KIM STARR", music: "yuzhou-changwan.mp3", flavor: "味甘，微寒。", phrases: ["拘挛不可屈伸", "下三虫"], alias: "一名解蠡", habitat: "生平泽及田野", harvest: "八月采实", extra: "常饵薏苡实" },
  { id: "ZexieFirstFilm", cn: "泽泻", img: "alisma-zexie.jpg", credit: "ROBERT FLOGAUS-FAUST", music: "gaoshan-liushui.mp3", flavor: "味甘，寒。", phrases: ["乳难", "能行水上"], alias: "一名水泻", habitat: "生池泽", harvest: "八月采根", extra: "如车前草大" },
  { id: "YuanzhiFirstFilm", cn: "远志", img: "polygala-yuanzhi.jpg", credit: "PUBLIC DOMAIN", music: "yuzhou-changwan.mp3", flavor: "味苦，温。", phrases: ["益智慧", "强志倍力"], alias: "一名棘菀", habitat: "生川谷", harvest: "四月采根", extra: "太山及冤句" },
  { id: "LongdanFirstFilm", cn: "龙胆", img: "gentiana-longdan.jpg", credit: "DEZIDOR", music: "gaoshan-liushui.mp3", flavor: "味苦涩。", phrases: ["骨间寒热", "杀蛊毒"], alias: "一名陵游", habitat: "生山谷", harvest: "十二月采根", extra: "生齐朐及冤句" },
  { id: "XixinFirstFilm", cn: "细辛", img: "asarum-xixin.jpg", credit: "ROBERT FLOGAUS-FAUST", music: "yuzhou-changwan.mp3", flavor: "味辛，温。", phrases: ["头痛脑动", "百节拘挛"], alias: "一名小辛", habitat: "生山谷", harvest: "二月、八月采根", extra: "色白者" },
  { id: "ShihuFirstFilm", cn: "石斛", img: "dendrobium-shihu.jpg", credit: "MAJA DUMAT", music: "gaoshan-liushui.mp3", flavor: "味甘，平。", phrases: ["五脏虚劳", "强阴"], alias: "一名林兰", habitat: "生山谷", harvest: "七月、八月采茎", extra: "水傍石上" },
  { id: "BajitianFirstFilm", cn: "巴戟天", img: "morinda-bajitian.jpg", credit: "FUMIKAS SAGISAVAS", music: "yuzhou-changwan.mp3", flavor: "味辛，微温。", phrases: ["大风邪气", "阴痿不起"], alias: null, habitat: "生山谷", harvest: "二月、八月采根", extra: "巴郡及下邳" },
  { id: "BaiyingFirstFilm", cn: "白英", img: "solanum-baiying.jpg", credit: "SUN JIAO", music: "gaoshan-liushui.mp3", flavor: "味甘，寒。", phrases: ["八疽", "消渴"], alias: "一名谷菜", habitat: "生山谷", harvest: "冬采根", extra: "此鬼目草也" },
  { id: "BaihaoFirstFilm", cn: "白蒿", img: "artemisia-baihao.jpg", credit: "ANDREY KOROBKOV", music: "yuzhou-changwan.mp3", flavor: "味甘，平。", phrases: ["令黑", "疗心悬"], alias: null, habitat: "生川泽", harvest: "二月采", extra: "于以采蘩" },
  { id: "ChijianFirstFilm", cn: "赤箭", img: "gastrodia-chijian.jpg", credit: "PUBLIC DOMAIN", music: "gaoshan-liushui.mp3", flavor: "味辛，温。", phrases: ["蛊毒恶气", "肥健"], alias: "一名鬼督邮", habitat: "生川谷", harvest: "四月、八月采根", extra: "根如芋子" },
  { id: "YanlvziFirstFilm", cn: "奄闾子", img: "herbarium-yanlvzi.jpg", credit: "DMITRY MAKEEV", music: "yuzhou-changwan.mp3", flavor: "味苦，微寒。", phrases: ["五脏瘀血", "身体诸痛"], alias: null, habitat: "生川谷", harvest: "十月采根", extra: "食之，神仙" },
  { id: "XiziFirstFilm", cn: "析子", img: "thlaspi-xizi.jpg", credit: "HELGE KLAUS RIEDER", music: "gaoshan-liushui.mp3", flavor: "味辛，微温。", phrases: ["目痛泪出", "益精光"], alias: "一名马辛", habitat: "生川泽及道旁", harvest: "五月采", extra: "生咸阳" },
  { id: "ShishiFirstFilm", cn: "蓍实", img: "achillea-shishi.jpg", credit: "US NPS", music: "yuzhou-changwan.mp3", flavor: "味苦，平。", phrases: ["充肌肤", "先知"], alias: null, habitat: "生山谷", harvest: "九月采实", extra: "百茎共一根" },
  { id: "ChizhiFirstFilm", cn: "赤芝", img: "ganoderma-chizhi.jpg", credit: "MOTOKO C. K.", music: "gaoshan-liushui.mp3", flavor: "味苦，平。", phrases: ["益心气", "增智慧"], alias: "一名丹芝", habitat: "生山谷", harvest: "六芝之一", extra: "赤色入心" },
  { id: "QingzhiFirstFilm", cn: "青芝", img: "ganoderma-qingzhi.jpg", credit: "GEORGE CHERNILEVSKY", music: "yuzhou-changwan.mp3", flavor: "味酸，平。", phrases: ["补肝气", "安精魂"], alias: "一名龙芝", habitat: "生山谷", harvest: "六芝之二", extra: "青色入肝" },
  { id: "BaizhiFirstFilm", cn: "白芝", img: "trametes-baizhi.jpg", credit: "HENK MONSTER", music: "gaoshan-liushui.mp3", flavor: "味辛，平。", phrases: ["益肺气", "安魄"], alias: "一名玉芝", habitat: "生山谷", harvest: "六芝之三", extra: "白色入肺" },
];

for (const h of herbBatch) {
  test(`the ${h.cn} film continues the shangjing sequence with a credited photo, alternating music, and no repeated source phrases`, () => {
    const kebab = h.id.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
    const url = new URL(`../src/finished/${kebab}.tsx`, import.meta.url);
    assert.equal(fs.existsSync(url), true);
    const source = fs.readFileSync(url, "utf8");
    assert.equal(compositionSource.includes(`id="${h.id}"`), true);
    assert.equal(source.includes('durationInFrames={360}'), true);
    assert.equal(source.includes('<Seal text="药"'), true);
    assert.equal(countOccurrences(source, h.cn), 1);
    assert.equal(source.includes("《神农本草经》"), true);
    assert.equal(source.includes("卷一 · 上经"), true);
    assert.equal(source.includes("上经 · 草部"), true);
    assert.equal(source.includes(h.flavor), true);
    for (const p of h.phrases) {
      assert.equal(source.includes(p), true);
    }
    if (h.alias) {
      assert.equal(countOccurrences(source, h.alias), 1);
    } else {
      assert.equal(source.includes("别名"), false);
    }
    assert.equal(countOccurrences(source, h.habitat), 1);
    assert.equal(countOccurrences(source, h.harvest), 1);
    assert.equal(countOccurrences(source, h.extra), 1);
    assert.equal(source.includes("今译"), true);
    assert.equal(source.includes("MODERN READING"), true);
    assert.equal(source.includes(`staticFile("images/${h.img}")`), true);
    assert.equal(fs.existsSync(new URL(`../public/images/${h.img}`, import.meta.url)), true);
    assert.equal(source.includes(h.credit), true);
    assert.equal(source.includes(`staticFile("music/${h.music}")`), true);
    assert.equal(source.includes('staticFile("sign-1.png")'), true);
    assert.equal(source.includes("古籍内容展示，不构成诊疗建议"), true);
    assert.equal(source.includes("<svg"), false);
    assert.equal(source.includes("RootIllustration"), false);
    assert.equal(source.includes("阅读顺序"), false);
    assert.equal(source.includes("ENTRY 0"), false);
  });
}

// The Niuxi-to-Maimendong films are covered row by row in shangjingContinuation below.

const minerals = [
  { id: "YunmuFirstFilm", cn: "云母", img: "yunmu-mineral.jpg", flavor: "味甘，平。", quote: "主身皮死肌", alias: "一名云珠", habitat: "生山谷", pick: "二月采" },
  { id: "YuquanFirstFilm", cn: "玉泉", img: "yuquan-mineral.jpg", flavor: "味甘，平。", quote: "柔筋强骨", alias: "一名玉札", habitat: "生山谷", pick: "以乌米酒化之为水" },
  { id: "ShizhongruFirstFilm", cn: "石钟乳", img: "shizhongru-mineral.jpg", flavor: "味甘，温。", quote: "通百节", alias: "一名公乳", habitat: "生山谷", pick: "采无时" },
  { id: "NieshiFirstFilm", cn: "涅石", img: "nieshi-mineral.jpg", flavor: "味酸，寒。", quote: "白沃阴蚀", alias: "一名羽涅", habitat: "生山谷", pick: "采无时" },
  { id: "XiaoshiFirstFilm", cn: "硝石", img: "xiaoshi-mineral.jpg", flavor: "味苦，寒。", quote: "涤去蓄结饮食", alias: "一名芒硝", habitat: "生山谷", pick: "采无时" },
  { id: "PuxiaoFirstFilm", cn: "朴硝", img: "puxiao-mineral.jpg", flavor: "味苦，寒。", quote: "能化七十二种石", alias: "一名硝石朴", habitat: "生山谷", pick: "采无时" },
  { id: "HuashiFirstFilm", cn: "滑石", img: "huashi-mineral.jpg", flavor: "味甘，寒。", quote: "女子乳难", alias: "一名液石", habitat: "生山谷", pick: "采无时" },
  { id: "KongqingFirstFilm", cn: "空青", img: "kongqing-mineral.jpg", flavor: "味甘，寒。", quote: "眚盲耳聋", alias: "上经 · 药上品", habitat: "生山谷", pick: "三月中旬采" },
  { id: "ZengqingFirstFilm", cn: "曾青", img: "zengqing-mineral.jpg", flavor: "味酸，小寒。", quote: "破症坚积聚", alias: "上经 · 药上品", habitat: "生山谷", pick: "采无时" },
  { id: "YuyuliangFirstFilm", cn: "禹余粮", img: "yuyuliang-mineral.jpg", flavor: "味甘，寒。", quote: "血闭症瘕", alias: "一名白余粮", habitat: "生池泽及山岛中", pick: "弃余食于江中" },
  { id: "TaiyiFirstFilm", cn: "太乙余食", img: "taiyi-mineral.jpg", flavor: "味甘，平。", quote: "漏下", alias: "一名石脑", habitat: "生山谷", pick: "九月采" },
  { id: "BaishiyingFirstFilm", cn: "白石英", img: "baishiying-mineral.jpg", flavor: "味甘，微温。", quote: "胸膈间久寒", alias: "上经 · 药上品", habitat: "生山谷", pick: "采无时" },
  { id: "ZishiyingFirstFilm", cn: "紫石英", img: "zishiying-mineral.jpg", flavor: "味甘，温。", quote: "绝孕十年无子", alias: "上经 · 药上品", habitat: "生山谷", pick: "采无时" },
  { id: "BaiqingFirstFilm", cn: "白青", img: "baiqing-mineral.jpg", flavor: "味甘，平。", quote: "杀诸毒、三虫", alias: "上经 · 药上品", habitat: "生山谷", pick: "采无时" },
  { id: "BianqingFirstFilm", cn: "扁青", img: "bianqing-mineral.jpg", flavor: "味甘，平。", quote: "解毒瓦斯", alias: "上经 · 药上品", habitat: "生山谷", pick: "采无时" },
];

for (const m of minerals) {
  test(`the ${m.cn} mineral film continues the stone section in original order with a real CC0 photo and no repeated source phrases`, () => {    const kebab = m.id.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
    const url = new URL(`../src/finished/${kebab}.tsx`, import.meta.url);
    assert.equal(fs.existsSync(url), true);
    const source = fs.readFileSync(url, "utf8");

    assert.equal(compositionSource.includes(`id="${m.id}"`), true);
    assert.equal(source.includes('durationInFrames={360}'), true);
    assert.equal(source.includes('<Seal text="药"'), true);
    assert.equal(countOccurrences(source, m.cn), 1);
    assert.equal(source.includes("《神农本草经》"), true);
    assert.equal(source.includes("卷一 · 上经"), true);
    assert.equal(source.includes("上经 · 石部"), true);
    assert.equal(source.includes(m.flavor), true);
    assert.equal(source.includes(m.quote), true);
    assert.equal(source.includes("今译"), true);
    assert.equal(source.includes("MODERN READING"), true);
    assert.equal(countOccurrences(source, m.alias), 1);
    assert.equal(countOccurrences(source, m.habitat), 1);
    assert.equal(source.includes(m.pick), true);
    assert.equal(source.includes(`staticFile("images/${m.img}")`), true);
    assert.equal(fs.existsSync(new URL(`../public/images/${m.img}`, import.meta.url)), true);
    assert.equal(source.includes("GEODIL"), true);
    assert.equal(source.includes("CC0"), true);
    assert.equal(source.includes('staticFile("music/yuzhou-changwan.mp3")'), true);
    assert.equal(source.includes('staticFile("sign-1.png")'), true);
    assert.equal(source.includes("RootIllustration"), false);
    assert.equal(source.includes("<svg"), false);
    assert.equal(source.includes("古籍内容展示，不构成诊疗建议"), true);
    assert.equal(source.includes("阅读顺序"), false);
    assert.equal(source.includes("ENTRY 0"), false);
  });
}

test("every finished film renders through the shared FinishedFilm shell (except the photo wrapper)", () => {
  const dir = new URL("../src/finished/", import.meta.url);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".tsx")).sort();
  assert.ok(files.length > 0, "no finished films found");
  for (const f of files) {
    if (f === "angelica-fourth-film-real-photo.tsx") {
      continue;
    }
    const source = fs.readFileSync(new URL(f, dir), "utf8");
    assert.equal(source.includes("<FinishedFilm"), true, f);
    assert.equal(source.includes("const BackgroundMusic"), false, f);
    assert.equal(source.includes('from "../finished-shell"'), true, f);
  }
});

type ContinuationFilm = {
  id: string;
  cn: string;
  img: string;
  credits: string[];
  music: string;
  flavor: string;
  volume: string | null;
  division: string | null;
  phrases: string[];
  once: string[];
  absent: string[];
  peakVolume: string | null;
};

// Films from Huangqi onward share one scene shape (360 frames, 3 scenes) and
// one assertion shape. One row per film replaces one ~30-line bespoke test;
// the older 240-frame films keep their bespoke tests above.
const shangjingContinuation: ContinuationFilm[] = [
  { id: "HuangqiFirstFilm", cn: "黄耆", img: "astragalus-herbarium-cc0.jpg", credits: ["CC0"], music: "yuzhou-changwan.mp3", flavor: "味甘，微温", volume: null, division: null, phrases: ["黄耆", "主痈疽久败创", "排脓止痛", "大风痢疾", "戴糁"], once: ["生山谷"], absent: ["补五脏"], peakVolume: null },
  { id: "EphedraFirstFilm", cn: "麻黄", img: "ephedra-sinica.jpg", credits: ["CC BY-SA 4.0"], music: "yuzhou-changwan.mp3", flavor: "味苦，温", volume: "卷二 · 中经", division: null, phrases: ["麻黄", "主中风，伤寒头痛", "破症坚积聚"], once: ["龙沙", "生晋地及河东"], absent: [], peakVolume: null },
  { id: "DanshaFirstFilm", cn: "丹沙", img: "cinnabar-mineral.jpg", credits: ["CC0"], music: "yuzhou-changwan.mp3", flavor: "味甘，微寒", volume: "卷一 · 上经", division: "上经 · 石部", phrases: ["主身体五脏百病", "养精神", "杀精魁邪恶鬼", "能化为汞"], once: ["丹沙", "一名真朱", "生山谷", "采无时"], absent: [], peakVolume: null },
  { id: "ChangpuFirstFilm", cn: "菖蒲", img: "acorus-changpu.jpg", credits: ["PUBLIC DOMAIN"], music: "yuzhou-changwan.mp3", flavor: "味辛，温。", volume: "卷一 · 上经", division: "上经 · 草部", phrases: ["主风寒湿痹", "开心孔", "出声音", "五月十二日采根"], once: ["菖蒲", "一名昌阳", "生池泽"], absent: [], peakVolume: null },
  { id: "JuhuaFirstFilm", cn: "鞠华", img: "chrysanthemum-juhua.jpg", credits: ["CC BY 2.0", "JAMES ST. JOHN"], music: "yuzhou-changwan.mp3", flavor: "味苦，平。", volume: "卷一 · 上经", division: "上经 · 草部", phrases: ["头眩肿痛", "目欲脱", "恶风湿痹"], once: ["鞠华", "一名节华", "生川泽及田野", "九月采花"], absent: [], peakVolume: null },
  { id: "TianmendongFirstFilm", cn: "天门冬", img: "asparagus-tianmendong.jpg", credits: ["CC BY 4.0", "M108T"], music: "yuzhou-changwan.mp3", flavor: "味苦，平。", volume: "卷一 · 上经", division: "上经 · 草部", phrases: ["诸暴风湿偏痹", "强骨髓", "杀三虫", "地门冬"], once: ["天门冬", "一名颠勒", "生山谷", "八月采根"], absent: [], peakVolume: null },
  { id: "GandihuangFirstFilm", cn: "干地黄", img: "rehmannia-dihuang.jpg", credits: ["PUBLIC DOMAIN", "RMNH.ART.686"], music: "yuzhou-changwan.mp3", flavor: "味甘，寒。", volume: "卷一 · 上经", division: "上经 · 草部", phrases: ["折跌绝筋", "逐血痹", "填骨髓", "生者尤良"], once: ["干地黄", "一名地髓", "生川泽", "二月八日采根", "生咸阳、黄土地者，佳"], absent: [], peakVolume: null },
  { id: "ShuFirstFilm", cn: "术", img: "atractylodes-shu.jpg", credits: ["CC BY 4.0", "REPINA TATYANA"], music: "gaoshan-liushui.mp3", flavor: "味苦，温。", volume: "卷一 · 上经", division: "上经 · 草部", phrases: ["风寒湿痹", "死肌", "痉、疸", "作煎饵"], once: ["术", "一名山蓟", "生山谷", "八月、九月采根", "长服山精"], absent: [], peakVolume: null },
  { id: "TusiziFirstFilm", cn: "菟丝子", img: "cuscuta-tusizi.jpg", credits: ["PUBLIC DOMAIN"], music: "yuzhou-changwan.mp3", flavor: "味辛，平。", volume: "卷一 · 上经", division: "上经 · 草部", phrases: ["续绝伤", "益气力", "肥健", "汁去面"], once: ["菟丝子", "一名菟芦", "生川泽", "九月采实", "上有菟丝"], absent: [], peakVolume: null },
  { id: "NiuxiFirstFilm", cn: "牛膝", img: "achyranthes-niuxi.jpg", credits: ["CC BY 4.0", "HARSHNAUHWAR"], music: "gaoshan-liushui.mp3", flavor: "味苦，酸。", volume: "卷一 · 上经", division: "上经 · 草部", phrases: ["寒湿痿痹", "膝痛不可屈伸", "堕胎"], once: ["牛膝", "一名百倍", "生川谷", "二月、八月、十月采根", "其茎有节，似膝"], absent: [], peakVolume: null },
  { id: "ChongweiziFirstFilm", cn: "充蔚子", img: "leonurus-chongweizi.jpg", credits: ["PUBLIC DOMAIN", "BLANCO"], music: "yuzhou-changwan.mp3", flavor: "味辛，微温。", volume: "卷一 · 上经", division: "上经 · 草部", phrases: ["明目益精", "除水气", "瘾疹痒"], once: ["充蔚子", "一名益母", "生池泽", "五月采", "一名贞蔚"], absent: [], peakVolume: null },
  { id: "NvweiFirstFilm", cn: "女萎", img: "polygonatum-nvwei.jpg", credits: ["CC BY 4.0", "FLOCCI NIVIS"], music: "gaoshan-liushui.mp3", flavor: "味甘，平。", volume: "卷一 · 上经", division: "上经 · 草部", phrases: ["中风暴热", "不能动摇", "跌筋结肉", "去面黑"], once: ["女萎", "一名葳蕤", "生山谷", "立春后采", "一名玉竹"], absent: [], peakVolume: null },
  { id: "FangkuiFirstFilm", cn: "防葵", img: "peucedanum-fangkui.jpg", credits: ["CC BY 4.0", "M108T"], music: "yuzhou-changwan.mp3", flavor: "味辛，寒。", volume: "卷一 · 上经", division: "上经 · 草部", phrases: ["疝瘕肠泄", "膀胱热结", "惊邪狂走", "坚骨髓"], once: ["防葵", "一名梨盖", "生川谷", "三月三日采根", "与野狼毒相似"], absent: [], peakVolume: null },
  { id: "MaimendongFirstFilm", cn: "麦门冬", img: "ophiopogon-maidong.jpg", credits: ["CC0", "SHABICHT"], music: "gaoshan-liushui.mp3", flavor: "味甘，平。", volume: "卷一 · 上经", division: "上经 · 草部", phrases: ["心腹结气", "伤中、伤饱", "胃络脉绝", "羸瘦短气"], once: ["麦门冬", "一名不死药", "生川谷及堤阪", "二月、三月、八月、十月采", "实如青珠"], absent: [], peakVolume: null },
];

for (const h of shangjingContinuation) {
  test(`the ${h.cn} film keeps each source phrase in one scene`, () => {
    const kebab = h.id.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
    const url = new URL(`../src/finished/${kebab}.tsx`, import.meta.url);
    assert.equal(fs.existsSync(url), true);
    const source = fs.readFileSync(url, "utf8");
    assert.equal(compositionSource.includes(`id="${h.id}"`), true);
    assert.equal(source.includes("durationInFrames={360}"), true);
    assert.equal(source.includes('<Seal text="药"'), true);
    assert.equal(source.includes("《神农本草经》"), true);
    if (h.volume) {
      assert.equal(source.includes(h.volume), true);
    }
    if (h.division) {
      assert.equal(source.includes(h.division), true);
    }
    assert.equal(source.includes(h.flavor), true);
    for (const p of h.phrases) {
      assert.equal(source.includes(p), true);
    }
    for (const o of h.once) {
      assert.equal(countOccurrences(source, o), 1);
    }
    for (const a of h.absent) {
      assert.equal(source.includes(a), false);
    }
    assert.equal(source.includes("今译"), true);
    assert.equal(source.includes("MODERN READING"), true);
    assert.equal(source.includes(`staticFile("images/${h.img}")`), true);
    assert.equal(fs.existsSync(new URL(`../public/images/${h.img}`, import.meta.url)), true);
    for (const c of h.credits) {
      assert.equal(source.includes(c), true);
    }
    assert.equal(source.includes(`staticFile("music/${h.music}")`), true);
    if (h.peakVolume) {
      assert.equal(source.includes(`peakVolume={${h.peakVolume}}`), true);
    } else {
      assert.equal(source.includes("peakVolume"), false);
    }
  });
}

const finishedDirUrl = new URL("../src/finished/", import.meta.url);
const finishedFiles = fs.readdirSync(finishedDirUrl).filter((f) => f.endsWith(".tsx")).sort();
// Grandfathered on-screen violations in two first-generation films: they show
// a workflow-order label the skill now forbids for new films. The videos stay
// untouched; only new films are held to the rule.
const legacyWorkflowOrderFilms = new Set(["angelica-fourth-film.tsx", "bupleurum-third-film.tsx"]);
// First-generation films with a summary instead of a clause-by-clause translation.
const legacySummaryFilms = new Set([
  "ginseng-first-film.tsx",
  "licorice-second-film.tsx",
  "peony-second-film.tsx",
  "angelica-fourth-film-real-photo.tsx",
]);

test("no finished film carries code-drawn illustrations, css backgrounds, or workflow-order labels", () => {
  assert.ok(finishedFiles.length > 0, "no finished films found");
  for (const f of finishedFiles) {
    const source = fs.readFileSync(new URL(f, finishedDirUrl), "utf8");
    assert.equal(source.includes("<svg"), false, f);
    assert.equal(source.includes("RootIllustration"), false, f);
    assert.equal(source.includes("backgroundImage"), false, f);
    // HerbalVisuals holds the legacy templates; SKILL.md says a finished film must
    // not be built on them.
    assert.equal(source.includes('from "../HerbalVisuals"'), false, f);
    if (!legacyWorkflowOrderFilms.has(f)) {
      assert.equal(source.includes("阅读顺序"), false, f);
      assert.equal(source.includes("ENTRY 0"), false, f);
    }
  }
});

test("every finished film shows the seal, disclaimer, and sign (except the photo wrapper)", () => {
  for (const f of finishedFiles) {
    if (f === "angelica-fourth-film-real-photo.tsx") {
      continue;
    }
    const source = fs.readFileSync(new URL(f, finishedDirUrl), "utf8");
    assert.equal(source.includes('<Seal text="药"'), true, f);
    assert.equal(source.includes("古籍内容展示，不构成诊疗建议"), true, f);
    assert.equal(source.includes('staticFile("sign-1.png")'), true, f);
  }
});

test("every current-format film carries a clause-by-clause modern translation", () => {
  for (const f of finishedFiles) {
    if (legacySummaryFilms.has(f)) {
      continue;
    }
    const source = fs.readFileSync(new URL(f, finishedDirUrl), "utf8");
    assert.equal(source.includes("今译"), true, f);
    assert.equal(source.includes("MODERN READING"), true, f);
  }
});

test("every image and music file referenced by a finished film exists on disk", () => {
  const images = new Set<string>();
  const tracks = new Set<string>();
  for (const f of finishedFiles) {
    const source = fs.readFileSync(new URL(f, finishedDirUrl), "utf8");
    for (const m of source.matchAll(/staticFile\("images\/([^"]+)"\)/g)) {
      images.add(m[1]);
    }
    for (const m of source.matchAll(/staticFile\("music\/([^"]+)"\)/g)) {
      tracks.add(m[1]);
    }
  }
  assert.ok(images.size > 0, "no photo is referenced by any film");
  for (const img of images) {
    assert.equal(fs.existsSync(new URL(`../public/images/${img}`, import.meta.url)), true, img);
  }
  for (const track of tracks) {
    assert.equal(fs.existsSync(new URL(`../public/music/${track}`, import.meta.url)), true, track);
  }
});

test("each finished film's duration matches its Composition registration", () => {
  const registered = new Map(
    [...compositionSource.matchAll(/<Composition\s+id="(\w+)"\s+component=\{\w+\}\s+durationInFrames=\{(\d+)\}/g)].map(
      (m) => [m[1], m[2]] as const,
    ),
  );
  for (const f of finishedFiles) {
    // The photo wrapper renders the base film and inherits its duration;
    // see scripts/generate-compositions.mjs.
    if (f === "angelica-fourth-film-real-photo.tsx") {
      continue;
    }
    const source = fs.readFileSync(new URL(f, finishedDirUrl), "utf8");
    const component = source.match(/export const (\w*(?:Film|Photo))\b/)?.[1];
    const duration = source.match(/durationInFrames=\{(\d+)\}/)?.[1];
    if (!component || !duration) {
      assert.fail(f);
    }
    assert.equal(registered.get(component), duration, f);
  }
});

test("every film image is registered in the credits ledger with its on-screen author and license", () => {
  const imagesDir = new URL("../public/images/", import.meta.url);
  // Derived, not a hard-coded count: the ledger must cover exactly the image files
  // on disk, so adding a photo never means editing this test.
  const onDisk = fs
    .readdirSync(imagesDir)
    .filter((f) => f !== "credits.json")
    .sort();
  const ledger = JSON.parse(
    fs.readFileSync(new URL("credits.json", imagesDir), "utf8"),
  ) as { file: string; subject: string | null; author: string | null; license: string }[];
  assert.deepEqual(
    ledger.map((e) => e.file).sort(),
    onDisk,
    "credits.json must cover exactly the images in public/images",
  );
  const byFile = new Map(ledger.map((e) => [e.file, e]));
  const referenced = new Set<string>();
  for (const f of finishedFiles) {
    const source = fs.readFileSync(new URL(f, finishedDirUrl), "utf8");
    for (const m of source.matchAll(/staticFile\("images\/([^"]+)"\)/g)) {
      referenced.add(m[1]);
      const entry = byFile.get(m[1]);
      assert.ok(entry, `${f}: ${m[1]} missing from credits.json`);
      assert.ok(entry.license.length > 0, m[1]);
      assert.ok(source.includes(entry.license), `${f} missing license ${entry.license}`);
      if (entry.author) {
        assert.ok(source.includes(entry.author), `${f} missing author ${entry.author}`);
      }
    }
  }
  for (const entry of ledger) {
    assert.equal(fs.existsSync(new URL(`../public/images/${entry.file}`, import.meta.url)), true, entry.file);
    assert.ok(referenced.has(entry.file), `${entry.file} orphaned in credits.json`);
  }
});

test("progress.json tracks every finished film in original book order", () => {
  const progress = JSON.parse(fs.readFileSync(new URL("../progress.json", import.meta.url), "utf8")) as {
    book: string;
    source: string;
    entries: { name: string; volume: string; status: string; film?: string; occurrence?: number }[];
  };
  assert.equal(progress.book, "神农本草经");
  const keys = progress.entries.map((e) => e.name + (e.occurrence ? `#${e.occurrence}` : ""));
  assert.equal(new Set(keys).size, keys.length);
  const done = progress.entries.filter((e) => e.status === "done");
  assert.equal(new Set(done.map((e) => String(e.film))).size, done.length);
  const finished = fs
    .readdirSync(finishedDirUrl)
    .filter((f) => f.endsWith(".tsx") && f !== "angelica-fourth-film-real-photo.tsx");
  for (const f of finished) {
    const comp = f
      .replace(/\.tsx$/, "")
      .split("-")
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join("");
    assert.ok(done.some((e) => e.film === comp), `${f} missing from progress.json`);
  }
  for (const e of progress.entries) {
    if (e.status === "done") {
      const kebab = String(e.film)
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .toLowerCase();
      assert.equal(fs.existsSync(new URL(`../src/finished/${kebab}.tsx`, import.meta.url)), true, e.name);
      assert.equal(compositionSource.includes(`id="${e.film}"`), true, e.name);
    } else {
      assert.ok(e.status === "todo" || e.status === "skipped", e.name);
    }
  }
  const next = progress.entries.find((e) => e.status === "todo");
  assert.ok(next, "no todo entry left");
});

// Banned modern therapeutic verbs, mirrored from SKILL.md § Platform Publishing
// 医疗表述. 主治 survives in 44 legacy films (made before 2026-09) and is
// grandfathered there only; every other word below must appear nowhere, and
// 主治 in no new film and no upload copy.
const bannedTherapeuticWords = [
  "治疗", "改善", "有效", "根治", "特效", "治愈", "秘方", "神效",
  "必备", "包治", "断根", "奇效", "立竿见影", "药到病除",
];
const legacyZhuzhiFilms = new Set(
  "baihao baiqing baishiying baiying baizhi bianqing changpu cheqianzi chizhi chongweizi dansha duhuo ephedra fangkui gandihuang huangqi huashi juhua kongqing longdan maimendong nieshi niuxi nvwei puxiao shihu shizhongru shu shuyu taiyi tianmendong tusizi xiaoshi xixin xizi yanlvzi yiyiren yuanzhi yunmu yuquan yuyuliang zengqing zexie zishiying"
    .split(" ")
    .map((kebab) => `${kebab}-first-film.tsx`),
);

test("no banned therapeutic wording in films or upload copy", () => {
  const withZhuzhi: string[] = [];
  for (const f of finishedFiles) {
    const source = fs.readFileSync(new URL(f, finishedDirUrl), "utf8");
    for (const w of bannedTherapeuticWords) {
      assert.equal(source.includes(w), false, `${f}: ${w}`);
    }
    if (source.includes("主治")) {
      withZhuzhi.push(f);
    }
  }
  assert.deepEqual(withZhuzhi.sort(), [...legacyZhuzhiFilms].sort());
  const uploadDir = new URL("../upload/", import.meta.url);
  if (fs.existsSync(uploadDir)) {
    for (const f of fs.readdirSync(uploadDir).filter((f) => f.endsWith(".md") && !f.startsWith("_"))) {
      const copy = fs.readFileSync(new URL(f, uploadDir), "utf8");
      assert.equal(copy.includes("主治"), false, `upload/${f}`);
      for (const w of bannedTherapeuticWords) {
        assert.equal(copy.includes(w), false, `upload/${f}: ${w}`);
      }
    }
  }
});
