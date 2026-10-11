/**
 * Pro Stage Guitar Tuner UI Controller
 * Manages the large Stage Tuner modal and syncs with the compact header tuner
 */
class StageTunerUI {
  constructor(engine, tuner) {
    this.engine = engine;
    this.tuner = tuner;
    this.isOpen = false;
    this.isMuted = false;

    this._initDOMElements();
    this._bindEvents();
    this._buildLEDSegments();
    this._renderStringTargets();
    this._wireTunerEngine();
  }

  _initDOMElements() {
    // Header Compact Tuner elements
    this.compactBox = document.getElementById('tuner-display');
    this.compactNeedle = document.getElementById('tuner-needle');
    this.compactNote = document.getElementById('tuner-note');
    this.compactCents = document.getElementById('tuner-cents');
    this.compactToggleBtn = document.getElementById('tuner-toggle-btn');
    this.compactExpandBtn = document.getElementById('tuner-open-modal-btn');
    this.headerStageBtn = document.getElementById('header-stage-tuner-btn');

    // Large Stage Tuner Modal elements
    this.modal = document.getElementById('stage-tuner-modal');
    this.modalCloseBtn = document.getElementById('stage-tuner-close-btn');
    this.muteBtn = document.getElementById('stage-tuner-mute-btn');
    this.muteLed = document.getElementById('stage-mute-led');
    this.presetSelect = document.getElementById('stage-tuning-preset');
    this.a4Select = document.getElementById('stage-a4-ref');
    this.noiseSelect = document.getElementById('stage-noise-filter');

    // Display elements
    this.heroCard = document.getElementById('stage-hero-card');
    this.guideFlat = document.getElementById('guide-flat');
    this.guidePerfect = document.getElementById('guide-perfect');
    this.guideSharp = document.getElementById('guide-sharp');

    this.noteLetter = document.getElementById('stage-note-letter');
    this.noteAccidental = document.getElementById('stage-note-accidental');
    this.noteOctave = document.getElementById('stage-note-octave');

    this.statusPill = document.getElementById('stage-status-pill');
    this.pillDot = document.getElementById('stage-pill-dot');
    this.pillText = document.getElementById('stage-pill-text');

    this.meterNeedle = document.getElementById('stage-meter-needle');
    this.ledRow = document.getElementById('stage-led-segments-row');

    this.centsVal = document.getElementById('stage-cents-val');
    this.freqVal = document.getElementById('stage-freq-val');
    this.targetVal = document.getElementById('stage-target-val');
    this.diffVal = document.getElementById('stage-diff-val');

    this.stringsGrid = document.getElementById('stage-strings-grid');
  }

