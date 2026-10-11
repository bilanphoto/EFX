/**
 * Professional Chromatic Guitar Tuner Engine
 * High-precision pitch detection with anti-flicker hysteresis, lowpass harmonic filtering,
 * note-hold grace period, and McLeod Pitch Method (MPM) normalized autocorrelation.
 */
class GuitarTuner {
  constructor(engine) {
    this.engine = engine;
    this.analyser = null;
    this.lowpassFilter = null;
    this.highpassFilter = null;
    this.buffer = null;
    this.corrBuffer = null;
    this.isRunning = false;
    this.animationId = null;

    // Callback invoked every frame: (info) => void
    this.onPitchUpdate = null;

    // Pitch settings
    this.a4 = 440; // Reference A4 frequency (430 - 450 Hz)
    this.sensitivity = 'normal'; // 'normal' | 'high' | 'low'
    this.noiseGateThreshold = 0.012;
    this.clarityThreshold = 0.75;
    this.holdDurationMs = 1800; // 1.8 seconds note hold before clearing

    // Anti-flicker & Stabilization State
    this.lastValidPitch = null;
    this.lastActiveTime = 0;
    this.candidateNote = null;
    this.candidateCount = 0;
    this.activeNote = null;
    this.smoothedCents = 0;
    this.smoothedFreq = 0;

    // Tuning presets
    this.currentPreset = 'standard';
    this.NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    this.TUNING_PRESETS = {
      standard: {
        name: 'Standard (E A D G B E)',
        strings: [
          { str: 6, note: 'E2', freq: 82.41 },
          { str: 5, note: 'A2', freq: 110.00 },
          { str: 4, note: 'D3', freq: 146.83 },
          { str: 3, note: 'G3', freq: 196.00 },
          { str: 2, note: 'B3', freq: 246.94 },
          { str: 1, note: 'E4', freq: 329.63 }
        ]
      },
      drop_d: {
        name: 'Drop D (D A D G B E)',
        strings: [
          { str: 6, note: 'D2', freq: 73.42 },
          { str: 5, note: 'A2', freq: 110.00 },
          { str: 4, note: 'D3', freq: 146.83 },
          { str: 3, note: 'G3', freq: 196.00 },
          { str: 2, note: 'B3', freq: 246.94 },
          { str: 1, note: 'E4', freq: 329.63 }
        ]
      },
      half_step_down: {
        name: 'Half-Step Down / Eb',
        strings: [
          { str: 6, note: 'D#2', freq: 77.78 },
          { str: 5, note: 'G#2', freq: 103.83 },
          { str: 4, note: 'C#3', freq: 138.59 },
          { str: 3, note: 'F#3', freq: 185.00 },
          { str: 2, note: 'A#3', freq: 233.08 },
          { str: 1, note: 'D#4', freq: 311.13 }
        ]
      },
      full_step_down: {
        name: 'Full-Step Down / D',
        strings: [
          { str: 6, note: 'D2', freq: 73.42 },
          { str: 5, note: 'G2', freq: 98.00 },
          { str: 4, note: 'C3', freq: 130.81 },
          { str: 3, note: 'F3', freq: 174.61 },
          { str: 2, note: 'A3', freq: 220.00 },
          { str: 1, note: 'D4', freq: 293.66 }
        ]
      },
      open_d: {
        name: 'Open D (D A D F# A D)',
        strings: [
          { str: 6, note: 'D2', freq: 73.42 },
          { str: 5, note: 'A2', freq: 110.00 },
          { str: 4, note: 'D3', freq: 146.83 },
          { str: 3, note: 'F#3', freq: 185.00 },
          { str: 2, note: 'A3', freq: 220.00 },
          { str: 1, note: 'D4', freq: 293.66 }
        ]
      },
      open_g: {
        name: 'Open G (D G D G B D)',
        strings: [
          { str: 6, note: 'D2', freq: 73.42 },
          { str: 5, note: 'G2', freq: 98.00 },
          { str: 4, note: 'D3', freq: 146.83 },
          { str: 3, note: 'G3', freq: 196.00 },
          { str: 2, note: 'B3', freq: 246.94 },
          { str: 1, note: 'D4', freq: 293.66 }
        ]
      },
      dadgad: {
        name: 'DADGAD (D A D G A D)',
        strings: [
          { str: 6, note: 'D2', freq: 73.42 },
          { str: 5, note: 'A2', freq: 110.00 },
          { str: 4, note: 'D3', freq: 146.83 },
          { str: 3, note: 'G3', freq: 196.00 },
          { str: 2, note: 'A3', freq: 220.00 },
          { str: 1, note: 'D4', freq: 293.66 }
        ]
      },
      chromatic: {
        name: 'Chromatic (All 12 Notes)',
        strings: []
      }
    };
  }

