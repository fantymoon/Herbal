import type { FilmContent } from "../layout";

// 防风 — 神农本草经 卷一 · 上经
// Source: TCM-Ancient-Books-master/000-神农本草经.txt (原文照录，不要改动 original 字段)
//
// 底本在「骨节疼痹」下夹了一条孙星衍的校注（《御览》作痛），再往下才是「烦满」。
// 校注是清人文字，不是经文，上屏只留经文本身；删掉括号后前后两句仍然连读。
// 「味苦，温，无毒。」拆到首屏味栏。
//
// 片尾事实：产地取自经文；「回云」与采根时节出自《吴普》在本条下的记载，注释里点明。
export const content: FilmContent = {
  id: "FangfengFirstFilm",
  entry: "防风",
  latin: "FANG FENG",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷一 · 上经",
  division: "上经 · 草部",
  flavor: "味苦，温，无毒。",
  alias: null,
  original:
    "主大风、头眩痛，恶风风邪，目盲无所见，风行周身，骨节疼痹，烦满。久服，轻身。一名铜芸。生川泽。",
  translation:
    "古籍称其主大风与头眩痛，即风邪所致的眩晕头痛；恶风风邪，指怕风、易受风邪；目盲无所见，指视物不见；风行周身、骨节疼痹，指风邪流走全身、骨节疼痛麻木；烦满，指胸中烦闷。久服，指长期服食，身体轻健。又名铜芸。生于川泽。",
  commentary:
    "「大风」是汉代病名，指风邪重症，不是今之麻风。「痹」指气血不通所致的疼痛麻木，「烦满」指胸中烦闷。《吴普》另记其一名回云、百枝，三月、十月采根。",
  historicalNote: "此为汉代认知，未经现代科学证实",
  facts: [
    { label: "产地", value: "川泽" },
    { label: "别称", value: "回云" },
    { label: "部类", value: "草部" },
  ],
  photo: {
    file: "saposhnikovia-fangfeng.jpg",
    subject: "SAPOSHNIKOVIA DIVARICATA",
    author: "OCHIRNIMA NIMAEV",
    license: "CC BY",
  },
  music: "music/gaoshan-liushui.mp3",
  accent: "#8a6a2f",
  mode: "single-herb",
};
