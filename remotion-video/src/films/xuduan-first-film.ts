import type { FilmContent } from "../layout";

// 续断 — 神农本草经 卷一 · 上经
// Source: TCM-Ancient-Books-master/000-神农本草经.txt (原文照录，不要改动 original 字段)
//
// 「一名龙豆，一名属折」归 alias，「生山」归 facts，都不进 original。
//
// 钩子取名字本身：《本草纲目》「时珍曰∶续断、属折、接骨，皆以功命名也」——底本的两个名字
// 说的都是同一件事，「接骨」是后世《别录》的名字。这是关于命名的话，不是功效声明，
// 但为稳妥，屏幕上只呈现「按用处起名」这一层，具体的病证留在描述里。
//
// 「生山」照录。底本只有两个字，《别录》作「生常山山谷」，出入写在注释里。
//
// reading: "copy" —— 今译与注释进视频描述。
export const content: FilmContent = {
  id: "XuduanFirstFilm",
  entry: "续断",
  latin: "XU DUAN",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷一 · 上经",
  division: "上经 · 草部",
  flavor: "味苦，微温。",
  alias: "一名龙豆，一名属折",
  hook: "续断、属折，都按用处起名",
  reading: "copy",
  original: "主伤寒，补不足，金创痈伤，折跌，续筋骨，妇人乳难。久服，益气力。",
  translation:
    "古籍称其主伤寒，指外感伤寒一类的病；补不足，指补益虚损；金创痈伤，指金属器物所伤与疮痈；折跌，指跌打损伤；续筋骨，指接续筋骨；妇人乳难，指妇人乳汁不下或难产的古说。久食，指长期服食，增益气力。",
  commentary:
    "「金创」指金属器物所伤，「折跌」指跌打损伤。名字是按用处起的：《本草纲目》说「续断、属折、接骨，皆以功命名也」——底本的两个名字「续断」与「属折」、以及后世《别录》的「接骨」，说的是同一件事。产地底本只作「生山」，《别录》作「生常山山谷」，七月、八月采，阴干。",
  historicalNote: "此为汉代认知，未经现代科学证实",
  facts: [
    { label: "产地", value: "山" },
    { label: "别名", value: "属折" },
  ],
  photo: {
    file: "xuduan-dipsacus.jpg",
    subject: "DIPSACUS ASPER",
    author: "WANG.QG",
    license: "CC BY",
  },
  music: "music/yuzhou-changwan.mp3",
  accent: "#7d5f45",
  mode: "single-herb",
};
