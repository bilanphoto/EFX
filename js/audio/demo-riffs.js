/**
 * Demo Riffs Sequencer
 * Plays realistic guitar riffs and loops to test pedals and amps
 */
class RiffPlayer {
  constructor(guitarSynth) {
    this.synth = guitarSynth;
    this.isPlaying = false;
    this.currentRiffId = 'blues';
    this.bpm = 110;
    this.timerId = null;
    this.currentStep = 0;
    this.onStepCallback = null;
    this.onStateChange = null;

    // Defined Riff Patterns
    this.riffs = {
      blues: {
        name: 'Texas Blues Shuffle',
        genre: 'Blues / Overdrive',
        bpm: 115,
        // Each item: [beatOffset (in 16th notes), type ('pluck'|'strum'), note/chord, vel, dur]
        lengthIn16ths: 32, // 2 bars of 4/4
        notes: [
          // Bar 1: A shuffle
          { step: 0, type: 'pluck', val: 110.00, vel: 0.85, dur: 0.3 }, // A2
          { step: 0, type: 'pluck', val: 164.81, vel: 0.80, dur: 0.3 }, // E3
          { step: 3, type: 'pluck', val: 110.00, vel: 0.70, dur: 0.2 },
          { step: 3, type: 'pluck', val: 164.81, vel: 0.70, dur: 0.2 },
          { step: 4, type: 'pluck', val: 110.00, vel: 0.90, dur: 0.3 },
          { step: 4, type: 'pluck', val: 174.61, vel: 0.85, dur: 0.3 }, // F#3
          { step: 7, type: 'pluck', val: 110.00, vel: 0.70, dur: 0.2 },
          { step: 7, type: 'pluck', val: 174.61, vel: 0.70, dur: 0.2 },
          { step: 8, type: 'pluck', val: 110.00, vel: 0.85, dur: 0.3 },
          { step: 8, type: 'pluck', val: 164.81, vel: 0.80, dur: 0.3 },
          { step: 11, type: 'pluck', val: 110.00, vel: 0.70, dur: 0.2 },
          { step: 11, type: 'pluck', val: 164.81, vel: 0.70, dur: 0.2 },
          { step: 12, type: 'pluck', val: 110.00, vel: 0.95, dur: 0.3 },
          { step: 12, type: 'pluck', val: 174.61, vel: 0.90, dur: 0.3 },
          // Bar 2: Blues lick turnaround
          { step: 16, type: 'pluck', val: 196.00, vel: 0.85, dur: 0.3 }, // G3
          { step: 18, type: 'pluck', val: 220.00, vel: 0.90, dur: 0.4 }, // A3
          { step: 20, type: 'pluck', val: 261.63, vel: 0.85, dur: 0.3 }, // C4
          { step: 22, type: 'pluck', val: 277.18, vel: 0.95, dur: 0.4 }, // C#4
          { step: 24, type: 'pluck', val: 329.63, vel: 0.90, dur: 0.6 }, // E4
          { step: 28, type: 'strum', val: 'A', vel: 0.85, dur: 0.8 }
        ]
      },

      rock: {
        name: 'Hard Rock Chug & Riff',
        genre: 'Classic / Hard Rock',
        bpm: 120,
        lengthIn16ths: 32,
        notes: [
          // E5 Power Chords + Chugs
          { step: 0, type: 'strum', val: 'E5', vel: 0.95, dur: 0.4 },
          { step: 3, type: 'pluck', val: 82.41, vel: 0.75, dur: 0.15 }, // E palm mute
          { step: 4, type: 'pluck', val: 82.41, vel: 0.70, dur: 0.15 },
          { step: 6, type: 'strum', val: 'D5', vel: 0.85, dur: 0.3 },
          { step: 8, type: 'strum', val: 'E5', vel: 0.90, dur: 0.4 },
          { step: 11, type: 'pluck', val: 82.41, vel: 0.75, dur: 0.15 },
          { step: 12, type: 'pluck', val: 82.41, vel: 0.70, dur: 0.15 },
          { step: 14, type: 'pluck', val: 116.54, vel: 0.85, dur: 0.25 }, // Bb
          { step: 15, type: 'pluck', val: 123.47, vel: 0.90, dur: 0.3 },  // B
          // Bar 2: Riff hook
          { step: 16, type: 'strum', val: 'E5', vel: 0.95, dur: 0.4 },
          { step: 19, type: 'pluck', val: 82.41, vel: 0.75, dur: 0.15 },
          { step: 20, type: 'pluck', val: 82.41, vel: 0.70, dur: 0.15 },
          { step: 22, type: 'pluck', val: 146.83, vel: 0.85, dur: 0.25 }, // D3
          { step: 24, type: 'pluck', val: 164.81, vel: 0.90, dur: 0.3 },  // E3
          { step: 26, type: 'pluck', val: 196.00, vel: 0.88, dur: 0.3 },  // G3
          { step: 28, type: 'pluck', val: 220.00, vel: 0.95, dur: 0.5 }   // A3
        ]
      },

      funk: {
        name: 'Funky Clean Chops',
        genre: 'Funk / Clean / Chorus',
        bpm: 108,
        lengthIn16ths: 32,
        notes: [
          // 16th note syncopated funk strums
          { step: 0, type: 'strum', val: 'Am', vel: 0.85, dur: 0.18 },
          { step: 3, type: 'strum', val: 'Am', vel: 0.65, dur: 0.12 },
          { step: 4, type: 'strum', val: 'Am', vel: 0.80, dur: 0.18 },
          { step: 6, type: 'strum', val: 'Am', vel: 0.70, dur: 0.15 },
          { step: 8, type: 'pluck', val: 110.00, vel: 0.90, dur: 0.3 }, // Bass pop A
          { step: 10, type: 'strum', val: 'Dm', vel: 0.80, dur: 0.18 },
          { step: 12, type: 'strum', val: 'Dm', vel: 0.85, dur: 0.22 },
          { step: 14, type: 'strum', val: 'Am', vel: 0.70, dur: 0.15 },
          // Bar 2
          { step: 16, type: 'strum', val: 'Am', vel: 0.85, dur: 0.18 },
          { step: 19, type: 'strum', val: 'Am', vel: 0.60, dur: 0.12 },
          { step: 20, type: 'pluck', val: 130.81, vel: 0.85, dur: 0.25 }, // C
          { step: 22, type: 'pluck', val: 146.83, vel: 0.90, dur: 0.25 }, // D
          { step: 24, type: 'strum', val: 'E', vel: 0.88, dur: 0.3 },
          { step: 28, type: 'strum', val: 'Am', vel: 0.92, dur: 0.5 }
        ]
      },

      ambient: {
        name: 'Dreamy Ambient Arpeggio',
        genre: 'Delay & Reverb Dream',
        bpm: 85,
        lengthIn16ths: 32,
        notes: [
          // Slow spacious picked notes
          { step: 0, type: 'pluck', val: 164.81, vel: 0.80, dur: 1.5 }, // E3
          { step: 4, type: 'pluck', val: 246.94, vel: 0.75, dur: 1.2 }, // B3
          { step: 8, type: 'pluck', val: 329.63, vel: 0.85, dur: 1.2 }, // E4
          { step: 12, type: 'pluck', val: 392.00, vel: 0.80, dur: 1.2 }, // G4
          { step: 16, type: 'pluck', val: 146.83, vel: 0.80, dur: 1.5 }, // D3
          { step: 20, type: 'pluck', val: 220.00, vel: 0.75, dur: 1.2 }, // A3
          { step: 24, type: 'pluck', val: 293.66, vel: 0.85, dur: 1.2 }, // D4
          { step: 28, type: 'pluck', val: 369.99, vel: 0.80, dur: 1.5 }  // F#4
        ]
      },

      metal: {
        name: 'Heavy Metal Gallop',
        genre: 'High Gain / Distortion',
        bpm: 130,
        lengthIn16ths: 32,
        notes: [
          // Heavy E gallop
          { step: 0, type: 'strum', val: 'E5', vel: 0.95, dur: 0.3 },
          { step: 2, type: 'pluck', val: 82.41, vel: 0.80, dur: 0.1 },
          { step: 3, type: 'pluck', val: 82.41, vel: 0.85, dur: 0.1 },
          { step: 4, type: 'strum', val: 'E5', vel: 0.90, dur: 0.25 },
          { step: 6, type: 'pluck', val: 82.41, vel: 0.80, dur: 0.1 },
          { step: 7, type: 'pluck', val: 82.41, vel: 0.85, dur: 0.1 },
          { step: 8, type: 'strum', val: 'C', vel: 0.90, dur: 0.4 },
          { step: 12, type: 'strum', val: 'D5', vel: 0.90, dur: 0.4 },
          // Bar 2
          { step: 16, type: 'strum', val: 'E5', vel: 0.95, dur: 0.3 },
          { step: 18, type: 'pluck', val: 82.41, vel: 0.80, dur: 0.1 },
          { step: 19, type: 'pluck', val: 82.41, vel: 0.85, dur: 0.1 },
          { step: 20, type: 'strum', val: 'E5', vel: 0.90, dur: 0.25 },
          { step: 24, type: 'pluck', val: 174.61, vel: 0.92, dur: 0.3 }, // F3
          { step: 26, type: 'pluck', val: 164.81, vel: 0.90, dur: 0.3 }, // E3
          { step: 28, type: 'pluck', val: 155.56, vel: 0.95, dur: 0.4 }  // Eb3
        ]
      }
    };
  }

