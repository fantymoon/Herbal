import { Img, interpolate, staticFile } from "remotion";
import { FinishedFilm } from "./finished-shell";
import { fade, rise } from "./herbal-cards";
import { ink, mutedInk, sealRed, SectionLabel, Seal } from "./herbal-stage";
import {
  COVER_BLOCKS,
  openingFor,
  planFilm,
  revealDelay,
  sealGlyph,
  type Block,
  type FilmContent,
} from "./layout";

// Data-driven renderer for new films.
//
// A finished film under the current rules is a ~20-line file that passes its
// content here; the geometry, the type scale, the clearance between blocks and the
// scene split all come from src/layout.ts, where they are unit-tested. The visual
// language matches the 55 hand-written films (same paper, same 74px inset, same
// framed photo insert) so a new film does not look like a different series.

const bodyFont = "'LXGW WenKai', STKaiti, KaiTi, serif";
const latinFont = "Arial, sans-serif";

const BlockView: React.FC<{
  block: Block;
  frame: number;
  delay: number;
  accent: string;
  photoFile: string;
}> = ({ block, frame, delay, accent, photoFile }) => {
  const appear = fade(frame, delay, delay + 26);
  const offset = rise(frame, delay, 18);

  if (block.kind === "photo") {
    return (
      <div
        style={{
          position: "absolute",
          left: block.x,
          top: block.y,
          width: block.width,
          height: block.height,
          padding: 14,
          backgroundColor: "#f7f2e7",
          border: "1px solid rgba(23, 23, 22, .35)",
          boxShadow: "0 18px 36px rgba(47, 38, 25, .14)",
          opacity: appear,
          transform: `translateY(${offset}px)`,
          boxSizing: "border-box",
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
          <Img
            src={staticFile(`images/${photoFile}`)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "50% 50%",
              filter: "saturate(.85) contrast(.95) sepia(.08)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              padding: "14px 16px 13px",
              backgroundColor: "rgba(247, 242, 231, .92)",
              borderTop: `1px solid ${accent}`,
              color: mutedInk,
              fontFamily: latinFont,
              fontSize: block.fontSize,
              fontWeight: 700,
            }}
          >
            {block.detail}
          </div>
        </div>
      </div>
    );
  }

  if (block.kind === "sign") {
    return (
      <div
        style={{
          position: "absolute",
          left: block.x,
          top: block.y,
          width: block.width,
          height: block.height,
          opacity: appear,
          transform: `translateY(${offset}px) rotate(-6deg)`,
        }}
      >
        <Img
          src={staticFile("sign-1.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: "drop-shadow(0 3px 5px rgba(23, 23, 22, .14))",
          }}
        />
      </div>
    );
  }

  if (block.kind === "panel") {
    // The 原文 excerpt plus its citation, in one bordered panel. It sits over the
    // decorative landscape by this point in the scene, so it needs its own backing.
    return (
      <div
        style={{
          position: "absolute",
          left: block.x,
          top: block.y,
          width: block.width,
          height: block.height,
          padding: "24px 28px 26px",
          borderTop: `3px solid ${accent}`,
          backgroundColor: "rgba(247, 242, 231, .82)",
          boxSizing: "border-box",
          opacity: appear,
          transform: `translateY(${offset}px)`,
        }}
      >
        <div
          style={{
            color: ink,
            fontFamily: bodyFont,
            fontSize: block.fontSize,
            lineHeight: 1,
          }}
        >
          {block.text}
        </div>
        <div style={{ marginTop: 14, color: mutedInk, fontSize: 28 }}>{block.detail}</div>
      </div>
    );
  }

  const frameStyle: React.CSSProperties = {
    position: "absolute",
    left: block.x,
    top: block.y,
    width: block.width,
    height: block.height,
    opacity: appear,
    transform: `translateY(${offset}px)`,
  };

  switch (block.kind) {
    case "sectionLabel":
    case "classicalLabel":
    case "translationLabel":
    case "commentaryLabel": {
      // The hero's book line doubles as the cover line. At frame 0 it is the Chinese book
      // name at cover size — the thing that says the film is reading 本草经, which a
      // romanised label at 24px cannot say in a feed thumbnail — and it cross-fades to the
      // romanised label as it settles. Bottom-anchored, so the larger line grows upward
      // instead of reaching the name below it.
      if (block.coverScale && block.detail) {
        const settle = interpolate(frame, [0, 26], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const eased = 1 - (1 - settle) ** 3;
        // The two book lines cross without both sitting at half opacity: the cover line is
        // gone by the time the romanised label is more than a ghost.
        const handover = Math.max(0, Math.min(1, eased * 1.6));
        const drop = (block.coverLift ?? 0) * (1 - eased);
        return (
          <div style={{ ...frameStyle, transform: `translateY(${drop.toFixed(2)}px)` }}>
            <div style={{ opacity: Math.max(0, handover * 1.6 - 0.6) }}>
              <SectionLabel accent={accent} size={block.fontSize}>
                {block.text}
              </SectionLabel>
            </div>
            <div
              style={{
                position: "absolute",
                left: 0,
                bottom: 0,
                opacity: 1 - handover,
                color: ink,
                fontFamily: bodyFont,
                fontSize: block.fontSize * block.coverScale,
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              {block.detail}
            </div>
          </div>
        );
      }
      return (
        <div style={frameStyle}>
          <SectionLabel accent={accent} size={block.fontSize}>
            {block.text}
          </SectionLabel>
        </div>
      );
    }
    case "heroTitle": {
      // Frame 0 is the cover. 抖音 reads that still at roughly a quarter of the canvas, so
      // the settled title is still too small to recognise in a feed; the name therefore
      // opens at the full width of the column and settles into the layout over the first
      // second. `coverScale` is 1 for names that already fill the column.
      const settle = interpolate(frame, [0, 26], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const eased = 1 - (1 - settle) ** 3;
      const boost = block.coverScale ?? 1;
      const scale = 1 + (boost - 1) * (1 - eased);
      // While it is a cover the name sits lower, so that the book line above it and the
      // name together land inside one 16:9 band. See COVER_CENTER_Y.
      const drop = (block.coverLift ?? 0) * (1 - eased);
      return (
        <div
          style={{
            ...frameStyle,
            color: ink,
            fontFamily: bodyFont,
            fontSize: block.fontSize,
            lineHeight: 0.92,
            transformOrigin: "left top",
            transform: `translateY(${drop.toFixed(2)}px) scale(${scale.toFixed(4)})`,
          }}
        >
          {block.text}
        </div>
      );
    }
    case "heroLatin":
      return (
        <div
          style={{
            ...frameStyle,
            color: "rgba(23, 23, 22, .76)",
            fontFamily: latinFont,
            fontSize: block.fontSize,
            fontWeight: 700,
          }}
        >
          {block.text}
        </div>
      );
    case "heroVolume":
      return (
        <div style={{ ...frameStyle, color: accent, fontFamily: bodyFont, fontSize: block.fontSize }}>
          {block.text}
        </div>
      );
    case "hook":
      // The one line on the hero that is not a bibliographic field. A short accent rule
      // on the left is what stops it reading as another subtitle.
      return (
        <div style={{ ...frameStyle, display: "flex", gap: 16 }}>
          <div style={{ width: 4, backgroundColor: accent, flexShrink: 0 }} />
          <div
            style={{
              color: ink,
              fontFamily: bodyFont,
              fontSize: block.fontSize,
              lineHeight: 1.1,
            }}
          >
            {block.text}
          </div>
        </div>
      );
    case "classical": {
      // The plan reserved height for lines broken at the punctuation. A zero-width space
      // does not achieve that: CSS already allows a break between any two CJK characters,
      // so adding an opportunity changes nothing. Each clause becomes its own atomic
      // inline box instead, which cannot be broken internally and can only be broken
      // between — the same rule `clauseLines` used to reserve the height.
      if (block.wrap === "clause") {
        const clauses = (block.text.match(/[^，。、；：！？）」』]*[，。、；：！？）」』]?/g) ?? []).filter(
          (clause) => clause !== "",
        );
        // 句读 in 朱红. The marks are in the text already — the book has always punctuated
        // it — but printing them in the same black as the characters loses the thing that
        // makes a page of 古籍 look like a page of 古籍: the reader's marks are a second
        // hand, added after, and a different colour is how that reads.
        const marked = clauses.map((clause, index) => {
          const trailing = clause.match(/[，。、；：！？）」』]+$/)?.[0] ?? "";
          const body = trailing === "" ? clause : clause.slice(0, -trailing.length);
          return (
            <span key={index} style={{ display: "inline-block" }}>
              {body}
              {trailing === "" ? null : <span style={{ color: sealRed }}>{trailing}</span>}
            </span>
          );
        });
        return (
          <div
            style={{
              ...frameStyle,
              color: ink,
              fontFamily: bodyFont,
              fontSize: block.fontSize,
              lineHeight: 1.35,
              // Columns read right to left, and each clause is atomic so a break can only
              // land between them — the same rule the horizontal layout reserves height by.
              ...(block.vertical === true
                ? { writingMode: "vertical-rl" as const, textOrientation: "upright" as const }
                : {}),
            }}
          >
            {marked}
          </div>
        );
      }
      return (
        <div
          style={{
            ...frameStyle,
            color: ink,
            fontFamily: bodyFont,
            fontSize: block.fontSize,
            lineHeight: 1.35,
          }}
        >
          {block.text}
        </div>
      );
    }
    case "translation":
      return (
        <div
          style={{
            ...frameStyle,
            color: ink,
            fontSize: block.fontSize,
            lineHeight: 1.5,
          }}
        >
          {block.text}
        </div>
      );
    case "commentary":
      return (
        <div
          style={{
            ...frameStyle,
            color: mutedInk,
            fontSize: block.fontSize,
            lineHeight: 1.5,
          }}
        >
          {block.text}
        </div>
      );
    case "closingTitle":
      return (
        <div
          style={{
            ...frameStyle,
            color: ink,
            fontFamily: bodyFont,
            fontSize: block.fontSize,
            lineHeight: 1.05,
          }}
        >
          {block.text}
        </div>
      );
    case "fact":
      return (
        <div style={frameStyle}>
          <div style={{ color: accent, fontSize: 24, fontWeight: 700 }}>{block.detail}</div>
          <div style={{ marginTop: 12, color: ink, fontFamily: bodyFont, fontSize: block.fontSize }}>
            {block.text}
          </div>
        </div>
      );
    case "publicationNote":
      return (
        <div style={{ ...frameStyle, color: mutedInk, fontFamily: bodyFont, fontSize: block.fontSize }}>
          {block.text}
        </div>
      );
    case "disclaimer":
      return (
        <div style={{ ...frameStyle, color: mutedInk, fontSize: block.fontSize }}>{block.text}</div>
      );
    default:
      return null;
  }
};

const SceneView: React.FC<{
  blocks: Block[];
  frame: number;
  accent: string;
  photoFile: string;
  mode: FilmContent["mode"];
}> = ({ blocks, frame, accent, photoFile, mode }) => {
  // A film with a hook opens on its title card; one without keeps the schedule the
  // published films use, so an existing master is unchanged by re-rendering. See
  // `openingFor`.
  const opening = openingFor(blocks.map((block) => block.kind));
  return (
  <>
    {blocks.map((block, index) => (
      <BlockView
        key={`${block.kind}-${index}`}
        block={block}
        frame={frame}
        delay={
          opening === "hero" && COVER_BLOCKS.includes(block.kind)
            ? -26
            : revealDelay(opening, index)
        }
        accent={accent}
        photoFile={photoFile}
      />
    ))}
    {blocks.some((b) => b.kind === "heroTitle") ? (
      <div style={{ position: "absolute", right: 74, top: 72, opacity: fade(frame, 16, 44) }}>
        {/* SKILL.md § Input And Mode: the seal is 药 for a single herb and 方 for a
            formula, so it is read from `mode` rather than hardcoded. */}
        <Seal text={sealGlyph(mode)} size={104} glyphScale={0.55} rotation={-5} />
      </div>
    ) : null}
  </>
  );
};

export const EntryFilm: React.FC<{ content: FilmContent }> = ({ content }) => {
  const plan = planFilm(content);
  const scenes = plan.scenes.map((scene) => {
    const Scene: React.FC<{ frame: number }> = ({ frame }) => (
      <SceneView
        blocks={scene.blocks}
        frame={frame}
        accent={content.accent}
        photoFile={content.photo.file}
        mode={content.mode}
      />
    );
    return Scene;
  });

  return (
    <FinishedFilm
      accent={content.accent}
      durationInFrames={plan.durationInFrames}
      music={staticFile(content.music)}
      // A narrated film keeps the bed under the voice. Measured on the master: the bed alone
      // reads -44.5 dBFS mean against -25.0 with the voice over it, so 0.055 put the music
      // past the point of being felt. 0.08 keeps it there without it disappearing.
      // 0.12 is the level the silent films use, where the music is the only thing there is.
      peakVolume={content.narration === undefined ? 0.12 : 0.08}
      narration={content.narration === undefined ? undefined : staticFile(`voice/${content.id}.mp3`)}
      breaks={plan.breaks}
      scenes={scenes}
    />
  );
};
