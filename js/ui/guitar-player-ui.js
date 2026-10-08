/**
 * Interactive Guitar Player UI
 * Controls the virtual strings, chord buttons, demo riffs, mic input, and audio loop playback
 */
class GuitarPlayerUI {
  constructor(container, synth, riffPlayer, engine) {
    this.container = container;
    this.synth = synth;
    this.riffPlayer = riffPlayer;
    this.engine = engine;

    this.isMicActive = false;
    this.fileAudioSource = null;
    this.fileAudioBuffer = null;
    this.isFilePlaying = false;

    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="guitar-player-panel">
        <!-- Section 1: Playback Sources (Riff Player & Audio In) -->
        <div class="player-controls-strip">
          <div class="player-subgroup">
            <span class="group-title">JAM TRACKS:</span>
            <select class="riff-select">
              <option value="blues">Texas Blues Shuffle (Overdrive)</option>
              <option value="rock">Hard Rock Chug & Riff (Distortion)</option>
              <option value="funk">Funky Clean Chops (Chorus/Reverb)</option>
              <option value="ambient">Dreamy Ambient Arpeggio (Delay)</option>
              <option value="metal">Heavy Metal Gallop (High Gain)</option>
            </select>
            <button class="riff-play-btn" title="Play/Pause Demo Riff">
              <span class="play-icon">▶</span> JAM
            </button>
            <div class="bpm-control">
              <span>BPM:</span>
              <input type="number" class="bpm-input" min="60" max="220" value="${this.riffPlayer.bpm}">
            </div>
            <div class="beat-light"></div>
          </div>

          <div class="player-subgroup live-input-group">
            <span class="group-title">LIVE INPUT:</span>
            <button class="mic-toggle-btn" title="Connect Real Guitar or Microphone">
              <span class="mic-icon">🎤</span> GUITAR IN
            </button>
            <label class="file-load-btn" title="Load Clean Guitar WAV/MP3">
              <span>📁 LOAD AUDIO</span>
              <input type="file" accept="audio/*" class="audio-file-input" style="display:none;">
            </label>
            <button class="file-play-btn" style="display:none;" title="Play uploaded audio">
              ▶ FILE
            </button>
          </div>
        </div>

        <!-- Section 2: Quick Chord Buttons -->
        <div class="chord-buttons-strip">
          <span class="chord-title">CHORDS:</span>
          <div class="chords-grid">
            <button class="chord-btn" data-chord="E">E</button>
            <button class="chord-btn" data-chord="Em">Em</button>
            <button class="chord-btn" data-chord="A">A</button>
            <button class="chord-btn" data-chord="Am">Am</button>
            <button class="chord-btn" data-chord="D">D</button>
            <button class="chord-btn" data-chord="Dm">Dm</button>
            <button class="chord-btn" data-chord="G">G</button>
            <button class="chord-btn" data-chord="C">C</button>
            <button class="chord-btn" data-chord="F">F</button>
            <button class="chord-btn rock-chord" data-chord="E5">E5 (Rock)</button>
            <button class="chord-btn rock-chord" data-chord="A5">A5 (Rock)</button>
            <button class="chord-btn rock-chord" data-chord="D5">D5 (Rock)</button>
          </div>
        </div>

        <!-- Section 3: Interactive Guitar Strings -->
        <div class="strings-stage">
          <div class="fret-headstock">
            <span class="headstock-label">STRUM / PICK STRINGS</span>
          </div>
          <div class="strings-container">
            <div class="guitar-string-row" data-note="E4" data-freq="329.63" title="1st String: High E (329.6 Hz)">
              <span class="string-tag">E4</span>
              <div class="string-wire gauge-e4"></div>
            </div>
            <div class="guitar-string-row" data-note="B3" data-freq="246.94" title="2nd String: B (246.9 Hz)">
              <span class="string-tag">B3</span>
              <div class="string-wire gauge-b3"></div>
            </div>
            <div class="guitar-string-row" data-note="G3" data-freq="196.00" title="3rd String: G (196.0 Hz)">
              <span class="string-tag">G3</span>
              <div class="string-wire gauge-g3"></div>
            </div>
            <div class="guitar-string-row" data-note="D3" data-freq="146.83" title="4th String: D (146.8 Hz)">
              <span class="string-tag">D3</span>
              <div class="string-wire gauge-d3"></div>
            </div>
            <div class="guitar-string-row" data-note="A2" data-freq="110.00" title="5th String: A (110.0 Hz)">
              <span class="string-tag">A2</span>
              <div class="string-wire gauge-a2"></div>
            </div>
            <div class="guitar-string-row" data-note="E2" data-freq="82.41" title="6th String: Low E (82.4 Hz)">
              <span class="string-tag">E2</span>
              <div class="string-wire gauge-e2"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    this._attachEventListeners();
  }

