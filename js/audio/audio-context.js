/**
 * Web Audio Context & Master Bus Management
 */
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isInitialized = false;
    this.masterGain = null;
    this.masterLimiter = null;
    this.analyser = null;
    this.inputGain = null;
    this.inputSource = null;
    this.currentInputType = 'synth'; // 'synth', 'mic', 'file'
    this.micStream = null;
    this.activeNodes = [];

    // Signal chain
    this.pedalChain = []; // list of active pedal instances
    this.currentAmp = null; // active amp instance
    this.currentCab = null; // active cabinet instance

    // Audio routing nodes
    this.chainInputNode = null;
    this.chainOutputNode = null;

    // Listeners
    this.onMeterUpdate = null;
  }

  async init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    try {
      this.ctx = new AudioContextClass({ latencyHint: 'interactive' });
    } catch (e) {
      this.ctx = new AudioContextClass();
    }

    // Master Limiter (prevent ear damage and speaker distortion)
    this.masterLimiter = this.ctx.createDynamicsCompressor();
    this.masterLimiter.threshold.setValueAtTime(-1.0, this.ctx.currentTime);
    this.masterLimiter.knee.setValueAtTime(0.0, this.ctx.currentTime);
    this.masterLimiter.ratio.setValueAtTime(20.0, this.ctx.currentTime);
    this.masterLimiter.attack.setValueAtTime(0.001, this.ctx.currentTime);
    this.masterLimiter.release.setValueAtTime(0.05, this.ctx.currentTime);

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

    // Analyser for visualizer & meters
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    // Chain Input Node (start of effect chain)
    this.chainInputNode = this.ctx.createGain();
    this.chainInputNode.gain.setValueAtTime(1.0, this.ctx.currentTime);

    // Chain Output Node (end of effect chain, feeds into amp)
    this.chainOutputNode = this.ctx.createGain();
    this.chainOutputNode.gain.setValueAtTime(1.0, this.ctx.currentTime);

    // Pre-chain Input Gain
    this.inputGain = this.ctx.createGain();
    this.inputGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.inputGain.connect(this.chainInputNode);

    // Connect Limiter -> Master Gain -> Analyser -> Destination
    this.masterGain.connect(this.masterLimiter);
    this.masterLimiter.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this.isInitialized = true;
    console.log('AudioEngine initialized. Sample Rate:', this.ctx.sampleRate);
  }

  async resume() {
    if (!this.ctx) await this.init();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  setMasterVolume(val) {
    if (!this.masterGain || !this.ctx) return;
    const clamped = Math.max(0, Math.min(1.5, val));
    this.masterGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.02);
  }

  setInputVolume(val) {
    if (!this.inputGain || !this.ctx) return;
    const clamped = Math.max(0, Math.min(2.5, val));
    this.inputGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.02);
  }

  /**
   * Reconnect the entire audio signal graph:
   * InputGain -> chainInputNode -> [Pedal 0 -> Pedal 1 -> ... Pedal N] -> chainOutputNode -> Amp -> Cab -> MasterGain
   */
  rebuildGraph() {
    if (!this.ctx || !this.chainInputNode || !this.chainOutputNode) return;

    // Disconnect everything in the chain
    this.chainInputNode.disconnect();
    this.chainOutputNode.disconnect();

    this.pedalChain.forEach(pedal => {
      if (pedal.disconnect) pedal.disconnect();
    });

    if (this.currentAmp && this.currentAmp.disconnect) {
      this.currentAmp.disconnect();
    }

    if (this.currentCab && this.currentCab.disconnect) {
      this.currentCab.disconnect();
    }

    // Connect pedals in series
    let currentNode = this.chainInputNode;

    for (let i = 0; i < this.pedalChain.length; i++) {
      const pedal = this.pedalChain[i];
      currentNode.connect(pedal.inputNode);
      currentNode = pedal.outputNode;
    }

    // Connect end of pedals to chainOutputNode
    currentNode.connect(this.chainOutputNode);

    // Connect chainOutputNode to Amp (or directly to cab/master if amp bypassed)
    if (this.currentAmp) {
      this.chainOutputNode.connect(this.currentAmp.inputNode);
      if (this.currentCab) {
        this.currentAmp.outputNode.connect(this.currentCab.inputNode);
        this.currentCab.outputNode.connect(this.masterGain);
      } else {
        this.currentAmp.outputNode.connect(this.masterGain);
      }
    } else {
      if (this.currentCab) {
        this.chainOutputNode.connect(this.currentCab.inputNode);
        this.currentCab.outputNode.connect(this.masterGain);
      } else {
        this.chainOutputNode.connect(this.masterGain);
      }
    }

    console.log(`Audio Graph Rebuilt: Input -> ${this.pedalChain.length} Pedals -> Amp (${this.currentAmp?.name || 'None'}) -> Cab -> Master`);
  }

  /**
   * Switch live audio input (Microphone/Guitar Interface)
   */
  async enableLiveInput() {
    await this.resume();
    try {
      if (this.micStream) {
        this.micStream.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
          latency: 0
        }
      });
      this.micStream = stream;

      if (this.inputSource) {
        this.inputSource.disconnect();
      }

      this.inputSource = this.ctx.createMediaStreamSource(stream);
      this.inputSource.connect(this.inputGain);
      this.currentInputType = 'mic';
      return { success: true };
    } catch (err) {
      console.error('Failed to get user media:', err);
      return { success: false, error: err.message };
    }
  }

  disableLiveInput() {
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    if (this.inputSource) {
      this.inputSource.disconnect();
      this.inputSource = null;
    }
    this.currentInputType = 'synth';
  }
}

// Global audio engine singleton & class export
window.AudioEngine = AudioEngine;
window.audioEngine = new AudioEngine();
