// Audio synthesizer using Web Audio API for realistic physics sounds
let audioCtx: AudioContext | null = null;
let isMuted = false;

export const setSoundMuted = (muted: boolean) => {
  isMuted = muted;
};

export const getSoundMuted = () => isMuted;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playRatchetSound(pitch = 1) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(320 * pitch, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.04);

  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.05);
}

export function playLaunchSound(speed = 4) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  const baseFreq = 180 + speed * 45;
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, ctx.currentTime + 0.35);

  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.42);
}

export function playImpactSound(energy = 8) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(120, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.25);

  const vol = Math.min(0.3, 0.08 + energy * 0.006);
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.26);
}

export function playWaterDropSound(pitch = 1) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(500 * pitch, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800 * pitch, ctx.currentTime + 0.08);

  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.11);
}

export function playSuccessChime() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

    gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + idx * 0.08);
    osc.stop(ctx.currentTime + idx * 0.08 + 0.38);
  });
}

export function playTurbineWhir(rpmRatio = 1) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  const freq = 120 + Math.min(600, rpmRatio * 350);
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(80, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freq, ctx.currentTime + 0.3);

  gain.gain.setValueAtTime(0.02, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.2);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.75);
}

export function playWaterSplash(energyRatio = 1) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Noise-like splash using FM / modulated oscillators
  const osc = ctx.createOscillator();
  const mod = ctx.createOscillator();
  const modGain = ctx.createGain();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(240 * energyRatio, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.35);

  mod.type = 'sawtooth';
  mod.frequency.setValueAtTime(45, ctx.currentTime);
  modGain.gain.setValueAtTime(150 * energyRatio, ctx.currentTime);

  mod.connect(modGain);
  modGain.connect(osc.frequency);

  const vol = Math.min(0.25, 0.06 + energyRatio * 0.08);
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);

  mod.start();
  osc.start();
  mod.stop(ctx.currentTime + 0.36);
  osc.stop(ctx.currentTime + 0.36);
}

export function playSkidSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(260, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.2);

  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.24);
}

export function playErrorBuzz() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.setValueAtTime(120, ctx.currentTime + 0.1);

  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.24);
}

// Continuous ambient waterfall sound
let waterfallNoiseNode: AudioBufferSourceNode | null = null;
let waterfallGainNode: GainNode | null = null;
let waterfallFilterNode: BiquadFilterNode | null = null;

export function startWaterfallAudio(volume = 0.15) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Stop any existing instance
  stopWaterfallAudio();

  try {
    // 2-second white/pink noise buffer
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Pink noise filter approximation
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06;
      b6 = white * 0.115926;
    }

    waterfallNoiseNode = ctx.createBufferSource();
    waterfallNoiseNode.buffer = noiseBuffer;
    waterfallNoiseNode.loop = true;

    // Low-pass / band-pass filter to sound like natural water rush
    waterfallFilterNode = ctx.createBiquadFilter();
    waterfallFilterNode.type = 'lowpass';
    waterfallFilterNode.frequency.setValueAtTime(850, ctx.currentTime);
    waterfallFilterNode.Q.setValueAtTime(1.2, ctx.currentTime);

    waterfallGainNode = ctx.createGain();
    waterfallGainNode.gain.setValueAtTime(0.001, ctx.currentTime);
    waterfallGainNode.gain.linearRampToValueAtTime(Math.min(0.3, volume), ctx.currentTime + 0.5);

    waterfallNoiseNode.connect(waterfallFilterNode);
    waterfallFilterNode.connect(waterfallGainNode);
    waterfallGainNode.connect(ctx.destination);

    waterfallNoiseNode.start(0);
  } catch (err) {
    console.warn('Waterfall audio synthesis error:', err);
  }
}

export function updateWaterfallAudioVolume(volume: number) {
  if (!waterfallGainNode || isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  waterfallGainNode.gain.linearRampToValueAtTime(Math.min(0.3, volume), ctx.currentTime + 0.1);
}

export function stopWaterfallAudio() {
  if (waterfallNoiseNode) {
    try {
      waterfallNoiseNode.stop();
      waterfallNoiseNode.disconnect();
    } catch {
      // ignore
    }
    waterfallNoiseNode = null;
  }
  if (waterfallGainNode) {
    waterfallGainNode.disconnect();
    waterfallGainNode = null;
  }
  if (waterfallFilterNode) {
    waterfallFilterNode.disconnect();
    waterfallFilterNode = null;
  }
}

export function playSpringBounceSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(280, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(160, ctx.currentTime + 0.08);
  osc.frequency.linearRampToValueAtTime(320, ctx.currentTime + 0.18);
  osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.35);

  gain.gain.setValueAtTime(0.18, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.36);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.38);
}

export function playViscousSquishSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(130, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);

  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.33);
}



