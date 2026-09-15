/**
 * Pure Ludo rules engine + state machine transitions.
 * No UI imports, no side effects, fully unit testable.
 */
import {
  type Color,
  HOME_STEPS,
  LANE_START,
  LOOP_STEPS,
  isSafeLoopIndex,
  loopIndexOf,
} from "./board";

export type { Color };

export interface RuleSettings {
  /** tokens per player: 2, 3 or 4 (usually derived from the player count) */
  tokensPerPlayer: 2 | 3 | 4;
  /** easy: a 1 or a 6 leaves base. classic: only a 6 */
  easyExit: boolean;
  /** easy: reaching or passing home counts. classic: exact roll */
  easyFinish: boolean;
  /** friendly: tokens never get bumped */
  friendly: boolean;
}

export const DEFAULT_RULES: RuleSettings = {
  tokensPerPlayer: 2,
  easyExit: true,
  easyFinish: true,
  friendly: false,
};

export interface Token {
  id: string;
  color: Color;
  slot: number;
  /** -1 base, 0..50 loop, 51..56 home lane, 57 home */
  steps: number;
}

export interface Player {
  color: Color;
  name: string;
  isHuman: boolean;
  /** cartoon face shown on cards, handoff and the turn-order strip */
  avatar: string;
  tokens: Token[];
  /** consecutive turns where no move was possible (drives "Lucky roll!") */
  stuckTurns: number;
}

export interface GameState {
  players: Player[];
  turn: number;
  dice: number | null;
  rules: RuleSettings;
  /** finishing order, best first */
  ranking: Color[];
  lucky: boolean;
}

export interface Move {
  tokenId: string;
  color: Color;
  from: number;
  to: number;
  kind: "exit" | "walk";
  /** ids of tokens sent back to base */
  bumps: string[];
  landsSafe: boolean;
  landsHome: boolean;
  /** steps values the token visits, for animation + counting */
  path: number[];
}

export interface PlayerDef {
  color: Color;
  name: string;
  isHuman: boolean;
  avatar?: string;
}

export function createGame(defs: PlayerDef[], rules: RuleSettings): GameState {
  return {
    players: defs.map((d) => ({
      color: d.color,
      name: d.name,
      isHuman: d.isHuman,
      avatar: d.avatar ?? "🙂",
      stuckTurns: 0,
      tokens: Array.from({ length: rules.tokensPerPlayer }, (_, i) => ({
        id: `${d.color}-${i + 1}`,
        color: d.color,
        slot: i,
        steps: -1,
      })),
    })),
    turn: 0,
    dice: null,
    rules,
    ranking: [],
    lucky: false,
  };
}

export function currentPlayer(s: GameState): Player {
  return s.players[s.turn]!;
}

export function allTokens(s: GameState): Token[] {
  return s.players.flatMap((p) => p.tokens);
}

export function findToken(s: GameState, id: string): Token | undefined {
  return allTokens(s).find((t) => t.id === id);
}

export function playerDone(p: Player): boolean {
  return p.tokens.every((t) => t.steps >= HOME_STEPS);
}

export function tokensHome(p: Player): number {
  return p.tokens.filter((t) => t.steps >= HOME_STEPS).length;
}

function canExit(s: GameState, dice: number): boolean {
  if (s.lucky) return true;
  if (s.rules.easyExit) return dice === 1 || dice === 6;
  return dice === 6;
}

/** Tokens (any colour) standing on the same absolute loop square. */
function occupantsOfLoopIndex(s: GameState, loopIndex: number): Token[] {
  return allTokens(s).filter(
    (t) => t.steps >= 0 && t.steps < LOOP_STEPS && loopIndexOf(t.color, t.steps) === loopIndex,
  );
}

export function legalMoves(s: GameState, dice: number): Move[] {
  const player = currentPlayer(s);
  const moves: Move[] = [];

  for (const token of player.tokens) {
    if (token.steps >= HOME_STEPS) continue;

    if (token.steps < 0) {
      if (!canExit(s, dice)) continue;
      moves.push(buildMove(s, token, 0, "exit", [0]));
      continue;
    }

    const target = token.steps + dice;
    if (target > HOME_STEPS) {
      if (!s.rules.easyFinish) continue;
      const path = rangePath(token.steps, HOME_STEPS);
      moves.push(buildMove(s, token, HOME_STEPS, "walk", path));
      continue;
    }
    // own token already on the target loop square? allow stacking (kid friendly)
    const path = rangePath(token.steps, target);
    moves.push(buildMove(s, token, target, "walk", path));
  }
  return moves;
}

function rangePath(from: number, to: number): number[] {
  const path: number[] = [];
  for (let i = from + 1; i <= to; i++) path.push(i);
  return path;
}

