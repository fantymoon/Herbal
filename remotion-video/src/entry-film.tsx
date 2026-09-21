import { Img, staticFile } from "remotion";
import { FinishedFilm } from "./finished-shell";
import { fade, rise } from "./herbal-cards";
import { ink, mutedInk, SectionLabel, Seal } from "./herbal-stage";
import { planFilm, type Block, type FilmContent } from "./layout";

// Data-driven renderer for new films.
//
// A finished film under the current rules is a ~20-line file that passes its
// content here; the geometry, the type scale, the clearance between blocks and the
// scene split all come from src/layout.ts, where they are unit-tested. The visual
// language matches the 55 hand-written films (same paper, same 74px inset, same
// framed photo insert) so a new film does not look like a different series.

const bodyFont = "STKaiti, KaiTi, serif";
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
    case "commentaryLabel":
      return (
        <div style={frameStyle}>
          <SectionLabel accent={accent} size={block.fontSize}>
            {block.text}
          </SectionLabel>
        </div>
      );
    case "heroTitle":
      return (
        <div
          style={{
            ...frameStyle,
            color: ink,
            fontFamily: bodyFont,
            fontSize: block.fontSize,
            lineHeight: 0.92,
          }}
        >
          {block.text}
        </div>
      );
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
    case "classical":
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

const SceneView: React.FC<{ blocks: Block[]; frame: number; accent: string; photoFile: string }> = ({
  blocks,
  frame,
  accent,
  photoFile,
}) => (
  <>
    {blocks.map((block, index) => (
      <BlockView
        key={`${block.kind}-${index}`}
        block={block}
        frame={frame}
        // Front-loaded stagger: the published films finish revealing by frame ~56 of a
        // 120-frame scene. A 9-frame step would still be fading in the last block at
        // frame 95, so most of the scene would read as half-built.
        delay={2 + index * 4}
        accent={accent}
        photoFile={photoFile}
      />
    ))}
    {blocks.some((b) => b.kind === "heroTitle") ? (
      <div style={{ position: "absolute", right: 74, top: 72, opacity: fade(frame, 16, 44) }}>
        <Seal text="药" size={104} glyphScale={0.55} rotation={-5} />
      </div>
    ) : null}
  </>
);

export const EntryFilm: React.FC<{ content: FilmContent }> = ({ content }) => {
  const plan = planFilm(content);
  const scenes = plan.scenes.map((scene) => {
    const Scene: React.FC<{ frame: number }> = ({ frame }) => (
      <SceneView
        blocks={scene.blocks}
        frame={frame}
        accent={content.accent}
        photoFile={content.photo.file}
      />
    );
    return Scene;
  });

  return (
    <FinishedFilm
      accent={content.accent}
      durationInFrames={plan.durationInFrames}
      music={staticFile(content.music)}
      breaks={plan.breaks}
      scenes={scenes}
    />
  );
};
