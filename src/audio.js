// Procedural Web Audio Engine for ASHI TUNNEL

export class TunnelAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.ambientGain = null;
    this.humOsc1 = null;
    this.humOsc2 = null;
    this.muted = false;
    this.stepToggle = false;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.8;
    this.master.connect(this.ctx.destination);

    // Subtle Subway Fluorescent 100Hz Hum + Distant Ventilation Rumble
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0.055;
    this.ambientGain.connect(this.master);

    this.humOsc1 = this.ctx.createOscillator();
    this.humOsc1.type = "sine";
    this.humOsc1.frequency.value = 55;

    this.humOsc2 = this.ctx.createOscillator();
    this.humOsc2.type = "triangle";
    this.humOsc2.frequency.value = 100;
    const hum2Gain = this.ctx.createGain();
    hum2Gain.gain.value = 0.25;
    this.humOsc2.connect(hum2Gain);
    hum2Gain.connect(this.ambientGain);
    this.humOsc1.connect(this.ambientGain);

    // Filtered brown/pink noise room tone
    const bufSize = this.ctx.sampleRate * 2;
    const noiseBuf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.03 * white) / 1.03;
      lastOut = data[i];
      data[i] *= 2.2;
    }
    const roomNoise = this.ctx.createBufferSource();
    roomNoise.buffer = noiseBuf;
    roomNoise.loop = true;

    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 220;
    roomNoise.connect(lp);
    lp.connect(this.ambientGain);

    this.humOsc1.start();
    this.humOsc2.start();
    roomNoise.start();
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.8, this.ctx.currentTime, 0.05);
    }
  }

  setEerieMode(active) {
    if (!this.ctx || !this.humOsc1) return;
    const now = this.ctx.currentTime;
    this.humOsc1.frequency.setTargetAtTime(active ? 41 : 55, now, 0.3);
    this.humOsc2.frequency.setTargetAtTime(active ? 73 : 100, now, 0.3);
    this.ambientGain.gain.setTargetAtTime(active ? 0.11 : 0.055, now, 0.3);
  }

  playStep(isSprint = false) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    this.stepToggle = !this.stepToggle;

    // Short filtered noise burst + subtle ceramic tile click
    const dur = 0.065;
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) {
      const env = Math.pow(1 - i / ch.length, 2.4);
      ch[i] = (Math.random() * 2 - 1) * env;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    const baseFreq = this.stepToggle ? 680 : 740;
    bp.frequency.value = isSprint ? baseFreq * 1.18 : baseFreq;
    bp.Q.value = 1.8;

    const g = this.ctx.createGain();
    g.gain.value = isSprint ? 0.16 : 0.1;

    src.connect(bp);
    bp.connect(g);
    g.connect(this.master);
    src.start(now);

    // Low heel thud
    const heel = this.ctx.createOscillator();
    const hg = this.ctx.createGain();
    heel.type = "sine";
    heel.frequency.setValueAtTime(isSprint ? 130 : 105, now);
    heel.frequency.exponentialRampToValueAtTime(42, now + 0.055);
    hg.gain.setValueAtTime(isSprint ? 0.12 : 0.075, now);
    hg.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    heel.connect(hg);
    hg.connect(this.master);
    heel.start(now);
    heel.stop(now + 0.065);
  }

  playZoom(zoomIn) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(zoomIn ? 320 : 480, now);
    osc.frequency.exponentialRampToValueAtTime(zoomIn ? 520 : 280, now + 0.07);
    g.gain.setValueAtTime(0.04, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
    osc.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  playCorrectChime(newStage) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    // Pleasant subway two-note chime (Ding-Dong -> rising slightly with stage)
    const semitoneBoost = Math.min(10, newStage) * 18;
    const notes = [523.25 + semitoneBoost, 659.25 + semitoneBoost];
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.16;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.14, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.connect(g);
      g.connect(this.master);
      osc.start(t);
      osc.stop(t + 0.58);
    });
  }

  playWrongBuzz() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    // Horror sub-bass impact + dissonant tritone buzz
    [58, 82.4, 116].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = idx === 1 ? "sawtooth" : "sine";
      osc.frequency.setValueAtTime(freq * 1.4, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.65, now + 0.65);
      g.gain.setValueAtTime(idx === 1 ? 0.09 : 0.22, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc.connect(g);
      g.connect(this.master);
      osc.start(now);
      osc.stop(now + 0.72);
    });
  }

  playVictory() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    chord.forEach((freq, i) => {
      const t = now + i * 0.11;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.13, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + 2.2);
      osc.connect(g);
      g.connect(this.master);
      osc.start(t);
      osc.stop(t + 2.3);
    });
  }
}

