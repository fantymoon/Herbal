import type { FilmContent } from "../layout";

// 飞廉 — 神农本草经 卷一 · 上经
// Source: TCM-Ancient-Books-master/000-神农本草经.txt (原文照录，不要改动 original 字段)
//
// 底本 32 字，无缺字、无截断，整条可用。
//
// 「飞轻」这个别名与经文「久服，令人身轻」是同一句话的两头——名字从正文里长出来，
// 这类别名在《本经》里不多。
//
// 注释里点的那件事有据：《证类本草》飞廉条作「一名漏芦，一名天荠，一名伏猪，一名飞轻，
// 一名伏菟，一名飞雉，一名木禾」，而《本经》自有漏芦一条（卷一·上经，味苦咸寒）。
// 同一个名字挂在两条药上，这是传抄里常见的事，不下断语，只把两条摆出来。

export const content: FilmContent = {
  id: "FeilianFirstFilm",
  entry: "飞廉",
  latin: "CARDUUS",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷一 · 上经",
  division: "上经 · 草部",
  flavor: "味苦，平。",
  alias: "一名飞轻",
  original: "主骨节热，胫重酸疼。久服，令人身轻。一名飞轻。生川泽。",
  translation:
    "古籍称其主骨节热，指骨节间的热；胫重酸疼，指小腿沉重酸痛。久服令人身轻，指长期服食身体轻健。飞轻是它的别名。生川泽，指生在水泽边。",
  commentary:
    "「胫」指小腿。「飞轻」与经文「令人身轻」呼应，名字从这一句里取。《证类本草》另记它一名漏芦，而《本经》自有漏芦一条——同一个名字挂在两条药上。",
  historicalNote: "此为汉代认知，未经现代科学证实",
  facts: [
    { label: "别名", value: "飞轻" },
    { label: "产地", value: "川泽" },
    { label: "篇目位置", value: "卷一 · 上经" },
  ],
  photo: {
    file: "feilian-plant.jpg",
    subject: "CARDUUS CRISPUS",
    author: "ROBERT H. WARDELL",
    license: "CC0",
  },
  music: "music/yuzhou-changwan.mp3",
  accent: "#4a6b5a",
  mode: "single-herb",
};
