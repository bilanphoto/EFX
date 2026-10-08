/**
 * Detailed Guitar Amplifier & Cabinet View
 * Renders photo-realistic Marshall DSL20, Fender Acoustasonic 15, Fender '65 Twin, Marshall JCM800
 */
class AmpView {
  constructor(container, chainState) {
    this.container = container;
    this.chainState = chainState;
    this.activeKnobs = [];

    this.render(this.chainState.currentAmp);
  }

  render(amp) {
    this.activeKnobs = [];
    this.container.innerHTML = '';

    if (!amp) {
      amp = this.chainState.currentAmp;
    }
    if (!amp) return;

    const ampType = amp.type; // 'marshall_dsl20', 'fender_acoustasonic', 'fender_twin', 'marshall_jcm800'

    const wrapper = document.createElement('div');
    wrapper.className = `amp-section-wrapper amp-${ampType}`;

    // Top Selector Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'amp-toolbar';
    toolbar.innerHTML = `
      <div class="amp-toolbar-left">
        <label>AMP MODEL:</label>
        <select class="amp-model-select">
          <option value="marshall_dsl20" ${ampType === 'marshall_dsl20' ? 'selected' : ''}>Marshall DSL20 Combo (Dual Channel Tube)</option>
          <option value="fender_acoustasonic" ${ampType === 'fender_acoustasonic' ? 'selected' : ''}>Fender Acoustasonic 15 (Tan Combo + Chorus)</option>
          <option value="fender_twin" ${ampType === 'fender_twin' ? 'selected' : ''}>Fender '65 Twin Reverb (Glassy Clean + Spring)</option>
          <option value="marshall_jcm800" ${ampType === 'marshall_jcm800' ? 'selected' : ''}>Marshall JCM800 2203 (High Gain Roar)</option>
          <option value="vox_ac30" ${ampType === 'vox_ac30' ? 'selected' : ''}>Vox AC30 Top Boost (British EL84 Chime)</option>
          <option value="mesa_dualrect" ${ampType === 'mesa_dualrect' ? 'selected' : ''}>Mesa/Boogie Dual Rectifier (High Gain Modern)</option>
          <option value="orange_rockerverb" ${ampType === 'orange_rockerverb' ? 'selected' : ''}>Orange Rockerverb 50 MKIII (British Fuzz Roar)</option>
        </select>
      </div>
      <div class="amp-toolbar-right">
        <label>CABINET:</label>
        <select class="amp-cab-select">
          <option value="marshall_4x12" ${this.chainState.currentCab?.cabinetType === 'marshall_4x12' ? 'selected' : ''}>Marshall 1960A 4x12 Celestion</option>
          <option value="fender_2x12" ${this.chainState.currentCab?.cabinetType === 'fender_2x12' ? 'selected' : ''}>Fender 2x12 Jensen C12N</option>
          <option value="marshall_greenback" ${this.chainState.currentCab?.cabinetType === 'marshall_greenback' ? 'selected' : ''}>Marshall Greenback 70s</option>
          <option value="vox_2x12" ${this.chainState.currentCab?.cabinetType === 'vox_2x12' ? 'selected' : ''}>Vox AC30 2x12 Celestion Alnico Blue</option>
          <option value="mesa_4x12" ${this.chainState.currentCab?.cabinetType === 'mesa_4x12' ? 'selected' : ''}>Mesa/Boogie Rectifier 4x12 Oversized V30</option>
          <option value="orange_4x12" ${this.chainState.currentCab?.cabinetType === 'orange_4x12' ? 'selected' : ''}>Orange PPC412 4x12 Birch V30</option>
        </select>
        <label style="margin-left:8px;">MIC:</label>
        <select class="amp-mic-select">
          <option value="axis" ${this.chainState.currentCab?.micPosition === 'axis' ? 'selected' : ''}>On-Axis (Bright)</option>
          <option value="edge" ${this.chainState.currentCab?.micPosition === 'edge' ? 'selected' : ''}>Off-Axis (Warm)</option>
        </select>
      </div>
    `;

    toolbar.querySelector('.amp-model-select').addEventListener('change', (e) => {
      this.chainState.setAmp(e.target.value);
      this.render(this.chainState.currentAmp);
    });

    toolbar.querySelector('.amp-cab-select').addEventListener('change', (e) => {
      this.chainState.setCab(e.target.value);
    });

    toolbar.querySelector('.amp-mic-select').addEventListener('change', (e) => {
      if (this.chainState.currentCab) {
        this.chainState.currentCab.setMicPosition(e.target.value);
      }
    });

    wrapper.appendChild(toolbar);

    // Main Amplifier Cabinet
    const chassis = document.createElement('div');
    chassis.className = `amp-chassis-box ${ampType}`;

    if (ampType === 'marshall_dsl20') {
      this._renderMarshallDSL20(chassis, amp);
    } else if (ampType === 'fender_acoustasonic') {
      this._renderFenderAcoustasonic(chassis, amp);
    } else if (ampType === 'fender_twin') {
      this._renderFenderTwin(chassis, amp);
    } else if (ampType === 'vox_ac30') {
      this._renderVoxAC30(chassis, amp);
    } else if (ampType === 'mesa_dualrect') {
      this._renderMesaDualRectifier(chassis, amp);
    } else if (ampType === 'orange_rockerverb') {
      this._renderOrangeRockerverb(chassis, amp);
    } else {
      this._renderMarshallJCM800(chassis, amp);
    }

    wrapper.appendChild(chassis);
    this.container.appendChild(wrapper);
  }

