// Short tones for the kitchen display, synthesised with Web Audio (no sound files to load or cache).
// Browsers only allow sound after a tap on the page; the PIN sign-in provides it, and `unlock` is called on every tap.

type AudioContextClass = typeof AudioContext;

const audioContextClass = (): AudioContextClass | undefined =>
  typeof window === 'undefined'
    ? undefined
    : window.AudioContext || (window as unknown as { webkitAudioContext?: AudioContextClass }).webkitAudioContext;

const TONES = {
  /** New ticket: two rising notes. */
  new: [880, 1175],
  /** Ticket cancelled or changed: three falling notes. */
  change: [659, 523, 392],
} as const;

export class Chime {
  private ctx: AudioContext | null = null;

  /** Create or resume audio after a user gesture. */
  unlock = (): void => {
    const Ctx = audioContextClass();
    if (!Ctx) return;
    try {
      this.ctx ??= new Ctx();
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  };

  play(kind: keyof typeof TONES): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    TONES[kind].forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.18;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    });
  }

  close(): void {
    void this.ctx?.close().catch(() => {});
    this.ctx = null;
  }
}
