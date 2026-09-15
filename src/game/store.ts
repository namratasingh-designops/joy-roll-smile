import { create } from "zustand";
import {
  type Color,
  HOME_STEPS,
  cellOf,
  seatColors,
  squareLabel,
} from "./board";
import {
  DEFAULT_RULES,
  type GameState,
  type Move,
  type PlayerDef,
  type RuleSettings,
  applyMove,
  createGame,
  currentPlayer,
  isGameOver,
  legalMoves,
  nextTurn,
  pickBuddyMove,
  playerDone,
  registerStuckTurn,
  rollDie,
  tokensForCount,
  tokensHome,
} from "./rules";
import { LINES, line } from "./lines";
import { ensureAudioReady, setAudioSettings, sound, speak, stopVoice, unlockAudio, vibrate } from "@/audio/audio";

export type Screen =
  | "splash"
  | "mode"
  | "count"
  | "color"
  | "game"
  | "howto"
  | "celebration"
  | "stickers"
  | "soundtest";

export type Overlay = "exit" | "gate" | "settings" | "handoff" | "break" | null;

export type Phase = "idle" | "rolling" | "choosing" | "moving" | "resolving" | "gameOver";

export type MascotMood =
  | "happy"
  | "cheering"
  | "thinking"
  | "surprised"
  | "clapping"
  | "waving"
  | "pointing";

/** "starting" = gentle five-year-old play, "know" = a real game for 7-8s. */
export type Difficulty = "starting" | "know";

export interface Settings {
  sound: boolean;
  music: boolean;
  voice: boolean;
  soundVolume: number;
  musicVolume: number;
  voiceVolume: number;
  voiceRate: number;
  buddySpeed: number; // ms per buddy decision
  reducedMotion: boolean;
  highContrast: boolean;
  largerUI: boolean;
  leftHanded: boolean;
  breakReminder: boolean;
  difficulty: Difficulty;
  /** pieces follow the player count unless a grown-up picks a number by hand */
  tokensAuto: boolean;
  /** move straight away when there is only one option (off for older children) */
  autoMoveSingle: boolean;
  rules: RuleSettings;
}

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  music: true,
  voice: true,
  soundVolume: 0.8,
  musicVolume: 0.3,
  voiceVolume: 0.85,
  voiceRate: 0.9,
  buddySpeed: 2000,
  reducedMotion: false,
  highContrast: false,
  largerUI: false,
  leftHanded: false,
  breakReminder: true,
  difficulty: "starting",
  tokensAuto: true,
  autoMoveSingle: true,
  rules: DEFAULT_RULES,
};

const SETTINGS_KEY = "ludo.settings.v1";
const STICKER_KEY = "ludo.stickers.v1";
const SAVE_KEY = "ludo.save.v1";
const COUNT_KEY = "ludo.players.v1";

/** Cartoon faces children pick for themselves. */
export const AVATARS = ["🦊", "🐼", "🐸", "🐰", "🐨", "🦄", "🐯", "🐵"];

/** Computer friends get names and faces of their own. */
export const BUDDY_NAMES: Record<Color, string> = {
  blue: "Bo",
  red: "Rosie",
  green: "Gus",
  yellow: "Yuna",
};
export const BUDDY_AVATARS: Record<Color, string> = {
  blue: "🐬",
  red: "🦊",
  green: "🐸",
  yellow: "🐥",
};

export const STICKERS = ["⭐", "🦁", "🌈", "🎈", "🍀", "🌻", "🐢", "🚀", "🍎", "🎨", "🐬", "🧩"];

/** Spoken names so pre-readers can tap a sticker and hear what it is. */
export const STICKER_NAMES: Record<string, string> = {
  "⭐": "A star!",
  "🦁": "A lion!",
  "🌈": "A rainbow!",
  "🎈": "A balloon!",
  "🍀": "A lucky clover!",
  "🌻": "A sunflower!",
  "🐢": "A turtle!",
  "🚀": "A rocket!",
  "🍎": "An apple!",
  "🎨": "Paints!",
  "🐬": "A dolphin!",
  "🧩": "A puzzle piece!",
};

