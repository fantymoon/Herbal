import type { FilmContent } from "../layout";

// 葛根 — 神农本草经 卷二 · 中经
// Source: TCM-Ancient-Books-master/000-神农本草经.txt (原文照录，本条经文末
// 「生川谷」采他本读法，详见 commentary 段)。
//
// 钩子取别名：「一名鸡齐根」是它在本经里仅有的别名，「鸡齐」二字读起来像
// 是一道菜，不是药——这条考据留给注释。
//
// reading: "copy"。今译与版本异文说明进视频描述。
export const content: FilmContent = {
  id: "GegenFirstFilm",
  entry: "葛根",
  latin: "GE GEN",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷二 · 中经",
  division: "中经 · 草部",
  flavor: "味甘，平。",
  alias: null,
  hook: "它的别名比药名还怪",
  reading: "copy",
  original:
    "主消渴，身大热，呕吐，诸痹，起阴气，解诸毒，葛谷，主下利十岁以上。一名鸡齐根。生川谷。",
  translation:
    "古籍称其主消渴，指汉代所称的多饮多尿、消瘦之病；身大热，指身体大热；呕吐，指呕吐；诸痹，指各种痹症；起阴气，指升提阴气；解诸毒，指解各种毒。葛谷，指葛的种子，主下利十岁以上，指十年以上的下利。一名鸡齐根。生于川谷。",
  commentary:
    "「消渴」是汉代病名，指多饮多尿、消瘦的病证。「诸痹」泛指各种痹症，「起阴气」指升提阴气，「下利」指泄泻。「葛谷」是葛的种子，与葛根同条而所主不同——「主下利十岁以上」是葛谷条下的那句话，不是葛根的。底本此条作「生种谷」，《本草经集注》《新修本草》《证类本草》并作「生汶山川谷」，「种」当为「川」之形讹，今从他本。一名鸡齐根。",
  historicalNote: "此为汉代认知，未经现代科学证实",
  facts: [
    { label: "别称", value: "鸡齐根" },
    { label: "篇目位置", value: "卷二 · 中经" },
  ],
  photo: {
    file: "pueraria-montana-kudzu.jpg",
    subject: "PUERARIA MONTANA",
    author: "BARB HAUCK-MAH",
    license: "CC0",
  },
  music: "music/guzhen-lvxing.mp3",
  accent: "#a8812f",
  mode: "single-herb",
};
