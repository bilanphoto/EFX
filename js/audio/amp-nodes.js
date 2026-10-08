/**
 * Guitar Amplifiers DSP Modeling (Including Fender Acoustasonic 15 & Marshall DSL20)
 * Emulates Fender Acoustasonic 15, Marshall DSL20, Fender '65 Twin Reverb, Marshall JCM800
 */

class BaseAmp {
  constructor(id, type, name, engine) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.engine = engine;
    this.ctx = engine.ctx;
    this.bypassed = false;

    this.inputNode = this.ctx.createGain();
    this.outputNode = this.ctx.createGain();
    this.ampInput = this.ctx.createGain();
    this.ampOutput = this.ctx.createGain();
    this.dryNode = this.ctx.createGain();

    this.inputNode.connect(this.ampInput);
    this.ampOutput.connect(this.outputNode);

    this.inputNode.connect(this.dryNode);
    this.dryNode.connect(this.outputNode);

    this.ampInput.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.dryNode.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.params = {};
    this.onParamChanged = null;
  }

  setBypass(bypassed) {
    this.bypassed = bypassed;
    const t = this.ctx.currentTime;
    if (bypassed) {
      this.ampInput.gain.setTargetAtTime(0.0, t, 0.02);
      this.dryNode.gain.setTargetAtTime(1.0, t, 0.02);
    } else {
      this.ampInput.gain.setTargetAtTime(1.0, t, 0.02);
      this.dryNode.gain.setTargetAtTime(0.0, t, 0.02);
    }
    if (this.onParamChanged) this.onParamChanged('bypassed', bypassed);
  }

  disconnect() {
    this.inputNode.disconnect();
    this.outputNode.disconnect();
  }

  updateParam(name, val) {
    this.params[name] = val;
    if (this.onParamChanged) this.onParamChanged(name, val);
  }
}

function makeTubeCurve(type, saturation = 2.0) {
  const n = 4096;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    if (type === '12ax7') {
      if (x >= 0) {
        curve[i] = Math.tanh(saturation * x * 1.2) * 0.9;
      } else {
        curve[i] = (Math.tanh(saturation * x * 0.8) * 0.7) + (0.1 * Math.sin(Math.PI * x));
      }
    } else if (type === 'el34') {
      const k = saturation * 2.2;
      curve[i] = Math.tanh(k * x) / (1 + 0.2 * Math.abs(x));
    } else if (type === 'el84') {
      // Vox AC30 Class A EL84 cathode-biased chime and chimey breakup
      const k = saturation * 1.8;
      curve[i] = Math.tanh(k * x * 1.1) * 0.88 + 0.12 * Math.sin(Math.PI * x) * Math.exp(-Math.abs(x));
    } else if (type === '6l6') {
      // Mesa/Boogie 6L6 high-headroom punch with tight scooped compression
      const k = saturation * 2.1;
      curve[i] = Math.tanh(k * x) / (1 + 0.18 * Math.pow(Math.abs(x), 1.4));
    } else if (type === 'orange_tube') {
      // Orange Rockerverb thick fuzzy harmonic roar with low-mid tube compression
      const k = saturation * 2.4;
      curve[i] = Math.tanh(k * x * 1.2) * 0.82 + 0.14 * Math.tanh(k * 2.5 * x);
    } else if (type === 'clean_acoustic') {
      // Gentle linear with ultra soft headroom compression
      curve[i] = Math.tanh(saturation * x * 0.95);
    }
  }
  return curve;
}

/**
 * 1. Fender Acoustasonic 15 (Matching Image 1)
 * Controls: Channel 1 Vol, Channel 2 Vol, Bass, Middle, Treble, Chorus
 */
class FenderAcoustasonicAmp extends BaseAmp {
  constructor(id, engine) {
    super(id, 'fender_acoustasonic', 'Fender Acoustasonic 15', engine);

    this.preVolume = this.ctx.createGain();
    this.bassFilter = this.ctx.createBiquadFilter();
    this.midFilter = this.ctx.createBiquadFilter();
    this.trebleFilter = this.ctx.createBiquadFilter();

    // Onboard Chorus circuit
    this.chorusDelay = this.ctx.createDelay(0.04);
    this.chorusLfo = this.ctx.createOscillator();
    this.chorusLfoGain = this.ctx.createGain();
    this.chorusWetGain = this.ctx.createGain();
    this.chorusDryGain = this.ctx.createGain();

    this.saturation = this.ctx.createWaveShaper();
    this.masterGain = this.ctx.createGain();

    this._setupGraph();

    this.params = {
      vol1: 50,
      vol2: 60,
      bass: 55,
      middle: 50,
      treble: 60,
      chorus: 35
    };
    this.applyParams();
  }

