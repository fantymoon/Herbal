import type { FilmContent } from "../layout";

// 决明子 — 神农本草经 卷一 · 上经
// Source: TCM-Ancient-Books-master/000-神农本草经.txt (原文照录，不要改动 original 字段)
//
// 底本在「益精光」下夹了一条孙星衍的校注（《太平御览》引作理目珠精，理，即治字），
// 再往下才是「轻身」。校注是清人文字，不是经文，上屏只留经文本身；删掉括号后
// 前后两句仍然连读。「味咸，平。」拆到首屏味栏。
//
// 别称取自《吴普》在本条下的记载（一名草决明，一名羊明），注释里点明。
export const content: FilmContent = {
  id: "JuemingziFirstFilm",
  entry: "决明子",
  latin: "JUE MING ZI",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷一 · 上经",
  division: "上经 · 草部",
  flavor: "味咸，平。",
  alias: null,
  original: "主青盲、目淫、肤赤、白膜、眼赤痛、泪出。久服，益精光，轻身。生川泽。",
  translation:
    "古籍称其主青盲，指目外观如常而视物不见；目淫，指目中泪出不止；肤赤，指皮肤发红；白膜，指眼内所生白翳；眼赤痛、泪出，指眼红疼痛而流泪。久服，指长期服食，能增益目之精光，使身体轻健。生于川泽。",
  commentary:
    "「青盲」是汉代病名，指目外观如常而视物不见。「目淫」指目泪不止。「白膜」指眼内所生白翳。「精光」指目之精与光。《吴普》另记其一名草决明、一名羊明。本经以目病为决明子的主症。",
  historicalNote: "此为汉代认知，未经现代科学证实",
  facts: [
    { label: "产地", value: "川泽" },
    { label: "别称", value: "草决明" },
    { label: "部类", value: "草部" },
  ],
  photo: {
    file: "senna-tora-juemingzi.jpg",
    subject: "SENNA TORA",
    author: "ROBERT H. WARDELL",
    license: "CC0",
  },
  music: "music/gaoshan-liushui.mp3",
  accent: "#5c6b3a",
  mode: "single-herb",
};
