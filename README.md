# Boss Guitar Effects Rig & Vintage Amps Studio

เว็บแอปพลิเคชันจำลองชุดเอฟเฟคกีตาร์ Boss และตู้แอมป์ Marshall, Fender ด้วย Web Audio API แท้ระดับสตูดิโอ จัดวางเลย์เอาต์สไตล์ AmpliTube Studio Rack (ตามภาพอ้างอิง) ให้มองเห็นบอร์ดเอฟเฟคและตู้แอมป์พร้อมกัน ปรับหมุนปุ่มได้สดทันทีโดยไม่ต้องคลิกสลับหน้าจอ

---

## ฟีเจอร์หลัก (Key Features)

### 1. เลย์เอาต์สตูดิโอแบบ AmpliTube Studio Rack (2 ชั้นพร้อมกัน)
- **ชั้นบน (Top Floor) - Pedalboard Rack**: แสดงก้อนเอฟเฟค Boss ทุกตัวที่กำลังใช้งานวางเรียงต่อกันบนรางไม้ สามารถหมุนลูกบิดปรับค่าได้สดๆ, เหยียบสวิตช์ Footpad เปิด/ปิด Bypass, สลับลำดับซ้าย-ขวา (◀ ▶), หรือลบก้อนออกได้ทันที พร้อมปุ่ม `+ ADD EFFECT`
- **ชั้นล่าง (Lower Floor) - Guitar Amplifier & Cabinet**: แสดงหน้าตู้แอมป์และปุ่มหมุนสีทอง/สีดำของ Marshall และ Fender อย่างสมจริง พร้อมสวิตช์เปิด-ปิดไฟเรืองแสง, เลือกแชนแนล Classic/Ultra Gain, ปรับสลับรุ่นตู้แอมป์และตู้ลำโพงคาบิเน็ตได้ทันที
- **แถบล่างสุด (Bottom Studio Dock)**: แผงเล่นกีตาร์เสมือนจริง (Virtual Guitar Player) ประกอบด้วยสายกีตาร์ 6 สายกรีดดีดได้จริง, ปุ่มคอร์ดสำเร็จรูป, ระบบ Jam Tracks (Backing Track), ช่องเสียบสายกีตาร์จริง (Live Input), และจอมอนิเตอร์ CRT Oscilloscope / FFT Spectrum

---

### 2. โมเดลตู้แอมป์เสมือนจริงตรงตามรูปภาพอ้างอิง
1. **Marshall DSL20 Combo** (ภาพอ้างอิงที่ 2):
   - หน้าปัดสีทองขัดเงา (Brushed Gold Faceplate)
   - 2 แชนแนลสมบูรณ์: **Classic Gain** (Gain, Volume) และ **Ultra Gain** (Gain, Volume) พร้อมปุ่มกดสลับ Channel
   - ชุด EQ: Treble, Middle, Bass, Presence, Resonance, Reverb
   - สวิตช์ไฟ Rocker Switch สีแดงเรืองแสง และผ้าหน้าตู้ลายตาข่าย Marshall สีดำพร้อมโลโก้ Marshall ตัวเขียนสีขาวขนาดใหญ่
2. **Fender Acoustasonic 15** (ภาพอ้างอิงที่ 1):
   - ตู้หุ้มหนัง Tolex สีเบจ/น้ำตาลอ่อน (Tan Combo)
   - หน้าปัดสีน้ำตาลทองแดง พร้อมช่อง XLR ไมค์ (Channel 1) และ 1/4" แจ็ค (Channel 2)
   - 3-Band EQ: Bass, Middle, Treble พร้อมลูกบิด Chorus ปรับเสียงประสานฉ่ำกังวาน
   - ไฟ LED ทรงกลมสีแดง และโลโก้ Fender ตัวเขียนแบบเอียง (Slanted Script)
3. **Fender '65 Twin Reverb**:
   - แอมป์หลอดคลีน Glassy Chime สไตล์ Blackface ยุค 60s
   - สวิตช์ Bright, Volume, Treble, Middle, Bass, Reverb, Master, และหลอดไฟนำร่องสีแดงเจียระไน (Red Jewel Lamp)
4. **Marshall JCM800 2203**:
   - แอมป์หลอดเฮฟวี่เมทัล/ฮาร์ดร็อก เสียงแตกหนาดุดัน High Gain British Roar
5. **Cabinet Simulator & Microphone**:
   - Marshall 1960A 4x12 Celestion G12T-75
   - Fender 2x12 Jensen C12N
   - Marshall Greenback 70s
   - Vox AC30 2x12 Alnico Blue
   - เลือกตำแหน่งไมค์ได้ทั้ง On-Axis (พุ่งคมชัด) และ Off-Axis (นุ่มอุ่น)

---

