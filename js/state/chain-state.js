/**
 * Signal Chain State Manager
 * Full Registry of all Boss pedals & Fender/Marshall amps matching the uploaded images
 */
class ChainState {
  constructor(engine) {
    this.engine = engine;
    this.pedals = [];
    this.currentAmp = null;
    this.currentCab = null;

    this.selectedItem = { type: 'pedal', id: null };

    // Complete Registry of all 15 iconic Boss pedals
    this.pedalCatalog = [
      // === 20 Pedals from Uploaded Grid (media_1791433382703.jpg) ===
      {
        type: 'frv1',
        name: "'63 Fender Reverb FRV-1",
        category: 'Delay / Reverb',
        shortName: 'FRV-1',
        color: '#5c3317',
        textColor: '#ffffff',
        badge: 'FENDER TUBE REVERB',
        desc: "Classic '63 Fender spring reverb tank with Mixer, Tone, and Dwell controls"
      },
      {
        type: 'dm2w',
        name: 'Delay DM-2w Waza Craft',
        category: 'Delay / Reverb',
        shortName: 'DM-2w',
        color: '#8b1e2d',
        textColor: '#ffffff',
        badge: 'ANALOG DELAY',
        desc: 'Vintage analog BBD bucket-brigade delay with Repeat Rate, Intensity, and Echo'
      },
      {
        type: 'jb2',
        name: 'Angry Driver JB-2',
        category: 'Drive / Distortion',
        shortName: 'JB-2',
        color: '#f8fafc',
        textColor: '#b91c1c',
        badge: 'BOSS + JHS DUAL DRIVE',
        desc: 'Collab with JHS: Boss Blues Driver + JHS Angry Charlie high-gain stack'
      },
      {
        type: 'ce2w',
        name: 'Chorus CE-2w Waza Craft',
        category: 'Modulation',
        shortName: 'CE-2w',
        color: '#4db7e8',
        textColor: '#ffffff',
        badge: 'WAZA CHORUS',
        desc: 'Legendary CE-2 and CE-1 chorus sounds recreated with full analog BBD circuitry'
      },
      {
        type: 'tu3',
        name: 'Chromatic Tuner TU-3',
        category: 'Utility',
        shortName: 'TU-3',
        color: '#f1f5f9',
        textColor: '#dc2626',
        badge: 'STAGE TUNER',
        desc: 'Industry standard stage tuner with ultra-bright multi-segment LED meter and Accu-Pitch'
      },
      {
        type: 'cp1x',
        name: 'Compressor CP-1X',
        category: 'Dynamics',
        shortName: 'CP-1X',
        color: '#1e40af',
        textColor: '#ffffff',
        badge: 'MDP COMPRESSOR',
        desc: 'Next-generation multiband studio compressor that preserves guitar character'
      },
      {
        type: 'dd7',
        name: 'Digital Delay DD-7',
        category: 'Delay / Reverb',
        shortName: 'DD-7',
        color: '#eae7df',
        textColor: '#0891b2',
        badge: 'MULTI DELAY',
        desc: 'Expanded digital delay with Analog, Modulate, Reverse, and up to 3200ms delay time'
      },
      {
        type: 'ds1',
        name: 'Distortion DS-1',
        category: 'Drive / Distortion',
        shortName: 'DS-1',
        color: '#1a1d20',
        textColor: '#fbbf24',
        badge: 'DISTORTION',
        desc: 'The benchmark hard-clipping distortion with biting edge and smooth sustain'
      },
      {
        type: 'sd2',
        name: 'DUAL OverDrive SD-2',
        category: 'Drive / Distortion',
        shortName: 'SD-2',
        color: '#ca8a04',
        textColor: '#15803d',
        badge: 'DUAL OVERDRIVE',
        desc: 'Twin overdrive channels: transparent Crunch mode and singing Lead mode'
      },
      {
        type: 'aw3',
        name: 'Dynamic Wah AW-3',
        category: 'Filter / Wah',
        shortName: 'AW-3',
        color: '#d4af37',
        textColor: '#1e293b',
        badge: 'AUTO WAH / TALK',
        desc: 'Classic envelope auto-wah plus unique Humanizer voice vowel effects'
      },
      {
        type: 'ge7',
        name: 'Equalizer GE-7',
        category: 'EQ / Dynamics',
        shortName: 'GE-7',
        color: '#dedbd2',
        textColor: '#1a1a1a',
        badge: 'EQUALIZER',
        desc: '7-band precision graphic equalizer sliders (100Hz to 6.4kHz) + Level control'
      },
      {
        type: 'ps6',
        name: 'Harmonist PS-6',
        category: 'Pitch / Modulation',
        shortName: 'PS-6',
        color: '#0d9488',
        textColor: '#ffffff',
        badge: 'HARMONIZER',
        desc: 'Intelligent 3-voice harmony, pitch shifting, detuning, and wild Super Bend'
      },
      {
        type: 'rc3',
        name: 'Loop Station RC-3',
        category: 'Looper / Utility',
        shortName: 'RC-3',
        color: '#dc2626',
        textColor: '#ffffff',
        badge: 'LOOP STATION',
        desc: 'Stereo phrase recording and playback looper with rhythm guide'
      },
      {
        type: 'mt2',
        name: 'Metal Zone MT-2',
        category: 'Drive / Distortion',
        shortName: 'MT-2',
        color: '#18181b',
        textColor: '#f97316',
        badge: 'HIGH GAIN METAL',
        desc: 'Legendary dual-stage metal distortion with 3-band parametric mid sweep EQ'
      },
      {
        type: 'ns2',
        name: 'Noise Suppressor NS-2',
        category: 'Dynamics / Utility',
        shortName: 'NS-2',
        color: '#eae8e1',
        textColor: '#b30000',
        badge: 'NOISE GATE',
        desc: 'Silences unwanted hum and hiss while preserving natural pick attack'
      },
      {
        type: 'od1x',
        name: 'OverDrive OD-1X',
        category: 'Drive / Distortion',
        shortName: 'OD-1X',
        color: '#eab308',
        textColor: '#18181b',
        badge: 'SPECIAL EDITION OD',
        desc: 'MDP overdrive with punchy low end and high-definition crunch across all strings'
      },
      {
        type: 'rv6',
        name: 'Reverb RV-6',
        category: 'Delay / Reverb',
        shortName: 'RV-6',
        color: '#475569',
        textColor: '#ffffff',
        badge: 'HD REVERB',
        desc: 'Next-gen studio reverb with Shimmer, Dynamic, Delay, Hall, Plate, and Spring'
      },
      {
        type: 'oc3',
        name: 'SUPER Octave OC-3',
        category: 'Pitch / Bass',
        shortName: 'OC-3',
        color: '#451a03',
        textColor: '#ffffff',
        badge: 'OCTAVE GENERATOR',
        desc: 'Polyphonic octave divider with Drive mode and dual sub-octave rumble'
      },
      {
        type: 'sd1w',
        name: 'SUPER OverDrive SD-1w',
        category: 'Drive / Distortion',
        shortName: 'SD-1w',
        color: '#f59e0b',
        textColor: '#18181b',
        badge: 'WAZA OVERDRIVE',
        desc: 'Waza Craft edition of SD-1 with all-discrete analog circuit and Custom bass mode'
      },
      {
        type: 'te2',
        name: 'Tera Echo TE-2',
        category: 'Delay / Ambient',
        shortName: 'TE-2',
        color: '#f0fdf4',
        textColor: '#0284c7',
        badge: 'TERA ECHO',
        desc: 'Dynamic stereo ambience effect with stereo delay and interstellar freeze resonance'
      },

      // === Additional Iconic Boss Favorites ===
      {
        type: 'bd2',
        name: 'Blues Driver BD-2',
        category: 'Drive / Distortion',
        shortName: 'BD-2',
        color: '#154889',
        textColor: '#ffd700',
        badge: 'BLUES DRIVER',
        desc: 'Dynamic vintage tube amp breakup responsive to pick attack nuances'
      },
      {
        type: 'ds2',
        name: 'TURBO Distortion DS-2',
        category: 'Drive / Distortion',
        shortName: 'DS-2',
        color: '#f05510',
        textColor: '#ffffff',
        badge: 'TURBO DIST',
        desc: 'Turbo Mode I classic crunch or Mode II mid-boosted solo roar'
      },
      {
        type: 'os2',
        name: 'Over Drive/Distortion OS-2',
        category: 'Drive / Distortion',
        shortName: 'OS-2',
        color: '#e5aa17',
        textColor: '#1a1a1a',
        badge: 'OD / DIST',
        desc: 'Combines both overdrive and distortion with COLOR blending knob'
      },
      {
        type: 'ch1',
        name: 'SUPER Chorus CH-1',
        category: 'Modulation',
        shortName: 'CH-1',
        color: '#48a4dd',
        textColor: '#ffffff',
        badge: 'CHORUS',
        desc: 'Crystal-clear stereo chorus with EQ tone control, Rate and Depth'
      },
      {
        type: 'tr2',
        name: 'Tremolo TR-2',
        category: 'Modulation',
        shortName: 'TR-2',
        color: '#158b88',
        textColor: '#ffffff',
        badge: 'TREMOLO',
        desc: 'Classic vintage amplitude modulation with Wave, Rate, and Depth'
      },
      {
        type: 'cs3',
        name: 'Compression Sustainer CS-3',
        category: 'Dynamics / Filter',
        shortName: 'CS-3',
        color: '#1b6bb8',
        textColor: '#ffffff',
        badge: 'COMPRESSOR',
        desc: 'Smooths out dynamics and provides singing sustain with low noise'
      },
      {
        type: 'bf2',
        name: 'Flanger BF-2',
        category: 'Modulation',
        shortName: 'BF-2',
        color: '#752f82',
        textColor: '#ffffff',
        badge: 'FLANGER',
        desc: 'Dramatic jet-plane swoosh and metallic comb filtering'
      }
    ];

    // Complete Registry of Amps (Matching images)
    this.ampCatalog = [
      {
        type: 'marshall_dsl20',
        name: 'Marshall DSL20 Combo',
        brand: 'Marshall',
        shortName: 'DSL20',
        tagline: 'Dual Channel (Classic & Ultra Gain) British Roar',
        theme: 'marshall-gold'
      },
      {
        type: 'fender_acoustasonic',
        name: 'Fender Acoustasonic 15',
        brand: 'Fender',
        shortName: 'Acoustasonic',
        tagline: 'Dual Channel Acoustic/Electric Combo with Built-in Chorus',
        theme: 'fender-tan'
      },
      {
        type: 'fender_twin',
        name: "Fender '65 Twin Reverb",
        brand: 'Fender',
        shortName: 'Twin Reverb',
        tagline: 'Glassy Tube Chime & Classic Spring Reverb',
        theme: 'fender-blackface'
      },
      {
        type: 'marshall_jcm800',
        name: 'Marshall JCM800 2203',
        brand: 'Marshall',
        shortName: 'JCM800',
        tagline: 'Legendary British High-Gain Punch & Roar',
        theme: 'marshall-gold'
      }
    ];

    this.activePresetIdx = null;
    this.isLoadingState = false;
    this._saveTimer = null;
    this.onSaveStatus = null; // callback (status: 'saving' | 'saved')
    this.onChainChanged = null;
    this.onSelectionChanged = null;

    // Load initial factory presets bank
    this.presets = this._getDefaultPresets();
  }

