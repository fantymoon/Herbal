import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { AngelicaFourthFilm } from "./angelica-fourth-film";

export const AngelicaFourthFilmRealPhoto: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [18, 34, 68, 78], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      <AngelicaFourthFilm />
      {frame < 78 ? (
        <div
          style={{
            position: "absolute",
            right: 74,
            top: 1110,
            width: 350,
            padding: "12px 12px 16px",
            border: `1px solid rgba(155, 96, 83, .46)`,
            backgroundColor: "rgba(247, 242, 231, .94)",
            boxShadow: "0 12px 24px rgba(53, 39, 31, .12)",
            opacity,
            zIndex: 4,
          }}
        >
          <Img
            src={staticFile("images/dried-angelica-slices-cc0.jpg")}
            style={{
              display: "block",
              width: "100%",
              height: 300,
              objectFit: "cover",
            }}
          />
          <div
            style={{
              marginTop: 11,
              color: "rgba(23, 23, 22, .78)",
              fontFamily: "Arial, sans-serif",
              fontSize: 18,
              lineHeight: 1.35,
            }}
          >
            REAL MATERIAL / 实物图
          </div>
          <div
            style={{
              marginTop: 4,
              color: "rgba(23, 23, 22, .62)",
              fontFamily: "Arial, sans-serif",
              fontSize: 15,
              lineHeight: 1.35,
            }}
          >
            Fumikas Sagisavas · Wikimedia Commons · CC0 1.0
          </div>
        </div>
      ) : null}
    </>
  );
};
