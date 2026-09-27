// Per-book configuration for scripts/build-progress.mjs.
//
// Adding the next classical book should mean adding one file here, not editing the
// builder. `source` is relative to the repository parent (the workspace root).

export default {
  key: "shennong-bencao-jing",
  book: "神农本草经",
  /** Romanised title, printed as the hero's top label (matches the published films). */
  bookLatin: "SHENNONG BENCAO JING",
  source: "TCM-Ancient-Books-master/000-神农本草经.txt",

  // Entry name in the txt -> Composition id. Composition ids cannot be derived from
  // entry names (黄 -> HuangqiFirstFilm, 柴胡 -> BupleurumThirdFilm), so the mapping
  // is explicit. scripts/build-progress.mjs checks it against the films on disk.
  done: {
    丹沙: "DanshaFirstFilm",
    云母: "YunmuFirstFilm",
    玉泉: "YuquanFirstFilm",
    石钟乳: "ShizhongruFirstFilm",
    涅石: "NieshiFirstFilm",
    硝石: "XiaoshiFirstFilm",
    朴硝: "PuxiaoFirstFilm",
    滑石: "HuashiFirstFilm",
    空青: "KongqingFirstFilm",
    曾青: "ZengqingFirstFilm",
    禹余粮: "YuyuliangFirstFilm",
    太乙余食: "TaiyiFirstFilm",
    白石英: "BaishiyingFirstFilm",
    紫石英: "ZishiyingFirstFilm",
    白青: "BaiqingFirstFilm",
    扁青: "BianqingFirstFilm",
    菖蒲: "ChangpuFirstFilm",
    鞠华: "JuhuaFirstFilm",
    人参: "GinsengFirstFilm",
    天门冬: "TianmendongFirstFilm",
    甘草: "LicoriceSecondFilm",
    干地黄: "GandihuangFirstFilm",
    术: "ShuFirstFilm",
    菟丝子: "TusiziFirstFilm",
    牛膝: "NiuxiFirstFilm",
    充蔚子: "ChongweiziFirstFilm",
    女萎: "NvweiFirstFilm",
    防葵: "FangkuiFirstFilm",
    柴胡: "BupleurumThirdFilm",
    麦门冬: "MaimendongFirstFilm",
    独活: "DuhuoFirstFilm",
    车前子: "CheqianziFirstFilm",
    木香: "MuxiangFirstFilm",
    署豫: "ShuyuFirstFilm",
    薏苡仁: "YiyirenFirstFilm",
    泽泻: "ZexieFirstFilm",
    远志: "YuanzhiFirstFilm",
    龙胆: "LongdanFirstFilm",
    细辛: "XixinFirstFilm",
    石斛: "ShihuFirstFilm",
    巴戟天: "BajitianFirstFilm",
    白英: "BaiyingFirstFilm",
    白蒿: "BaihaoFirstFilm",
    赤箭: "ChijianFirstFilm",
    奄闾子: "YanlvziFirstFilm",
    析子: "XiziFirstFilm",
    蓍实: "ShishiFirstFilm",
    赤芝: "ChizhiFirstFilm",
    青芝: "QingzhiFirstFilm",
    白芝: "BaizhiFirstFilm",
    黄芝: "HuangzhiFirstFilm",
    黄: "HuangqiFirstFilm",
    牡丹: "PeonySecondFilm",
    当归: "AngelicaFourthFilm",
    麻黄: "EphedraFirstFilm",
  },

  // Listed in the 上经 table of contents, but this recension has no 篇名 section.
  skipped: {
    石胆: "listed in 上经 TOC, no 篇名 section in this recension",
    五色石脂: "listed in 上经 TOC, no 篇名 section in this recension",
    "附∶《吴氏本草》十二条": "appendix, not a drug entry: 吴普's quotations gathered at the end of 卷一",
    "附∶诸药制使": "appendix, not a drug entry: the 畏恶七情 table, not a 本草经 条",
  },

  // Names a platform's copy may use for an entry, when it differs from the source
  // heading. `npm run stats` matches an export row to a film by the entry name in the
  // platform's own text, and a one-character heading is too short to match on safely.
  titleAliases: {
    黄: ["黄耆"],
  },

  // Films whose source entry needs a note in the ledger.
  notes: {
    菟丝子: "no 篇名 heading in the txt; described inline between 术 and 牛膝",
    黄: "film titled 黄耆; txt 篇名 is 黄 (一名戴糁)",
  },

  // Films that render another film rather than an entry of their own.
  wrappers: {
    AngelicaFourthFilmRealPhoto: "renders AngelicaFourthFilm with a real credited photo",
  },
};
