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
    this.meterAnimationId = null;
    this.silenceDuration = 0;

    this.render();
  }

  render() {
    const savedCh = this.engine.currentChannelMode || 'both';

    this.container.innerHTML = `
      <div class="guitar-player-panel">
        <!-- Section 1: Playback Sources & Pro Live Input Rack -->
        <div class="player-controls-strip">
          <!-- Jam Tracks Subgroup -->
          <div class="player-subgroup jam-subgroup">
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

          <!-- Live Input & Signal Detector Subgroup -->
          <div class="player-subgroup live-input-group">
            <div class="live-input-main-row">
              <span class="group-title">GUITAR IN:</span>
              <button class="mic-toggle-btn" id="mic-toggle-btn" title="คลิกเพื่อเปิด/ปิด รับสัญญาณเสียงจากกีตาร์หรือไมโครโฟน">
                <span class="mic-icon">🎤</span> <span class="mic-btn-text">GUITAR IN</span>
              </button>

              <!-- Audio Interface Device Selector -->
              <div class="device-select-wrap">
                <select class="input-device-select" id="input-device-select" title="เลือก Audio Interface / ไมโครโฟนที่ต่อกับกีตาร์">
                  <option value="">⚙️ ค้นหาการ์ดเสียง...</option>
                </select>
                <button class="refresh-devices-btn" id="refresh-devices-btn" title="รีเฟรชค้นหาอุปกรณ์การ์ดเสียงใหม่">🔄</button>
              </div>

              <!-- Channel Selector (Crucial for Audio Interfaces: Ch 1 Mic vs Ch 2 Inst) -->
              <div class="channel-select-wrap" title="เลือกช่องแจ็คบน Audio Interface (เช่น ช่อง 2 กีตาร์)">
                <span class="channel-label">CH:</span>
                <div class="channel-buttons">
                  <button class="ch-btn ${savedCh === 'ch1' ? 'active' : ''}" data-channel="ch1" title="ช่องที่ 1 (Channel 1 - มักเป็น Mic/XLR)">CH 1</button>
                  <button class="ch-btn ${savedCh === 'ch2' ? 'active' : ''}" data-channel="ch2" title="ช่องที่ 2 (Channel 2 - มักเป็นช่องเสียบสายกีตาร์ Inst/Hi-Z)">CH 2 (Inst)</button>
                  <button class="ch-btn ${savedCh === 'both' ? 'active' : ''}" data-channel="both" title="รวมทั้ง 2 ช่องสัญญาณ (Stereo Mix)">1+2</button>
                </div>
              </div>

              <!-- Direct Dry Monitor Button -->
              <button class="direct-monitor-btn" id="direct-monitor-btn" title="ฟังเสียงสดกีตาร์ตรงๆ แบบไม่ผ่านเอฟเฟค เพื่อทดสอบว่าสายมีสัญญาณเข้าหรือไม่">
                <span class="dm-led"></span> DIRECT DRY
              </button>

              <label class="file-load-btn" title="Load Clean Guitar WAV/MP3">
                <span>📁 AUDIO FILE</span>
                <input type="file" accept="audio/*" class="audio-file-input" style="display:none;">
              </label>
              <button class="file-play-btn" style="display:none;" title="Play uploaded audio">
                ▶ FILE
              </button>
            </div>

            <!-- Real-time Input Signal Graph & VU Level Meter -->
            <div class="live-signal-meter-strip" id="live-signal-meter-strip">
              <!-- Live Input Oscilloscope Waveform Canvas -->
              <div class="meter-wave-box" title="กราฟตรวจจับคลื่นสัญญาณเสียงเข้าสด (Live Input Oscilloscope)">
                <canvas class="mini-input-scope" id="mini-input-scope" width="130" height="24"></canvas>
              </div>

              <!-- Segmented LED Level Bar -->
              <div class="meter-led-bar-wrap" title="ระดับความดังสัญญาณเสียงเข้า (Peak Meter)">
                <div class="meter-led-bar">
                  <div class="meter-led-fill" id="meter-led-fill"></div>
                </div>
                <div class="meter-ticks">
                  <span>-48</span>
                  <span>-24</span>
                  <span>-12</span>
                  <span>-6</span>
                  <span>0dB</span>
                </div>
              </div>

              <!-- Live Signal Activity Detection Badge -->
              <div class="signal-status-badge" id="signal-status-badge" title="สถานะตรวจจับสัญญาณเสียงกีตาร์สด">
                <span class="signal-led" id="signal-led">●</span>
                <span class="signal-text" id="signal-text">รอเปิด GUITAR IN</span>
                <span class="signal-db" id="signal-db">-- dB</span>
              </div>

              <!-- Input Boost Selector -->
              <div class="input-boost-wrap" title="เร่งความแรงสัญญาณกีตาร์กรณีปิ๊กอัพเบา (+Input Gain Boost)">
                <span class="boost-label">BOOST:</span>
                <div class="boost-buttons">
                  <button class="boost-btn active" data-boost="1.0" title="เกนปกติ (0 dB)">0dB</button>
                  <button class="boost-btn" data-boost="2.0" title="เพิ่มเกน 2 เท่า (+6 dB)">+6dB</button>
                  <button class="boost-btn" data-boost="4.0" title="เพิ่มเกน 4 เท่า (+12 dB)">+12dB</button>
                </div>
              </div>
            </div>

            <!-- Diagnostic Hint Banner (Appears if input is active but silent) -->
            <div class="input-hint-banner" id="input-hint-banner" style="display: none;">
              💡 <strong>ยังไม่มีสัญญาณเข้า?</strong> หากใช้ Audio Interface (เช่น Focusrite, Behringer, iRig) ให้ลองคลิกปุ่ม <strong>[CH 2 (Inst)]</strong> หรือเลือกอุปกรณ์ในช่องการ์ดเสียง
            </div>
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
    this._populateDeviceList();
    this._startInputMeterLoop();
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

        const wire = row.querySelector('.string-wire');
        wire.classList.remove('vibrating');
        void wire.offsetWidth;
        wire.classList.add('vibrating');
      };

      row.addEventListener('mousedown', triggerPluck);
      row.addEventListener('mouseenter', (e) => {
        if (e.buttons === 1) triggerPluck();
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

    // 4. Live Microphone / Guitar Input Toggle
    const micBtn = this.container.querySelector('#mic-toggle-btn');
    const micText = micBtn.querySelector('.mic-btn-text');
    const deviceSelect = this.container.querySelector('#input-device-select');
    const refreshBtn = this.container.querySelector('#refresh-devices-btn');
    const chButtons = this.container.querySelectorAll('.ch-btn');
    const dmBtn = this.container.querySelector('#direct-monitor-btn');
    const boostButtons = this.container.querySelectorAll('.boost-btn');

    micBtn.addEventListener('click', async () => {
      if (!this.isMicActive) {
        const selectedDev = deviceSelect.value || null;
        const res = await this.engine.enableLiveInput(selectedDev);
        if (res.success) {
          this.isMicActive = true;
          micBtn.classList.add('active');
          micText.innerText = 'LIVE ON';
          await this._populateDeviceList();
        } else {
          alert('ไม่สามารถเข้าถึงสัญญาณเสียง/ไมโครโฟนได้: ' + res.error + '\n\nคำแนะนำ: กรุณาตรวจสอบสิทธิ์การใช้งาน Microphone ในเบราว์เซอร์');
        }
      } else {
        this.engine.disableLiveInput();
        this.isMicActive = false;
        micBtn.classList.remove('active');
        micText.innerText = 'GUITAR IN';
      }
    });

    // Device selection change
    deviceSelect.addEventListener('change', async (e) => {
      const devId = e.target.value;
      if (this.isMicActive) {
        await this.engine.enableLiveInput(devId);
      } else {
        try {
          localStorage.setItem('BOSS_GUITAR_INPUT_DEVICE', devId);
        } catch(e) {}
      }
    });

    // Refresh audio devices
    refreshBtn.addEventListener('click', async () => {
      await this._populateDeviceList();
    });

    // Channel buttons (Ch 1 / Ch 2 / 1+2)
    chButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        chButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const ch = btn.dataset.channel;
        this.engine.setInputChannel(ch);
      });
    });

    // Direct Monitor toggle (Dry Listen)
    dmBtn.addEventListener('click', () => {
      const nowActive = !this.engine.isDirectMonitoring;
      this.engine.setDirectMonitor(nowActive);
      if (nowActive) {
        dmBtn.classList.add('active');
      } else {
        dmBtn.classList.remove('active');
      }
    });

    // Input Boost buttons
    boostButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        boostButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mult = parseFloat(btn.dataset.boost);
        this.engine.setInputBoost(mult);
      });
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

  async _populateDeviceList() {
    const select = this.container.querySelector('#input-device-select');
    if (!select) return;

    const devices = await this.engine.getAudioInputDevices();
    if (!devices || devices.length === 0) {
      select.innerHTML = `<option value="">Default Audio Input</option>`;
      return;
    }

    let savedDev = '';
    try {
      savedDev = localStorage.getItem('BOSS_GUITAR_INPUT_DEVICE') || '';
    } catch(e) {}

    select.innerHTML = '';
    devices.forEach(dev => {
      const opt = document.createElement('option');
      opt.value = dev.id;
      const prefix = dev.isInterface ? '🎸 ' : '🎤 ';
      opt.textContent = `${prefix}${dev.label}`;
      if (dev.id === this.engine.currentDeviceId || dev.id === savedDev) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });
  }

  _startInputMeterLoop() {
    const canvas = this.container.querySelector('#mini-input-scope');
    const ledFill = this.container.querySelector('#meter-led-fill');
    const signalLed = this.container.querySelector('#signal-led');
    const signalText = this.container.querySelector('#signal-text');
    const signalDb = this.container.querySelector('#signal-db');
    const signalBadge = this.container.querySelector('#signal-status-badge');
    const hintBanner = this.container.querySelector('#input-hint-banner');

    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const bufLen = 128;
    const waveData = new Uint8Array(bufLen);

    const updateLoop = () => {
      this.meterAnimationId = requestAnimationFrame(updateLoop);

      const metrics = this.engine.getInputMetrics();
      const w = canvas.width;
      const h = canvas.height;

      // Clear mini oscilloscope
      ctx.fillStyle = '#060a08';
      ctx.fillRect(0, 0, w, h);

      // Grid line
      ctx.strokeStyle = 'rgba(0, 255, 100, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      if (this.isMicActive && this.engine.inputAnalyser) {
        this.engine.inputAnalyser.getByteTimeDomainData(waveData);

        // Draw waveform
        const hasSig = metrics.hasSignal;
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = metrics.isClipping ? '#ff3344' : (hasSig ? '#00ff66' : '#225533');
        ctx.shadowColor = hasSig ? '#00ff66' : 'transparent';
        ctx.shadowBlur = hasSig ? 4 : 0;
        ctx.beginPath();

        const slice = w / bufLen;
        for (let i = 0; i < bufLen; i++) {
          const v = waveData[i] / 128.0;
          const y = (v * h) / 2;
          if (i === 0) ctx.moveTo(0, y);
          else ctx.lineTo(i * slice, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Update Meter Bar Fill
        // -60dB -> 0%, 0dB -> 100%
        const pct = Math.max(0, Math.min(100, ((metrics.db + 60) / 60) * 100));
        ledFill.style.width = `${pct}%`;
        if (metrics.isClipping) {
          ledFill.style.background = 'linear-gradient(90deg, #22c55e, #eab308, #ef4444)';
        } else if (metrics.db > -12) {
          ledFill.style.background = 'linear-gradient(90deg, #22c55e 60%, #eab308 100%)';
        } else {
          ledFill.style.background = '#22c55e';
        }

        // Update Signal Detection Badge
        signalDb.innerText = `${metrics.db > -70 ? metrics.db : '--'} dB`;

        if (metrics.hasSignal) {
          this.silenceDuration = 0;
          signalBadge.className = 'signal-status-badge active';
          signalLed.style.color = '#00ff66';
          signalText.innerText = '● มีสัญญาณเข้า (SIGNAL ACTIVE)';
          if (hintBanner) hintBanner.style.display = 'none';
        } else {
          this.silenceDuration += 1;
          signalBadge.className = 'signal-status-badge idle';
          signalLed.style.color = '#f59e0b';
          signalText.innerText = '○ เงียบกริบ (รอสัญญาณเสียง...)';

          // If silence lasts > 150 frames (~2.5s) while Live In is on, show hint
          if (this.silenceDuration > 150 && hintBanner) {
            hintBanner.style.display = 'block';
          }
        }
      } else {
        // Idle state (Live Input is OFF)
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();

        ledFill.style.width = '0%';
        signalBadge.className = 'signal-status-badge off';
        signalLed.style.color = '#64748b';
        signalText.innerText = 'รอเปิด GUITAR IN';
        signalDb.innerText = '-- dB';
        if (hintBanner) hintBanner.style.display = 'none';
      }
    };

    updateLoop();
  }
}

window.GuitarPlayerUI = GuitarPlayerUI;
