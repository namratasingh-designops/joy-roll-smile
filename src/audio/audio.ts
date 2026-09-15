/**
 * All sound is synthesized with Tone.js (no audio files) and speech uses the
 * Web Speech API. Everything is lazy: nothing starts before the first tap.
 */
import * as Tone from "tone";

export interface AudioSettings {
  sound: boolean;
  music: boolean;
  voice: boolean;
  soundVolume: number;
  musicVolume: number;
  voiceVolume: number;
  voiceRate: number;
}

let started = false;
let sfx: Tone.PolySynth | null = null;
let bell: Tone.MetalSynth | null = null;
let noise: Tone.NoiseSynth | null = null;
let marimba: Tone.PolySynth | null = null;
let musicLoop: Tone.Loop | null = null;
let musicGain: Tone.Gain | null = null;
let settings: AudioSettings = {
  sound: true,
  music: true,
  voice: true,
  soundVolume: 0.8,
  musicVolume: 0.3,
  voiceVolume: 1,
  voiceRate: 0.9,
};

export function setAudioSettings(next: AudioSettings) {
  settings = next;
  if (musicGain) musicGain.gain.rampTo(next.music ? next.musicVolume * 0.25 : 0, 0.3);
  if (!next.voice) stopVoice();
  if (started && next.music) startMusic();
}

export async function unlockAudio() {
  if (started) return;
  try {
    await Tone.start();
    Tone.getDestination().volume.value = -6;
    sfx = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.005, decay: 0.18, sustain: 0.02, release: 0.2 },
    }).toDestination();
    bell = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.5, release: 0.2 },
      harmonicity: 6,
      resonance: 3000,
    }).toDestination();
    bell.volume.value = -22;
    noise = new Tone.NoiseSynth({
      noise: { type: "brown" },
      envelope: { attack: 0.005, decay: 0.16, sustain: 0 },
    }).toDestination();
    noise.volume.value = -16;
    musicGain = new Tone.Gain(settings.music ? settings.musicVolume * 0.25 : 0).toDestination();
    marimba = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 0.5, sustain: 0.05, release: 0.6 },
    }).connect(musicGain);
    started = true;
    if (settings.music) startMusic();
  } catch {
    started = false;
  }
}

function note(n: string | string[], dur = "8n", vel = 0.7) {
  if (!settings.sound || !started || !sfx) return;
  try {
    sfx.triggerAttackRelease(n, dur, undefined, vel * settings.soundVolume);
  } catch {
    /* ignore */
  }
}

export const sound = {
  tap() {
    note("C5", "32n", 0.4);
  },
  rattle() {
    if (!settings.sound || !started || !noise) return;
    for (let i = 0; i < 4; i++) {
      noise.triggerAttackRelease("32n", Tone.now() + i * 0.07);
    }
  },
  thud() {
    note("C3", "16n", 0.8);
    if (settings.sound && noise) noise.triggerAttackRelease("16n");
  },
  hop(index: number) {
    const scale = ["C5", "D5", "E5", "G5", "A5", "C6"];
    note(scale[Math.min(index, scale.length - 1)] ?? "C5", "32n", 0.6);
  },
  star() {
    if (settings.sound && started && bell) bell.triggerAttackRelease("C6", "8n");
  },
  boing() {
    if (!settings.sound || !started || !sfx) return;
    const now = Tone.now();
    sfx.triggerAttackRelease("G5", "16n", now, 0.6 * settings.soundVolume);
    sfx.triggerAttackRelease("C4", "8n", now + 0.09, 0.6 * settings.soundVolume);
  },
  fanfare() {
    if (!settings.sound || !started || !sfx) return;
    const now = Tone.now();
    ["C5", "E5", "G5", "C6"].forEach((n, i) =>
      sfx!.triggerAttackRelease(n, "8n", now + i * 0.11, 0.7 * settings.soundVolume),
    );
  },
  win() {
    if (!settings.sound || !started || !sfx) return;
    const now = Tone.now();
    ["C5", "D5", "E5", "G5", "A5", "C6", "E6"].forEach((n, i) =>
      sfx!.triggerAttackRelease(n, "8n", now + i * 0.13, 0.75 * settings.soundVolume),
    );
  },
};

const TUNE = ["C4", "E4", "G4", "E4", "F4", "A4", "G4", "E4", "D4", "F4", "A4", "F4", "C4", "G4", "E4", "C4"];

function startMusic() {
  if (!started || !marimba) return;
  if (!musicLoop) {
    let i = 0;
    musicLoop = new Tone.Loop((time) => {
      marimba!.triggerAttackRelease(TUNE[i % TUNE.length] ?? "C4", "8n", time, 0.5);
      if (i % 4 === 0) marimba!.triggerAttackRelease("C3", "4n", time, 0.35);
      i++;
    }, "4n");
    Tone.getTransport().bpm.value = 96;
  }
  musicLoop.start(0);
  if (Tone.getTransport().state !== "started") Tone.getTransport().start();
}

export function pauseAllAudio() {
  stopVoice();
  if (Tone.getTransport().state === "started") Tone.getTransport().pause();
}

/**
 * Browsers suspend the audio context when the screen locks or the tab is
 * hidden (very common when a device is passed around in Family Play). Waking it
 * back up is what keeps dice rattles and cheers audible.
 */
export function ensureAudioReady() {
  if (!started) {
    void unlockAudio();
    return;
  }
  try {
    const ctx = Tone.getContext();
    if (ctx.state !== "running") void ctx.resume();
  } catch {
    /* ignore */
  }
  if (settings.music && Tone.getTransport().state !== "started") Tone.getTransport().start();
}

export function resumeAllAudio() {
  ensureAudioReady();
}

/* ---------------------------------- voice --------------------------------- */

function duckMusic(down: boolean) {
  if (!musicGain) return;
  const base = settings.music ? settings.musicVolume * 0.25 : 0;
  musicGain.gain.rampTo(down ? base * 0.35 : base, 0.2);
}

/**
 * `queue: true` keeps whatever is already speaking (used for the counting
 * words during a hop, which would otherwise cancel each other).
 */
export function speak(text: string, opts: { queue?: boolean } = {}) {
  if (!settings.voice || typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = settings.voiceRate;
    u.pitch = 1.15;
    u.volume = settings.voiceVolume;
    u.onstart = () => duckMusic(true);
    u.onend = () => duckMusic(false);
    if (!opts.queue) window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

export function stopVoice() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }
  duckMusic(false);
}

export function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* ignore */
    }
  }
}
