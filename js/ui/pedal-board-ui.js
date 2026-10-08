/**
 * Pedalboard Rack UI (Matching Screenshot 3 AmpliTube Layout)
 * Renders active Boss pedals side-by-side on a wooden pedalboard shelf
 */
class PedalBoardUI {
  constructor(container, chainState, onAddPedalClick) {
    this.container = container;
    this.chainState = chainState;
    this.onAddPedalClick = onAddPedalClick;
    this.activeKnobs = [];

    this.render();
  }

  render() {
    this.activeKnobs = [];
    this.container.innerHTML = '';

    const board = document.createElement('div');
    board.className = 'pedalboard-shelf';

    // 1. Render all active Boss Pedals side-by-side
    this.chainState.pedals.forEach((pedal, idx) => {
      const meta = this.chainState.pedalCatalog.find(p => p.type === pedal.type) || {
        name: pedal.name,
        shortName: pedal.type.toUpperCase(),
        color: '#ea5b0c',
        textColor: '#fff',
        badge: 'STOMP'
      };

      const isBypassed = pedal.bypassed;

      const slot = document.createElement('div');
      slot.className = `pedal-slot ${isBypassed ? 'slot-bypassed' : 'slot-active'}`;

      // Slot Header (FX1, Reorder, Delete)
      const slotHeader = document.createElement('div');
      slotHeader.className = 'slot-header';
      slotHeader.innerHTML = `
        <span class="slot-fx-num">FX ${idx + 1}</span>
        <span class="slot-fx-name">${meta.shortName}</span>
        <div class="slot-actions">
          <button class="slot-btn left-btn" ${idx === 0 ? 'disabled' : ''} title="Move Left">◀</button>
          <button class="slot-btn right-btn" ${idx === this.chainState.pedals.length - 1 ? 'disabled' : ''} title="Move Right">▶</button>
          <button class="slot-btn del-btn" title="Remove Effect">✕</button>
        </div>
      `;

      slotHeader.querySelector('.left-btn').addEventListener('click', () => {
        this.chainState.movePedalLeft(pedal.id);
      });
      slotHeader.querySelector('.right-btn').addEventListener('click', () => {
        this.chainState.movePedalRight(pedal.id);
      });
      slotHeader.querySelector('.del-btn').addEventListener('click', () => {
        this.chainState.removePedal(pedal.id);
      });

      slot.appendChild(slotHeader);

      // Boss Pedal Enclosure
      const pedalEl = document.createElement('div');
      pedalEl.className = `boss-pedal-card type-${pedal.type} ${isBypassed ? 'pedal-bypassed' : 'pedal-engaged'}`;
      pedalEl.style.setProperty('--pedal-color', meta.color);

      // Left/Right side jack labels
      let leftLabel = '← OUT';
      let rightLabel = 'IN ←';
      if (pedal.type === 'dd3') rightLabel = 'IN ←<br>DIR →';
      if (pedal.type === 'ch1') leftLabel = '← OUT A<br>(MONO)';
      if (pedal.type === 'ns2') { leftLabel = '← OUT<br>← SEND'; rightLabel = 'IN ←<br>RET ←'; }

      pedalEl.innerHTML = `
        <div class="card-side-lbl left-lbl">${leftLabel}</div>
        <div class="card-side-lbl right-lbl">${rightLabel}</div>

        <!-- Upper Control Well -->
        <div class="card-upper-well ${pedal.type === 'dd3' ? 'well-dd3' : ''}">
          <!-- Check LED -->
          <div class="card-led-wrap">
            <div class="card-led-ring">
              <div class="card-led ${isBypassed ? 'off' : 'on'}"></div>
            </div>
            <span class="card-led-txt">CHECK</span>
          </div>

          <!-- Knobs / Controls -->
          <div class="card-knobs-area"></div>
        </div>

        <!-- Middle Model Branding -->
        <div class="card-branding">
          ${this._getPedalBrandingHTML(pedal.type, meta.name)}
        </div>

        <!-- Hinge Screws -->
        <div class="card-hinge">
          <div class="card-screw"></div>
          <div class="card-screw"></div>
        </div>

        <!-- Foot Stomp Pad -->
        <div class="card-stomp-pad" title="Click to stomp / bypass effect">
          <div class="card-rubber-tread">
            <div class="card-tread-lines"></div>
            <div class="card-boss-logo">BOSS</div>
          </div>
          <div class="card-thumbscrew-bar">
            <div class="card-thumbscrew"></div>
          </div>
        </div>
      `;

      // Click stomp pad to toggle bypass
      const stompPad = pedalEl.querySelector('.card-stomp-pad');
      stompPad.addEventListener('click', () => {
        this._playClickSound();
        pedal.toggleBypass();
        this.render();
      });

      // Populate Controls on this pedal
      const knobsArea = pedalEl.querySelector('.card-knobs-area');
      this._populatePedalControls(pedal, knobsArea);

      slot.appendChild(pedalEl);
      board.appendChild(slot);
    });

    // 2. Add Effect Slot at the end of the board
    const addSlot = document.createElement('div');
    addSlot.className = 'add-pedal-slot';
    addSlot.innerHTML = `
      <div class="add-slot-card" title="Add Boss Pedal to Chain">
        <div class="add-slot-plus">+</div>
        <div class="add-slot-lbl">ADD EFFECT</div>
        <div class="add-slot-sub">Boss Pedal Library</div>
      </div>
    `;
    addSlot.querySelector('.add-slot-card').addEventListener('click', () => {
      if (this.onAddPedalClick) this.onAddPedalClick();
    });
    board.appendChild(addSlot);

    this.container.appendChild(board);
  }

