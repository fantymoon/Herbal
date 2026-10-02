import type { FilmContent } from "../layout";

// 胡麻 — 神农本草经 卷一 · 上经
// Source: TCM-Ancient-Books-master/000-神农本草经.txt (原文照录，不要改动 original 字段)
//
// 底本此处掉 1 字，据他本补「襄」——底本此行掉一字；《吴普本草》本条篇名作「青襄」，且「蘘」字在 701 个语料文件中 0 命中
//
// 「一名巨胜」是胡麻的古名，《广雅》以狗虱、巨胜、藤苰、胡麻为一物；「叶，名青襄」的
// 青襄在本经另立一条，其经文作「巨胜苗也」，即胡麻之苗。
export const content: FilmContent = {
  id: "HumaFirstFilm",
  entry: "胡麻",
  latin: "HU MA",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷一 · 上经",
  division: "上经 · 米谷部",
  flavor: "味甘，平。",
  alias: "一名巨胜",
  original:
    "主伤中虚羸，补五内，益气力，长肌肉，填髓脑。久服，轻身、不老。一名巨胜。叶，名青襄。生川泽。",
  translation:
    "古籍称其主伤中虚羸，指内里受损、身体虚瘦；补五内，指补益五脏；益气力、长肌肉、填髓脑，指增益气力、生长肌肉、充填髓脑。久服，指长期服食，身体轻健、不衰老。又名巨胜。其叶名青襄。生于川泽。",
  commentary:
    "「伤中」是汉代病名，指内脏受损。「五内」指五脏，「髓脑」指脑髓。《广雅》以狗虱、巨胜、藤苰、胡麻为一物，故「一名巨胜」即其古名。叶名青襄，本经另立一条，其经文作「巨胜苗也」。底本此处缺一字，据《吴普本草》篇名补「襄」。",
  historicalNote: "此为汉代认知，未经现代科学证实",
  facts: [
    { label: "产地", value: "川泽" },
    { label: "别名", value: "巨胜" },
    { label: "部类", value: "米谷部" },
  ],
  photo: {
    file: "huma-sesamum.jpg",
    subject: "SESAMUM INDICUM",
    author: "葉子",
    license: "CC0",
  },
  music: "music/gaoshan-liushui.mp3",
  accent: "#6b6250",
  mode: "single-herb",
};
