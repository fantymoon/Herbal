import { AbsoluteFill, Img, staticFile } from "remotion";
import { AskSeal, brush, CINNABAR, DIM, heavy, Ink, PAPER } from "../ask-film";
import {
  COVER_COLUMN,
  COVER_H,
  COVER_LINE_HEIGHT,
  COVER_PHOTO,
  COVER_RULE,
  COVER_SAFE,
  COVER_SEAL,
  COVER_TEXT_FLOOR,
  COVER_W,
  coverRows,
  type CoverRow,
} from "./series-cover";
import { SEAL_GLYPH } from "./types";

// 「本草一问」的系列总封面。竖屏 1080x1920，单帧。
//
// 这里只**画**：文案与几何在 src/asks/series-cover.ts，因为门禁和测试用 `node --test` 读它，
// 而带 JSX 的文件它读不了。行宽与底边写在 JSX 里，就没有任何东西量得动。
//
// 出图：
//   npx remotion still AskSeriesCover out/asks/covers/bencao-yiwen-cover-v.png
//
// 这张图**不是**任何一集的第 0 帧。单集封面用第 0 帧是对的（问题与实物照都在那一帧上），
// 但系列层面不能拿一味药的果子当门牌——那会把整个系列读成一集。所以大字位置给的是
// 系列名，实物照退到底部那条画面带里，而它选的是全株藤叶，不是任何一集的答案。
//
// 底部 25% 是平台 UI 区：放画面，不放字——与渲染器同一条线。那张照片正是这条线的
// 字面执行：这一区不是留给标题条的空白，是一带本草。
//
// 图上有什么、摆在哪，由 scripts/lib/ask-rules.ts 的 `seriesCoverProblems` 判。

const TONE = { paper: PAPER, dim: DIM } as const;

const Row: React.FC<{ row: CoverRow }> = ({ row }) => {
  const color = TONE[row.tone];
  return (
    <div style={{ position: "absolute", left: COVER_SAFE, top: row.y, width: COVER_COLUMN }}>
      {row.lines.map((line) => (
        <div
          key={line}
          style={{
            color,
            fontFamily: brush,
            fontSize: row.size,
            lineHeight: row.lineHeight ?? COVER_LINE_HEIGHT,
            letterSpacing: row.letterSpacing,
            ...(row.weight > 0 ? heavy(color, row.weight) : {}),
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
};

/** 底部画面带：一张实物照，上沿压一道墨让它坐进封面而不是贴上去。 */
const PhotoBand: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: COVER_TEXT_FLOOR,
      width: COVER_W,
      height: COVER_H - COVER_TEXT_FLOOR,
      overflow: "hidden",
    }}
  >
    <Img
      src={staticFile(`images/${COVER_PHOTO.file}`)}
      style={{
        width: COVER_W,
        height: COVER_H - COVER_TEXT_FLOOR,
        objectFit: "cover",
        objectPosition: COVER_PHOTO.position,
      }}
    />
    <AbsoluteFill
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(23,20,15,.66) 0%, rgba(23,20,15,.16) 36%, rgba(23,20,15,0) 64%)",
      }}
    />
  </div>
);

export const AskSeriesCover: React.FC = () => (
  <AbsoluteFill>
    <Ink />
    <div style={{ position: "absolute", left: COVER_SEAL.x, top: COVER_SEAL.y }}>
      <AskSeal glyph={SEAL_GLYPH.ask} frame={COVER_SEAL.frame} size={COVER_SEAL.size} />
    </div>
    {coverRows.map((row) => (
      <Row key={row.kind} row={row} />
    ))}
    <div
      style={{
        position: "absolute",
        left: COVER_SAFE,
        top: COVER_RULE.y,
        width: COVER_RULE.width,
        height: COVER_RULE.height,
        backgroundColor: CINNABAR,
      }}
    />
    <PhotoBand />
  </AbsoluteFill>
);
