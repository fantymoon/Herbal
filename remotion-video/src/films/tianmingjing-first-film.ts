import type { FilmContent } from "../layout";

// 天名精 — 神农本草经 卷一 · 上经
// Source: TCM-Ancient-Books-master/000-神农本草经.txt (原文照录，不要改动 original 字段)
//
// 「一名」三句归 alias / facts，「生川泽」归 facts。容量：经文 53 字，roomy。
//
// 钩子取名字：这一条在《本经》里留了三个互不相干的别名——麦句姜、虾蟆蓝、豕首，
// 名字本身就成了本片的问题。三个名字的来由见《证类本草》引苏恭、陶弘景的注：
// 味甘辛故有姜称、蛤蟆好居其下故名蛤蟆蓝、其气如豕彘故有豕首之名。
// 本片不上功效方向，只讲名物。
//
// reading: "copy"（短形态，今译与注释进描述）。
// 曲目用 kongyin-gujian（箜篌，清冷），避开相邻几部已用尽的 yuzhou-changwan。
export const content: FilmContent = {
  id: "TianmingjingFirstFilm",
  entry: "天名精",
  latin: "TIAN MING JING",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷一 · 上经",
  division: "上经 · 草部",
  flavor: "味甘，寒。",
  alias: "一名麦句姜",
  hook: "一条药，经文里记着三个别名",
  reading: "copy",
  original: "主瘀血、血瘕欲死、下血。止血，利小便。久服轻身、耐老。一名麦句姜，一名虾蟆蓝，一名豕首。生川泽。",
  translation:
    "古籍称其主瘀血，指体内积存的血；血瘕欲死，指血结成块、病重到近于死；下血，指血从下出。止血，指止住出血；利小便，指使小便通利。久服轻身、耐老，指长期服食则身体轻健、不易衰老。一名麦句姜，一名虾蟆蓝，一名豕首，是它三个别名的记法。生川泽，指它生在平川水泽。",
  commentary:
    "这条经文最后三句是三个别名，每一个都另有来由。麦句姜：唐《新修本草》注说它味甘辛，所以有姜的称呼。虾蟆蓝：它的样子像蓝草，而蛤蟆喜欢待在它下面，所以叫蛤蟆蓝。豕首：《尔雅》释「豕首」为草名，宋《证类本草》引陶弘景的说法，是它的气味像猪，所以有豕首、彘颅这类名字。明《本草纲目》另记一个名字「活鹿草」，出自刘宋元嘉年间射鹿的故事；李时珍又指出，「天名精」其实是「天蔓荆」的音转。此三名为汉代及后世注家对同一株草的称法，与它的药用无关。",
  historicalNote: "此为汉代古籍的名物记载，未经现代科学证实",
  facts: [
    { label: "产地", value: "川泽" },
    { label: "别名", value: "麦句姜 · 虾蟆蓝 · 豕首" },
    { label: "篇目位置", value: "卷一 · 上经" },
  ],
  photo: {
    file: "tianmingjing-carpesium.jpg",
    subject: "CARPESIUM ABROTANOIDES",
    author: "MAMI_T_T",
    license: "CC BY",
  },
  music: "music/kongyin-gujian.mp3",
  accent: "#6b7a3a",
  mode: "single-herb",
};