interface Store {
  screen: Screen;
  overlay: Overlay;
  game: GameState | null;
  mode: "buddies" | "family";
  /** how many players the family/child chose (2, 3 or 4) */
  playerCount: 2 | 3 | 4;
  /** the line-up of the current game, replayed by "Play again" */
  lastDefs: PlayerDef[] | null;
  phase: Phase;
  dice: number | null;
  diceRollKey: number;
  moves: Move[];
  /** index of the move highlighted by keyboard play */
  selectedIndex: number;
  /** steps value used for rendering while a token hops */
  visual: Record<string, number>;
  hopCount: number | null;
  /** token given a hopeful wiggle when no move was possible */
  wiggleTokenId: string | null;
  /** this buddy turn only: play it out quickly */
  turbo: boolean;
  caption: string;
  hint: string;
  mood: MascotMood;
  announce: string;
  settings: Settings;
  stickers: string[];
  newSticker: string | null;
  /** true once this game has already handed out the "first token home" sticker */
  earnedHomeSticker: boolean;
  showHandPointer: boolean;
  hasSave: boolean;
  tutorialStep: number;

  init: () => void;
  go: (screen: Screen) => void;
  setOverlay: (o: Overlay) => void;
  setSettings: (patch: Partial<Settings>) => void;
  setRules: (patch: Partial<RuleSettings>) => void;
  setDifficulty: (d: Difficulty) => void;
  say: (text: string, mood?: MascotMood) => void;
  setMode: (mode: "buddies" | "family") => void;
  setPlayerCount: (n: 2 | 3 | 4) => void;
  startGame: (mode: "buddies" | "family", defs: PlayerDef[]) => void;
  startBuddies: (color: Color, avatar: string) => void;
  startFamily: (picks: { color: Color; avatar: string }[]) => void;
  resume: () => void;
  roll: () => void;
  watchBuddy: () => void;
  chooseToken: (tokenId: string) => void;
  setSelectedIndex: (n: number) => void;
  skipBuddies: () => void;
  confirmHandoff: () => void;
  playAgain: () => void;
  leaveGame: () => void;
  nudgeIdle: () => void;
  setTutorialStep: (n: number) => void;
}

