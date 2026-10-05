import type { FilmContent } from "../layout";

// 香蒲 — 神农本草经 卷一 · 上经
// Source: TCM-Ancient-Books-master/000-神农本草经.txt (原文照录，不要改动 original 字段)
//
// 「一名睢」归 alias，「生池泽」归 facts，都不进 original。
//
// 这一条与上一条蒲黄是同一株植物，底本的案语自己就说了：《本草图经》「香蒲，蒲黄苗也」
// ——蒲黄是它穗上的花粉。案语接着引《周礼》「以为菹」，即春初未出水的嫩叶是一种腌菜，
// 钩子取的就是这一层，避开功效方向。两条连看是一组，但各自讲各自的。
//
// reading: "copy" —— 今译与注释进视频描述。
export const content: FilmContent = {
  id: "XiangpuFirstFilm",
  entry: "香蒲",
  latin: "XIANG PU",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷一 · 上经",
  division: "上经 · 草部",
  flavor: "味甘，平。",
  alias: "一名睢",
  hook: "嫩叶是《周礼》里的一道菜",
  reading: "copy",
  original: "主五脏心下邪气，口中烂臭，坚齿，明目、聪耳。久服，轻身、耐老。",
  translation:
    "古籍称其主五脏心下邪气，指五脏与心下的邪气；口中烂臭，指口中溃烂臭秽；坚齿，指使牙齿坚固；明目、聪耳，指使目力清明、听觉灵敏。久食，指长期服食，身体轻健、不显衰老。",
  commentary:
    "「口中烂臭」指口中溃烂臭秽，「聪耳」指听觉灵敏。这一条与上一条蒲黄是同一株植物：《本草图经》说「香蒲，蒲黄苗也」——蒲黄是它穗上的花粉，它是蒲黄的植株。图经又说「春初生嫩叶，未出水时，红白色，茸茸然，《周礼》以为菹」：嫩叶在未出水时采下，是《周礼》里的一种腌菜。《吴普》记「睢，一名睢石，一名香蒲」，《名医》记「一名醮，生南海」。",
  historicalNote: "此为汉代认知，未经现代科学证实",
  facts: [
    { label: "产地", value: "池泽" },
    { label: "别名", value: "睢石" },
  ],
  photo: {
    file: "xiangpu-typha.jpg",
    subject: "TYPHA ORIENTALIS",
    author: "WILLIAM HARLAND",
    license: "CC BY",
  },
  music: "music/yuzhou-changwan.mp3",
  accent: "#5f7a4a",
  mode: "single-herb",
};
