import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import yaml from "js-yaml";
import {
  FilmSchema,
  alignPage,
  assignLanes,
  cuesOf,
  pageColLen,
  resolveAt,
  type VoiceSeg,
} from "../src/longform/plan.ts";

// TTS 的分词和我们写的词不一致（「七百零一部」是一个词，「里检索」也是），
// 所以时间锚按字符检索，而不是按词匹配。
const seg: VoiceSeg = {
  text: "螃蟹横着走，孩子就横着生。螃蟹",
  dur: 4,
  words: [
    { t: "螃蟹", s: 0.0, e: 0.4 },
    { t: "横", s: 0.5, e: 0.6 },
    { t: "着", s: 0.6, e: 0.7 },
    { t: "走", s: 0.7, e: 0.9 },
    { t: "孩子", s: 1.2, e: 1.6 },
    { t: "就", s: 1.6, e: 1.8 },
    { t: "横着生", s: 1.8, e: 2.4 },
    { t: "螃蟹", s: 3.0, e: 3.4 },
  ],
};

test("时间锚：词、偏移、第几次出现、秒数", () => {
  assert.equal(resolveAt("孩子", seg), 1.2);
  assert.equal(resolveAt("孩子+0.3", seg), 1.5);
  assert.ok(Math.abs(resolveAt("孩子-0.2", seg) - 1.0) < 1e-9);
  assert.equal(resolveAt("螃蟹#2", seg), 3.0);
  assert.equal(resolveAt(2.5, seg), 2.5);
  // 跨 TTS 词边界的词也能找到：「着生」落在「横着生」中间
  assert.ok(resolveAt("着生", seg) > 1.8 && resolveAt("着生", seg) < 2.4);
});

test("时间锚：找不到的词报错，并带出这一段旁白", () => {
  assert.throws(() => resolveAt("兔肉", seg), /螃蟹横着走/);
});

test("字幕按标点断句，句首时间取自词级时间戳", () => {
  const cues = cuesOf(seg);
  assert.deepEqual(
    cues.map((c) => c.text),
    ["螃蟹横着走", "孩子就横着生", "螃蟹"],
  );
  assert.equal(cues[1].s, 1.2);
});

test("书页：目标句从一列开头起排", () => {
  const p = alignPage("一二三四五六七", "甲乙丙", "丁", 3);
  assert.equal(p.text, "二三四五六七甲乙丙丁");
  assert.equal(p.a % 3, 0);
  assert.equal(p.col, 2);
  assert.equal(pageColLen("妊娠人不得食螃蟹令儿横生也"), 13);
  assert.equal(pageColLen("一二三四五六七八九十一二三四五六七八九十"), 13);
});

test("谱系图：同年代挤得下就分道，挤不下就报错而不是叠在一起", () => {
  const few = assignLanes([
    { name: "本草纲目", key: false, year: 1578 },
    { name: "本草蒙筌", key: false, year: 1565 },
  ]);
  assert.notEqual(few[0], few[1]);
  const crowd = Array.from({ length: 12 }, (_, i) => ({ name: `一部很长的书名${i}`, key: false, year: 1600 + i }));
  assert.throws(() => assignLanes(crowd), /放不下/);
});

test("金样例 film.yaml 通过 schema，且 film.json 已构建", () => {
  const spec = FilmSchema.parse(yaml.load(fs.readFileSync(new URL("../src/topics/pangxie/film.yaml", import.meta.url), "utf8")));
  const built = JSON.parse(fs.readFileSync(new URL("../src/topics/pangxie/film.json", import.meta.url), "utf8"));
  assert.equal(built.id, spec.id);
  assert.equal(built.segments.length, spec.segments.length);
  assert.equal(built.shots[0].from, 0, "第一个镜头必须从第 0 帧开始（首帧即封面）");
});
