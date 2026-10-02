import type { FilmContent } from "../layout";

// 龙眼 — 神农本草经 卷二 · 中经
// Source: TCM-Ancient-Books-master/000-神农本草经.txt (原文照录，不要改动 original 字段)
//
// 「安志厌食」的「厌」读平声，义为饱足，不是「厌弃」——「厌食」在这里是「饱食」，不是
// 「不欲饮食」。《本草经解》附余·考证·龙眼直接给了这个训释：「本草主治云。安志厌食。
// 厌平声。饱也。纲目称其开胃益脾。补虚长智。即安志厌食之谓也。」
//
// 曾经写反过。当时的理由是「全库 79 处『厌食』都作『恶心厌食』『胃呆厌食』」——那 79 处
// 全是后世本草与医案的用法，说的不是这一句。**后世语料不能替本条作证**：它证明的是
// 「厌食」这个词后来怎么用，而不是《神农本草经》这一行里「厌」读什么。手边有一个大规模、
// 好检索、且方向一致的证据，恰恰是绕过那条唯一直接证据的最舒服的方式。
export const content: FilmContent = {
  id: "LongyanFirstFilm",
  entry: "龙眼",
  latin: "LONG YAN",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷二 · 中经",
  division: "中经 · 木部",
  flavor: "味甘，平。",
  alias: "一名益智",
  original:
    "主五脏邪气，安志厌食。久服，强魂、聪明、轻身、不老，通神明。一名益智。生山谷。",
  translation:
    "古籍称其主五脏邪气，指五脏的病邪；安志厌食，指安定神志、令人饱食。久服，指长期服食，能强健魂魄、使耳目聪明、身体轻健、不衰老，通于神明。又名益智。生于山谷。",
  commentary:
    "「安志」指安定神志。「厌食」的「厌」读平声，义为饱足，故「安志厌食」是安定神志、令人饱食；《本草经解》引《本草纲目》「开胃益脾、补虚长智」正是此意，不是「不欲饮食」。「强魂」的「魂」指精神。「通神明」是汉代方术语汇，指神志通达，不是宗教语义。《广雅》以益智为龙眼，故「一名益智」；《名医》记其大者似槟榔，生南海松树上。",
  historicalNote: "此为汉代认知，未经现代科学证实",
  facts: [
    { label: "产地", value: "山谷" },
    { label: "别名", value: "益智" },
    { label: "部类", value: "木部" },
  ],
  photo: {
    file: "longyan-dimocarpus.jpg",
    subject: "DIMOCARPUS LONGAN",
    author: "葉子",
    license: "CC0",
  },
  music: "music/gaoshan-liushui.mp3",
  accent: "#7a5a2e",
  mode: "single-herb",
};
