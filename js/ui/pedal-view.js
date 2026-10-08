/**
 * Detailed Skeuomorphic Boss Pedal View
 * Exact 1:1 reproduction of the Boss pedal collection shown in the user's reference image
 */
class PedalView {
  constructor(container, chainState) {
    this.container = container;
    this.chainState = chainState;
    this.activeKnobs = [];
  }

  render(pedal) {
    this.activeKnobs = [];
    this.container.innerHTML = '';

    if (!pedal) {
      this.container.innerHTML = `<div class="empty-view-msg">No effect pedal selected</div>`;
      return;
    }

    const meta = this.chainState.pedalCatalog.find(p => p.type === pedal.type) || {
      name: pedal.name,
      shortName: pedal.type.toUpperCase(),
      color: '#ea5b0c',
      textColor: '#ffffff',
      desc: ''
    };

    const isBypassed = pedal.bypassed;

    const wrapper = document.createElement('div');
    wrapper.className = `pedal-stage-wrapper pedal-${pedal.type}`;

    // Top control banner
    const topBar = document.createElement('div');
    topBar.className = 'pedal-view-toolbar';
    topBar.innerHTML = `
      <div class="pedal-info-badge">
        <span class="pedal-category-tag">${meta.category || 'BOSS EFFECT'}</span>
        <h3 class="pedal-title-text">${meta.name}</h3>
      </div>
      <div class="pedal-actions">
        <button class="stage-btn bypass-toggle-btn ${isBypassed ? 'bypassed' : 'active'}">
          ${isBypassed ? 'BYPASSED' : 'ENGAGED'}
        </button>
        <button class="stage-btn remove-stage-btn" title="Remove Pedal">✕ Remove</button>
      </div>
    `;

    const bypassBtn = topBar.querySelector('.bypass-toggle-btn');
    bypassBtn.addEventListener('click', () => {
      this._playSwitchClickSound();
      pedal.toggleBypass();
      this.render(pedal);
      if (this.chainState.onChainChanged) this.chainState.onChainChanged();
    });

    const removeBtn = topBar.querySelector('.remove-stage-btn');
    removeBtn.addEventListener('click', () => {
      this.chainState.removePedal(pedal.id);
    });

    wrapper.appendChild(topBar);

    // Exact Boss Pedal Chassis
    const pedalEnclosure = document.createElement('div');
    pedalEnclosure.className = `boss-pedal-enclosure type-${pedal.type} ${isBypassed ? 'bypassed' : 'active'}`;
    pedalEnclosure.style.setProperty('--boss-color', meta.color);

    // Jack & labels text
    let leftLabel = '← OUTPUT';
    let rightLabel = 'INPUT ←';
    if (pedal.type === 'ch1') leftLabel = '← OUTPUT A<br>(MONO)';
    if (pedal.type === 'ns2') {
      leftLabel = '← OUTPUT<br>← SEND';
      rightLabel = 'INPUT ←<br>RETURN ←';
    }
    if (pedal.type === 'tu2') {
      leftLabel = '← OUTPUT<br>← BYPASS';
      rightLabel = 'INPUT ←';
    }
    if (pedal.type === 'dd3') {
      leftLabel = '← OUTPUT';
      rightLabel = 'INPUT ←<br>DIRECT OUT →';
    }

    pedalEnclosure.innerHTML = `
      <!-- Left & Right Quarter-Inch Sockets & Markings -->
      <div class="boss-side-print left-print">${leftLabel}</div>
      <div class="boss-side-print right-print">${rightLabel}</div>

      <div class="boss-jack boss-jack-in" title="INPUT">
        <div class="jack-nut"></div>
        <div class="jack-hole"></div>
      </div>
      <div class="boss-jack boss-jack-out" title="OUTPUT">
        <div class="jack-nut"></div>
        <div class="jack-hole"></div>
      </div>

      <!-- Recessed Upper Well -->
      <div class="boss-upper-well ${pedal.type === 'dd3' ? 'well-dd3-blue' : ''} ${pedal.type === 'tu2' ? 'well-tuner' : ''}">
        <!-- Check LED -->
        <div class="boss-led-housing">
          <div class="boss-led-bezel">
            <div class="boss-led ${isBypassed ? 'led-off' : 'led-on'}"></div>
          </div>
          <span class="boss-led-label">CHECK</span>
        </div>

        <!-- Controls Area (Knobs / Sliders / Screen) -->
        <div class="boss-controls-area"></div>
      </div>

      <!-- Center Metal Faceplate with Screenprinted Model Name -->
      <div class="boss-branding-band">
        ${this._getModelBrandingHTML(pedal.type, meta.name)}
      </div>

      <!-- Mid Ridge / Hinge with Screw Heads -->
      <div class="boss-hinge-section">
        <div class="boss-screw-head boss-screw-left"></div>
        <div class="boss-screw-head boss-screw-right"></div>
      </div>

      <!-- Bottom Treadle / Rubber Stomp Footpad -->
      <div class="boss-stomp-pad" title="Click to Stomp / Bypass">
        <div class="boss-rubber-tread">
          <div class="tread-ribs"></div>
          <div class="boss-embossed-logo">BOSS</div>
        </div>
        <div class="boss-thumbscrew-area">
          <div class="boss-thumbscrew" title="Thumbscrew battery compartment"></div>
        </div>
      </div>
    `;

    // Click stomp pad to toggle bypass
    const stompPad = pedalEnclosure.querySelector('.boss-stomp-pad');
    stompPad.addEventListener('click', () => {
      this._playSwitchClickSound();
      pedal.toggleBypass();
      this.render(pedal);
      if (this.chainState.onChainChanged) this.chainState.onChainChanged();
    });

    // Populate Controls
    const controlsArea = pedalEnclosure.querySelector('.boss-controls-area');
    this._populateControls(pedal, controlsArea);

    wrapper.appendChild(pedalEnclosure);
    this.container.appendChild(wrapper);
  }

