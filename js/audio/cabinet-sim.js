/**
 * Guitar Cabinet Simulator & Impulse Response Generator
 * Emulates the acoustic frequency response of guitar speaker cabinets
 * (Fender 2x12 Jensen, Marshall 1960 4x12 Celestion, Vox 2x12 Alnico)
 */
class CabinetSim {
  constructor(engine) {
    this.engine = engine;
    this.ctx = engine.ctx;
    this.name = 'Fender 2x12 Jensen';
    this.cabinetType = 'fender_2x12';
    this.micPosition = 'axis'; // 'axis' (brighter) or 'edge' (warmer)
    this.bypassed = false;
    this.onParamChanged = null;

    // Audio nodes
    this.inputNode = this.ctx.createGain();
    this.outputNode = this.ctx.createGain();
    this.convolver = this.ctx.createConvolver();
    this.convolverGain = this.ctx.createGain();
    this.dryGain = this.ctx.createGain();

    // Additional tone tailoring filters
    this.lowResFilter = this.ctx.createBiquadFilter(); // Low cabinet thump
    this.midShapeFilter = this.ctx.createBiquadFilter(); // Speaker cone response
    this.highCutFilter = this.ctx.createBiquadFilter(); // Steep speaker cone roll-off

    this._setupGraph();
    this.setCabinet('fender_2x12');
  }

  _setupGraph() {
    this.lowResFilter.type = 'peaking';
    this.midShapeFilter.type = 'peaking';
    this.highCutFilter.type = 'lowpass';

    // Route: inputNode -> lowRes -> midShape -> highCut -> convolver -> convolverGain -> outputNode
    this.inputNode.connect(this.lowResFilter);
    this.lowResFilter.connect(this.midShapeFilter);
    this.midShapeFilter.connect(this.highCutFilter);
    this.highCutFilter.connect(this.convolver);
    this.convolver.connect(this.convolverGain);
    this.convolverGain.connect(this.outputNode);

    // Bypass dry path
    this.inputNode.connect(this.dryGain);
    this.dryGain.connect(this.outputNode);

    this.convolverGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.dryGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
  }

  setBypass(bypassed) {
    this.bypassed = bypassed;
    const t = this.ctx.currentTime;
    if (bypassed) {
      this.convolverGain.gain.setTargetAtTime(0.0, t, 0.02);
      this.dryGain.gain.setTargetAtTime(1.0, t, 0.02);
    } else {
      this.convolverGain.gain.setTargetAtTime(1.0, t, 0.02);
      this.dryGain.gain.setTargetAtTime(0.0, t, 0.02);
    }
  }

  setMicPosition(pos) {
    this.micPosition = pos;
    this.applyFilterSettings();
    if (this.onParamChanged) this.onParamChanged('micPosition', pos);
  }

  setCabinet(type) {
    this.cabinetType = type;
    if (this.onParamChanged) this.onParamChanged('cabinetType', type);
    const t = this.ctx.currentTime;

    switch (type) {
      case 'fender_2x12':
        this.name = "Fender '65 2x12 Jensen C12N (Open Back)";
        // Generate IR for open-back Jensen: punchy 90Hz, scoop at 450Hz, sparkle at 3.2kHz
        this.convolver.buffer = this._generateCabIR({
          lowFreq: 90,
          lowGain: 4.0,
          midCutFreq: 480,
          midCutGain: -3.0,
          presFreq: 3200,
          presGain: 6.0,
          highCut: 5400,
          airDecay: 0.035
        });
        break;

      case 'marshall_4x12':
        this.name = 'Marshall 1960A 4x12 Celestion G12T-75 (Closed Back)';
        // Closed back 4x12: massive 110Hz thump, punchy 2.2kHz bite, tight high cut
        this.convolver.buffer = this._generateCabIR({
          lowFreq: 110,
          lowGain: 7.0,
          midCutFreq: 600,
          midCutGain: -1.0,
          presFreq: 2400,
          presGain: 8.0,
          highCut: 4900,
          airDecay: 0.045
        });
        break;

      case 'marshall_greenback':
        this.name = 'Marshall 1960B 4x12 Celestion Greenback (Vintage 70s)';
        // Woody, smooth top end, warm low mids
        this.convolver.buffer = this._generateCabIR({
          lowFreq: 95,
          lowGain: 5.5,
          midCutFreq: 500,
          midCutGain: -0.5,
          presFreq: 1900,
          presGain: 7.0,
          highCut: 4500,
          airDecay: 0.040
        });
        break;

      case 'vox_2x12':
        this.name = 'Vox AC30 2x12 Celestion Alnico Blue';
        // Chimey, articulate highs
        this.convolver.buffer = this._generateCabIR({
          lowFreq: 85,
          lowGain: 3.5,
          midCutFreq: 400,
          midCutGain: -2.0,
          presFreq: 3600,
          presGain: 8.5,
          highCut: 5800,
          airDecay: 0.030
        });
        break;

      case 'mesa_4x12':
        this.name = 'Mesa/Boogie Rectifier Standard 4x12 Oversized (Celestion V30)';
        // Punishing 115Hz bottom end, aggressive 2.6kHz upper mid punch
        this.convolver.buffer = this._generateCabIR({
          lowFreq: 115,
          lowGain: 8.5,
          midCutFreq: 520,
          midCutGain: -2.5,
          presFreq: 2600,
          presGain: 9.0,
          highCut: 4800,
          airDecay: 0.050
        });
        break;

      case 'orange_4x12':
        this.name = 'Orange PPC412 4x12 High-Density Birch (Celestion V30)';
        // Thick resonant 105Hz low end, creamy warm 2.1kHz presence
        this.convolver.buffer = this._generateCabIR({
          lowFreq: 105,
          lowGain: 7.5,
          midCutFreq: 460,
          midCutGain: -1.0,
          presFreq: 2100,
          presGain: 7.5,
          highCut: 4600,
          airDecay: 0.045
        });
        break;
    }

    this.applyFilterSettings();
  }