/* ------------------------------- timer helper ------------------------------ */
let timers: ReturnType<typeof setTimeout>[] = [];
function later(fn: () => void, ms: number) {
  const t = setTimeout(fn, ms);
  timers.push(t);
  return t;
}
function clearTimers() {
  timers.forEach(clearTimeout);
  timers = [];
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    // arrays (and other non-objects) come back as they were saved;
    // only plain objects get merged onto the defaults
    if (isPlainObject(parsed) && isPlainObject(fallback)) {
      return { ...fallback, ...parsed } as T;
    }
    return parsed as T;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function audioSettingsOf(s: Settings) {
  return {
    sound: s.sound,
    music: s.music,
    voice: s.voice,
    soundVolume: s.soundVolume,
    musicVolume: s.musicVolume,
    voiceVolume: s.voiceVolume,
    voiceRate: s.voiceRate,
  };
}

export const useGame = create<Store>((set, get) => {
  /* ------------------------------ narration ------------------------------ */
  function say(text: string, mood: MascotMood = "happy") {
    set({ caption: text, mood, announce: text });
    speak(text);
  }

  function announce(text: string) {
    set({ announce: text });
  }

  /* ------------------------------- turn flow ------------------------------ */
  /** Leo names whoever is up, then the hand pointer nudges after a pause. */
  function humanTurnPrompt(): void {
    const game = get().game;
    if (!game) return;
    const player = currentPlayer(game);
    say(
      player.name === "You" ? "Now it's your turn!" : `Now it's ${player.name}'s turn!`,
      "pointing",
    );
    set({ hint: "Tap the dice to roll!" });
    later(() => {
      if (get().phase === "idle" && !get().overlay) set({ showHandPointer: true });
    }, 4000);
  }

  /**
   * `handoff: false` for the very first turn and for rolling again after a six —
   * the device does not change hands in either case.
   */
  function beginTurn(opts: { handoff?: boolean } = {}): void {
    const handoff = opts.handoff ?? true;
    const game = get().game;
    if (!game) return;
    if (isGameOver(game)) {
      finish();
      return;
    }
    const player = currentPlayer(game);
    set({ phase: "idle", dice: null, moves: [], showHandPointer: false, hopCount: null });
    persistSave();

    if (player.isHuman) {
      const humans = game.players.filter((p) => p.isHuman).length;
      if (handoff && get().mode === "family" && humans > 1) {
        set({ overlay: "handoff" });
        say(line(LINES.passDevice(player.name)), "pointing");
        return;
      }
      humanTurnPrompt();
    } else {
      say(line(LINES.turnOf(player.name)), "thinking");
      set({ hint: `${player.name} is thinking…` });
      later(() => get().roll(), get().settings.buddySpeed);
    }
  }

  function resolveRoll(dice: number) {
    const game = get().game!;
    const player = currentPlayer(game);
    const moves = legalMoves(game, dice);

    if (!moves.length) {
      set({ phase: "resolving" });
      say(line(LINES.noMoves), "surprised");
      set({ game: registerStuckTurn(game) });
      later(() => endTurn(false), 1400);
      return;
    }

    if (moves.length === 1) {
      set({ moves, phase: "moving" });
      later(() => performMove(moves[0]!, dice), 600);
      return;
    }

    if (player.isHuman) {
      set({ moves, phase: "choosing", hint: "Tap a glowing token!" });
      say(line(LINES.chooseToken), "pointing");
      later(() => {
        if (get().phase === "choosing") set({ showHandPointer: true });
      }, 4000);
    } else {
      set({ moves, phase: "moving" });
      later(() => performMove(pickBuddyMove(moves)!, dice), get().settings.buddySpeed * 0.6);
    }
  }

  function performMove(move: Move, dice: number) {
    const game = get().game!;
    const player = currentPlayer(game);
    const reduced = get().settings.reducedMotion;
    const stepMs = reduced ? 120 : 400;
    set({ phase: "moving", moves: [], showHandPointer: false });

    move.path.forEach((steps, i) => {
      later(() => {
        set((st) => ({
          visual: { ...st.visual, [move.tokenId]: steps },
          hopCount: i + 1,
        }));
        sound.hop(i);
        if (player.isHuman && get().settings.voice && move.path.length > 1) {
          speak(LINES.countWords[Math.min(i, 5)] ?? "", { queue: true });
        }
      }, i * stepMs);
    });

    later(
      (): void => {
        const res = applyMove(get().game!, move, dice);
        set((st) => {
          const visual = { ...st.visual };
          delete visual[move.tokenId];
          for (const id of move.bumps) delete visual[id];
          return { game: res.state, visual, hopCount: null };
        });

        let extra = res.extraTurn;
        for (const ev of res.events) {
          if (ev.type === "bump") {
            sound.boing();
            say(line(LINES.bump), "surprised");
          } else if (ev.type === "safe") {
            sound.star();
            say(line(LINES.safe), "happy");
          } else if (ev.type === "home") {
            sound.fanfare();
            vibrate(40);
            say(line(LINES.homeToken), "cheering");
            // first token safely home earns a sticker, even if the game is left early
            if (player.isHuman && !get().earnedHomeSticker) {
              set({ earnedHomeSticker: true });
              awardSticker();
            }
          } else if (ev.type === "gameOver") {
            extra = false;
          }
        }
        if (!res.events.length) {
          if (player.isHuman) say(line(LINES.goodMove), "clapping");
        }
        announce(
          `${player.name} moved to ${squareLabel(move.color, move.to)}. ${
            move.bumps.length ? "A token went back to base." : ""
          }`,
        );

        if (isGameOver(res.state)) {
          later(finish, 900);
          return;
        }
        if (extra) {
          say(line(LINES.sixCheer), "clapping");
          later(() => beginTurn({ handoff: false }), 1200);
        } else {
          later(() => endTurn(false), 1200);
        }
      },
      move.path.length * stepMs + 250,
    );
  }

  function endTurn(_extra: boolean): void {
    const game = get().game;
    if (!game) return;
    if (isGameOver(game)) {
      finish();
      return;
    }
    set({ game: nextTurn(game) });
    beginTurn();
  }

  /** Hands out a sticker the child does not have yet, so every one feels new. */
  function awardSticker(): string | null {
    const owned = get().stickers;
    const left = STICKERS.filter((s) => !owned.includes(s));
    if (!left.length) return null;
    const sticker = left[Math.floor(Math.random() * left.length)]!;
    const stickers = [...owned, sticker];
    save(STICKER_KEY, stickers);
    set({ stickers, newSticker: sticker });
    return sticker;
  }

  function finish() {
    clearTimers();
    const game = get().game!;
    // fast-forward any unfinished buddies so everyone gets a place
    const ranking = [...game.ranking];
    for (const p of game.players) if (!ranking.includes(p.color)) ranking.push(p.color);
    const finished: GameState = { ...game, ranking };
    const sticker = awardSticker() ?? get().stickers[get().stickers.length - 1] ?? "⭐";
    if (typeof window !== "undefined") window.localStorage.removeItem(SAVE_KEY);
    set({
      game: finished,
      phase: "gameOver",
      screen: "celebration",
      overlay: null,
      newSticker: sticker,
      hasSave: false,
    });
    sound.win();
    vibrate([40, 60, 80]);
    const human = finished.players.find((p) => p.isHuman);
    say(human ? line(LINES.win) : line(LINES.buddyWin(finished.players[0]!.name)), "cheering");
  }

  function persistSave() {
    const { game, mode } = get();
    if (game && !isGameOver(game)) {
      save(SAVE_KEY, { game, mode });
      set({ hasSave: true });
    }
  }

  return {
    screen: "splash",
    overlay: null,
    game: null,
    mode: "buddies",
    playerCount: 2,
    lastDefs: null,
    phase: "idle",
    dice: null,
    diceRollKey: 0,
    moves: [],
    visual: {},
    hopCount: null,
    caption: "Hello friend! Let's play Ludo!",
    hint: "Tap to play!",
    mood: "waving",
    announce: "",
    settings: DEFAULT_SETTINGS,
    stickers: [],
    newSticker: null,
    earnedHomeSticker: false,
    showHandPointer: false,
    hasSave: false,
    tutorialStep: 0,

    init() {
      const settings = load<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS);
      const stickers = load<string[]>(STICKER_KEY, []);
      const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const merged = { ...settings, reducedMotion: settings.reducedMotion || !!prefersReduced };
      setAudioSettings(audioSettingsOf(merged));
      let hasSave = false;
      try {
        hasSave = typeof window !== "undefined" && !!window.localStorage.getItem(SAVE_KEY);
      } catch {
        hasSave = false;
      }
      let playerCount: 2 | 3 | 4 = 2;
      try {
        const raw = typeof window !== "undefined" ? window.localStorage.getItem(COUNT_KEY) : null;
        const n = raw ? Number(JSON.parse(raw)) : 2;
        if (n === 3 || n === 4) playerCount = n;
      } catch {
        playerCount = 2;
      }
      set({
        settings: merged,
        stickers: Array.isArray(stickers) ? stickers : [],
        hasSave,
        playerCount,
      });
    },

    go(screen) {
      clearTimers();
      stopVoice();
      sound.tap();
      set({ screen, overlay: null, showHandPointer: false });
      if (screen === "splash") say(line(LINES.welcome), "waving");
    },

    setOverlay(o) {
      sound.tap();
      set({ overlay: o });
    },

    setSettings(patch) {
      const settings = { ...get().settings, ...patch };
      set({ settings });
      save(SETTINGS_KEY, settings);
      setAudioSettings(audioSettingsOf(settings));
    },

    setRules(patch) {
      get().setSettings({ rules: { ...get().settings.rules, ...patch } });
    },

    say,

    setMode(mode) {
      set({ mode });
    },

    setPlayerCount(n) {
      set({ playerCount: n });
      save(COUNT_KEY, n);
    },

    startGame(mode, defs) {
      clearTimers();
      const game = createGame(defs, get().settings.rules);
      set({
        game,
        mode,
        lastDefs: defs,
        screen: "game",
        overlay: null,
        phase: "idle",
        visual: {},
        dice: null,
        newSticker: null,
        earnedHomeSticker: false,
      });
      void unlockAudio();
      beginTurn({ handoff: false });
    },

    /** One child plus computer friends, seated for the chosen count. */
    startBuddies(color, avatar) {
      const seats = seatColors(get().playerCount, color);
      const defs: PlayerDef[] = seats.map((c, i) => ({
        color: c,
        name: i === 0 ? "You" : BUDDY_NAMES[c],
        avatar: i === 0 ? avatar : BUDDY_AVATARS[c],
        isHuman: i === 0,
      }));
      get().startGame("buddies", defs);
    },

    /** Everyone on this device is a real person — no computer friends at all. */
    startFamily(picks) {
      const defs: PlayerDef[] = picks.map((p, i) => ({
        color: p.color,
        name: i === 0 ? "You" : `Player ${i + 1}`,
        avatar: p.avatar,
        isHuman: true,
      }));
      get().startGame("family", defs);
    },

    resume() {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(SAVE_KEY) : null;
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as { game: GameState; mode: "buddies" | "family" };
        set({
          game: parsed.game,
          mode: parsed.mode,
          screen: "game",
          overlay: null,
          visual: {},
          dice: null,
        });
        void unlockAudio();
        beginTurn({ handoff: false });
      } catch {
        /* ignore */
      }
    },

    /** Tapping the dice while a buddy plays: gentle nudge, no roll. */
    watchBuddy() {
      const game = get().game;
      if (!game) return;
      const player = currentPlayer(game);
      if (player.isHuman) return;
      sound.tap();
      say(`It's ${player.name}'s turn — watch!`, "pointing");
    },

    roll() {
      const { phase, game, settings } = get();
      if (!game || phase !== "idle") return; // ignores excited extra taps
      const dice = rollDie();
      sound.rattle();
      vibrate(25);
      set({
        phase: "rolling",
        dice,
        diceRollKey: get().diceRollKey + 1,
        showHandPointer: false,
      });
      const player = currentPlayer(game);
      later(
        () => {
          sound.thud();
          if (player.isHuman) say(line(LINES.rolled(dice)), "cheering");
          else say(line(LINES.buddyRolled(player.name, dice)), "thinking");
          announce(`${player.name} rolled ${dice}.`);
          resolveRoll(dice);
        },
        settings.reducedMotion ? 350 : 1000,
      );
    },

    chooseToken(tokenId) {
      const { phase, moves, dice } = get();
      if (phase !== "choosing") return;
      const move = moves.find((m) => m.tokenId === tokenId);
      if (!move || dice == null) return;
      performMove(move, dice);
    },

    skipBuddies() {
      const game = get().game;
      if (!game) return;
      if (!currentPlayer(game).isHuman) set({ settings: { ...get().settings, buddySpeed: 700 } });
    },

    confirmHandoff() {
      void unlockAudio();
      ensureAudioReady();
      sound.tap();
      set({ overlay: null });
      // the idle hand pointer is scheduled here, once the device has changed hands
      humanTurnPrompt();
    },

    playAgain() {
      const { mode, lastDefs, game } = get();
      set({ newSticker: null });
      const defs: PlayerDef[] =
        lastDefs ??
        (game?.players.map((p) => ({
          color: p.color,
          name: p.name,
          avatar: p.avatar,
          isHuman: p.isHuman,
        })) ??
          []);
      if (!defs.length) {
        set({ screen: "mode" });
        return;
      }
      get().startGame(mode, defs);
    },

    leaveGame() {
      clearTimers();
      stopVoice();
      set({ screen: "splash", overlay: null, phase: "idle" });
    },

    nudgeIdle() {
      const { phase } = get();
      if (phase === "idle") say(line(LINES.tapDiceHint), "pointing");
      else if (phase === "choosing") say(line(LINES.chooseToken), "pointing");
    },

    setTutorialStep(n) {
      set({ tutorialStep: n });
    },
  };
});

/* --------------------------- derived helpers --------------------------- */

export function tokenWorldCell(color: Color, steps: number, slot: number) {
  return cellOf(color, steps, slot);
}

export { HOME_STEPS, tokensHome, playerDone };
