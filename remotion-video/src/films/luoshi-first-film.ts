import type { FilmContent } from "../layout";

// 络石 — 神农本草经 卷一 · 上经
// Source: TCM-Ancient-Books-master/000-神农本草经.txt (原文照录，不要改动 original 字段)
//
// 底本此处作「水浆不干」，《证类本草》《新修本草》《本草品汇精要》并作「水浆不下」。
// 「不干」在这句里没有意义（水浆本就不会「干」），「不下」指水与米汤都咽不下去，正接上文
// 「喉舌肿」。形近而讹，今从诸本，异文写进注释。与大枣的「肋／助十二经」同类。
//
// 「一名石鲮」与「生川谷」不进 original：别名与产地各归其位（alias / facts）。
// 脚手架默认把别名同时写进 facts，那会在首屏和片尾各说一次，已删。
export const content: FilmContent = {
  id: "LuoshiFirstFilm",
  entry: "络石",
  latin: "LUO SHI",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷一 · 上经",
  division: "上经 · 草部",
  flavor: "味苦，温。",
  alias: "一名石鲮",
  // 首屏钩子。络石这个药名冷，但它就是绿化带里到处爬的风车茉莉——钩子给的是这个桥，
  // 顺带把药名的意思（缠绕石头）也说了。
  hook: "爬在石头上的风车茉莉",
  original:
    "主风热、死肌、痈伤，口干、舌焦，痈肿不消，喉舌肿，水浆不下。久服，轻身，明目、润泽、好颜色，不老、延年。",
  translation:
    "古籍称其主风热，指风邪与热邪所致的病；死肌，指肌肤麻木坏死的古说；痈伤，指疮痈与创伤；口干、舌焦，指口中干燥、舌面焦枯；痈肿不消，指疮痈肿起不散；喉舌肿，指咽喉与舌肿胀；水浆不下，指水与米汤都咽不下。久食，指长期服食，身体轻健、目明，肌肤润泽、气色好，不衰老、延寿。",
  commentary:
    "「死肌」是汉代对肌肤麻木坏死的说法，今译不作现代病理理解。「水浆」指水与米汤一类流食；底本作「水浆不干」，《证类本草》诸本作「水浆不下」，形近而讹，今从诸本。「石鲮」为别名，见《吴普》一系。",
  historicalNote: "此为汉代认知，未经现代科学证实",
  facts: [
    { label: "产地", value: "川谷" },
    { label: "今名", value: "络石藤" },
  ],
  photo: {
    file: "luoshi-trachelospermum.jpg",
    subject: "TRACHELOSPERMUM JASMINOIDES",
    author: "卢江离",
    license: "CC BY",
  },
  music: "music/yuzhou-changwan.mp3",
  accent: "#4a6b4f",
  mode: "single-herb",
};
