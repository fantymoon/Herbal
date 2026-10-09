// 长视频构建：film.yaml + voice.json → film.json（渲染器唯一读的文件）。
//
//   npm run longform:build -- pangxie
//
// 这一步替写稿的人（或模型）把最容易出错的事做掉，并在出错时拒绝出片：
//   1. 引文逐字核对语料（去掉标点空白后必须是原书里连续的一段）；
//   2. `at` 词换算成秒，找不到词就报错，并给出这一段的旁白；
//   3. dots 镜头的命中数由检索式现场算出，与 expect 不符就报错；
//   4. 谱系图自动分道，标签放不下就报错；
//   5. 书页、竖排清单的字数上限；
//   6. 「画面静止」检查：任意两次视觉变化之间不得超过 MAX_STILL 秒。
// 只报 warn 的问题不阻止出片，FAIL 一律退出码 1。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import {
  COLUMNS_MAX_CHARS,
  CHAPTER_NUMS,
  END_CARD_AFTER,
  FPS,
  FilmSchema,
  GAP,
  LEAD,
  MAX_STILL,
  TAIL,
  WARN_STILL,
  alignPage,
  assignLanes,
  cuesOf,
  pageColLen,
  resolveAt,
  type CompiledFilm,
  type CompiledShot,
  type VoiceSeg,
} from "../../src/longform/plan.ts";

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const corpusDir = path.join(repo, "..", "TCM-Ancient-Books-master");
const id = process.argv[2];
if (!id) {
  console.error("用法：npm run longform:build -- <id>");
  process.exit(1);
}
const topicDir = path.join(repo, "src/topics", id);

const fails: string[] = [];
const warns: string[] = [];
const fail = (where: string, msg: string) => fails.push(`FAIL ${where}：${msg}`);
const warn = (where: string, msg: string) => warns.push(`warn ${where}：${msg}`);

// ---------- 读入 ----------
const parsed = FilmSchema.safeParse(yaml.load(fs.readFileSync(path.join(topicDir, "film.yaml"), "utf8")));
if (!parsed.success) {
  for (const issue of parsed.error.issues) console.error(`FAIL film.yaml ${issue.path.join(".")}：${issue.message}`);
  process.exit(1);
}
const film = parsed.data;
const voicePath = path.join(topicDir, "voice.json");
if (!fs.existsSync(voicePath)) {
  console.error(`FAIL 还没有配音：先跑 python3 scripts/longform/voice.py ${id}`);
  process.exit(1);
}
const voice = JSON.parse(fs.readFileSync(voicePath, "utf8")) as VoiceSeg[];
if (voice.length !== film.segments.length || voice.some((v, i) => v.text !== film.segments[i].narration.trim())) {
  console.error(`FAIL 配音和旁白对不上（改了旁白没重新合成？）：python3 scripts/longform/voice.py ${id}`);
  process.exit(1);
}

// ---------- 语料 ----------
const HAN = /\p{Script=Han}/u;
const hanOnly = (s: string) => [...s].filter((c) => HAN.test(c)).join("");
const corpusFiles = fs.readdirSync(corpusDir).filter((f) => /^\d{3}[-.].*\.txt$/.test(f)).sort();
const cache = new Map<string, string>();
const readBook = (file: string) => {
  if (!cache.has(file)) {
    const p = path.join(corpusDir, file);
    cache.set(file, fs.existsSync(p) ? new TextDecoder("gb18030").decode(fs.readFileSync(p)) : "");
  }
  return cache.get(file)!;
};
const checkQuote = (where: string, file: string, quote: string) => {
  const raw = readBook(file);
  if (!raw) return fail(where, `语料里没有文件 ${file}`);
  if (!hanOnly(raw).includes(hanOnly(quote))) fail(where, `引文在 ${file} 里找不到连续原文：「${quote}」——不要凭记忆写引文，从语料里复制`);
};

// ---------- 时间轴 ----------
const segStart: number[] = [];
{
  let t = LEAD;
  for (const v of voice) {
    segStart.push(t);
    t += v.dur + GAP;
  }
}
const lastSeg = voice.length - 1;
const endFrom = segStart[lastSeg] + voice[lastSeg].dur + END_CARD_AFTER;
const totalSeconds = segStart[lastSeg] + voice[lastSeg].dur + TAIL;

