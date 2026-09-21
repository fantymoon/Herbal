import type { ReactNode } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { staticFile, Img } from "remotion";

export const paper = "#f2ecdf";
export const ink = "#171716";
export const mutedInk = "#6f6a61";
export const sealRed = "#9d3527";

export const SceneShell: React.FC<{
  accent: string;
  mode: "wide" | "tall";
  children: ReactNode;
  durationInFrames?: number;
}> = ({ accent, mode, children, durationInFrames }) => {
  const { durationInFrames: compositionDuration } = useVideoConfig();
  const resolvedDuration = durationInFrames ?? compositionDuration;
  const borderInset = mode === "wide" ? 54 : 38;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: paper,
        overflow: "hidden",
        scale: 1.002,
      }}
      durationInFrames={resolvedDuration}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 20% 18%, rgba(113, 93, 60, .09) 0 1px, transparent 1px), radial-gradient(circle at 76% 24%, rgba(113, 93, 60, .07) 0 1px, transparent 1px), radial-gradient(circle at 44% 68%, rgba(113, 93, 60, .05) 0 1px, transparent 1px)",
          backgroundSize: "11px 11px, 17px 17px, 23px 23px",
          opacity: 0.45,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: "inset 0 0 80px rgba(72, 60, 39, .12)",
        }}
      />
      <InkLandscape mode={mode} />
      <div
        style={{
          position: "absolute",
          inset: borderInset,
          border: "1px solid rgba(23, 23, 22, .25)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 18,
          right: 22,
          color: accent,
          fontSize: mode === "tall" ? 18 : 12,
          fontWeight: 700,
          letterSpacing: 0,
          opacity: 0.8,
        }}
      >
        TCM / HERBAL
      </div>
      {children}
    </AbsoluteFill>
  );
};

export const InkLandscape: React.FC<{ mode: "wide" | "tall" }> = ({ mode }) => {
  const isTall = mode === "tall";
  return (
    <svg
      viewBox={isTall ? "0 0 1080 1920" : "0 0 1280 720"}
      preserveAspectRatio="none"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      aria-hidden="true"
    >
      <defs>
        <filter id="mist" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <filter id="softInk" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <g opacity="0.22" filter="url(#mist)">
        <ellipse
          cx={isTall ? 245 : 205}
          cy={isTall ? 1320 : 500}
          rx={isTall ? 215 : 190}
          ry={isTall ? 82 : 48}
          fill="#fbfaf7"
        />
        <ellipse
          cx={isTall ? 760 : 760}
          cy={isTall ? 1390 : 540}
          rx={isTall ? 270 : 240}
          ry={isTall ? 92 : 56}
          fill="#fbfaf7"
        />
        <ellipse
          cx={isTall ? 580 : 490}
          cy={isTall ? 1460 : 570}
          rx={isTall ? 320 : 280}
          ry={isTall ? 100 : 64}
          fill="#fbfaf7"
        />
      </g>
      <g opacity="0.82">
        <path
          d={
            isTall
              ? "M0 1530 C110 1410 210 1480 300 1392 C382 1314 502 1240 626 1280 C748 1320 854 1254 1080 1330 L1080 1920 L0 1920 Z"
              : "M0 520 C92 454 172 474 250 432 C318 394 374 362 482 382 C584 402 653 350 748 370 C848 392 926 444 1080 404 L1280 396 L1280 720 L0 720 Z"
          }
          fill="#6b645b"
          opacity="0.16"
          filter="url(#softInk)"
        />
        <path
          d={
            isTall
              ? "M0 1620 C120 1500 186 1550 274 1476 C356 1408 414 1368 526 1410 C642 1452 748 1404 860 1458 C940 1498 1006 1460 1080 1506 L1080 1920 L0 1920 Z"
              : "M0 540 C102 482 146 506 224 474 C306 438 372 408 452 424 C530 442 604 406 698 420 C786 432 884 486 980 452 C1044 430 1112 414 1280 444 L1280 720 L0 720 Z"
          }
          fill="#4d4740"
          opacity="0.22"
          filter="url(#softInk)"
        />
        <path
          d={
            isTall
              ? "M0 1650 C82 1544 160 1582 236 1530 C312 1480 386 1450 474 1492 C566 1532 644 1494 732 1528 C816 1560 924 1510 1080 1560 L1080 1920 L0 1920 Z"
              : "M0 548 C84 500 156 516 216 492 C292 462 382 446 460 462 C534 476 620 452 692 466 C780 482 868 524 950 492 C1030 464 1138 460 1280 486 L1280 720 L0 720 Z"
          }
          fill="#2a2621"
          opacity="0.26"
        />
      </g>
      <g opacity="0.18" stroke="#2b2722" strokeWidth="2" fill="none">
        <path
          d={
            isTall
              ? "M70 210 C140 156 180 170 246 124"
              : "M60 92 C116 54 146 60 204 26"
          }
        />
        <path
          d={
            isTall
              ? "M840 280 C910 232 950 246 1018 198"
              : "M965 120 C1030 78 1060 86 1122 42"
          }
        />
        <path
          d={
            isTall
              ? "M124 274 C176 236 208 244 256 204"
              : "M162 128 C214 94 248 96 286 60"
          }
        />
      </g>
      <g opacity="0.34" fill="#2b2722">
        <circle
          cx={isTall ? 168 : 150}
          cy={isTall ? 252 : 88}
          r={isTall ? 3.2 : 2.8}
        />
        <circle
          cx={isTall ? 196 : 188}
          cy={isTall ? 276 : 102}
          r={isTall ? 2.4 : 2.2}
        />
        <circle
          cx={isTall ? 230 : 236}
          cy={isTall ? 290 : 114}
          r={isTall ? 2.2 : 2.0}
        />
      </g>
    </svg>
  );
};