function buildMove(
  s: GameState,
  token: Token,
  to: number,
  kind: "exit" | "walk",
  path: number[],
): Move {
  const loopIndex = loopIndexOf(token.color, to);
  const landsSafe = loopIndex >= 0 && isSafeLoopIndex(loopIndex);
  let bumps: string[] = [];
  if (!s.rules.friendly && loopIndex >= 0 && !landsSafe) {
    bumps = occupantsOfLoopIndex(s, loopIndex)
      .filter((t) => t.color !== token.color)
      .map((t) => t.id);
  }
  return {
    tokenId: token.id,
    color: token.color,
    from: token.steps,
    to,
    kind,
    bumps,
    landsSafe,
    landsHome: to >= HOME_STEPS,
    path,
  };
}

export type GameEvent =
  | { type: "exit"; color: Color }
  | { type: "safe"; color: Color }
  | { type: "bump"; by: Color; victims: Color[] }
  | { type: "home"; color: Color }
  | { type: "playerFinished"; color: Color }
  | { type: "gameOver" };

export interface ApplyResult {
  state: GameState;
  events: GameEvent[];
  /** the same player rolls again (rolled a 6) */
  extraTurn: boolean;
}

export function applyMove(state: GameState, move: Move, dice: number): ApplyResult {
  const events: GameEvent[] = [];
  const players = state.players.map((p) => ({
    ...p,
    tokens: p.tokens.map((t) => ({ ...t })),
  }));
  const all = players.flatMap((p) => p.tokens);
  const token = all.find((t) => t.id === move.tokenId);
  if (!token) return { state, events, extraTurn: false };

  token.steps = move.to;
  if (move.kind === "exit") events.push({ type: "exit", color: token.color });

  const victims: Color[] = [];
  for (const id of move.bumps) {
    const v = all.find((t) => t.id === id);
    if (v) {
      v.steps = -1;
      victims.push(v.color);
    }
  }
  if (victims.length) events.push({ type: "bump", by: token.color, victims });
  else if (move.landsSafe && move.kind !== "exit") events.push({ type: "safe", color: token.color });

  if (move.landsHome) events.push({ type: "home", color: token.color });

  const ranking = [...state.ranking];
  for (const p of players) {
    if (playerDone(p) && !ranking.includes(p.color)) {
      ranking.push(p.color);
      events.push({ type: "playerFinished", color: p.color });
    }
  }

  const active = players.filter((p) => !playerDone(p));
  if (active.length <= 1) {
    for (const p of active) if (!ranking.includes(p.color)) ranking.push(p.color);
    events.push({ type: "gameOver" });
  }

  const nextState: GameState = {
    ...state,
    players: players.map((p) => (p.color === token.color ? { ...p, stuckTurns: 0 } : p)),
    ranking,
    lucky: false,
    dice: null,
  };

  return { state: nextState, events, extraTurn: dice === 6 };
}

/** No move was possible: remember it so an "Easy" child gets a lucky roll soon. */
export function registerStuckTurn(state: GameState): GameState {
  const players = state.players.map((p, i) =>
    i === state.turn ? { ...p, stuckTurns: p.stuckTurns + 1 } : p,
  );
  return { ...state, players, dice: null };
}

export function isGameOver(s: GameState): boolean {
  return s.players.filter((p) => !playerDone(p)).length <= 1;
}

export function nextTurn(state: GameState): GameState {
  if (isGameOver(state)) return { ...state, dice: null };
  let turn = state.turn;
  for (let i = 0; i < state.players.length; i++) {
    turn = (turn + 1) % state.players.length;
    if (!playerDone(state.players[turn]!)) break;
  }
  const player = state.players[turn]!;
  // mercy rule: after two turns with nothing to do, any roll gets a token out
  const lucky = state.rules.easyExit && player.stuckTurns >= 2;
  return { ...state, turn, dice: null, lucky };
}

/** Fair dice using the crypto RNG when available. */
export function rollDie(random: () => number = cryptoRandom): number {
  return 1 + Math.floor(random() * 6);
}

function cryptoRandom(): number {
  const g = globalThis as { crypto?: Crypto };
  if (g.crypto?.getRandomValues) {
    const buf = new Uint32Array(1);
    g.crypto.getRandomValues(buf);
    return buf[0]! / 2 ** 32;
  }
  return Math.random();
}

/** Buddy (computer) choice: bump > home > leave base > furthest ahead. */
export function pickBuddyMove(moves: Move[]): Move | null {
  if (!moves.length) return null;
  const score = (m: Move) =>
    (m.bumps.length ? 1000 : 0) +
    (m.landsHome ? 500 : 0) +
    (m.kind === "exit" ? 200 : 0) +
    (m.landsSafe ? 60 : 0) +
    m.to;
  return [...moves].sort((a, b) => score(b) - score(a))[0] ?? null;
}

export { HOME_STEPS, LANE_START, LOOP_STEPS };
