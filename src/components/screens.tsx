import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { COLORS, COLOR_HEX, COLOR_NAME, COLOR_SYMBOL, type Color } from "@/game/board";
import { useGame } from "@/game/store";
import { unlockAudio, sound, speak, vibrate } from "@/audio/audio";
import { Mascot, SpeechBubble } from "./Mascot";
import { ChunkyButton, Logo, ValuesStrip } from "./bits";
import { Playroom } from "./Playroom";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center gap-6 overflow-hidden px-4 py-8">
      <Playroom />
      <div className="relative flex w-full max-w-4xl flex-col items-center gap-6">{children}</div>
    </div>
  );
}

export function Splash() {
  const go = useGame((s) => s.go);
  const caption = useGame((s) => s.caption);
  const hasSave = useGame((s) => s.hasSave);
  const resume = useGame((s) => s.resume);
  const mood = useGame((s) => s.mood);

  return (
    <Shell>
      <motion.div initial={{ scale: 0.6, y: -30 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 200, damping: 12 }}>
        <Logo />
      </motion.div>
      <div className="flex items-end gap-3">
        <Mascot mood={mood} size={140} />
        <SpeechBubble text={caption} />
      </div>
      <ChunkyButton
        tone="green"
        icon={<span aria-hidden>▶</span>}
        className="h-28 px-14 text-4xl"
        onClick={async () => {
          await unlockAudio();
          sound.tap();
          go("mode");
        }}
      >
        Tap to play!
      </ChunkyButton>
      {hasSave && (
        <ChunkyButton
          tone="blue"
          icon={<span aria-hidden>⏵</span>}
          onClick={async () => {
            await unlockAudio();
            resume();
          }}
        >
          Keep playing
        </ChunkyButton>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        <ChunkyButton icon={<span aria-hidden>❓</span>} onClick={() => go("howto")}>
          How to play
        </ChunkyButton>
        <ChunkyButton icon={<span aria-hidden>📖</span>} onClick={() => go("stickers")}>
          Stickers
        </ChunkyButton>
      </div>
      <ValuesStrip />
    </Shell>
  );
}

export function ModeSelect() {
  const go = useGame((s) => s.go);
  const say = useGame((s) => s.say);
  const [mode, setMode] = useState<"buddies" | "family" | null>(null);
  const setPending = useGame((s) => s.setOverlay);
  useEffect(() => {
    say("Who is playing today?", "pointing");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const pick = (m: "buddies" | "family") => {
    setMode(m);
    sound.tap();
    (window as unknown as { __ludoMode?: string }).__ludoMode = m;
    setPending(null);
    go("color");
  };
  return (
    <Shell>
      <h1 className="font-display text-4xl text-ink">Who's playing?</h1>
      <div className="grid w-full gap-5 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => pick("buddies")}
          className="chunky flex flex-col items-center gap-3 bg-panel p-6 text-ink"
          aria-pressed={mode === "buddies"}
        >
          <span className="text-6xl" aria-hidden>
            🦁
          </span>
          <span className="font-display text-2xl">Play with buddies</span>
          <span className="text-base text-ink/70">You and three computer friends</span>
        </button>
        <button
          type="button"
          onClick={() => pick("family")}
          className="chunky flex flex-col items-center gap-3 bg-panel p-6 text-ink"
          aria-pressed={mode === "family"}
        >
          <span className="text-6xl" aria-hidden>
            👨‍👩‍👧
          </span>
          <span className="font-display text-2xl">Play with family</span>
          <span className="text-base text-ink/70">Share one device, take turns</span>
        </button>
      </div>
    </Shell>
  );
}

export function ColorSelect() {
  const startGame = useGame((s) => s.startGame);
  const say = useGame((s) => s.say);
  useEffect(() => {
    say("Pick your colour!", "pointing");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const mode = ((window as unknown as { __ludoMode?: "buddies" | "family" }).__ludoMode ??
    "buddies") as "buddies" | "family";
  return (
    <Shell>
      <h1 className="font-display text-4xl text-ink">Pick your colour</h1>
      <div className="grid w-full grid-cols-2 gap-5 sm:grid-cols-4">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              sound.tap();
              say(`${COLOR_NAME[c]}! Good choice!`, "clapping");
              startGame(mode, c, mode === "family" ? 2 : 1);
            }}
            className="chunky flex flex-col items-center gap-2 p-5 text-white"
            style={{ background: COLOR_HEX[c] }}
          >
            <span className="text-5xl" aria-hidden>
              {COLOR_SYMBOL[c]}
            </span>
            <span className="font-display text-2xl drop-shadow">{COLOR_NAME[c]}</span>
          </button>
        ))}
      </div>
    </Shell>
  );
}

export function HowToPlay() {
  const go = useGame((s) => s.go);
  const say = useGame((s) => s.say);
  const step = useGame((s) => s.tutorialStep);
  const setStep = useGame((s) => s.setTutorialStep);
  const steps = [
    { icon: "🎲", title: "Tap the dice", line: "Tap the big dice to roll!" },
    { icon: "🔵", title: "Tap a glowing token", line: "Tap a glowing token to move!" },
    { icon: "1️⃣", title: "Count the hops", line: "Count with me: one, two, three!" },
  ];
  useEffect(() => {
    say(steps[step]?.line ?? "You did it! Let's play!", "pointing");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <Shell>
      <h1 className="font-display text-4xl text-ink">How to play</h1>
      <div className="flex items-end gap-3">
        <Mascot mood="pointing" size={130} />
        <SpeechBubble text={steps[Math.min(step, 2)]!.line} />
      </div>
      <div className="flex w-full flex-col gap-4">
        {steps.map((s, i) => (
          <button
            key={s.title}
            type="button"
            onClick={() => {
              sound.hop(i);
              setStep(Math.min(i + 1, 3));
            }}
            className={`chunky flex items-center gap-4 p-5 text-left text-ink ${
              i <= step ? "bg-panel" : "bg-panel/60"
            }`}
          >
            <span className="text-4xl" aria-hidden>
              {s.icon}
            </span>
            <span className="font-display text-2xl">
              {i + 1}. {s.title}
            </span>
            {i < step && <span className="ml-auto text-3xl" aria-hidden>✅</span>}
          </button>
        ))}
      </div>
      <ChunkyButton tone="green" onClick={() => { setStep(0); go("splash"); }} icon={<span aria-hidden>🏠</span>}>
        Back home
      </ChunkyButton>
    </Shell>
  );
}

const MEDALS = ["🥇", "🥈", "🥉", "⭐"];

export function Celebration() {
  const game = useGame((s) => s.game);
  const playAgain = useGame((s) => s.playAgain);
  const go = useGame((s) => s.go);
  const newSticker = useGame((s) => s.newSticker);
  const reduced = useGame((s) => s.settings.reducedMotion);
  const caption = useGame((s) => s.caption);

  useEffect(() => {
    if (reduced) return;
    const shots = [0, 400, 900];
    const timers = shots.map((d) =>
      setTimeout(() => confetti({ particleCount: 90, spread: 80, origin: { y: 0.7 } }), d),
    );
    return () => timers.forEach(clearTimeout);
  }, [reduced]);

  const ranking = game?.ranking ?? [];

  return (
    <Shell>
      <motion.div initial={{ y: -120, scale: 0.4 }} animate={{ y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12 }}>
        <span className="text-7xl" aria-hidden>🏆</span>
      </motion.div>
      <h1 className="font-display text-4xl text-ink">{caption}</h1>
      <div className="flex items-end gap-3">
        <Mascot mood="cheering" size={130} />
        <SpeechBubble text="Everybody gets a medal!" />
      </div>
      <ul className="flex w-full flex-col gap-3">
        {ranking.map((c: Color, i) => {
          const p = game?.players.find((pl) => pl.color === c);
          return (
            <li
              key={c}
              className="flex items-center gap-4 rounded-3xl bg-panel px-5 py-3 shadow-soft"
              style={{ borderBottom: `8px solid ${COLOR_HEX[c]}` }}
            >
              <span className="text-4xl" aria-hidden>{MEDALS[Math.min(i, 3)]}</span>
              <span className="font-display text-2xl text-ink">
                {p?.name ?? COLOR_NAME[c]} {COLOR_SYMBOL[c]}
              </span>
              <span className="ml-auto font-display text-lg text-ink/70">
                {i === 0 ? "First!" : i === ranking.length - 1 ? "Great try!" : "Well played!"}
              </span>
            </li>
          );
        })}
      </ul>
      {newSticker && (
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          className="flex items-center gap-3 rounded-3xl bg-play-yellow px-6 py-3 shadow-toy"
        >
          <span className="text-5xl" aria-hidden>{newSticker}</span>
          <span className="font-display text-2xl text-ink">New sticker earned!</span>
        </motion.div>
      )}
      <div className="flex flex-wrap justify-center gap-4">
        <ChunkyButton tone="green" className="h-24 px-10 text-3xl" icon={<span aria-hidden>🔁</span>} onClick={playAgain}>
          Play again
        </ChunkyButton>
        <ChunkyButton icon={<span aria-hidden>📖</span>} onClick={() => go("stickers")}>
          Stickers
        </ChunkyButton>
        <ChunkyButton icon={<span aria-hidden>🏠</span>} onClick={() => go("splash")}>
          Home
        </ChunkyButton>
      </div>
    </Shell>
  );
}

export function StickerBook() {
  const stickers = useGame((s) => s.stickers);
  const go = useGame((s) => s.go);
  return (
    <Shell>
      <h1 className="font-display text-4xl text-ink">My sticker book</h1>
      <p className="text-lg text-ink/70">One sticker for every game you finish.</p>
      <div className="grid w-full grid-cols-4 gap-4 sm:grid-cols-6">
        {Array.from({ length: Math.max(12, stickers.length) }).map((_, i) => (
          <div
            key={i}
            className="flex aspect-square items-center justify-center rounded-3xl bg-panel text-4xl shadow-soft"
          >
            <span aria-hidden>{stickers[i] ?? ""}</span>
            <span className="sr-only">{stickers[i] ? `Sticker ${i + 1}` : "Empty sticker space"}</span>
          </div>
        ))}
      </div>
      <ChunkyButton tone="green" icon={<span aria-hidden>🏠</span>} onClick={() => go("splash")}>
        Back home
      </ChunkyButton>
    </Shell>
  );
}

/* ------------------------------- overlays -------------------------------- */

function Modal({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <motion.div
        initial={{ scale: 0.85, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90dvh] w-full max-w-xl overflow-auto rounded-4xl bg-panel p-6 shadow-toy"
      >
        <h2 className="mb-4 font-display text-3xl text-ink">{title}</h2>
        {children}
      </motion.div>
    </div>
  );
}

export function ExitConfirm() {
  const setOverlay = useGame((s) => s.setOverlay);
  const leave = useGame((s) => s.leaveGame);
  return (
    <Modal title="Leave the game?">
      <div className="grid gap-4 sm:grid-cols-2">
        <ChunkyButton tone="green" className="h-32 flex-col text-3xl" onClick={() => setOverlay(null)}>
          <span className="text-5xl" aria-hidden>😀</span>
          Keep playing
        </ChunkyButton>
        <ChunkyButton className="h-32 flex-col text-3xl" onClick={leave}>
          <span className="text-5xl" aria-hidden>👋</span>
          Leave
        </ChunkyButton>
      </div>
      <p className="mt-4 text-center text-base text-ink/70">Your game is saved, so you can come back.</p>
    </Modal>
  );
}

export function ParentGate() {
  const setOverlay = useGame((s) => s.setOverlay);
  const [wrong, setWrong] = useState(false);
  const options = [18, 24, 30, 12];
  return (
    <Modal title="Grown-ups only">
      <p className="mb-4 text-lg text-ink">What is 6 × 4?</p>
      <div className="grid grid-cols-4 gap-3">
        {options.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => (n === 24 ? setOverlay("settings") : setWrong(true))}
            className="chunky touch-big bg-play-blue py-4 text-2xl font-bold text-white"
          >
            {n}
          </button>
        ))}
      </div>
      {wrong && <p className="mt-3 text-base text-ink">Not quite — try again.</p>}
      <div className="mt-5 flex justify-end">
        <ChunkyButton onClick={() => setOverlay(null)}>Close</ChunkyButton>
      </div>
    </Modal>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 py-3">
      <span className="font-display text-lg text-ink">{label}</span>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`chunky touch-big px-4 py-2 text-lg font-bold ${on ? "bg-play-green text-white" : "bg-white text-ink"}`}
    >
      {children}
    </button>
  );
}

