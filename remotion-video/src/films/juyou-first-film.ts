import type { FilmContent } from "../layout";

// 橘柚 — 神农本草经 卷一 · 上经
// Source: TCM-Ancient-Books-master/000-神农本草经.txt (原文照录，不要改动 original 字段)
//
// 底本正文末尾有孙星衍的校注「（旧在果部，非）」，是清人按语、不是经文，`sutraOf` 已按
// 括号剥掉；同页还有一条「考果部，橘柚当入此」，说明孙氏把本条从果部移入木部，部类因此
// 写作木部。
//
// 配图取柚（Citrus maxima）：本条目兼收橘、柚，而 iNaturalist 上「Citrus reticulata」
// 这个查询返回的多是杂交种观察（柠檬、酸橙），署名会与条目对不上。署名照实写 CITRUS MAXIMA。
export const content: FilmContent = {
  id: "JuyouFirstFilm",
  entry: "橘柚",
  latin: "JU YOU",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷一 · 上经",
  division: "上经 · 木部",
  flavor: "味辛，温。",
  alias: "一名橘皮",
  original: "主胸中瘕热逆气，利水谷。久服，去臭、下气、通神。一名橘皮。生川谷。",
  translation:
    "古籍称其主胸中瘕热逆气，指胸中结块、发热、气逆上行；利水谷，指通利水谷的运化。久服，指长期服食，能除去臭气、使气下行、通于神明。又名橘皮。生于川谷。",
  commentary:
    "「瘕」是汉代病名，指腹中结块、聚散无常。「去臭」指除去口中或身上的秽气。「通神」是汉代方术语汇，指神志通利，不是宗教语义。本条入药取皮，故称「一名橘皮」。《名医》记其生南山、江南，十月采。",
  historicalNote: "此为汉代认知，未经现代科学证实",
  facts: [
    { label: "产地", value: "川谷" },
    { label: "别名", value: "橘皮" },
    { label: "部类", value: "木部" },
  ],
  photo: {
    file: "juyou-citrus.jpg",
    subject: "CITRUS MAXIMA",
    author: "葉子",
    license: "CC0",
  },
  music: "music/gaoshan-liushui.mp3",
  accent: "#b5711f",
  mode: "single-herb",
};
