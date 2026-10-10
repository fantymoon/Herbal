import type { FilmContent } from "../layout";

// 百合 — 神农本草经 卷二 · 中经
// Source: TCM-Ancient-Books-master/000-神农本草经.txt (原文照录)
//
// 钩子取「腹张」：底本作「腹张」，今本多作「腹胀」——「张」与「胀」通假，是
// 汉代的写法，不是错字。这条经文没有别名（「一名…」），也没有生境之外的细节，
// 一条 28 字的经文，写得相当克制。
//
// reading: "copy"。
export const content: FilmContent = {
  id: "BaiheFirstFilm",
  entry: "百合",
  latin: "BAI HE",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷二 · 中经",
  division: "中经 · 草部",
  flavor: "味甘，平。",
  alias: null,
  hook: "古书写「腹张」不是错字",
  reading: "copy",
  original: "主邪气腹张，心痛，利大小便，补中益气。生川谷。",
  translation:
    "古籍称其主邪气腹张，「腹张」即腹胀，指腹部胀满；心痛，指心下痛；利大小便，指通利大小便；补中益气，指补益中焦、增益气力。生于川谷。",
  commentary:
    "「腹张」是「腹胀」的汉代写法，「张」与「胀」通假——全库《神农本草经》本条作「腹张」，《证类本草》等后世辑本多作「腹胀」，意思一致。一条 28 字的经文，没有别名（「一名…」），也没有生境之外的细节，写得相当克制。",
  historicalNote: "此为汉代认知，未经现代科学证实",
  facts: [
    { label: "产地", value: "川谷" },
    { label: "篇目位置", value: "卷二 · 中经" },
  ],
  photo: {
    file: "lilium-brownii-baihe.jpg",
    subject: "LILIUM BROWNII",
    author: "PORTIOID",
    license: "CC BY",
  },
  music: "music/kongyin-gujian.mp3",
  accent: "#b07a3a",
  mode: "single-herb",
};
