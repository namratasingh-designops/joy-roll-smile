import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { COLOR_HEX, COLOR_SYMBOL, type Color } from "@/game/board";
import type { Player } from "@/game/rules";
import { tokensHome } from "@/game/rules";
import Dice3D from "@/three/Dice3D";
import { useGame } from "@/game/store";

const COLOR_CLASS: Record<Color, string> = {
  blue: "bg-play-blue",
  red: "bg-play-red",
  green: "bg-play-green",
  yellow: "bg-play-yellow",
};

export function ChunkyButton({
  children,
  onClick,
  icon,
  tone = "panel",
  className = "",
  ariaLabel,
  disabled,
}: {
  children?: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  tone?: "panel" | "green" | "blue" | "red" | "yellow";
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  const tones: Record<string, string> = {
    panel: "bg-panel text-ink",
    green: "bg-play-green text-white",
    blue: "bg-play-blue text-white",
    red: "bg-play-red text-white",
    yellow: "bg-play-yellow text-ink",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`chunky touch-big inline-flex items-center justify-center gap-3 px-6 py-3 text-2xl font-bold disabled:opacity-60 ${tones[tone]} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}

export function Logo({ small = false }: { small?: boolean }) {
  const letters = [
    { l: "L", c: "bg-play-red" },
    { l: "U", c: "bg-play-blue" },
    { l: "D", c: "bg-play-green" },
    { l: "O", c: "bg-play-yellow" },
  ];
  return (
    <div className="select-none text-center">
      <div className="relative flex items-end justify-center gap-1">
        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl" aria-hidden>
          👑
        </span>
        {letters.map(({ l, c }) => (
          <span
            key={l}
            className={`${c} inline-flex ${small ? "h-11 w-10 text-3xl" : "h-16 w-14 text-5xl"} items-center justify-center rounded-2xl font-display font-black text-white shadow-toy`}
          >
            {l}
          </span>
        ))}
      </div>
      <p className="mt-2 rounded-full bg-panel px-4 py-1 font-display text-sm tracking-widest text-ink shadow-soft">
        PLAY · LEARN · SMILE
      </p>
    </div>
  );
}

export function IconToggle({
  label,
  icon,
  on,
  onClick,
}: {
  label: string;
  icon: string;
  on?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className="chunky touch-big flex flex-col items-center gap-1 bg-transparent p-0 shadow-none active:translate-y-1"
    >
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl shadow-soft ${
          on ? "bg-play-blue text-white" : "bg-panel text-ink/40"
        }`}
        aria-hidden
      >
        {icon}
      </span>
      <span className="font-display text-sm text-ink">{label}</span>
    </button>
  );
}

