import type { Formula } from "./herbal-data";
import { ink, mutedInk, sealRed } from "./herbal-stage";

export const fade = (frame: number, start: number, end: number) =>
  Math.max(0, Math.min(1, (frame - start) / Math.max(1, end - start)));

export const rise = (frame: number, start: number, distance = 22) => {
  const progress = fade(frame, start, start + 24);
  return distance * (1 - progress);
};

export const rotateIn = (frame: number, start: number, degrees = -5) => {
  const progress = fade(frame, start, start + 24);
  return degrees * (1 - progress);
};

export const HerbChip: React.FC<{
  name: string;
  tone: string;
  subtext: string;
  frame: number;
  delay: number;
  wide: boolean;
}> = ({ name, tone, subtext, frame, delay, wide }) => {
  const appear = fade(frame, delay, delay + 20);
  const offset = rise(frame, delay, 14);
  const tilt = rotateIn(frame, delay, wide ? -4 : -2);

  return (
    <div
      style={{
        width: wide ? 136 : 122,
        height: wide ? 136 : 122,
        borderRadius: 999,
        border: "1px solid rgba(23, 23, 22, .24)",
        backgroundColor: tone,
        boxShadow: "0 12px 24px rgba(23, 23, 22, .08)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: ink,
        transform: `translateY(${offset}px) rotate(${tilt}deg)`,
        opacity: appear,
      }}
    >
      <div
        style={{
          fontFamily: "STKaiti, KaiTi, serif",
          fontSize: wide ? 25 : 22,
          lineHeight: 1,
          marginBottom: 6,
        }}
      >
        {name}
      </div>
      <div style={{ color: mutedInk, fontSize: 11, letterSpacing: 0 }}>{subtext}</div>
    </div>
  );
};

export const IngredientList: React.FC<{
  formula: Formula;
  accent?: string;
  compact?: boolean;
}> = ({ formula, accent = sealRed, compact = false }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: compact ? "1fr 1fr" : "1fr",
      gap: compact ? 16 : 14,
      width: "100%",
    }}
  >
    {formula.ingredients.map((ingredient) => (
      <div
        key={ingredient.name}
        style={{
          display: "grid",
          gridTemplateColumns: compact ? "1fr auto" : "auto 1fr auto",
          columnGap: compact ? 16 : 14,
          alignItems: "baseline",
          borderBottom: "1px solid rgba(23, 23, 22, .18)",
          paddingBottom: compact ? 12 : 8,
        }}
      >
        <span
          style={{
            fontFamily: "STKaiti, KaiTi, serif",
            fontSize: compact ? 60 : 30,
            lineHeight: 1,
          }}
        >
          {ingredient.name}
        </span>
        {!compact ? <span style={{ color: mutedInk, fontSize: 15 }}>{ingredient.role}</span> : null}
        <span style={{ color: accent, fontSize: compact ? 28 : 16, fontWeight: 700 }}>{ingredient.amount}</span>
      </div>
    ))}
  </div>
);

export const RootIllustration: React.FC<{ frame: number; orientation: "wide" | "tall" }> = ({
  frame,
  orientation,
}) => {
  const appear = fade(frame, 4, 22);
  const drift = rise(frame, 0, orientation === "wide" ? 18 : 22);

  return (
    <div
      style={{
        position: "absolute",
        right: orientation === "wide" ? 74 : 64,
        top: orientation === "wide" ? 118 : 280,
        width: orientation === "wide" ? 260 : 180,
        height: orientation === "wide" ? 220 : 160,
        opacity: appear,
        transform: `translateY(${drift}px)`,
      }}
    >
      <svg viewBox="0 0 260 220" width="100%" height="100%" aria-hidden="true">
        <defs>
          <filter id="rootSoft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.8" />
          </filter>
        </defs>
        <ellipse cx="92" cy="140" rx="56" ry="28" fill="#7d6247" opacity="0.18" filter="url(#rootSoft)" />
        <path d="M106 28 C84 54 86 72 98 98 C113 129 110 153 94 183" stroke="#4d3b2b" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.85" />
        <path d="M110 38 C130 58 144 76 152 102 C161 131 176 152 190 176" stroke="#4d3b2b" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.75" />
        <path d="M96 118 C122 126 146 130 172 122" stroke="#694d34" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.7" />
        <ellipse cx="86" cy="60" rx="34" ry="22" fill="#e7d6b6" opacity="0.92" />
        <ellipse cx="164" cy="76" rx="30" ry="18" fill="#eadfca" opacity="0.9" />
        <ellipse cx="108" cy="116" rx="28" ry="18" fill="#ecd8b3" opacity="0.94" />
        <ellipse cx="152" cy="150" rx="26" ry="16" fill="#e6d1ab" opacity="0.92" />
        <path d="M66 26 C54 18 44 14 30 16" stroke="#4d3b2b" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M170 26 C184 18 194 14 210 16" stroke="#4d3b2b" strokeWidth="4" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
};
