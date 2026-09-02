# 🔧 บันทึกปัญหา & วิธีแก้ (Problem Solving Log)

> เขียนเพื่อไม่ให้ลืมสภาพปัญหาและแนวทางต่อ ขณะทำ AI refactor
> **วันที่/เวลา:** 01/09/2026 21:53 (GMT+7)

---

## 1. สภาพปัญหา (เกิดระหว่างทดสอบเล่นจริง)

หลัง refactor AI ครบ 5 ขั้น (QS, PST, positional, TT+killer, depth 7) แล้ว **เกมจริง AI ค้าง "AI กำลังคิด..." ไม่เดิน** แม้เดินแรก ๆ AI ตอบได้ (เช่น ม้า 0,1->1,3, โคน 0,5->1,6) แต่**หลายตาเริ่มค้าง**

### อาการที่สังเกต
- เกมเล่นไป 3-5 ตา แล้ว AI พร็อบ "AI กำลังคิด..." ค้างนาน / ไม่เดินเลย
- บางตา AI ตอบปกติ บางตาค้าง (เวลาไม่แน่นอน — ขึ้นกับความกว้างของ tree)

---

## 2. Root Cause (ยืนยันจาก measurement)

**ไม่ใช่ bug — เป็น Performance Scaling ของ search tree**

ทำการวัด board กลางเกมจริง (หลัง 4 ตา: KHON, HORSE, PAWN ขึ้น) ด้วย `_perf.test.ts`:

| depth | เวลาคิดกลางเกม | ผล |
|-------|--------------|----|
| 2 | ~456 ms | ✅ เร็ว |
| 3 | ~3,044 ms (ก่อน) → **~934 ms (หลัง QS=2)** | ✅ เล่นได้ |
| 4 | ~5,449 ms | ⚠️ ช้าไป |
| 5 | ~30,570 ms (30 วิ) | ❌ ไม่ไหว |
| 6 | ~86,210 ms (86 วิ) | ❌ |
| 7 | >2 นาที | ❌ แย่มาก |

### สาเหตุหลัก
1. **depth 5+ ใหญ่เกินไปจริงกลางเกมไทยหมากรุก** (branching factor สูง — เบี้ย/ม้า/โคน/เรือ ทุกตัวเดินได้หลายทาง)
2. **`mobilityScore()` เรียก `getLegalMovesForSide()` 2 ครั้งต่อทุก leaf ของ main search** → เพิ่มโหลดมหาศาล
3. **`QS_EXTENSION_LIMIT = 3`** ก็เพิ่ม nodes อีก

> หมายเหตุ: setupDefaultBoard (board เต็มสุด) test ผ่านเร็ว (66-134ms) เพราะเป็น "ตำแหน่งตั้งต้น" ที่ pruning ตัดง่าย ไม่ใช่สะท้อนกลางเกมจริง

---

## 3. วิธีแก้ที่ทำแล้ว (fix 2 จุด)

1. **`src/engine/engineConfig.ts`**: `DEFAULT_SEARCH_DEPTH = 7` → **`3`**
2. **`src/engine/Minimax.ts`**: `QS_EXTENSION_LIMIT = 3` → **`2`**

### ผลลัพธ์ (กลางเกม)
| | ก่อน | หลัง |
|---|------|------|
| timing depth 3 | ~3,044 ms | **~934 ms (~1 วิ)** |

- 20 tests เดิม**ผ่าน** + perf test ผ่าน = 21 tests ✅
- tsc ผ่าน ✅

---

## 4. 🌱 ทางเลือกที่ยังไม่ได้ทำ (A/B/C) — ตัดสินใจเมื่อกลับมา

### A) Commit fix ตอนนี้ (depth3 + QS2) แล้วทดลองเล่นจริงดูความเร็ว/ความฉลาด
- ✅ ทำแล้วใน commit นี้

### B) ปรับ tuning เพิ่ม เพื่อ "ฉลาดขึ้นแต่ยังเร็ว" (ยังไม่ทำ)
ไอเดียที่เสนอ:
- **depth 4 + ปิด mobility** (mobility แพงเพราะ getLegalMovesForSide ซ้ำ) → จะเร็วขึ้น คง depth 4 ได้โดยไม่ 30 วิ
- **ทำให้ mobility เบา**: reuse moves ที่ minimax คำนวณอยู่แล้วแทน generate ใหม่
- **ลดโหลด QS/add quiescence เฉพาะเมื่อมี check/capture มาก**