export function GrownUpSettings() {
  const s = useGame((st) => st.settings);
  const set = useGame((st) => st.setSettings);
  const setRules = useGame((st) => st.setRules);
  const setOverlay = useGame((st) => st.setOverlay);
  return (
    <Modal title="Grown-up settings">
      <Row label="Tokens each">
        <Choice on={s.rules.tokensPerPlayer === 2} onClick={() => setRules({ tokensPerPlayer: 2 })}>2</Choice>
        <Choice on={s.rules.tokensPerPlayer === 4} onClick={() => setRules({ tokensPerPlayer: 4 })}>4</Choice>
      </Row>
      <Row label="Rules">
        <Choice on={s.rules.easyExit && s.rules.easyFinish} onClick={() => setRules({ easyExit: true, easyFinish: true })}>Easy</Choice>
        <Choice on={!s.rules.easyExit && !s.rules.easyFinish} onClick={() => setRules({ easyExit: false, easyFinish: false })}>Classic</Choice>
      </Row>
      <Row label="Friendly mode (no bumping)">
        <Choice on={s.rules.friendly} onClick={() => setRules({ friendly: true })}>On</Choice>
        <Choice on={!s.rules.friendly} onClick={() => setRules({ friendly: false })}>Off</Choice>
      </Row>
      <Row label="Buddy speed">
        <Choice on={s.buddySpeed >= 2600} onClick={() => set({ buddySpeed: 2600 })}>Slow</Choice>
        <Choice on={s.buddySpeed === 2000} onClick={() => set({ buddySpeed: 2000 })}>Normal</Choice>
        <Choice on={s.buddySpeed <= 1200} onClick={() => set({ buddySpeed: 1200 })}>Quick</Choice>
      </Row>
      <Row label="Voice speed">
        <Choice on={s.voiceRate <= 0.8} onClick={() => set({ voiceRate: 0.8 })}>Slow</Choice>
        <Choice on={s.voiceRate === 0.9} onClick={() => set({ voiceRate: 0.9 })}>Normal</Choice>
        <Choice on={s.voiceRate >= 1} onClick={() => set({ voiceRate: 1 })}>Quick</Choice>
      </Row>
      <Row label="Reduced motion">
        <Choice on={s.reducedMotion} onClick={() => set({ reducedMotion: true })}>On</Choice>
        <Choice on={!s.reducedMotion} onClick={() => set({ reducedMotion: false })}>Off</Choice>
      </Row>
      <Row label="High contrast">
        <Choice on={s.highContrast} onClick={() => set({ highContrast: true })}>On</Choice>
        <Choice on={!s.highContrast} onClick={() => set({ highContrast: false })}>Off</Choice>
      </Row>
      <Row label="Larger buttons and text">
        <Choice on={s.largerUI} onClick={() => set({ largerUI: true })}>On</Choice>
        <Choice on={!s.largerUI} onClick={() => set({ largerUI: false })}>Off</Choice>
      </Row>
      <Row label="Left-handed layout">
        <Choice on={s.leftHanded} onClick={() => set({ leftHanded: true })}>On</Choice>
        <Choice on={!s.leftHanded} onClick={() => set({ leftHanded: false })}>Off</Choice>
      </Row>
      <Row label="Break reminder">
        <Choice on={s.breakReminder} onClick={() => set({ breakReminder: true })}>On</Choice>
        <Choice on={!s.breakReminder} onClick={() => set({ breakReminder: false })}>Off</Choice>
      </Row>
      <p className="mt-4 text-base text-ink/70">
        No ads, no purchases, no accounts and no data collection. Everything stays on this device.
      </p>
      <div className="mt-5 flex justify-end">
        <ChunkyButton tone="green" onClick={() => setOverlay(null)}>Done</ChunkyButton>
      </div>
    </Modal>
  );
}

export function HandoffScreen() {
  const game = useGame((s) => s.game);
  const confirm = useGame((s) => s.confirmHandoff);
  const player = game?.players[game.turn];
  return (
    <Modal title="Pass the device">
      <div className="flex flex-col items-center gap-5">
        <span className="text-6xl" aria-hidden>🤝</span>
        <p className="font-display text-3xl text-ink">Pass it to {player?.name}!</p>
        <ChunkyButton tone="green" className="h-24 px-10 text-3xl" onClick={confirm}>
          Ready!
        </ChunkyButton>
      </div>
    </Modal>
  );
}

export function BreakReminder() {
  const setOverlay = useGame((s) => s.setOverlay);
  return (
    <Modal title="Stretch time">
      <div className="flex flex-col items-center gap-4">
        <Mascot mood="cheering" size={140} />
        <p className="font-display text-2xl text-ink">Let's stretch together!</p>
        <ChunkyButton tone="green" onClick={() => setOverlay(null)}>
          Keep playing
        </ChunkyButton>
      </div>
    </Modal>
  );
}
