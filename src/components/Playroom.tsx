/** Soft, low-contrast playroom backdrop built from SVG layers. */
export function Playroom() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <defs>
          <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF1D6" />
            <stop offset="100%" stopColor="#F7DFB6" />
          </linearGradient>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8FD3FF" />
            <stop offset="100%" stopColor="#CDEEFF" />
          </linearGradient>
          <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E7B77B" />
            <stop offset="100%" stopColor="#D39A5B" />
          </linearGradient>
        </defs>
        <rect width="1440" height="900" fill="url(#wall)" />
        {/* window */}
        <g>
          <rect x="380" y="40" width="420" height="300" rx="26" fill="#F6D9A8" />
          <rect x="398" y="58" width="384" height="264" rx="18" fill="url(#sky)" />
          <circle cx="470" cy="130" r="34" fill="#FFF6D8" opacity="0.9" />
          <ellipse cx="600" cy="150" rx="60" ry="26" fill="#ffffff" opacity="0.85" />
          <ellipse cx="700" cy="200" rx="48" ry="22" fill="#ffffff" opacity="0.7" />
          <rect x="586" y="58" width="10" height="264" fill="#F6D9A8" />
        </g>
        {/* shelf with books */}
        <g opacity="0.9">
          <rect x="900" y="150" width="330" height="18" rx="8" fill="#C98F55" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect
              key={i}
              x={915 + i * 46}
              y={90 + (i % 2) * 10}
              width="34"
              height={60 - (i % 2) * 10}
              rx="6"
              fill={["#F2434F", "#2E7CF6", "#1FB45A", "#FFC629", "#F2434F", "#2E7CF6"][i]}
              opacity="0.75"
            />
          ))}
        </g>
        {/* plants */}
        <g opacity="0.85">
          <rect x="1250" y="300" width="80" height="70" rx="14" fill="#D98A5B" />
          {[0, 1, 2, 3].map((i) => (
            <ellipse
              key={i}
              cx={1290 + (i - 1.5) * 26}
              cy={270 - (i % 2) * 26}
              rx="22"
              ry="34"
              fill="#3E9E5F"
              opacity="0.8"
            />
          ))}
        </g>
        {/* floor + rug */}
        <rect y="620" width="1440" height="280" fill="url(#floor)" />
        <ellipse cx="720" cy="800" rx="560" ry="150" fill="#8FB7E8" opacity="0.5" />
        {/* toy blocks */}
        <g opacity="0.8">
          <rect x="80" y="700" width="70" height="70" rx="12" fill="#2E7CF6" />
          <rect x="160" y="720" width="60" height="60" rx="12" fill="#1FB45A" />
          <rect x="1240" y="690" width="70" height="70" rx="12" fill="#FFC629" />
          <rect x="1320" y="730" width="56" height="56" rx="12" fill="#F2434F" />
        </g>
      </svg>
      <div className="absolute inset-0 bg-panel/25 backdrop-blur-[2px]" />
    </div>
  );
}
