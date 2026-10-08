/**
 * Chromatic Guitar Tuner
 * Uses autocorrelation on the clean guitar input signal to detect fundamental pitch
 */
class GuitarTuner {
  constructor(engine) {
    this.engine = engine;
    this.analyser = null;
    this.buffer = null;
    this.isRunning = false;
    this.onPitchUpdate = null; // callback: { note, cents, freq, inTune }

    this.NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  }

  start() {
    if (!this.engine.ctx || !this.engine.chainInputNode) return;
    this.analyser = this.engine.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.buffer = new Float32Array(this.analyser.fftSize);

    // Tap into pre-effect clean input
    this.engine.inputGain.connect(this.analyser);
    this.isRunning = true;
    this._detectLoop();
  }

  stop() {
    this.isRunning = false;
    if (this.analyser && this.engine.inputGain) {
      try {
        this.engine.inputGain.disconnect(this.analyser);
      } catch(e) {}
    }
  }

  _detectLoop() {
    if (!this.isRunning) return;

    this.analyser.getFloatTimeDomainData(this.buffer);
    const freq = this._autoCorrelate(this.buffer, this.engine.ctx.sampleRate);

    if (freq !== -1 && freq > 50 && freq < 1000) {
      const pitchInfo = this._freqToNote(freq);
      if (this.onPitchUpdate) {
        this.onPitchUpdate(pitchInfo);
      }
    } else {
      if (this.onPitchUpdate) {
        this.onPitchUpdate(null);
      }
    }

    requestAnimationFrame(() => this._detectLoop());
  }

  _autoCorrelate(buf, sampleRate) {
    // RMS volume check to reject background silence
    let rms = 0;
    for (let i = 0; i < buf.length; i++) {
      rms += buf[i] * buf[i];
    }
    rms = Math.sqrt(rms / buf.length);
    if (rms < 0.015) return -1; // signal too quiet

    // Autocorrelation
    let r1 = 0, r2 = buf.length - 1;
    const threshold = 0.2;
    for (let i = 0; i < buf.length / 2; i++) {
      if (Math.abs(buf[i]) < threshold) {
        r1 = i;
        break;
      }
    }
    for (let i = 1; i < buf.length / 2; i++) {
      if (Math.abs(buf[buf.length - i]) < threshold) {
        r2 = buf.length - i;
        break;
      }
    }

    const trimmed = buf.slice(r1, r2);
    const c = new Array(trimmed.length).fill(0);

    for (let i = 0; i < trimmed.length; i++) {
      for (let j = 0; j < trimmed.length - i; j++) {
        c[i] = c[i] + trimmed[j] * trimmed[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < trimmed.length; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }

    let T0 = maxpos;
    // Parabolic interpolation for fine frequency resolution
    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
  }

  _freqToNote(freq) {
    const noteNum = 12 * (Math.log(freq / 440) / Math.log(2));
    const midi = Math.round(noteNum) + 69;
    const noteIndex = midi % 12;
    const octave = Math.floor(midi / 12) - 1;
    const noteName = this.NOTE_NAMES[noteIndex] + octave;

    const standardFreq = 440 * Math.pow(2, (midi - 69) / 12);
    const cents = Math.floor(1200 * Math.log2(freq / standardFreq));

    return {
      note: noteName,
      cents: cents,
      freq: Math.round(freq * 10) / 10,
      inTune: Math.abs(cents) <= 5
    };
  }
}

window.GuitarTuner = GuitarTuner;