  _attachEventListeners() {
    // 1. Strings Plucking
    const stringRows = this.container.querySelectorAll('.guitar-string-row');
    stringRows.forEach(row => {
      const freq = parseFloat(row.dataset.freq);
      const note = row.dataset.note;

      const triggerPluck = () => {
        this.synth.engine.resume();
        this.synth.pluck(freq, 0.85, 3.2, `str_${note}`);

        // Visual vibrate animation
        const wire = row.querySelector('.string-wire');
        wire.classList.remove('vibrating');
        void wire.offsetWidth; // trigger reflow
        wire.classList.add('vibrating');
      };

      row.addEventListener('mousedown', triggerPluck);
      row.addEventListener('mouseenter', (e) => {
        if (e.buttons === 1) triggerPluck(); // Strumming across strings with mouse held
      });
    });

    // 2. Chords
    const chordButtons = this.container.querySelectorAll('.chord-btn');
    chordButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        await this.synth.engine.resume();
        const chordName = btn.dataset.chord;
        const freqs = GuitarSynth.CHORDS[chordName];
        if (freqs) {
          this.synth.strumChord(freqs, 0.9, true, 24);

          // Animate button press
          btn.classList.add('pressed');
          setTimeout(() => btn.classList.remove('pressed'), 250);
        }
      });
    });

    // 3. Demo Riff Player
    const riffSelect = this.container.querySelector('.riff-select');
    const playBtn = this.container.querySelector('.riff-play-btn');
    const bpmInput = this.container.querySelector('.bpm-input');
    const beatLight = this.container.querySelector('.beat-light');

    riffSelect.addEventListener('change', (e) => {
      this.riffPlayer.setRiff(e.target.value);
      bpmInput.value = this.riffPlayer.bpm;
    });

    bpmInput.addEventListener('change', (e) => {
      const b = parseInt(e.target.value, 10);
      if (b >= 50 && b <= 240) {
        this.riffPlayer.bpm = b;
      }
    });

    playBtn.addEventListener('click', () => {
      this.riffPlayer.toggle();
    });

    this.riffPlayer.onStateChange = (isPlaying) => {
      if (isPlaying) {
        playBtn.classList.add('playing');
        playBtn.innerHTML = `<span class="play-icon">⏸</span> STOP`;
      } else {
        playBtn.classList.remove('playing');
        playBtn.innerHTML = `<span class="play-icon">▶</span> JAM`;
        beatLight.classList.remove('beat-on');
      }
    };

    this.riffPlayer.onStepCallback = (step) => {
      if (step % 4 === 0) {
        beatLight.classList.add('beat-on');
        setTimeout(() => beatLight.classList.remove('beat-on'), 80);
      }
    };

    // 4. Live Microphone / Guitar Input
    const micBtn = this.container.querySelector('.mic-toggle-btn');
    micBtn.addEventListener('click', async () => {
      if (!this.isMicActive) {
        const res = await this.engine.enableLiveInput();
        if (res.success) {
          this.isMicActive = true;
          micBtn.classList.add('active');
          micBtn.innerHTML = `🔴 LIVE ON`;
        } else {
          alert('Could not access microphone/audio input: ' + res.error);
        }
      } else {
        this.engine.disableLiveInput();
        this.isMicActive = false;
        micBtn.classList.remove('active');
        micBtn.innerHTML = `🎤 GUITAR IN`;
      }
    });

    // 5. Custom Audio File
    const fileInput = this.container.querySelector('.audio-file-input');
    const filePlayBtn = this.container.querySelector('.file-play-btn');

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      await this.engine.resume();
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const arrayBuffer = ev.target.result;
          this.fileAudioBuffer = await this.engine.ctx.decodeAudioData(arrayBuffer);
          filePlayBtn.style.display = 'inline-block';
          filePlayBtn.innerText = '▶ PLAY AUDIO';
        } catch (err) {
          alert('Error decoding audio file: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    });

    filePlayBtn.addEventListener('click', () => {
      if (this.isFilePlaying) {
        if (this.fileAudioSource) {
          try { this.fileAudioSource.stop(); } catch(e) {}
        }
        this.isFilePlaying = false;
        filePlayBtn.innerText = '▶ PLAY AUDIO';
        filePlayBtn.classList.remove('active');
      } else {
        if (!this.fileAudioBuffer) return;
        this.fileAudioSource = this.engine.ctx.createBufferSource();
        this.fileAudioSource.buffer = this.fileAudioBuffer;
        this.fileAudioSource.loop = true;
        this.fileAudioSource.connect(this.engine.inputGain);
        this.fileAudioSource.start();

        this.isFilePlaying = true;
        filePlayBtn.innerText = '⏸ PAUSE AUDIO';
        filePlayBtn.classList.add('active');

        this.fileAudioSource.onended = () => {
          this.isFilePlaying = false;
          filePlayBtn.innerText = '▶ PLAY AUDIO';
          filePlayBtn.classList.remove('active');
        };
      }
    });
  }
}

window.GuitarPlayerUI = GuitarPlayerUI;