  // 1. Marshall DSL20 Combo (Exact Match to User's Image 2)
  _renderMarshallDSL20(chassis, amp) {
    chassis.innerHTML = `
      <div class="dsl20-frame">
        <div class="dsl20-top-handle"></div>
        <div class="dsl-corner c-tl"></div><div class="dsl-corner c-tr"></div>
        <div class="dsl-corner c-bl"></div><div class="dsl-corner c-br"></div>

        <div class="dsl20-gold-faceplate">
          <div class="dsl-input-col">
            <div class="quarter-jack"></div>
            <span class="dsl-lbl">INPUT</span>
          </div>

          <div class="dsl-sec classic-gain-sec">
            <span class="dsl-bracket-lbl">CLASSIC GAIN</span>
            <div class="dsl-knob-unit" id="k-cgain"><div class="knob-host"></div><span class="dsl-lbl red-lbl">GAIN</span></div>
            <div class="dsl-knob-unit" id="k-cvol"><div class="knob-host"></div><span class="dsl-lbl red-lbl">VOLUME</span></div>
          </div>

          <div class="dsl-push-btn-col">
            <button class="dsl-round-btn ${amp.params.channel === 'ultra' ? 'pressed' : ''}" id="btn-chan" title="Select Channel"></button>
            <span class="dsl-lbl" style="font-size:6px; text-align:center;">CHAN<br>SELECT</span>
          </div>

          <div class="dsl-sec ultra-gain-sec">
            <span class="dsl-bracket-lbl">ULTRA GAIN</span>
            <div class="dsl-knob-unit" id="k-ugain"><div class="knob-host"></div><span class="dsl-lbl">GAIN</span></div>
            <div class="dsl-knob-unit" id="k-uvol"><div class="knob-host"></div><span class="dsl-lbl">VOLUME</span></div>
          </div>

          <div class="dsl-sec eq-sec">
            <span class="dsl-bracket-lbl">EQUALISATION</span>
            <div class="dsl-knob-unit" id="k-treble"><div class="knob-host"></div><span class="dsl-lbl">TREBLE</span></div>
            <div class="dsl-knob-unit" id="k-mid"><div class="knob-host"></div><span class="dsl-lbl">MIDDLE</span></div>
            <div class="dsl-knob-unit" id="k-bass"><div class="knob-host"></div><span class="dsl-lbl">BASS</span></div>
            <div class="dsl-knob-unit" id="k-pres"><div class="knob-host"></div><span class="dsl-lbl">PRESENCE</span></div>
            <div class="dsl-knob-unit" id="k-res"><div class="knob-host"></div><span class="dsl-lbl">RESONANCE</span></div>
            <div class="dsl-knob-unit" id="k-rev"><div class="knob-host"></div><span class="dsl-lbl">REVERB</span></div>
          </div>

          <div class="dsl-switches-col">
            <div class="dsl-output-sw"><div class="black-rocker-btn"></div><span class="dsl-lbl" style="font-size:6px;">OUTPUT</span></div>
            <div class="dsl-power-sw"><div class="red-rocker-lamp on"></div><span class="dsl-lbl" style="font-size:6px;">POWER</span></div>
            <div class="dsl20-badge-text">DSL<sup>20</sup></div>
          </div>
        </div>

        <div class="dsl20-grille">
          <div class="marshall-large-script">Marshall</div>
        </div>
      </div>
    `;

    // Channel switch
    const chanBtn = chassis.querySelector('#btn-chan');
    chanBtn.addEventListener('click', () => {
      const isUltra = amp.params.channel === 'ultra';
      amp.updateParam('channel', isUltra ? 'classic' : 'ultra');
      chanBtn.classList.toggle('pressed', !isUltra);
    });

    const knobConfigs = [
      { id: 'k-cgain', key: 'classic_gain', val: amp.params.classic_gain ?? 55 },
      { id: 'k-cvol', key: 'classic_vol', val: amp.params.classic_vol ?? 65 },
      { id: 'k-ugain', key: 'ultra_gain', val: amp.params.ultra_gain ?? 75 },
      { id: 'k-uvol', key: 'ultra_vol', val: amp.params.ultra_vol ?? 70 },
      { id: 'k-treble', key: 'treble', val: amp.params.treble ?? 55 },
      { id: 'k-mid', key: 'middle', val: amp.params.middle ?? 68 },
      { id: 'k-bass', key: 'bass', val: amp.params.bass ?? 58 },
      { id: 'k-pres', key: 'presence', val: amp.params.presence ?? 62 },
      { id: 'k-res', key: 'resonance', val: amp.params.resonance ?? 55 },
      { id: 'k-rev', key: 'reverb', val: amp.params.reverb ?? 30 }
    ];

    knobConfigs.forEach(cfg => {
      const host = chassis.querySelector(`#${cfg.id} .knob-host`);
      if (host) {
        const knobEl = document.createElement('div');
        host.appendChild(knobEl);
        const r = new window.RotaryKnob(knobEl, {
          min: 0,
          max: 100,
          value: cfg.val,
          styleType: 'marshall-gold',
          onChange: (v) => amp.updateParam(cfg.key, v)
        });
        this.activeKnobs.push(r);
      }
    });
  }

