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
    default:
      return new FenderAcoustasonicAmp(id, engine);
  }
}

window.createAmpInstance = createAmpInstance;
