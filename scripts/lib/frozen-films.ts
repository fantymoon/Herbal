// Films that were already published to the platforms before 2026-09-21.
// They are FROZEN: their masters are live copies, so the newer compliance rules
// (功效框架 / 注释块 / 字号下限 / 时长弹性 / 重复文本) are NOT applied to them.
//
// Rules for this file:
//   - Never add a new film here. A new film must satisfy the current rules instead.
//   - The list may only shrink (a frozen film may be retired and re-made).
//   - tests/compliance.test.ts and tests/repeat-scan.test.ts read this list.

export const FROZEN_FILMS: readonly string[] = [
  "angelica-fourth-film-real-photo.tsx",
  "angelica-fourth-film.tsx",
  "baihao-first-film.tsx",
  "baiqing-first-film.tsx",
  "baishiying-first-film.tsx",
  "baiying-first-film.tsx",
  "baizhi-first-film.tsx",
  "bajitian-first-film.tsx",
  "bianqing-first-film.tsx",
  "bupleurum-third-film.tsx",
  "changpu-first-film.tsx",
  "cheqianzi-first-film.tsx",
  "chijian-first-film.tsx",
  "chizhi-first-film.tsx",
  "chongweizi-first-film.tsx",
  "dansha-first-film.tsx",
  "duhuo-first-film.tsx",
  "ephedra-first-film.tsx",
  "fangkui-first-film.tsx",
  "gandihuang-first-film.tsx",
  "ginseng-first-film.tsx",
  "huangqi-first-film.tsx",
  "huashi-first-film.tsx",
  "juhua-first-film.tsx",
  "kongqing-first-film.tsx",
  "licorice-second-film.tsx",
  "longdan-first-film.tsx",
  "maimendong-first-film.tsx",
  "muxiang-first-film.tsx",
  "nieshi-first-film.tsx",
  "niuxi-first-film.tsx",
  "nvwei-first-film.tsx",
  "peony-second-film.tsx",
  "puxiao-first-film.tsx",
  "qingzhi-first-film.tsx",
  "shihu-first-film.tsx",
  "shishi-first-film.tsx",
  "shizhongru-first-film.tsx",
  "shu-first-film.tsx",
  "shuyu-first-film.tsx",
  "taiyi-first-film.tsx",
  "tianmendong-first-film.tsx",
  "tusizi-first-film.tsx",
  "xiaoshi-first-film.tsx",
  "xixin-first-film.tsx",
  "xizi-first-film.tsx",
  "yanlvzi-first-film.tsx",
  "yiyiren-first-film.tsx",
  "yuanzhi-first-film.tsx",
  "yunmu-first-film.tsx",
  "yuquan-first-film.tsx",
  "yuyuliang-first-film.tsx",
  "zengqing-first-film.tsx",
  "zexie-first-film.tsx",
  "zishiying-first-film.tsx",
];

export const isFrozen = (file: string): boolean => FROZEN_FILMS.includes(file);
