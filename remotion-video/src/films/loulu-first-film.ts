import type { FilmContent } from "../layout";

// 漏芦 — 神农本草经 卷一 · 上经
// Source: TCM-Ancient-Books-master/000-神农本草经.txt (原文照录，不要改动 original 字段)
//
// 「一名野兰」归 alias，「生山谷」归 facts。
//
// 钩子取名字：底本案语引《广雅》「飞廉，漏芦也」，而「飞廉」正是神话里的风神（亦作蜚廉）。
// 这是一句字典里的词条对碰，不过出处是底本自己的案语，陶弘景又补一句「俗中取根，名鹿骊」——
// 钩子不是风神本名，是同名这件事。避开了经文里「下乳汁」那一条功效方向。
//
// reading: "copy"。
export const content: FilmContent = {
  id: "LouluFirstFilm",
  entry: "漏芦",
  latin: "LOU LU",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷一 · 上经",
  division: "上经 · 草部",
  flavor: "味甘，咸寒。",
  alias: "一名野兰",
  hook: "它和神话里的风神同名",
  reading: "copy",
  original: "主皮肤热、恶创、疽痔、湿痹，下乳汁。久服，轻身益气，耳目聪明，不老、延年。",
  translation:
    "古籍称其主皮肤热，指皮肤发热；恶创，指凶恶的创伤；疽痔，指痈疽与痔疮；湿痹，指湿邪所致的痹症；下乳汁，指通下乳汁。久食，指长期服食，身体轻健、增益气力，耳聪目明，不显衰老、延长寿命。",
  commentary:
    "「恶创」指凶恶的创伤，「疽痔」指痈疽与痔疮，「湿痹」是汉代对湿邪致痹的称法。这一条的名字有两层：《广雅》直说「飞廉，漏芦也」——「飞廉」又是神话里管风的神（亦写作「蜚廉」），所以名字撞了风神。陶弘景另记民间的叫法：「俗中取根，名鹿骊」——百姓挖根用，叫它「鹿骊」。",
  historicalNote: "此为汉代认知，未经现代科学证实",
  facts: [
    { label: "产地", value: "山谷" },
    { label: "别名", value: "野兰" },
  ],
  photo: {
    file: "loulu-rhaponticum.jpg",
    subject: "RHAPONTICUM UNIFLORUM",
    author: "URGAMAL MAGSAR",
    license: "CC BY",
  },
  music: "music/yuzhou-changwan.mp3",
  accent: "#7a3a52",
  mode: "single-herb",
};