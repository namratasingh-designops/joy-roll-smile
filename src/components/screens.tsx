import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { COLORS, COLOR_HEX, COLOR_NAME, COLOR_SYMBOL, seatColors, type Color } from "@/game/board";
import { estimateMinutes, tokensForCount } from "@/game/rules";
import { AVATARS, STICKERS, STICKER_NAMES, useGame } from "@/game/store";
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
      <h1 className="max-w-2xl text-center font-display text-2xl text-ink">
        A fun ludo game for kids aged 5 to 7
      </h1>
      <p className="max-w-2xl text-center text-lg text-ink/70">
        Free and easy to play on your own: big buttons, spoken instructions and counting practice with
        Leo the lion. No reading needed, no ads.
      </p>
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
      <DifficultyPicker />
      <div className="flex flex-wrap justify-center gap-3">
        <ChunkyButton icon={<span aria-hidden>❓</span>} onClick={() => go("howto")}>
          How to play
        </ChunkyButton>
        <ChunkyButton icon={<span aria-hidden>📖</span>} onClick={() => go("stickers")}>
          Stickers
        </ChunkyButton>
        <ChunkyButton icon={<span aria-hidden>🔊</span>} onClick={() => go("soundtest")}>
          Sound test
        </ChunkyButton>
      </div>
      <ValuesStrip />
    </Shell>
  );
}

