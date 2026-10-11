/**
 * Audio Visualizer & Level Meters
 * Displays real-time oscilloscope / FFT spectrum and stereo peak meters
 */
class Visualizer {
  constructor(canvas, engine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.engine = engine;
    this.mode = 'oscilloscope'; // 'oscilloscope' or 'spectrum'
    this.source = 'input'; // 'input' (guitar in) or 'output' (master out)
    this.animationId = null;

    // Buffer arrays
    this.timeData = null;
    this.freqData = null;

    this._resizeCanvas();
    window.addEventListener('resize', () => this._resizeCanvas());
  }

  _resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      this.canvas.width = rect.width * (window.devicePixelRatio || 1);
      this.canvas.height = rect.height * (window.devicePixelRatio || 1);
    }
  }

  setMode(mode) {
    this.mode = mode;
  }

  setSource(source) {
    this.source = source === 'input' ? 'input' : 'output';
  }

  start() {
    if (this.animationId) return;
    this._renderLoop();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  _renderLoop() {
    this.animationId = requestAnimationFrame(() => this._renderLoop());

    const activeAnalyser = (this.source === 'input' && this.engine.inputAnalyser)
      ? this.engine.inputAnalyser
      : this.engine.analyser;

    if (!activeAnalyser || !this.engine.isInitialized) {
      this._drawIdleScreen();
      return;
    }

    const width = this.canvas.width;
    const height = this.canvas.height;
    const ctx = this.ctx;

    if (!this.timeData || this.timeData.length !== activeAnalyser.frequencyBinCount) {
      this.timeData = new Uint8Array(activeAnalyser.frequencyBinCount);
      this.freqData = new Uint8Array(activeAnalyser.frequencyBinCount);
    }

    // Clear background (dark rack screen with phosphor grid)
    ctx.fillStyle = '#0a0d0a';
    ctx.fillRect(0, 0, width, height);
    this._drawGrid(width, height);

    // Calculate signal level (Peak & Activity)
    let peak = 0;

    if (this.mode === 'oscilloscope') {
      activeAnalyser.getByteTimeDomainData(this.timeData);

      for (let i = 0; i < this.timeData.length; i++) {
        const diff = Math.abs(this.timeData[i] - 128);
        if (diff > peak) peak = diff;
      }

      const hasSignal = peak > 3; // > ~-48dB
      const isClipping = peak > 124;

      ctx.lineWidth = 2.5 * (window.devicePixelRatio || 1);
      const strokeCol = isClipping ? '#ff3344' : (this.source === 'input' ? '#00e5ff' : '#00ff66');
      ctx.strokeStyle = strokeCol;
      ctx.shadowColor = strokeCol;
      ctx.shadowBlur = hasSignal ? 10 : 3;
      ctx.beginPath();

      const sliceWidth = width / this.timeData.length;
      let x = 0;

      for (let i = 0; i < this.timeData.length; i++) {
        const v = this.timeData[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    } else {
      // Frequency Spectrum
      activeAnalyser.getByteFrequencyData(this.freqData);

      const barCount = 64;
      const barWidth = (width / barCount) - 2;
      const step = Math.floor(this.freqData.length / barCount);

      for (let i = 0; i < barCount; i++) {
        const val = this.freqData[i * step];
        if (val > peak) peak = val;
        const barHeight = (val / 255) * (height - 10);
        const x = i * (barWidth + 2);
        const y = height - barHeight;

        const grad = ctx.createLinearGradient(0, height, 0, 0);
        if (this.source === 'input') {
          grad.addColorStop(0, '#00b4d8');
          grad.addColorStop(0.7, '#00f5d4');
          grad.addColorStop(1, '#ff0054');
        } else {
          grad.addColorStop(0, '#00ff66');
          grad.addColorStop(0.7, '#ffff00');
          grad.addColorStop(1, '#ff3333');
        }

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    }

    // Top HUD Info Overlay (Source, Activity LED, Level)
    this._drawHUD(width, height, peak);
  }

  _drawHUD(w, h, peak) {
    const ctx = this.ctx;
    const isInput = this.source === 'input';
    const hasSignal = peak > 3;
    const dpr = window.devicePixelRatio || 1;

    ctx.save();
    ctx.font = `bold ${Math.round(9 * dpr)}px 'JetBrains Mono', monospace, sans-serif`;

    // 1. Source Tag (Left)
    ctx.fillStyle = isInput ? '#00e5ff' : '#00ff66';
    const srcText = isInput ? 'SRC: GUITAR IN' : 'SRC: MASTER OUT';
    ctx.fillText(srcText, 8 * dpr, 14 * dpr);

    // 2. Signal Detected Status (Right)
    const statusText = hasSignal ? '● SIGNAL DETECTED' : '○ NO SIGNAL (IDLE)';
    ctx.fillStyle = hasSignal ? '#00ff66' : 'rgba(148, 163, 184, 0.6)';
    ctx.textAlign = 'right';
    ctx.fillText(statusText, w - 8 * dpr, 14 * dpr);

    ctx.restore();
  }

  _drawGrid(w, h) {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(0, 255, 100, 0.08)';
    ctx.lineWidth = 1;

    // Horizontal lines
    for (let y = 0; y < h; y += h / 6) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Vertical lines
    for (let x = 0; x < w; x += w / 8) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Center axis
    ctx.strokeStyle = 'rgba(0, 255, 100, 0.2)';
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
  }

  _drawIdleScreen() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.fillStyle = '#0a0d0a';
    ctx.fillRect(0, 0, w, h);
    this._drawGrid(w, h);

    // Flat center green line
    ctx.strokeStyle = 'rgba(0, 255, 100, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
  }
}

window.Visualizer = Visualizer;
