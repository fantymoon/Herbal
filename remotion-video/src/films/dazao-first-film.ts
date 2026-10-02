import type { FilmContent } from "../layout";

// 大枣 — 神农本草经 卷一 · 上经
// Source: TCM-Ancient-Books-master/000-神农本草经.txt (原文照录，不要改动 original 字段)
//
// 底本此处作「肋十二经」，《证类本草》作「助十二经」。全库 53 处作「助」，只有 2 处作
// 「肋」，且都出自同一条辑本谱系——这是形近而讹，不是异体字：「肋」在这句里没有意义。
// 今从证类。
//
// 「叶覆麻黄，能令出汗」讲的是枣叶，不是枣实。底本把它并入经文，《证类本草》另立「叶」条。
// 照录底本，在注释里点明它说的是叶。
export const content: FilmContent = {
  id: "DazaoFirstFilm",
  entry: "大枣",
  latin: "DA ZAO",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷一 · 上经",
  division: "上经 · 果部",
  flavor: "味甘，平。",
  alias: null,
  original:
    "主心腹邪气，安中养脾，助十二经，平胃气，通九窍，补少气、少津液、身中不足，大惊，四肢重，和百药。久服，轻身、长年。叶覆麻黄，能令出汗。生平泽。",
  translation:
    "古籍称其主心腹邪气，指胸腹间的病邪；安中养脾，指安定中焦、滋养脾气；助十二经，指辅助十二经脉；平胃气，指使胃气平和；通九窍，指使九窍通畅；补少气、少津液、身中不足，指补益气虚、津液亏少与身体虚损；大惊、四肢重，指易惊、四肢沉重；和百药，指调和诸药。久服，指长期服食，身体轻健、寿命延长。叶覆麻黄，指枣叶与麻黄同用能使人出汗。生平泽，指生长在平坦的沼泽地带。",
  commentary:
    "「心腹邪气」是汉代对胸腹病邪的称法。「九窍」指耳目口鼻与前后二阴。「和百药」为方书用语。「叶覆麻黄，能令出汗」说的是枣叶，不是枣实。底本作「肋十二经」，《证类本草》作「助十二经」，形近而讹，今从证类。",
  historicalNote: "此为汉代认知，未经现代科学证实",
  // 本批唯一一部需要声明时长的片。经文 76 字、12 句，是其余五部的 1.5–2 倍，逐句今译后
  // 古典屏共 336 字；720 帧下中段两屏需 21.5 与 29.0 字/秒，超出 15 字/秒上限。逐句今译与
  // 注释都是安全规则，没有删句的余地，所以动的是预算这一侧。
  deviations: [
    {
      rule: "duration",
      why: "经文 76 字、12 句，逐句今译后古典屏共 336 字；720 帧下中段两屏需 21.5 与 29.0 字/秒，超出 15 字/秒上限。删句等于改字，故声明 900 帧（30 秒）。",
    },
  ],
  facts: [
    { label: "产地", value: "平泽" },
    { label: "别称", value: "干枣" },
    { label: "部类", value: "果部" },
  ],
  photo: {
    file: "dazao-ziziphus.jpg",
    subject: "ZIZIPHUS JUJUBA",
    author: "MARÍA REGINA SILVA",
    license: "CC BY",
  },
  music: "music/yuzhou-changwan.mp3",
  accent: "#9a3f2f",
  mode: "single-herb",
};
