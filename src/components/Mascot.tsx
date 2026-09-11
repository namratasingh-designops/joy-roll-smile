import { motion } from "framer-motion";
import type { MascotMood } from "@/game/store";

/**
 * Leo the lion — original SVG mascot. Swap this component for custom art or a
 * Lottie file later; the rest of the app only passes a mood.
 */
export function Mascot({
  mood = "happy",
  size = 150,
  reduced = false,
}: {
  mood?: MascotMood;
  size?: number;
  reduced?: boolean;
}) {
  const bob = reduced
    ? {}
    : {
        animate:
          mood === "cheering" || mood === "clapping"
            ? { y: [0, -10, 0], rotate: [-3, 3, -3] }
            : mood === "waving"
              ? { rotate: [-2, 2, -2] }
              : { y: [0, -4, 0] },
        transition: { duration: mood === "cheering" ? 0.7 : 2.4, repeat: Infinity, ease: "easeInOut" as const },
      };

  const smile =
    mood === "surprised"
      ? "M92 118 q8 -10 16 0"
      : mood === "thinking"
        ? "M90 116 q10 6 20 -2"
        : "M84 112 q16 18 32 0";

  return (
    <motion.svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label={`Leo the lion looks ${mood}`}
      {...bob}
    >
      {/* mane */}
      <g>
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <circle
              key={i}
              cx={100 + Math.cos(a) * 52}
              cy={100 + Math.sin(a) * 52}
              r={26}
              fill={i % 2 ? "#8A5326" : "#A2652F"}
            />
          );
        })}
      </g>
      {/* ears */}
      <circle cx="62" cy="62" r="16" fill="#E8A34A" />
      <circle cx="138" cy="62" r="16" fill="#E8A34A" />
      <circle cx="62" cy="62" r="8" fill="#F6C98B" />
      <circle cx="138" cy="62" r="8" fill="#F6C98B" />
      {/* face */}
      <circle cx="100" cy="100" r="50" fill="#FBC66B" />
      <ellipse cx="100" cy="118" rx="34" ry="26" fill="#FFE9C2" />
      {/* eyes */}
      {mood === "thinking" ? (
        <>
          <path d="M74 92 q10 -8 20 0" stroke="#1F2B5C" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M106 92 q10 -8 20 0" stroke="#1F2B5C" strokeWidth="6" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="84" cy="94" r={mood === "surprised" ? 11 : 9} fill="#1F2B5C" />
          <circle cx="116" cy="94" r={mood === "surprised" ? 11 : 9} fill="#1F2B5C" />
          <circle cx="87" cy="91" r="3.4" fill="#fff" />
          <circle cx="119" cy="91" r="3.4" fill="#fff" />
        </>
      )}
      {/* nose + mouth */}
      <path d="M94 108 h12 l-6 7 z" fill="#C4713A" />
      <path d={smile} stroke="#8A3B1E" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* cheeks */}
      <circle cx="70" cy="112" r="7" fill="#F79A9A" opacity="0.6" />
      <circle cx="130" cy="112" r="7" fill="#F79A9A" opacity="0.6" />
      {/* paw for waving / pointing */}
      {(mood === "waving" || mood === "pointing" || mood === "clapping") && (
        <motion.circle
          cx="158"
          cy="132"
          r="17"
          fill="#F6C98B"
          {...(reduced
            ? {}
            : { animate: { rotate: [0, 12, 0], y: [0, -6, 0] }, transition: { duration: 0.9, repeat: Infinity } })}
          style={{ originX: "158px", originY: "132px" }}
        />
      )}
    </motion.svg>
  );
}

export function SpeechBubble({
  text,
  subtitle,
  className = "",
}: {
  text: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative max-w-[18rem] rounded-3xl bg-panel px-5 py-3 shadow-toy ring-2 ring-white/70 ${className}`}
    >
      <p className="font-display text-lg leading-tight text-ink sm:text-xl">{text}</p>
      {subtitle && <p className="mt-1 text-sm text-ink/70">{subtitle}</p>}
      <span className="absolute -bottom-2 left-8 h-4 w-4 rotate-45 bg-panel" aria-hidden />
    </div>
  );
}