  _getModelBrandingHTML(type, fullName) {
    switch(type) {
      case 'ge7':
        return `<div class="brand-title-main">Equalizer</div><div class="brand-sub-model">GE-7</div>`;
      case 'os2':
        return `<div class="brand-title-main">Over Drive/Distortion</div><div class="brand-sub-model">OS-2</div>`;
      case 'sd1':
        return `<div class="brand-title-sub">SUPER</div><div class="brand-title-main">Over Drive</div><div class="brand-sub-model">SD-1</div>`;
      case 'ds2':
        return `<div class="brand-title-sub">TURBO</div><div class="brand-title-main">Distortion</div><div class="brand-sub-model">DS-2</div>`;
      case 'ds1':
        return `<div class="brand-title-main">Distortion</div><div class="brand-sub-model">DS-1</div>`;
      case 'ns2':
        return `<div class="brand-title-main">Noise Suppressor</div><div class="brand-sub-model">NS-2</div>`;
      case 'ch1':
        return `<div class="brand-title-sub">SUPER</div><div class="brand-title-main">Chorus</div><div class="brand-sub-model">CH-1</div>`;
      case 'cs3':
        return `<div class="brand-title-main">Compression Sustainer</div><div class="brand-sub-model">CS-3</div>`;
      case 'dd3':
        return `<div class="brand-title-main">Digital Delay</div><div class="brand-sub-model">DD-3</div>`;
      case 'tr2':
        return `<div class="brand-title-main">Tremolo</div><div class="brand-sub-model">TR-2</div>`;
      case 'bd2':
        return `<div class="brand-title-main">Blues Driver</div><div class="brand-sub-model">BD-2</div>`;
      case 'tu2':
        return `<div class="brand-title-sub" style="color:#e65c00;">Chromatic</div><div class="brand-title-main" style="color:#e65c00;">Tuner</div><div class="brand-sub-model">TU-2</div>`;
      case 'rv5':
        return `<div class="brand-title-main">Digital Reverb</div><div class="brand-sub-model">RV-5</div>`;
      case 'ce2':
        return `<div class="brand-title-main">Chorus</div><div class="brand-sub-model">CE-2</div>`;
      case 'bf2':
        return `<div class="brand-title-main">Flanger</div><div class="brand-sub-model">BF-2</div>`;
      default:
        return `<div class="brand-title-main">${fullName}</div>`;
    }
  }

