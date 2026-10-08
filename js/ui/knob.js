/**
 * Skeuomorphic Rotary Knob Component
 * Handles mouse drag, wheel, touch, and angle calculation with realistic visuals
 */
class RotaryKnob {
  constructor(element, options = {}) {
    this.el = element;
    this.min = options.min ?? 0;
    this.max = options.max ?? 100;
    this.step = options.step ?? 1;
    this.value = options.value ?? (this.min + this.max) / 2;
    this.defaultValue = this.value;
    this.minAngle = options.minAngle ?? -140;
    this.maxAngle = options.maxAngle ?? 140;
    this.onChange = options.onChange || null;
    this.styleType = options.styleType || 'boss'; // 'boss', 'fender', 'marshall', 'marshall-gold'

    this.isDragging = false;
    this.startY = 0;
    this.startVal = this.value;

    this._initDOM();
    this._attachEvents();
    this.setValue(this.value, false);
  }

  _initDOM() {
    this.el.classList.add('rotary-knob', `knob-${this.styleType}`);
    this.pointerEl = this.el.querySelector('.knob-pointer');
    if (!this.pointerEl) {
      this.pointerEl = document.createElement('div');
      this.pointerEl.className = 'knob-pointer';
      this.el.appendChild(this.pointerEl);
    }
  }

  _attachEvents() {
    // Mouse Drag
    const onMouseDown = (e) => {
      e.preventDefault();
      this.isDragging = true;
      this.startY = e.clientY;
      this.startVal = this.value;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      this.el.classList.add('active');
    };

    const onMouseMove = (e) => {
      if (!this.isDragging) return;
      const deltaY = this.startY - e.clientY;
      // Sensitivity: 150px drag for full range
      const range = this.max - this.min;
      const stepChange = (deltaY / 150) * range;
      this.setValue(this.startVal + stepChange, true);
    };

    const onMouseUp = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      this.el.classList.remove('active');
    };

    this.el.addEventListener('mousedown', onMouseDown);

    // Touch
    this.el.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.startY = e.touches[0].clientY;
        this.startVal = this.value;
        this.el.classList.add('active');
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const deltaY = this.startY - e.touches[0].clientY;
      const range = this.max - this.min;
      const stepChange = (deltaY / 150) * range;
      this.setValue(this.startVal + stepChange, true);
    }, { passive: true });

    window.addEventListener('touchend', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.el.classList.remove('active');
      }
    });

    // Double click to reset
    this.el.addEventListener('dblclick', () => {
      this.setValue(this.defaultValue, true);
    });

    // Mouse wheel
    this.el.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -this.step * 2 : this.step * 2;
      this.setValue(this.value + delta, true);
    }, { passive: false });
  }

  setValue(newVal, triggerCallback = true) {
    let val = Math.max(this.min, Math.min(this.max, newVal));
    if (this.step) {
      val = Math.round(val / this.step) * this.step;
    }
    this.value = val;

    // Angle mapping
    const ratio = (this.value - this.min) / (this.max - this.min);
    const angle = this.minAngle + ratio * (this.maxAngle - this.minAngle);

    if (this.pointerEl) {
      this.pointerEl.style.transform = `rotate(${angle}deg)`;
    }

    if (triggerCallback && this.onChange) {
      this.onChange(this.value);
    }
  }
}

window.RotaryKnob = RotaryKnob;