  _getPedalBrandingHTML(type, fullName) {
    switch(type) {
      // 20 Pedals from uploaded grid (media_1791433382703.jpg)
      case 'frv1':
        return `<div class="p-sub" style="font-style:italic;">'63 Fender</div><div class="p-title">Reverb</div><div class="p-model">FRV-1</div>`;
      case 'dm2w':
        return `<div class="p-title">Delay</div><div class="p-model">DM-2w</div><div class="p-waza" style="font-size:7px; color:#e2e8f0; margin-top:2px;">技 WAZA</div>`;
      case 'jb2':
        return `<div class="p-sub" style="color:#b91c1c;">JHS Pedals</div><div class="p-title">Angry Driver</div><div class="p-model">JB-2</div>`;
      case 'ce2w':
        return `<div class="p-title">Chorus</div><div class="p-model">CE-2w</div><div class="p-waza" style="font-size:7px; color:#e2e8f0; margin-top:2px;">技 WAZA</div>`;
      case 'tu3':
        return `<div class="p-sub" style="color:#dc2626;">Chromatic</div><div class="p-title" style="color:#dc2626;">Tuner</div><div class="p-model" style="color:#dc2626;">TU-3</div>`;
      case 'cp1x':
        return `<div class="p-title">Compressor</div><div class="p-model">CP-1X</div>`;
      case 'dd7':
        return `<div class="p-title" style="color:#0891b2;">Digital Delay</div><div class="p-model" style="color:#0891b2;">DD-7</div>`;
      case 'ds1':
        return `<div class="p-title">Distortion</div><div class="p-model">DS-1</div>`;
      case 'sd2':
        return `<div class="p-sub" style="color:#15803d;">DUAL</div><div class="p-title">OverDrive</div><div class="p-model">SD-2</div>`;
      case 'aw3':
        return `<div class="p-title">Dynamic Wah</div><div class="p-model">AW-3</div>`;
      case 'ge7':
        return `<div class="p-title">Equalizer</div><div class="p-model">GE-7</div>`;
      case 'ps6':
        return `<div class="p-title">Harmonist</div><div class="p-model">PS-6</div>`;
      case 'rc3':
        return `<div class="p-title">Loop Station</div><div class="p-model">RC-3</div>`;
      case 'mt2':
        return `<div class="p-title" style="color:#f97316;">Metal Zone</div><div class="p-model" style="color:#f97316;">MT-2</div>`;
      case 'ns2':
        return `<div class="p-title">Noise Suppressor</div><div class="p-model">NS-2</div>`;
      case 'od1x':
        return `<div class="p-title">OverDrive</div><div class="p-model">OD-1X</div>`;
      case 'rv6':
        return `<div class="p-title">Reverb</div><div class="p-model">RV-6</div>`;
      case 'oc3':
        return `<div class="p-sub">SUPER</div><div class="p-title">Octave</div><div class="p-model">OC-3</div>`;
      case 'sd1w':
        return `<div class="p-sub">SUPER</div><div class="p-title">Over Drive</div><div class="p-model">SD-1w</div><div class="p-waza" style="font-size:7px; color:#e2e8f0; margin-top:2px;">技 WAZA</div>`;
      case 'te2':
        return `<div class="p-title" style="color:#0284c7;">Tera Echo</div><div class="p-model" style="color:#0284c7;">TE-2</div>`;

      // Classics
      case 'os2':
        return `<div class="p-title">Over Drive/Distortion</div><div class="p-model">OS-2</div>`;
      case 'sd1':
        return `<div class="p-sub">SUPER</div><div class="p-title">Over Drive</div><div class="p-model">SD-1</div>`;
      case 'ds2':
        return `<div class="p-sub">TURBO</div><div class="p-title">Distortion</div><div class="p-model">DS-2</div>`;
      case 'ch1':
        return `<div class="p-sub">SUPER</div><div class="p-title">Chorus</div><div class="p-model">CH-1</div>`;
      case 'cs3':
        return `<div class="p-title">Compression Sustainer</div><div class="p-model">CS-3</div>`;
      case 'dd3':
        return `<div class="p-title">Digital Delay</div><div class="p-model">DD-3</div>`;
      case 'tr2':
        return `<div class="p-title">Tremolo</div><div class="p-model">TR-2</div>`;
      case 'bd2':
        return `<div class="p-title" style="color:#ffd700;">Blues Driver</div><div class="p-model" style="color:#ffd700;">BD-2</div>`;
      case 'tu2':
        return `<div class="p-sub" style="color:#e65c00;">Chromatic</div><div class="p-title" style="color:#e65c00;">Tuner</div><div class="p-model" style="color:#e65c00;">TU-2</div>`;
      case 'rv5':
        return `<div class="p-title">Digital Reverb</div><div class="p-model">RV-5</div>`;
      case 'ce2':
        return `<div class="p-title">Chorus</div><div class="p-model">CE-2</div>`;
      case 'bf2':
        return `<div class="p-title">Flanger</div><div class="p-model">BF-2</div>`;
      default:
        return `<div class="p-title">${fullName}</div>`;
    }
  }