  setA4(freq) {
    const parsed = parseFloat(freq);
    if (!isNaN(parsed) && parsed >= 430 && parsed <= 450) {
      this.a4 = parsed;
    }
  }

  setSensitivity(level) {
    this.sensitivity = level;
    if (level === 'high') {
      this.noiseGateThreshold = 0.006;
      this.clarityThreshold = 0.65;
    } else if (level === 'low') {
      this.noiseGateThreshold = 0.022;
      this.clarityThreshold = 0.85;
    } else { // 'normal'
      this.noiseGateThreshold = 0.012;
      this.clarityThreshold = 0.75;
    }
  }

  setTuningPreset(presetKey) {
    if (this.TUNING_PRESETS[presetKey]) {
      this.currentPreset = presetKey;
    }
  }

  start() {
    if (!this.engine.ctx) return;
    const ctx = this.engine.ctx;

    // 1. Highpass filter (cuts sub-bass rumble < 55 Hz)
    this.highpassFilter = ctx.createBiquadFilter();
    this.highpassFilter.type = 'highpass';
    this.highpassFilter.frequency.value = 55;
    this.highpassFilter.Q.value = 0.7;

    // 2. Lowpass filter (cuts harmonics & pick noise > 750 Hz)
    // This is the key secret to rock-solid guitar fundamental detection!
    this.lowpassFilter = ctx.createBiquadFilter();
    this.lowpassFilter.type = 'lowpass';
    this.lowpassFilter.frequency.value = 750;
    this.lowpassFilter.Q.value = 0.7;

    // 3. Analyser
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.buffer = new Float32Array(this.analyser.fftSize);
    this.corrBuffer = new Float32Array(1024);

    // Tap into pre-effect clean guitar input
    const tapSource = this.engine.inputBoostGain || this.engine.inputGain;
    if (tapSource) {
      try {
        tapSource.connect(this.highpassFilter);
        this.highpassFilter.connect(this.lowpassFilter);
        this.lowpassFilter.connect(this.analyser);
      } catch (e) {
        console.warn('Tuner tap connection error:', e);
      }
    }

    this.isRunning = true;
    this.lastActiveTime = 0;
    this.lastValidPitch = null;
    this.candidateNote = null;
    this.candidateCount = 0;
    this.smoothedCents = 0;

    this._detectLoop();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    const tapSource = this.engine.inputBoostGain || this.engine.inputGain;
    if (tapSource && this.highpassFilter) {
      try { tapSource.disconnect(this.highpassFilter); } catch (e) {}
    }
    if (this.highpassFilter && this.lowpassFilter) {
      try { this.highpassFilter.disconnect(this.lowpassFilter); } catch (e) {}
    }
    if (this.lowpassFilter && this.analyser) {
      try { this.lowpassFilter.disconnect(this.analyser); } catch (e) {}
    }

    this.lastValidPitch = null;
    this.candidateNote = null;
    this.candidateCount = 0;
    this.smoothedCents = 0;

    if (this.onPitchUpdate) {
      this.onPitchUpdate(this._getIdleInfo());
    }
  }