  _getDefaultPresets() {
    if (typeof window !== 'undefined' && window.FACTORY_PRESETS && Array.isArray(window.FACTORY_PRESETS)) {
      return JSON.parse(JSON.stringify(window.FACTORY_PRESETS));
    }
    return [];
  }

  getCurrentRigSnapshot() {
    return {
      amp: {
        type: this.currentAmp ? this.currentAmp.type : 'marshall_dsl20',
        params: this.currentAmp ? { ...this.currentAmp.params } : {},
        cab: this.currentCab ? this.currentCab.cabinetType : 'marshall_4x12',
        mic: this.currentCab ? this.currentCab.micPosition : 'axis',
        bypassed: this.currentAmp ? !!this.currentAmp.bypassed : false
      },
      pedals: this.pedals.map(p => ({
        type: p.type,
        bypassed: !!p.bypassed,
        params: { ...p.params }
      }))
    };
  }

  updateActivePresetFromCurrent() {
    if (this.isLoadingState) return;
    if (this.activePresetIdx === null || this.activePresetIdx === undefined) return;

    if (!this.presets || !Array.isArray(this.presets)) {
      this.presets = this._getDefaultPresets();
    }

    if (!this.presets[this.activePresetIdx]) {
      const def = this._getDefaultPresets();
      this.presets[this.activePresetIdx] = def[this.activePresetIdx] ? JSON.parse(JSON.stringify(def[this.activePresetIdx])) : {
        id: `p${this.activePresetIdx + 1}`,
        name: `Preset ${this.activePresetIdx + 1}`,
        genre: 'Custom',
        amp: { type: 'marshall_dsl20', cab: 'marshall_4x12', params: {} },
        pedals: []
      };
    }

    const snapshot = this.getCurrentRigSnapshot();
    this.presets[this.activePresetIdx].amp = snapshot.amp;
    this.presets[this.activePresetIdx].pedals = snapshot.pedals;
  }