  _populatePedalControls(pedal, container) {
    if (pedal.type === 'ge7') {
      this._renderGE7(container, pedal);
    } else if (pedal.type === 'tu2' || pedal.type === 'tu3') {
      this._renderTU2(container, pedal);
    } else if (pedal.type === 'sd1' || pedal.type === 'sd1w' || pedal.type === 'tr2' || pedal.type === 'bd2' || pedal.type === 'jb2' || pedal.type === 'sd2') {
      const isTR = pedal.type === 'tr2';
      const isBD = pedal.type === 'bd2';
      this._renderTriangle(container, pedal,
        isTR ? { key: 'wave', label: 'WAVE' } : { key: 'tone', label: 'TONE' },
        isTR ? { key: 'rate', label: 'RATE' } : { key: 'level', label: 'LEVEL' },
        isTR ? { key: 'depth', label: 'DEPTH' } : (isBD ? { key: 'gain', label: 'GAIN' } : { key: 'drive', label: 'DRIVE' })
      );
    } else if (pedal.type === 'ds1') {
      this._renderTriangle(container, pedal,
        { key: 'tone', label: 'TONE' },
        { key: 'level', label: 'LEVEL' },
        { key: 'dist', label: 'DIST' }
      );
    } else if (pedal.type === 'frv1') {
      this._renderTriangle(container, pedal,
        { key: 'tone', label: 'TONE' },
        { key: 'mixer', label: 'MIXER' },
        { key: 'dwell', label: 'DWELL' }
      );
    } else if (pedal.type === 'dm2w') {
      this._renderTriangle(container, pedal,
        { key: 'intensity', label: 'INTENS' },
        { key: 'rate', label: 'RATE' },
        { key: 'echo', label: 'ECHO' }
      );
    } else if (pedal.type === 'ce2' || pedal.type === 'ce2w') {
      this._renderInline(container, pedal, [
        { key: 'rate', label: 'RATE' },
        { key: 'depth', label: 'DEPTH' }
      ]);
    } else if (pedal.type === 'mt2') {
      this._renderInline(container, pedal, [
        { key: 'level', label: 'LVL' },
        { key: 'high', label: 'HIGH' },
        { key: 'low', label: 'LOW' },
        { key: 'middle', label: 'MID' },
        { key: 'dist', label: 'DIST' }
      ]);
    } else if (pedal.type === 'od1x') {
      this._renderInline(container, pedal, [
        { key: 'level', label: 'LEVEL' },
        { key: 'low', label: 'LOW' },
        { key: 'high', label: 'HIGH' },
        { key: 'drive', label: 'DRIVE' }
      ]);
    } else if (pedal.type === 'cp1x') {
      this._renderInline(container, pedal, [
        { key: 'level', label: 'LEVEL' },
        { key: 'attack', label: 'ATTK' },
        { key: 'ratio', label: 'RATIO' },
        { key: 'comp', label: 'COMP' }
      ]);
    } else if (pedal.type === 'dd7') {
      this._renderInline(container, pedal, [
        { key: 'level', label: 'E.LVL' },
        { key: 'feedback', label: 'F.BCK' },
        { key: 'time', label: 'TIME' },
        { key: 'mode', label: 'MODE' }
      ]);
    } else if (pedal.type === 'rv6') {
      this._renderInline(container, pedal, [
        { key: 'level', label: 'E.LVL' },
        { key: 'tone', label: 'TONE' },
        { key: 'time', label: 'TIME' },
        { key: 'mode', label: 'MODE' }
      ]);
    } else if (pedal.type === 'aw3') {
      this._renderInline(container, pedal, [
        { key: 'decay', label: 'DECAY' },
        { key: 'manual', label: 'MAN' },
        { key: 'sens', label: 'SENS' },
        { key: 'mode', label: 'MODE' }
      ]);
    } else if (pedal.type === 'ps6') {
      this._renderInline(container, pedal, [
        { key: 'balance', label: 'BAL' },
        { key: 'shift', label: 'SHIFT' },
        { key: 'key', label: 'KEY' },
        { key: 'mode', label: 'MODE' }
      ]);
    } else if (pedal.type === 'oc3') {
      this._renderInline(container, pedal, [
        { key: 'direct', label: 'DIR' },
        { key: 'oct1', label: 'OCT1' },
        { key: 'drive', label: 'DRV' },
        { key: 'mode', label: 'MODE' }
      ]);
    } else if (pedal.type === 'te2') {
      this._renderInline(container, pedal, [
        { key: 'level', label: 'E.LVL' },
        { key: 'tone', label: 'TONE' },
        { key: 'feedback', label: 'F.BCK' },
        { key: 's_time', label: 'TIME' }
      ]);
    } else if (pedal.type === 'rc3') {
      this._renderInline(container, pedal, [
        { key: 'loop', label: 'LOOP' },
        { key: 'rhythm', label: 'RHYTHM' }
      ]);
    } else if (pedal.type === 'os2') {
      this._renderInline(container, pedal, [
        { key: 'level', label: 'LEVEL' },
        { key: 'tone', label: 'TONE' },
        { key: 'drive', label: 'DRIVE' },
        { key: 'color', label: 'COLOR' }
      ]);
    } else if (pedal.type === 'ds2') {
      this._renderInline(container, pedal, [
        { key: 'level', label: 'LEVEL' },
        { key: 'tone', label: 'TONE' },
        { key: 'dist', label: 'DIST' },
        { key: 'turbo', label: 'TURBO' }
      ]);
    } else if (pedal.type === 'ch1') {
      this._renderInline(container, pedal, [
        { key: 'level', label: 'E.LVL' },
        { key: 'eq', label: 'EQ' },
        { key: 'rate', label: 'RATE' },
        { key: 'depth', label: 'DPTH' }
      ]);
    } else if (pedal.type === 'cs3') {
      this._renderInline(container, pedal, [
        { key: 'level', label: 'LEVEL' },
        { key: 'tone', label: 'TONE' },
        { key: 'attack', label: 'ATTK' },
        { key: 'sustain', label: 'SUST' }
      ]);
    } else if (pedal.type === 'dd3') {
      this._renderInline(container, pedal, [
        { key: 'level', label: 'E.LVL' },
        { key: 'feedback', label: 'F.BCK' },
        { key: 'time', label: 'TIME' },
        { key: 'mode', label: 'MODE' }
      ]);
    } else if (pedal.type === 'rv5') {
      this._renderInline(container, pedal, [
        { key: 'level', label: 'E.LVL' },
        { key: 'tone', label: 'TONE' },
        { key: 'time', label: 'TIME' },
        { key: 'mode', label: 'MODE' }
      ]);
    } else if (pedal.type === 'ns2') {
      this._renderInline(container, pedal, [
        { key: 'threshold', label: 'THRESH' },
        { key: 'decay', label: 'DECAY' },
        { key: 'mode', label: 'MODE' }
      ]);
    } else if (pedal.type === 'bf2') {
      this._renderInline(container, pedal, [
        { key: 'manual', label: 'MAN' },
        { key: 'depth', label: 'DPTH' },
        { key: 'rate', label: 'RATE' },
        { key: 'res', label: 'RES' }
      ]);
    }
  }

