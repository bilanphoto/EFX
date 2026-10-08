/**
 * Signal Chain Ribbon UI
 * Renders the top signal chain strip showing pedals in series and the amp head
 */
class SignalChainUI {
  constructor(container, chainState, onAddPedalClick) {
    this.container = container;
    this.chainState = chainState;
    this.onAddPedalClick = onAddPedalClick;

    this.render();
  }

  render() {
    this.container.innerHTML = '';

    const ribbon = document.createElement('div');
    ribbon.className = 'signal-chain-ribbon';

    // 1. Input Source Node
    const inputNode = document.createElement('div');
    inputNode.className = 'chain-block input-block';
    inputNode.innerHTML = `
      <div class="block-icon">🎸</div>
      <div class="block-label">GUITAR IN</div>
    `;
    ribbon.appendChild(inputNode);

    // Connector arrow
    ribbon.appendChild(this._createConnector());

    // 2. Pedals in Series
    this.chainState.pedals.forEach((pedal, idx) => {
      const meta = this.chainState.pedalCatalog.find(p => p.type === pedal.type) || {
        shortName: pedal.type.toUpperCase(),
        color: '#ffaa00',
        textColor: '#000',
        badge: 'STOMP'
      };

      const isSelected = this.chainState.selectedItem.type === 'pedal' && this.chainState.selectedItem.id === pedal.id;
      const isBypassed = pedal.bypassed;

      const pedalBlock = document.createElement('div');
      pedalBlock.className = `chain-block pedal-block ${isSelected ? 'selected' : ''} ${isBypassed ? 'bypassed' : 'active'}`;
      pedalBlock.style.setProperty('--pedal-theme-color', meta.color);

      pedalBlock.innerHTML = `
        <div class="block-header">
          <span class="block-type-badge">${meta.badge}</span>
          <button class="block-btn delete-btn" title="Remove Effect">✕</button>
        </div>
        <div class="pedal-thumb" style="background-color: ${meta.color}; color: ${meta.textColor}">
          <div class="thumb-led ${isBypassed ? 'off' : 'on'}"></div>
          <div class="thumb-name">${meta.shortName}</div>
          <div class="thumb-footswitch"></div>
        </div>
        <div class="block-controls">
          <button class="order-btn left-btn" ${idx === 0 ? 'disabled' : ''} title="Move Left">◀</button>
          <span class="block-label">${meta.shortName}</span>
          <button class="order-btn right-btn" ${idx === this.chainState.pedals.length - 1 ? 'disabled' : ''} title="Move Right">▶</button>
        </div>
      `;

      // Click to select/focus pedal
      pedalBlock.addEventListener('click', (e) => {
        if (e.target.closest('.block-btn') || e.target.closest('.order-btn')) return;
        this.chainState.selectPedal(pedal.id);
      });

      // Toggle bypass on clicking pedal thumb
      const thumb = pedalBlock.querySelector('.pedal-thumb');
      thumb.addEventListener('click', (e) => {
        e.stopPropagation();
        pedal.toggleBypass();
        this.render();
        if (this.chainState.onSelectionChanged) {
          this.chainState.onSelectionChanged(this.chainState.selectedItem);
        }
      });

      // Remove pedal
      const delBtn = pedalBlock.querySelector('.delete-btn');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.chainState.removePedal(pedal.id);
      });

      // Move left
      const leftBtn = pedalBlock.querySelector('.left-btn');
      leftBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.chainState.movePedalLeft(pedal.id);
      });

      // Move right
      const rightBtn = pedalBlock.querySelector('.right-btn');
      rightBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.chainState.movePedalRight(pedal.id);
      });

      ribbon.appendChild(pedalBlock);
      ribbon.appendChild(this._createConnector());
    });

    // 3. Add Pedal Button
    const addBlock = document.createElement('div');
    addBlock.className = 'chain-block add-block';
    addBlock.innerHTML = `
      <div class="add-icon">+</div>
      <div class="block-label">ADD EFFECT</div>
    `;
    addBlock.addEventListener('click', () => {
      if (this.onAddPedalClick) this.onAddPedalClick();
    });
    ribbon.appendChild(addBlock);

    ribbon.appendChild(this._createConnector());

    // 4. Amp Head Block
    const ampMeta = this.chainState.ampCatalog.find(a => a.type === this.chainState.currentAmp?.type) || {
      name: 'Fender Twin',
      shortName: 'Twin Reverb',
      brand: 'Fender'
    };
    const isAmpSelected = this.chainState.selectedItem.type === 'amp';

    const ampBlock = document.createElement('div');
    ampBlock.className = `chain-block amp-block ${isAmpSelected ? 'selected' : ''}`;
    ampBlock.innerHTML = `
      <div class="block-header">
        <span class="block-type-badge">AMP HEAD</span>
        <button class="block-btn switch-amp-btn" title="Switch Amp">🔄</button>
      </div>
      <div class="amp-thumb ${ampMeta.brand.toLowerCase()}">
        <div class="amp-thumb-logo">${ampMeta.brand}</div>
        <div class="amp-thumb-knobs">
          <span></span><span></span><span></span><span></span>
        </div>
      </div>
      <div class="block-label">${ampMeta.shortName}</div>
    `;

    ampBlock.addEventListener('click', (e) => {
      if (e.target.closest('.switch-amp-btn')) return;
      this.chainState.selectAmp();
    });

    const switchAmpBtn = ampBlock.querySelector('.switch-amp-btn');
    switchAmpBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Cycle through all available amps
      const ampTypes = ['marshall_dsl20', 'fender_acoustasonic', 'fender_twin', 'marshall_jcm800'];
      const curIdx = ampTypes.indexOf(this.chainState.currentAmp?.type);
      const nextType = ampTypes[(curIdx + 1) % ampTypes.length];
      this.chainState.setAmp(nextType);
      this.chainState.selectAmp();
    });

    ribbon.appendChild(ampBlock);
    ribbon.appendChild(this._createConnector());

    // 5. Cabinet Block
    const cabBlock = document.createElement('div');
    cabBlock.className = 'chain-block cab-block';
    const cabType = this.chainState.currentCab?.cabinetType || 'fender_2x12';
    const cabLabel = cabType.includes('marshall') ? '4x12 Cab' : '2x12 Cab';

    cabBlock.innerHTML = `
      <div class="block-header">
        <span class="block-type-badge">SPEAKER CAB</span>
      </div>
      <div class="cab-thumb">
        <div class="cab-grille">
          <div class="cab-speaker"></div>
        </div>
      </div>
      <div class="block-label">${cabLabel}</div>
    `;
    cabBlock.addEventListener('click', () => {
      this.chainState.selectAmp(); // Cab settings are in amp view
    });
    ribbon.appendChild(cabBlock);

    ribbon.appendChild(this._createConnector());

    // 6. Master Output
    const outBlock = document.createElement('div');
    outBlock.className = 'chain-block output-block';
    outBlock.innerHTML = `
      <div class="block-icon">🔊</div>
      <div class="block-label">OUTPUT</div>
    `;
    ribbon.appendChild(outBlock);

    this.container.appendChild(ribbon);
  }

  _createConnector() {
    const conn = document.createElement('div');
    conn.className = 'chain-connector';
    conn.innerHTML = `<span class="signal-arrow">▶</span>`;
    return conn;
  }
}

window.SignalChainUI = SignalChainUI;