  _setupGraph() {
    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.setValueAtTime(100, this.ctx.currentTime);

    this.midFilter.type = 'peaking';
    this.midFilter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    this.midFilter.Q.setValueAtTime(1.1, this.ctx.currentTime);

    this.trebleFilter.type = 'highshelf';
    this.trebleFilter.frequency.setValueAtTime(3500, this.ctx.currentTime);

    // Chorus
    this.chorusLfo.type = 'sine';
    this.chorusLfo.frequency.setValueAtTime(1.5, this.ctx.currentTime);
    this.chorusLfoGain.gain.setValueAtTime(0.002, this.ctx.currentTime);
    this.chorusLfo.connect(this.chorusDelay.delayTime);
    this.chorusLfo.start();

    this.saturation.oversample = '4x';
    this.saturation.curve = makeTubeCurve('clean_acoustic', 1.1);

    // Graph
    this.ampInput.connect(this.preVolume);
    this.preVolume.connect(this.bassFilter);
    this.bassFilter.connect(this.midFilter);
    this.midFilter.connect(this.trebleFilter);

    // Split to chorus
    this.trebleFilter.connect(this.chorusDryGain);
    this.trebleFilter.connect(this.chorusDelay);
    this.chorusDelay.connect(this.chorusWetGain);

    this.chorusDryGain.connect(this.saturation);
    this.chorusWetGain.connect(this.saturation);

    this.saturation.connect(this.masterGain);
    this.masterGain.connect(this.ampOutput);
  }