### 3. คลังก้อนเอฟเฟค Boss ครบชุด 20 รุ่นตรงตามรูปภาพอ้างอิงล่าสุด + รุ่นคลาสสิก (Boss Pedal Library 27 รุ่น)
ถอดแบบหน้าตาและวงจร DSP ตามภาพถ่ายชุดเอฟเฟค Boss ตาราง 4x5 ครบทุกตัว 100%:
1. **Boss FRV-1 '63 Fender Reverb** (น้ำตาล) - สปริงรีเวิร์บหลอดวินเทจ '63 พร้อม Mixer, Tone, Dwell
2. **Boss DM-2w Delay Waza Craft** (แดงไวน์) - อะนาล็อกดีเลย์ BBD วินเทจ อุ่นหนา พร้อมสวิตช์ Custom/Standard
3. **Boss JB-2 Angry Driver** (ขาว) - การรวมร่างของ Boss Blues Driver + JHS Angry Charlie เสียงแตก Marshall ไฮเกน
4. **Boss CE-2w Chorus Waza Craft** (ฟ้า) - คอรัสในตำนาน CE-2 และ CE-1 วงจรอะนาล็อก BBD ฉ่ำหวาน
5. **Boss TU-3 Chromatic Tuner** (ขาว) - จูนเนอร์ตั้งสายบนเวทีระดับมาตรฐาน พร้อมไฟ LED สว่างจัดและ Accu-Pitch
6. **Boss CP-1X Compressor** (น้ำเงินเข้ม) - มัลติแบนด์สตูดิโอคอมเพรสเซอร์ระบบ MDP ไดนามิกเป็นธรรมชาติ
7. **Boss DD-7 Digital Delay** (เงิน/ฟ้า) - ดิจิทัลดีเลย์มัลติโหมด ปรับได้สูงสุด 3200ms พร้อมโหมด Modulate และ Analog
8. **Boss DS-1 Distortion** (ดำ/ทอง 40th Anniv) - เสียงแตกฮาร์ดร็อกในตำนาน ไฮเกน คมชัด หางเสียงยาว
9. **Boss SD-2 DUAL OverDrive** (เหลืองทอง) - ดับเบิลโอเวอร์ไดรฟ์ 2 แชนแนล (Crunch คลีนแตกนุ่ม และ Lead เสียงลีดพุ่งหนา)
10. **Boss AW-3 Dynamic Wah** (ทองแชมเปญ) - ออโต้หวาตามน้ำหนักนิ้ว พร้อมโหมด Humanizer เลียนแบบเสียงสระมนุษย์
11. **Boss GE-7 Equalizer** (บรอนซ์เงิน) - สไลเดอร์ 7 ย่านความถี่ (100Hz ถึง 6.4kHz) + Level Slider
12. **Boss PS-6 Harmonist** (เขียวอมฟ้า) - ฮาร์โมไนเซอร์ประสานเสียงอัจฉริยะ 3 เสียง พร้อม Pitch Shift, Detune, S-Bend
13. **Boss RC-3 Loop Station** (แดง) - สเตอริโอลูปสเตชัน อัดทับและเล่นลูปดนตรีต่อเนื่อง
14. **Boss MT-2 Metal Zone** (ดำด้าน/ส้ม) - ก้อนเมทัลในตำนาน เสียงแตกไฮเกนพร้อมพาราเมตริกอีคิวย่านกลาง กวาดเสียงสคูปได้สุดสะใจ
15. **Boss NS-2 Noise Suppressor** (ขาวครีม) - ตัดเสียงฮัม/จี่เงียบสนิท ปรับ Threshold, Decay
16. **Boss OD-1X OverDrive** (ทองประกาย) - โมเดิร์นโอเวอร์ไดรฟ์ระบบ MDP เสียงเบสกระชับ เสียงแหลมคมชัดไร้เสียงพร่า
17. **Boss RV-6 Reverb** (เทาเข้มเมทัลลิก) - มัลติสตูดิโอรีเวิร์บยุคใหม่ มีโหมด Shimmer, Modulate, Spring, Hall, Plate
18. **Boss OC-3 SUPER Octave** (น้ำตาลเข้ม) - เจเนอเรเตอร์อ็อกเทฟต่ำ Polyphonic พร้อมโหมด Drive อ็อกเทฟแตกหนา
19. **Boss SD-1w SUPER OverDrive Waza Craft** (เหลือง) - โอเวอร์ไดรฟ์ SD-1 วงจรดิสครีต พร้อมโหมด Custom เบสอิ่ม
20. **Boss TE-2 Tera Echo** (ขาวมุก/ฟ้าไอซ์) - สเปเชียลสเตอริโอเอคโค่ ให้มิติเสียงสะท้อนอวกาศกังวานลึก

**และก้อนยอดนิยมเพิ่มเติมจากภาพเดิม**:
21. **Boss BD-2 Blues Driver** | 22. **Boss DS-2 TURBO Distortion** | 23. **Boss OS-2 Over Drive/Distortion** | 24. **Boss CH-1 SUPER Chorus** | 25. **Boss TR-2 Tremolo** | 26. **Boss CS-3 Compressor Sustainer** | 27. **Boss BF-2 Flanger**