### C) ตัดสินใจ `_perf.test.ts` (ยังไม่สรุป) ✅
- ไฟล์ `src/engine/__tests__/_perf.test.ts` = test ช่วย measure timing กลางเกม (มี console.log)
- **สถานะ: ยัง untracked (ไม่ commit เข้า repo main)** — เก็บไว้ในเครื่องช่วย tune
- ตัวเลือก: เก็บเป็นไฟล์ถาวร / แยกโฟลเดอร์ perf / ลบทิ้ง

---

## 5. สมุดหมายเหตุสำหรับการทำงานต่อ

- ปัญหาหลักที่เหลือ = **หาสมดุล depth vs เวลา** (ปัจจุบัน depth 3 = ~1 วิ ต้องตัดสินใจว่าเอาแค่นี้ หรือแลกฉลาดขึ้นด้วยเทคนิค optimize)
- ถ้าต้องการ depth 4+ แนะนำ **ปรับ mobility ให้เบาก่อน** (ลด bottleneck หลัก)
- `_perf.test.ts` เป็นเครื่องมือวัด ควรเก็บเพื่อเทียบ tuning ภายหลัง
- ทั้งหมดนี้อยู่บน branch **`feature/ai-refactor`** (committed + pushed ถึงก่อนหน้านี้)

---

## 6. 🔧 Optimize Mobility (เพื่อปลดล็อก depth 4) — 07/03/2026 08:3x

ทำตามแนวทางที่เสนอ: **Pseudo-Legal Mobility + Lazy Evaluation** (+ จัดการ perf test แยก)

### 6.1 สิ่งที่ทำ
1. **`Board.countPseudoLegalMovesForSide(side)`** (ใหม่)
   - นับจำนวนช่องที่หมาก "แตะถึงได้" **ไม่ตรวจ isKingInCheck / ไม่ makeMove+undo**
   - ลด overhead ของ ray-cast + in-check check ได้มาก
2. **`Evaluator.mobilityScore()`**: เปลี่ยนจาก `getLegalMovesForSide()` → `countPseudoLegalMovesForSide()`
3. **`Evaluator.evaluate()`**: เพิ่ม **Lazy Evaluation**
   - ถ้า `|Material+PST diff| > LAZY_EVAL_THRESHOLD (450)` → ตัดสินด้วย material+PST อย่างเดียว
   - ข้าม mobility/pawn structure (ไม่กี่แต้มชดเชยหมากที่ต่างกันมากไม่ได้)
   - ค่าคงที่ `LAZY_EVAL_THRESHOLD = 450` (ราวค่าเรือเดียว)
4. **`DEFAULT_SEARCH_DEPTH`: 3 → 4** (ได้ผล 1.4s กลางเกม)
5. **Perf test แยกโฟลเดอร์**: `src/engine/__tests__/perf/aiPerformance.test.ts`
   - `npm test` = เฉพาะ Minimax.test.ts (CI เร็ว)
   - `npm run test:perf` = benchmark แยก

### 6.2 ผลลัพธ์ (กลางเกม board เดิม)
| depth | ก่อน optimize | หลัง PseudoLegal+Lazy |
|-------|---------------|-------------------------|
| 3 | ~960 ms | ~960 ms |
| **4** | **~5,449 ms** | **~1,400 ms** ✅ (ล็อก) |
| 5 | ~30,000 ms | ~9,100 ms (ยังช้า) |

### 6.3 หมายเหตุ: ทำไมไม่ทำ "Reuse Moves" (ตัว 3)
- Mobility ถูกใช้เฉพาะที่ **leaf** (depth 0) ผ่าน `quiescence → evaluate`
- ที่ depth 0 `minimax` ตอนนี้ **return ทันที ก่อนมี moves**
- จะ Reuse ต้องย้าย generate moves ขั้น depth 0 ขึ้น ทำให้ leaf generate **legal เต็ม** (แพงกว่า pseudo-legal)
- ผลขัดแย้ง: ได้ reuse แต่เสียการประหยัด → **yield ต่ำ ไม่คุ้มความซับซ้อน** จึงข้าม

### 6.4 ตรวจสอบ
- `tsc --noEmit` ✅
- `npm test` (20 tests, 80ms) ✅
- `npm run test:perf` (depth4=1,437ms) ✅
- ตั้ง default depth = 4 → กลางเกม ~1.4s ✓ (ถึงเป้า <1-2s)

### 6.5 ทางเลือก tuning ต่อ (ถ้าต้องการ depth 5)
- depth 5 ยัง ~9s — ต้อง optimize อื่นเพิ่ม (เช่น ลด branching ด้วย Null Move Pruning, LMR, เพิ่ม TT efficiency)
- ถ้าไม่ต้องการลึกมาก ปิด depth5 ไปตั้ง 4 ก็พอ
