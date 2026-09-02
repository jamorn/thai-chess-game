# 🧪 AI vs AI Simulation — คู่มือใช้งาน & สถานะการ tune (สำหรับทำต่อบน Mac 32GB)

> **สร้าง 02/09/2026.** ไฟล์นี้ให้ AI/ผู้ใช้เครื่องแรง (เช่น Mac แรม 32GB) อ่าน
> เพื่อ `git pull` แล้วรัน **AI vs AI simulation** เพื่อ **tune หลักครูพงษ์ข้อ 5, 8, 9, 10** ต่อจากที่ค้างไว้
> บนเครื่อง 16GB/1CPU ที่ประมวลผล depth3 ช้า ต้องใช้เครื่องแรงช่วยวัดผล

---

## 1. ทำไมต้องมี AI vs AI Simulation

ตอนนี้ `Evaluator` (Ticket C เสร็จแล้ว) มีหลักครูพงษ์:
| ข้อ | หลักการ | สถานะ | ค่าคงที่ใน `Evaluator.ts` |
|----|--------|-------|--------------------------|
| 5 | เดินเบี้ยเกินจำเป็น = เสียทีเดิน | ✅ ทำแล้ว (ตั้ง penalty เบา) | `PAWN_OVER_EXTENSION_PENALTY=14` (เฉพาะหมาก≥16 ตัว) |
| 8 | ชิงเบี้ยนอก/เบี้ยใน | ❌ **ยังไม่ได้ทำ** | — |
| 9 | Rook on Open File | ✅ ทำแล้ว | `ROOK_OPEN_FILE_BONUS=25`, `SEMI_OPEN=12` |
| 10 | Center Control bonus | ✅ ทำแล้ว | `CENTER_CONTROL_WEIGHT=8` |

> ⚠️ **เปิดค้าง (ต้อง validate ด้วย sim):**
> 1. **ข้อ 5 ตั้งเบาไปไหม?** penalty=14 ต่อเบี้ยมีผลน้อย เพราะ PST ของเบี้ยกลาง (row2-3) สูงกว่า penalty มาก
>    → ต้องดู sim ว่าถ้าเพิ่ม penalty / ปรับ logic จะทำให้ฝั่งที่เดินเบี้ยดีขึ้น/แย่ลงแค่ไหน
> 2. **ข้อ 8 (ชิงเบี้ยนอก/ใน) ควรเพิ่มไหม?** ค้างไว้ อยากดู sim ข้อ 9/10 ส่งผลอย่างไรก่อน
>    (ดู Docs/OPENING_BOOK.MD — ชิงเบี้ยนอก = เบี้ย ก ฝั่งตรงข้ามฝั่งเดียว, เปิดเส้นเรือ)

---

## 2. สคริปต์ที่สร้างแล้ว

**ไฟล์:** `src/engine/__tests__/simulation/aiVsAi.test.ts`
**รัน:** `npm run sim`

ให้ AI แดง/ดำ สู้กันเอง แล้วรายงานสถิติ เพื่อใช้ **เทียบก่อน/หลัง** ปรับ weight หรือ เพิ่ม feature:

```
📊 === SIMULATION RESULTS ===
RED Wins     : N  (%)
BLACK Wins   : M  (%)
Draws        : K  (%)
Avg Moves    : X/game
```

**จุดแข็ง / ครอบคลุม:**
- ใช้ **Opening Book** (weight random) ช่วงเปิด → แต่ละเกม board ต่าง → ได้ diversity
- ใช้ `board.getGameState()` ตรวจจบเกม (Checkmate / Stalemate / Insufficient material → Draw)
- `maxMoves` ตัดจบเป็น Draw กัน infinite loop

**พารามิเตอร์ผ่าน env ของ Vite** (prefix `VITE_`):

