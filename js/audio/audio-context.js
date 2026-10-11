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

    // Input monitoring & multi-channel routing
    this.inputAnalyser = null;
    this.inputSplitter = null;
    this.channel1Gain = null;
    this.channel2Gain = null;
    this.inputChannelMixer = null;
    this.inputBoostGain = null;
    this.inputBoostMultiplier = 1.0;
    this.directMonitorGain = null;
    this.isDirectMonitoring = false;
    this.currentChannelMode = 'both'; // 'ch1', 'ch2', 'both'
    this.currentDeviceId = '';
    this._inputMeterData = null;

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

    // Master Transparent Compressor (musical dynamics control, zero flutter/pumping)
    this.masterLimiter = this.ctx.createDynamicsCompressor();
    this.masterLimiter.threshold.setValueAtTime(-2.0, this.ctx.currentTime);
    this.masterLimiter.knee.setValueAtTime(12.0, this.ctx.currentTime); // Soft knee prevents abrupt jumps
    this.masterLimiter.ratio.setValueAtTime(3.5, this.ctx.currentTime); // Musical mastering ratio
    this.masterLimiter.attack.setValueAtTime(0.008, this.ctx.currentTime); // 8ms transparent attack
    this.masterLimiter.release.setValueAtTime(0.25, this.ctx.currentTime); // 250ms smooth musical decay

    // Master Soft Ceiling Waveshaper: Prevents harsh digital clipping above 0dBFS without gain pumping
    this.masterCeiling = this.ctx.createWaveShaper();
    const ceilingCurve = new Float32Array(2048);
    for (let i = 0; i < 2048; i++) {
      const x = (i * 2) / 2048 - 1;
      if (x > 0.92) {
        ceilingCurve[i] = 0.92 + 0.08 * Math.tanh((x - 0.92) / 0.08);
      } else if (x < -0.92) {
        ceilingCurve[i] = -0.92 - 0.08 * Math.tanh((-x - 0.92) / 0.08);
      } else {
        ceilingCurve[i] = x;
      }
    }
    this.masterCeiling.curve = ceilingCurve;
    this.masterCeiling.oversample = '2x';

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

    // Master Output Analyser for visualizer & meters
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    // Chain Input Node (start of effect chain)
    this.chainInputNode = this.ctx.createGain();
    this.chainInputNode.gain.setValueAtTime(1.0, this.ctx.currentTime);

    // Chain Output Node (end of effect chain, feeds into amp)
    this.chainOutputNode = this.ctx.createGain();
    this.chainOutputNode.gain.setValueAtTime(1.0, this.ctx.currentTime);

    // Pre-chain Input Gain (Volume Fader)
    this.inputGain = this.ctx.createGain();
    this.inputGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.inputGain.connect(this.chainInputNode);

    // === Live Input Monitoring & Routing Subsystem ===
    // Dedicated Input Analyser (Monitors raw input signal pre-effects)
    this.inputAnalyser = this.ctx.createAnalyser();
    this.inputAnalyser.fftSize = 1024;
    this.inputAnalyser.smoothingTimeConstant = 0.2;

    // Multi-channel Splitter & Matrix (For audio interfaces: Ch 1 Mic, Ch 2 Guitar/Inst)
    this.inputSplitter = this.ctx.createChannelSplitter(2);
    this.channel1Gain = this.ctx.createGain();
    this.channel2Gain = this.ctx.createGain();
    this.inputChannelMixer = this.ctx.createGain();

    this.inputSplitter.connect(this.channel1Gain, 0); // L / Ch 1
    this.inputSplitter.connect(this.channel2Gain, 1); // R / Ch 2
    this.channel1Gain.connect(this.inputChannelMixer);
    this.channel2Gain.connect(this.inputChannelMixer);

    // Input Boost Gain (+0dB to +24dB for quiet guitar pickups; default 4.0x = +12dB standard Hi-Z)
    this.inputBoostMultiplier = 4.0;
    this.inputBoostGain = this.ctx.createGain();
    this.inputBoostGain.gain.setValueAtTime(4.0, this.ctx.currentTime);

    // Direct Monitor Gain (Dry audio audition directly to Master destination - DISABLED by default)
    this.isDirectMonitoring = false;
    this.directMonitorGain = this.ctx.createGain();
    this.directMonitorGain.gain.value = 0.0;
    this.directMonitorGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
    // CRITICAL: DO NOT connect directMonitorGain to masterGain here!
    // Direct monitor should ONLY be connected if user explicitly toggles setDirectMonitor(true).

    // Route mixer to inputAnalyser, boostGain, and directMonitorGain
    this.inputChannelMixer.connect(this.inputAnalyser);
    this.inputChannelMixer.connect(this.inputBoostGain);
    this.inputBoostGain.connect(this.inputGain);
    this.inputChannelMixer.connect(this.directMonitorGain);

    // Restore saved channel preference or default to 'both'
    try {
      const savedCh = localStorage.getItem('BOSS_GUITAR_INPUT_CHANNEL');
      if (savedCh) this.currentChannelMode = savedCh;
    } catch (e) {}
    this.setInputChannel(this.currentChannelMode);

    // Connect MasterGain -> MasterLimiter -> MasterCeiling -> Analyser -> Destination
    this.masterGain.connect(this.masterLimiter);
    this.masterLimiter.connect(this.masterCeiling);
    this.masterCeiling.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this.isInitialized = true;
    console.log('AudioEngine initialized with Input Signal Monitor. Sample Rate:', this.ctx.sampleRate);
  }

  async resume() {
    if (!this.ctx) await this.init();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1.5, val));
    if (!this.masterGain || !this.ctx) return;
    if (this.isTunerMuted) return;
    this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.02);
  }

  setTunerMute(isMuted) {
    this.isTunerMuted = !!isMuted;
    if (this.masterGain && this.ctx) {
      const vol = isMuted ? 0.0 : (this.masterVolume !== undefined ? this.masterVolume : 0.85);
      this.masterGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.02);
    }
  }

  setInputVolume(val) {
    if (!this.inputGain || !this.ctx) return;
    const clamped = Math.max(0, Math.min(2.5, val));
    this.inputGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.02);
  }

  setInputBoost(multiplier) {
    this.inputBoostMultiplier = multiplier;
    if (this.inputBoostGain && this.ctx) {
      this.inputBoostGain.gain.setTargetAtTime(multiplier, this.ctx.currentTime, 0.02);
    }
  }

  setDirectMonitor(enabled) {
    this.isDirectMonitoring = !!enabled;
    if (!this.directMonitorGain || !this.ctx) return;
    try {
      this.directMonitorGain.disconnect();
    } catch (e) {}
    const t = this.ctx.currentTime;
    if (this.isDirectMonitoring) {
      this.directMonitorGain.gain.cancelScheduledValues(t);
      this.directMonitorGain.gain.setValueAtTime(1.0, t);
      this.directMonitorGain.gain.value = 1.0;
      this.directMonitorGain.connect(this.masterGain);
      console.log('Direct Monitor Enabled (Raw dry signal routed to Master destination)');
    } else {
      this.directMonitorGain.gain.cancelScheduledValues(t);
      this.directMonitorGain.gain.setValueAtTime(0.0, t);
      this.directMonitorGain.gain.value = 0.0;
      console.log('Direct Monitor Disabled (Full serial pedalboard & amp DSP active)');
    }
  }

  setInputChannel(mode) {
    this.currentChannelMode = mode;
    if (!this.channel1Gain || !this.channel2Gain) return;
    const t = this.ctx ? this.ctx.currentTime : 0;
    if (mode === 'ch1') {
      this.channel1Gain.gain.value = 1.0;
      this.channel2Gain.gain.value = 0.0;
      this.channel1Gain.gain.setValueAtTime(1.0, t);
      this.channel2Gain.gain.setValueAtTime(0.0, t);
    } else if (mode === 'ch2') {
      this.channel1Gain.gain.value = 0.0;
      this.channel2Gain.gain.value = 1.0;
      this.channel1Gain.gain.setValueAtTime(0.0, t);
      this.channel2Gain.gain.setValueAtTime(1.0, t);
    } else { // 'both'
      this.channel1Gain.gain.value = 1.0;
      this.channel2Gain.gain.value = 1.0;
      this.channel1Gain.gain.setValueAtTime(1.0, t);
      this.channel2Gain.gain.setValueAtTime(1.0, t);
    }
    try {
      localStorage.setItem('BOSS_GUITAR_INPUT_CHANNEL', mode);
    } catch (e) {}
    console.log(`Input Channel Mode set to: ${mode} (Ch1 Gain: ${this.channel1Gain.gain.value}, Ch2 Gain: ${this.channel2Gain.gain.value})`);
  }

  /**
   * Get real-time audio input signal metrics (RMS, Peak, dB, Activity)
   */
  getInputMetrics() {
    if (!this.inputAnalyser) {
      return { rms: 0, peak: 0, db: -100, hasSignal: false, isClipping: false };
    }
    const bufLen = this.inputAnalyser.fftSize;
    if (!this._inputMeterData || this._inputMeterData.length !== bufLen) {
      this._inputMeterData = new Float32Array(bufLen);
    }
    this.inputAnalyser.getFloatTimeDomainData(this._inputMeterData);

    let sumSquares = 0;
    let peak = 0;
    for (let i = 0; i < bufLen; i++) {
      const val = Math.abs(this._inputMeterData[i]);
      if (val > peak) peak = val;
      sumSquares += val * val;
    }
    const rms = Math.sqrt(sumSquares / bufLen);
    const db = peak > 0.00001 ? 20 * Math.log10(peak) : -100;

    return {
      rms,
      peak,
      db: Math.max(-80, Math.min(6, Math.round(db * 10) / 10)),
      hasSignal: peak > 0.008 || rms > 0.004, // Sensitive down to -52 dB for long guitar sustain
      isClipping: peak >= 0.98
    };
  }

  /**
   * Query connected audio input devices
   */
  async getAudioInputDevices() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter(d => d.kind === 'audioinput')
        .map((d, idx) => {
          const label = d.label || `Audio Input ${idx + 1}`;
          const isInterface = /scarlett|focusrite|behringer|ur22|audiobox|irig|volt|komplete|m-audio|motu|quad-capture|zoom|boss|axe/i.test(label);
          return {
            id: d.deviceId,
            label,
            isInterface
          };
        });
    } catch (err) {
      console.warn('Failed to enumerate devices:', err);
      return [];
    }
  }

  /**
   * Reconnect the entire audio signal graph:
   * InputGain -> chainInputNode -> [Pedal 0 -> Pedal 1 -> ... Pedal N] -> chainOutputNode -> Amp -> Cab -> MasterGain
   */
  rebuildGraph() {
    if (!this.ctx || !this.chainInputNode || !this.chainOutputNode) return;

    // Disconnect external serial connections (ONLY output nodes!)
    try { this.chainInputNode.disconnect(); } catch (e) {}
    try { this.chainOutputNode.disconnect(); } catch (e) {}

    this.pedalChain.forEach(pedal => {
      if (pedal && pedal.outputNode) {
        try { pedal.outputNode.disconnect(); } catch (e) {}
      }
      if (pedal && typeof pedal.ensureInternalConnections === 'function') {
        pedal.ensureInternalConnections();
      }
    });

    if (this.currentAmp) {
      if (this.currentAmp.outputNode) {
        try { this.currentAmp.outputNode.disconnect(); } catch (e) {}
      }
      if (typeof this.currentAmp.ensureInternalConnections === 'function') {
        this.currentAmp.ensureInternalConnections();
      }
    }

    if (this.currentCab) {
      if (this.currentCab.outputNode) {
        try { this.currentCab.outputNode.disconnect(); } catch (e) {}
      }
      if (typeof this.currentCab.ensureInternalConnections === 'function') {
        this.currentCab.ensureInternalConnections();
      }
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
  async enableLiveInput(deviceId = null, channelMode = null) {
    await this.resume();
    try {
      if (this.micStream) {
        this.micStream.getTracks().forEach(track => track.stop());
        this.micStream = null;
      }

      if (deviceId) {
        this.currentDeviceId = deviceId;
      } else {
        try {
          this.currentDeviceId = localStorage.getItem('BOSS_GUITAR_INPUT_DEVICE') || '';
        } catch (e) {}
      }

      if (channelMode) {
        this.currentChannelMode = channelMode;
      } else {
        try {
          this.currentChannelMode = localStorage.getItem('BOSS_GUITAR_INPUT_CHANNEL') || 'both';
        } catch (e) {}
      }

      // Pro-audio constraints: Disable aggressive speech processing (AGC, noise gates, echo suppression)
      // that treats sustained guitar tones and distortion as noise and ducks volume
      const audioConstraints = {
        echoCancellation: false,
        autoGainControl: false,
        noiseSuppression: false,
        channelCount: { ideal: 2 }, // Request 2 channels so Ch 2 (Inst/Guitar) is accessible!
        latency: { ideal: 0.005 },
        sampleRate: { ideal: 48000 },
        googEchoCancellation: false,
        googAutoGainControl: false,
        googNoiseSuppression: false,
        googHighpassFilter: false,
        googTypingNoiseDetection: false,
        googAudioMirroring: false
      };

      if (this.currentDeviceId) {
        audioConstraints.deviceId = { exact: this.currentDeviceId };
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      } catch (err) {
        console.warn('getUserMedia with specific deviceId failed, retrying with generic constraints:', err);
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            autoGainControl: false,
            noiseSuppression: false,
            channelCount: { ideal: 2 }
          }
        });
      }

      this.micStream = stream;

      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        // Force-apply raw audio constraints directly on the audio track to bypass OS/browser filters
        if (typeof audioTrack.applyConstraints === 'function') {
          try {
            await audioTrack.applyConstraints({
              echoCancellation: false,
              autoGainControl: false,
              noiseSuppression: false,
              channelCount: 2
            });
          } catch (e) {
            console.warn('Track applyConstraints warning:', e);
          }
        }

        const settings = audioTrack.getSettings();
        if (settings.deviceId) {
          this.currentDeviceId = settings.deviceId;
          try {
            localStorage.setItem('BOSS_GUITAR_INPUT_DEVICE', this.currentDeviceId);
          } catch (e) {}
        }
      }

      if (this.inputSource) {
        try { this.inputSource.disconnect(); } catch (e) {}
      }

      this.inputSource = this.ctx.createMediaStreamSource(stream);

      // Connect inputSource to our multi-channel splitter
      this.inputSource.connect(this.inputSplitter);
      this.setInputChannel(this.currentChannelMode);
      this.setInputBoost(this.inputBoostMultiplier || 4.0);

      this.currentInputType = 'mic';
      console.log(`Live Audio Input Active. Device: "${audioTrack?.label || 'Default'}", Channels: ${audioTrack?.getSettings()?.channelCount || 2}, Mode: ${this.currentChannelMode}`);
      return {
        success: true,
        deviceLabel: audioTrack?.label || 'Audio Input',
        deviceId: this.currentDeviceId,
        channelMode: this.currentChannelMode
      };
    } catch (err) {
      console.error('Failed to get user media:', err);
      return { success: false, error: err.message || String(err) };
    }
  }

  disableLiveInput() {
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    if (this.inputSource) {
      try { this.inputSource.disconnect(); } catch (e) {}
      this.inputSource = null;
    }
    this.currentInputType = 'synth';
  }
}

// Global audio engine singleton & class export
window.AudioEngine = AudioEngine;
window.audioEngine = new AudioEngine();