  applyParams() {
    const t = this.ctx.currentTime;
    const vol = 0.5 + (this.params.vol2 / 100) * 1.8;
    this.preVolume.gain.setTargetAtTime(vol, t, 0.02);

    const b = -6.0 + (this.params.bass / 100) * 12.0;
    this.bassFilter.gain.setTargetAtTime(b, t, 0.02);

    const m = -6.0 + (this.params.middle / 100) * 12.0;
    this.midFilter.gain.setTargetAtTime(m, t, 0.02);

    const tr = -6.0 + (this.params.treble / 100) * 12.0;
    this.trebleFilter.gain.setTargetAtTime(tr, t, 0.02);

    // Chorus wet level
    const ch = (this.params.chorus / 100) * 0.7;
    this.chorusWetGain.gain.setTargetAtTime(ch, t, 0.02);
    this.chorusDryGain.gain.setTargetAtTime(1.0 - ch * 0.3, t, 0.02);

    this.masterGain.gain.setTargetAtTime(1.1, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 2. Marshall DSL20 Combo (Matching Image 2)
 * Dual Channels: Classic Gain & Ultra Gain
 * Controls: Classic Gain, Classic Vol, Ultra Gain, Ultra Vol, Treble, Middle, Bass, Presence, Resonance, Reverb
 */
class MarshallDSL20Amp extends BaseAmp {
  constructor(id, engine) {
    super(id, 'marshall_dsl20', 'Marshall DSL20 Combo', engine);

    this.preEQ = this.ctx.createBiquadFilter();
    this.classicGainNode = this.ctx.createGain();
    this.classicShaper = this.ctx.createWaveShaper();

    this.ultraGainNode = this.ctx.createGain();
    this.ultraShaper = this.ctx.createWaveShaper();

    this.channelMixer = this.ctx.createGain();

    // Equalisation: Treble, Middle, Bass, Presence, Resonance
    this.bassFilter = this.ctx.createBiquadFilter();
    this.midFilter = this.ctx.createBiquadFilter();
    this.trebleFilter = this.ctx.createBiquadFilter();
    this.presenceFilter = this.ctx.createBiquadFilter();
    this.resonanceFilter = this.ctx.createBiquadFilter();

    // Power stage
    this.powerTube = this.ctx.createWaveShaper();
    this.masterGain = this.ctx.createGain();

    this._setupGraph();

    this.params = {
      channel: 'ultra', // 'classic' or 'ultra'
      classic_gain: 55,
      classic_vol: 65,
      ultra_gain: 75,
      ultra_vol: 70,
      treble: 55,
      middle: 68,
      bass: 58,
      presence: 62,
      resonance: 55,
      reverb: 30
    };
    this.applyParams();
  }

  _setupGraph() {
    this.preEQ.type = 'peaking';
    this.preEQ.frequency.setValueAtTime(800, this.ctx.currentTime);
    this.preEQ.gain.setValueAtTime(4.0, this.ctx.currentTime);

    this.classicShaper.oversample = '4x';
    this.ultraShaper.oversample = '4x';
    this.powerTube.oversample = '4x';

    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.setValueAtTime(110, this.ctx.currentTime);

    this.midFilter.type = 'peaking';
    this.midFilter.frequency.setValueAtTime(850, this.ctx.currentTime);
    this.midFilter.Q.setValueAtTime(1.4, this.ctx.currentTime);

    this.trebleFilter.type = 'highshelf';
    this.trebleFilter.frequency.setValueAtTime(2800, this.ctx.currentTime);

    this.presenceFilter.type = 'peaking';
    this.presenceFilter.frequency.setValueAtTime(4800, this.ctx.currentTime);
    this.presenceFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    this.resonanceFilter.type = 'peaking';
    this.resonanceFilter.frequency.setValueAtTime(90, this.ctx.currentTime);
    this.resonanceFilter.Q.setValueAtTime(1.6, this.ctx.currentTime);

    // Split channel paths
    this.ampInput.connect(this.preEQ);

    // Classic Gain path
    this.preEQ.connect(this.classicGainNode);
    this.classicGainNode.connect(this.classicShaper);
    this.classicShaper.connect(this.channelMixer);

    // Ultra Gain path
    this.preEQ.connect(this.ultraGainNode);
    this.ultraGainNode.connect(this.ultraShaper);
    this.ultraShaper.connect(this.channelMixer);

    // Tone stack
    this.channelMixer.connect(this.resonanceFilter);
    this.resonanceFilter.connect(this.bassFilter);
    this.bassFilter.connect(this.midFilter);
    this.midFilter.connect(this.trebleFilter);
    this.trebleFilter.connect(this.presenceFilter);
    this.presenceFilter.connect(this.powerTube);
    this.powerTube.connect(this.masterGain);
    this.masterGain.connect(this.ampOutput);
  }

  applyParams() {
    const t = this.ctx.currentTime;
    const isUltra = this.params.channel === 'ultra';

    if (isUltra) {
      const g = 1.0 + (this.params.ultra_gain / 100) * 22.0;
      this.ultraGainNode.gain.setTargetAtTime(g, t, 0.02);
      this.ultraShaper.curve = makeTubeCurve('12ax7', 2.0 + (this.params.ultra_gain / 100) * 3.5);
      this.classicGainNode.gain.setTargetAtTime(0.0, t, 0.02);
    } else {
      const g = 1.0 + (this.params.classic_gain / 100) * 8.0;
      this.classicGainNode.gain.setTargetAtTime(g, t, 0.02);
      this.classicShaper.curve = makeTubeCurve('12ax7', 1.2 + (this.params.classic_gain / 100) * 2.0);
      this.ultraGainNode.gain.setTargetAtTime(0.0, t, 0.02);
    }

    const b = -6.0 + (this.params.bass / 100) * 14.0;
    this.bassFilter.gain.setTargetAtTime(b, t, 0.02);

    const m = -6.0 + (this.params.middle / 100) * 14.0;
    this.midFilter.gain.setTargetAtTime(m, t, 0.02);

    const tr = -6.0 + (this.params.treble / 100) * 14.0;
    this.trebleFilter.gain.setTargetAtTime(tr, t, 0.02);

    const p = -4.0 + (this.params.presence / 100) * 14.0;
    this.presenceFilter.gain.setTargetAtTime(p, t, 0.02);

    const res = -2.0 + (this.params.resonance / 100) * 10.0;
    this.resonanceFilter.gain.setTargetAtTime(res, t, 0.02);

    this.powerTube.curve = makeTubeCurve('el34', 1.3);
    const mVol = (isUltra ? this.params.ultra_vol : this.params.classic_vol) / 100;
    this.masterGain.gain.setTargetAtTime(mVol * 1.4, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 3. Fender '65 Blackface Twin Reverb
 */
class FenderTwinReverbAmp extends BaseAmp {
  constructor(id, engine) {
    super(id, 'fender_twin', "Fender '65 Twin Reverb", engine);

    this.inputTrim = this.ctx.createGain();
    this.brightFilter = this.ctx.createBiquadFilter();
    this.preampGain = this.ctx.createGain();
    this.preampTube = this.ctx.createWaveShaper();

    this.bassFilter = this.ctx.createBiquadFilter();
    this.midFilter = this.ctx.createBiquadFilter();
    this.trebleFilter = this.ctx.createBiquadFilter();

    this.powerTube = this.ctx.createWaveShaper();
    this.masterGain = this.ctx.createGain();

    this._setupGraph();

    this.params = {
      volume: 45,
      bright: false,
      treble: 55,
      middle: 45,
      bass: 50,
      reverb: 30,
      master: 65
    };
    this.applyParams();
  }

  _setupGraph() {
    this.brightFilter.type = 'highshelf';
    this.brightFilter.frequency.setValueAtTime(3200, this.ctx.currentTime);

    this.preampTube.oversample = '4x';
    this.powerTube.oversample = '4x';

    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.setValueAtTime(95, this.ctx.currentTime);

    this.midFilter.type = 'peaking';
    this.midFilter.frequency.setValueAtTime(500, this.ctx.currentTime);
    this.midFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    this.trebleFilter.type = 'highshelf';
    this.trebleFilter.frequency.setValueAtTime(3800, this.ctx.currentTime);

    this.ampInput.connect(this.inputTrim);
    this.inputTrim.connect(this.brightFilter);
    this.brightFilter.connect(this.preampGain);
    this.preampGain.connect(this.preampTube);

    this.preampTube.connect(this.bassFilter);
    this.bassFilter.connect(this.midFilter);
    this.midFilter.connect(this.trebleFilter);
    this.trebleFilter.connect(this.powerTube);
    this.powerTube.connect(this.masterGain);
    this.masterGain.connect(this.ampOutput);
  }

  applyParams() {
    const t = this.ctx.currentTime;
    const vol = 0.5 + (this.params.volume / 100) * 8.0;
    this.preampGain.gain.setTargetAtTime(vol, t, 0.02);
    this.preampTube.curve = makeTubeCurve('12ax7', 1.0 + (this.params.volume / 100) * 2.5);

    this.brightFilter.gain.setTargetAtTime(this.params.bright ? 5.5 : 0.0, t, 0.02);

    const midDb = -10.0 + (this.params.middle / 100) * 10.0;
    this.midFilter.gain.setTargetAtTime(midDb, t, 0.02);

    const bassDb = -8.0 + (this.params.bass / 100) * 16.0;
    this.bassFilter.gain.setTargetAtTime(bassDb, t, 0.02);

    const trebleDb = -8.0 + (this.params.treble / 100) * 16.0;
    this.trebleFilter.gain.setTargetAtTime(trebleDb, t, 0.02);

    this.powerTube.curve = makeTubeCurve('el34', 1.0 + (this.params.master / 100) * 1.2);
    const mGain = (this.params.master / 100) * 1.2;
    this.masterGain.gain.setTargetAtTime(mGain, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 4. Marshall JCM800 2203
 */
class MarshallJCM800Amp extends BaseAmp {
  constructor(id, engine) {
    super(id, 'marshall_jcm800', 'Marshall JCM800 2203', engine);

    this.preGain = this.ctx.createGain();
    this.preMidPunch = this.ctx.createBiquadFilter();
    this.tubeStage1 = this.ctx.createWaveShaper();
    this.tubeStage2 = this.ctx.createWaveShaper();

    this.bassFilter = this.ctx.createBiquadFilter();
    this.midFilter = this.ctx.createBiquadFilter();
    this.trebleFilter = this.ctx.createBiquadFilter();
    this.presenceFilter = this.ctx.createBiquadFilter();

    this.powerTube = this.ctx.createWaveShaper();
    this.masterGain = this.ctx.createGain();

    this._setupGraph();

    this.params = {
      gain: 70,
      master: 65,
      treble: 55,
      middle: 70,
      bass: 55,
      presence: 60
    };
    this.applyParams();
  }

  _setupGraph() {
    this.tubeStage1.oversample = '4x';
    this.tubeStage2.oversample = '4x';
    this.powerTube.oversample = '4x';

    this.preMidPunch.type = 'peaking';
    this.preMidPunch.frequency.setValueAtTime(800, this.ctx.currentTime);
    this.preMidPunch.Q.setValueAtTime(1.5, this.ctx.currentTime);
    this.preMidPunch.gain.setValueAtTime(3.5, this.ctx.currentTime);

    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.setValueAtTime(120, this.ctx.currentTime);

    this.midFilter.type = 'peaking';
    this.midFilter.frequency.setValueAtTime(850, this.ctx.currentTime);
    this.midFilter.Q.setValueAtTime(1.4, this.ctx.currentTime);

    this.trebleFilter.type = 'highshelf';
    this.trebleFilter.frequency.setValueAtTime(2800, this.ctx.currentTime);

    this.presenceFilter.type = 'peaking';
    this.presenceFilter.frequency.setValueAtTime(4800, this.ctx.currentTime);
    this.presenceFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    this.ampInput.connect(this.preMidPunch);
    this.preMidPunch.connect(this.preGain);
    this.preGain.connect(this.tubeStage1);
    this.tubeStage1.connect(this.tubeStage2);
    this.tubeStage2.connect(this.bassFilter);
    this.bassFilter.connect(this.midFilter);
    this.midFilter.connect(this.trebleFilter);
    this.trebleFilter.connect(this.presenceFilter);
    this.presenceFilter.connect(this.powerTube);
    this.powerTube.connect(this.masterGain);
    this.masterGain.connect(this.ampOutput);
  }

  applyParams() {
    const t = this.ctx.currentTime;
    const g = 1.0 + (this.params.gain / 100) * 16.0;
    this.preGain.gain.setTargetAtTime(g, t, 0.02);

    this.tubeStage1.curve = makeTubeCurve('12ax7', 1.2 + (this.params.gain / 100) * 3.0);
    this.tubeStage2.curve = makeTubeCurve('12ax7', 1.5 + (this.params.gain / 100) * 3.5);

    const midDb = -6.0 + (this.params.middle / 100) * 14.0;
    this.midFilter.gain.setTargetAtTime(midDb, t, 0.02);

    const bassDb = -8.0 + (this.params.bass / 100) * 16.0;
    this.bassFilter.gain.setTargetAtTime(bassDb, t, 0.02);

    const trebleDb = -8.0 + (this.params.treble / 100) * 16.0;
    this.trebleFilter.gain.setTargetAtTime(trebleDb, t, 0.02);

    const presDb = -4.0 + (this.params.presence / 100) * 14.0;
    this.presenceFilter.gain.setTargetAtTime(presDb, t, 0.02);

    this.powerTube.curve = makeTubeCurve('el34', 1.2 + (this.params.master / 100) * 2.2);
    const mGain = (this.params.master / 100) * 1.3;
    this.masterGain.gain.setTargetAtTime(mGain, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 5. Vox AC30 Top Boost (British Invasion EL84 Chime)
 * Controls: Normal Vol, Top Boost Vol, Treble, Bass, Tone Cut, Master
 */
class VoxAC30Amp extends BaseAmp {
  constructor(id, engine) {
    super(id, 'vox_ac30', 'Vox AC30 Top Boost', engine);

    // Channels
    this.normalGain = this.ctx.createGain();
    this.topBoostGain = this.ctx.createGain();
    this.topBoostBrightFilter = this.ctx.createBiquadFilter();

    // Preamp Tube
    this.preampTube = this.ctx.createWaveShaper();

    // Interactive AC30 Tone Stack (Interactive Treble & Bass)
    this.bassFilter = this.ctx.createBiquadFilter();
    this.midScoopFilter = this.ctx.createBiquadFilter();
    this.trebleFilter = this.ctx.createBiquadFilter();

    // Master Tone Cut Filter (Post-phase-inverter low-pass)
    this.toneCutFilter = this.ctx.createBiquadFilter();

    // EL84 Class-A Power Tubes
    this.powerTube = this.ctx.createWaveShaper();
    this.masterGain = this.ctx.createGain();

    this._setupGraph();

    this.params = {
      normalVol: 45,
      topBoostVol: 70,
      bass: 55,
      treble: 65,
      toneCut: 35,
      master: 65
    };
    this.applyParams();
  }

  _setupGraph() {
    this.topBoostBrightFilter.type = 'highshelf';
    this.topBoostBrightFilter.frequency.setValueAtTime(2400, this.ctx.currentTime);
    this.topBoostBrightFilter.gain.setValueAtTime(4.5, this.ctx.currentTime);

    this.preampTube.oversample = '4x';
    this.powerTube.oversample = '4x';

    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.setValueAtTime(140, this.ctx.currentTime);

    this.midScoopFilter.type = 'peaking';
    this.midScoopFilter.frequency.setValueAtTime(550, this.ctx.currentTime);
    this.midScoopFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    this.trebleFilter.type = 'highshelf';
    this.trebleFilter.frequency.setValueAtTime(3200, this.ctx.currentTime);

    this.toneCutFilter.type = 'lowpass';
    this.toneCutFilter.frequency.setValueAtTime(6000, this.ctx.currentTime);
    this.toneCutFilter.Q.setValueAtTime(0.7, this.ctx.currentTime);

    // Graph routing
    this.ampInput.connect(this.normalGain);
    this.ampInput.connect(this.topBoostBrightFilter);
    this.topBoostBrightFilter.connect(this.topBoostGain);

    this.normalGain.connect(this.preampTube);
    this.topBoostGain.connect(this.preampTube);

    this.preampTube.connect(this.bassFilter);
    this.bassFilter.connect(this.midScoopFilter);
    this.midScoopFilter.connect(this.trebleFilter);
    this.trebleFilter.connect(this.toneCutFilter);
    this.toneCutFilter.connect(this.powerTube);
    this.powerTube.connect(this.masterGain);
    this.masterGain.connect(this.ampOutput);
  }

  applyParams() {
    const t = this.ctx.currentTime;

    const normG = (this.params.normalVol / 100) * 3.5;
    this.normalGain.gain.setTargetAtTime(normG, t, 0.02);

    const tbG = (this.params.topBoostVol / 100) * 5.0;
    this.topBoostGain.gain.setTargetAtTime(tbG, t, 0.02);

    const totalDrive = (this.params.normalVol * 0.4 + this.params.topBoostVol * 0.8) / 100;
    this.preampTube.curve = makeTubeCurve('12ax7', 1.0 + totalDrive * 2.8);

    const bassDb = -8.0 + (this.params.bass / 100) * 16.0;
    this.bassFilter.gain.setTargetAtTime(bassDb, t, 0.02);

    const trebDb = -8.0 + (this.params.treble / 100) * 16.0;
    this.trebleFilter.gain.setTargetAtTime(trebDb, t, 0.02);

    // Interactive AC30 mid scoop deepens as treble and bass increase
    const interactiveMid = -2.0 - ((this.params.bass + this.params.treble) / 200) * 6.0;
    this.midScoopFilter.gain.setTargetAtTime(interactiveMid, t, 0.02);

    // Tone Cut: turning UP cuts higher frequencies (from 8500Hz down to 2600Hz)
    const cutFreq = 8500 - (this.params.toneCut / 100) * 5900;
    this.toneCutFilter.frequency.setTargetAtTime(cutFreq, t, 0.02);

    // EL84 Class A power tube chime
    const powerDrive = 1.0 + (this.params.master / 100) * 2.5;
    this.powerTube.curve = makeTubeCurve('el84', powerDrive);

    const mGain = (this.params.master / 100) * 1.25;
    this.masterGain.gain.setTargetAtTime(mGain, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 6. Mesa/Boogie Dual Rectifier (Modern American High Gain & Punishing Lows)
 * Controls: Gain, Bass, Middle, Treble, Presence, Rectifier (tube/silicon), Master
 */
class MesaDualRectifierAmp extends BaseAmp {
  constructor(id, engine) {
    super(id, 'mesa_dualrect', 'Mesa/Boogie Dual Rectifier', engine);

    // Tight pre-distortion low cut filter
    this.tightFilter = this.ctx.createBiquadFilter();
    this.preGain = this.ctx.createGain();

    // Cascaded 12AX7 High Gain Stages
    this.tubeStage1 = this.ctx.createWaveShaper();
    this.tubeStage2 = this.ctx.createWaveShaper();
    this.tubeStage3 = this.ctx.createWaveShaper();

    // Rectifier Sag Simulation
    this.sagCompressor = this.ctx.createDynamicsCompressor();
    this.rectifierBypassGain = this.ctx.createGain();
    this.rectifierWetGain = this.ctx.createGain();

    // Mesa Post-Gain Tone Stack
    this.bassFilter = this.ctx.createBiquadFilter();
    this.midFilter = this.ctx.createBiquadFilter();
    this.trebleFilter = this.ctx.createBiquadFilter();
    this.presenceFilter = this.ctx.createBiquadFilter();

    // 6L6 Power Tubes
    this.powerTube = this.ctx.createWaveShaper();
    this.masterGain = this.ctx.createGain();

    this._setupGraph();

    this.params = {
      gain: 75,
      bass: 65,
      middle: 45,
      treble: 68,
      presence: 70,
      rectifier: 'silicon', // 'silicon' or 'tube'
      master: 65
    };
    this.applyParams();
  }

  _setupGraph() {
    this.tightFilter.type = 'highpass';
    this.tightFilter.frequency.setValueAtTime(110, this.ctx.currentTime);
    this.tightFilter.Q.setValueAtTime(0.8, this.ctx.currentTime);

    this.tubeStage1.oversample = '4x';
    this.tubeStage2.oversample = '4x';
    this.tubeStage3.oversample = '4x';
    this.powerTube.oversample = '4x';

    // Rectifier Tube Sag dynamics
    this.sagCompressor.threshold.setValueAtTime(-20, this.ctx.currentTime);
    this.sagCompressor.knee.setValueAtTime(12, this.ctx.currentTime);
    this.sagCompressor.ratio.setValueAtTime(6, this.ctx.currentTime);
    this.sagCompressor.attack.setValueAtTime(0.015, this.ctx.currentTime);
    this.sagCompressor.release.setValueAtTime(0.08, this.ctx.currentTime);

    // Mesa Tone Stack
    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.setValueAtTime(110, this.ctx.currentTime);

    this.midFilter.type = 'peaking';
    this.midFilter.frequency.setValueAtTime(750, this.ctx.currentTime);
    this.midFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    this.trebleFilter.type = 'highshelf';
    this.trebleFilter.frequency.setValueAtTime(3600, this.ctx.currentTime);

    this.presenceFilter.type = 'peaking';
    this.presenceFilter.frequency.setValueAtTime(5400, this.ctx.currentTime);
    this.presenceFilter.Q.setValueAtTime(1.1, this.ctx.currentTime);

    // Graph
    this.ampInput.connect(this.tightFilter);
    this.tightFilter.connect(this.preGain);
    this.preGain.connect(this.tubeStage1);
    this.tubeStage1.connect(this.tubeStage2);
    this.tubeStage2.connect(this.tubeStage3);

    // Split to Rectifier Stage
    this.tubeStage3.connect(this.rectifierBypassGain);
    this.tubeStage3.connect(this.sagCompressor);
    this.sagCompressor.connect(this.rectifierWetGain);

    this.rectifierBypassGain.connect(this.bassFilter);
    this.rectifierWetGain.connect(this.bassFilter);

    this.bassFilter.connect(this.midFilter);
    this.midFilter.connect(this.trebleFilter);
    this.trebleFilter.connect(this.presenceFilter);
    this.presenceFilter.connect(this.powerTube);
    this.powerTube.connect(this.masterGain);
    this.masterGain.connect(this.ampOutput);
  }

  applyParams() {
    const t = this.ctx.currentTime;
    const g = 1.0 + (this.params.gain / 100) * 20.0;
    this.preGain.gain.setTargetAtTime(g, t, 0.02);

    this.tubeStage1.curve = makeTubeCurve('12ax7', 1.5 + (this.params.gain / 100) * 3.5);
    this.tubeStage2.curve = makeTubeCurve('12ax7', 2.0 + (this.params.gain / 100) * 4.0);
    this.tubeStage3.curve = makeTubeCurve('12ax7', 2.2 + (this.params.gain / 100) * 4.2);

    // Rectifier switch (Silicon = tight attack, Tube = dynamic sag compression)
    if (this.params.rectifier === 'tube') {
      this.rectifierBypassGain.gain.setTargetAtTime(0.0, t, 0.02);
      this.rectifierWetGain.gain.setTargetAtTime(1.3, t, 0.02);
    } else {
      this.rectifierBypassGain.gain.setTargetAtTime(1.0, t, 0.02);
      this.rectifierWetGain.gain.setTargetAtTime(0.0, t, 0.02);
    }

    // Mesa trademark sub-bass thump & scooped mid
    const bassDb = -6.0 + (this.params.bass / 100) * 18.0;
    this.bassFilter.gain.setTargetAtTime(bassDb, t, 0.02);

    const midDb = -12.0 + (this.params.middle / 100) * 18.0;
    this.midFilter.gain.setTargetAtTime(midDb, t, 0.02);

    const trebDb = -8.0 + (this.params.treble / 100) * 17.0;
    this.trebleFilter.gain.setTargetAtTime(trebDb, t, 0.02);

    const presDb = -6.0 + (this.params.presence / 100) * 16.0;
    this.presenceFilter.gain.setTargetAtTime(presDb, t, 0.02);

    // 6L6 Power Tubes
    this.powerTube.curve = makeTubeCurve('6l6', 1.2 + (this.params.master / 100) * 2.5);

    const mGain = (this.params.master / 100) * 1.35;
    this.masterGain.gain.setTargetAtTime(mGain, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 7. Orange Rockerverb 50 MKIII (British Fuzzy Crunch & Mid Roar)
 * Controls: Gain, Bass, Middle, Treble, Attenuator, Master
 */
class OrangeRockerverbAmp extends BaseAmp {
  constructor(id, engine) {
    super(id, 'orange_rockerverb', 'Orange Rockerverb 50 MKIII', engine);

    this.preMidRoar = this.ctx.createBiquadFilter();
    this.preGain = this.ctx.createGain();

    this.dirtyTube1 = this.ctx.createWaveShaper();
    this.dirtyTube2 = this.ctx.createWaveShaper();

    this.bassFilter = this.ctx.createBiquadFilter();
    this.midFilter = this.ctx.createBiquadFilter();
    this.trebleFilter = this.ctx.createBiquadFilter();

    this.powerStage = this.ctx.createWaveShaper();
    this.attenuatorGain = this.ctx.createGain();
    this.masterGain = this.ctx.createGain();

    this._setupGraph();

    this.params = {
      gain: 70,
      bass: 60,
      middle: 70,
      treble: 55,
      attenuator: 75,
      master: 65
    };
    this.applyParams();
  }

  _setupGraph() {
    this.preMidRoar.type = 'peaking';
    this.preMidRoar.frequency.setValueAtTime(850, this.ctx.currentTime);
    this.preMidRoar.Q.setValueAtTime(1.3, this.ctx.currentTime);
    this.preMidRoar.gain.setValueAtTime(4.0, this.ctx.currentTime);

    this.dirtyTube1.oversample = '4x';
    this.dirtyTube2.oversample = '4x';
    this.powerStage.oversample = '4x';

    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.setValueAtTime(125, this.ctx.currentTime);

    this.midFilter.type = 'peaking';
    this.midFilter.frequency.setValueAtTime(680, this.ctx.currentTime);
    this.midFilter.Q.setValueAtTime(1.4, this.ctx.currentTime);

    this.trebleFilter.type = 'highshelf';
    this.trebleFilter.frequency.setValueAtTime(2600, this.ctx.currentTime);

    this.ampInput.connect(this.preMidRoar);
    this.preMidRoar.connect(this.preGain);
    this.preGain.connect(this.dirtyTube1);
    this.dirtyTube1.connect(this.dirtyTube2);

    this.dirtyTube2.connect(this.bassFilter);
    this.bassFilter.connect(this.midFilter);
    this.midFilter.connect(this.trebleFilter);

    this.trebleFilter.connect(this.powerStage);
    this.powerStage.connect(this.attenuatorGain);
    this.attenuatorGain.connect(this.masterGain);
    this.masterGain.connect(this.ampOutput);
  }

  applyParams() {
    const t = this.ctx.currentTime;
    const g = 1.0 + (this.params.gain / 100) * 18.0;
    this.preGain.gain.setTargetAtTime(g, t, 0.02);

    this.dirtyTube1.curve = makeTubeCurve('orange_tube', 1.4 + (this.params.gain / 100) * 3.5);
    this.dirtyTube2.curve = makeTubeCurve('orange_tube', 1.8 + (this.params.gain / 100) * 4.0);

    const bassDb = -7.0 + (this.params.bass / 100) * 16.0;
    this.bassFilter.gain.setTargetAtTime(bassDb, t, 0.02);

    // Orange prominent mid roar
    const midDb = -4.0 + (this.params.middle / 100) * 16.0;
    this.midFilter.gain.setTargetAtTime(midDb, t, 0.02);

    const trebDb = -9.0 + (this.params.treble / 100) * 15.0;
    this.trebleFilter.gain.setTargetAtTime(trebDb, t, 0.02);

    // Power stage
    this.powerStage.curve = makeTubeCurve('el34', 1.3 + (this.params.master / 100) * 2.4);

    // Attenuator knob (100 = full power, lower values scale down volume cleanly)
    const attGain = 0.2 + (this.params.attenuator / 100) * 0.8;
    this.attenuatorGain.gain.setTargetAtTime(attGain, t, 0.02);

    const mGain = (this.params.master / 100) * 1.3;
    this.masterGain.gain.setTargetAtTime(mGain, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

function createAmpInstance(type, id, engine) {
  switch (type) {
    case 'fender_acoustasonic':
      return new FenderAcoustasonicAmp(id, engine);
    case 'marshall_dsl20':
      return new MarshallDSL20Amp(id, engine);
    case 'fender_twin':
      return new FenderTwinReverbAmp(id, engine);
    case 'marshall_jcm800':
      return new MarshallJCM800Amp(id, engine);
    case 'vox_ac30':
      return new VoxAC30Amp(id, engine);
    case 'mesa_dualrect':
      return new MesaDualRectifierAmp(id, engine);
    case 'orange_rockerverb':
      return new OrangeRockerverbAmp(id, engine);
    default:
      return new FenderAcoustasonicAmp(id, engine);
  }
}

window.createAmpInstance = createAmpInstance;