  scheduleSave() {
    if (this.isLoadingState) return;
    if (this._saveTimer) clearTimeout(this._saveTimer);
    if (this.onSaveStatus) this.onSaveStatus('saving');
    this._saveTimer = setTimeout(() => {
      this.saveToStorage();
    }, 200);
  }

  saveToStorage() {
    try {
      this.updateActivePresetFromCurrent();

      const data = {
        version: 2,
        activePresetIdx: this.activePresetIdx ?? 0,
        presets: this.presets,
        masterVol: this.engine.masterGain && this.engine.masterGain.gain ? this.engine.masterGain.gain.value : 0.85,
        inputVol: this.engine.inputGain && this.engine.inputGain.gain ? this.engine.inputGain.gain.value : 1.0
      };
      localStorage.setItem('BOSS_GUITAR_RIG_STATE', JSON.stringify(data));
      if (this.onSaveStatus) this.onSaveStatus('saved');
    } catch (e) {
      console.warn('Failed to save state to localStorage:', e);
    }
  }

  hasSavedState() {
    try {
      const val = localStorage.getItem('BOSS_GUITAR_RIG_STATE');
      return !!val;
    } catch (e) {
      return false;
    }
  }

  loadFromStorage() {
    try {
      const json = localStorage.getItem('BOSS_GUITAR_RIG_STATE');
      if (!json) return false;
      const data = JSON.parse(json);
      if (!data) return false;

      // Handle version 2 (multi-preset bank) or migrate version 1 (single preset)
      if (Array.isArray(data.presets) && data.presets.length > 0) {
        this.presets = data.presets;
        // Ensure missing slots are filled with factory defaults
        const defPresets = this._getDefaultPresets();
        for (let i = 0; i < defPresets.length; i++) {
          if (!this.presets[i]) {
            this.presets[i] = JSON.parse(JSON.stringify(defPresets[i]));
          }
        }
      } else if (data.amp && Array.isArray(data.pedals)) {
        // Migration from v1
        this.presets = this._getDefaultPresets();
        const pIdx = (typeof data.activePresetIdx === 'number' && data.activePresetIdx >= 0 && data.activePresetIdx < this.presets.length) ? data.activePresetIdx : 0;
        if (this.presets[pIdx]) {
          this.presets[pIdx].amp = data.amp;
          this.presets[pIdx].pedals = data.pedals;
        }
      } else {
        return false;
      }

      const targetIdx = (typeof data.activePresetIdx === 'number' && data.activePresetIdx >= 0 && data.activePresetIdx < this.presets.length)
        ? data.activePresetIdx
        : 0;

      this.activePresetIdx = targetIdx;

      // Restore Master & Input Volumes
      if (typeof data.masterVol === 'number' && this.engine.setMasterVolume) {
        this.engine.setMasterVolume(data.masterVol);
        const masterInput = document.getElementById('master-volume');
        if (masterInput) masterInput.value = data.masterVol;
      }
      if (typeof data.inputVol === 'number' && this.engine.setInputVolume) {
        this.engine.setInputVolume(data.inputVol);
        const inputInput = document.getElementById('input-volume');
        if (inputInput) inputInput.value = data.inputVol;
      }

      // Apply the active preset's saved configuration to the rig
      this.applyPresetData(this.presets[targetIdx]);

      if (this.onSaveStatus) this.onSaveStatus('saved');
      return true;
    } catch (e) {
      console.warn('Failed to load state from localStorage:', e);
      return false;
    }
  }

