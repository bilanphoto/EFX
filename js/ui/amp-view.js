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
        </select>
      </div>
      <div class="amp-toolbar-right">
        <label>CABINET:</label>
        <select class="amp-cab-select">
          <option value="marshall_4x12" ${this.chainState.currentCab?.cabinetType === 'marshall_4x12' ? 'selected' : ''}>Marshall 1960A 4x12 Celestion</option>
          <option value="fender_2x12" ${this.chainState.currentCab?.cabinetType === 'fender_2x12' ? 'selected' : ''}>Fender 2x12 Jensen C12N</option>
          <option value="marshall_greenback" ${this.chainState.currentCab?.cabinetType === 'marshall_greenback' ? 'selected' : ''}>Marshall Greenback 70s</option>
          <option value="vox_2x12" ${this.chainState.currentCab?.cabinetType === 'vox_2x12' ? 'selected' : ''}>Vox 2x12 Alnico Blue</option>
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
}

window.AmpView = AmpView;
