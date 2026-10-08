/**
 * Application Version and Update Manager
 * Manages version metadata, semantic version bumping, and update checking.
 */
(function(window) {
  'use strict';

  const DEFAULT_VERSION = 'V1.1.0';
  const APP_NAME = 'VINTAGE RIG PRO GUITAR STUDIO';

  const CHANGELOG = [
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
