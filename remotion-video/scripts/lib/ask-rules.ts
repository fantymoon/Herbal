// 「本草一问」的三条内容规则。
//
// 抽成纯函数只有一个理由：**门禁要能被一个坏输入验证**。一个只会对好输入点头的检查器
// 和没有检查器是一样的——这个仓库为此删掉过一批"断言文档措辞"式的测试。
// 这里三条规则各自只吃一个 AskContent（外加图片台账），所以 tests/ask.test.ts 可以
// 直接喂坏输入看它们变红，而不必去跑一遍渲染。
//
// 三条是用户定的，不多不少：
//   1. 旁白与字幕里不出现功效词——功效只留在照录的引文里，旁白从不复述；
//   2. 每条引文都有出处；
//   3. 每张图都有授权。
// 合规靠版式本身保证（问法决定它不会变成功效主张），不靠事后审词。
import { claimWordingProblems } from "./compliance.ts";
import { OFF_POSITION_WORDS } from "./ledger.ts";
import {
  COVER_COLUMN,
  COVER_DISCLAIMER,
  COVER_TEXT_FLOOR,
  rowBottom,
  rowWidth,
  type CoverPhoto,
  type CoverRow,
} from "../../src/asks/series-cover.ts";
import type { AskContent } from "../../src/asks/types.ts";
import { creditLine, type Credit } from "./ask.ts";

export type Finding = { rule: string; detail: string };

/**
 * 规则一：我们写的散文里不出现功效词。
 *
 * 扫的是 `question` / `narration` / 考据小注 / 预告 / 系列名，以及台账文案。
 * **引文不在其中**（`quote.text` / `evidence[].text`）——那是书上说的，
 * 平台反对的是"我们替古人下结论"，不是"书上曾经这么写"。
 * 这条界线就是这一系列敢在屏幕上放「能令出汗」的原因。
 */
export const wordingProblems = (content: AskContent): Finding[] => {
  const authored: { where: string; text: string }[] = [
    { where: "question", text: content.question },
    { where: "deck", text: content.deck },
    { where: "collection", text: content.collection },
    { where: "next", text: content.next },
    { where: "entry", text: content.entry },
  ];
  content.segments.forEach((segment, i) => {
    authored.push({ where: `segments[${i}](${segment.role}).narration`, text: segment.narration });
    for (const item of segment.evidence ?? []) {
      if (item.note) authored.push({ where: `segments[${i}].evidence.note`, text: item.note });
    }
  });

  const findings: Finding[] = [];
  for (const item of authored) {
    for (const word of claimWordingProblems(item.text)) {
      const shown = item.text.length > 30 ? `${item.text.slice(0, 30)}…` : item.text;
      findings.push({
        rule: "banned-wording",
        detail: `${item.where} shows 「${shown}」 containing "${word}"`,
      });
    }
  }
  return findings;
};

/** 规则一（续）：台账文案走同一个函数。平台的处罚落在标题和描述上，不落在某一帧上。 */
export const ledgerWordingProblems = (
  where: string,
  text: string,
): Finding[] =>
  claimWordingProblems(text).map((word) => ({
    rule: "banned-wording",
    detail: `${where} contains "${word}"`,
  }));

/** 规则二：每条引文都有出处。 */
export const quoteSourceProblems = (content: AskContent): Finding[] => {
  const findings: Finding[] = [];
  let total = 0;
  content.segments.forEach((segment, i) => {
    const items: { where: string; text: string; source: string }[] = [];
    if (segment.quote) items.push({ where: `segments[${i}].quote`, ...segment.quote });
    (segment.evidence ?? []).forEach((item, j) => {
      items.push({ where: `segments[${i}].evidence[${j}]`, text: item.text, source: item.source });
    });
    for (const item of items) {
      total += 1;
      if (item.text.trim().length === 0) {
        findings.push({ rule: "quote-source", detail: `${item.where}: 引文是空的` });
      }
      if (item.source.trim().length === 0) {
        findings.push({
          rule: "quote-source",
          detail: `${item.where}: 「${item.text.slice(0, 18)}…」 没有出处`,
        });
      }
    }
  });
  if (total === 0) {
    findings.push({ rule: "quote-source", detail: "这一集一条引文都没有——那就不是「读古书」了" });
  }
  return findings;
};