  applyFilterSettings() {
    const t = this.ctx.currentTime;
    const isAxis = this.micPosition === 'axis';

    if (this.cabinetType.startsWith('marshall')) {
      this.lowResFilter.frequency.setTargetAtTime(110, t, 0.02);
      this.lowResFilter.gain.setTargetAtTime(4.0, t, 0.02);
      this.midShapeFilter.frequency.setTargetAtTime(isAxis ? 2400 : 1800, t, 0.02);
      this.midShapeFilter.gain.setTargetAtTime(isAxis ? 5.0 : 2.0, t, 0.02);
      this.highCutFilter.frequency.setTargetAtTime(isAxis ? 5200 : 4200, t, 0.02);
    } else if (this.cabinetType === 'vox_2x12') {
      this.lowResFilter.frequency.setTargetAtTime(85, t, 0.02);
      this.lowResFilter.gain.setTargetAtTime(2.0, t, 0.02);
      this.midShapeFilter.frequency.setTargetAtTime(isAxis ? 3400 : 2500, t, 0.02);
      this.midShapeFilter.gain.setTargetAtTime(isAxis ? 6.0 : 3.0, t, 0.02);
      this.highCutFilter.frequency.setTargetAtTime(isAxis ? 6000 : 4800, t, 0.02);
    } else if (this.cabinetType === 'mesa_4x12') {
      this.lowResFilter.frequency.setTargetAtTime(115, t, 0.02);
      this.lowResFilter.gain.setTargetAtTime(5.5, t, 0.02);
      this.midShapeFilter.frequency.setTargetAtTime(isAxis ? 2600 : 1900, t, 0.02);
      this.midShapeFilter.gain.setTargetAtTime(isAxis ? 6.0 : 2.5, t, 0.02);
      this.highCutFilter.frequency.setTargetAtTime(isAxis ? 5000 : 4100, t, 0.02);
    } else if (this.cabinetType === 'orange_4x12') {
      this.lowResFilter.frequency.setTargetAtTime(105, t, 0.02);
      this.lowResFilter.gain.setTargetAtTime(4.8, t, 0.02);
      this.midShapeFilter.frequency.setTargetAtTime(isAxis ? 2100 : 1600, t, 0.02);
      this.midShapeFilter.gain.setTargetAtTime(isAxis ? 5.5 : 2.2, t, 0.02);
      this.highCutFilter.frequency.setTargetAtTime(isAxis ? 4800 : 3900, t, 0.02);
    } else {
      // Fender
      this.lowResFilter.frequency.setTargetAtTime(90, t, 0.02);
      this.lowResFilter.gain.setTargetAtTime(3.0, t, 0.02);
      this.midShapeFilter.frequency.setTargetAtTime(isAxis ? 3000 : 2200, t, 0.02);
      this.midShapeFilter.gain.setTargetAtTime(isAxis ? 4.0 : 1.5, t, 0.02);
      this.highCutFilter.frequency.setTargetAtTime(isAxis ? 5500 : 4400, t, 0.02);
    }
  }

  /**
   * Generates a high quality acoustic impulse response of a real guitar speaker cabinet
   */
  _generateCabIR(params) {
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * (params.airDecay || 0.04));
    const buffer = this.ctx.createBuffer(2, length, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    for (let ch = 0; ch < 2; ch++) {
      const data = ch === 0 ? left : right;
      let prev = 0;
      let prev2 = 0;

      for (let i = 0; i < length; i++) {
        // Initial direct cone arrival + micro room reflections
        const progress = i / length;
        const decay = Math.exp(-progress * 18);
        const noise = (Math.random() * 2 - 1) * decay;

        // Speaker cone mechanical resonance (comb/biquad approximation in time domain)
        const resonance = Math.sin(2 * Math.PI * (params.lowFreq / sampleRate) * i) * Math.exp(-progress * 25) * (params.lowGain * 0.15);
        const presence = Math.sin(2 * Math.PI * (params.presFreq / sampleRate) * i) * Math.exp(-progress * 35) * (params.presGain * 0.12);

        // Smoothing (steep physical speaker roll-off)
        const raw = noise + resonance + presence;
        const smoothed = 0.4 * raw + 0.35 * prev + 0.25 * prev2;
        prev2 = prev;
        prev = smoothed;

        data[i] = smoothed;
      }

      // Normalization
      let peak = 0;
      for (let i = 0; i < length; i++) {
        if (Math.abs(data[i]) > peak) peak = Math.abs(data[i]);
      }
      if (peak > 0) {
        for (let i = 0; i < length; i++) {
          data[i] = (data[i] / peak) * 0.75;
        }
      }
    }

    return buffer;
  }

  disconnect() {
    this.inputNode.disconnect();
    this.outputNode.disconnect();
  }
}

window.CabinetSim = CabinetSim;