---

### 4. ระบบทดสอบเสียงและเล่นดนตรี (Interactive Guitar Engine)
- **สายกีตาร์ไฟฟ้า 6 สาย (E4, B3, G3, D3, A2, E2)**: คลิกหรือลากเมาส์รูดสายเพื่อดีดจริง พร้อมระบบฟิสิกส์จำลองการกระทบของปิ๊ก (Pick Attack Transient Noise) และการแกว่งสั่นของสาย
- **ปุ่มคอร์ดด่วน**: ดีดคอร์ด E, Em, A, Am, D, Dm, G, C, F และพาวเวอร์คอร์ด E5, A5, D5 ได้ทันที
- **ระบบ Jam Tracks (Backing Tracks)**:
  - Texas Blues Shuffle (Overdrive)
  - Hard Rock Chug & Riff (Distortion)
  - Funky Clean Chops (Chorus/Reverb)
  - Dreamy Ambient Arpeggio (Delay)
  - Heavy Metal Gallop (High-Gain)
  - ปรับความเร็ว BPM ได้ตั้งแต่ 60 - 220 พร้อมไฟกะพริบจังหวะ
- **Live Guitar In**: เสียบสายแจ็คกีตาร์จริงผ่าน Audio Interface หรือใช้ไมโครโฟนเล่นผ่านแอปได้โดยตรง
- **Load Audio File**: โหลดไฟล์ `.mp3` หรือ `.wav` เสียงคลีนมาทดสอบผ่านชุดเอฟเฟคได้
- **Chromatic Tuner บน Header**: เปิดจูนเนอร์ตั้งสายกีตาร์ด้วยเข็มวัด Cents แบบเรียลไทม์
- **8 Snap Presets (ระบบจำค่าและแยกการบันทึกอิสระทุกพรีเซ็ต 1 - 8)**:
  - แต่ละช่องพรีเซ็ต (1 ถึง 8) มีหน่วยความจำอิสระแยกจากกัน 100%
  - เพิ่มหรือลดเอฟเฟคในพรีเซ็ตใด (เช่น เพิ่ม 4 ก้อนใน Preset 1) แล้วสลับไป Preset 2 เมื่อสลับกลับมา Preset 1 ทุกก้อนและค่าลูกบิดจะอยู่ครบเหมือนเดิม
  - ปรับแต่งค่าลูกบิด, แอมป์, ตู้ลำโพง, ไมโครโฟน ในแต่ละพรีเซ็ต ระบบจะ Auto-Save บันทึกลง Browser `localStorage` ทันทีแบบเรียลไทม์
  - นำเมาส์ไปชี้ที่ปุ่มเลขพรีเซ็ต (1 - 8) จะมี Tooltip แสดงรายชื่อก้อนเอฟเฟคที่ต่ออยู่ในพรีเซ็ตนั้นๆ แบบสดๆ
  - ปุ่ม **RESET PRESET**: รีเซ็ตคืนค่าเฉพาะพรีเซ็ตที่กำลังเลือกอยู่กลับเป็นค่าเริ่มต้นโรงงาน
  - ปุ่ม **RESET ALL**: รีเซ็ตทุกพรีเซ็ต 1 - 8 กลับเป็นค่าเริ่มต้นโรงงานทั้งหมด
- **สวิตช์เปิด/ปิด แถบเครื่องมือและเล่นกีตาร์ด้านล่าง (Collapsible Bottom Studio Dock)**:
  - มีสวิตช์เปิด/ปิดจำลองแบบ Micro Switch สไตล์สตูดิโอตรงแถบจับด้านล่าง (`🎸 GUITAR PLAYER & MONITOR [ON/OFF] ▼/▲`)
  - มีปุ่มสวิตช์ไฟ LED สีเขียวบนแถบ Header (`BOTTOM DOCK`) สามารถกดสลับได้ทันทีจากทั้งสองจุด
  - เมื่อปิด (OFF): แถบด้านล่างจะยุบตัวลงอย่างลื่นไหล ทำให้บอร์ดเอฟเฟคและตู้แอมป์แสดงผลได้เต็มจอสะใจ ไม่ต้องเลื่อนสกอร์
  - ระบบจะจำสถานะการเปิด/ปิดล่าสุดลงในเครื่องอัตโนมัติ (Persistent Dock State)

---

## วิธีเปิดใช้งาน (How to Run)

สามารถดับเบิลคลิกเปิดไฟล์ `index.html` บนเว็บเบราว์เซอร์ (Google Chrome, Microsoft Edge, Safari, Firefox) ได้ทันที หรือรันผ่าน Local Server:

```bash
cd "/Users/bilanmac/Downloads/Effect guitar"
python3 -m http.server 8080
```
เปิดเบราว์เซอร์ไปที่: **http://localhost:8080**