const shots: CompiledShot[] = [];
const allEvents: number[] = [];

film.segments.forEach((seg, si) => {
  const v = voice[si];
  const abs = (spec: string | number, where: string): number => {
    try {
      return segStart[si] + resolveAt(spec, v);
    } catch (e) {
      fail(where, (e as Error).message);
      return segStart[si];
    }
  };
  seg.shots.forEach((shot, k) => {
    const where = `第 ${si + 1} 段第 ${k + 1} 个镜头（${shot.type}）`;
    const from = abs(shot.at, where);
    const events: number[] = [];
    const out: Record<string, unknown> = { type: shot.type, from };

    const image = (key: string) => {
      const img = film.images[key];
      if (!img) fail(where, `images 里没有「${key}」`);
      else if (!fs.existsSync(path.join(repo, "public", img.file))) fail(where, `图片文件不存在：public/${img.file}`);
      return img ?? { file: "", credit: "" };
    };
    const quote = (s: { book: string; meta: string; file: string; before: string; target: string; after: string; marks: { text: string; at: string | number; to?: string | number }[] }) => {
      checkQuote(where, s.file, s.before + s.target + s.after);
      const colLen = pageColLen(s.target);
      const page = alignPage(hanOnly(s.before), hanOnly(s.target), hanOnly(s.after), colLen);
      const marks = s.marks.map((m) => {
        const a = page.text.indexOf(hanOnly(m.text));
        if (a < 0) fail(where, `高亮「${m.text}」不在这页的文字里`);
        const mf = abs(m.at, where);
        const mt = m.to === undefined ? mf : abs(m.to, where);
        events.push(mf);
        return { a: [...page.text.slice(0, Math.max(0, a))].length, b: [...page.text.slice(0, Math.max(0, a))].length + [...hanOnly(m.text)].length, from: mf, to: mt };
      });
      return { book: s.book, meta: s.meta, text: page.text, colLen, targetCol: page.col, marks };
    };

    switch (shot.type) {
      case "page": {
        Object.assign(out, quote(shot));
        if (shot.zoom) {
          const zf = abs(shot.zoom.from, where);
          const zt = abs(shot.zoom.to, where);
          events.push(zf);
          out.zoom = { from: zf, to: zt, scale: shot.zoom.scale };
        }
        break;
      }
      case "photo": {
        out.image = image(shot.image);
        Object.assign(out, { zoom: shot.zoom, pan: shot.pan, y: shot.y, title: shot.title ?? null, gloss: shot.gloss ?? null });
        out.titleAt = shot.titleAt === undefined ? from : abs(shot.titleAt, where);
        if (shot.title) events.push(out.titleAt as number);
        break;
      }
      case "dots": {
        const re = new RegExp(shot.search, "u");
        const hitIdx: number[] = [];
        for (const f of corpusFiles) if (re.test(readBook(f))) hitIdx.push(Number(f.slice(0, 3)));
        const dropped = new Set(shot.merge.flatMap((g) => g.filter((n) => hitIdx.includes(n)).slice(1)));
        const hits = hitIdx.filter((n) => !dropped.has(n));
        if (hits.length !== shot.expect) fail(where, `检索式实际命中 ${hits.length} 部（合并后），稿子写的是 ${shot.expect}。命中：${hits.join(",")}`);
        const hitAt = abs(shot.hitAt, where);
        events.push(from + 1.4, hitAt);
        Object.assign(out, { total: corpusFiles.length, hits, countLabel: shot.countLabel, hitLabel: shot.hitLabel, note: shot.note, hitAt });
        console.log(`  dots：语料 ${corpusFiles.length} 部，命中 ${hits.length} 部——旁白里的数字请与此一致`);
        break;
      }
      case "lineage": {
        let lanes: number[] = [];
        try {
          lanes = assignLanes(shot.nodes);
        } catch (e) {
          fail(where, (e as Error).message);
        }
        const burst = abs(shot.burstAt, where);
        let cascade = 0;
        const nodes = shot.nodes.map((n, i) => {
          const at = n.at !== undefined ? abs(n.at, where) : burst + 0.09 * cascade++;
          events.push(at);
          return { name: n.name, dyn: n.dyn, year: n.year, key: n.key, at, lane: lanes[i] ?? 0 };
        });
        Object.assign(out, { title: shot.title, nodes });
        break;
      }
      case "columns": {
        shot.lines.forEach((l) => {
          checkQuote(where, shot.file, l);
          if ([...l].length > COLUMNS_MAX_CHARS) fail(where, `「${l}」${[...l].length} 字，竖排一行最多 ${COLUMNS_MAX_CHARS} 字，会压到字幕`);
        });
        if (shot.emphasize >= shot.lines.length) fail(where, "emphasize 超出行数");
        const emphasizeAt = abs(shot.emphasizeAt, where);
        events.push(emphasizeAt);
        Object.assign(out, { source: shot.source, lines: shot.lines, emphasize: shot.emphasize, emphasizeAt });
        break;
      }
      case "silent":
        Object.assign(out, { count: shot.count, text: shot.text });
        break;
      case "confront": {
        Object.assign(out, quote(shot));
        out.image = image(shot.image);
        const arrowAt = abs(shot.arrowAt, where);
        const morphAt = abs(shot.morph.at, where);
        events.push(arrowAt, morphAt);
        Object.assign(out, { arrow: shot.arrow, arrowAt, morph: { from: shot.morph.from, to: shot.morph.to, at: morphAt } });
        break;
      }
      case "verdict": {
        const slamAt = abs(shot.slamAt, where);
        events.push(slamAt, slamAt + 1);
        Object.assign(out, { char: shot.char, seal: shot.seal, slamAt });
        break;
      }
    }
    out.events = events;
    allEvents.push(from, ...events);
    shots.push(out as CompiledShot);
  });
});

