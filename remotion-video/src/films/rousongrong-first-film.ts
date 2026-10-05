import type { FilmContent } from "../layout";

// 肉松蓉 — 神农本草经 卷一 · 上经
// Source: TCM-Ancient-Books-master/000-神农本草经.txt (原文照录，不要改动 original 字段)
//
// 「生山谷」不进 original：产地归 facts。
//
// 这一条的名字本身就是材料。底本作「肉松蓉」，《吴普》说「一名肉松蓉」，孙星衍案
// 「蓉，即是容字，俗写苁蓉，非正字也」——今天通行的「肉苁蓉」是俗写。
// 《本草纲目》：「时珍曰∶此物补而不峻，故有从容之号。从容，和缓之貌。」名字说的是药性不急。
// 钩子取的就是这一层，避开了「强阴、益精气」那条线的功效方向。
// 陶弘景另记一种旧说「是野马精落地所生，生时似肉」，孙星衍已辨其非，收在注释里。
//
// reading: "copy" —— 今译与注释进视频描述，屏幕只留原文、出处与历史框定。
export const content: FilmContent = {
  id: "RousongrongFirstFilm",
  entry: "肉松蓉",
  latin: "ROU SONG RONG",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷一 · 上经",
  division: "上经 · 草部",
  flavor: "味甘，微温。",
  alias: null,
  hook: "名字的意思是「从容」",
  reading: "copy",
  original:
    "主五劳七伤，补中，除茎中寒热痛，养五脏，强阴，益精气，多子，妇人症瘕。久服，轻身。",
  translation:
    "古籍称其主五劳七伤，指虚劳诸损的古说；补中，指补益中焦；除茎中寒热痛，指解除前阴部的寒热疼痛；养五脏，指滋养五脏；强阴，指使阴分强健；益精气，指增益精气；多子，指使人多子；妇人症瘕，指妇人腹内的结块。久食，指长期服食，身体轻健。",
  commentary:
    "「五劳七伤」是汉代对虚损的概括，「茎」指前阴，「症瘕」指腹内结块。底本作「肉松蓉」：《吴普》说「一名肉松蓉」，孙星衍案「蓉，即是容字，俗写苁蓉，非正字也」——今天通行的「肉苁蓉」是俗写。《本草纲目》说「此物补而不峻，故有从容之号。从容，和缓之貌」，名字说的是药性不急。陶弘景另记一种旧说，说它是「野马精落地所生，生时似肉」，孙星衍已辨其非。",
  historicalNote: "此为汉代认知，未经现代科学证实",
  facts: [
    { label: "产地", value: "山谷" },
    { label: "今名", value: "肉苁蓉" },
  ],
  photo: {
    file: "rousongrong-cistanche.jpg",
    subject: "CISTANCHE DESERTICOLA",
    author: "DUNCAN BROOKS",
    license: "CC BY",
  },
  music: "music/yuzhou-changwan.mp3",
  accent: "#a0623a",
  mode: "single-herb",
};
