import type { FilmContent } from "../layout";

// 紫芝 — 神农本草经 卷一 · 上经
// Source: TCM-Ancient-Books-master/000-神农本草经.txt (原文照录，不要改动 original 字段)
//
// 六芝之一。经文照录，只把「味甘，温。」拆到首屏的味栏——它在正文里是同一句，
// 但首屏已经单独显示，正文再写一遍就是同一屏上说两次。
//
// 片尾三个事实（产地、类属、色泽）出自《名医》在紫芝条下的记载：「紫芝，生高夏
// 地上，色紫，形如桑」。产地与色泽是本条经文没有的，注释里点明出处。
export const content: FilmContent = {
  id: "ZizhiFirstFilm",
  entry: "紫芝",
  latin: "ZI ZHI",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷一 · 上经",
  division: "上经 · 草部",
  flavor: "味甘，温。",
  // 「一名木芝」已经写在经文里，首屏不再重复一遍。
  alias: null,
  original:
    "主耳聋，利关节，保神，益精气，坚筋骨，好颜色。久服，轻身、不老、延年。一名木芝。生山谷。",
  translation:
    "古籍称其主耳聋，能通利关节，安守神志，增益精气，使筋骨坚实，令人面色美好。久服，指长期服食，身体轻健、不衰老、延长寿命。又名木芝。生于山谷。",
  commentary:
    "「保神」的「神」指神志、精神，与后世宗教语义无关。「好颜色」是汉代养生语汇，指面色润泽，不是美容功效。「轻身、不老、延年」同为方术用语。紫芝是六芝之一，产地与色泽见《名医》所记。",
  historicalNote: "此为汉代认知，未经现代科学证实",
  facts: [
    { label: "产地", value: "高夏" },
    { label: "类属", value: "六芝之一" },
    { label: "色泽", value: "色紫" },
  ],
  photo: {
    file: "ganoderma-zizhi.jpg",
    subject: "GANODERMA LUCIDUM",
    author: "MARKUS KRIEGER",
    license: "CC BY",
  },
  music: "music/gaoshan-liushui.mp3",
  accent: "#7c5a8a",
  mode: "single-herb",
};
