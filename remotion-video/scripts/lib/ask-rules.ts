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
import type { AskContent } from "../../src/asks/types.ts";
import type { Credit } from "./ask.ts";

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
