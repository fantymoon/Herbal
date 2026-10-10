import type { FilmContent } from "../layout";

// 白芷 — 神农本草经 卷二 · 中经
// Source: TCM-Ancient-Books-master/000-神农本草经.txt (原文照录)
//
// 钩子取「可作面脂」：这条经文把妇人之疾、风邪之疾与「长肌肤，润泽，可作面脂」
// 并列，在本经里药与面脂本就不分家。别名「芳香」说的正是它的气味。
//
// 注意 id：`BaizhiFirstFilm` 已被**白芝**（上经芝类，已发布并冻结）占用，白芝与白芷
// 拼音完全相同，故本条用 BaizhiAngelicaFirstFilm 区分，图片名也带 -angelica- 前缀。
//
// reading: "copy"。今译与注释进上传文案。
export const content: FilmContent = {
  id: "BaizhiAngelicaFirstFilm",
  entry: "白芷",
  latin: "BAI ZHI",
  book: "神农本草经",
  bookLatin: "SHENNONG BENCAO JING",
  volume: "卷二 · 中经",
  division: "中经 · 草部",
  flavor: "味辛，温。",
  alias: "一名芳香",
  hook: "古书里它还能做成面脂",
  reading: "copy",
  original:
    "主女人漏下赤白，血闭，阴肿，寒热，风头侵目泪出。长肌肤，润泽，可作面脂。一名芳香。生川谷。",
  translation:
    "古籍称其主女人漏下赤白，指妇人下血、赤白相杂；血闭，指经血闭止；阴肿，指前阴肿胀；寒热，指寒热往来；风头侵目泪出，指风邪犯头、两目流泪。长肌肤，指使肌肤生长；润泽，指使肌肤润泽；可作面脂，指可以制成涂面的脂膏。一名芳香。生于川谷。",
  commentary:
    "「漏下赤白」指妇人下血、赤白相杂；「血闭」指经血闭止；「阴肿」指前阴肿胀；「风头侵目泪出」指风邪犯头、两目流泪。一条经文里，妇人之疾、风邪之疾与「长肌肤，润泽，可作面脂」并列——在本经中，药与面脂本不分家；别名「芳香」，说的正是它的气味。《本草图经》称其「根长尺余，白色」；《本草纲目》记「与白芷同作面脂」，这条汉代的用法一路传了下来。",
  historicalNote: "此为汉代认知，未经现代科学证实",
  facts: [
    { label: "产地", value: "川谷" },
    { label: "部类", value: "草部" },
  ],
  photo: {
    file: "angelica-dahurica-baizhi.jpg",
    subject: "ANGELICA DAHURICA",
    author: "ELENA_SHEREHORA",
    license: "CC BY",
  },
  music: "music/fengguo-yanjiao.mp3",
  accent: "#5f6f7a",
  mode: "single-herb",
};