/** 规则三：每张图都有授权。 */
export const photoLicenceProblems = (
  content: AskContent,
  credits: Map<string, Credit>,
): Finding[] => {
  const findings: Finding[] = [];
  let total = 0;
  content.segments.forEach((segment, i) => {
    for (const photo of segment.photos ?? []) {
      total += 1;
      const where = `segments[${i}]`;
      if (photo.file.trim().length === 0) {
        findings.push({ rule: "photo-licence", detail: `${where}: 有一张图没有文件名` });
        continue;
      }
      const credit = credits.get(photo.file);
      if (!credit) {
        findings.push({
          rule: "photo-licence",
          detail: `${where}: ${photo.file} 没有登记在 public/images/credits.json`,
        });
      } else if (credit.license.trim().length === 0) {
        findings.push({
          rule: "photo-licence",
          detail: `${where}: ${photo.file} 在台账里的许可为空`,
        });
      } else if (photo.credit.trim().length === 0) {
        findings.push({
          rule: "photo-licence",
          detail: `${where}: ${photo.file} 的片内署名是空的——重跑 \`npm run ask:build\``,
        });
      }
    }
  });
  if (total === 0) {
    findings.push({ rule: "photo-licence", detail: "这一集一张图都没有——实物照是必需的" });
  }
  return findings;
};

/**
 * 系列总封面的五件事：说得出自己是什么、措辞不越线、免责声明在场、
 * 文字不出平台 UI 区、那张照片在台账里对得上。
 *
 * 封面不归那三条内容规则管——它不是一集，没有旁白也没有引文。但它比任何一集的第 0 帧
 * 都更常被看到（合集入口、账号主页、别人的推荐位），而平台的处罚落在文字上，不落在
 * "这是系列图还是单集图"上。所以同一套措辞函数照扫，外加账号定位词
 * （`OFF_POSITION_WORDS`——单集台账不扫它，封面扫，因为封面上的「养生」比描述里的更难撤）。
 *
 * 几何那两条是这一系列最硬的版式线：底部 25% 是平台 UI 区，字压上去会被标题条切掉；
 * 行宽顶出内容列在 1080 宽的静帧上看不出来，缩到信息流的 200px 才看得出来。
 *
 * 照片那一条与规则三同源：封面用的也是一张开放授权实物照，署名一旦与台账各说一套，
 * 在平台上撤下来的是我们。
 */
export const seriesCoverProblems = (
  rows: CoverRow[],
  photo: CoverPhoto,
  credits: Map<string, Credit>,
): Finding[] => {
  const findings: Finding[] = [];

  const title = rows.find((row) => row.kind === "title");
  if (!title || title.lines.join("").trim().length === 0) {
    findings.push({ rule: "cover-title", detail: "封面上没有系列名——那它就不是系列封面" });
  }

  const credit = credits.get(photo.file);
  if (!credit) {
    findings.push({
      rule: "cover-photo",
      detail: `${photo.file} 没有登记在 public/images/credits.json`,
    });
  } else if (credit.license.trim().length === 0) {
    findings.push({ rule: "cover-photo", detail: `${photo.file} 在台账里的许可为空` });
  } else {
    const expected = creditLine(credit);
    if (photo.credit !== expected) {
      findings.push({
        rule: "cover-photo",
        detail: `封面署名是「${photo.credit}」，台账写的是「${expected}」`,
      });
    }
  }

  for (const row of rows) {
    const text = row.lines.join("");
    for (const word of claimWordingProblems(text)) {
      findings.push({ rule: "cover-wording", detail: `${row.kind} 里有功效措辞 "${word}"` });
    }
    for (const word of OFF_POSITION_WORDS) {
      if (text.includes(word)) {
        findings.push({
          rule: "cover-positioning",
          detail: `${row.kind} 里有 "${word}" —— 账号定位是文化/读书`,
        });
      }
    }
    if (rowBottom(row) > COVER_TEXT_FLOOR) {
      findings.push({
        rule: "cover-geometry",
        detail: `${row.kind} 的底边在 y=${Math.round(rowBottom(row))}，越过平台 UI 线 ${COVER_TEXT_FLOOR}`,
      });
    }
    for (const line of row.lines) {
      const w = rowWidth(line, row.size, row.letterSpacing);
      if (w > COVER_COLUMN) {
        findings.push({
          rule: "cover-geometry",
          detail: `${row.kind} 的「${line}」约 ${Math.round(w)}px，超出内容列 ${COVER_COLUMN}px`,
        });
      }
    }
  }

  if (!rows.some((row) => row.lines.some((line) => line.includes(COVER_DISCLAIMER)))) {
    findings.push({
      rule: "cover-disclaimer",
      detail: `封面上没有「${COVER_DISCLAIMER}」`,
    });
  }
  return findings;
};
