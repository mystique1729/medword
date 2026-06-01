// ============================================================
// DESIGN: "Vital Signs" — Sound engine using Web Audio API
// All sounds generated procedurally — no external files needed
// Global master gain node for volume control
// ============================================================

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

// Volume: 0.0 (mute) to 1.0 (full). Persisted to localStorage.
let _volume = (() => {
  try {
    const saved = localStorage.getItem('medword-volume');
    return saved !== null ? parseFloat(saved) : 0.8;
  } catch {
    return 0.8;
  }
})();

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(_volume, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

function getMaster(): GainNode {
  getCtx(); // ensure created
  return masterGain!;
}

function resume() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Get current volume (0–1) */
export function getVolume(): number {
  return _volume;
}

/** Set master volume (0–1). Persisted to localStorage. */
export function setVolume(v: number) {
  _volume = Math.max(0, Math.min(1, v));
  try { localStorage.setItem('medword-volume', String(_volume)); } catch {}
  if (masterGain && audioCtx) {
    masterGain.gain.setValueAtTime(_volume, audioCtx.currentTime);
  }
}

// ---- Individual sounds ----

// Correct letter revealed — bright chime
export function playCorrectLetter() {
  if (_volume === 0) return;
  const ctx = resume();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(getMaster());
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, t);
  osc.frequency.exponentialRampToValueAtTime(1320, t + 0.1);
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  osc.start(t);
  osc.stop(t + 0.4);
}

// Wrong guess — low buzz
export function playWrongGuess() {
  if (_volume === 0) return;
  const ctx = resume();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(getMaster());
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(120, t);
  osc.frequency.exponentialRampToValueAtTime(80, t + 0.3);
  gain.gain.setValueAtTime(0.25, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  osc.start(t);
  osc.stop(t + 0.35);
}

// Word solved — triumphant fanfare
export function playWordSolved() {
  if (_volume === 0) return;
  const ctx = resume();
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    const t = ctx.currentTime + i * 0.12;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(getMaster());
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.start(t);
    osc.stop(t + 0.5);
  });
}

// Game over — grand finale
export function playGameOver() {
  if (_volume === 0) return;
  const ctx = resume();
  const melody = [523, 659, 784, 659, 784, 1047];
  melody.forEach((freq, i) => {
    const t = ctx.currentTime + i * 0.15;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(getMaster());
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.start(t);
    osc.stop(t + 0.6);
  });
}

// Score awarded — quick positive blip
export function playScoreAwarded() {
  if (_volume === 0) return;
  const ctx = resume();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(getMaster());
  osc.type = 'sine';
  osc.frequency.setValueAtTime(660, t);
  osc.frequency.exponentialRampToValueAtTime(880, t + 0.08);
  gain.gain.setValueAtTime(0.2, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  osc.start(t);
  osc.stop(t + 0.2);
}

// Score deducted — descending tone
export function playScoreDeducted() {
  if (_volume === 0) return;
  const ctx = resume();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(getMaster());
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, t);
  osc.frequency.exponentialRampToValueAtTime(220, t + 0.25);
  gain.gain.setValueAtTime(0.2, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  osc.start(t);
  osc.stop(t + 0.3);
}

// Team turn change — soft notification
export function playTurnChange() {
  if (_volume === 0) return;
  const ctx = resume();
  const t = ctx.currentTime;
  [440, 550].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(getMaster());
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t + i * 0.1);
    gain.gain.setValueAtTime(0.15, t + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.3);
    osc.start(t + i * 0.1);
    osc.stop(t + i * 0.1 + 0.3);
  });
}

// Button click — subtle tick
export function playClick() {
  if (_volume === 0) return;
  const ctx = resume();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(getMaster());
  osc.type = 'square';
  osc.frequency.setValueAtTime(800, t);
  gain.gain.setValueAtTime(0.05, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  osc.start(t);
  osc.stop(t + 0.05);
}
