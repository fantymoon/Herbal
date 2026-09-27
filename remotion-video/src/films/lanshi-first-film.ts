import type { FilmContent } from "../layout";

// 蓝实 — 神农本草经 卷一 · 上经
// Source: TCM-Ancient-Books-master/000-神农本草经.txt (原文照录，不要改动 original 字段)
//
// 「味苦，寒。」拆到首屏味栏，正文从「主……」起。原文里的「杀蛊 、注鬼」有一处
// 换行留下的空格，属于版式产物，不是文本，落字时去掉。
//
// 片尾事实出自《名医》在蓝实条下的记载：「其茎叶可以染青，生河内」——染青是蓝最
// 有据可查的用途，也是这一条里唯一不涉及疗效的事实。
export const content: FilmContent = {
  id: "LanshiFirstFilm",
  entry: "蓝实",
  latin: "LAN SHI",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷一 · 上经",
  division: "上经 · 草部",
  flavor: "味苦，寒。",
  alias: null,
  original: "主解诸毒，杀蛊、注鬼、螫毒。久服，头不白、轻身。生平泽。",
  translation:
    "古籍称其主解各种毒，能杀蛊、注鬼、螫毒。久服，指长期服食，头发不白、身体轻健。生于池泽。",
  commentary:
    "「蛊」「注鬼」是汉代对一类病症的称法，与鬼神观念相连，不是可与现代病名对照的概念。「螫毒」指虫蛇螫咬之毒。《名医》记蓝的茎叶可以染青，出河内。",
  historicalNote: "此为汉代认知，未经现代科学证实",
  facts: [
    { label: "产地", value: "河内" },
    { label: "用途", value: "茎叶染青" },
    { label: "类属", value: "染青草" },
  ],
  photo: {
    file: "persicaria-lanshi.jpg",
    subject: "PERSICARIA TINCTORIA",
    author: "DANIEL ATHA",
    license: "CC0",
  },
  music: "music/yuzhou-changwan.mp3",
  accent: "#2f5d7c",
  mode: "single-herb",
};
