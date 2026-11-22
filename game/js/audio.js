// audio.js — every sound is synthesized live with WebAudio. No audio files
// ship with the game, so there is nothing to download and nothing to load.
// All of it is original: short oscillator blips composed for this game.

let ctx = null;
let muted = false;
let alarmNodes = null;

function ensureContext() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch (err) {
    ctx = null;
  }
  return ctx;
}

// Browsers only let audio start after a gesture; call this from the first
// key press or click so the first sound is not lost.
export function unlockAudio() {
  const c = ensureContext();
  if (c && c.state === "suspended") c.resume().catch(() => {});
}

export function setMuted(value) {
  muted = value;
  if (muted) stopAlarmLoop();
}

export function isMuted() {
  return muted;
}

function tone(freq, duration, type, volume, when, slideTo) {
  if (muted) return;
  const c = ensureContext();
  if (!c) return;
  try {
    const start = c.currentTime + (when || 0);
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume || 0.12, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  } catch (err) {
    // Audio is decoration; a failure must never break the game.
  }
}

export function playStep() {
  tone(140 + Math.random() * 40, 0.06, "triangle", 0.03);
}

export function playCoin() {
  tone(1560, 0.09, "sine", 0.14);
  tone(2093, 0.16, "sine", 0.12, 0.07);
}

export function playGrab() {
  tone(880, 0.1, "sine", 0.14);
  tone(1174, 0.12, "sine", 0.14, 0.08);
  tone(1568, 0.22, "sine", 0.14, 0.16);
}

export function playSmoke() {
  tone(320, 0.25, "sawtooth", 0.05, 0, 90);
}

export function playCaught() {
  tone(220, 0.5, "sawtooth", 0.16, 0, 110);
  tone(233, 0.5, "sawtooth", 0.12, 0.1, 116);
}

export function playWin() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((n, i) => tone(n, 0.35, "triangle", 0.14, i * 0.14));
}

export function playUnlock() {
  tone(660, 0.12, "square", 0.08);
  tone(990, 0.2, "square", 0.08, 0.1);
}

export function playClick() {
  tone(740, 0.06, "sine", 0.08);
}

// A soft two-tone alarm that loops while the alarm meter is full.
export function startAlarmLoop() {
  if (muted || alarmNodes) return;
  const c = ensureContext();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(620, c.currentTime);
    const lfo = c.createOscillator();
    lfo.frequency.value = 1.6;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 140;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    gain.gain.value = 0.045;
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start();
    lfo.start();
    alarmNodes = { osc, lfo, gain };
  } catch (err) {
    alarmNodes = null;
  }
}

export function stopAlarmLoop() {
  if (!alarmNodes) return;
  try {
    alarmNodes.osc.stop();
    alarmNodes.lfo.stop();
    alarmNodes.gain.disconnect();
  } catch (err) {
    // Already stopped; nothing to do.
  }
  alarmNodes = null;
}
