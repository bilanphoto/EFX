/**
 * Application Version and Update Manager
 * Manages version metadata, semantic version bumping, and update checking.
 */
(function(window) {
  'use strict';

  const DEFAULT_VERSION = 'V1.1.4';
  const APP_NAME = 'VINTAGE RIG PRO GUITAR STUDIO';

  const CHANGELOG = [
    {
      version: 'V1.1.4',
      date: '2026-10-11',
      title: 'Eliminate Parallel Dry Audio Leak & Restore Full Signal Chain Control',
      items: [
        'แก้ปัญหาวอลุมและปุ่มปรับทุกตัวไม่ทำงาน / เสียงไม่เปลี่ยนเมื่อเหยียบเอฟเฟค (Total Parallel Dry Leak Fix): แก้ไขข้อผิดพลาดของ Web Audio API ที่ GainNode บายพาสเสียงสด (directMonitorGain, dryNode) มีค่าเริ่มต้นเป็น 1.0 และเชื่อมตรงสู่ Master ข้ามแอมป์และเอฟเฟค ปัจจุบันตัดการเชื่อมต่อ directMonitor ทั้งหมดโดยค่าเริ่มต้น และตั้งค่า dryNode = 0.0 ในทุกก้อนและทุกแอมป์',
        'แก้ไขระบบตัดต่อสายสัญญาณ (Audio Graph Rebuild Safety): แก้ไขข้อผิดพลาดที่คำสั่ง disconnect() ไปตัดสายภายในของก้อนเอฟเฟคและตู้แอมป์ (inputNode ภายใน) ทำให้สัญญาณในสายเอฟเฟคเงียบ และเหลือเพียงเสียงดิบ ตอนนี้ระบบใช้ safe disconnect เฉพาะ outgoing connections พร้อมฟังก์ชัน ensureInternalConnections() ทำให้ก้อนเอฟเฟคและแอมป์ได้รับสัญญาณเต็ม 100%',
        'วอลุมมาสเตอร์และปุ่มปรับทุกตัวตอบสนองทันที: เมื่อปรับวอลุมมาสเตอร์ของแอมป์ลงสุดที่ 0 เสียงจะเงียบสนิท 100% ไม่มีเสียงกีตาร์คลีนเล็ดลอดออกมาอีกต่อไป และปุ่มปรับ Level, Gain, Tone, EQ บนก้อนและแอมป์ทุกตัวส่งผลต่อเสียงสดทันทีแบบเรียลไทม์',
        'แก้ปัญหาเสียงวูบวาบเหมือนแกว่งไปมา (Phase Comb-Filtering Eradicated): เสียงวูบวาบเกิดจากเสียงดิบที่เล็ดลอดคู่ขนาน (Latency 0ms) ไปรวมกับเสียงที่ผ่านวงจรเอฟเฟค (Latency 5-15ms) จนเกิด Phase Cancellation และ Comb Filtering เมื่อตัดเสียงดิบที่รั่วไหลออกทั้งหมด เสียงกีตาร์จึงดัง นิ่ง ตรง และกังวานตามธรรมชาติ',
        'ปรับจูน Fender Acoustasonic Amp ให้วอลุมลงสุดเงียบสนิท: ปรับสูตรความดังของ Channel 2 Vol จากเดิมที่ค้างอยู่ที่ 0.5 ให้สามารถปรับลดลงถึง 0.0 ได้อย่างสมบูรณ์'
      ]
    },
    {
      version: 'V1.1.3',
      date: '2026-10-11',
      title: 'Natural Guitar Sustain Engine & Roaring High-Gain Distortion Restored',
      items: [
        'แก้ปัญหาเสียงไม่คงที่ วอลุมวูบวาบเหมือนคนหมุนปุ่มเสียงขึ้นๆ ลงๆ (Master Limiter Pumping & Flutter Fix): ปรับปรุง Master Dynamics Compressor จากเดิมที่บีบอัดเสียงแบบกระตุก (Hard Knee 20:1, Release 50ms) ให้เป็น Master Transparent Compressor สไตล์สตูดิโอ (Soft Knee 12dB, Release 250ms พร้อม Soft Ceiling Waveshaper 0.92) หางเสียงยาวต่อเนื่องราบเรียบ ไม่สั่นสะเทือนหรือแกว่งไปมา',
        'แก้ปัญหาก้อนเสียงแตกไม่มีเสียงแตกเลย (Zero Distortion Fix): แก้ไขวงจร Pre-Filter ของก้อนเอฟเฟคเสียงแตก (Boss DS-1, DS-2, OS-2, Ibanez TS9, ProCo Rat 2, Big Muff ฯลฯ) ที่เดิมตั้ง Highpass Filter สูงถึง 400Hz-720Hz ทำให้เสียงโน้ตสายล่าง (Low E 82Hz - D 147Hz) ถูกตัดหายไปจนสัญญาณไม่ถึงจุดคลิปปิ้ง โดยปรับลดลงมาที่ Subsonic 75Hz ให้เนื้อเสียงกีตาร์ผ่านเข้าสู่จุดอิ่มตัวได้ 100%',
        'เพิ่มพลังเกน Drive/Distortion ของก้อนเสียงแตกทุกตัว: ขยายตัวคูณเกนขยายสัญญาณเข้าภาค Clipping Diodes และ Waveshaper ให้สมจริงเทียบเท่าวงจรเหยียบจริง เสียงแตกดุดัน หนา แน่น หวานฉ่ำ เมื่อดีดเบา-ดีดหนัก ตอบสนองตามน้ำหนักมือ (Touch Dynamics)',
        'เพิ่มระบบ Instrument Preamp Normalization (+12dB / +18dB Boost): สัญญาณกีตาร์จาก Audio Interface (Hi-Z Input) จะถูกปรับขยายให้มีระดับความแรงสมดุลในระดับสตูดิโอ (+12dB เป็นค่าเริ่มต้น) ทำให้เอฟเฟคและตู้แอมป์ทำงานในจุด Sweet Spot ทันที',
        'ปรับปรุง Noise Gate (Boss NS-2): เพิ่มระบบ Hold Time 120ms และ Hysteresis 3.5dB ป้องกันประตูกลั้นเสียงสับกระพริบขณะหางเสียงกีตาร์ค่อยๆ เบาลง ช่วยให้โน้ตลากยาวได้นาน 5-8 วินาทีขึ้นไปอย่างนุ่มนวล',
        'เพิ่มคำแนะนำการตั้งค่าไมโครโฟนสำหรับผู้ใช้ macOS: แสดงแถบแจ้งเตือนเมื่อเปิดใช้งาน GUITAR IN บน Mac เพื่อแนะนำให้ปรับโหมดไมค์จาก "Voice Isolation (แยกเสียงพูด)" เป็น "Standard (มาตรฐาน)" เพื่อป้องกันไม่ให้ระบบตัดเสียงรบกวนของ Mac ตัดเสียงหางกีตาร์'
      ]
    },
    {
      version: 'V1.1.2',
      date: '2026-10-11',
      title: 'Pro Stage Tuner Modal & Anti-Flicker Pitch Engine',
      items: [
        'แก้ปัญหาตัวโน้ต A-G และความถี่กระพริบ (Anti-Flicker): เพิ่มวงจรกรองความถี่ Lowpass 750Hz ตัดเสียงฮาร์โมนิคกวน และ McLeod Pitch Method ตรวจจับระดับเสียง fundamental อย่างแม่นยำ',
        'ระบบค้างโน้ตและค่าความถี่นิ่งสนิท (Note-Hold Grace Period 1.8s): โน้ตและความถี่จะค้างอยู่อย่างนิ่งชัดเจนหลังดีดสาย ไม่กระพริบวูบวาบหรือหายไปแบบเดิม',
        'เพิ่มหน้าต่างโมดอลตั้งสายขนาดใหญ่ (Pro Stage Guitar Tuner Modal): หน้าจอจูนเนอร์ขนาดใหญ่สไตล์โปร มีตัวอักษรโน้ตขนาดยักษ์ (80px), เข็มวัดแอนะล็อกความแม่นยำสูง และหลอดไฟ LED 21 ช่อง',
        'ไฟแนะนำการหมุนลูกบิด 3 ทิศทาง: FLAT (หย่อน) ◀◀, IN TUNE (ตรงคีย์) ●, และ SHARP (ตึง) ▶▶',
        'ปุ่มทางลัดตั้งสาย 6 สายกีตาร์ (6-String Targets): ไฮไลท์สายที่กำลังดีดโดยอัตโนมัติ พร้อมปุ่มฟังเสียงเทียบเสียงต้นแบบ (Reference Tone)',
        'ปุ่ม MUTE OUT ปิดเสียงลำโพงขณะตั้งสายบนเวที และพรีเซ็ตตั้งสายยอดนิยม 8 แบบ (Standard, Drop D, Half-Step Down, Full-Step Down, Open D, Open G, DADGAD, Chromatic)'
      ]
    },
    {
      version: 'V1.1.1',
      date: '2026-10-11',
      title: 'Live Input Signal Oscilloscope & Audio Interface Pro Routing',
      items: [
        'เพิ่มกราฟตรวจจับคลื่นสัญญาณเสียงเข้าสด (Live Input Oscilloscope) และ Segmented LED Level Meter แสดงค่า dB และสถานะตรวจจับสัญญาณเรียลไทม์',
        'แก้ปัญหาต่อ Audio Interface แล้วไม่มีเสียงเข้า (ใน GarageBand ดังแต่เว็บบราวเซอร์เงียบ) ด้วยระบบ Hardware Channel Selector [CH 1], [CH 2 (Inst)], [1+2] รองรับช่องเสียบสายกีตาร์ Hi-Z ทุกยี่ห้อ (Scarlett, Behringer, iRig, ฯลฯ)',
        'เพิ่มระบบเลือกและค้นหาอุปกรณ์การ์ดเสียง (Audio Interface Selector) พร้อมปุ่มรีเฟรชอุปกรณ์อัตโนมัติ',
        'เพิ่มโหมด Direct Dry Audition ฟังเสียงกีตาร์สดตรงๆ ไม่ผ่านเอฟเฟค เพื่อทดสอบสายแจ็คและเกนสัญญาณ',
        'เพิ่มสวิตช์เลือกต้นทางสัญญาณบนจอ CRT Signal Monitor (SRC: GUITAR IN / MASTER OUT) และปุ่มเร่งเกนสัญญาณอินพุต (+6dB / +12dB Boost)'
      ]
    },
    {
      version: 'V1.1.0',
      date: '2026-10-08',
      title: 'Iconic Global Brands Expansion (Amps & Stompboxes)',
      items: [
        'เพิ่มแอมป์หลอดระดับโลก 3 ยี่ห้อดัง: Vox AC30 Top Boost (UK), Mesa/Boogie Dual Rectifier (USA), และ Orange Rockerverb 50 MKIII (UK)',
        'เพิ่มเอฟเฟคก้อนระดับตำนาน 5 ยี่ห้อชั้นนำ: Ibanez TS9 Tube Screamer, Electro-Harmonix Big Muff Pi, MXR Phase 90, ProCo Rat 2, และ Dunlop Cry Baby Wah',
        'จำลองเสียง DSP ตรงตามคาแรคเตอร์วงจรฮาร์ดแวร์จริง (EL84 Class-A Chime, 6L6 Tube Sag, Fasel Inductor Wah, 4-stage Fuzz & Phaser)',
        'เพิ่มระบบตู้ลำโพง Cabinet Simulator IR (Mesa 4x12 V30, Orange 4x12 PPC) และ 8 พรีเซ็ตศิลปินระดับโลก (SRV, Pink Floyd, Metallica, EVH, Hendrix)'
      ]
    },
    {
      version: 'V1.0.1',
      date: '2026-10-08',
      title: 'Studio Menu Dropdown & App Info System',
      items: [
        'รวมแผงควบคุมหลักด้านบนเข้าสู่เมนูดรอปดาวน์ ⚙️ MENU สวยงามและไม่ล้นจอเล็ก',
        'เพิ่มปุ่ม Info และหน้าต่างข้อมูลเกี่ยวกับแอพ (About Modal) เวอร์ชั่น V1.0.1',
        'ระบบจัดการเวอร์ชั่นและเพิ่มเวอร์ชั่นอัตโนมัติเมื่อมีการอัปเดต (Semantic Version Bumping)'
      ]
    },
    {
      version: 'V1.0.0',
      date: '2026-10-08',
      title: 'Initial Pro Guitar Rig Release',
      items: [
        'ชุดแร็คเอฟเฟคกีตาร์ 27 ก้อนตระกูล Boss ครบวงจร (Distortion, Chorus, Delay, Wah, EQ ฯลฯ)',
        'ตู้แอมป์หลอดระดับตำนาน 4 รุ่น (Marshall DSL20, Fender Acoustasonic, Vox AC30, Mesa)',
        'ระบบ Rig Memory จำค่าเอฟเฟคและลูกบิดแยกอิสระ 8 Presets พร้อมระบบบันทึกอัตโนมัติ (Auto-Save)',
        'ระบบตั้งสายกีตาร์แบบเข็มดิจิตอลความแม่นยำสูง (Digital Chromatic Tuner)',
        'แถบ Guitar Player Dock ด้านล่างพร้อมแป้นเล่นคอร์ด 12 คอร์ด และจอ CRT Signal Monitor'
      ]
    }
  ];

  function parseVersion(vStr) {
    const clean = String(vStr).replace(/^v/i, '').trim();
    const parts = clean.split('.').map(n => parseInt(n, 10) || 0);
    while (parts.length < 3) parts.push(0);
    return parts;
  }

  function formatVersion(parts) {
    return `V${parts[0]}.${parts[1]}.${parts[2]}`;
  }

  function incrementVersion(vStr, type = 'patch') {
    const parts = parseVersion(vStr);
    if (type === 'major') {
      parts[0] += 1;
      parts[1] = 0;
      parts[2] = 0;
    } else if (type === 'minor') {
      parts[1] += 1;
      parts[2] = 0;
    } else {
      parts[2] += 1;
    }
    return formatVersion(parts);
  }

  class VersionManager {
    constructor() {
      this.appName = APP_NAME;
      this.defaultVersion = DEFAULT_VERSION;
      this.changelog = [...CHANGELOG];
      this.storageKey = 'VINTAGE_RIG_APP_VERSION';
      this.customChangelogKey = 'VINTAGE_RIG_CUSTOM_CHANGELOG';
      
      this.loadSavedVersion();
    }

    loadSavedVersion() {
      try {
        const saved = localStorage.getItem(this.storageKey);
        this.currentVersion = saved || this.defaultVersion;

        // If saved version has lower version than default, upgrade to default
        if (this.compare(this.defaultVersion, this.currentVersion) > 0) {
          this.currentVersion = this.defaultVersion;
          localStorage.setItem(this.storageKey, this.currentVersion);
        }

        const customChangelog = localStorage.getItem(this.customChangelogKey);
        if (customChangelog) {
          const parsed = JSON.parse(customChangelog);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.changelog = [...parsed, ...CHANGELOG];
          }
        }
      } catch (e) {
        this.currentVersion = this.defaultVersion;
      }
    }

    compare(v1, v2) {
      const p1 = parseVersion(v1);
      const p2 = parseVersion(v2);
      for (let i = 0; i < 3; i++) {
        if (p1[i] > p2[i]) return 1;
        if (p1[i] < p2[i]) return -1;
      }
      return 0;
    }

    getVersion() {
      return this.currentVersion;
    }

    bumpVersion(type = 'patch', noteText = '') {
      const oldVer = this.currentVersion;
      const nextVer = incrementVersion(oldVer, type);
      this.currentVersion = nextVer;
      try {
        localStorage.setItem(this.storageKey, nextVer);
        
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const newEntry = {
          version: nextVer,
          date: dateStr,
          title: `อัปเดตเวอร์ชั่น ${nextVer}`,
          items: [
            noteText || `อัปเดตปรับปรุงประสิทธิภาพสตูดิโอ (Build ${now.toLocaleTimeString()})`
          ]
        };
        const customLogs = JSON.parse(localStorage.getItem(this.customChangelogKey) || '[]');
        customLogs.unshift(newEntry);
        localStorage.setItem(this.customChangelogKey, JSON.stringify(customLogs));
        this.changelog.unshift(newEntry);
      } catch (e) {
        console.warn('Could not save version to localStorage', e);
      }
      this.render();
      return nextVer;
    }

    async checkForUpdates() {
      try {
        const repoUrl = 'https://api.github.com/repos/bilanphoto/EFX/commits/main';
        const res = await fetch(repoUrl, { cache: 'no-store' });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        const commitSha = data.sha ? data.sha.substring(0, 7) : '';
        const commitMsg = data.commit?.message || '';
        const commitDate = data.commit?.author?.date || '';
        
        return {
          success: true,
          sha: commitSha,
          message: commitMsg,
          date: commitDate
        };
      } catch (err) {
        return {
          success: false,
          error: err.message
        };
      }
    }

    render() {
      // 1. Header pill
      const headerPill = document.getElementById('header-version-pill');
      if (headerPill) {
        headerPill.innerText = this.currentVersion;
      }

      // 2. Modal version displays
      const infoVerDisplay = document.getElementById('info-version-display');
      if (infoVerDisplay) {
        infoVerDisplay.innerText = this.currentVersion;
      }

      const infoCurrentVerText = document.getElementById('info-current-ver-text');
      if (infoCurrentVerText) {
        infoCurrentVerText.innerText = this.currentVersion;
      }

      // 3. Changelog list
      const changelogList = document.getElementById('changelog-list');
      if (changelogList) {
        changelogList.innerHTML = '';
        this.changelog.forEach(entry => {
          const itemDiv = document.createElement('div');
          itemDiv.className = 'changelog-card';
          
          const isLatest = (entry.version === this.currentVersion);
          
          itemDiv.innerHTML = `
            <div class="changelog-header">
              <span class="changelog-badge ${isLatest ? 'latest' : ''}">${entry.version}</span>
              <span class="changelog-title-text">${entry.title}</span>
              <span class="changelog-date">${entry.date}</span>
            </div>
            <ul class="changelog-items">
              ${(entry.items || []).map(li => `<li>${li}</li>`).join('')}
            </ul>
          `;
          changelogList.appendChild(itemDiv);
        });
      }
    }

    initUI() {
      this.render();

      const infoModal = document.getElementById('info-modal');
      const brandTrigger = document.getElementById('brand-info-trigger');
      const infoBtn = document.getElementById('app-info-btn');
      const modalClose = document.getElementById('info-modal-close-btn');
      const checkUpdateBtn = document.getElementById('check-update-btn');
      const bumpBtn = document.getElementById('bump-version-btn');
      const updateMsg = document.getElementById('update-status-msg');
      const updateSpinner = document.getElementById('update-spinner');

      const openModal = () => {
        if (infoModal) {
          infoModal.classList.add('open');
          this.render();
        }
      };

      const closeModal = () => {
        if (infoModal) {
          infoModal.classList.remove('open');
        }
      };

      if (brandTrigger) {
        brandTrigger.addEventListener('click', openModal);
        brandTrigger.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openModal();
          }
        });
      }

      if (infoBtn) {
        infoBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openModal();
        });
      }

      if (modalClose) {
        modalClose.addEventListener('click', closeModal);
      }

      if (infoModal) {
        infoModal.addEventListener('click', (e) => {
          if (e.target === infoModal) {
            closeModal();
          }
        });
      }

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && infoModal && infoModal.classList.contains('open')) {
          closeModal();
        }
      });

      // Check for updates button
      if (checkUpdateBtn) {
        checkUpdateBtn.addEventListener('click', async () => {
          if (updateSpinner) updateSpinner.classList.add('active');
          if (updateMsg) updateMsg.innerText = 'กำลังเชื่อมต่อตรวจสอบการอัปเดตจากคลาวด์/GitHub...';
          checkUpdateBtn.disabled = true;

          const res = await this.checkForUpdates();
          if (updateSpinner) updateSpinner.classList.remove('active');
          checkUpdateBtn.disabled = false;

          if (res.success) {
            if (updateMsg) {
              updateMsg.innerHTML = `
                <span style="color: #34d399;">✓ เชื่อมต่อสำเร็จ!</span><br>
                ล่าสุดบน GitHub: Commit <code>${res.sha}</code> ("${res.message.slice(0, 45)}...")<br>
                สตูดิโอของคุณพร้อมใช้งานเวอร์ชั่น ${this.currentVersion}
              `;
            }
          } else {
            if (updateMsg) {
              updateMsg.innerHTML = `
                <span style="color: #fbbf24;">ℹ️ ตรวจสอบเรียบร้อย:</span> กำลังใช้งานระบบแบบ Local/ออฟไลน์ เวอร์ชั่น ${this.currentVersion}
              `;
            }
          }
        });
      }

      // Bump version button (+ เพิ่มเวอร์ชั่น)
      if (bumpBtn) {
        bumpBtn.addEventListener('click', () => {
          const oldV = this.currentVersion;
          const newV = this.bumpVersion('patch', 'ปรับปรุงระบบและบันทึกการเปลี่ยนแปลงสตูดิโอ');
          
          if (updateMsg) {
            updateMsg.innerHTML = `<span style="color: #34d399;">✓ เพิ่มเวอร์ชั่นสำเร็จ: ${oldV} ➔ <strong>${newV}</strong></span>`;
          }

          const toast = document.getElementById('preset-toast');
          if (toast) {
            toast.innerText = `อัปเดตเวอร์ชั่นสตูดิโอเป็น ${newV} เรียบร้อย!`;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2200);
          }
        });
      }
    }
  }

  window.AppVersion = new VersionManager();
})(window);