  _populateControls(pedal, container) {
    if (pedal.type === 'ge7') {
      this._renderGE7Sliders(container, pedal);
    } else if (pedal.type === 'tu2') {
      this._renderTU2TunerScreen(container, pedal);
    } else if (pedal.type === 'sd1' || pedal.type === 'tr2' || pedal.type === 'bd2') {
      // 3-knob triangle layout (Tone on top)
      const isTR = pedal.type === 'tr2';
      const isBD = pedal.type === 'bd2';
      const kTop = isTR ? { key: 'wave', label: 'WAVE' } : { key: 'tone', label: 'TONE' };
      const kLeft = isTR ? { key: 'rate', label: 'RATE' } : { key: 'level', label: 'LEVEL' };
      const kRight = isTR ? { key: 'depth', label: 'DEPTH' } : (isBD ? { key: 'gain', label: 'GAIN' } : { key: 'drive', label: 'DRIVE' });

      this._renderTriangleKnobs(container, pedal, kTop, kLeft, kRight);
    } else if (pedal.type === 'ds1') {
      // DS-1 Triangle layout: TONE in top center, LEVEL left, DIST right
      this._renderTriangleKnobs(container, pedal,
        { key: 'tone', label: 'TONE' },
        { key: 'level', label: 'LEVEL' },
        { key: 'dist', label: 'DIST' }
      );
    } else if (pedal.type === 'ce2') {
      // 2 knobs side by side
      this._renderInlineKnobs(container, pedal, [
        { key: 'rate', label: 'RATE' },
        { key: 'depth', label: 'DEPTH' }
      ]);
    } else if (pedal.type === 'os2') {
      // 4 knobs: LEVEL, TONE, DRIVE, COLOR
      this._renderInlineKnobs(container, pedal, [
        { key: 'level', label: 'LEVEL' },
        { key: 'tone', label: 'TONE' },
        { key: 'drive', label: 'DRIVE' },
        { key: 'color', label: 'COLOR' }
      ]);
    } else if (pedal.type === 'ds2') {
      // 4 knobs: LEVEL, TONE, DIST, TURBO
      this._renderInlineKnobs(container, pedal, [
        { key: 'level', label: 'LEVEL' },
        { key: 'tone', label: 'TONE' },
        { key: 'dist', label: 'DIST' },
        { key: 'turbo', label: 'TURBO', isTurboSwitch: true }
      ]);
    } else if (pedal.type === 'ch1') {
      // 4 knobs: E.LEVEL, EQ, RATE, DEPTH
      this._renderInlineKnobs(container, pedal, [
        { key: 'level', label: 'E.LEVEL' },
        { key: 'eq', label: 'EQ' },
        { key: 'rate', label: 'RATE' },
        { key: 'depth', label: 'DEPTH' }
      ]);
    } else if (pedal.type === 'cs3') {
      // 4 knobs: LEVEL, TONE, ATTACK, SUSTAIN
      this._renderInlineKnobs(container, pedal, [
        { key: 'level', label: 'LEVEL' },
        { key: 'tone', label: 'TONE' },
        { key: 'attack', label: 'ATTACK' },
        { key: 'sustain', label: 'SUSTAIN' }
      ]);
    } else if (pedal.type === 'dd3') {
      // 4 knobs: E.LEVEL, F.BACK, D.TIME, MODE
      this._renderInlineKnobs(container, pedal, [
        { key: 'level', label: 'E.LEVEL' },
        { key: 'feedback', label: 'F.BACK' },
        { key: 'time', label: 'D.TIME' },
        { key: 'mode', label: 'MODE', isModeSwitch: true }
      ]);
    } else if (pedal.type === 'rv5') {
      // 4 knobs: E.LEVEL, TONE, TIME, MODE
      this._renderInlineKnobs(container, pedal, [
        { key: 'level', label: 'E.LEVEL' },
        { key: 'tone', label: 'TONE' },
        { key: 'time', label: 'TIME' },
        { key: 'mode', label: 'MODE', isReverbMode: true }
      ]);
    } else if (pedal.type === 'ns2') {
      // 4 knobs: THRESHOLD, DECAY, MODE + REDUCTION indicator
      this._renderInlineKnobs(container, pedal, [
        { key: 'threshold', label: 'THRESHOLD' },
        { key: 'decay', label: 'DECAY' },
        { key: 'mode', label: 'MODE' }
      ]);
    } else if (pedal.type === 'bf2') {
      // 4 knobs: MANUAL, DEPTH, RATE, RES
      this._renderInlineKnobs(container, pedal, [
        { key: 'manual', label: 'MANUAL' },
        { key: 'depth', label: 'DEPTH' },
        { key: 'rate', label: 'RATE' },
        { key: 'res', label: 'RES' }
      ]);
    }
  }