  // 2. Fender Acoustasonic 15 (Exact Match to User's Image 1)
  _renderFenderAcoustasonic(chassis, amp) {
    chassis.innerHTML = `
      <div class="acoustasonic-frame">
        <div class="acoustasonic-faceplate">
          <div class="sec-group">
            <span class="sec-title">CHANNEL 1</span>
            <div class="face-item"><div class="xlr-jack"></div><span class="jack-lbl">INPUT</span></div>
            <div class="face-item" id="k-vol1"><div class="knob-host"></div><span class="jack-lbl">VOLUME</span></div>
          </div>

          <div class="sec-group">
            <span class="sec-title">CHANNEL 2</span>
            <div class="face-item"><div class="quarter-jack"></div><span class="jack-lbl">INPUT</span></div>
            <div class="face-item" id="k-vol2"><div class="knob-host"></div><span class="jack-lbl">VOLUME</span></div>
          </div>

          <div class="sec-group">
            <span class="sec-title">EQUALIZER</span>
            <div class="face-item" id="k-bass"><div class="knob-host"></div><span class="jack-lbl">BASS</span></div>
            <div class="face-item" id="k-mid"><div class="knob-host"></div><span class="jack-lbl">MIDDLE</span></div>
            <div class="face-item" id="k-treble"><div class="knob-host"></div><span class="jack-lbl">TREBLE</span></div>
          </div>

          <div class="sec-group" style="border-right:none;">
            <div class="face-item" id="k-chorus"><div class="knob-host"></div><span class="jack-lbl">CHORUS</span></div>
            <div class="face-item"><div class="quarter-jack"></div><span class="jack-lbl">PHONES</span></div>
            <div class="acoustasonic-branding">
              <span class="acou-script">Acoustasonic 15</span>
              <div class="acou-red-led on"></div>
            </div>
            <div class="face-item">
              <div class="fender-rocker-switch"><div class="rocker-paddle">|</div></div>
              <span class="jack-lbl">POWER</span>
            </div>
          </div>
        </div>

        <div class="acoustasonic-grille">
          <div class="fender-slant-logo">Fender</div>
        </div>
      </div>
    `;

    const knobConfigs = [
      { id: 'k-vol1', key: 'vol1', val: amp.params.vol1 ?? 50 },
      { id: 'k-vol2', key: 'vol2', val: amp.params.vol2 ?? 60 },
      { id: 'k-bass', key: 'bass', val: amp.params.bass ?? 55 },
      { id: 'k-mid', key: 'middle', val: amp.params.middle ?? 50 },
      { id: 'k-treble', key: 'treble', val: amp.params.treble ?? 60 },
      { id: 'k-chorus', key: 'chorus', val: amp.params.chorus ?? 35 }
    ];

    knobConfigs.forEach(cfg => {
      const host = chassis.querySelector(`#${cfg.id} .knob-host`);
      if (host) {
        const knobEl = document.createElement('div');
        host.appendChild(knobEl);
        const r = new window.RotaryKnob(knobEl, {
          min: 0,
          max: 100,
          value: cfg.val,
          styleType: 'boss',
          onChange: (v) => amp.updateParam(cfg.key, v)
        });
        this.activeKnobs.push(r);
      }
    });
  }