  _detectLoop() {
    if (!this.isRunning) return;

    this.analyser.getFloatTimeDomainData(this.buffer);
    const sampleRate = this.engine.ctx.sampleRate;
    const result = this._autoCorrelate(this.buffer, sampleRate);

    const now = performance.now();

    if (result && result.freq > 0) {
      const rawInfo = this._freqToNote(result.freq, result.clarity);

      // Debounce & hysteresis: Require 2 consecutive frames for note name changes
      if (rawInfo.note === this.candidateNote) {
        this.candidateCount++;
      } else {
        this.candidateNote = rawInfo.note;
        this.candidateCount = 1;
      }

      if (this.candidateCount >= 2 || !this.activeNote) {
        this.activeNote = rawInfo.note;
      }

      // Smooth cents & freq with Exponential Moving Average (EMA)
      this.smoothedCents = this.smoothedCents * 0.72 + rawInfo.cents * 0.28;
      this.smoothedFreq = this.smoothedFreq * 0.75 + rawInfo.freq * 0.25;

      const pitchInfo = {
        ...rawInfo,
        note: this.activeNote,
        noteName: this.activeNote.replace(/[0-9]/g, ''),
        octave: this.activeNote.replace(/[^0-9]/g, ''),
        freq: Math.round(this.smoothedFreq * 10) / 10,
        cents: Math.round(this.smoothedCents * 10) / 10,
        inTune: Math.abs(this.smoothedCents) <= 3.5,
        direction: Math.abs(this.smoothedCents) <= 3.5 ? 'in-tune' : (this.smoothedCents < 0 ? 'flat' : 'sharp'),
        isHolding: false,
        isIdle: false
      };

      this.lastValidPitch = pitchInfo;
      this.lastActiveTime = now;

      if (this.onPitchUpdate) {
        this.onPitchUpdate(pitchInfo);
      }
    } else {
      // Signal fell below noise gate or clarity threshold
      if (this.lastValidPitch && (now - this.lastActiveTime < this.holdDurationMs)) {
        // Hold the detected note steadily so the user can easily read it!
        this.smoothedCents *= 0.98; // gentle settling
        const heldPitch = {
          ...this.lastValidPitch,
          cents: Math.round(this.smoothedCents * 10) / 10,
          inTune: Math.abs(this.smoothedCents) <= 3.5,
          direction: Math.abs(this.smoothedCents) <= 3.5 ? 'in-tune' : (this.smoothedCents < 0 ? 'flat' : 'sharp'),
          isHolding: true,
          isIdle: false
        };

        if (this.onPitchUpdate) {
          this.onPitchUpdate(heldPitch);
        }
      } else {
        // Hold duration expired -> Calm idle state
        this.lastValidPitch = null;
        this.candidateNote = null;
        this.candidateCount = 0;
        this.activeNote = null;
        this.smoothedCents = 0;

        if (this.onPitchUpdate) {
          this.onPitchUpdate(this._getIdleInfo());
        }
      }
    }

    this.animationId = requestAnimationFrame(() => this._detectLoop());
  }

  _getIdleInfo() {
    return {
      isIdle: true,
      isHolding: false,
      note: '--',
      noteName: '--',
      accidental: '',
      octave: '',
      freq: 0,
      targetFreq: 0,
      freqDiff: 0,
      cents: 0,
      inTune: false,
      direction: 'idle',
      clarity: 0,
      targetString: null
    };
  }

