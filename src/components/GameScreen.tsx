import { Suspense, lazy, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useGame } from "@/game/store";
import { Mascot, SpeechBubble } from "./Mascot";
import { ChunkyButton, IconToggle, LiveRegion, Logo, PlayerCard, RollDiceButton, TokenButtons, ValuesStrip } from "./bits";
import { Playroom } from "./Playroom";
import { BoardFallback } from "./BoardFallback";
import { BoardBoundary, retryImport } from "./BoardBoundary";

const Board3D = lazy(() => retryImport(() => import("@/three/Board3D")));

function webglAvailable() {
  if (typeof document === "undefined") return true;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function Loader() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <motion.span
        className="text-6xl"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
        aria-hidden
      >
        🎲
      </motion.span>
      <span className="sr-only">Loading the board</span>
    </div>
  );
}

export function GameScreen() {
  const game = useGame((s) => s.game);
  const caption = useGame((s) => s.caption);
  const hint = useGame((s) => s.hint);
  const mood = useGame((s) => s.mood);
  const phase = useGame((s) => s.phase);
  const settings = useGame((s) => s.settings);
  const setOverlay = useGame((s) => s.setOverlay);
  const go = useGame((s) => s.go);
  const setSettings = useGame((s) => s.setSettings);
  const skipBuddies = useGame((s) => s.skipBuddies);
  const [webgl] = useState(() => webglAvailable());

  if (!game) return null;
  const active = game.players[game.turn]!;

  const board = (
    <div
      className="relative aspect-square w-full max-w-[min(92vw,72dvh)]"
      onClick={() => skipBuddies()}
    >
      {webgl ? (
        <BoardBoundary fallback={<BoardFallback />}>
          <Suspense fallback={<Loader />}>
            <Board3D />
          </Suspense>
        </BoardBoundary>
      ) : (
        <BoardFallback />
      )}
    </div>
  );

  const dicePanel = (
    <div className="flex flex-col items-center gap-3">
      <RollDiceButton />
      <div className="flex items-end gap-2">
        <Mascot mood={mood} size={72} reduced={settings.reducedMotion} />
        <SpeechBubble text={hint} className="max-w-[12rem] scale-90" />
      </div>
    </div>
  );

  return (
    <div className="relative min-h-dvh overflow-hidden pb-[env(safe-area-inset-bottom)]">
      <Playroom />
      <LiveRegion />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[110rem] flex-col gap-3 px-3 py-3 sm:px-5">
        {/* top bar */}
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="flex min-w-0 items-start gap-4">
            <div className="hidden sm:block">
              <Logo small />
            </div>
            <div className="hidden items-end gap-2 lg:flex">
              <Mascot mood={mood} size={110} reduced={settings.reducedMotion} />
              <SpeechBubble text={caption} />
            </div>
          </div>
          <nav className="flex shrink-0 gap-2 sm:gap-4" aria-label="Game options">
            <IconToggle label="Sound" icon="🔊" on={settings.sound} onClick={() => setSettings({ sound: !settings.sound })} />
            <IconToggle label="Music" icon="🎵" on={settings.music} onClick={() => setSettings({ music: !settings.music })} />
            <IconToggle label="Voice" icon="🗣" on={settings.voice} onClick={() => setSettings({ voice: !settings.voice })} />
            <IconToggle label="Settings" icon="⚙️" on onClick={() => setOverlay("gate")} />
          </nav>
        </header>

        {/* mobile caption */}
        <div className="flex items-end gap-2 lg:hidden">
          <Mascot mood={mood} size={64} reduced={settings.reducedMotion} />
          <SpeechBubble text={caption} className="max-w-[16rem] py-2" />
        </div>

        {/* main */}
        <main
          className={`flex flex-1 flex-col items-center gap-4 lg:grid lg:items-center ${
            settings.leftHanded
              ? "lg:grid-cols-[16rem_minmax(0,1fr)_16rem]"
              : "lg:grid-cols-[16rem_minmax(0,1fr)_16rem]"
          }`}
        >
          <div className={`order-2 w-full lg:order-none ${settings.leftHanded ? "lg:col-start-3" : ""}`}>
            <ul className="flex w-full gap-2 overflow-x-auto lg:flex-col lg:gap-3 lg:overflow-visible">
              {game.players.map((p) => (
                <li key={p.color} className="shrink-0 lg:shrink">
                  <span className="lg:hidden">
                    <PlayerCard player={p} active={p.color === active.color} compact />
                  </span>
                  <span className="hidden lg:block">
                    <PlayerCard player={p} active={p.color === active.color} />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="order-1 flex w-full justify-center lg:order-none lg:col-start-2">{board}</div>

          <div className={`order-3 hidden lg:flex lg:justify-center lg:order-none ${settings.leftHanded ? "lg:col-start-1 lg:row-start-1" : ""}`}>
            {dicePanel}
          </div>
        </main>

        {/* status + tokens */}
        <div className="flex flex-col items-center gap-2">
          <TokenButtons />
          <p className="rounded-3xl bg-panel px-6 py-2 font-display text-2xl text-ink shadow-soft">
            {phase === "choosing" ? "Tap a glowing token!" : phase === "rolling" ? "Rolling…" : "Let's play!"}
          </p>
        </div>

        {/* bottom bar */}
        <footer className="flex items-end justify-between gap-3">
          <ChunkyButton icon={<span aria-hidden>⬅</span>} onClick={() => setOverlay("exit")} ariaLabel="Exit the game">
            <span className="hidden sm:inline">Exit</span>
          </ChunkyButton>
          <div className="hidden flex-1 justify-center md:flex">
            <ValuesStrip />
          </div>
          <ChunkyButton icon={<span aria-hidden>❓</span>} onClick={() => go("howto")}>
            <span className="hidden sm:inline">How to play</span>
          </ChunkyButton>
        </footer>

        {/* phone dice button in the thumb zone */}
        <div
          className={`fixed bottom-2 left-0 right-0 z-20 flex px-4 pb-[env(safe-area-inset-bottom)] lg:hidden ${settings.leftHanded ? "justify-start" : "justify-end"}`}
        >
          <div className="w-full max-w-sm">
            <RollDiceButton layout="wide" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Keyboard play: space/enter rolls, arrows cycle tokens, escape pauses. */
export function KeyboardControls() {
  const roll = useGame((s) => s.roll);
  const moves = useGame((s) => s.moves);
  const phase = useGame((s) => s.phase);
  const choose = useGame((s) => s.chooseToken);
  const setOverlay = useGame((s) => s.setOverlay);
  const [index, setIndex] = useState(0);

  useEffect(() => setIndex(0), [moves]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && ["INPUT", "TEXTAREA", "BUTTON"].includes(target.tagName);
      if (e.key === "Escape") {
        setOverlay("exit");
        return;
      }
      if ((e.key === " " || e.key === "Enter") && !typing) {
        e.preventDefault();
        if (phase === "idle") roll();
        else if (phase === "choosing" && moves[index]) choose(moves[index].tokenId);
      }
      if (phase === "choosing" && (e.key === "ArrowRight" || e.key === "ArrowDown")) {
        setIndex((i) => (i + 1) % moves.length);
      }
      if (phase === "choosing" && (e.key === "ArrowLeft" || e.key === "ArrowUp")) {
        setIndex((i) => (i - 1 + moves.length) % moves.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, moves, index, roll, choose, setOverlay]);

  return null;
}