  clearSavedState() {
    try {
      localStorage.removeItem('BOSS_GUITAR_RIG_STATE');
    } catch (e) {}
  }

  addPedal(type) {
    const id = 'pedal_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const pedal = window.createPedalInstance(type, id, this.engine);
    pedal.onParamChanged = () => this.scheduleSave();
    this.pedals.push(pedal);
    this.engine.pedalChain = this.pedals;

    if (!this.isLoadingState) {
      this.engine.rebuildGraph();
      this.selectPedal(id);
      this.scheduleSave();
      if (this.onChainChanged) this.onChainChanged();
    }
    return pedal;
  }

  removePedal(id) {
    const idx = this.pedals.findIndex(p => p.id === id);
    if (idx !== -1) {
      const [removed] = this.pedals.splice(idx, 1);
      if (removed.disconnect) removed.disconnect();
      this.engine.pedalChain = this.pedals;
      this.engine.rebuildGraph();

      if (this.selectedItem.id === id) {
        if (this.pedals.length > 0) {
          const nextIdx = Math.min(idx, this.pedals.length - 1);
          this.selectPedal(this.pedals[nextIdx].id);
        } else {
          this.selectAmp();
        }
      }

      this.scheduleSave();
      if (this.onChainChanged) this.onChainChanged();
    }
  }