  /**
   * McLeod Pitch Method / Normalized Autocorrelation over guitar lag range
   */
  _autoCorrelate(buf, sampleRate) {
    const bufLen = buf.length;

    // 1. RMS Energy Check
    let sumSquares = 0;
    for (let i = 0; i < bufLen; i++) {
      sumSquares += buf[i] * buf[i];
    }
    const rms = Math.sqrt(sumSquares / bufLen);
    if (rms < this.noiseGateThreshold) return null; // Below noise gate

    // 2. Frequency lag limits (60 Hz to 720 Hz)
    const minLag = Math.floor(sampleRate / 720); // ~61 @ 44.1k, ~66 @ 48k
    const maxLag = Math.min(Math.floor(sampleRate / 60), 850); // ~735 @ 44.1k, ~800 @ 48k
    const windowSize = 800;

    if (maxLag + windowSize > bufLen) return null;

    // 3. Compute normalized correlation for lags in range
    let highestPeakVal = -1;
    const peaks = [];

    for (let tau = minLag; tau <= maxLag; tau++) {
      let sum = 0;
      let norm1 = 0;
      let norm2 = 0;

      for (let i = 0; i < windowSize; i++) {
        const x = buf[i];
        const y = buf[i + tau];
        sum += x * y;
        norm1 += x * x;
        norm2 += y * y;
      }

      const denom = Math.sqrt(norm1 * norm2);
      const coeff = denom > 0.00001 ? sum / denom : 0;
      this.corrBuffer[tau] = coeff;

      // Peak identification
      if (tau > minLag + 1) {
        const prev = this.corrBuffer[tau - 1];
        const prev2 = this.corrBuffer[tau - 2];
        if (prev > prev2 && prev > coeff && prev > 0.35) {
          peaks.push({ lag: tau - 1, val: prev });
          if (prev > highestPeakVal) highestPeakVal = prev;
        }
      }
    }

    if (peaks.length === 0 || highestPeakVal < this.clarityThreshold) {
      return null; // Not periodic enough (noise/unvoiced)
    }

    // 4. Fundamental Peak Selection
    // Prevent 2nd harmonic octave jump: pick the FIRST peak >= 0.82 * highestPeakVal
    let fundamentalLag = -1;
    const threshold = 0.82 * highestPeakVal;
    for (let p of peaks) {
      if (p.val >= threshold) {
        fundamentalLag = p.lag;
        break;
      }
    }

    if (fundamentalLag === -1) return null;

    // 5. Parabolic Interpolation for Sub-Sample Frequency Precision
    const t = fundamentalLag;
    const alpha = this.corrBuffer[t - 1];
    const beta = this.corrBuffer[t];
    const gamma = this.corrBuffer[t + 1];
    const denom = 2 * (alpha - 2 * beta + gamma);
    let delta = 0;
    if (Math.abs(denom) > 0.00001) {
      delta = (alpha - gamma) / denom;
    }

    const trueLag = t + delta;
    const freq = sampleRate / trueLag;

    return {
      freq,
      clarity: beta
    };
  }

  /**
   * Convert frequency (Hz) to musical note, octave, target frequency, and cents offset
   */
  _freqToNote(freq, clarity = 1.0) {
    const a4 = this.a4 || 440;
    const noteNum = 12 * (Math.log2(freq / a4)) + 69;
    const midi = Math.round(noteNum);
    const noteIndex = ((midi % 12) + 12) % 12;
    const octave = Math.floor(midi / 12) - 1;

    const baseName = this.NOTE_NAMES[noteIndex];
    const noteName = `${baseName}${octave}`;

    const targetFreq = a4 * Math.pow(2, (midi - 69) / 12);
    const cents = 1200 * Math.log2(freq / targetFreq);
    const clampedCents = Math.max(-50, Math.min(50, cents));

    // Match 6-string target if preset is active
    let targetString = null;
    const preset = this.TUNING_PRESETS[this.currentPreset];
    if (preset && preset.strings && preset.strings.length > 0) {
      let closestDiff = 9999;
      for (let s of preset.strings) {
        const diff = Math.abs(freq - s.freq);
        // If within +/- 2.5 semitones of standard string pitch
        if (diff < closestDiff && diff < s.freq * 0.16) {
          closestDiff = diff;
          targetString = s.str;
        }
      }
    }

    return {
      note: noteName,
      noteName: baseName,
      accidental: baseName.includes('#') ? '♯' : '',
      octave: octave,
      cents: Math.round(clampedCents * 10) / 10,
      freq: Math.round(freq * 10) / 10,
      targetFreq: Math.round(targetFreq * 100) / 100,
      freqDiff: Math.round((freq - targetFreq) * 100) / 100,
      inTune: Math.abs(clampedCents) <= 3.5,
      clarity: Math.round(clarity * 100) / 100,
      targetString: targetString,
      isHolding: false,
      isIdle: false
    };
  }

  /**
   * Play clean reference tone for ear tuning
   */
  playReferenceTone(freq, duration = 2.0) {
    if (!this.engine.ctx || !freq) return;
    try {
      const ctx = this.engine.ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle'; // Warm, musical timbre
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Failed to play reference tone:', e);
    }
  }
}

window.GuitarTuner = GuitarTuner;