  setRiff(riffId) {
    if (this.riffs[riffId]) {
      this.currentRiffId = riffId;
      this.bpm = this.riffs[riffId].bpm;
      this.currentStep = 0;
    }
  }

  async play() {
    if (this.isPlaying) return;
    await this.synth.engine.resume();
    this.isPlaying = true;
    this.currentStep = 0;
    if (this.onStateChange) this.onStateChange(true);
    this._scheduleNextTick();
  }

  pause() {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.onStateChange) this.onStateChange(false);
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  _scheduleNextTick() {
    if (!this.isPlaying) return;

    const riff = this.riffs[this.currentRiffId];
    // 16th note duration in ms: (60 / bpm) / 4 * 1000
    const stepDurationMs = (60 / this.bpm / 4) * 1000;

    // Trigger notes matching currentStep
    const events = riff.notes.filter(n => n.step === this.currentStep);
    events.forEach(ev => {
      if (ev.type === 'pluck') {
        this.synth.pluck(ev.val, ev.vel, ev.dur);
      } else if (ev.type === 'strum') {
        const chord = GuitarSynth.CHORDS[ev.val];
        if (chord) {
          this.synth.strumChord(chord, ev.vel, true, 22);
        }
      }
    });

    if (this.onStepCallback) {
      this.onStepCallback(this.currentStep, riff.lengthIn16ths);
    }

    this.currentStep = (this.currentStep + 1) % riff.lengthIn16ths;

    this.timerId = setTimeout(() => {
      this._scheduleNextTick();
    }, stepDurationMs);
  }
}

window.RiffPlayer = RiffPlayer;
