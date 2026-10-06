import type { FilmContent } from "../layout";

// 营实 — 神农本草经 卷一 · 上经
// Source: TCM-Ancient-Books-master/000-神农本草经.txt (原文照录，不要改动 original 字段)
//
// 「一名墙薇，一名墙麻，一名牛棘」太长不进 hero fact，进注释；「生川谷」归 facts。
//
// 钩子取身份：底本没有直接说营实是什么，但陶弘景（《本草经集注》）「营实即蔷薇子也」——
// 它就是蔷薇的果实（rose hip）。三个别名「墙薇、墙麻、牛棘」里"墙薇"就等于"蔷薇"。
// 这是本经之外但紧贴本经的注释，原料出处与别名两条线都收。
//
// 经文「痈疽恶创、结肉跌筋」那些是功效方向，避开。取 钩子取的是"它是什么"。
//
// reading: "copy"。
export const content: FilmContent = {
  id: "YingshiFirstFilm",
  entry: "营实",
  latin: "YING SHI",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷一 · 上经",
  division: "上经 · 草部",
  flavor: "味酸，温。",
  alias: "一名墙薇",
  hook: "它就是蔷薇的果实",
  reading: "copy",
  original:
    "主痈疽恶创，结肉跌筋，败创，热气，阴蚀不疗，利关节。",
  translation:
    "古籍称其主痈疽恶创，指痈疽与凶恶的创伤；结肉跌筋，指使断裂的肉与筋重新结连；败创，指溃烂的创面；热气，指热邪之病；阴蚀不疗，指下部阴处的侵蚀未能治好；利关节，指使关节通利。",
  commentary:
    "「痈疽」指脓肿，「跌筋」指筋之受伤，「阴蚀」指外阴部的侵蚀。三个别名「墙薇、墙麻、牛棘」里「墙薇」就是蔷薇——本草别名常见「墙」「蔷」互通。陶弘景直说：「营实即蔷薇子也，以白花者为良」——它就是蔷薇的果实（rose hip），白花的入药更佳。李时珍另记蔷薇的嫩芽可食：「春抽嫩蕻，小儿掐去皮刺食之」——小孩剥了刺吃它的嫩芽。",
  historicalNote: "此为汉代认知，未经现代科学证实",
  facts: [
    { label: "产地", value: "川谷" },
    { label: "今名", value: "野蔷薇" },
  ],
  photo: {
    file: "yingshi-rosa.jpg",
    subject: "ROSA MULTIFLORA",
    author: "MARK APGAR",
    license: "CC BY",
  },
  music: "music/yuzhou-changwan.mp3",
  accent: "#9a3052",
  mode: "single-herb",
};