import type { FilmContent } from "../layout";

// 蒲黄 — 神农本草经 卷一 · 上经
// Source: TCM-Ancient-Books-master/000-神农本草经.txt (原文照录，不要改动 original 字段)
//
// 「生池泽」不进 original：产地归 facts。
//
// 钩子取「蒲黄是什么」，材料在底本自己的案语里：《玉篇》「蒲头有台，台上有重台，中出黄，
// 即蒲黄」，陶弘景「此即蒲厘花上黄粉也」。这一条最容易滑向功效（止血、消瘀血），
// 而「它是香蒲穗子上的花粉」既准确又不需要碰功效。
// 《名医》「生河东，四月采」进了 facts 的采收一栏，注释里点明出处。
//
// 配图是香蒲属的杂交种（TYPHA × GLAUCA），不是水烛香蒲本身。**这是一次取舍**：
// 香蒲（T. orientalis）的可用照片里没有一张拍清穗子，而这张正好拍到上下两段穗——
// 上面那段就是出蒲黄的地方，正对案语「中出黄」。署名如实写属与种，描述里也点明。
//
// reading: "copy" —— 今译与注释进视频描述。
export const content: FilmContent = {
  id: "PuhuangFirstFilm",
  entry: "蒲黄",
  latin: "PU HUANG",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷一 · 上经",
  division: "上经 · 草部",
  flavor: "味甘，平。",
  alias: null,
  hook: "是香蒲穗子上的黄粉",
  reading: "copy",
  // Read aloud: the passage, and nothing else. The 今译 and 注释 are in the copy.
  narration: "主心腹、膀胱寒热，利小便，止血，消瘀血。久服，轻身、益气力，延年、神仙。",
  original: "主心腹、膀胱寒热，利小便，止血，消瘀血。久服，轻身、益气力，延年、神仙。",
  translation:
    "古籍称其主心腹、膀胱寒热，指胸腹与膀胱的寒热之病；利小便，指使小便通利；止血，指止住出血；消瘀血，指消散瘀血。久食，指长期服食，身体轻健、气力增益，延长寿命。",
  commentary:
    "「心腹」指胸腹，「膀胱寒热」是汉代对下焦寒热病证的称法。这一条的药是花粉，不是草叶：底本案语引《玉篇》说「蒲头有台，台上有重台，中出黄，即蒲黄」，陶弘景说得更直白——「此即蒲厘花上黄粉也」。《名医》记「生河东，四月采」，即农历四月采收。",
  historicalNote: "此为汉代认知，未经现代科学证实",
  facts: [
    { label: "产地", value: "池泽" },
    { label: "采收", value: "四月采" },
  ],
  photo: {
    file: "puhuang-typha.jpg",
    subject: "TYPHA × GLAUCA",
    author: "MARDON ERBLAND",
    license: "CC0",
  },
  music: "music/yuzhou-changwan.mp3",
  accent: "#6b7a3a",
  mode: "single-herb",
};