  // 3. Fender '65 Twin Reverb
  _renderFenderTwin(chassis, amp) {
    chassis.innerHTML = `
      <div class="fender-upper-baffle">
        <div class="fender-logo-script">Fender</div>
      </div>
      <div class="fender-faceplate">
        <div class="faceplate-brand-area"><span class="faceplate-title">Twin Reverb-Amp</span></div>
        <div class="faceplate-controls-row">
          <div class="amp-knob-col" id="ft-vol"><div class="amp-label">VOLUME</div><div class="amp-knob-holder"></div></div>
          <div class="amp-knob-col" id="ft-bright">
            <div class="amp-label">BRIGHT</div>
            <div class="mini-toggle-switch ${amp.params.bright ? 'on' : 'off'}">
              <div class="toggle-bezel"><div class="toggle-bat"></div></div>
            </div>
          </div>
          <div class="amp-knob-col" id="ft-treb"><div class="amp-label">TREBLE</div><div class="amp-knob-holder"></div></div>
          <div class="amp-knob-col" id="ft-mid"><div class="amp-label">MIDDLE</div><div class="amp-knob-holder"></div></div>
          <div class="amp-knob-col" id="ft-bass"><div class="amp-label">BASS</div><div class="amp-knob-holder"></div></div>
          <div class="amp-knob-col" id="ft-rev"><div class="amp-label">REVERB</div><div class="amp-knob-holder"></div></div>
          <div class="amp-knob-col" id="ft-mast"><div class="amp-label">MASTER</div><div class="amp-knob-holder"></div></div>
        </div>
        <div class="fender-pilot-lamp active"><div class="jewel-lens"></div></div>
      </div>
    `;

    const toggle = chassis.querySelector('.mini-toggle-switch');
    toggle.addEventListener('click', () => {
      const nw = !amp.params.bright;
      amp.updateParam('bright', nw);
      toggle.className = `mini-toggle-switch ${nw ? 'on' : 'off'}`;
    });

    const kList = [
      { id: 'ft-vol', key: 'volume', val: amp.params.volume ?? 45 },
      { id: 'ft-treb', key: 'treble', val: amp.params.treble ?? 55 },
      { id: 'ft-mid', key: 'middle', val: amp.params.middle ?? 45 },
      { id: 'ft-bass', key: 'bass', val: amp.params.bass ?? 50 },
      { id: 'ft-rev', key: 'reverb', val: amp.params.reverb ?? 30 },
      { id: 'ft-mast', key: 'master', val: amp.params.master ?? 65 }
    ];

    kList.forEach(cfg => {
      const holder = chassis.querySelector(`#${cfg.id} .amp-knob-holder`);
      if (holder) {
        const knobEl = document.createElement('div');
        holder.appendChild(knobEl);
        const r = new window.RotaryKnob(knobEl, {
          min: 0,
          max: 100,
          value: cfg.val,
          styleType: 'fender',
          onChange: (v) => amp.updateParam(cfg.key, v)
        });
        this.activeKnobs.push(r);
      }
    });
  }

