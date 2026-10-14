// Sons générés par le navigateur (partagés entre le site et l'admin)
const SOUNDS = { bip: 'Bip', sonnette: 'Sonnette', klaxon: 'Klaxon', alarme: 'Alarme', sirene: 'Sirène', voix: 'Voix' };

let AC;
function audioCtx() {
  if (!AC) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; AC = new C(); }
  return AC;
}
// Les navigateurs bloquent le son tant que la personne n'a pas touché la page
function unlockAudio() { const c = audioCtx(); if (c && c.state !== 'running') c.resume(); }
['pointerdown', 'touchstart', 'keydown'].forEach(e => addEventListener(e, unlockAudio, { passive: true }));

function tone(c, type, f, t0, d, v, f2, bell) {
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t0);
  if (f2) o.frequency.linearRampToValueAtTime(f2, t0 + d);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(v, t0 + 0.01);
  if (bell) g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  else { g.gain.setValueAtTime(v, t0 + d - 0.03); g.gain.linearRampToValueAtTime(0.0001, t0 + d); }
  o.connect(g).connect(c.destination);
  o.start(t0); o.stop(t0 + d + 0.05);
}

// Renvoie false si le navigateur bloque encore le son
function playSound(name, text) {
  const c = audioCtx();
  if (!c || c.state !== 'running') return false;
  const t = c.currentTime + 0.05;
  switch (name) {
    case 'bip':
      tone(c, 'sine', 880, t, 0.15, 0.3); tone(c, 'sine', 880, t + 0.25, 0.15, 0.3); break;
    case 'sonnette':
      tone(c, 'sine', 659, t, 1.2, 0.4, 0, true); tone(c, 'sine', 523, t + 0.5, 1.6, 0.4, 0, true); break;
    case 'klaxon':
      tone(c, 'square', 392, t, 0.7, 0.12); tone(c, 'square', 494, t, 0.7, 0.12); break;
    case 'alarme':
      for (let i = 0; i < 8; i++) tone(c, 'square', i % 2 ? 700 : 1000, t + i * 0.2, 0.18, 0.12); break;
    case 'sirene':
      for (let i = 0; i < 3; i++) { tone(c, 'triangle', 600, t + i * 1.2, 0.6, 0.3, 1200); tone(c, 'triangle', 1200, t + i * 1.2 + 0.6, 0.6, 0.3, 600); } break;
    case 'voix':
      if (!window.speechSynthesis || !text) return false;
      const u = new SpeechSynthesisUtterance(text); u.lang = 'fr-FR';
      speechSynthesis.cancel(); speechSynthesis.speak(u); break;
    default: return false;
  }
  return true;
}
