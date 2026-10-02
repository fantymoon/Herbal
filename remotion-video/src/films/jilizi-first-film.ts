import type { FilmContent } from "../layout";

// 蒺藜子 — 神农本草经 卷一 · 上经
// Source: TCM-Ancient-Books-master/000-神农本草经.txt (原文照录，不要改动 original 字段)
//
// 「一名旁通，一名屈人，一名止行，一名豺羽，一名升推」与「生平泽，或道旁」不进 original：
// 别名归 alias，产地归 facts，与黄芝以来的做法一致。五个别名里只有「屈人」「止行」上首屏——
// 它们正是钩子的材料。
//
// 钩子出自《本草纲目》：「时珍曰∶蒺，疾也；藜，利也；茨，刺也。其刺伤人，甚疾而利也。
// 屈人、止行，皆因其伤人也。」《本草经赞》又引陶弘景：「多生道旁及墙头，其叶布地，
// 子有刺状如菱。」两处都收在注释里。
//
// reading: "copy" —— 今译与注释不上屏，进视频描述。这是本系列第一次用短形态（12 秒），
// 理由见 `FilmContent.reading`：24 秒的片子观众只看 7 秒，而密集文字屏正是没人看的那部分。
export const content: FilmContent = {
  id: "JiliziFirstFilm",
  entry: "蒺藜子",
  latin: "JI LI ZI",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷一 · 上经",
  division: "上经 · 草部",
  flavor: "味苦，温。",
  alias: "一名屈人，一名止行",
  hook: "别名「屈人」，因为扎人",
  reading: "copy",
  original: "主恶血，破症结积聚，喉痹，乳难。久服，长肌肉，明目、轻身。",
  translation:
    "古籍称其主恶血，指瘀血；破症结积聚，指消散腹内的结块积聚；喉痹，指咽喉肿痛一类的病；乳难，指乳汁不下或难产的古说。久食，指长期服食，能增长肌肉，目力清明、身体轻健。",
  commentary:
    "「症结积聚」是汉代对腹内结块的称法，「喉痹」「乳难」也都是汉代病名。「旁通」「屈人」「止行」「豺羽」「升推」是这一条的五个别名：《本草纲目》说「屈人、止行，皆因其伤人也」——果实有刺，碍人行走。《本草经赞》引陶弘景说它「多生道旁及墙头，其叶布地，子有刺状如菱」。",
  historicalNote: "此为汉代认知，未经现代科学证实",
  facts: [
    { label: "产地", value: "平泽，或道旁" },
    { label: "今名", value: "蒺藜" },
  ],
  photo: {
    file: "jilizi-tribulus.jpg",
    subject: "TRIBULUS TERRESTRIS",
    author: "GIANNI DEL BUFALO BYGDB",
    license: "CC BY",
  },
  music: "music/yuzhou-changwan.mp3",
  accent: "#7a5f2a",
  mode: "single-herb",
};