  // 4. Marshall JCM800 2203
  _renderMarshallJCM800(chassis, amp) {
    chassis.innerHTML = `
      <div class="marshall-upper-baffle">
        <div class="marshall-script-logo">Marshall</div>
      </div>
      <div class="marshall-faceplate jcm-faceplate">
        <div class="marshall-badge-text"><span>JCM 800 LEAD SERIES</span></div>
        <div class="faceplate-controls-row">
          <div class="amp-knob-col" id="jcm-gain"><div class="amp-label">PRE-AMP</div><div class="amp-knob-holder"></div></div>
          <div class="amp-knob-col" id="jcm-mast"><div class="amp-label">MASTER</div><div class="amp-knob-holder"></div></div>
          <div class="amp-knob-col" id="jcm-treb"><div class="amp-label">TREBLE</div><div class="amp-knob-holder"></div></div>
          <div class="amp-knob-col" id="jcm-mid"><div class="amp-label">MIDDLE</div><div class="amp-knob-holder"></div></div>
          <div class="amp-knob-col" id="jcm-bass"><div class="amp-label">BASS</div><div class="amp-knob-holder"></div></div>
          <div class="amp-knob-col" id="jcm-pres"><div class="amp-label">PRESENCE</div><div class="amp-knob-holder"></div></div>
        </div>
        <div class="marshall-power-switch active"><div class="rocker-lamp"></div></div>
      </div>
    `;

    const kList = [
      { id: 'jcm-gain', key: 'gain', val: amp.params.gain ?? 70 },
      { id: 'jcm-mast', key: 'master', val: amp.params.master ?? 65 },
      { id: 'jcm-treb', key: 'treble', val: amp.params.treble ?? 55 },
      { id: 'jcm-mid', key: 'middle', val: amp.params.middle ?? 70 },
      { id: 'jcm-bass', key: 'bass', val: amp.params.bass ?? 55 },
      { id: 'jcm-pres', key: 'presence', val: amp.params.presence ?? 60 }
    ];

    kList.forEach(cfg => {
      const holder = chassis.querySelector(`#${cfg.id} .amp-knob-holder`);
      if (holder) {
        const knobEl = document.createElement('div');
        holder.appendChild(knobEl);
        const r = new window.RotaryKnob(knobEl, {
          min: 0,
          max: 100,
          value: cfg.val,
          styleType: 'marshall-gold',
          onChange: (v) => amp.updateParam(cfg.key, v)
        });
        this.activeKnobs.push(r);
      }
    });
  }

