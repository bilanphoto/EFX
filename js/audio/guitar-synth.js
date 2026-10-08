/**
 * Electric Guitar Synthesizer
 * Generates realistic dry electric guitar tone using harmonic synthesis,
 * transient pick noise, pickup comb filtering, and frequency-dependent string damping.
 */
class GuitarSynth {
  constructor(engine) {
    this.engine = engine;
    this.activeVoices = new Map();
  }

  get ctx() {
    return this.engine.ctx;
  }

  get destination() {
    return this.engine.inputGain;
  }

  /**
   * Play a guitar note
   * @param {number} freq - Frequency in Hz (e.g. 82.41 for Low E)
   * @param {number} velocity - 0 to 1
   * @param {number} duration - Note duration in seconds (optional)
   * @param {string} stringId - Identifier for stopping later
   */
  pluck(freq, velocity = 0.8, duration = 3.0, stringId = null) {
    if (!this.engine.isInitialized || !this.ctx) return;

    const t = this.ctx.currentTime;
    const voiceId = stringId || `note_${freq}_${Math.random()}`;

    // If string already playing, choke/dampen previous note gently
    if (this.activeVoices.has(voiceId)) {
      this.dampen(voiceId, 0.05);
    }

    // 1. Pick Attack Transient (burst of metallic pick impact)
    const pickBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.025), this.ctx.sampleRate);
    const pickData = pickBuffer.getChannelData(0);
    for (let i = 0; i < pickData.length; i++) {
      // Noise burst with exponential decay
      const env = Math.exp(-i / (this.ctx.sampleRate * 0.004));
      pickData[i] = (Math.random() * 2 - 1) * env * 0.45;
    }
    const pickSource = this.ctx.createBufferSource();
    pickSource.buffer = pickBuffer;

    const pickFilter = this.ctx.createBiquadFilter();
    pickFilter.type = 'bandpass';
    pickFilter.frequency.setValueAtTime(freq * 3, t);
    pickFilter.Q.setValueAtTime(2.5, t);

    const pickGain = this.ctx.createGain();
    pickGain.gain.setValueAtTime(velocity * 0.35, t);
    pickSource.connect(pickFilter);
    pickFilter.connect(pickGain);

    // 2. Main Harmonic Generators (Dual oscillators with phase offset & harmonic detune)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const oscSub = this.ctx.createOscillator();

    // Sawtooth + Triangle gives authentic guitar string harmonic series
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, t);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 1.0015, t); // micro-chorus detune

    oscSub.type = 'sine';
    oscSub.frequency.setValueAtTime(freq, t); // Fundamental body weight

    // 3. Pickup Position Comb Filter (models distance from bridge to pickup)
    const pickupFilter = this.ctx.createBiquadFilter();
    pickupFilter.type = 'peaking';
    // Typical guitar pickup resonant peak around 2.2kHz - 3.8kHz
    pickupFilter.frequency.setValueAtTime(Math.min(3200, freq * 5 + 1200), t);
    pickupFilter.Q.setValueAtTime(2.2, t);
    pickupFilter.gain.setValueAtTime(6.0, t);

    // 4. Dynamic String Damping Lowpass Filter (Harmonics decay faster than fundamental)
    const dampingFilter = this.ctx.createBiquadFilter();
    dampingFilter.type = 'lowpass';
    const initCutoff = Math.min(9000, freq * 8 + 3000 * velocity);
    dampingFilter.frequency.setValueAtTime(initCutoff, t);
    // Envelope: initial burst of bright harmonics decays quickly to fundamental
    dampingFilter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.5, 300), t + Math.min(duration, 2.5));

    // 5. Amplitude Envelope
    const ampGain = this.ctx.createGain();
    ampGain.gain.setValueAtTime(0.0001, t);
    // Instantaneous attack (0.003s)
    ampGain.gain.exponentialRampToValueAtTime(velocity * 0.45, t + 0.003);
    // Natural exponential guitar sustain decay
    const decayTime = Math.min(duration, 3.5);
    ampGain.gain.exponentialRampToValueAtTime(velocity * 0.08, t + 0.6);
    ampGain.gain.exponentialRampToValueAtTime(0.0001, t + decayTime);

    // Routing
    const voiceMixer = this.ctx.createGain();
    voiceMixer.gain.setValueAtTime(1.0, t);

    const osc1Gain = this.ctx.createGain();
    osc1Gain.gain.setValueAtTime(0.35, t);
    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.45, t);
    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.20, t);

    osc1.connect(osc1Gain);
    osc2.connect(osc2Gain);
    oscSub.connect(subGain);

    osc1Gain.connect(voiceMixer);
    osc2Gain.connect(voiceMixer);
    subGain.connect(voiceMixer);
    pickGain.connect(voiceMixer);

    voiceMixer.connect(dampingFilter);
    dampingFilter.connect(pickupFilter);
    pickupFilter.connect(ampGain);
    ampGain.connect(this.destination);

    // Start nodes
    osc1.start(t);
    osc2.start(t);
    oscSub.start(t);
    pickSource.start(t);

    const stopTime = t + decayTime + 0.1;
    osc1.stop(stopTime);
    osc2.stop(stopTime);
    oscSub.stop(stopTime);
    pickSource.stop(t + 0.03);

    const voice = {
      id: voiceId,
      ampGain,
      oscillators: [osc1, osc2, oscSub],
      stopTime
    };

    this.activeVoices.set(voiceId, voice);

    // Clean up when stopped
    setTimeout(() => {
      if (this.activeVoices.get(voiceId) === voice) {
        this.activeVoices.delete(voiceId);
      }
    }, (decayTime + 0.2) * 1000);

    return voice;
  }

  /**
   * Dampen/mute an active string (like palm muting or note release)
   */
  dampen(voiceId, fadeTime = 0.08) {
    if (!this.activeVoices.has(voiceId) || !this.ctx) return;
    const voice = this.activeVoices.get(voiceId);
    const t = this.ctx.currentTime;
    try {
      voice.ampGain.gain.cancelScheduledValues(t);
      voice.ampGain.gain.setValueAtTime(voice.ampGain.gain.value, t);
      voice.ampGain.gain.exponentialRampToValueAtTime(0.0001, t + fadeTime);
      setTimeout(() => {
        voice.oscillators.forEach(osc => {
          try { osc.stop(); } catch(e) {}
        });
        this.activeVoices.delete(voiceId);
      }, fadeTime * 1000);
    } catch(e) {}
  }

  /**
   * Strum a chord (array of freqs with slight millisecond strum delay)
   */
  strumChord(freqs, velocity = 0.8, downstroke = true, strumSpeedMs = 28) {
    const list = downstroke ? [...freqs] : [...freqs].reverse();
    list.forEach((freq, idx) => {
      setTimeout(() => {
        // Slight velocity humanization
        const vel = velocity * (0.85 + Math.random() * 0.2);
        this.pluck(freq, vel, 3.2, `strum_${idx}`);
      }, idx * strumSpeedMs);
    });
  }

  // Guitar Standard Tuning (E2, A2, D3, G3, B3, E4)
  static TUNING = {
    E2: 82.41,
    A2: 110.00,
    D3: 146.83,
    G3: 196.00,
    B3: 246.94,
    E4: 329.63
  };

  // Common Guitar Chords (in Hz)
  static CHORDS = {
    'E':  [82.41, 123.47, 164.81, 207.65, 246.94, 329.63], // E2 B2 E3 G#3 B3 E4
    'Em': [82.41, 123.47, 164.81, 196.00, 246.94, 329.63], // E2 B2 E3 G3 B3 E4
    'A':  [110.00, 164.81, 220.00, 277.18, 329.63],        // A2 E3 A3 C#4 E4
    'Am': [110.00, 164.81, 220.00, 261.63, 329.63],        // A2 E3 A3 C4 E4
    'D':  [146.83, 220.00, 293.66, 369.99],                // D3 A3 D4 F#4
    'Dm': [146.83, 220.00, 293.66, 349.23],                // D3 A3 D4 F4
    'G':  [98.00, 123.47, 146.83, 196.00, 246.94, 392.00], // G2 B2 D3 G3 B3 G4
    'C':  [130.81, 164.81, 196.00, 261.63, 329.63],        // C3 E3 G3 C4 E4
    'F':  [87.31, 130.81, 174.61, 220.00, 261.63, 349.23], // F2 C3 F3 A3 C4 F4
    'E5': [82.41, 123.47, 164.81],                         // Heavy Power Chord E5
    'A5': [110.00, 164.81, 220.00],                        // Heavy Power Chord A5
    'D5': [146.83, 220.00, 293.66]                         // Heavy Power Chord D5
  };
}

window.GuitarSynth = GuitarSynth;
