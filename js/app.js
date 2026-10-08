/**
 * Main Application Coordinator
 * Unifies the Pedalboard Rack, Guitar Amplifier, and Player Dock
 */
document.addEventListener('DOMContentLoaded', async () => {
  const engine = window.audioEngine;
  const synth = new window.GuitarSynth(engine);
  const riffPlayer = new window.RiffPlayer(synth);
  const chainState = new window.ChainState(engine);
  const tuner = new window.GuitarTuner(engine);

  // Grab DOM Elements
  const pedalboardContainer = document.getElementById('pedalboard-container');
  const amplifierContainer = document.getElementById('amplifier-container');
  const guitarPlayerContainer = document.getElementById('guitar-player-container');
  const visualizerCanvas = document.getElementById('visualizer-canvas');
  const addPedalModal = document.getElementById('add-pedal-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalPedalGrid = document.getElementById('modal-pedals-grid');
  const addEffectTopBtn = document.getElementById('add-effect-top-btn');

  // Master UI Elements
  const masterVolSlider = document.getElementById('master-volume');
  const inputVolSlider = document.getElementById('input-volume');
  const tunerDisplay = document.getElementById('tuner-display');
  const tunerNeedle = document.getElementById('tuner-needle');
  const tunerNote = document.getElementById('tuner-note');
  const tunerCents = document.getElementById('tuner-cents');
  const tunerToggleBtn = document.getElementById('tuner-toggle-btn');
  const scopeModeBtn = document.getElementById('scope-mode-btn');
  const presetButtons = document.querySelectorAll('.snap-preset-btn');

  // Modal handler for Adding Pedals (all 12+ Boss Pedals)
  const openAddPedalModal = () => {
    modalPedalGrid.innerHTML = '';
    chainState.pedalCatalog.forEach(p => {
      const card = document.createElement('div');
      card.className = 'pedal-card';
      card.style.setProperty('--card-color', p.color);
      card.innerHTML = `
        <div class="card-thumb" style="background-color: ${p.color}; color: ${p.textColor};">
          <div class="thumb-mini-led"></div>
          <span class="card-short-name">${p.shortName}</span>
        </div>
        <div class="card-details">
          <div class="card-badge">${p.badge}</div>
          <h4 class="card-title">${p.name}</h4>
          <p class="card-desc">${p.desc}</p>
        </div>
      `;
      card.addEventListener('click', async () => {
        await engine.resume();
        chainState.addPedal(p.type);
        addPedalModal.classList.remove('open');
      });
      modalPedalGrid.appendChild(card);
    });
    addPedalModal.classList.add('open');
  };

  modalCloseBtn.addEventListener('click', () => {
    addPedalModal.classList.remove('open');
  });

  addPedalModal.addEventListener('click', (e) => {
    if (e.target === addPedalModal) {
      addPedalModal.classList.remove('open');
    }
  });

  if (addEffectTopBtn) {
    addEffectTopBtn.addEventListener('click', openAddPedalModal);
  }

  // Initialize UIs
  const pedalBoardUI = new window.PedalBoardUI(pedalboardContainer, chainState, openAddPedalModal);
  const ampView = new window.AmpView(amplifierContainer, chainState);
  const guitarPlayerUI = new window.GuitarPlayerUI(guitarPlayerContainer, synth, riffPlayer, engine);
  const visualizer = new window.Visualizer(visualizerCanvas, engine);
  visualizer.start();

  // Tooltips for Preset buttons showing model and pedal chain
  const updatePresetButtonTooltips = () => {
    presetButtons.forEach(btn => {
      const idx = parseInt(btn.dataset.preset, 10);
      const p = chainState.getPreset(idx);
      if (p) {
        const pedalsList = (p.pedals || []).map(item => item.type.toUpperCase()).join(' + ');
        btn.title = `Preset ${idx + 1}: ${p.name} [${pedalsList || 'Clean Amp'}]`;
      }
    });
  };

  // Re-render when chain state changes
  chainState.onChainChanged = () => {
    pedalBoardUI.render();
    ampView.render(chainState.currentAmp);
    updatePresetButtonTooltips();
  };

  chainState.onSelectionChanged = () => {
    pedalBoardUI.render();
    ampView.render(chainState.currentAmp);
  };

  // Auto-Save UI Indicator & Reset Buttons
  const saveStatusBadge = document.getElementById('save-status-badge');
  const resetPresetBtn = document.getElementById('reset-preset-btn');
  const resetRigBtn = document.getElementById('reset-rig-btn');

  chainState.onSaveStatus = (status) => {
    if (!saveStatusBadge) return;
    if (status === 'saving') {
      saveStatusBadge.className = 'save-status-badge saving';
      const txt = saveStatusBadge.querySelector('.save-text');
      if (txt) txt.innerText = 'SAVING...';
    } else if (status === 'saved') {
      saveStatusBadge.className = 'save-status-badge saved';
      const txt = saveStatusBadge.querySelector('.save-text');
      if (txt) txt.innerText = 'AUTO-SAVED';
    }
  };

  if (resetPresetBtn) {
    resetPresetBtn.addEventListener('click', async () => {
      const pIdx = chainState.activePresetIdx ?? 0;
      const presetNum = pIdx + 1;
      const curPreset = chainState.getPreset(pIdx);
      const name = curPreset ? curPreset.name : `Preset ${presetNum}`;
      if (confirm(`ต้องการรีเซ็ต Preset ${presetNum} (${name}) กลับเป็นค่าเริ่มต้นโรงงาน ใช่หรือไม่?`)) {
        await engine.resume();
        chainState.resetCurrentPreset();
        updatePresetButtonTooltips();

        const toast = document.getElementById('preset-toast');
        if (toast) {
          toast.innerText = `Preset ${presetNum} Reset to Factory Default`;
          toast.classList.add('show');
          setTimeout(() => toast.classList.remove('show'), 2000);
        }
      }
    });
  }

  if (resetRigBtn) {
    resetRigBtn.addEventListener('click', async () => {
      if (confirm('ต้องการรีเซ็ตคืนค่าเริ่มต้นโรงงานของทุกพรีเซ็ต (Reset All 8 Presets) ใช่หรือไม่?')) {
        await engine.resume();
        chainState.resetAllPresets();
        presetButtons.forEach(b => b.classList.remove('active'));
        if (presetButtons[0]) presetButtons[0].classList.add('active');
        updatePresetButtonTooltips();

        const toast = document.getElementById('preset-toast');
        if (toast) {
          toast.innerText = 'All 8 Presets Reset to Factory Defaults';
          toast.classList.add('show');
          setTimeout(() => toast.classList.remove('show'), 2000);
        }
      }
    });
  }

  // Preset Buttons (Snap 1 - 8)
  presetButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      await engine.resume();
      const pIdx = parseInt(btn.dataset.preset, 10);
      chainState.selectPreset(pIdx);
      presetButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updatePresetButtonTooltips();

      const preset = chainState.getPreset(pIdx);
      if (preset) {
        const toast = document.getElementById('preset-toast');
        if (toast) {
          const count = (preset.pedals || []).length;
          toast.innerText = `Preset ${pIdx + 1}: ${preset.name} (${preset.genre}) • ${count} Pedals`;
          toast.classList.add('show');
          setTimeout(() => toast.classList.remove('show'), 2200);
        }
      }
    });
  });

  // Master & Input Volume Sliders
  masterVolSlider.addEventListener('input', (e) => {
    engine.setMasterVolume(parseFloat(e.target.value));
    chainState.scheduleSave();
  });

  inputVolSlider.addEventListener('input', (e) => {
    engine.setInputVolume(parseFloat(e.target.value));
    chainState.scheduleSave();
  });

  // Chromatic Tuner
  let tunerActive = false;
  tunerToggleBtn.addEventListener('click', async () => {
    await engine.resume();
    tunerActive = !tunerActive;
    if (tunerActive) {
      tunerToggleBtn.classList.add('active');
      tuner.start();
    } else {
      tunerToggleBtn.classList.remove('active');
      tuner.stop();
      tunerNote.innerText = '--';
      tunerCents.innerText = '0¢';
      tunerNeedle.style.transform = `translateX(-50%) rotate(0deg)`;
      tunerDisplay.classList.remove('in-tune');
    }
  });

  tuner.onPitchUpdate = (info) => {
    if (!info) {
      tunerNote.innerText = '--';
      tunerCents.innerText = '0¢';
      tunerNeedle.style.transform = `translateX(-50%) rotate(0deg)`;
      tunerDisplay.classList.remove('in-tune');
      return;
    }

    tunerNote.innerText = info.note;
    tunerCents.innerText = `${info.cents > 0 ? '+' : ''}${info.cents}¢ (${info.freq}Hz)`;

    const clampedCents = Math.max(-50, Math.min(50, info.cents));
    const angle = (clampedCents / 50) * 45;
    tunerNeedle.style.transform = `translateX(-50%) rotate(${angle}deg)`;

    if (info.inTune) {
      tunerDisplay.classList.add('in-tune');
    } else {
      tunerDisplay.classList.remove('in-tune');
    }
  };

  // Oscilloscope / FFT Spectrum toggle
  scopeModeBtn.addEventListener('click', () => {
    if (visualizer.mode === 'oscilloscope') {
      visualizer.setMode('spectrum');
      scopeModeBtn.innerText = 'FFT SPECTRUM';
    } else {
      visualizer.setMode('oscilloscope');
      scopeModeBtn.innerText = 'OSCILLOSCOPE';
    }
  });

  // Bottom Studio Dock Toggle Switch (Open / Close)
  const bottomDock = document.getElementById('bottom-studio-dock');
  const dockToggleHandle = document.getElementById('dock-toggle-handle');
  const headerDockBtn = document.getElementById('header-dock-btn');
  const dockHandleState = document.getElementById('dock-handle-state');
  const dockHandleArrow = document.getElementById('dock-handle-arrow');

  let isDockOpen = true;
  try {
    const savedDock = localStorage.getItem('BOSS_GUITAR_DOCK_OPEN');
    if (savedDock !== null) {
      isDockOpen = savedDock === 'true';
    }
  } catch (e) {}

  const setDockOpen = (open, persist = true) => {
    isDockOpen = open;
    if (bottomDock) {
      if (open) {
        bottomDock.classList.remove('collapsed');
      } else {
        bottomDock.classList.add('collapsed');
      }
    }
    if (dockToggleHandle) {
      if (open) {
        dockToggleHandle.classList.add('active');
      } else {
        dockToggleHandle.classList.remove('active');
      }
    }
    if (headerDockBtn) {
      if (open) {
        headerDockBtn.classList.add('active');
      } else {
        headerDockBtn.classList.remove('active');
      }
    }
    if (dockHandleState) dockHandleState.innerText = open ? 'ON' : 'OFF';
    if (dockHandleArrow) dockHandleArrow.innerText = open ? '▼' : '▲';

    if (open) {
      setTimeout(() => {
        if (visualizer && visualizer._resizeCanvas) {
          visualizer._resizeCanvas();
        }
      }, 300);
    }

    if (persist) {
      try {
        localStorage.setItem('BOSS_GUITAR_DOCK_OPEN', String(open));
      } catch (e) {}
    }
  };

  // Set initial state from localStorage
  setDockOpen(isDockOpen, false);

  if (dockToggleHandle) {
    dockToggleHandle.addEventListener('click', () => {
      setDockOpen(!isDockOpen);
    });
  }

  if (headerDockBtn) {
    headerDockBtn.addEventListener('click', () => {
      setDockOpen(!isDockOpen);
    });
  }

  // Initialize Audio & Restore Saved Setup or Load Preset 0
  await engine.init();
  if (chainState.hasSavedState()) {
    const restored = chainState.loadFromStorage();
    if (restored) {
      const activeIdx = chainState.activePresetIdx ?? 0;
      presetButtons.forEach(b => b.classList.remove('active'));
      if (presetButtons[activeIdx]) {
        presetButtons[activeIdx].classList.add('active');
      }
      console.log('Restored user setup from localStorage.');
    } else {
      chainState.selectPreset(0);
      presetButtons.forEach(b => b.classList.remove('active'));
      if (presetButtons[0]) presetButtons[0].classList.add('active');
    }
  } else {
    chainState.selectPreset(0);
    presetButtons.forEach(b => b.classList.remove('active'));
    if (presetButtons[0]) presetButtons[0].classList.add('active');
  }
  updatePresetButtonTooltips();

  // Resume Web Audio Context on user click
  const resumeAudioOnce = () => {
    engine.resume();
    window.removeEventListener('click', resumeAudioOnce);
    window.removeEventListener('keydown', resumeAudioOnce);
  };
  window.addEventListener('click', resumeAudioOnce);
  window.addEventListener('keydown', resumeAudioOnce);

  console.log('App ready. Boss & Fender/Marshall Guitar Rig Loaded.');
});
