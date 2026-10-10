import type { FilmContent } from "../layout";

// 丹参 — 神农本草经 卷一 · 上经
// Source: TCM-Ancient-Books-master/000-神农本草经.txt (原文照录)
//
// 钩子取别名：底本作「一名却蝉草」。「却蝉」或作「郄蝉」，本作何意已无从对证。
// 后世本草皆称「丹参」，本草经的别名反而成了谜。注释点出「症/癥」通假。
//
// reading: "copy"。
export const content: FilmContent = {
  id: "DanshenFirstFilm",
  entry: "丹参",
  latin: "DAN SHEN",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷一 · 上经",
  division: "上经 · 草部",
  flavor: "味苦，微寒。",
  alias: null,
  hook: "这味药的本名，是「却蝉草」",
  reading: "copy",
  original:
    "主心腹邪气，肠鸣幽幽如走水，寒热积聚；破症除瘕，止烦满，益气。一名却蝉草。生川谷。",
  translation:
    "古籍称其主心腹邪气，指心腹间的病邪之气；肠鸣幽幽如走水，指肠中鸣响如水流过之声；寒热积聚，指寒热之邪结聚；破症除瘕，指破除腹中结块；止烦满，指止住烦闷胀满；益气，指增益气力。一名却蝉草。生于川谷。",
  commentary:
    "「症」与「癥」通假，指腹中结块；「瘕」亦指腹中结块，与「症」相对。一名却蝉草——「却蝉」本作何意，已无其他本子可对证。全库对照：底本作「却蝉草」，后世辑本异文作「蝉蝉草」，两侧均无全库作证。",
  historicalNote: "此为汉代认知，未经现代科学证实",
  facts: [
    { label: "别称", value: "却蝉草" },
    { label: "产地", value: "川谷" },
    { label: "篇目位置", value: "卷一 · 上经" },
  ],
  photo: {
    file: "salvia-miltiorrhiza-danshen.jpg",
    subject: "SALVIA MILTIORRHIZA",
    author: "MARTIN_LIVEZEY",
    license: "CC BY",
  },
  music: "music/yuzhou-changwan.mp3",
  accent: "#7a3a4a",
  mode: "single-herb",
};
