import type { FilmContent } from "../layout";

// 葡萄 — 神农本草经 卷一 · 上经
// Source: TCM-Ancient-Books-master/000-神农本草经.txt (原文照录，不要改动 original 字段)
//
// 「可作酒」是这一条里唯一不带功效色彩的句子，也是葡萄最早见于汉籍的用途。底本案语说
// 「旧作葡，据《史记》作蒲」，即孙星衍认为本经原作「蒲桃」。正文照录底本，差异写在注释里。
export const content: FilmContent = {
  id: "PutaoFirstFilm",
  entry: "葡萄",
  latin: "PU TAO",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷一 · 上经",
  division: "上经 · 果部",
  flavor: "味甘，平。",
  alias: null,
  original:
    "主筋骨湿痹，益气、倍力、强志，令人肥健、耐饥、忍风寒。久食，轻身、不老、延年。可作酒。生山谷。",
  translation:
    "古籍称其主筋骨湿痹，指筋骨间的湿邪痹痛；益气、倍力、强志，指增益气力、使气力倍增、强健心志；令人肥健、耐饥、忍风寒，指使人身体丰健、耐受饥饿与风寒。久食，指长期服食，身体轻健、不衰老、延长寿命。可用来酿酒。生于山谷。",
  commentary:
    "「痹」指气血不通所致的疼痛麻木，「湿痹」是汉代病名。「强志」指强健神志。《史记·大宛列传》记大宛以葡萄为酒、汉使取其实来，是葡萄入汉的早期记载。底本案语并说「旧作葡，据《史记》作蒲」。",
  historicalNote: "此为汉代认知，未经现代科学证实",
  facts: [
    { label: "产地", value: "山谷" },
    { label: "用途", value: "可作酒" },
    { label: "部类", value: "果部" },
  ],
  photo: {
    file: "putao-vitis.jpg",
    subject: "VITIS VINIFERA",
    author: "ERWIN GRUBER",
    license: "CC BY",
  },
  music: "music/yuzhou-changwan.mp3",
  accent: "#5b3a6b",
  mode: "single-herb",
};