  movePedal(fromIdx, toIdx) {
    if (fromIdx < 0 || fromIdx >= this.pedals.length) return;
    if (toIdx < 0 || toIdx >= this.pedals.length) return;
    if (fromIdx === toIdx) return;

    const [moved] = this.pedals.splice(fromIdx, 1);
    this.pedals.splice(toIdx, 0, moved);
    this.engine.pedalChain = this.pedals;
    this.engine.rebuildGraph();

    this.scheduleSave();
    if (this.onChainChanged) this.onChainChanged();
  }

  movePedalLeft(id) {
    const idx = this.pedals.findIndex(p => p.id === id);
    if (idx > 0) this.movePedal(idx, idx - 1);
  }

  movePedalRight(id) {
    const idx = this.pedals.findIndex(p => p.id === id);
    if (idx !== -1 && idx < this.pedals.length - 1) this.movePedal(idx, idx + 1);
  }

  setAmp(type) {
    if (this.currentAmp && this.currentAmp.disconnect) {
      this.currentAmp.disconnect();
    }
    const amp = window.createAmpInstance(type, 'amp_' + type, this.engine);
    amp.onParamChanged = () => this.scheduleSave();
    this.currentAmp = amp;
    this.engine.currentAmp = amp;

    if (!this.isLoadingState) {
      this.engine.rebuildGraph();
      if (this.selectedItem.type === 'amp') {
        this.selectedItem.id = amp.id;
      }
      this.scheduleSave();
      if (this.onChainChanged) this.onChainChanged();
    }
    return amp;
  }

  setCab(type) {
    if (!this.currentCab) {
      this.currentCab = new window.CabinetSim(this.engine);
      this.engine.currentCab = this.currentCab;
    }
    this.currentCab.onParamChanged = () => this.scheduleSave();
    this.currentCab.setCabinet(type);

    if (!this.isLoadingState) {
      this.engine.rebuildGraph();
      this.scheduleSave();
      if (this.onChainChanged) this.onChainChanged();
    }
  }

  selectPedal(id) {
    this.selectedItem = { type: 'pedal', id: id };
    if (!this.isLoadingState && this.onSelectionChanged) {
      this.onSelectionChanged(this.selectedItem);
    }
  }

  selectAmp() {
    this.selectedItem = { type: 'amp', id: this.currentAmp ? this.currentAmp.id : 'amp' };
    if (!this.isLoadingState && this.onSelectionChanged) {
      this.onSelectionChanged(this.selectedItem);
    }
  }

