import type { FilmContent } from "../layout";

// 黄芝 — 神农本草经 卷一 · 上经
// Source: TCM-Ancient-Books-master/000-神农本草经.txt (原文照录，不要改动 original 字段)
//
// TODO while this film is a draft:
//   `npm run check` 报 draft、`npm run gen` 不注册、`npm run verify` 拒绝渲染。
//   1. photo — 真实授权图片，ASCII 文件名，并登记到 public/images/credits.json
//      （本机网络无法访问 Wikimedia / Openverse，需人工下载后补上）
export const content: FilmContent = {
  id: "HuangzhiFirstFilm",
  entry: "黄芝",
  latin: "HUANG ZHI",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷一 · 上经",
  division: "上经 · 草部", // 与已发布的赤芝、青芝、白芝三片保持一致
  flavor: "味甘，平。",
  alias: "一名金芝",
  original: "主心腹五邪，益脾气，安神，忠信和乐。久食，轻身、不老、延年、神仙。",
  translation:
    "古籍称其主心腹间的五种邪气，能补益脾气，安定神志，使人忠信和乐。长期服食，可使身体轻健、不衰老、延长寿命，终成神仙。",
  commentary:
    "「五邪」为古病名，历代注家所指不一，此处按原文用字保留。「神仙」是汉代方术用语，指长生久视，非现代语义。黄芝为「六芝」之一，《名医》别录称「黄芝生嵩山」，《抱朴子》形容「黄者如紫金」。",
  historicalNote: "此为汉代认知，未经现代科学证实",
  facts: [
    { label: "别名", value: "金芝" },
    { label: "篇目位置", value: "上经 · 草部" },
  ],
  photo: {
    file: "TODO-<ascii-name>.jpg",
    subject: "TODO SPECIES",
    author: "TODO AUTHOR",
    license: "TODO LICENSE",
  },
  music: "music/yuzhou-changwan.mp3",
  accent: "#a8812f",
  mode: "single-herb",
};