  _renderTriangle(container, pedal, top, left, right) {
    container.className = 'card-knobs-area triangle-layout';
    container.innerHTML = `
      <div class="row-top">
        <div class="k-item" id="k-${top.key}"><span class="k-lbl">${top.label}</span><div class="k-wrap"></div></div>
      </div>
      <div class="row-bot">
        <div class="k-item" id="k-${left.key}"><span class="k-lbl">${left.label}</span><div class="k-wrap"></div></div>
        <div class="k-item" id="k-${right.key}"><span class="k-lbl">${right.label}</span><div class="k-wrap"></div></div>
      </div>
    `;

    [top, left, right].forEach(cfg => {
      const wrap = container.querySelector(`#k-${cfg.key} .k-wrap`);
      const knobEl = document.createElement('div');
      wrap.appendChild(knobEl);
      const r = new window.RotaryKnob(knobEl, {
        min: 0,
        max: 100,
        value: pedal.params[cfg.key] ?? 50,
        styleType: 'boss',
        onChange: (v) => pedal.updateParam(cfg.key, v)
      });
      this.activeKnobs.push(r);
    });
  }

  _renderInline(container, pedal, list) {
    container.className = `card-knobs-area inline-layout count-${list.length}`;
    container.innerHTML = '';

    list.forEach(cfg => {
      const item = document.createElement('div');
      item.className = 'k-item';
      item.innerHTML = `<span class="k-lbl">${cfg.label}</span><div class="k-wrap"></div>`;

      const wrap = item.querySelector('.k-wrap');
      const knobEl = document.createElement('div');
      wrap.appendChild(knobEl);

      const r = new window.RotaryKnob(knobEl, {
        min: 0,
        max: 100,
        value: typeof pedal.params[cfg.key] === 'number' ? pedal.params[cfg.key] : 50,
        styleType: 'boss',
        onChange: (v) => pedal.updateParam(cfg.key, v)
      });
      this.activeKnobs.push(r);
      container.appendChild(item);
    });
  }