| env | default | ความหมาย |
|-----|---------|----------|
| `VITE_SIM_DEPTH` | `3` | ความลึก search (Mac แรงใช้ 4 ได้) |
| `VITE_SIM_GAMES` | `20` | จำนวนเกมประลอง |
| `VITE_SIM_MAX_MOVES` | `100` | จำนวนตาสูงสุดต่อเกม (เกิน = เสมอ) |

**ตัวอย่างรันบน Mac 32GB (depth4, ราว 1-2 นาที):**
```bash
VITE_SIM_DEPTH=4 VITE_SIM_GAMES=20 VITE_SIM_MAX_MOVES=150 npm run sim
```

> ⚠️ test timeout ตั้งไว้ 45 นาที (`TEST_TIMEOUT_MS` ในไฟล์) — ลด/เพิ่มได้ตามเครื่อง

---

## 3. ทำไม "depth 2" ถึงไม่เหมาะ tune

- บนเครื่อง 16GB/1CPU ลอง depth2 แล้ว **Draw 100%** เพราะ AI ตื้นเกิน (มองไม่ลึกพอจะจับขุนคู่ต่อสู้)
  → เกมทั้งหมดวิ่งชน `maxMoves` → เสมอหมด → **ไม่มีข้อมูล win/loss ไปปรับ weight**
- **ต้อง depth ≥3** ถึงจะเห็น win/loss ต่างจริง → ใช้ Mac แรงช่วยดีกว่า

---

## 4. วิธีใช้ sim เพื่อ tune (แนะนำ flow)

1. **Baseline:** รัน `npm run sim` (depth3/20 เกม) ด้วยค่าโค้ดปัจจุบัน → จดผล (RED/BLACK/Draw)
2. **ทดลองแปรค่า** (ครั้งละ 1 ตัว) เช่น เพิ่ม `PAWN_OVER_EXTENSION_PENALTY` 14→30 หรือปิดข้อ 5 แล้ว rerun sim → เทียบ win rate
3. **เกณฑ์ตัดสินคร่าว:** ฝั่งที่ได้เปรียบจาก feature (เช่น มีเรือ open file) ควร win rate สูงขึ้น / แต่ฝั่งที่เดินเบี้ยเยอะควรแพ้ลง (ถ้าข้อ5 แรงพอ)

---

## 5. 🧭 งานที่แนะนำให้ AI-on-Mac พิจารณาทำต่อ (เปิดค้าง)

### คำถาม tuning (ให้ตอบด้วย sim result)
- [ ] **A. ข้อ 5**: ถ้าเพิ่ม penalty เบี้ย (14→~30) + ปรับช่วงหมากเยอะกว่านี้ ส่งผลให้ AI "เดินเบี้ยเกิน" ลดลงไหม? ควรเพิ่มไหม?
- [ ] **B. ข้อ 8**: Implement "ชิงเบี้ยนอก/ใน" (ค่าคงที่ใหม่ใน Evaluator + เรียกใน evaluate) แล้ว sim เทียบ win rate
- [ ] **C. check ข้อ 9/10 weight**: CENTER_CONTROL_WEIGHT=8 / ROOK_OPEN=25 เหมาะสมไหม ทดปรับแล้วเทียบ sim

> 📌 หลัง tune → `npx tsc --noEmit` + `npm test` (35 ตัว) ต้องเขียวเสมอ แล้ว commit + push

---

## 6. Verbose: วิธีรัน/ผลบนเครื่อง origin (16GB/1CPU)

- depth3/10 เกม บนเครื่องนี้ ≈ **323s (~5.4 นาที)**; depth2/10 เกม ≈ **154s**
- ผล depth2 (10 เกม) = `Draws 100%` — **ไม่เหมาะ tune**
- **Baseline depth3 กำลังถูกรันทิ้งบนเครื่อง origin** (ดูผลในบทนี้หลังเสร็จ/ในไฟล์ sim_baseline.txt)

```
(PENDING — รันทิ้งบนเครื่อง origin การ baseline)
```