  // 5. Vox AC30 Top Boost
  _renderVoxAC30(chassis, amp) {
    chassis.innerHTML = `
      <div class="vox-cabinet-frame">
        <div class="vox-upper-panel">
          <div class="vox-badge-logo">VOX</div>
          <div class="vox-faceplate">
            <div class="vox-channel-group">
              <span class="vox-group-title">NORMAL</span>
              <div class="amp-knob-col" id="vox-norm"><div class="amp-label">VOLUME</div><div class="amp-knob-holder"></div></div>
            </div>
            <div class="vox-channel-group">
              <span class="vox-group-title">TOP BOOST</span>
              <div class="amp-knob-col" id="vox-tbvol"><div class="amp-label">VOLUME</div><div class="amp-knob-holder"></div></div>
              <div class="amp-knob-col" id="vox-treb"><div class="amp-label">TREBLE</div><div class="amp-knob-holder"></div></div>
              <div class="amp-knob-col" id="vox-bass"><div class="amp-label">BASS</div><div class="amp-knob-holder"></div></div>
            </div>
            <div class="vox-channel-group">
              <span class="vox-group-title">MASTER</span>
              <div class="amp-knob-col" id="vox-cut"><div class="amp-label">TONE CUT</div><div class="amp-knob-holder"></div></div>
              <div class="amp-knob-col" id="vox-mast"><div class="amp-label">VOLUME</div><div class="amp-knob-holder"></div></div>
            </div>
            <div class="vox-lamp-col">
              <div class="vox-jewel-lamp on"></div>
              <span class="vox-lamp-lbl">MAINS</span>
            </div>
          </div>
        </div>
        <div class="vox-diamond-grille">
          <div class="vox-gold-crest">AC30 6TB</div>
        </div>
      </div>
    `;

    const kList = [
      { id: 'vox-norm', key: 'normalVol', val: amp.params.normalVol ?? 45 },
      { id: 'vox-tbvol', key: 'topBoostVol', val: amp.params.topBoostVol ?? 70 },
      { id: 'vox-treb', key: 'treble', val: amp.params.treble ?? 65 },
      { id: 'vox-bass', key: 'bass', val: amp.params.bass ?? 55 },
      { id: 'vox-cut', key: 'toneCut', val: amp.params.toneCut ?? 35 },
      { id: 'vox-mast', key: 'master', val: amp.params.master ?? 65 }
    ];

    kList.forEach(cfg => {
      const holder = chassis.querySelector(`#${cfg.id} .amp-knob-holder`);
      if (holder) {
        const knobEl = document.createElement('div');
        holder.appendChild(knobEl);
        const r = new window.RotaryKnob(knobEl, {
          min: 0,
          max: 100,
          value: cfg.val,
          styleType: 'boss',
          onChange: (v) => amp.updateParam(cfg.key, v)
        });
        this.activeKnobs.push(r);
      }
    });
  }

