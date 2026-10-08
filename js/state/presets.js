/**
 * Factory & User Presets
 * Showcases full collection of Boss Pedals and Fender/Marshall Amps
 */
const FACTORY_PRESETS = [
  {
    id: 'p1',
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
    id: 'p2',
    name: 'Fender Acoustasonic Chime',
    genre: 'Acoustic / Clean / Chorus',
    amp: {
      type: 'fender_acoustasonic',
      cab: 'fender_2x12',
      params: { vol1: 50, vol2: 65, bass: 55, middle: 48, treble: 65, chorus: 45 }
    },
    pedals: [
      {
        type: 'cs3',
        bypassed: false,
        params: { level: 68, tone: 52, attack: 40, sustain: 55 }
      },
      {
        type: 'rv5',
        bypassed: false,
        params: { level: 40, tone: 50, time: 55, mode: 'plate' }
      }
    ]
  },
  {
    id: 'p3',
    name: 'Nirvana DS-2 Turbo Grunge',
    genre: 'Grunge / 90s Alternative',
    amp: {
      type: 'marshall_dsl20',
      cab: 'marshall_4x12',
      params: { channel: 'classic', classic_gain: 60, classic_vol: 75, treble: 60, middle: 65, bass: 55, presence: 60, resonance: 50, reverb: 25 }
    },
    pedals: [
      {
        type: 'ds2',
        bypassed: false,
        params: { level: 70, tone: 52, dist: 78, turbo: 'turbo_ii' }
      },
      {
        type: 'ch1',
        bypassed: false,
        params: { level: 60, eq: 55, rate: 40, depth: 75 }
      }
    ]
  },
  {
    id: 'p4',
    name: 'Texas Blues (SRV Style)',
    genre: 'Blues / Dynamic Crunch',
    amp: {
      type: 'fender_twin',
      cab: 'fender_2x12',
      params: { volume: 55, bright: true, treble: 60, middle: 45, bass: 55, reverb: 35, master: 70 }
    },
    pedals: [
      {
        type: 'bd2',
        bypassed: false,
        params: { level: 68, tone: 52, gain: 48 }
      },
      {
        type: 'rv5',
        bypassed: false,
        params: { level: 30, tone: 45, time: 40, mode: 'spring' }
      }
    ]
  },
  {
    id: 'p5',
    name: 'Vintage Tremolo Surf & Pop',
    genre: 'Retro 60s / Surf',
    amp: {
      type: 'fender_twin',
      cab: 'fender_2x12',
      params: { volume: 48, bright: true, treble: 65, middle: 45, bass: 50, reverb: 55, master: 72 }
    },
    pedals: [
      {
        type: 'tr2',
        bypassed: false,
        params: { rate: 55, wave: 40, depth: 75 }
      },
      {
        type: 'ge7',
        bypassed: false,
        params: { b100: 0, b200: 2, b400: -2, b800: 1, b1600: 3, b3200: 4, b6400: 2, level: 1 }
      }
    ]
  },
  {
    id: 'p6',
    name: 'Heavy Metal High Gain DS-1',
    genre: '80s Heavy Metal',
    amp: {
      type: 'marshall_jcm800',
      cab: 'marshall_4x12',
      params: { gain: 80, master: 70, treble: 65, middle: 65, bass: 60, presence: 68 }
    },
    pedals: [
      {
        type: 'ns2',
        bypassed: false,
        params: { threshold: 50, decay: 35 }
      },
      {
        type: 'ds1',
        bypassed: false,
        params: { level: 68, tone: 48, dist: 72 }
      },
      {
        type: 'dd3',
        bypassed: false,
        params: { level: 42, feedback: 36, time: 50, mode: '800ms' }
      }
    ]
  },
  {
    id: 'p7',
    name: 'OS-2 Blended Color Crunch',
    genre: 'Modern Rock',
    amp: {
      type: 'marshall_dsl20',
      cab: 'marshall_greenback',
      params: { channel: 'classic', classic_gain: 50, classic_vol: 70, treble: 55, middle: 65, bass: 55, presence: 58, resonance: 52, reverb: 20 }
    },
    pedals: [
      {
        type: 'os2',
        bypassed: false,
        params: { level: 65, tone: 52, drive: 60, color: 55 }
      },
      {
        type: 'ce2',
        bypassed: false,
        params: { rate: 35, depth: 60 }
      }
    ]
  },
  {
    id: 'p8',
    name: 'Ambient Dream Delay & Hall',
    genre: 'Shoegaze / Ambient',
    amp: {
      type: 'fender_acoustasonic',
      cab: 'fender_2x12',
      params: { vol1: 40, vol2: 60, bass: 50, middle: 50, treble: 60, chorus: 25 }
    },
    pedals: [
      {
        type: 'ch1',
        bypassed: false,
        params: { level: 65, eq: 50, rate: 30, depth: 80 }
      },
      {
        type: 'dd3',
        bypassed: false,
        params: { level: 58, feedback: 65, time: 65, mode: '800ms' }
      },
      {
        type: 'rv5',
        bypassed: false,
        params: { level: 70, tone: 60, time: 85, mode: 'hall' }
      }
    ]
  }
];

window.FACTORY_PRESETS = FACTORY_PRESETS;
