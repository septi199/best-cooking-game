// Tiny WebAudio beeps, no sound files: a chop tick, a ready ding, a serve
// fanfare and an error buzz. The audio context is created on the first user
// gesture only; in screenshot mode nothing ever plays.

export function createSfx() {
  let context = null;

  function tone(freq, seconds, type, when) {
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = freq;
    const start = context.currentTime + (when || 0);
    gain.gain.setValueAtTime(0.12, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + seconds);
  }

  return {
    /** Call from a user gesture so the browser lets audio start. */
    unlock() {
      if (!context) {
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          context = new AudioContext();
        } catch {
          context = null;
        }
      }
      if (context && context.state === 'suspended') context.resume().catch(() => {});
    },
    chop() {
      tone(220, 0.06, 'square');
    },
    ding() {
      tone(880, 0.16, 'sine');
    },
    serve() {
      tone(523, 0.12, 'sine', 0);
      tone(659, 0.12, 'sine', 0.1);
      tone(784, 0.2, 'sine', 0.2);
    },
    error() {
      tone(160, 0.2, 'sawtooth');
    },
    tick() {
      tone(1200, 0.04, 'sine');
    },
  };
}