export const Seal: React.FC<{
  text: string;
  size?: number;
  glyphScale?: number;
  rotation?: number;
}> = ({ text, size = 74, glyphScale = 0.28, rotation = -4 }) => (
  <div
    style={{
      width: size,
      height: size,
      border: `2px solid ${sealRed}`,
      color: sealRed,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "STKaiti, KaiTi, serif",
      fontSize: size * glyphScale,
      writingMode: "vertical-rl",
      transform: `rotate(${rotation}deg)`,
      boxSizing: "border-box",
    }}
  >
    {text}
  </div>
);

export const SectionLabel: React.FC<{
  children: ReactNode;
  accent?: string;
  size?: number;
}> = ({ children, accent = sealRed, size = 13 }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      color: accent,
      fontFamily: "Arial, sans-serif",
      fontSize: size,
      fontWeight: 700,
      letterSpacing: 0,
    }}
  >
    <span
      style={{
        width: size >= 20 ? 46 : 34,
        height: size >= 20 ? 3 : 2,
        backgroundColor: accent,
      }}
    />
    <span>{children}</span>
  </div>
);

const fade = (frame: number, start: number, end: number) =>
  Math.max(0, Math.min(1, (frame - start) / Math.max(1, end - start)));

const rotateIn = (frame: number, start: number, degrees = -5) => {
  const progress = fade(frame, start, start + 24);
  return degrees * (1 - progress);
};

export const SignMark: React.FC<{
  frame: number;
  size?: number;
  rotation?: number;
}> = ({ frame, size = 72, rotation = -6 }) => {
  const appear = fade(frame, 18, 36);
  const tilt = rotateIn(frame, 18, rotation);

  return (
    <div
      style={{
        width: size,
        height: size,
        opacity: appear,
        transform: `rotate(${tilt}deg)`,
        filter: "drop-shadow(0 2px 4px rgba(23, 23, 22, .12))",
      }}
    >
      <Img
        src={staticFile("sign-1.png")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          rotate: "0.3deg",
          translate: "5.8px 32.2px",
        }}
        durationInFrames={162}
        from={-1}
      />
    </div>
  );
};
