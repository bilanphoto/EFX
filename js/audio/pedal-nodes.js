/**
 * Boss Guitar Pedals DSP Implementations (Complete Collection)
 * Real-time Web Audio API signal processing for all iconic Boss pedals
 */

// Helper to create soft/hard clipping waveshaper curves
function makeDistortionCurve(type, amount, n_samples = 4096) {
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;

  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1; // -1 to +1

    if (type === 'asymmetric') {
      // Boss SD-1 asymmetrical diode clipping
      const k = amount * 0.8 + 1;
      if (x >= 0) {
        curve[i] = (2 / 3) * Math.tanh(k * 1.8 * x);
      } else {
        curve[i] = (1 / 2) * Math.tanh(k * 1.2 * x);
      }
    } else if (type === 'hard') {
      // Boss DS-1 hard diode clipping to ground
      const k = amount * 1.5 + 2;
      const val = Math.tanh(k * x * 2.5);
      curve[i] = Math.max(-0.65, Math.min(0.65, val)) * 1.4;
    } else if (type === 'turbo') {
      // Boss DS-2 Turbo mid-boosted saturation
      const k = amount * 2.0 + 3;
      const val = Math.tanh(k * x * 3.0);
      curve[i] = Math.max(-0.60, Math.min(0.60, val)) * 1.5;
    } else if (type === 'fet') {
      // Boss BD-2 multi-stage FET tube-like warmth
      const k = amount * 0.6 + 1.2;
      curve[i] = (1.5 * x) / (1 + Math.abs(x * k * 0.8));
    } else if (type === 'metal_zone') {
      // Boss MT-2 Metal Zone high gain dual saturation clipping
      const k = amount * 2.5 + 4;
      const val = Math.tanh(k * x * 3.2);
      curve[i] = Math.max(-0.55, Math.min(0.55, val)) * 1.6;
    } else if (type === 'jhs_angry') {
      // JHS Angry Charlie high gain roaring drive
      const k = amount * 2.2 + 2.5;
      curve[i] = Math.tanh(k * x * 2.6);
    } else {
      const k = typeof amount === 'number' ? amount : 50;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
  }
  return curve;
}

/**
 * Base Pedal Class
 */
class BasePedal {
  constructor(id, type, name, engine) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.engine = engine;
    this.ctx = engine.ctx;
    this.bypassed = false;

    this.inputNode = this.ctx.createGain();
    this.outputNode = this.ctx.createGain();
    this.effectInputNode = this.ctx.createGain();
    this.effectOutputNode = this.ctx.createGain();
    this.dryNode = this.ctx.createGain();

    this.inputNode.connect(this.effectInputNode);
    this.effectOutputNode.connect(this.outputNode);

    this.inputNode.connect(this.dryNode);
    this.dryNode.connect(this.outputNode);

