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
  rules: RuleSettings;
}

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  music: true,
  voice: true,
  soundVolume: 0.8,
  musicVolume: 0.3,
  voiceVolume: 1,
  voiceRate: 0.9,
  buddySpeed: 2000,
  reducedMotion: false,
  highContrast: false,
  largerUI: false,
  leftHanded: false,
  breakReminder: true,
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
  /** steps value used for rendering while a token hops */
  visual: Record<string, number>;
  hopCount: number | null;
  caption: string;
  hint: string;
  mood: MascotMood;
  announce: string;
  settings: Settings;
  stickers: string[];
  newSticker: string | null;
  showHandPointer: boolean;
  hasSave: boolean;
  tutorialStep: number;

  init: () => void;
  go: (screen: Screen) => void;
  setOverlay: (o: Overlay) => void;
  setSettings: (patch: Partial<Settings>) => void;
  setRules: (patch: Partial<RuleSettings>) => void;
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

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? ({ ...(fallback as object), ...JSON.parse(raw) } as T) : fallback;
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
  function beginTurn(): void {
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
      if (get().mode === "family" && get().game!.players.filter((p) => p.isHuman).length > 1) {
        set({ overlay: "handoff" });
        say(line(LINES.passDevice(player.name)), "pointing");
        return;
      }
      say(line(LINES.yourTurn), "pointing");
      set({ hint: "Tap the dice to roll!" });
      later(() => {
        if (get().phase === "idle") set({ showHandPointer: true });
      }, 4000);
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
          later(beginTurn, 1200);
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

  function finish() {
    clearTimers();
    const game = get().game!;
    // fast-forward any unfinished buddies so everyone gets a place
    const ranking = [...game.ranking];
    for (const p of game.players) if (!ranking.includes(p.color)) ranking.push(p.color);
    const finished: GameState = { ...game, ranking };
    const sticker = STICKERS[Math.floor(Math.random() * STICKERS.length)] ?? "⭐";
    const stickers = [...get().stickers, sticker];
    save(STICKER_KEY, stickers);
    if (typeof window !== "undefined") window.localStorage.removeItem(SAVE_KEY);
    set({
      game: finished,
      phase: "gameOver",
      screen: "celebration",
      overlay: null,
      stickers,
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
      set({
        settings: merged,
        stickers: Array.isArray(stickers) ? stickers : [],
        hasSave,
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

    startGame(mode, color, humans = 1) {
      clearTimers();
      const order: Color[] = [color, ...COLORS.filter((c) => c !== color)];
      const defs: PlayerDef[] = order.map((c, i) => ({
        color: c,
        name: i === 0 ? "You" : COLOR_NAME[c],
        isHuman: mode === "family" ? i < humans : i === 0,
      }));
      const game = createGame(defs, get().settings.rules);
      set({
        game,
        mode,
        screen: "game",
        overlay: null,
        phase: "idle",
        visual: {},
        dice: null,
        newSticker: null,
      });
      void unlockAudio();
      beginTurn();
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
        beginTurn();
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
      set({ overlay: null, hint: "Tap the dice to roll!" });
      say(line(LINES.yourTurn), "pointing");
    },

    playAgain() {
      const game = get().game;
      const color = game?.players.find((p) => p.isHuman)?.color ?? "blue";
      const mode = get().mode;
      set({ newSticker: null });
      get().startGame(mode, color, mode === "family" ? 2 : 1);
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
