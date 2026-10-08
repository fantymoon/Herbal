// 「本草一问」的编译与校验，供 ask-build（写产物）与 ask-check（验同步）共用。
//
// 抽成一份的理由和这个仓库里所有"两处各写一遍"的教训一样：门禁若自己重写一套解析，
// 它验的就是自己那套，而不是生成器真正做了什么。两边共用 compileEpisode，
// 于是"YAML 改了但没重跑 ask:build"能被真正查出来——门禁拿到的是同一段代码的结论。
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import {
  ASK_ROLES,
  spokenIndexOf,
  type AskContent,
  type AskEvidence,
  type AskPhoto,
  type AskRole,
  type AskSegment,
} from "../../src/asks/types.ts";

export type Credit = { file: string; subject: string | null; author: string | null; license: string };

export const loadCredits = (repo: string): Map<string, Credit> => {
  const creditsPath = path.join(repo, "public", "images", "credits.json");
  const credits = JSON.parse(fs.readFileSync(creditsPath, "utf8")) as Credit[];
  return new Map(credits.map((c) => [c.file, c]));
};

const isStr = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

/**
 * `read` 必须能在 `narration` 去标点后逐字找到，否则词级对齐无从谈起。
 * 返回它在朗读字序列里的下标，找不到返回 -1。
 */
export const readOffset = (narration: string, read: string): number =>
  spokenIndexOf(narration, read);

export const episodeIds = (repo: string): string[] =>
  fs
    .readdirSync(path.join(repo, "asks"))
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => f.replace(/\.yaml$/, ""))
    .sort();

/**
 * 把一集的 YAML 编译成 AskContent。**不抛异常**——把问题收集起来一起返回，
 * 让调用方决定是报错退出（ask-build）还是算作门禁违规（ask-check）。
 */
