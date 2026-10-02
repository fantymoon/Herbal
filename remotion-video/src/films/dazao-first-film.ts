import type { FilmContent } from "../layout";

// 大枣 — 神农本草经 卷一 · 上经
// Source: TCM-Ancient-Books-master/000-神农本草经.txt (原文照录，不要改动 original 字段)
//
// TODO while this film is a draft:
//   Until these are filled in, the film is a draft: `npm run check` reports it,
//   `npm run gen` does not register it, and `npm run verify` refuses to render it.
//   1. translation — 逐句今译；功效句必须以「古籍称其主……」开头
//   2. commentary  — 注释：古病名、字义、底本差异等（不得写成疗效说明）
//   3. photo       — 真实授权图片，ASCII 文件名，并登记到 public/images/credits.json
export const content: FilmContent = {
  id: "DazaoFirstFilm",
  entry: "大枣",
  latin: "DA ZAO",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷一 · 上经",
  division: null, // TODO 部类，如 "上经 · 草部"；不需要就保持 null
  flavor: "味甘，平。",
  alias: null,
  original: "主心腹邪气，安中养脾，肋十二经，平胃气，通九窍，补少气、少津液、身中不足，大惊，四肢重，和百药。久服，轻身、长年。叶覆麻黄，能令出汗。生平泽。",
  translation: "TODO 逐句今译",
  commentary: "TODO 注释",
  historicalNote: "此为汉代认知，未经现代科学证实",
  facts: [
    { label: "篇目位置", value: "卷一 · 上经" },
  ],
  photo: {
    file: "TODO-<ascii-name>.jpg",
    subject: "TODO SPECIES",
    author: "TODO AUTHOR",
    license: "TODO LICENSE",
  },
  music: "music/yuzhou-changwan.mp3",
  accent: "#a8812f",
  mode: "single-herb",
};