// 第一个镜头从第 0 帧开始：首帧就是画面（平台封面取首帧），不留黑场
if (shots.length && shots[0].from <= LEAD) shots[0].from = 0;
// 镜头结束 = 下一个镜头开始；最后一个镜头接片尾卡
shots.forEach((s, i) => {
  s.to = i + 1 < shots.length ? shots[i + 1].from : endFrom;
  if (s.to <= s.from) fail(`镜头 ${i + 1}（${s.type}）`, "开始时间不早于下一个镜头，检查 at 的顺序");
});

// ---------- 画面静止检查 ----------
const marks = [...new Set(allEvents.concat(endFrom).filter((t) => t >= 0 && t <= endFrom))].sort((a, b) => a - b);
for (let i = 1; i < marks.length; i++) {
  const gap = marks[i] - marks[i - 1];
  const at = `${marks[i - 1].toFixed(1)}s–${marks[i].toFixed(1)}s`;
  if (gap > MAX_STILL) fail(`画面 ${at}`, `${gap.toFixed(1)} 秒没有任何视觉变化（上限 ${MAX_STILL}s），加一个镜头或一个高亮`);
  else if (gap > WARN_STILL) warn(`画面 ${at}`, `${gap.toFixed(1)} 秒没有变化，偏长`);
}

// ---------- 产出 ----------
let chapterCount = 0;
const compiled: CompiledFilm = {
  id: film.id,
  series: film.series,
  title: film.title,
  music: film.music,
  musicVolume: film.musicVolume,
  images: film.images,
  cover: film.cover,
  totalFrames: Math.round(totalSeconds * FPS),
  segments: voice.map((v, i) => {
    const chapter = film.segments[i].chapter ?? null;
    return { start: segStart[i], dur: v.dur, chapter, chapterNum: chapter ? CHAPTER_NUMS[chapterCount++] : null, cues: cuesOf(v) };
  }),
  shots,
  end: { from: endFrom, ...film.end },
};

warns.forEach((w) => console.log(w));
if (fails.length) {
  fails.forEach((f) => console.error(f));
  console.error(`\n${fails.length} 处 FAIL，未写出 film.json`);
  process.exit(1);
}
fs.writeFileSync(path.join(topicDir, "film.json"), JSON.stringify(compiled, (_k, v) => (typeof v === "number" ? Math.round(v * 1000) / 1000 : v), 1) + "\n");
console.log(`ok ${id}：${shots.length} 个镜头，${totalSeconds.toFixed(1)} 秒，最长静止 ${Math.max(...marks.slice(1).map((m, i) => m - marks[i])).toFixed(1)} 秒`);
