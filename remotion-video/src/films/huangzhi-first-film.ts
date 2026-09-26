import type { FilmContent } from "../layout";

// 黄芝 — 神农本草经 卷一 · 上经
// Source: TCM-Ancient-Books-master/000-神农本草经.txt (原文照录，不要改动 original 字段)
//
// 六芝之一。本条的正文只有四句，篇幅撑不满一屏，所以片尾的三个事实（产地、类属、
// 色泽）取的是紫芝条下所引《名医》与《抱朴子》——那一处才是六芝的产地与色泽所在，
// 注释里点明出处。正文本身未增一字。
export const content: FilmContent = {
  id: "HuangzhiFirstFilm",
  entry: "黄芝",
  latin: "HUANG ZHI",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷一 · 上经",
  division: "上经 · 草部",
  flavor: "味甘，平。",
  alias: "一名金芝",
  original: "主心腹五邪，益脾气，安神，忠信和乐。久食，轻身、不老、延年、神仙。",
  translation:
    "古籍称其主心腹间的五种邪气；益脾气，安神，使人忠信和乐。久食，指长期服食，身轻、不老、延年，终至神仙。",
  commentary:
    "「五邪」为古病名，所指不一，此处按原文用字保留。「神仙」是汉代方术用语，指长生久视，非现代语义。「忠信和乐」以德行言药，在《本经》中罕见。六芝的产地与色泽，见《名医》《抱朴子》。",
  historicalNote: "此为汉代认知，未经现代科学证实",
  // 别名「金芝」与部类「上经 · 草部」已经出现在首屏，片尾不重复；这里放的是首屏
  // 没有的三件事——产地、类属、色泽。它们出自紫芝条下所引《名医》《抱朴子》，
  // 注释里已点明出处。
  facts: [
    { label: "产地", value: "嵩山" },
    { label: "类属", value: "六芝之一" },
    { label: "色泽", value: "如紫金" },
  ],
  photo: {
    file: "ganoderma-huangzhi.jpg",
    subject: "GANODERMA CURTISII",
    author: "KORBLA JOHNNY",
    license: "CC BY-SA 4.0",
  },
  music: "music/yuzhou-changwan.mp3",
  accent: "#a8812f",
  mode: "single-herb",
};