  _bindEvents() {
    // Toggle compact tuner
    if (this.compactToggleBtn) {
      this.compactToggleBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.engine.resume();
        this.toggleTunerRunning();
      });
    }

    // Open Modal triggers
    if (this.headerStageBtn) {
      this.headerStageBtn.addEventListener('click', async () => {
        await this.engine.resume();
        this.openModal();
      });
    }

    if (this.compactExpandBtn) {
      this.compactExpandBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.engine.resume();
        this.openModal();
      });
    }

    if (this.compactBox) {
      this.compactBox.addEventListener('click', async () => {
        await this.engine.resume();
        this.openModal();
      });
    }

    // Close Modal triggers
    if (this.modalCloseBtn) {
      this.modalCloseBtn.addEventListener('click', () => this.closeModal());
    }

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.closeModal();
      });
    }

    // Mute toggle
    if (this.muteBtn) {
      this.muteBtn.addEventListener('click', () => {
        this.isMuted = !this.isMuted;
        this.engine.setTunerMute(this.isMuted);
        if (this.isMuted) {
          this.muteBtn.classList.add('muted');
          if (this.muteLed) this.muteLed.classList.add('active');
        } else {
          this.muteBtn.classList.remove('muted');
          if (this.muteLed) this.muteLed.classList.remove('active');
        }
      });
    }

    // Preset Select
    if (this.presetSelect) {
      this.presetSelect.addEventListener('change', (e) => {
        this.tuner.setTuningPreset(e.target.value);
        this._renderStringTargets();
      });
    }

    // A4 Reference Select
    if (this.a4Select) {
      this.a4Select.addEventListener('change', (e) => {
        this.tuner.setA4(parseFloat(e.target.value));
      });
    }

    // Sensitivity Select
    if (this.noiseSelect) {
      this.noiseSelect.addEventListener('change', (e) => {
        this.tuner.setSensitivity(e.target.value);
      });
    }
  }

  toggleTunerRunning() {
    if (this.tuner.isRunning) {
      this.tuner.stop();
      if (this.compactToggleBtn) this.compactToggleBtn.classList.remove('active');
      if (this.headerStageBtn) this.headerStageBtn.classList.remove('active');
    } else {
      this.tuner.start();
      if (this.compactToggleBtn) this.compactToggleBtn.classList.add('active');
      if (this.headerStageBtn) this.headerStageBtn.classList.add('active');
    }
  }

  openModal() {
    this.isOpen = true;
    if (this.modal) this.modal.classList.add('open');

    // Auto-start tuner if not active
    if (!this.tuner.isRunning) {
      this.tuner.start();
      if (this.compactToggleBtn) this.compactToggleBtn.classList.add('active');
      if (this.headerStageBtn) this.headerStageBtn.classList.add('active');
    }
  }

  closeModal() {
    this.isOpen = false;
    if (this.modal) this.modal.classList.remove('open');

    // If audio was muted during tuning, unmute on modal close
    if (this.isMuted) {
      this.isMuted = false;
      this.engine.setTunerMute(false);
      if (this.muteBtn) this.muteBtn.classList.remove('muted');
      if (this.muteLed) this.muteLed.classList.remove('active');
    }
  }

  _buildLEDSegments() {
    if (!this.ledRow) return;
    this.ledRow.innerHTML = '';
    // 21 segments total: 10 Flat (amber), 1 Center (green), 10 Sharp (amber)
    for (let i = 0; i < 21; i++) {
      const seg = document.createElement('div');
      seg.className = 'stage-led-seg';
      if (i === 10) {
        seg.classList.add('seg-center');
      } else if (i < 10) {
        seg.classList.add('seg-flat');
      } else {
        seg.classList.add('seg-sharp');
      }
      seg.dataset.index = i;
      this.ledRow.appendChild(seg);
    }
  }

  _renderStringTargets() {
    if (!this.stringsGrid) return;
    this.stringsGrid.innerHTML = '';

    const preset = this.tuner.TUNING_PRESETS[this.tuner.currentPreset];
    if (!preset || !preset.strings || preset.strings.length === 0) {
      const msg = document.createElement('div');
      msg.className = 'strings-chromatic-msg';
      msg.innerText = 'โหมดโครมาติก (Chromatic) • ตรวจจับอิสระทุกโน้ตดนตรี 12 คีย์ (C ถึง B)';
      this.stringsGrid.appendChild(msg);
      return;
    }

    preset.strings.forEach((s) => {
      const btn = document.createElement('button');
      btn.className = 'string-target-btn';
      btn.dataset.string = s.str;
      btn.title = `สาย ${s.str}: โน้ต ${s.note} (${s.freq} Hz) - คลิกเพื่อฟังเสียงต้นแบบ`;
      btn.innerHTML = `
        <span class="str-num">${s.str}</span>
        <span class="str-note">${s.note}</span>
        <span class="str-freq">${s.freq}Hz</span>
        <span class="str-speaker">🔊</span>
      `;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.tuner.playReferenceTone(s.freq, 2.2);
        btn.classList.add('playing');
        setTimeout(() => btn.classList.remove('playing'), 600);
      });
      this.stringsGrid.appendChild(btn);
    });
  }

  _wireTunerEngine() {
    this.tuner.onPitchUpdate = (info) => {
      this._updateCompactDisplay(info);
      if (this.isOpen) {
        this._updateModalDisplay(info);
      }
    };
  }

  _updateCompactDisplay(info) {
    if (!this.compactNote || !this.compactCents || !this.compactNeedle) return;

    if (!info || info.isIdle) {
      this.compactNote.innerText = '--';
      this.compactCents.innerText = '0¢';
      this.compactNeedle.style.transform = `translateX(-50%) rotate(0deg)`;
      if (this.compactBox) this.compactBox.classList.remove('in-tune');
      return;
    }

    this.compactNote.innerText = info.note;
    const sign = info.cents > 0 ? '+' : '';
    this.compactCents.innerText = `${sign}${info.cents}¢ (${info.freq}Hz)`;

    const angle = (Math.max(-50, Math.min(50, info.cents)) / 50) * 45;
    this.compactNeedle.style.transform = `translateX(-50%) rotate(${angle}deg)`;

    if (info.inTune) {
      if (this.compactBox) this.compactBox.classList.add('in-tune');
    } else {
      if (this.compactBox) this.compactBox.classList.remove('in-tune');
    }
  }

  _updateModalDisplay(info) {
    if (!info) return;

    // 1. Note Letter & Accidental & Octave
    if (this.noteLetter) this.noteLetter.innerText = info.isIdle ? '--' : info.noteName;
    if (this.noteAccidental) this.noteAccidental.innerText = info.isIdle ? '' : info.accidental;
    if (this.noteOctave) this.noteOctave.innerText = info.isIdle ? '' : info.octave;

    // 2. Status Pill
    if (this.statusPill && this.pillText && this.pillDot) {
      this.statusPill.className = 'stage-status-pill';
      if (info.isIdle) {
        this.statusPill.classList.add('pill-idle');
        this.pillText.innerText = 'พร้อมตั้งสาย • กรุณาดีดสายกีตาร์ (PLUCK STRING)';
      } else if (info.isHolding) {
        this.statusPill.classList.add('pill-holding');
        this.pillText.innerText = `⏳ ค้างโน้ตชั่วขณะ (LOCKED: ${info.note})`;
      } else if (info.inTune) {
        this.statusPill.classList.add('pill-intune');
        this.pillText.innerText = `● ตรงคีย์สมบูรณ์แบบ (PERFECT IN TUNE • ${info.note})`;
      } else if (info.direction === 'flat') {
        this.statusPill.classList.add('pill-flat');
        this.pillText.innerText = `◀ เสียงหย่อนไป ปรับสายตึงขึ้น (TUNE UP • ${info.note})`;
      } else if (info.direction === 'sharp') {
        this.statusPill.classList.add('pill-sharp');
        this.pillText.innerText = `▶ เสียงตึงไป ปรับสายหย่อนลง (TUNE DOWN • ${info.note})`;
      }
    }

    // 3. 3-Phase Guidance Lights
    if (this.guideFlat) this.guideFlat.classList.toggle('active', !info.isIdle && info.direction === 'flat');
    if (this.guidePerfect) this.guidePerfect.classList.toggle('active', !info.isIdle && info.inTune);
    if (this.guideSharp) this.guideSharp.classList.toggle('active', !info.isIdle && info.direction === 'sharp');

    // 4. Hero Needle Rotation (-45deg to +45deg)
    if (this.meterNeedle) {
      const clampedCents = Math.max(-50, Math.min(50, info.cents || 0));
      const angle = (clampedCents / 50) * 45;
      this.meterNeedle.style.transform = `translateX(-50%) rotate(${angle}deg)`;
      if (info.inTune && !info.isIdle) {
        this.meterNeedle.classList.add('intune');
      } else {
        this.meterNeedle.classList.remove('intune');
      }
    }

    // 5. 21-LED Array Lights
    if (this.ledRow) {
      const segs = this.ledRow.querySelectorAll('.stage-led-seg');
      const cents = info.cents || 0;
      // Map -50 to +50 onto 0 to 20
      const activeIdx = Math.round(((cents + 50) / 100) * 20);

      segs.forEach((seg, idx) => {
        seg.classList.remove('active', 'lit');
        if (info.isIdle) return;

        if (info.inTune && idx === 10) {
          seg.classList.add('active', 'lit');
        } else if (!info.inTune && idx === activeIdx) {
          seg.classList.add('active', 'lit');
        }
      });
    }

    // 6. Numeric Statistics Readouts
    if (this.centsVal) {
      const sign = (info.cents > 0 ? '+' : '');
      this.centsVal.innerText = info.isIdle ? '0.0 ¢' : `${sign}${info.cents.toFixed(1)} ¢`;
      this.centsVal.className = 'stat-value cents-val ' + (info.inTune ? 'intune' : (info.direction || ''));
    }

    if (this.freqVal) {
      this.freqVal.innerText = (info.freq && !info.isIdle) ? `${info.freq.toFixed(1)} Hz` : '-- Hz';
    }

    if (this.targetVal) {
      this.targetVal.innerText = (info.targetFreq && !info.isIdle) ? `${info.targetFreq.toFixed(2)} Hz (${info.note})` : '-- Hz';
    }

    if (this.diffVal) {
      if (info.freqDiff !== undefined && !info.isIdle && info.freq) {
        const sign = info.freqDiff > 0 ? '+' : '';
        this.diffVal.innerText = `${sign}${info.freqDiff.toFixed(2)} Hz`;
      } else {
        this.diffVal.innerText = '-- Hz';
      }
    }

    // 7. Highlight matched string in 6-string target row
    if (this.stringsGrid) {
      const btns = this.stringsGrid.querySelectorAll('.string-target-btn');
      btns.forEach((btn) => {
        const strNum = parseInt(btn.dataset.string, 10);
        if (!info.isIdle && info.targetString === strNum) {
          btn.classList.add('current-active');
          if (info.inTune) {
            btn.classList.add('intune');
          } else {
            btn.classList.remove('intune');
          }
        } else {
          btn.classList.remove('current-active', 'intune');
        }
      });
    }
  }
}

window.StageTunerUI = StageTunerUI;
