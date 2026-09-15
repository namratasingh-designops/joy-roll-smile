import { describe, expect, it } from "vitest";
import {
  DEFAULT_RULES,
  applyMove,
  createGame,
  legalMoves,
  nextTurn,
  pickBuddyMove,
  registerStuckTurn,
  rollDie,
  type GameState,
} from "./rules";
import { HOME_STEPS, START_INDEX, LOOP, isSafeLoopIndex } from "./board";

const defs = [
  { color: "blue" as const, name: "You", isHuman: true },
  { color: "red" as const, name: "Red", isHuman: false },
];

/** Two tokens each keeps these assertions readable; the app now picks 2–4. */
function game(over: Partial<typeof DEFAULT_RULES> = {}): GameState {
  return createGame(defs, { ...DEFAULT_RULES, tokensPerPlayer: 2, ...over });
}

describe("board geometry", () => {
  it("has a 52 cell loop with 13 squares between starts", () => {
    expect(LOOP).toHaveLength(52);
    expect(START_INDEX.red - START_INDEX.blue).toBe(13);
    expect(isSafeLoopIndex(START_INDEX.blue)).toBe(true);
    expect(isSafeLoopIndex((START_INDEX.blue + 8) % 52)).toBe(true);
    expect(isSafeLoopIndex((START_INDEX.blue + 3) % 52)).toBe(false);
  });
});

describe("leaving base", () => {
  it("easy mode lets a 1 or a 6 out", () => {
    const s = game({ easyExit: true });
    expect(legalMoves(s, 1)).toHaveLength(2);
    expect(legalMoves(s, 6)).toHaveLength(2);
    expect(legalMoves(s, 3)).toHaveLength(0);
  });

  it("classic mode needs a 6", () => {
    const s = game({ easyExit: false });
    expect(legalMoves(s, 1)).toHaveLength(0);
    expect(legalMoves(s, 6)).toHaveLength(2);
  });

  it("grants a lucky roll after two stuck turns", () => {
    let s = game();
    s = registerStuckTurn(s);
    s = registerStuckTurn(s);
    s = nextTurn(nextTurn(s)); // back to blue
    expect(s.lucky).toBe(true);
    expect(legalMoves(s, 3).length).toBeGreaterThan(0);
  });
});

describe("moving", () => {
  it("walks the dice count and records the path", () => {
    const s = game();
    s.players[0]!.tokens[0]!.steps = 4;
    const move = legalMoves(s, 3).find((m) => m.kind === "walk")!;
    expect(move.to).toBe(7);
    expect(move.path).toEqual([5, 6, 7]);
  });

  it("gives an extra turn on a six", () => {
    const s = game();
    const move = legalMoves(s, 6)[0]!;
    const res = applyMove(s, move, 6);
    expect(res.extraTurn).toBe(true);
    expect(applyMove(s, move, 4).extraTurn).toBe(false);
  });
});

describe("bumping", () => {
  it("sends an opponent on a plain square back to base", () => {
    const s = game();
    s.players[0]!.tokens[0]!.steps = 3; // blue moves to loop index 5
    s.players[1]!.tokens[0]!.steps = (5 - START_INDEX.red + 52) % 52; // red waiting there
    const move = legalMoves(s, 1).find((m) => m.kind === "walk")!;
    expect(move.bumps).toContain("red-1");
    const res = applyMove(s, move, 1);
    expect(res.state.players[1]!.tokens[0]!.steps).toBe(-1);
    expect(res.events.some((e) => e.type === "bump")).toBe(true);
  });

  it("never bumps on a safe square", () => {
    const s = game();
    s.players[0]!.tokens[0]!.steps = 7; // moving to start+8 = star square
    s.players[1]!.tokens[0]!.steps =
      ((START_INDEX.blue + 8) % 52 || 52) - START_INDEX.red < 0
        ? (START_INDEX.blue + 8 - START_INDEX.red + 52) % 52
        : (START_INDEX.blue + 8 - START_INDEX.red + 52) % 52;
    const move = legalMoves(s, 1).find((m) => m.kind === "walk")!;
    expect(move.landsSafe).toBe(true);
    expect(move.bumps).toHaveLength(0);
  });

  it("friendly mode turns bumping off", () => {
    const s = game({ friendly: true });
    s.players[0]!.tokens[0]!.steps = 3;
    s.players[1]!.tokens[0]!.steps = (5 - START_INDEX.red + 52) % 52;
    const move = legalMoves(s, 1).find((m) => m.kind === "walk")!;
    expect(move.bumps).toHaveLength(0);
  });
});

describe("finishing", () => {
  it("easy finish accepts an overshoot", () => {
    const s = game({ easyFinish: true });
    s.players[0]!.tokens[0]!.steps = HOME_STEPS - 2;
    const move = legalMoves(s, 5).find((m) => m.kind === "walk")!;
    expect(move.to).toBe(HOME_STEPS);
    expect(move.landsHome).toBe(true);
  });

  it("classic finish needs the exact roll", () => {
    const s = game({ easyFinish: false });
    s.players[0]!.tokens[0]!.steps = HOME_STEPS - 2;
    expect(legalMoves(s, 5).some((m) => m.kind === "walk")).toBe(false);
    expect(legalMoves(s, 2).some((m) => m.to === HOME_STEPS)).toBe(true);
  });

  it("ends the game and ranks players when one player is home", () => {
    const s = game();
    s.players[0]!.tokens[0]!.steps = HOME_STEPS;
    s.players[0]!.tokens[1]!.steps = HOME_STEPS - 1;
    const move = legalMoves(s, 1).find((m) => m.landsHome)!;
    const res = applyMove(s, move, 1);
    expect(res.state.ranking[0]).toBe("blue");
    expect(res.events.some((e) => e.type === "gameOver")).toBe(true);
  });
});

describe("turn order and dice", () => {
  it("skips players that already finished", () => {
    const s = game();
    s.players[1]!.tokens.forEach((t) => (t.steps = HOME_STEPS));
    expect(nextTurn(s).turn).toBe(0);
  });

  it("rolls between 1 and 6", () => {
    for (let i = 0; i < 200; i++) {
      const d = rollDie();
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(6);
    }
    expect(rollDie(() => 0)).toBe(1);
    expect(rollDie(() => 0.999)).toBe(6);
  });

  it("buddy prefers a bump", () => {
    const s = game();
    s.players[0]!.tokens[0]!.steps = 3;
    s.players[1]!.tokens[0]!.steps = (5 - START_INDEX.red + 52) % 52;
    const moves = legalMoves({ ...s, turn: 0 }, 1);
    expect(pickBuddyMove(moves)!.bumps.length).toBeGreaterThan(0);
    expect(pickBuddyMove([])).toBeNull();
  });
});