/** Right on the first screen: easy helpers, or full rules for older children. */
function DifficultyPicker() {
  const difficulty = useGame((s) => s.settings.difficulty);
  const setDifficulty = useGame((s) => s.setDifficulty);
  const say = useGame((s) => s.say);
  const options = [
    { key: "starting" as const, face: "🐣", label: "Just starting", hint: "Lots of help" },
    { key: "know" as const, face: "🎓", label: "I know Ludo", hint: "Real rules, real choices" },
  ];
  return (
    <div className="flex flex-wrap justify-center gap-3" role="group" aria-label="How well do you know Ludo?">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          aria-pressed={difficulty === o.key}
          onClick={() => {
            sound.tap();
            setDifficulty(o.key);
            say(o.key === "know" ? "Great, real Ludo rules!" : "We'll help you along!", "clapping");
          }}
          className={`chunky flex items-center gap-3 px-5 py-3 text-ink ${
            difficulty === o.key ? "bg-play-yellow" : "bg-panel"
          }`}
        >
          <span className="text-3xl" aria-hidden>
            {o.face}
          </span>
          <span className="text-left">
            <span className="block font-display text-xl">{o.label}</span>
            <span className="block text-sm text-ink/70">{o.hint}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

export function ModeSelect() {
  const go = useGame((s) => s.go);
  const say = useGame((s) => s.say);
  const setMode = useGame((s) => s.setMode);
  const mode = useGame((s) => s.mode);
  useEffect(() => {
    say("Who is playing today?", "pointing");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const pick = (m: "buddies" | "family") => {
    setMode(m);
    sound.tap();
    go("count");
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
          <span className="text-base text-ink/70">You and computer friends</span>
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
          <span className="text-base text-ink/70">Everyone takes turns on this device</span>
        </button>
      </div>
    </Shell>
  );
}

const COUNT_FACES = ["🦊", "🐼", "🐸", "🐰"];

/** How many players? Two by default, shown as that many cartoon faces. */
export function PlayerCountSelect() {
  const go = useGame((s) => s.go);
  const say = useGame((s) => s.say);
  const count = useGame((s) => s.playerCount);
  const setCount = useGame((s) => s.setPlayerCount);
  useEffect(() => {
    say("How many players?", "pointing");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const auto = useGame((s) => s.settings.tokensAuto);
  const manualTokens = useGame((s) => s.settings.rules.tokensPerPlayer);
  return (
    <Shell>
      <h1 className="font-display text-4xl text-ink">How many players?</h1>
      <div className="grid w-full gap-5 sm:grid-cols-3">
        {([2, 3, 4] as const).map((n) => {
          const tokens = auto ? tokensForCount(n) : manualTokens;
          const minutes = estimateMinutes(n, tokens);
          return (
            <button
              key={n}
              type="button"
              aria-pressed={count === n}
              onClick={() => {
                sound.tap();
                setCount(n);
                say(`${n} players!`, "clapping");
                setTimeout(() => go("color"), 700);
              }}
              className={`chunky flex flex-col items-center gap-2 p-5 text-ink ${
                count === n ? "bg-play-yellow" : "bg-panel"
              }`}
            >
              <span className="flex gap-1 text-4xl" aria-hidden>
                {COUNT_FACES.slice(0, n).map((f, i) => (
                  <span key={i}>{f}</span>
                ))}
              </span>
              <span className="font-display text-5xl">{n}</span>
              <span className="text-sm text-ink/70">
                {n} players · {tokens} pieces each · about {minutes} minutes
              </span>
              {minutes >= 35 && (
                <span className="text-sm font-bold text-play-red">
                  That's a long game — around {minutes} minutes
                </span>
              )}
            </button>
          );
        })}
      </div>
      <ChunkyButton icon={<span aria-hidden>⬅</span>} onClick={() => go("mode")}>
        Back
      </ChunkyButton>
    </Shell>
  );
}

function ColorGrid({
  allowed,
  taken,
  onPick,
}: {
  allowed: Color[];
  taken: Color[];
  onPick: (c: Color) => void;
}) {
  return (
    <div className="grid w-full grid-cols-2 gap-5 sm:grid-cols-4">
      {COLORS.map((c) => {
        const free = allowed.includes(c) && !taken.includes(c);
        return (
          <button
            key={c}
            type="button"
            disabled={!free}
            onClick={() => free && onPick(c)}
            className={`chunky relative flex flex-col items-center gap-2 p-5 text-white ${
              free ? "" : "opacity-45 grayscale"
            }`}
            style={{ background: COLOR_HEX[c] }}
          >
            <span className="text-5xl" aria-hidden>
              {COLOR_SYMBOL[c]}
            </span>
            <span className="font-display text-2xl drop-shadow">{COLOR_NAME[c]}</span>
            {!free && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-7xl" aria-hidden>
                ✖
              </span>
            )}
            <span className="sr-only">{free ? "" : "already taken"}</span>
          </button>
        );
      })}
    </div>
  );
}

function AvatarGrid({ taken, onPick }: { taken: string[]; onPick: (a: string) => void }) {
  return (
    <div className="grid w-full grid-cols-4 gap-4">
      {AVATARS.map((a) => {
        const free = !taken.includes(a);
        return (
          <button
            key={a}
            type="button"
            disabled={!free}
            onClick={() => free && onPick(a)}
            className={`chunky flex items-center justify-center bg-panel p-4 text-5xl ${
              free ? "" : "opacity-40 grayscale"
            }`}
            aria-label={free ? "Pick this face" : "Face already taken"}
          >
            <span aria-hidden>{a}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ColorSelect() {
  const say = useGame((s) => s.say);
  const mode = useGame((s) => s.mode);
  const count = useGame((s) => s.playerCount);
  const startBuddies = useGame((s) => s.startBuddies);
  const startFamily = useGame((s) => s.startFamily);
  const [picks, setPicks] = useState<{ color: Color; avatar: string }[]>([]);
  const [pendingColor, setPendingColor] = useState<Color | null>(null);

  useEffect(() => {
    say("Pick your colour!", "pointing");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const seat = picks.length; // which player is picking now
  const first = picks[0]?.color;
  const allowed = first ? seatColors(count, first) : COLORS;
  const takenColors = picks.map((p) => p.color);
  const takenAvatars = picks.map((p) => p.avatar);

  const finish = (all: { color: Color; avatar: string }[]) => {
    if (mode === "family") startFamily(all);
    else startBuddies(all[0]!.color, all[0]!.avatar);
  };

  const chooseAvatar = (avatar: string) => {
    sound.tap();
    const all = [...picks, { color: pendingColor!, avatar }];
    setPendingColor(null);
    const need = mode === "family" ? count : 1;
    if (all.length >= need) {
      finish(all);
      return;
    }
    setPicks(all);
    say("Now the next player picks!", "pointing");
  };

  const title =
    mode === "family" && seat > 0 ? `Player ${seat + 1}, pick your colour` : "Pick your colour";

  if (pendingColor) {
    return (
      <Shell>
        <h1 className="font-display text-4xl text-ink">Pick your face</h1>
        <AvatarGrid taken={takenAvatars} onPick={chooseAvatar} />
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="font-display text-4xl text-ink">{pendingColor ? "Pick your face" : title}</h1>
      <ColorGrid
        allowed={allowed}
        taken={takenColors}
        onPick={(c) => {
          sound.tap();
          say(`${COLOR_NAME[c]}! Good choice!`, "clapping");
          setPendingColor(c);
        }}
      />
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
                <span aria-hidden>{p?.avatar} </span>
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
  const reduced = useGame((s) => s.settings.reducedMotion);
  const [wiggling, setWiggling] = useState<string | null>(null);
  const owned = STICKERS.filter((s) => stickers.includes(s));
  const empty = owned.length === 0;

  async function tapSticker(sticker: string) {
    await unlockAudio();
    sound.star();
    setWiggling(sticker);
    setTimeout(() => setWiggling((w) => (w === sticker ? null : w)), 700);
    speak(STICKER_NAMES[sticker] ?? "A sticker!");
  }

  return (
    <Shell>
      <h1 className="font-display text-4xl text-ink">My sticker book</h1>
      {empty ? (
        <>
          <div className="flex items-end gap-3">
            <Mascot mood="happy" size={140} />
            <SpeechBubble text="Finish a game to earn your first sticker!" />
          </div>
          <div className="text-6xl" aria-hidden>
            📄
          </div>
        </>
      ) : (
        <p className="text-lg text-ink/70">
          <span className="font-display text-2xl text-ink">
            {owned.length} of {STICKERS.length}
          </span>{" "}
          — tap a sticker to hear its name!
        </p>
      )}
      <div className="grid w-full grid-cols-4 gap-4 sm:grid-cols-6">
        {STICKERS.map((sticker) => {
          const has = stickers.includes(sticker);
          return has ? (
            <motion.button
              key={sticker}
              type="button"
              onClick={() => void tapSticker(sticker)}
              animate={
                reduced || wiggling !== sticker ? { rotate: 0 } : { rotate: [0, -14, 14, -10, 10, 0] }
              }
              transition={{ duration: 0.6 }}
              className="touch-big chunky flex aspect-square items-center justify-center rounded-3xl bg-panel text-4xl shadow-soft"
            >
              <span aria-hidden>{sticker}</span>
              <span className="sr-only">{STICKER_NAMES[sticker] ?? "Sticker"}</span>
            </motion.button>
          ) : (
            <div
              key={sticker}
              className="flex aspect-square items-center justify-center rounded-3xl border-2 border-dashed border-ink/15 bg-panel/40 text-4xl opacity-25 grayscale"
            >
              <span aria-hidden>{sticker}</span>
              <span className="sr-only">Sticker still to collect</span>
            </div>
          );
        })}
      </div>
      {empty && (
        <ChunkyButton
          tone="green"
          icon={<span aria-hidden>▶</span>}
          className="h-24 px-12 text-3xl"
          onClick={async () => {
            await unlockAudio();
            go("mode");
          }}
        >
          Let's play!
        </ChunkyButton>
      )}
      <ChunkyButton tone="blue" icon={<span aria-hidden>🏠</span>} onClick={() => go("splash")}>
        Back home
      </ChunkyButton>
    </Shell>
  );
}

const SOUND_TESTS: { label: string; icon: string; play: () => void }[] = [
  { label: "Dice roll", icon: "🎲", play: () => { sound.rattle(); setTimeout(() => sound.thud(), 450); vibrate(25); } },
  { label: "Move", icon: "👣", play: () => { for (let i = 0; i < 4; i++) setTimeout(() => sound.hop(i), i * 180); } },
  { label: "Bump", icon: "💥", play: () => sound.boing() },
  { label: "Safe star", icon: "⭐", play: () => sound.star() },
  { label: "Home!", icon: "🏠", play: () => { sound.fanfare(); vibrate(40); } },
  { label: "Win!", icon: "🏆", play: () => { sound.win(); vibrate([40, 60, 80]); } },
  { label: "Voice", icon: "🗣️", play: () => speak("Hello friend! Let's play Ludo!") },
];

export function SoundTest() {
  const go = useGame((s) => s.go);
  const [last, setLast] = useState<string | null>(null);
  return (
    <Shell>
      <h1 className="font-display text-4xl text-ink">Sound test</h1>
      <p className="text-lg text-ink/70">Tap a button — you should hear it right away.</p>
      <div className="grid w-full max-w-lg grid-cols-2 gap-4">
        {SOUND_TESTS.map((t) => (
          <ChunkyButton
            key={t.label}
            tone={last === t.label ? "green" : "blue"}
            className="h-24 flex-col text-2xl"
            onClick={async () => {
              await unlockAudio();
              setLast(t.label);
              t.play();
            }}
          >
            <span className="text-4xl" aria-hidden>{t.icon}</span>
            {t.label}
          </ChunkyButton>
        ))}
      </div>
      <p className="min-h-7 text-lg text-ink/70" aria-live="polite">
        {last ? `Played: ${last}` : "Nothing played yet"}
      </p>
      <ChunkyButton tone="green" icon={<span aria-hidden>🏠</span>} onClick={() => go("splash")}>
        Back home
      </ChunkyButton>
    </Shell>
  );
}

/* ------------------------------- overlays -------------------------------- */

/**
 * Dialog with a focus trap: focus starts on the first button, Tab stays inside,
 * Escape closes this dialog (never stacks another) and focus goes back after.
 */
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const setOverlay = useGame((s) => s.setOverlay);
  const close = onClose ?? (() => setOverlay(null));

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      previous?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <motion.div
        ref={ref}
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
        <span className="text-4xl" aria-hidden>🤝</span>
        {player && (
          <div
            className="flex h-40 w-40 items-center justify-center rounded-full text-[6rem] shadow-toy"
            style={{ background: COLOR_HEX[player.color] }}
            aria-hidden
          >
            {player.avatar}
          </div>
        )}
        <p className="font-display text-3xl text-ink">
          {player?.name}, it's your turn! {player ? COLOR_SYMBOL[player.color] : ""}
        </p>
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
