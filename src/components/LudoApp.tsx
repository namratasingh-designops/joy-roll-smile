import { useEffect } from "react";
import { useGame } from "@/game/store";
import { pauseAllAudio, resumeAllAudio } from "@/audio/audio";
import { GameScreen, KeyboardControls } from "./GameScreen";
import {
  BreakReminder,
  Celebration,
  ColorSelect,
  ExitConfirm,
  GrownUpSettings,
  HandoffScreen,
  HowToPlay,
  ModeSelect,
  ParentGate,
  Splash,
  StickerBook,
} from "./screens";

export default function LudoApp() {
  const screen = useGame((s) => s.screen);
  const overlay = useGame((s) => s.overlay);
  const init = useGame((s) => s.init);
  const settings = useGame((s) => s.settings);
  const setOverlay = useGame((s) => s.setOverlay);

  useEffect(() => {
    init();
  }, [init]);

  // pause + mute when the tab is hidden
  useEffect(() => {
    const onVis = () => (document.hidden ? pauseAllAudio() : resumeAllAudio());
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // gentle break reminder after 20 minutes of play
  useEffect(() => {
    if (!settings.breakReminder || screen !== "game") return;
    const t = setTimeout(() => setOverlay("break"), 20 * 60 * 1000);
    return () => clearTimeout(t);
  }, [settings.breakReminder, screen, setOverlay]);

  const classes = [settings.highContrast ? "hc" : "", settings.largerUI ? "bigger-ui" : ""].join(" ");

  return (
    <div className={`min-h-dvh bg-panel text-ink ${classes}`}>
      <KeyboardControls />
      {screen === "splash" && <Splash />}
      {screen === "mode" && <ModeSelect />}
      {screen === "color" && <ColorSelect />}
      {screen === "game" && <GameScreen />}
      {screen === "howto" && <HowToPlay />}
      {screen === "celebration" && <Celebration />}
      {screen === "stickers" && <StickerBook />}

      {overlay === "exit" && <ExitConfirm />}
      {overlay === "gate" && <ParentGate />}
      {overlay === "settings" && <GrownUpSettings />}
      {overlay === "handoff" && <HandoffScreen />}
      {overlay === "break" && <BreakReminder />}
    </div>
  );
}
