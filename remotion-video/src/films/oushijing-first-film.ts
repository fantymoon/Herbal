import type { FilmContent } from "../layout";

// 藕实茎 — 神农本草经 卷一 · 上经
// Source: TCM-Ancient-Books-master/000-神农本草经.txt (原文照录，不要改动 original 字段)
//
// 本条实与茎同条，是「多部位条目」的一种：经文不分述藕实与茎，因为两者共用同一段主治。
// 与桑根白皮那类带「∶」分述的条目不同，这里没有分隔符，所以不涉及 U+2236 的字形风险。
export const content: FilmContent = {
  id: "OushijingFirstFilm",
  entry: "藕实茎",
  latin: "OU SHI JING",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷一 · 上经",
  division: "上经 · 果部",
  flavor: "味甘，平。",
  alias: "一名水芝丹",
  original:
    "主补中养神，益气力，除百疾。久服，轻身、耐老、不饥、延年。一名水芝丹。生池泽。",
  translation:
    "古籍称其主补中养神，指补益中焦、安养神志；益气力，指增益气力；除百疾，指祛除多种疾病。久服，指长期服食，身体轻健、耐老、不饥饿、延长寿命。又名水芝丹。生于池泽。",
  commentary:
    "「补中」指补益中焦脾胃。「养神」的「神」指神志、精神，与后世宗教语义无关。「百疾」是汉代对多种疾病的泛称，不是确数。《名医》记藕一名莲；《说文》以藕为芙蕖之根、莲为其实、茄为其茎。",
  historicalNote: "此为汉代认知，未经现代科学证实",
  facts: [
    { label: "产地", value: "池泽" },
    { label: "别名", value: "水芝丹" },
    { label: "部类", value: "果部" },
  ],
  photo: {
    file: "oushijing-nelumbo.jpg",
    subject: "NELUMBO NUCIFERA",
    author: "NATURELIBRARIAN",
    license: "CC0",
  },
  music: "music/yuzhou-changwan.mp3",
  accent: "#8a6b74",
  mode: "single-herb",
};