export function PlayerCard({
  player,
  active,
  compact = false,
}: {
  player: Player;
  active: boolean;
  compact?: boolean;
}) {
  const home = tokensHome(player);
  const total = player.tokens.length;
  const reduced = useGame((s) => s.settings.reducedMotion);
  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 rounded-2xl bg-panel px-3 py-2 shadow-soft ${
          active ? "ring-4 ring-play-blue" : ""
        }`}
      >
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full text-white ${COLOR_CLASS[player.color]}`}
          aria-hidden
        >
          {COLOR_SYMBOL[player.color]}
        </span>
        <span className="font-display text-base text-ink">{player.name}</span>
        <span className="text-sm text-ink/70">
          {home}/{total}
        </span>
      </div>
    );
  }
  return (
    <motion.div
      {...(reduced
        ? {}
        : {
            animate: { scale: active ? 1.06 : 1, x: active ? 8 : 0 },
            transition: { type: "spring" as const, stiffness: 260, damping: 18 },
          })}
      className={`flex items-center gap-3 rounded-3xl px-4 py-3 shadow-soft ${
        active ? "bg-sky/70 ring-4 ring-play-blue" : "bg-panel"
      }`}
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl text-white ${COLOR_CLASS[player.color]}`}
        aria-hidden
      >
        {COLOR_SYMBOL[player.color]}
      </span>
      <div className="min-w-0">
        <p className="truncate font-display text-xl text-ink">{player.name}</p>
        <div className="mt-1 flex items-center gap-1">
          {player.tokens.map((t, i) => (
            <span
              key={t.id}
              className={`h-3.5 w-3.5 rounded-full ${
                i < home ? COLOR_CLASS[player.color] : "bg-ink/20"
              }`}
              aria-hidden
            />
          ))}
          {active && <span className="ml-2 font-display text-sm text-ink">Your turn!</span>}
        </div>
      </div>
      <span className="sr-only">
        {player.name}, {COLOR_SYMBOL[player.color]} {player.color}, {home} of {total} tokens home
        {active ? ", active player" : ""}
      </span>
    </motion.div>
  );
}

export function RollDiceButton({ layout = "side" }: { layout?: "side" | "wide" }) {
  const phase = useGame((s) => s.phase);
  const dice = useGame((s) => s.dice);
  const roll = useGame((s) => s.roll);
  const game = useGame((s) => s.game);
  const showPointer = useGame((s) => s.showHandPointer);
  const reduced = useGame((s) => s.settings.reducedMotion);
  const isHumanTurn = !!game && !!game.players[game.turn]?.isHuman;
  const canRoll = phase === "idle" && isHumanTurn;

  return (
    <div className={`relative flex flex-col items-center ${layout === "wide" ? "w-full" : ""}`}>
      <motion.button
        type="button"
        onClick={roll}
        disabled={!canRoll}
        aria-label="Roll the dice"
        aria-keyshortcuts="Space Enter"
        {...(reduced || !canRoll
          ? {}
          : { animate: { scale: [1, 1.04, 1] }, transition: { duration: 1.6, repeat: Infinity } })}
        className={`chunky relative flex ${
          layout === "wide" ? "h-36 w-full" : "h-56 w-56"
        } flex-col items-center justify-end bg-play-blue pb-4 text-white disabled:opacity-70`}
      >
        <span
          className={`pointer-events-none absolute ${layout === "wide" ? "left-6 top-1 h-32 w-32" : "top-2 h-36 w-40"}`}
        >
          <Dice3D />
        </span>
        <span className="font-display text-3xl drop-shadow">Roll dice</span>
        {dice != null && phase !== "rolling" && (
          <motion.span
            key={dice}
            initial={{ scale: 0, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            className="absolute -right-3 -top-3 flex h-16 w-16 items-center justify-center rounded-full bg-panel font-display text-4xl text-ink shadow-toy"
          >
            {dice}
          </motion.span>
        )}
      </motion.button>
      {showPointer && canRoll && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute bottom-2 text-4xl"
          {...(reduced
            ? {}
            : { animate: { y: [0, -14, 0] }, transition: { duration: 0.8, repeat: Infinity } })}
        >
          👆
        </motion.span>
      )}
    </div>
  );
}

export function ValuesStrip() {
  const values = [
    { icon: "⭐", label: "Be kind" },
    { icon: "❤️", label: "Have fun" },
    { icon: "🙂", label: "Play together" },
    { icon: "🌱", label: "You can do it!" },
  ];
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 rounded-3xl bg-panel/90 px-6 py-2 shadow-soft">
      {values.map((v) => (
        <li key={v.label} className="flex items-center gap-2 font-display text-base text-ink">
          <span aria-hidden>{v.icon}</span>
          {v.label}
        </li>
      ))}
    </ul>
  );
}

export function LiveRegion() {
  const announce = useGame((s) => s.announce);
  return (
    <p aria-live="polite" className="sr-only">
      {announce}
    </p>
  );
}

/** Accessible DOM mirror of the movable 3D tokens (keyboard + screen reader). */
export function TokenButtons() {
  const moves = useGame((s) => s.moves);
  const phase = useGame((s) => s.phase);
  const choose = useGame((s) => s.chooseToken);
  if (phase !== "choosing" || !moves.length) return null;
  return (
    <div className="pointer-events-auto flex flex-wrap justify-center gap-2">
      {moves.map((m, i) => (
        <button
          key={m.tokenId}
          type="button"
          onClick={() => choose(m.tokenId)}
          className="chunky touch-big bg-panel px-4 py-2 text-lg font-bold text-ink"
          style={{ borderBottom: `6px solid ${COLOR_HEX[m.color]}` }}
        >
          {COLOR_SYMBOL[m.color]} Token {i + 1}
          <span className="sr-only">
            {m.color} token, {m.from < 0 ? "in base" : `on square ${m.from + 1}`}, move to{" "}
            {m.to >= 57 ? "home" : `square ${m.to + 1}`}
          </span>
        </button>
      ))}
    </div>
  );
}