  // 3 Knobs Triangle Formation (DS-1, SD-1, BD-2, TR-2)
  _renderTriangleKnobs(container, pedal, kTop, kLeft, kRight) {
    container.className = 'boss-controls-area triangle-formation';
    container.innerHTML = `
      <div class="triangle-top-row">
        <div class="knob-column knob-top-center" id="col-${kTop.key}">
          <div class="control-label">${kTop.label}</div>
          <div class="knob-container"></div>
          <div class="knob-val-display">${Math.round(pedal.params[kTop.key] ?? 50)}</div>
        </div>
      </div>
      <div class="triangle-bottom-row">
        <div class="knob-column" id="col-${kLeft.key}">
          <div class="control-label">${kLeft.label}</div>
          <div class="knob-container"></div>
          <div class="knob-val-display">${Math.round(pedal.params[kLeft.key] ?? 50)}</div>
        </div>
        <div class="knob-column" id="col-${kRight.key}">
          <div class="control-label">${kRight.label}</div>
          <div class="knob-container"></div>
          <div class="knob-val-display">${Math.round(pedal.params[kRight.key] ?? 50)}</div>
        </div>
      </div>
    `;

    [kTop, kLeft, kRight].forEach(cfg => {
      const holder = container.querySelector(`#col-${cfg.key} .knob-container`);
      const valDisp = container.querySelector(`#col-${cfg.key} .knob-val-display`);
      const knobEl = document.createElement('div');
      holder.appendChild(knobEl);

      const r = new window.RotaryKnob(knobEl, {
        min: 0,
        max: 100,
        value: pedal.params[cfg.key] ?? 50,
        styleType: 'boss',
        onChange: (val) => {
          pedal.updateParam(cfg.key, val);
          valDisp.innerText = Math.round(val);
        }
      });
      this.activeKnobs.push(r);
    });
  }

  // 4 or 2 Inline Knobs
  _renderInlineKnobs(container, pedal, list) {
    container.className = `boss-controls-area inline-formation count-${list.length}`;
    container.innerHTML = '';

    list.forEach(cfg => {
      const col = document.createElement('div');
      col.className = 'knob-column';

      const label = document.createElement('div');
      label.className = 'control-label';
      label.innerText = cfg.label;

      const holder = document.createElement('div');
      holder.className = 'knob-container';

      const valDisp = document.createElement('div');
      valDisp.className = 'knob-val-display';

      col.appendChild(label);
      col.appendChild(holder);
      col.appendChild(valDisp);
      container.appendChild(col);

      if (cfg.isTurboSwitch) {
        // DS-2 Turbo Rotary Switch (Mode I vs Mode II)
        const isTurboII = pedal.params[cfg.key] === 'turbo_ii';
        valDisp.innerText = isTurboII ? 'TURBO II' : 'TURBO I';

        const knobEl = document.createElement('div');
        holder.appendChild(knobEl);

        const r = new window.RotaryKnob(knobEl, {
          min: 0,
          max: 1,
          step: 1,
          value: isTurboII ? 1 : 0,
          styleType: 'boss',
          onChange: (val) => {
            const mode = val === 1 ? 'turbo_ii' : 'turbo_i';
            pedal.updateParam(cfg.key, mode);
            valDisp.innerText = val === 1 ? 'TURBO II' : 'TURBO I';
          }
        });
        this.activeKnobs.push(r);
      } else if (cfg.isModeSwitch || cfg.isReverbMode) {
        valDisp.innerText = (pedal.params[cfg.key] || '800ms').toUpperCase();
        const knobEl = document.createElement('div');
        holder.appendChild(knobEl);

        const modes = cfg.isReverbMode ? ['spring', 'plate', 'hall'] : ['50ms', '200ms', '800ms'];
        const r = new window.RotaryKnob(knobEl, {
          min: 0,
          max: modes.length - 1,
          step: 1,
          value: Math.max(0, modes.indexOf(pedal.params[cfg.key])),
          styleType: 'boss',
          onChange: (val) => {
            const m = modes[Math.round(val)] || modes[0];
            pedal.updateParam(cfg.key, m);
            valDisp.innerText = m.toUpperCase();
          }
        });
        this.activeKnobs.push(r);
      } else {
        valDisp.innerText = Math.round(pedal.params[cfg.key] ?? 50);
        const knobEl = document.createElement('div');
        holder.appendChild(knobEl);

        const r = new window.RotaryKnob(knobEl, {
          min: 0,
          max: 100,
          value: pedal.params[cfg.key] ?? 50,
          styleType: 'boss',
          onChange: (val) => {
            pedal.updateParam(cfg.key, val);
            valDisp.innerText = Math.round(val);
          }
        });
        this.activeKnobs.push(r);
      }
    });
  }

