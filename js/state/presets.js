/**
 * Factory & User Presets
 * Showcases full collection of Iconic Global Brands:
 * Amps: Fender, Marshall, Vox, Mesa/Boogie, Orange
 * Pedals: Boss, Ibanez, Electro-Harmonix, MXR, ProCo, Dunlop
 */
const FACTORY_PRESETS = [
  {
    id: 'p1',
    name: 'Texas Flood (SRV Style)',
    genre: 'Blues / Dynamic Crunch',
    amp: {
      type: 'fender_twin',
      cab: 'fender_2x12',
      params: { volume: 55, bright: true, treble: 62, middle: 48, bass: 52, reverb: 35, master: 70 }
    },
    pedals: [
      {
        type: 'ts9',
        bypassed: false,
        params: { drive: 42, tone: 55, level: 78 }
      },
      {
        type: 'rv5',
        bypassed: false,
        params: { level: 32, tone: 45, time: 42, mode: 'spring' }
      }
    ]
  },
  {
    id: 'p2',
    name: 'Pink Floyd Comfortably Numb',
    genre: 'Progressive / Psychedelic Rock',
    amp: {
      type: 'vox_ac30',
      cab: 'vox_2x12',
      params: { normalVol: 40, topBoostVol: 65, bass: 55, treble: 68, toneCut: 30, master: 70 }
    },
    pedals: [
      {
        type: 'bigmuff',
        bypassed: false,
        params: { volume: 72, tone: 52, sustain: 78 }
      },
      {
        type: 'phase90',
        bypassed: false,
        params: { speed: 32, mode: 'script' }
      },
      {
        type: 'dd7',
        bypassed: false,
        params: { level: 50, feedback: 45, time: 55, mode: 'analog' }
      }
    ]
  },
  {
    id: 'p3',
    name: 'Master of Puppets (Thrash Metal)',
    genre: 'Modern High-Gain Thrash Metal',
    amp: {
      type: 'mesa_dualrect',
      cab: 'mesa_4x12',
      params: { gain: 80, bass: 65, middle: 38, treble: 72, presence: 70, rectifier: 'silicon', master: 65 }
    },
    pedals: [
      {
        type: 'ns2',
        bypassed: false,
        params: { threshold: 55, decay: 30 }
      },
      {
        type: 'rat2',
        bypassed: false,
        params: { dist: 40, filter: 48, volume: 80 }
      }
    ]
  },
  {
    id: 'p4',
    name: 'Voodoo Child Wah & Fuzz',
    genre: 'Psychedelic Blues / Rock',
    amp: {
      type: 'fender_twin',
      cab: 'fender_2x12',
      params: { volume: 60, bright: true, treble: 65, middle: 50, bass: 55, reverb: 40, master: 68 }
    },
    pedals: [
      {
        type: 'crybaby',
        bypassed: false,
        params: { rocker: 65, q_peak: 75, mode: 'auto', auto_rate: 45 }
      },
      {
        type: 'bd2',
        bypassed: false,
        params: { level: 65, tone: 58, gain: 55 }
      }
    ]
  },
  {
    id: 'p5',
    name: 'Orange Desert Stoner Fuzz',
    genre: 'Stoner / Desert / Doom Rock',
    amp: {
      type: 'orange_rockerverb',
      cab: 'orange_4x12',
      params: { gain: 75, bass: 68, middle: 75, treble: 52, attenuator: 80, master: 70 }
    },
    pedals: [
      {
        type: 'bigmuff',
        bypassed: false,
        params: { volume: 65, tone: 45, sustain: 82 }
      },
      {
        type: 'tr2',
        bypassed: false,
        params: { rate: 35, wave: 30, depth: 65 }
      }
    ]
  },
  {
    id: 'p6',
    name: 'Van Halen Brown Sound 1978',
    genre: 'Classic Hard Rock',
    amp: {
      type: 'marshall_jcm800',
      cab: 'marshall_4x12',
      params: { gain: 82, master: 70, treble: 65, middle: 68, bass: 58, presence: 65 }
    },
    pedals: [
      {
        type: 'phase90',
        bypassed: false,
        params: { speed: 38, mode: 'script' }
      },
      {
        type: 'dd3',
        bypassed: false,
        params: { level: 38, feedback: 32, time: 35, mode: '200ms' }
      }
    ]
  },
  {
    id: 'p7',
    name: 'Marshall DSL20 Modern Lead',
    genre: 'Hard Rock / High Gain',
    amp: {
      type: 'marshall_dsl20',
      cab: 'marshall_4x12',
      params: { channel: 'ultra', ultra_gain: 78, ultra_vol: 72, treble: 58, middle: 68, bass: 60, presence: 65, resonance: 58, reverb: 30 }
    },
    pedals: [
      {
        type: 'ns2',
        bypassed: false,
        params: { threshold: 45, decay: 40 }
      },
      {
        type: 'sd1',
        bypassed: false,
        params: { drive: 35, tone: 55, level: 75 }
      },
      {
        type: 'dd3',
        bypassed: false,
        params: { time: 55, feedback: 38, level: 45, mode: '800ms' }
      }
    ]
  },
  {
    id: 'p8',
    name: 'Fender Acoustasonic Ambient Chime',
    genre: 'Acoustic / Clean / Chorus',
    amp: {
      type: 'fender_acoustasonic',
      cab: 'fender_2x12',
      params: { vol1: 45, vol2: 65, bass: 55, middle: 48, treble: 65, chorus: 45 }
    },
    pedals: [
      {
        type: 'cs3',
        bypassed: false,
        params: { level: 68, tone: 52, attack: 40, sustain: 55 }
      },
      {
        type: 'ch1',
        bypassed: false,
        params: { level: 60, eq: 55, rate: 35, depth: 75 }
      },
      {
        type: 'rv5',
        bypassed: false,
        params: { level: 45, tone: 50, time: 60, mode: 'plate' }
      }
    ]
  }
];

window.FACTORY_PRESETS = FACTORY_PRESETS;