export const compileEpisode = (
  repo: string,
  id: string,
  credits: Map<string, Credit>,
): { content: AskContent | null; problems: string[] } => {
  const file = path.join(repo, "asks", `${id}.yaml`);
  if (!fs.existsSync(file)) return { content: null, problems: [`asks/${id}.yaml does not exist`] };
  const doc = yaml.load(fs.readFileSync(file, "utf8")) as Record<string, unknown>;
  const problems: string[] = [];
  const where = `asks/${id}.yaml`;

  for (const field of [
    "entry",
    "question",
    "deck",
    "collection",
    "accent",
    "music",
    "next",
    "disclaimer",
  ]) {
    if (!isStr(doc[field])) problems.push(`${where}: ${field} is empty`);
  }
  if (!/^#?[0-9a-f]{6}$/i.test(String(doc.accent ?? ""))) {
    problems.push(`${where}: accent must be a hex colour like "#a5613a"`);
  }
  if (isStr(doc.music) && !doc.music.startsWith("music/")) {
    problems.push(`${where}: music must live under public/music`);
  }

  const rawSegments = Array.isArray(doc.segments) ? (doc.segments as Record<string, unknown>[]) : [];
  const roles = rawSegments.map((s) => String(s.role ?? ""));
  if (roles.join(",") !== ASK_ROLES.join(",")) {
    problems.push(
      `${where}: segments must be exactly ${ASK_ROLES.join(" → ")} in that order, got ${
        roles.join(" → ") || "(none)"
      }`,
    );
  }

  const segments: AskSegment[] = rawSegments.map((s, i) => {
    const role = String(s.role ?? "") as AskRole;
    const tag = `${where} segments[${i}] (${role || "?"})`;
    if (!isStr(s.narration)) problems.push(`${tag}: narration is empty`);

    const segment: AskSegment = { role, narration: String(s.narration ?? "") };

    if (Array.isArray(s.photos)) {
      segment.photos = (s.photos as Record<string, unknown>[]).map((p) => {
        const file = String(p.file ?? "");
        const credit = credits.get(file);
        if (!credit) {
          problems.push(`${tag}: ${file} is not registered in public/images/credits.json`);
        } else if (!isStr(credit.license)) {
          problems.push(`${tag}: ${file} has no licence recorded in credits.json`);
        }
        if (!isStr(p.caption)) problems.push(`${tag}: photo ${file} has no caption`);
        return {
          file,
          caption: String(p.caption ?? ""),
          // 署名烘进内容模块：渲染器不该知道台账的存在，而台账已经是唯一登记处。
          credit: credit
            ? [credit.author, credit.license]
                .filter((part): part is string => typeof part === "string" && part.length > 0)
                .join(" / ")
            : "",
        } as AskPhoto;
      });
    }

    if (s.quote !== undefined) {
      const q = s.quote as Record<string, unknown>;
      if (!isStr(q.text)) problems.push(`${tag}: quote.text is empty`);
      if (!isStr(q.source)) problems.push(`${tag}: quote.source is empty — 每条引文都要有出处`);
      segment.quote = { text: String(q.text ?? ""), source: String(q.source ?? "") };
    }

    if (s.read !== undefined) {
      if (!isStr(s.read)) {
        problems.push(`${tag}: read is empty`);
      } else {
        const narration = String(s.narration ?? "");
        if (readOffset(narration, String(s.read)) < 0) {
          problems.push(
            `${tag}: read 「${s.read}」 is not a contiguous stretch of narration once punctuation is dropped — ` +
              `the word-level timings cannot be mapped onto the quote without it`,
          );
        }
        // 「书」屏摆的是**整段**原文，旁白只读其中一句——所以 read 也必须是引文的连续子串。
        // 少了这一半的检查，朱红会从引文的第一个字开始亮、亮到 read 用完为止，整体错位。
        const quoteText = String((s.quote as Record<string, unknown> | undefined)?.text ?? "");
        if (quoteText.length > 0 && spokenIndexOf(quoteText, String(s.read)) < 0) {
          problems.push(
            `${tag}: read 「${s.read}」 is not inside the quote shown on screen — ` +
              `the highlight would start on the wrong character`,
          );
        }
        segment.read = String(s.read);
      }
    }

    if (Array.isArray(s.evidence)) {
      segment.evidence = (s.evidence as Record<string, unknown>[]).map((e) => {
        if (!isStr(e.text)) problems.push(`${tag}: an evidence item has no text`);
        if (!isStr(e.source)) problems.push(`${tag}: an evidence item has no source — 每条引文都要有出处`);
        return {
          text: String(e.text ?? ""),
          source: String(e.source ?? ""),
          ...(isStr(e.note) ? { note: String(e.note) } : {}),
        } as AskEvidence;
      });
    }

    return segment;
  });

  // 每一段各自该有什么，按角色查——缺了是结构不全，不是排版问题。
  const byRole = new Map(segments.map((s) => [s.role, s]));
  const ask = byRole.get("ask");
  const object = byRole.get("object");
  const book = byRole.get("book");
  const study = byRole.get("study");
  if (ask && (ask.photos ?? []).length === 0) {
    problems.push(`${where}: the 问 screen is a full-bleed photo, so it needs at least one`);
  }
  if (object && (object.photos ?? []).length < 2) {
    problems.push(`${where}: the 物 screen wants 2–3 photos to push between`);
  }
  if (book && !book.quote) problems.push(`${where}: the 书 screen needs the 引文 it is reading`);
  if (book && book.quote && !book.read) {
    problems.push(`${where}: the 书 screen needs read, or nothing on it can light up as it is spoken`);
  }
  if (study && (study.evidence ?? []).length < 2) {
    problems.push(`${where}: the 考 screen is a cross-book comparison — it needs at least 2 witnesses`);
  }

  const sources = Array.isArray(doc.sources) ? (doc.sources as unknown[]).map(String) : [];
  if (sources.length === 0) problems.push(`${where}: sources is empty`);

  if (problems.length > 0) return { content: null, problems };

  return {
    content: {
      id,
      entry: String(doc.entry),
      question: String(doc.question),
      deck: String(doc.deck),
      collection: String(doc.collection),
      accent: String(doc.accent),
      segments,
      sources,
      next: String(doc.next),
      disclaimer: String(doc.disclaimer),
      music: String(doc.music),
    },
    problems: [],
  };
};

/** 生成 `src/asks/<id>.content.ts` 的正文。 */
export const renderContentModule = (content: AskContent): string =>
  `// AUTO-GENERATED by scripts/ask-build.ts from asks/${content.id}.yaml — 不要手改。
// 改 YAML 之后重跑 \`npm run ask:build\`，CI 会检查这个文件是否与 YAML 同步。
import type { AskContent } from "./types";

export const content: AskContent = ${JSON.stringify(content, null, 2)};
`;
