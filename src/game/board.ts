/**
 * Pure board geometry for a classic 15x15 Ludo board.
 * No UI imports. Coordinates are [col, row] with row 0 at the top.
 */

export type Color = "blue" | "red" | "green" | "yellow";

export const COLORS: Color[] = ["blue", "red", "green", "yellow"];

/** Symbol shown on tokens/bases/cards so colour is never the only cue. */
export const COLOR_SYMBOL: Record<Color, string> = {
  blue: "●",
  red: "♥",
  green: "▲",
  yellow: "■",
};

export const COLOR_NAME: Record<Color, string> = {
  blue: "Blue",
  red: "Red",
  green: "Green",
  yellow: "Yellow",
};

export const COLOR_HEX: Record<Color, string> = {
  blue: "#2E7CF6",
  red: "#F2434F",
  green: "#1FB45A",
  yellow: "#FFC629",
};

export type Cell = readonly [number, number];

function seg(from: Cell, to: Cell): Cell[] {
  const out: Cell[] = [];
  const dc = Math.sign(to[0] - from[0]);
  const dr = Math.sign(to[1] - from[1]);
  let c = from[0];
  let r = from[1];
  for (;;) {
    out.push([c, r] as const);
    if (c === to[0] && r === to[1]) break;
    c += dc;
    r += dr;
  }
  return out;
}

/** The 52-cell main loop, walked clockwise starting at [0,6]. */
export const LOOP: Cell[] = [
  ...seg([0, 6], [5, 6]),
  ...seg([6, 5], [6, 0]),
  [7, 0],
  ...seg([8, 0], [8, 5]),
  ...seg([9, 6], [14, 6]),
  [14, 7],
  ...seg([14, 8], [9, 8]),
  ...seg([8, 9], [8, 14]),
  [7, 14],
  ...seg([6, 14], [6, 9]),
  ...seg([5, 8], [0, 8]),
  [0, 7],
];

/** Loop index of each colour's start square. */
export const START_INDEX: Record<Color, number> = {
  blue: 1,
  red: 14,
  green: 27,
  yellow: 40,
};

/** 6 home-lane cells per colour, ordered outside -> centre. */
export const HOME_LANE: Record<Color, Cell[]> = {
  blue: seg([1, 7], [6, 7]),
  red: seg([7, 1], [7, 6]),
  green: seg([13, 7], [8, 7]),
  yellow: seg([7, 13], [7, 8]),
};

export const CENTRE: Cell = [7, 7];

/** Base pad (4 token slots) per colour. */
export const BASE_SLOTS: Record<Color, Cell[]> = {
  blue: [
    [1.6, 10.6],
    [4.0, 10.6],
    [1.6, 12.8],
    [4.0, 12.8],
  ],
  red: [
    [1.6, 1.6],
    [4.0, 1.6],
    [1.6, 3.8],
    [4.0, 3.8],
  ],
  green: [
    [10.6, 1.6],
    [12.8, 1.6],
    [10.6, 3.8],
    [12.8, 3.8],
  ],
  yellow: [
    [10.6, 10.6],
    [12.8, 10.6],
    [10.6, 12.8],
    [12.8, 12.8],
  ],
};

export const BASE_ORIGIN: Record<Color, Cell> = {
  blue: [0, 9],
  red: [0, 0],
  green: [9, 0],
  yellow: [9, 9],
};

/** Loop steps a token walks before entering its home lane. */
export const LOOP_STEPS = 51; // steps 0..50
export const LANE_START = LOOP_STEPS; // steps 51..56
export const HOME_STEPS = 57; // token is home

/** Star (safe) squares: every colour's start square + start+8. */
export const SAFE_LOOP_INDEXES: number[] = COLORS.flatMap((c) => [
  START_INDEX[c],
  (START_INDEX[c] + 8) % LOOP.length,
]);

export const STAR_LOOP_INDEXES: number[] = COLORS.map(
  (c) => (START_INDEX[c] + 8) % LOOP.length,
);

export function isSafeLoopIndex(i: number): boolean {
  return SAFE_LOOP_INDEXES.includes(i);
}

/** Absolute loop index for a colour at a given step (0..50), else -1. */
export function loopIndexOf(color: Color, steps: number): number {
  if (steps < 0 || steps >= LOOP_STEPS) return -1;
  return (START_INDEX[color] + steps) % LOOP.length;
}

/** Board cell for a token, or null when it is still in its base. */
export function cellOf(color: Color, steps: number, slot = 0): Cell {
  if (steps < 0) return BASE_SLOTS[color][slot % 4]!;
  if (steps < LOOP_STEPS) return LOOP[loopIndexOf(color, steps)]!;
  if (steps < HOME_STEPS) return HOME_LANE[color][steps - LANE_START]!;
  return CENTRE;
}

/** 1-based human friendly square number for announcements. */
export function squareLabel(color: Color, steps: number): string {
  if (steps < 0) return "in base";
  if (steps >= HOME_STEPS) return "home";
  if (steps >= LANE_START) return `home lane square ${steps - LANE_START + 1}`;
  return `square ${steps + 1}`;
}