  // 6. Mesa/Boogie Dual Rectifier
  _renderMesaDualRectifier(chassis, amp) {
    chassis.innerHTML = `
      <div class="mesa-cabinet-frame">
        <div class="mesa-diamond-plate">
          <div class="mesa-badge-logo">MESA/BOOGIE</div>
          <div class="mesa-badge-sub">DUAL RECTIFIER SOLO HEAD</div>
        </div>
        <div class="mesa-faceplate">
          <div class="mesa-controls-row">
            <div class="amp-knob-col" id="mesa-gain"><div class="amp-label">GAIN</div><div class="amp-knob-holder"></div></div>
            <div class="amp-knob-col" id="mesa-bass"><div class="amp-label">BASS</div><div class="amp-knob-holder"></div></div>
            <div class="amp-knob-col" id="mesa-mid"><div class="amp-label">MID</div><div class="amp-knob-holder"></div></div>
            <div class="amp-knob-col" id="mesa-treb"><div class="amp-label">TREBLE</div><div class="amp-knob-holder"></div></div>
            <div class="amp-knob-col" id="mesa-pres"><div class="amp-label">PRESENCE</div><div class="amp-knob-holder"></div></div>
            <div class="amp-knob-col" id="mesa-mast"><div class="amp-label">MASTER</div><div class="amp-knob-holder"></div></div>
            <div class="mesa-toggle-col">
              <span class="mesa-toggle-lbl">RECTIFIER</span>
              <button class="mesa-rect-toggle ${amp.params.rectifier === 'tube' ? 'tube-mode' : 'silicon-mode'}" id="mesa-rect-btn" title="Toggle Rectifier Mode: Silicon Diodes / Vacuum Tube Sag">
                ${amp.params.rectifier === 'tube' ? 'TUBE' : 'DIODES'}
              </button>
            </div>
            <div class="mesa-lamp-col">
              <div class="mesa-jewel-lamp on"></div>
              <span class="mesa-lamp-lbl">POWER</span>
            </div>
          </div>
        </div>
      </div>
    `;

    const toggleBtn = chassis.querySelector('#mesa-rect-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const nextMode = amp.params.rectifier === 'tube' ? 'silicon' : 'tube';
        amp.updateParam('rectifier', nextMode);
        toggleBtn.innerText = nextMode === 'tube' ? 'TUBE' : 'DIODES';
        toggleBtn.className = `mesa-rect-toggle ${nextMode === 'tube' ? 'tube-mode' : 'silicon-mode'}`;
      });
    }

    const kList = [
      { id: 'mesa-gain', key: 'gain', val: amp.params.gain ?? 75 },
      { id: 'mesa-bass', key: 'bass', val: amp.params.bass ?? 65 },
      { id: 'mesa-mid', key: 'middle', val: amp.params.middle ?? 45 },
      { id: 'mesa-treb', key: 'treble', val: amp.params.treble ?? 68 },
      { id: 'mesa-pres', key: 'presence', val: amp.params.presence ?? 70 },
      { id: 'mesa-mast', key: 'master', val: amp.params.master ?? 65 }
    ];

    kList.forEach(cfg => {
      const holder = chassis.querySelector(`#${cfg.id} .amp-knob-holder`);
      if (holder) {
        const knobEl = document.createElement('div');
        holder.appendChild(knobEl);
        const r = new window.RotaryKnob(knobEl, {
          min: 0,
          max: 100,
          value: cfg.val,
          styleType: 'fender',
          onChange: (v) => amp.updateParam(cfg.key, v)
        });
        this.activeKnobs.push(r);
      }
    });
  }

  // 7. Orange Rockerverb 50 MKIII
  _renderOrangeRockerverb(chassis, amp) {
    chassis.innerHTML = `
      <div class="orange-cabinet-frame">
        <div class="orange-header-band">
          <div class="orange-crest-logo">ORANGE</div>
          <div class="orange-model-badge">ROCKERVERB 50</div>
        </div>
        <div class="orange-faceplate">
          <div class="orange-controls-row">
            <div class="amp-knob-col orange-knob-col" id="or-gain"><div class="orange-symbol">✊</div><div class="amp-label">GAIN</div><div class="amp-knob-holder"></div></div>
            <div class="amp-knob-col orange-knob-col" id="or-bass"><div class="orange-symbol">🔉</div><div class="amp-label">BASS</div><div class="amp-knob-holder"></div></div>
            <div class="amp-knob-col orange-knob-col" id="or-mid"><div class="orange-symbol">🔊</div><div class="amp-label">MIDDLE</div><div class="amp-knob-holder"></div></div>
            <div class="amp-knob-col orange-knob-col" id="or-treb"><div class="orange-symbol">⚡</div><div class="amp-label">TREBLE</div><div class="amp-knob-holder"></div></div>
            <div class="amp-knob-col orange-knob-col" id="or-att"><div class="orange-symbol">🎚️</div><div class="amp-label">ATTENUATOR</div><div class="amp-knob-holder"></div></div>
            <div class="amp-knob-col orange-knob-col" id="or-mast"><div class="orange-symbol">📢</div><div class="amp-label">VOLUME</div><div class="amp-knob-holder"></div></div>
            <div class="orange-lamp-col">
              <div class="orange-jewel-lamp on"></div>
              <span class="orange-lamp-lbl">ON</span>
            </div>
          </div>
        </div>
        <div class="orange-woven-grille"></div>
      </div>
    `;

    const kList = [
      { id: 'or-gain', key: 'gain', val: amp.params.gain ?? 70 },
      { id: 'or-bass', key: 'bass', val: amp.params.bass ?? 60 },
      { id: 'or-mid', key: 'middle', val: amp.params.middle ?? 70 },
      { id: 'or-treb', key: 'treble', val: amp.params.treble ?? 55 },
      { id: 'or-att', key: 'attenuator', val: amp.params.attenuator ?? 75 },
      { id: 'or-mast', key: 'master', val: amp.params.master ?? 65 }
    ];

    kList.forEach(cfg => {
      const holder = chassis.querySelector(`#${cfg.id} .amp-knob-holder`);
      if (holder) {
        const knobEl = document.createElement('div');
        holder.appendChild(knobEl);
        const r = new window.RotaryKnob(knobEl, {
          min: 0,
          max: 100,
          value: cfg.val,
          styleType: 'boss',
          onChange: (v) => amp.updateParam(cfg.key, v)
        });
        this.activeKnobs.push(r);
      }
    });
  }
}

window.AmpView = AmpView;
