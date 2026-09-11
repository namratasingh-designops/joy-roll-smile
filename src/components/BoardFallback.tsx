import {
  BASE_ORIGIN,
  CENTRE,
  COLORS,
  COLOR_HEX,
  COLOR_SYMBOL,
  HOME_LANE,
  LOOP,
  STAR_LOOP_INDEXES,
  START_INDEX,
  cellOf,
  type Cell,
} from "@/game/board";
import { useGame } from "@/game/store";

/** 2.5D CSS/SVG board used when WebGL is unavailable. Same rules, same UI. */
export function BoardFallback() {
  const game = useGame((s) => s.game);
  const visual = useGame((s) => s.visual);
  const moves = useGame((s) => s.moves);
  const phase = useGame((s) => s.phase);
  const choose = useGame((s) => s.chooseToken);
  const movable = phase === "choosing" ? moves.map((m) => m.tokenId) : [];

  const tile = (cell: Cell, fill: string, key: string, star = false) => (
    <g key={key}>
      <rect
        x={cell[0] + 0.06}
        y={cell[1] + 0.06}
        width={0.88}
        height={0.88}
        rx={0.16}
        fill={fill}
        stroke="#1F2B5C22"
      />
      {star && (
        <text x={cell[0] + 0.5} y={cell[1] + 0.72} fontSize="0.6" textAnchor="middle" fill="#fff">
          ★
        </text>
      )}
    </g>
  );

  return (
    <svg viewBox="0 0 15 15" className="h-full w-full rounded-3xl bg-wood p-1 shadow-toy" role="img" aria-label="Ludo board">
      <rect x="0" y="0" width="15" height="15" rx="0.6" fill="#FFF7E8" />
      {COLORS.map((c) => (
        <rect
          key={c}
          x={BASE_ORIGIN[c][0]}
          y={BASE_ORIGIN[c][1]}
          width={6}
          height={6}
          rx={0.6}
          fill={COLOR_HEX[c]}
        />
      ))}
      {LOOP.map((cell, i) => {
        const owner = COLORS.find((c) => START_INDEX[c] === i);
        return tile(cell, owner ? COLOR_HEX[owner] : "#FFFDF6", `l${i}`, STAR_LOOP_INDEXES.includes(i));
      })}
      {COLORS.flatMap((c) => HOME_LANE[c].map((cell, i) => tile(cell, COLOR_HEX[c], `h${c}${i}`)))}
      {tile(CENTRE, "#FFF1C9", "centre")}
      {game?.players.flatMap((p) =>
        p.tokens.map((t) => {
          const steps = visual[t.id] ?? t.steps;
          const cell = cellOf(t.color, steps, t.slot);
          const can = movable.includes(t.id);
          return (
            <g
              key={t.id}
              transform={`translate(${cell[0] + 0.5} ${cell[1] + 0.5})`}
              onClick={can ? () => choose(t.id) : undefined}
              style={{ cursor: can ? "pointer" : "default" }}
            >
              <circle r={0.42} fill={COLOR_HEX[t.color]} stroke={can ? "#fff" : "#1F2B5C55"} strokeWidth={can ? 0.12 : 0.05} />
              <text y={0.16} fontSize="0.5" textAnchor="middle" fill="#fff">
                {COLOR_SYMBOL[t.color]}
              </text>
            </g>
          );
        }),
      )}
    </svg>
  );
}