    this.effectInputNode.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.dryNode.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.params = {};
    this.onParamChanged = null;
  }

  toggleBypass() {
    this.setBypass(!this.bypassed);
    return this.bypassed;
  }

  setBypass(bypassed) {
    this.bypassed = bypassed;
    const t = this.ctx.currentTime;
    if (bypassed) {
      this.effectInputNode.gain.setTargetAtTime(0.0, t, 0.015);
      this.dryNode.gain.setTargetAtTime(1.0, t, 0.015);
    } else {
      this.effectInputNode.gain.setTargetAtTime(1.0, t, 0.015);
      this.dryNode.gain.setTargetAtTime(0.0, t, 0.015);
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

/**
 * 1. Boss SD-1 SUPER Over Drive
 */
class SD1OverdrivePedal extends BasePedal {
  constructor(id, engine) {
    super(id, 'sd1', 'Boss SD-1 SUPER Over Drive', engine);

    this.preMidBoost = this.ctx.createBiquadFilter();
    this.driveGain = this.ctx.createGain();
    this.shaper = this.ctx.createWaveShaper();
    this.toneFilter = this.ctx.createBiquadFilter();
    this.levelGain = this.ctx.createGain();

    this.preMidBoost.type = 'peaking';
    this.preMidBoost.frequency.setValueAtTime(720, this.ctx.currentTime);
    this.preMidBoost.Q.setValueAtTime(1.4, this.ctx.currentTime);
    this.preMidBoost.gain.setValueAtTime(5.0, this.ctx.currentTime);

    this.shaper.oversample = '4x';
    this.toneFilter.type = 'lowpass';

    this.effectInputNode.connect(this.preMidBoost);
    this.preMidBoost.connect(this.driveGain);
    this.driveGain.connect(this.shaper);
    this.shaper.connect(this.toneFilter);
    this.toneFilter.connect(this.levelGain);
    this.levelGain.connect(this.effectOutputNode);

    this.params = { drive: 50, tone: 50, level: 70 };
    this.applyParams();
  }

  applyParams() {
    const t = this.ctx.currentTime;
    const driveAmount = 1 + (this.params.drive / 100) * 34;
    this.driveGain.gain.setTargetAtTime(driveAmount * 0.8, t, 0.02);
    this.shaper.curve = makeDistortionCurve('asymmetric', this.params.drive);

    const cutoff = 1200 + (this.params.tone / 100) * 5500;
    this.toneFilter.frequency.setTargetAtTime(cutoff, t, 0.02);

    const lvl = (this.params.level / 100) * 1.8;
    this.levelGain.gain.setTargetAtTime(lvl, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 2. Boss DS-1 Distortion
 */
class DS1DistortionPedal extends BasePedal {
  constructor(id, engine) {
    super(id, 'ds1', 'Boss DS-1 Distortion', engine);

    this.preHighpass = this.ctx.createBiquadFilter();
    this.distGain = this.ctx.createGain();
    this.shaper = this.ctx.createWaveShaper();
    this.toneFilterLow = this.ctx.createBiquadFilter();
    this.toneFilterHigh = this.ctx.createBiquadFilter();
    this.toneMixGainLow = this.ctx.createGain();
    this.toneMixGainHigh = this.ctx.createGain();
    this.midScoop = this.ctx.createBiquadFilter();
    this.levelGain = this.ctx.createGain();

    this.preHighpass.type = 'highpass';
    this.preHighpass.frequency.setValueAtTime(650, this.ctx.currentTime);
    this.shaper.oversample = '4x';

    this.toneFilterLow.type = 'lowpass';
    this.toneFilterLow.frequency.setValueAtTime(1500, this.ctx.currentTime);
    this.toneFilterHigh.type = 'highpass';
    this.toneFilterHigh.frequency.setValueAtTime(800, this.ctx.currentTime);

    this.midScoop.type = 'peaking';
    this.midScoop.frequency.setValueAtTime(520, this.ctx.currentTime);
    this.midScoop.Q.setValueAtTime(1.8, this.ctx.currentTime);
    this.midScoop.gain.setValueAtTime(-5.0, this.ctx.currentTime);

    this.effectInputNode.connect(this.preHighpass);
    this.preHighpass.connect(this.distGain);
    this.distGain.connect(this.shaper);
    this.shaper.connect(this.toneFilterLow);
    this.shaper.connect(this.toneFilterHigh);
    this.toneFilterLow.connect(this.toneMixGainLow);
    this.toneFilterHigh.connect(this.toneMixGainHigh);
    this.toneMixGainLow.connect(this.midScoop);
    this.toneMixGainHigh.connect(this.midScoop);
    this.midScoop.connect(this.levelGain);
    this.levelGain.connect(this.effectOutputNode);

    this.params = { dist: 65, tone: 45, level: 65 };
    this.applyParams();
  }

  applyParams() {
    const t = this.ctx.currentTime;
    const distMult = 1 + (this.params.dist / 100) * 55;
    this.distGain.gain.setTargetAtTime(distMult, t, 0.02);
    this.shaper.curve = makeDistortionCurve('hard', this.params.dist);

    const toneNormalized = this.params.tone / 100;
    this.toneMixGainLow.gain.setTargetAtTime(1 - toneNormalized * 0.9, t, 0.02);
    this.toneMixGainHigh.gain.setTargetAtTime(toneNormalized * 1.1, t, 0.02);

    const lvl = (this.params.level / 100) * 1.6;
    this.levelGain.gain.setTargetAtTime(lvl, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 3. Boss OS-2 OverDrive / Distortion
 * Features the COLOR knob to blend smoothly between Overdrive and Distortion
 */
class OS2OverdriveDistortionPedal extends BasePedal {
  constructor(id, engine) {
    super(id, 'os2', 'Boss OS-2 OverDrive/Distortion', engine);

    this.preFilter = this.ctx.createBiquadFilter();
    this.driveGain = this.ctx.createGain();
    this.shaperOD = this.ctx.createWaveShaper();
    this.shaperDist = this.ctx.createWaveShaper();
    this.gainOD = this.ctx.createGain();
    this.gainDist = this.ctx.createGain();
    this.toneFilter = this.ctx.createBiquadFilter();
    this.levelGain = this.ctx.createGain();

    this.preFilter.type = 'highpass';
    this.preFilter.frequency.setValueAtTime(400, this.ctx.currentTime);

    this.shaperOD.oversample = '4x';
    this.shaperDist.oversample = '4x';

    this.toneFilter.type = 'lowpass';

    // Route: input -> preFilter -> driveGain -> split to OD & Dist -> blended by COLOR -> tone -> level -> output
    this.effectInputNode.connect(this.preFilter);
    this.preFilter.connect(this.driveGain);

    this.driveGain.connect(this.shaperOD);
    this.driveGain.connect(this.shaperDist);

    this.shaperOD.connect(this.gainOD);
    this.shaperDist.connect(this.gainDist);

    this.gainOD.connect(this.toneFilter);
    this.gainDist.connect(this.toneFilter);

    this.toneFilter.connect(this.levelGain);
    this.levelGain.connect(this.effectOutputNode);

    this.params = { level: 65, tone: 50, drive: 55, color: 50 };
    this.applyParams();
  }

  applyParams() {
    const t = this.ctx.currentTime;
    const drv = 1 + (this.params.drive / 100) * 45;
    this.driveGain.gain.setTargetAtTime(drv, t, 0.02);

    this.shaperOD.curve = makeDistortionCurve('asymmetric', this.params.drive);
    this.shaperDist.curve = makeDistortionCurve('hard', this.params.drive);

    // Color knob blends between OD (0%) and Dist (100%)
    const colRatio = this.params.color / 100;
    this.gainOD.gain.setTargetAtTime((1 - colRatio) * 1.1, t, 0.02);
    this.gainDist.gain.setTargetAtTime(colRatio * 1.1, t, 0.02);

    const cutoff = 1000 + (this.params.tone / 100) * 6000;
    this.toneFilter.frequency.setTargetAtTime(cutoff, t, 0.02);

    const lvl = (this.params.level / 100) * 1.6;
    this.levelGain.gain.setTargetAtTime(lvl, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 4. Boss DS-2 TURBO Distortion
 * Features Mode I (classic DS-1) and Mode II (Turbo heavy midrange lead)
 */
class DS2TurboDistortionPedal extends BasePedal {
  constructor(id, engine) {
    super(id, 'ds2', 'Boss DS-2 TURBO Distortion', engine);

    this.preFilter = this.ctx.createBiquadFilter();
    this.turboMidBoost = this.ctx.createBiquadFilter();
    this.distGain = this.ctx.createGain();
    this.shaper = this.ctx.createWaveShaper();
    this.toneFilter = this.ctx.createBiquadFilter();
    this.levelGain = this.ctx.createGain();

    this.preFilter.type = 'highpass';
    this.preFilter.frequency.setValueAtTime(500, this.ctx.currentTime);

    this.turboMidBoost.type = 'peaking';
    this.turboMidBoost.frequency.setValueAtTime(1100, this.ctx.currentTime);
    this.turboMidBoost.Q.setValueAtTime(1.5, this.ctx.currentTime);

    this.shaper.oversample = '4x';
    this.toneFilter.type = 'lowpass';

    this.effectInputNode.connect(this.preFilter);
    this.preFilter.connect(this.turboMidBoost);
    this.turboMidBoost.connect(this.distGain);
    this.distGain.connect(this.shaper);
    this.shaper.connect(this.toneFilter);
    this.toneFilter.connect(this.levelGain);
    this.levelGain.connect(this.effectOutputNode);

    this.params = { level: 65, tone: 50, dist: 70, turbo: 'turbo_ii' };
    this.applyParams();
  }

  applyParams() {
    const t = this.ctx.currentTime;
    const isTurboII = this.params.turbo === 'turbo_ii' || this.params.turbo === 1 || this.params.turbo === true;

    this.turboMidBoost.gain.setTargetAtTime(isTurboII ? 8.0 : 0.0, t, 0.02);
    const gainMult = 1 + (this.params.dist / 100) * (isTurboII ? 60 : 45);
    this.distGain.gain.setTargetAtTime(gainMult, t, 0.02);

    this.shaper.curve = makeDistortionCurve(isTurboII ? 'turbo' : 'hard', this.params.dist);

    const cutoff = 1100 + (this.params.tone / 100) * 5800;
    this.toneFilter.frequency.setTargetAtTime(cutoff, t, 0.02);

    const lvl = (this.params.level / 100) * 1.6;
    this.levelGain.gain.setTargetAtTime(lvl, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 5. Boss BD-2 Blues Driver
 */
class BD2BluesDriverPedal extends BasePedal {
  constructor(id, engine) {
    super(id, 'bd2', 'Boss BD-2 Blues Driver', engine);

    this.preBoost = this.ctx.createBiquadFilter();
    this.gainStage1 = this.ctx.createGain();
    this.shaper1 = this.ctx.createWaveShaper();
    this.gainStage2 = this.ctx.createGain();
    this.shaper2 = this.ctx.createWaveShaper();
    this.toneFilter = this.ctx.createBiquadFilter();
    this.levelGain = this.ctx.createGain();

    this.preBoost.type = 'highshelf';
    this.preBoost.frequency.setValueAtTime(2500, this.ctx.currentTime);
    this.preBoost.gain.setValueAtTime(2.5, this.ctx.currentTime);

    this.shaper1.oversample = '4x';
    this.shaper2.oversample = '4x';

    this.toneFilter.type = 'peaking';
    this.toneFilter.frequency.setValueAtTime(2800, this.ctx.currentTime);
    this.toneFilter.Q.setValueAtTime(0.9, this.ctx.currentTime);

    this.effectInputNode.connect(this.preBoost);
    this.preBoost.connect(this.gainStage1);
    this.gainStage1.connect(this.shaper1);
    this.shaper1.connect(this.gainStage2);
    this.gainStage2.connect(this.shaper2);
    this.shaper2.connect(this.toneFilter);
    this.toneFilter.connect(this.levelGain);
    this.levelGain.connect(this.effectOutputNode);

    this.params = { level: 65, tone: 50, gain: 45 };
    this.applyParams();
  }

  applyParams() {
    const t = this.ctx.currentTime;
    const g = 1 + (this.params.gain / 100) * 25;
    this.gainStage1.gain.setTargetAtTime(Math.sqrt(g), t, 0.02);
    this.gainStage2.gain.setTargetAtTime(Math.sqrt(g) * 0.9, t, 0.02);

    this.shaper1.curve = makeDistortionCurve('fet', this.params.gain * 0.6);
    this.shaper2.curve = makeDistortionCurve('fet', this.params.gain);

    const toneGain = (this.params.tone - 50) * 0.25;
    this.toneFilter.gain.setTargetAtTime(toneGain, t, 0.02);

    const lvl = (this.params.level / 100) * 1.5;
    this.levelGain.gain.setTargetAtTime(lvl, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 6. Boss CH-1 SUPER Chorus
 * Features: E.LEVEL, EQ, RATE, DEPTH
 */
class CH1SuperChorusPedal extends BasePedal {
  constructor(id, engine) {
    super(id, 'ch1', 'Boss CH-1 SUPER Chorus', engine);

    this.delayNode = this.ctx.createDelay(0.04);
    this.lfo = this.ctx.createOscillator();
    this.lfoGain = this.ctx.createGain();
    this.eqFilter = this.ctx.createBiquadFilter();
    this.wetGain = this.ctx.createGain();
    this.dryDirectGain = this.ctx.createGain();

    this.eqFilter.type = 'highshelf';
    this.eqFilter.frequency.setValueAtTime(3000, this.ctx.currentTime);

    this.delayNode.delayTime.setValueAtTime(0.008, this.ctx.currentTime);
    this.lfo.type = 'sine';
    this.lfo.frequency.setValueAtTime(1.5, this.ctx.currentTime);
    this.lfoGain.gain.setValueAtTime(0.003, this.ctx.currentTime);
    this.lfo.connect(this.delayNode.delayTime);
    this.lfo.start();

    this.dryDirectGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

    this.effectInputNode.connect(this.dryDirectGain);
    this.dryDirectGain.connect(this.effectOutputNode);

    this.effectInputNode.connect(this.delayNode);
    this.delayNode.connect(this.eqFilter);
    this.eqFilter.connect(this.wetGain);
    this.wetGain.connect(this.effectOutputNode);

    this.params = { level: 60, eq: 55, rate: 45, depth: 65 };
    this.applyParams();
  }

  applyParams() {
    const t = this.ctx.currentTime;
    const rateHz = 0.2 + (this.params.rate / 100) * 7.0;
    this.lfo.frequency.setTargetAtTime(rateHz, t, 0.02);

    const depthSec = 0.0005 + (this.params.depth / 100) * 0.0045;
    this.lfoGain.gain.setTargetAtTime(depthSec, t, 0.02);

    const eqGain = (this.params.eq - 50) * 0.22;
    this.eqFilter.gain.setTargetAtTime(eqGain, t, 0.02);

    const wetLvl = (this.params.level / 100) * 0.85;
    this.wetGain.gain.setTargetAtTime(wetLvl, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 7. Boss CE-2 Chorus
 */
class CE2ChorusPedal extends BasePedal {
  constructor(id, engine) {
    super(id, 'ce2', 'Boss CE-2 Chorus', engine);

    this.delayNode = this.ctx.createDelay(0.05);
    this.lfo = this.ctx.createOscillator();
    this.lfoGain = this.ctx.createGain();
    this.warmFilter = this.ctx.createBiquadFilter();
    this.wetGain = this.ctx.createGain();
    this.dryDirectGain = this.ctx.createGain();

    this.warmFilter.type = 'lowpass';
    this.warmFilter.frequency.setValueAtTime(4500, this.ctx.currentTime);

    this.delayNode.delayTime.setValueAtTime(0.009, this.ctx.currentTime);
    this.lfo.type = 'sine';
    this.lfo.frequency.setValueAtTime(1.2, this.ctx.currentTime);
    this.lfoGain.gain.setValueAtTime(0.0035, this.ctx.currentTime);
    this.lfo.connect(this.delayNode.delayTime);
    this.lfo.start();

    this.dryDirectGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.wetGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

    this.effectInputNode.connect(this.dryDirectGain);
    this.dryDirectGain.connect(this.effectOutputNode);

    this.effectInputNode.connect(this.delayNode);
    this.delayNode.connect(this.warmFilter);
    this.warmFilter.connect(this.wetGain);
    this.wetGain.connect(this.effectOutputNode);

    this.params = { rate: 45, depth: 65 };
    this.applyParams();
  }

  applyParams() {
    const t = this.ctx.currentTime;
    const freq = 0.3 + (this.params.rate / 100) * 6.2;
    this.lfo.frequency.setTargetAtTime(freq, t, 0.02);

    const depthSec = 0.0005 + (this.params.depth / 100) * 0.0050;
    this.lfoGain.gain.setTargetAtTime(depthSec, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 8. Boss TR-2 Tremolo
 * Features: RATE, WAVE, DEPTH
 */
class TR2TremoloPedal extends BasePedal {
  constructor(id, engine) {
    super(id, 'tr2', 'Boss TR-2 Tremolo', engine);

    this.tremGain = this.ctx.createGain();
    this.lfo = this.ctx.createOscillator();
    this.lfoGain = this.ctx.createGain();

    // Constant offset to keep modulation in positive gain domain
    this.lfo.type = 'sine';
    this.lfo.frequency.setValueAtTime(4.0, this.ctx.currentTime);

    this.lfoGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    this.tremGain.gain.setValueAtTime(0.6, this.ctx.currentTime);

    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.tremGain.gain);
    this.lfo.start();

    this.effectInputNode.connect(this.tremGain);
    this.tremGain.connect(this.effectOutputNode);

    this.params = { rate: 50, wave: 30, depth: 70 };
    this.applyParams();
  }

  applyParams() {
    const t = this.ctx.currentTime;
    // Rate: 1Hz to 14Hz
    const rateHz = 1.0 + (this.params.rate / 100) * 13.0;
    this.lfo.frequency.setTargetAtTime(rateHz, t, 0.02);

    // Wave: blend between sine/triangle and square wave
    if (this.params.wave > 65) {
      this.lfo.type = 'square';
    } else if (this.params.wave > 35) {
      this.lfo.type = 'triangle';
    } else {
      this.lfo.type = 'sine';
    }

    const depthRatio = (this.params.depth / 100) * 0.48;
    this.lfoGain.gain.setTargetAtTime(depthRatio, t, 0.02);
    this.tremGain.gain.setTargetAtTime(1.0 - depthRatio, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 9. Boss DD-3 Digital Delay
 */
class DD3DelayPedal extends BasePedal {
  constructor(id, engine) {
    super(id, 'dd3', 'Boss DD-3 Digital Delay', engine);

    this.delayNode = this.ctx.createDelay(1.5);
    this.feedbackGain = this.ctx.createGain();
    this.highCutFilter = this.ctx.createBiquadFilter();
    this.eLevelGain = this.ctx.createGain();
    this.dryDirect = this.ctx.createGain();

    this.dryDirect.gain.setValueAtTime(1.0, this.ctx.currentTime);

    this.highCutFilter.type = 'lowpass';
    this.highCutFilter.frequency.setValueAtTime(6000, this.ctx.currentTime);

    this.effectInputNode.connect(this.dryDirect);
    this.dryDirect.connect(this.effectOutputNode);

    this.effectInputNode.connect(this.delayNode);
    this.delayNode.connect(this.highCutFilter);
    this.highCutFilter.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode);

    this.highCutFilter.connect(this.eLevelGain);
    this.eLevelGain.connect(this.effectOutputNode);

    this.params = { level: 50, feedback: 40, time: 45, mode: '800ms' };
    this.applyParams();
  }

  applyParams() {
    const t = this.ctx.currentTime;
    let maxRange = 0.8;
    if (this.params.mode === '200ms') maxRange = 0.2;
    if (this.params.mode === '50ms') maxRange = 0.05;

    const delaySec = 0.04 + (this.params.time / 100) * (maxRange - 0.04);
    this.delayNode.delayTime.setTargetAtTime(delaySec, t, 0.02);

    const fb = (this.params.feedback / 100) * 0.86;
    this.feedbackGain.gain.setTargetAtTime(fb, t, 0.02);

    const lvl = (this.params.level / 100);
    this.eLevelGain.gain.setTargetAtTime(lvl, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 10. Boss RV-5 / RV-6 Digital Reverb
 */
class RV5ReverbPedal extends BasePedal {
  constructor(id, engine) {
    super(id, 'rv5', 'Boss RV-5 Digital Reverb', engine);

    this.convolver = this.ctx.createConvolver();
    this.dampFilter = this.ctx.createBiquadFilter();
    this.wetGain = this.ctx.createGain();
    this.dryDirect = this.ctx.createGain();

    this.dryDirect.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.dampFilter.type = 'lowpass';

    this.effectInputNode.connect(this.dryDirect);
    this.dryDirect.connect(this.effectOutputNode);

    this.effectInputNode.connect(this.convolver);
    this.convolver.connect(this.dampFilter);
    this.dampFilter.connect(this.wetGain);
    this.wetGain.connect(this.effectOutputNode);

    this.params = { level: 45, tone: 50, time: 50, mode: 'spring' };
    this.applyParams();
  }

  applyParams() {
    const t = this.ctx.currentTime;
    const cutoff = 1500 + (this.params.tone / 100) * 6500;
    this.dampFilter.frequency.setTargetAtTime(cutoff, t, 0.02);

    const lvl = (this.params.level / 100) * 1.1;
    this.wetGain.gain.setTargetAtTime(lvl, t, 0.02);

    this._generateReverbIR();
  }

  _generateReverbIR() {
    const sampleRate = this.ctx.sampleRate;
    const duration = 0.5 + (this.params.time / 100) * 3.5;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.ctx.createBuffer(2, length, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    const isSpring = this.params.mode === 'spring';
    const isPlate = this.params.mode === 'plate';

    for (let i = 0; i < length; i++) {
      const progress = i / length;
      const decay = Math.exp(-progress * (isPlate ? 7 : 5));
      let nL = (Math.random() * 2 - 1) * decay;
      let nR = (Math.random() * 2 - 1) * decay;

      if (isSpring) {
        const springChirp = Math.sin(progress * 180 + Math.sin(progress * 60) * 20);
        nL = (nL * 0.7 + springChirp * 0.3 * Math.exp(-progress * 6));
        nR = (nR * 0.7 - springChirp * 0.3 * Math.exp(-progress * 6));
      }

      left[i] = nL;
      right[i] = nR;
    }

    this.convolver.buffer = buffer;
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 11. Boss CS-3 Compression Sustainer
 */
class CS3CompressorPedal extends BasePedal {
  constructor(id, engine) {
    super(id, 'cs3', 'Boss CS-3 Compression Sustainer', engine);

    this.compressor = this.ctx.createDynamicsCompressor();
    this.toneFilter = this.ctx.createBiquadFilter();
    this.levelGain = this.ctx.createGain();

    this.toneFilter.type = 'peaking';
    this.toneFilter.frequency.setValueAtTime(2500, this.ctx.currentTime);

    this.effectInputNode.connect(this.compressor);
    this.compressor.connect(this.toneFilter);
    this.toneFilter.connect(this.levelGain);
    this.levelGain.connect(this.effectOutputNode);

    this.params = { level: 70, tone: 50, attack: 40, sustain: 60 };
    this.applyParams();
  }

  applyParams() {
    const t = this.ctx.currentTime;
    const threshold = -12 - (this.params.sustain / 100) * 35;
    const ratio = 3 + (this.params.sustain / 100) * 12;
    this.compressor.threshold.setTargetAtTime(threshold, t, 0.02);
    this.compressor.ratio.setTargetAtTime(ratio, t, 0.02);

    const attackSec = 0.001 + (this.params.attack / 100) * 0.059;
    this.compressor.attack.setTargetAtTime(attackSec, t, 0.02);

    const toneGain = (this.params.tone - 50) * 0.18;
    this.toneFilter.gain.setTargetAtTime(toneGain, t, 0.02);

    const lvl = (this.params.level / 100) * 2.0;
    this.levelGain.gain.setTargetAtTime(lvl, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 12. Boss GE-7 Equalizer
 */
class GE7EqualizerPedal extends BasePedal {
  constructor(id, engine) {
    super(id, 'ge7', 'Boss GE-7 Equalizer', engine);

    this.bands = [100, 200, 400, 800, 1600, 3200, 6400];
    this.filters = [];
    this.levelGain = this.ctx.createGain();

    let prevNode = this.effectInputNode;
    this.bands.forEach(freq => {
      const f = this.ctx.createBiquadFilter();
      f.type = 'peaking';
      f.frequency.setValueAtTime(freq, this.ctx.currentTime);
      f.Q.setValueAtTime(1.8, this.ctx.currentTime);
      f.gain.setValueAtTime(0, this.ctx.currentTime);
      prevNode.connect(f);
      prevNode = f;
      this.filters.push(f);
    });

    prevNode.connect(this.levelGain);
    this.levelGain.connect(this.effectOutputNode);

    this.params = {
      b100: 0, b200: 0, b400: 0, b800: 0, b1600: 0, b3200: 0, b6400: 0, level: 0
    };
  }

  applyParams() {
    const t = this.ctx.currentTime;
    const keys = ['b100', 'b200', 'b400', 'b800', 'b1600', 'b3200', 'b6400'];
    keys.forEach((k, idx) => {
      const val = this.params[k] || 0;
      this.filters[idx].gain.setTargetAtTime(val, t, 0.02);
    });
    const lvlDb = this.params.level || 0;
    const linLvl = Math.pow(10, lvlDb / 20);
    this.levelGain.gain.setTargetAtTime(linLvl, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 13. Boss NS-2 Noise Suppressor
 */
class NS2NoiseGatePedal extends BasePedal {
  constructor(id, engine) {
    super(id, 'ns2', 'Boss NS-2 Noise Suppressor', engine);

    this.gateGain = this.ctx.createGain();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.data = new Float32Array(512);

    this.effectInputNode.connect(this.analyser);
    this.effectInputNode.connect(this.gateGain);
    this.gateGain.connect(this.effectOutputNode);

    this.params = { threshold: 45, decay: 40, mode: 'reduction' };
    this.reduction = 0;

    this._runGateLoop();
  }

  _runGateLoop() {
    if (this.analyser && !this.bypassed) {
      this.analyser.getFloatTimeDomainData(this.data);
      let sum = 0;
      for (let i = 0; i < this.data.length; i++) {
        sum += this.data[i] * this.data[i];
      }
      const rms = Math.sqrt(sum / this.data.length);
      const thresh = (this.params.threshold / 100) * 0.06;

      const t = this.ctx.currentTime;
      if (rms < thresh) {
        this.gateGain.gain.setTargetAtTime(0.001, t, 0.03 + (this.params.decay / 100) * 0.1);
        this.reduction = 1;
      } else {
        this.gateGain.gain.setTargetAtTime(1.0, t, 0.005);
        this.reduction = 0;
      }
    } else {
      this.gateGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.reduction = 0;
    }

    requestAnimationFrame(() => this._runGateLoop());
  }

  updateParam(name, val) {
    super.updateParam(name, val);
  }
}

/**
 * 14. Boss TU-2 Chromatic Tuner (Stompbox Tuner)
 * When engaged, mutes guitar output and displays tuning on the pedal's display!
 */
class TU2TunerPedal extends BasePedal {
  constructor(id, engine) {
    super(id, 'tu2', 'Boss TU-2 Chromatic Tuner', engine);

    this.muteGain = this.ctx.createGain();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.data = new Float32Array(2048);

    this.effectInputNode.connect(this.analyser);
    this.effectInputNode.connect(this.muteGain);
    this.muteGain.connect(this.effectOutputNode);

    this.params = { mode: 'chromatic' };
    this.detectedNote = '--';
    this.cents = 0;

    this._runTunerLoop();
  }

  setBypass(bypassed) {
    super.setBypass(bypassed);
    const t = this.ctx.currentTime;
    // When Tuner is ACTIVE (!bypassed), mute output
    if (!bypassed) {
      this.muteGain.gain.setTargetAtTime(0.0, t, 0.02);
    } else {
      this.muteGain.gain.setTargetAtTime(1.0, t, 0.02);
    }
  }

  _runTunerLoop() {
    if (this.analyser) {
      this.analyser.getFloatTimeDomainData(this.data);
      // Simple autocorrelation
      const freq = this._correlate(this.data, this.ctx.sampleRate);
      if (freq > 50 && freq < 1000) {
        const n = 12 * (Math.log(freq / 440) / Math.log(2));
        const midi = Math.round(n) + 69;
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        this.detectedNote = noteNames[midi % 12];
        const std = 440 * Math.pow(2, (midi - 69) / 12);
        this.cents = Math.floor(1200 * Math.log2(freq / std));
      }
    }
    requestAnimationFrame(() => this._runTunerLoop());
  }

  _correlate(buf, sampleRate) {
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    if (Math.sqrt(sum / buf.length) < 0.015) return -1;
    let r1 = 0, r2 = buf.length - 1;
    for (let i = 0; i < buf.length / 2; i++) {
      if (Math.abs(buf[i]) < 0.2) { r1 = i; break; }
    }
    for (let i = 1; i < buf.length / 2; i++) {
      if (Math.abs(buf[buf.length - i]) < 0.2) { r2 = buf.length - i; break; }
    }
    const tr = buf.slice(r1, r2);
    const c = new Array(tr.length).fill(0);
    for (let i = 0; i < tr.length; i++) {
      for (let j = 0; j < tr.length - i; j++) c[i] += tr[j] * tr[j + i];
    }
    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < tr.length; i++) {
      if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
    }
    return sampleRate / maxpos;
  }
}

/**
 * 15. Boss BF-2 Flanger
 */
class BF2FlangerPedal extends BasePedal {
  constructor(id, engine) {
    super(id, 'bf2', 'Boss BF-2 Flanger', engine);

    this.delayNode = this.ctx.createDelay(0.02);
    this.lfo = this.ctx.createOscillator();
    this.lfoGain = this.ctx.createGain();
    this.feedbackGain = this.ctx.createGain();
    this.dryDirect = this.ctx.createGain();
    this.wetGain = this.ctx.createGain();

    this.delayNode.delayTime.setValueAtTime(0.003, this.ctx.currentTime);
    this.lfo.type = 'triangle';
    this.lfo.start();
    this.lfo.connect(this.delayNode.delayTime);

    this.dryDirect.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.wetGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

    this.effectInputNode.connect(this.dryDirect);
    this.dryDirect.connect(this.effectOutputNode);

    this.effectInputNode.connect(this.delayNode);
    this.delayNode.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode);
    this.delayNode.connect(this.wetGain);
    this.wetGain.connect(this.effectOutputNode);

    this.params = { manual: 50, depth: 65, rate: 35, res: 55 };
    this.applyParams();
  }

  applyParams() {
    const t = this.ctx.currentTime;
    const baseDelay = 0.001 + (this.params.manual / 100) * 0.007;
    this.delayNode.delayTime.setTargetAtTime(baseDelay, t, 0.02);

    const rateHz = 0.1 + (this.params.rate / 100) * 4.9;
    this.lfo.frequency.setTargetAtTime(rateHz, t, 0.02);

    const depthSec = (this.params.depth / 100) * 0.003;
    this.lfoGain.gain.setTargetAtTime(depthSec, t, 0.02);

    const fb = (this.params.res / 100) * 0.85;
    this.feedbackGain.gain.setTargetAtTime(fb, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 16. Boss MT-2 Metal Zone (Image Row 3, Col 4)
 * High Gain Dual Saturation with 3-Band Parametric Mid EQ
 */
class MT2MetalZonePedal extends BasePedal {
  constructor(id, engine) {
    super(id, 'mt2', 'Boss MT-2 Metal Zone', engine);
    this.preMidBoost = this.ctx.createBiquadFilter();
    this.preMidBoost.type = 'peaking';
    this.preMidBoost.frequency.setValueAtTime(1100, this.ctx.currentTime);
    this.preMidBoost.gain.setValueAtTime(5.0, this.ctx.currentTime);

    this.distGain = this.ctx.createGain();
    this.shaper = this.ctx.createWaveShaper();
    this.shaper.oversample = '4x';

    this.lowFilter = this.ctx.createBiquadFilter();
    this.lowFilter.type = 'lowshelf';
    this.lowFilter.frequency.setValueAtTime(100, this.ctx.currentTime);

    this.highFilter = this.ctx.createBiquadFilter();
    this.highFilter.type = 'highshelf';
    this.highFilter.frequency.setValueAtTime(5000, this.ctx.currentTime);

    this.midFilter = this.ctx.createBiquadFilter();
    this.midFilter.type = 'peaking';
    this.midFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    this.levelGain = this.ctx.createGain();

    this.effectInputNode.connect(this.preMidBoost);
    this.preMidBoost.connect(this.distGain);
    this.distGain.connect(this.shaper);
    this.shaper.connect(this.lowFilter);
    this.lowFilter.connect(this.highFilter);
    this.highFilter.connect(this.midFilter);
    this.midFilter.connect(this.levelGain);
    this.levelGain.connect(this.effectOutputNode);

    this.params = { level: 65, dist: 75, high: 50, low: 60, middle: 40, mid_freq: 50 };
    this.applyParams();
  }

  applyParams() {
    const t = this.ctx.currentTime;
    const g = 1.0 + (this.params.dist / 100) * 35.0;
    this.distGain.gain.setTargetAtTime(g, t, 0.02);
    this.shaper.curve = makeDistortionCurve('metal_zone', this.params.dist);

    const lDb = -15 + (this.params.low / 100) * 30;
    this.lowFilter.gain.setTargetAtTime(lDb, t, 0.02);

    const hDb = -15 + (this.params.high / 100) * 30;
    this.highFilter.gain.setTargetAtTime(hDb, t, 0.02);

    const freq = 200 * Math.pow(5000 / 200, this.params.mid_freq / 100);
    this.midFilter.frequency.setTargetAtTime(freq, t, 0.02);
    const mDb = -15 + (this.params.middle / 100) * 30;
    this.midFilter.gain.setTargetAtTime(mDb, t, 0.02);

    const lvl = (this.params.level / 100) * 1.5;
    this.levelGain.gain.setTargetAtTime(lvl, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 17. Boss FRV-1 '63 Fender Reverb (Image Row 1, Col 1)
 * Classic Tube Spring Reverb Tank Emulation
 */
class FRV1FenderReverbPedal extends BasePedal {
  constructor(id, engine) {
    super(id, 'frv1', "Boss FRV-1 '63 Fender Reverb", engine);
    this.dwellGain = this.ctx.createGain();
    this.toneFilter = this.ctx.createBiquadFilter();
    this.toneFilter.type = 'lowpass';

    this.springDelay1 = this.ctx.createDelay(0.1);
    this.springDelay2 = this.ctx.createDelay(0.1);
    this.springFeedback = this.ctx.createGain();

    this.wetGain = this.ctx.createGain();
    this.dryGain = this.ctx.createGain();

    this.effectInputNode.connect(this.dryGain);
    this.dryGain.connect(this.effectOutputNode);

    this.effectInputNode.connect(this.dwellGain);
    this.dwellGain.connect(this.toneFilter);
    this.toneFilter.connect(this.springDelay1);
    this.springDelay1.connect(this.springDelay2);
    this.springDelay2.connect(this.springFeedback);
    this.springFeedback.connect(this.springDelay1);
    this.springDelay2.connect(this.wetGain);
    this.wetGain.connect(this.effectOutputNode);

    this.springDelay1.delayTime.setValueAtTime(0.029, this.ctx.currentTime);
    this.springDelay2.delayTime.setValueAtTime(0.043, this.ctx.currentTime);

    this.params = { mixer: 50, tone: 55, dwell: 60 };
    this.applyParams();
  }

  applyParams() {
    const t = this.ctx.currentTime;
    const dw = 0.5 + (this.params.dwell / 100) * 1.8;
    this.dwellGain.gain.setTargetAtTime(dw, t, 0.02);
    const fb = 0.35 + (this.params.dwell / 100) * 0.52;
    this.springFeedback.gain.setTargetAtTime(fb, t, 0.02);

    const cutoff = 1200 + (this.params.tone / 100) * 5500;
    this.toneFilter.frequency.setTargetAtTime(cutoff, t, 0.02);

    const mix = this.params.mixer / 100;
    this.wetGain.gain.setTargetAtTime(mix * 1.2, t, 0.02);
    this.dryGain.gain.setTargetAtTime(1.0 - mix * 0.4, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 18. Boss DM-2w Delay Waza Craft (Image Row 1, Col 2)
 * Authentic Vintage Analog BBD Delay with Warm Rolloff
 */
class DM2wDelayPedal extends BasePedal {
  constructor(id, engine) {
    super(id, 'dm2w', 'Boss DM-2w Delay Waza Craft', engine);
    this.delayNode = this.ctx.createDelay(1.0);
    this.feedbackGain = this.ctx.createGain();
    this.bbdFilter = this.ctx.createBiquadFilter();
    this.bbdFilter.type = 'lowpass';
    this.bbdFilter.frequency.setValueAtTime(2600, this.ctx.currentTime);

    this.wetGain = this.ctx.createGain();
    this.dryGain = this.ctx.createGain();

    this.effectInputNode.connect(this.dryGain);
    this.dryGain.connect(this.effectOutputNode);

    this.effectInputNode.connect(this.delayNode);
    this.delayNode.connect(this.bbdFilter);
    this.bbdFilter.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode);
    this.bbdFilter.connect(this.wetGain);
    this.wetGain.connect(this.effectOutputNode);

    this.params = { rate: 45, intensity: 50, echo: 55, mode: 'custom' };
    this.applyParams();
  }

  applyParams() {
    const t = this.ctx.currentTime;
    const maxTime = this.params.mode === 'custom' ? 0.8 : 0.3;
    const time = 0.02 + (this.params.rate / 100) * (maxTime - 0.02);
    this.delayNode.delayTime.setTargetAtTime(time, t, 0.02);

    const fb = Math.min(0.96, (this.params.intensity / 100) * 1.05);
    this.feedbackGain.gain.setTargetAtTime(fb, t, 0.02);

    const wet = (this.params.echo / 100) * 1.1;
    this.wetGain.gain.setTargetAtTime(wet, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 19. Boss JB-2 Angry Driver (Image Row 1, Col 3)
 * Dual Drive: Boss Blues Driver + JHS Angry Charlie
 */
class JB2AngryDriverPedal extends BasePedal {
  constructor(id, engine) {
    super(id, 'jb2', 'Boss JB-2 Angry Driver', engine);
    this.bossDrive = this.ctx.createGain();
    this.bossShaper = this.ctx.createWaveShaper();
    this.bossTone = this.ctx.createBiquadFilter();

    this.jhsDrive = this.ctx.createGain();
    this.jhsShaper = this.ctx.createWaveShaper();
    this.jhsTone = this.ctx.createBiquadFilter();

    this.bossTone.type = 'lowpass';
    this.jhsTone.type = 'lowpass';
    this.bossShaper.oversample = '4x';
    this.jhsShaper.oversample = '4x';

    this.mixGain = this.ctx.createGain();

    this.effectInputNode.connect(this.bossDrive);
    this.bossDrive.connect(this.bossShaper);
    this.bossShaper.connect(this.bossTone);
    this.bossTone.connect(this.mixGain);

    this.effectInputNode.connect(this.jhsDrive);
    this.jhsDrive.connect(this.jhsShaper);
    this.jhsShaper.connect(this.jhsTone);
    this.jhsTone.connect(this.mixGain);

    this.mixGain.connect(this.effectOutputNode);

    this.params = { level: 60, tone: 55, drive: 65, mode: 'parallel' };
    this.applyParams();
  }

  applyParams() {
    const t = this.ctx.currentTime;
    const g = 1.0 + (this.params.drive / 100) * 18.0;
    this.bossDrive.gain.setTargetAtTime(g, t, 0.02);
    this.jhsDrive.gain.setTargetAtTime(g * 1.35, t, 0.02);

    this.bossShaper.curve = makeDistortionCurve('fet', this.params.drive);
    this.jhsShaper.curve = makeDistortionCurve('jhs_angry', this.params.drive);

    const cutoff = 1500 + (this.params.tone / 100) * 4500;
    this.bossTone.frequency.setTargetAtTime(cutoff, t, 0.02);
    this.jhsTone.frequency.setTargetAtTime(cutoff, t, 0.02);

    const lvl = (this.params.level / 100) * 1.25;
    this.mixGain.gain.setTargetAtTime(lvl, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 20. Boss CE-2w Chorus Waza Craft (Image Row 1, Col 4)
 */
class CE2wChorusPedal extends CE2ChorusPedal {
  constructor(id, engine) {
    super(id, engine);
    this.name = 'Boss CE-2w Chorus Waza Craft';
    this.type = 'ce2w';
    this.params.mode = 'standard';
  }
}

/**
 * 21. Boss TU-3 Chromatic Tuner (Image Row 1, Col 5)
 */
class TU3TunerPedal extends TU2TunerPedal {
  constructor(id, engine) {
    super(id, engine);
    this.name = 'Boss TU-3 Chromatic Tuner';
    this.type = 'tu3';
  }
}

/**
 * 22. Boss CP-1X Compressor (Image Row 2, Col 1)
 */
class CP1XCompressorPedal extends BasePedal {
  constructor(id, engine) {
    super(id, 'cp1x', 'Boss CP-1X Compressor', engine);
    this.comp = this.ctx.createDynamicsCompressor();
    this.makeup = this.ctx.createGain();

    this.effectInputNode.connect(this.comp);
    this.comp.connect(this.makeup);
    this.makeup.connect(this.effectOutputNode);

    this.params = { level: 60, attack: 45, ratio: 55, comp: 65 };
    this.applyParams();
  }

  applyParams() {
    const t = this.ctx.currentTime;
    const thresh = -42 + (100 - this.params.comp) * 0.35;
    this.comp.threshold.setTargetAtTime(thresh, t, 0.02);

    const rat = 1.5 + (this.params.ratio / 100) * 14.0;
    this.comp.ratio.setTargetAtTime(rat, t, 0.02);

    const att = 0.001 + (this.params.attack / 100) * 0.04;
    this.comp.attack.setTargetAtTime(att, t, 0.02);

    this.makeup.gain.setTargetAtTime((this.params.level / 100) * 1.6, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 23. Boss DD-7 Digital Delay (Image Row 2, Col 2)
 */
class DD7DelayPedal extends BasePedal {
  constructor(id, engine) {
    super(id, 'dd7', 'Boss DD-7 Digital Delay', engine);
    this.delayNode = this.ctx.createDelay(3.5);
    this.feedbackGain = this.ctx.createGain();
    this.dampingFilter = this.ctx.createBiquadFilter();
    this.dampingFilter.type = 'lowpass';
    this.dampingFilter.frequency.setValueAtTime(4500, this.ctx.currentTime);

    this.modLfo = this.ctx.createOscillator();
    this.modLfoGain = this.ctx.createGain();
    this.modLfo.type = 'sine';
    this.modLfo.frequency.setValueAtTime(1.2, this.ctx.currentTime);
    this.modLfoGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.modLfo.connect(this.delayNode.delayTime);
    this.modLfo.start();

    this.wetGain = this.ctx.createGain();
    this.dryGain = this.ctx.createGain();

    this.effectInputNode.connect(this.dryGain);
    this.dryGain.connect(this.effectOutputNode);

    this.effectInputNode.connect(this.delayNode);
    this.delayNode.connect(this.dampingFilter);
    this.dampingFilter.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode);
    this.dampingFilter.connect(this.wetGain);
    this.wetGain.connect(this.effectOutputNode);

    this.params = { level: 50, feedback: 45, time: 50, mode: 'analog' };
    this.applyParams();
  }

  applyParams() {
    const t = this.ctx.currentTime;
    const timeSec = 0.05 + (this.params.time / 100) * 1.2;
    this.delayNode.delayTime.setTargetAtTime(timeSec, t, 0.02);

    const fb = Math.min(0.92, (this.params.feedback / 100) * 0.95);
    this.feedbackGain.gain.setTargetAtTime(fb, t, 0.02);

    if (this.params.mode === 'analog') {
      this.dampingFilter.frequency.setTargetAtTime(2400, t, 0.02);
      this.modLfoGain.gain.setTargetAtTime(0.0002, t, 0.02);
    } else if (this.params.mode === 'modulate') {
      this.dampingFilter.frequency.setTargetAtTime(4500, t, 0.02);
      this.modLfoGain.gain.setTargetAtTime(0.002, t, 0.02);
    } else {
      this.dampingFilter.frequency.setTargetAtTime(8000, t, 0.02);
      this.modLfoGain.gain.setTargetAtTime(0.0, t, 0.02);
    }

    this.wetGain.gain.setTargetAtTime((this.params.level / 100) * 1.2, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 24. Boss SD-2 DUAL OverDrive (Image Row 2, Col 4)
 */
class SD2DualOverdrivePedal extends BasePedal {
  constructor(id, engine) {
    super(id, 'sd2', 'Boss SD-2 DUAL OverDrive', engine);
    this.driveGain = this.ctx.createGain();
    this.shaper = this.ctx.createWaveShaper();
    this.shaper.oversample = '4x';
    this.toneFilter = this.ctx.createBiquadFilter();
    this.toneFilter.type = 'lowpass';
    this.levelGain = this.ctx.createGain();

    this.effectInputNode.connect(this.driveGain);
    this.driveGain.connect(this.shaper);
    this.shaper.connect(this.toneFilter);
    this.toneFilter.connect(this.levelGain);
    this.levelGain.connect(this.effectOutputNode);

    this.params = { level: 60, tone: 50, drive: 65, mode: 'lead' };
    this.applyParams();
  }

  applyParams() {
    const t = this.ctx.currentTime;
    const isLead = this.params.mode === 'lead';
    const g = 1.0 + (this.params.drive / 100) * (isLead ? 22.0 : 9.0);
    this.driveGain.gain.setTargetAtTime(g, t, 0.02);
    this.shaper.curve = makeDistortionCurve(isLead ? 'hard' : 'asymmetric', this.params.drive);

    const cutoff = 1600 + (this.params.tone / 100) * 4500;
    this.toneFilter.frequency.setTargetAtTime(cutoff, t, 0.02);

    this.levelGain.gain.setTargetAtTime((this.params.level / 100) * 1.3, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 25. Boss AW-3 Dynamic Wah (Image Row 2, Col 5)
 */
class AW3DynamicWahPedal extends BasePedal {
  constructor(id, engine) {
    super(id, 'aw3', 'Boss AW-3 Dynamic Wah', engine);
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'bandpass';
    this.filter.Q.setValueAtTime(4.5, this.ctx.currentTime);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.data = new Float32Array(this.analyser.fftSize);

    this.wetGain = this.ctx.createGain();
    this.dryGain = this.ctx.createGain();

    this.effectInputNode.connect(this.dryGain);
    this.dryGain.connect(this.effectOutputNode);

    this.effectInputNode.connect(this.filter);
    this.effectInputNode.connect(this.analyser);
    this.filter.connect(this.wetGain);
    this.wetGain.connect(this.effectOutputNode);

    this.params = { decay: 50, manual: 40, sens: 60, mode: 'up' };
    this._runEnvelopeLoop();
  }

  _runEnvelopeLoop() {
    if (this.bypassed) {
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => this._runEnvelopeLoop());
      return;
    }
    if (this.analyser.getFloatTimeDomainData) {
      this.analyser.getFloatTimeDomainData(this.data);
      let sum = 0;
      for (let i = 0; i < this.data.length; i++) sum += this.data[i] * this.data[i];
      const rms = Math.sqrt(sum / this.data.length);
      const baseFreq = 400 + (this.params.manual / 100) * 1200;
      const sens = (this.params.sens / 100) * 2200;
      const targetFreq = Math.min(3600, baseFreq + rms * sens);
      this.filter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.03);
    }
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => this._runEnvelopeLoop());
    }
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    const t = this.ctx.currentTime;
    const baseFreq = 400 + (this.params.manual / 100) * 1200;
    this.filter.frequency.setTargetAtTime(baseFreq, t, 0.02);
    this.wetGain.gain.setTargetAtTime(1.1, t, 0.02);
    this.dryGain.gain.setTargetAtTime(0.2, t, 0.02);
  }
}

/**
 * 26. Boss PS-6 Harmonist (Image Row 3, Col 2)
 */
class PS6HarmonistPedal extends BasePedal {
  constructor(id, engine) {
    super(id, 'ps6', 'Boss PS-6 Harmonist', engine);
    this.directGain = this.ctx.createGain();
    this.pitchDelay = this.ctx.createDelay(0.1);
    this.pitchLfo = this.ctx.createOscillator();
    this.pitchLfoGain = this.ctx.createGain();
    this.pitchGain = this.ctx.createGain();

    this.pitchLfo.type = 'sawtooth';
    this.pitchLfo.frequency.setValueAtTime(5.0, this.ctx.currentTime);
    this.pitchLfoGain.gain.setValueAtTime(0.003, this.ctx.currentTime);
    this.pitchLfo.connect(this.pitchDelay.delayTime);
    this.pitchLfo.start();

    this.effectInputNode.connect(this.directGain);
    this.directGain.connect(this.effectOutputNode);

    this.effectInputNode.connect(this.pitchDelay);
    this.pitchDelay.connect(this.pitchGain);
    this.pitchGain.connect(this.effectOutputNode);

    this.params = { balance: 50, shift: 50, key: 50, mode: 'harmony' };
    this.applyParams();
  }

  applyParams() {
    const t = this.ctx.currentTime;
    const bal = this.params.balance / 100;
    this.directGain.gain.setTargetAtTime(1.0 - bal * 0.5, t, 0.02);
    this.pitchGain.gain.setTargetAtTime(bal * 1.2, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 27. Boss RC-3 Loop Station (Image Row 3, Col 3)
 */
class RC3LoopStationPedal extends BasePedal {
  constructor(id, engine) {
    super(id, 'rc3', 'Boss RC-3 Loop Station', engine);
    this.loopGain = this.ctx.createGain();
    this.dryThrough = this.ctx.createGain();

    this.effectInputNode.connect(this.dryThrough);
    this.dryThrough.connect(this.effectOutputNode);

    this.effectInputNode.connect(this.loopGain);
    this.loopGain.connect(this.effectOutputNode);

    this.params = { loop: 70, rhythm: 50, memory: 1 };
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    const t = this.ctx.currentTime;
    if (name === 'loop') {
      this.loopGain.gain.setTargetAtTime((val / 100) * 1.2, t, 0.02);
    }
  }
}

/**
 * 28. Boss OD-1X OverDrive (Image Row 4, Col 1)
 */
class OD1XOverdrivePedal extends BasePedal {
  constructor(id, engine) {
    super(id, 'od1x', 'Boss OD-1X OverDrive', engine);
    this.lowCross = this.ctx.createBiquadFilter();
    this.highCross = this.ctx.createBiquadFilter();
    this.lowCross.type = 'lowpass';
    this.lowCross.frequency.setValueAtTime(600, this.ctx.currentTime);
    this.highCross.type = 'highpass';
    this.highCross.frequency.setValueAtTime(600, this.ctx.currentTime);

    this.lowGain = this.ctx.createGain();
    this.highGain = this.ctx.createGain();
    this.lowShaper = this.ctx.createWaveShaper();
    this.highShaper = this.ctx.createWaveShaper();
    this.lowShaper.oversample = '4x';
    this.highShaper.oversample = '4x';

    this.lowEQ = this.ctx.createBiquadFilter();
    this.lowEQ.type = 'lowshelf';
    this.lowEQ.frequency.setValueAtTime(150, this.ctx.currentTime);

    this.highEQ = this.ctx.createBiquadFilter();
    this.highEQ.type = 'highshelf';
    this.highEQ.frequency.setValueAtTime(3200, this.ctx.currentTime);

    this.masterGain = this.ctx.createGain();

    this.effectInputNode.connect(this.lowCross);
    this.lowCross.connect(this.lowGain);
    this.lowGain.connect(this.lowShaper);
    this.lowShaper.connect(this.lowEQ);
    this.lowEQ.connect(this.masterGain);

    this.effectInputNode.connect(this.highCross);
    this.highCross.connect(this.highGain);
    this.highGain.connect(this.highShaper);
    this.highShaper.connect(this.highEQ);
    this.highEQ.connect(this.masterGain);

    this.masterGain.connect(this.effectOutputNode);

    this.params = { level: 60, low: 55, high: 58, drive: 65 };
    this.applyParams();
  }

  applyParams() {
    const t = this.ctx.currentTime;
    const drv = 1.0 + (this.params.drive / 100) * 16.0;
    this.lowGain.gain.setTargetAtTime(drv * 0.9, t, 0.02);
    this.highGain.gain.setTargetAtTime(drv * 1.3, t, 0.02);

    this.lowShaper.curve = makeDistortionCurve('asymmetric', this.params.drive * 0.8);
    this.highShaper.curve = makeDistortionCurve('fet', this.params.drive * 1.1);

    const lDb = -10 + (this.params.low / 100) * 20;
    this.lowEQ.gain.setTargetAtTime(lDb, t, 0.02);

    const hDb = -10 + (this.params.high / 100) * 20;
    this.highEQ.gain.setTargetAtTime(hDb, t, 0.02);

    this.masterGain.gain.setTargetAtTime((this.params.level / 100) * 1.3, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 29. Boss RV-6 Reverb (Image Row 4, Col 2)
 */
class RV6ReverbPedal extends BasePedal {
  constructor(id, engine) {
    super(id, 'rv6', 'Boss RV-6 Reverb', engine);
    this.convolver = this.ctx.createConvolver();
    this.wetGain = this.ctx.createGain();
    this.dryGain = this.ctx.createGain();
    this.toneFilter = this.ctx.createBiquadFilter();
    this.toneFilter.type = 'lowpass';

    this.effectInputNode.connect(this.dryGain);
    this.dryGain.connect(this.effectOutputNode);

    this.effectInputNode.connect(this.convolver);
    this.convolver.connect(this.toneFilter);
    this.toneFilter.connect(this.wetGain);
    this.wetGain.connect(this.effectOutputNode);

    this.params = { level: 55, tone: 50, time: 60, mode: 'shimmer' };
    this._generateImpulse();
    this.applyParams();
  }

  _generateImpulse() {
    const rate = this.ctx.sampleRate;
    const len = Math.floor(rate * 2.8);
    const buf = this.ctx.createBuffer(2, len, rate);
    const l = buf.getChannelData(0);
    const r = buf.getChannelData(1);
    for (let i = 0; i < len; i++) {
      const decay = Math.exp(-i / (rate * 0.8));
      l[i] = (Math.random() * 2 - 1) * decay;
      r[i] = (Math.random() * 2 - 1) * decay;
    }
    this.convolver.buffer = buf;
  }

  applyParams() {
    const t = this.ctx.currentTime;
    const cutoff = 1500 + (this.params.tone / 100) * 6500;
    this.toneFilter.frequency.setTargetAtTime(cutoff, t, 0.02);

    const wet = (this.params.level / 100) * 1.3;
    this.wetGain.gain.setTargetAtTime(wet, t, 0.02);
    this.dryGain.gain.setTargetAtTime(1.0 - (this.params.level / 100) * 0.4, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 30. Boss OC-3 SUPER Octave (Image Row 4, Col 3)
 */
class OC3SuperOctavePedal extends BasePedal {
  constructor(id, engine) {
    super(id, 'oc3', 'Boss OC-3 SUPER Octave', engine);
    this.directGain = this.ctx.createGain();
    this.oct1Gain = this.ctx.createGain();
    this.oct1Filter = this.ctx.createBiquadFilter();
    this.oct1Filter.type = 'lowpass';
    this.oct1Filter.frequency.setValueAtTime(280, this.ctx.currentTime);
    this.oct1Shaper = this.ctx.createWaveShaper();

    const n = 4096;
    const c = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      c[i] = Math.sin(Math.PI * x * 0.5) * 1.2;
    }
    this.oct1Shaper.curve = c;

    this.effectInputNode.connect(this.directGain);
    this.directGain.connect(this.effectOutputNode);

    this.effectInputNode.connect(this.oct1Filter);
    this.oct1Filter.connect(this.oct1Shaper);
    this.oct1Shaper.connect(this.oct1Gain);
    this.oct1Gain.connect(this.effectOutputNode);

    this.params = { direct: 70, oct1: 65, drive: 30, mode: 'poly' };
    this.applyParams();
  }

  applyParams() {
    const t = this.ctx.currentTime;
    this.directGain.gain.setTargetAtTime(this.params.direct / 100, t, 0.02);
    this.oct1Gain.gain.setTargetAtTime((this.params.oct1 / 100) * 1.3, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

/**
 * 31. Boss SD-1w SUPER OverDrive Waza Craft (Image Row 4, Col 4)
 */
class SD1wOverdrivePedal extends SD1OverdrivePedal {
  constructor(id, engine) {
    super(id, engine);
    this.name = 'Boss SD-1w SUPER OverDrive Waza Craft';
    this.type = 'sd1w';
    this.params.mode = 'custom';
  }
}

/**
 * 32. Boss TE-2 Tera Echo (Image Row 4, Col 5)
 */
class TE2TeraEchoPedal extends BasePedal {
  constructor(id, engine) {
    super(id, 'te2', 'Boss TE-2 Tera Echo', engine);
    this.delay1 = this.ctx.createDelay(0.5);
    this.delay2 = this.ctx.createDelay(0.5);
    this.fbGain = this.ctx.createGain();
    this.combFilter = this.ctx.createBiquadFilter();
    this.combFilter.type = 'peaking';
    this.combFilter.frequency.setValueAtTime(1800, this.ctx.currentTime);
    this.combFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);
    this.combFilter.gain.setValueAtTime(6.0, this.ctx.currentTime);

    this.wetGain = this.ctx.createGain();
    this.dryGain = this.ctx.createGain();

    this.delay1.delayTime.setValueAtTime(0.08, this.ctx.currentTime);
    this.delay2.delayTime.setValueAtTime(0.14, this.ctx.currentTime);

    this.effectInputNode.connect(this.dryGain);
    this.dryGain.connect(this.effectOutputNode);

    this.effectInputNode.connect(this.delay1);
    this.delay1.connect(this.delay2);
    this.delay2.connect(this.combFilter);
    this.combFilter.connect(this.fbGain);
    this.fbGain.connect(this.delay1);
    this.combFilter.connect(this.wetGain);
    this.wetGain.connect(this.effectOutputNode);

    this.params = { level: 55, tone: 50, feedback: 60, s_time: 50 };
    this.applyParams();
  }

  applyParams() {
    const t = this.ctx.currentTime;
    const time = 0.05 + (this.params.s_time / 100) * 0.25;
    this.delay1.delayTime.setTargetAtTime(time * 0.6, t, 0.02);
    this.delay2.delayTime.setTargetAtTime(time, t, 0.02);

    const fb = Math.min(0.92, (this.params.feedback / 100) * 0.95);
    this.fbGain.gain.setTargetAtTime(fb, t, 0.02);

    this.wetGain.gain.setTargetAtTime((this.params.level / 100) * 1.3, t, 0.02);
  }

  updateParam(name, val) {
    super.updateParam(name, val);
    this.applyParams();
  }
}

// Factory helper to instantiate pedals by type
function createPedalInstance(type, id, engine) {
  switch (type) {
    // 20 Pedals from uploaded grid (media_1791433382703.jpg):
    case 'frv1': return new FRV1FenderReverbPedal(id, engine);
    case 'dm2w': return new DM2wDelayPedal(id, engine);
    case 'jb2': return new JB2AngryDriverPedal(id, engine);
    case 'ce2w': return new CE2wChorusPedal(id, engine);
    case 'tu3': return new TU3TunerPedal(id, engine);
    case 'cp1x': return new CP1XCompressorPedal(id, engine);
    case 'dd7': return new DD7DelayPedal(id, engine);
    case 'ds1': return new DS1DistortionPedal(id, engine);
    case 'sd2': return new SD2DualOverdrivePedal(id, engine);
    case 'aw3': return new AW3DynamicWahPedal(id, engine);
    case 'ge7': return new GE7EqualizerPedal(id, engine);
    case 'ps6': return new PS6HarmonistPedal(id, engine);
    case 'rc3': return new RC3LoopStationPedal(id, engine);
    case 'mt2': return new MT2MetalZonePedal(id, engine);
    case 'ns2': return new NS2NoiseGatePedal(id, engine);
    case 'od1x': return new OD1XOverdrivePedal(id, engine);
    case 'rv6': return new RV6ReverbPedal(id, engine);
    case 'oc3': return new OC3SuperOctavePedal(id, engine);
    case 'sd1w': return new SD1wOverdrivePedal(id, engine);
    case 'te2': return new TE2TeraEchoPedal(id, engine);

    // Classics from earlier setup:
    case 'sd1': return new SD1OverdrivePedal(id, engine);
    case 'bd2': return new BD2BluesDriverPedal(id, engine);
    case 'os2': return new OS2OverdriveDistortionPedal(id, engine);
    case 'ds2': return new DS2TurboDistortionPedal(id, engine);
    case 'ch1': return new CH1SuperChorusPedal(id, engine);
    case 'ce2': return new CE2ChorusPedal(id, engine);
    case 'tr2': return new TR2TremoloPedal(id, engine);
    case 'dd3': return new DD3DelayPedal(id, engine);
    case 'rv5': return new RV5ReverbPedal(id, engine);
    case 'cs3': return new CS3CompressorPedal(id, engine);
    case 'tu2': return new TU2TunerPedal(id, engine);
    case 'bf2': return new BF2FlangerPedal(id, engine);
    default:
      console.warn('Unknown pedal type:', type);
      return new SD1OverdrivePedal(id, engine);
  }
}

window.createPedalInstance = createPedalInstance;