  // GE-7 7-Band Graphic Equalizer Sliders
  _renderGE7Sliders(container, pedal) {
    container.className = 'boss-controls-area ge7-sliders-well';
    const bands = [
      { key: 'b100', label: '100' },
      { key: 'b200', label: '200' },
      { key: 'b400', label: '400' },
      { key: 'b800', label: '800' },
      { key: 'b1600', label: '1.6k' },
      { key: 'b3200', label: '3.2k' },
      { key: 'b6400', label: '6.4k' },
      { key: 'level', label: 'Level' }
    ];

    container.innerHTML = `
      <div class="ge7-scale-legend">
        <span>+15</span><span>0</span><span>-15</span>
      </div>
      <div class="ge7-sliders-row"></div>
    `;

    const row = container.querySelector('.ge7-sliders-row');
    bands.forEach(b => {
      const col = document.createElement('div');
      col.className = 'ge7-col';
      col.innerHTML = `
        <div class="ge7-slot">
          <input type="range" min="-15" max="15" step="0.5" value="${pedal.params[b.key] || 0}" class="ge7-slider">
        </div>
        <div class="ge7-lbl">${b.label}</div>
      `;

      const slider = col.querySelector('.ge7-slider');
      slider.addEventListener('input', (e) => {
        pedal.updateParam(b.key, parseFloat(e.target.value));
      });

      row.appendChild(col);
    });
  }

  // TU-2 Chromatic Tuner Digital LED Display
  _renderTU2TunerScreen(container, pedal) {
    container.className = 'boss-controls-area tu2-screen-area';
    container.innerHTML = `
      <div class="tu2-screen-bezel">
        <div class="tu2-guide-leds">
          <span class="guide-arrow left-arrow">◀</span>
          <span class="guide-center-led in-tune">●</span>
          <span class="guide-arrow right-arrow">▶</span>
        </div>
        <div class="tu2-segment-display">
          <span class="tu2-note-char" id="tu2-note-val">${pedal.detectedNote || 'A'}</span>
        </div>
        <div class="tu2-pitch-scale">
          <span>STREAM/CENT</span>
        </div>
      </div>
    `;

    // Realtime display refresh
    const updateTU2 = () => {
      const noteEl = container.querySelector('#tu2-note-val');
      const centerLed = container.querySelector('.guide-center-led');
      const leftArrow = container.querySelector('.left-arrow');
      const rightArrow = container.querySelector('.right-arrow');

      if (noteEl && pedal.detectedNote) {
        noteEl.innerText = pedal.detectedNote;
        const c = pedal.cents || 0;
        if (Math.abs(c) <= 5) {
          centerLed.classList.add('lit');
          leftArrow.classList.remove('lit');
          rightArrow.classList.remove('lit');
        } else if (c < -5) {
          centerLed.classList.remove('lit');
          leftArrow.classList.add('lit');
          rightArrow.classList.remove('lit');
        } else {
          centerLed.classList.remove('lit');
          leftArrow.classList.remove('lit');
          rightArrow.classList.add('lit');
        }
      }
      if (document.body.contains(container)) {
        requestAnimationFrame(updateTU2);
      }
    };
    updateTU2();
  }

  _playSwitchClickSound() {
    if (!this.chainState.engine.ctx) return;
    const ctx = this.chainState.engine.ctx;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.04);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, t);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.045);
  }
}

window.PedalView = PedalView;