  _renderGE7(container, pedal) {
    container.className = 'card-knobs-area ge7-sliders-layout';
    const bands = ['b100', 'b200', 'b400', 'b800', 'b1600', 'b3200', 'b6400', 'level'];
    const labels = ['100', '200', '400', '800', '1.6k', '3.2k', '6.4k', 'Lvl'];

    container.innerHTML = `<div class="ge7-row"></div>`;
    const row = container.querySelector('.ge7-row');

    bands.forEach((b, i) => {
      const col = document.createElement('div');
      col.className = 'ge7-col';
      col.innerHTML = `
        <div class="ge7-track"><input type="range" min="-15" max="15" step="0.5" value="${pedal.params[b] || 0}" class="ge7-range"></div>
        <span class="ge7-text">${labels[i]}</span>
      `;
      col.querySelector('.ge7-range').addEventListener('input', (e) => {
        pedal.updateParam(b, parseFloat(e.target.value));
      });
      row.appendChild(col);
    });
  }

  _renderTU2(container, pedal) {
    container.className = 'card-knobs-area tu2-layout';
    container.innerHTML = `
      <div class="tu2-box">
        <div class="tu2-leds-bar">◀ ● ▶</div>
        <div class="tu2-screen">${pedal.detectedNote || 'A'}</div>
        <div class="tu2-tag">TUNER</div>
      </div>
    `;
  }

  _playClickSound() {
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

window.PedalBoardUI = PedalBoardUI;