  applyPresetData(data) {
    if (!data) return;
    this.isLoadingState = true;

    // 1. Clear existing pedals
    this.pedals.forEach(p => {
      if (p.disconnect) p.disconnect();
    });
    this.pedals = [];

    // 2. Setup Amp
    if (data.amp && data.amp.type) {
      this.setAmp(data.amp.type);
      if (data.amp.params && this.currentAmp) {
        Object.entries(data.amp.params).forEach(([k, v]) => {
          this.currentAmp.updateParam(k, v);
        });
      }
      if (typeof data.amp.bypassed === 'boolean' && this.currentAmp) {
        this.currentAmp.setBypass(data.amp.bypassed);
      }
    }

    // 3. Setup Cabinet
    if (data.amp) {
      this.setCab(data.amp.cab || 'marshall_4x12');
      if (data.amp.mic && this.currentCab) {
        this.currentCab.setMicPosition(data.amp.mic);
      }
    }

    // 4. Restore Pedals
    if (Array.isArray(data.pedals)) {
      data.pedals.forEach(pData => {
        const p = this.addPedal(pData.type);
        p.setBypass(!!pData.bypassed);
        if (pData.params) {
          Object.entries(pData.params).forEach(([k, v]) => {
            p.updateParam(k, v);
          });
        }
      });
    }

    // 5. Rebuild audio graph once
    this.engine.pedalChain = this.pedals;
    this.engine.rebuildGraph();

    // 6. Select first pedal or amp
    if (this.pedals.length > 0) {
      this.selectedItem = { type: 'pedal', id: this.pedals[0].id };
    } else {
      this.selectedItem = { type: 'amp', id: this.currentAmp ? this.currentAmp.id : 'amp' };
    }

    this.isLoadingState = false;
    if (this.onSelectionChanged) this.onSelectionChanged(this.selectedItem);
    if (this.onChainChanged) this.onChainChanged();
  }

  selectPreset(newIdx) {
    if (newIdx < 0) return;

    // Flush any pending save on current preset before switching away
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
      this._saveTimer = null;
    }
    if (!this.isLoadingState && this.activePresetIdx !== null && this.activePresetIdx !== newIdx && this.presets && this.presets[this.activePresetIdx]) {
      this.updateActivePresetFromCurrent();
    }

    this.activePresetIdx = newIdx;

    if (!this.presets || !Array.isArray(this.presets)) {
      this.presets = this._getDefaultPresets();
    }
    if (!this.presets[newIdx]) {
      const def = this._getDefaultPresets();
      this.presets[newIdx] = def[newIdx] ? JSON.parse(JSON.stringify(def[newIdx])) : {
        id: `p${newIdx + 1}`,
        name: `Preset ${newIdx + 1}`,
        genre: 'Custom',
        amp: { type: 'marshall_dsl20', cab: 'marshall_4x12', params: {} },
        pedals: []
      };
    }

    // Apply target preset data to graph and UI
    this.applyPresetData(this.presets[newIdx]);

    // Save to storage (persisting activePresetIdx and preset updates)
    this.saveToStorage();
  }

  getPreset(idx) {
    if (this.presets && this.presets[idx]) {
      return this.presets[idx];
    }
    return (typeof window !== 'undefined' && window.FACTORY_PRESETS) ? window.FACTORY_PRESETS[idx] : null;
  }

  resetCurrentPreset() {
    if (this.activePresetIdx === null || this.activePresetIdx === undefined) return;
    const defaults = this._getDefaultPresets();
    if (defaults[this.activePresetIdx]) {
      this.presets[this.activePresetIdx] = JSON.parse(JSON.stringify(defaults[this.activePresetIdx]));
      this.applyPresetData(this.presets[this.activePresetIdx]);
      this.saveToStorage();
      if (this.onChainChanged) this.onChainChanged();
    }
  }

  resetAllPresets() {
    this.clearSavedState();
    this.presets = this._getDefaultPresets();
    this.activePresetIdx = 0;
    this.applyPresetData(this.presets[0]);
    this.saveToStorage();
    if (this.onChainChanged) this.onChainChanged();
  }

  loadPreset(preset) {
    this.applyPresetData(preset);
    this.updateActivePresetFromCurrent();
    this.saveToStorage();
  }
}

window.ChainState = ChainState;
