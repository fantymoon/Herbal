import type { FilmContent } from "../layout";

// 白棘 — 神农本草经 卷二 · 中经
// Source: TCM-Ancient-Books-master/000-神农本草经.txt (原文照录，不要改动 original 字段)
//
// TODO while this film is a draft:
//   Until these are filled in, the film is a draft: `npm run check` reports it,
//   `npm run gen` does not register it, and `npm run verify` refuses to render it.
//   1. translation — 逐句今译；功效句必须以「古籍称其主……」开头
//   2. commentary  — 注释：古病名、字义、底本差异等（不得写成疗效说明）
//   3. photo       — 真实授权图片，ASCII 文件名，并登记到 public/images/credits.json
export const content: FilmContent = {
  id: "BaijiFirstFilm",
  entry: "白棘",
  latin: "BAI JI",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷二 · 中经",
  division: null, // TODO 部类，如 "上经 · 草部"；不需要就保持 null
  flavor: "味辛，寒。",
  alias: "一名棘针",
  original: "主心腹痛，痈肿渍脓，止痛。一名棘针。生川谷。",
  translation: "TODO 逐句今译",
  commentary: "TODO 注释",
  historicalNote: "此为汉代认知，未经现代科学证实",
  facts: [
    { label: "别名", value: "棘针" },
    { label: "产地", value: "川谷" },
    { label: "篇目位置", value: "卷二 · 中经" },
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
