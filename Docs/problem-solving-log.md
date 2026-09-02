# 🔧 บันทึกปัญหา & สถานะ AI (Problem Solving Log — rewritten)

> **หมายเหตุ 02/09/2026: 10:1x ไฟล์นี้ถูกเขียนใหม่ทั้งหมด จากสถานะโค้ดจริงล่าสุด
> (เดิมเป็นบันทึก fix เก่าที่ content ล้าสมัย/เรียงไม่ตรง timeline — ถูกลบทิ้ง)
> เนื้อด้านล่าง = "สถานะปัจจุบัน + ปัญหาที่เหลือ + แนวทางต่อ" บน branch `feature/ai-refactor`

---

## 1. สถานะ AI ปัจจุบัน (Checkpoint)

### 1.1 Search Engine — `src/engine/Minimax.ts`

- **Minimax + Alpha-Beta Pruning** (ไม่ raw minimax)
- **Iterative Deepening Search (IDS)**: increment ลึกทีละ level (1 → maxDepth)
- **Quiescence Search (QS)**: guideline limit `QS_EXTENSION_LIMIT = 2`
  - ที่ leaf (ply 0) ใช้ `Evaluator.evaluate` (เต็มรูปแบบ: mobility + pawn structure)
  - ที่ recursion capture ต่อเนื่อง ใช้ `Evaluator.evaluateStatic` (เบา: material+PST เท่านั้น)
- **Delta Pruning** (`DELTA_MARGIN = 200`)
- **Transposition Table (TT, Zobrist hashing)** — `TT_SIZE = 1M entries`
  - Zobrist table สร้างจาก seeded RNG (`mulberry32`) → deterministic ทุก run
- **Killer Move ordering** (`KILLER_SLOTS = 2`) + **MVV-LVA** สำหรับ capture

### 1.2 Evaluator — `src/engine/Evaluator.ts`

- **Material**: KING=20000, ROOK=500, HORSE=300, KHON=250, MET=150, PAWN=100
- **PST** ตามหมาก (HORSE/KHON/MET/ROOK/PAWN/KING + KING_PST_ENDGAME)
- **Endgame detection** เมื่อเหลือหมาก ≤ `ENDGAME_PIECE_THRESHOLD = 12`
- **Mobility (pseudo-legal)** — `countPseudoLegalMovesForSide` × `MOBILITY_WEIGHT = 6`
  - ใช้ pseudo-legal (ไม่ตรวจ isKingInCheck / ไม่ makeMove+undo) → ประหยัดมาก
- **Lazy Evaluation** — ถ้า `|Material+PST diff| > LAZY_EVAL_THRESHOLD = 450` ข้าม mobility/pawn (แพง)
- **Pawn Structure** (อยู่ใน `pawnStructureScore`):
  - `PASSED_PAWN_BONUS = 25 + progress*4` (Passed Pawn ใกล้โปรโมต)
  - `KING_SHELL_BONUS = 20` (Pawn Shield หน้าโขน/ขุน)
- **หลักครูพงษ์ (เพิ่ม Ticket C / 02/09/2026)**:
  - `PAWN_OVER_EXTENSION_PENALTY = 14` (ข้อ 5: หักเบี้ยดันลึกเกิน ช่วงหมากยังเยอะ ≥16)
  - `ROOK_OPEN_FILE_BONUS = 25` / `SEMI_OPEN = 12` (ข้อ 9: เรือบน Open File)
  - `CENTER_CONTROL_WEIGHT = 8` (ข้อ 10: นับหมากที่ reach 4 ช่องกลาง)
- **Delta / Move scoring** ผ่าน `getMaxCapturableValue` + `scoreMove`

### 1.3 Config — `src/engine/engineConfig.ts`

- `DEFAULT_SEARCH_DEPTH = 4` (กลางเกม ~1.4s)
- `MATE_SCORE = 100000`, `DRAW_SCORE = 0`

### 1.4 Opening Book — `src/engine/{data,openingBookService}.ts` + `ai.worker.ts`

- `OPENING_BOOK` (ตาม Docs/OPENING_BOOK.MD หลักครูพงษ์):
  - key `"START"` → RED เดินแรก (ม้า ง3 [7,1]→[6,3], เบี้ยกลาง, เบี้ย ค4)
  - key `"1r"` → BLACK ตอบ (โคน ฉ7 [0,5]→[1,5], ม้า [0,6]→[1,4])
  - key `"1b"` → เผื่อ (โคน/เม็ดแดงพัฒนา)
- `getBookBestMove(board, side)` → สุ่ม Weighted (selectRandomBookMove) แล้วตรวจว่าถูกกฎหมาย
- Worker: เช็ค Opening Book **ก่อน** Minimax → ตอบตาเปิด ~0ms

### 1.5 Tests (Vitest)

| ชุด                     | จำนวน | ไฟล์                                                                    |
| ----------------------- | ----- | ----------------------------------------------------------------------- |
| Minimax                 | 20    | `src/engine/__tests__/Minimax.test.ts`                                  |
| Opening Book            | 9     | `src/engine/__tests__/openingBook.test.ts`                              |
| Performance (benchmark) | แยก   | `src/engine/__tests__/perf/aiPerformance.test.ts` (`npm run test:perf`) |

- `npm test` = Minimax + Opening Book + Evaluator (เร็ว, สำหรับ CI)
- `npm run test:perf` = benchmark เวลากลางเกม (แยกจาก CI)
- Verify: `tsc --noEmit` ✅, engine tests 35 ✅

---

## 2. Performance (กลางเกม — board หลังเปิด 4-5 ตา)

| depth | เวลาคิด   | สถานะ                                      |
| ----- | --------- | ------------------------------------------ |
| 3     | ~0.9s     | ✅ เร็วมาก                                 |
| **4** | **~1.4s** | ✅ ✅ **ค่า default (เป้า <1-2s) ถึงแล้ว** |
| 5     | ~9s       | ⚠️ ยังช้าเกินสำหรับ casual                 |
| 6+    | 30s+      | ❌ ไม่ไหวบนเบราว์เซอร์                     |

> ก่อน optimize mobility: depth4 ~5.4s → หลัง `countPseudoLegalMovesForSide` + Lazy Eval = **~1.4s**

---

## 3. ปัญหาที่สร้างจากนี้ (ส่งผลต่อการเล่นจริง)

### 3.1 ความลึก (~1.4s @ depth 4) — ยอมรับได้ในเชิงเวลา แต่จำกัดความฉลาด

- คำตอบ: depth4 เล่นได้ลื่นพอ และตอนเปิดใช้ Opening Book ตอบ ~0ms → ประสบการณ์ดี
- **ยังค้าง**: ถ้าอยากให้ "โ หม่เก่งขึ้น" ต้องเจาะลึก แต่ลึกไปเจอเวลาพุ่ง (branching factor ของหมากรุกไทยสูง)

### 3.2 Opening Book ยังบาง (เฉพาะ 3 key)

- ข้อมูลครบแค่ตา {"START","1r","1b"} → ครอบคลุมแค่ ~2-3 ก้าวของทั้ง 2 ฝั่ง
- **ยังค้าง**: ถ้าอยากครอบคลุมสายเปิดตามตำราครูพงษ์เพิ่ม (โคน/เม็ด/ม้า หลายลำดับ) ต้องเพิ่ม nodes
- มีระบบ Weighted Random แล้ว → ต่อยอดเพิ่ม data ได้เรื่อย ๆ

---

## 4. หลักครูพงษ์ ข้อ 5-10 กับ Evaluator — สถานะ + งานที่เหลือ

เอกสาร `Docs/OPENING_BOOK.MD` แนะนำแปลงข้อ 5-10 เป็น Evaluator:

| ข้อ | หลักการ                          | สถานะในโค้ด                                               |
| --- | -------------------------------- | --------------------------------------------------------- |
| 5   | เดินเบี้ยเกินจำเป็น = เสียทีเดิน | ✅ `PAWN_OVER_EXTENSION_PENALTY=14` (ตอนเกมยังมีหมาก ≥16) |
| 6   | King Safety + Pawn Shield        | ✅ `KING_SHELL_BONUS=20`                                  |
| 7   | Passed/Advanced Pawn             | ✅ `PASSED_PAWN_BONUS=25+progress*4`                      |
| 8   | ชิงเบี้ยนอก/เบี้ยใน              | ❌ ยังไม่มี                                               |
| 9   | Rook on Open File (+20~+30)      | ✅ `ROOK_OPEN_FILE_BONUS=25`, `SEMI_OPEN=12`              |
| 10  | Center Control bonus             | ✅ `CENTER_CONTROL_WEIGHT=8` (nับ reach 4 ช่องกลาง)       |

> ✅ **Ticket C เสร็จสมบูรณ์ (02/09/2026):** implement ข้อ 5, 9, 10 ใน `Evaluator.ts` + test
> (เหลือข้อ 8 — ชิงเบี้ยนอก/ใน ยังไม่ได้ทำ)

---

## 5. 🔒 สิ่งที่ควรระวัง / ยึดหลักตอนเขียน Evaluator เพิ่ม

1. **Lazy Threshold (450)**: bonus ใหม่ต้องไม่ใหญ่จนทำให้ scan ที่ตัดสินด้วย material+PST เพียงพอผิด
   - ให้ bonus รวม (ทั้งไฟล์) อยู่ใน scale เดียวกับ PST (หลัก 0-30) ไม่ใช่ เท่ากับค่าหมาก
2. **Pseudo-legal mobility**: bonus ต้องใช้ `countPseudoLegalMovesForSide` (เบา) ไม่เพิ่ม leg moves ซ้ำ
3. **Symmetry**: ต้อง mirror สำหรับ BLACK เหมือน PST (rowIndex = RED? r : 7-r)
4. **Keep tests green**: ทุก bonus ต้องไม่เปลี่ยนค่าหมาก (PST) ให้เลื่อน benchmark default ที่ล็อกไว้
5. **Verify**: `tsc --noEmit` + `npm test` (35) + `npm run test:perf` (depth4 ~1.7s หลังเพิ่ม ข้อ 5/9/10 — ยังในเกณฑ์ casual)

---

## 6. แนวทางต่อ (Roadmap)

- [x] **Ticket C:** Implement ข้อ 5, 9, 10 ใน `Evaluator.ts` (+ test) — **เสร็จ**
- [ ] **Ticket (ถัดไป):** ข้อ 8 (ชิงเบี้ยนอก/เบี้ยใน) ถ้าต้องการ
- [ ] ขยาย `OPENING_BOOK` ให้ครอบคลุมสายเปิดของครูพงษ์มากขึ้น (หลาย nodes)
- [ ] (ถ้าอยาก depth 5) ลด branching เพิ่ม: Null Move Pruning / LMR / เพิ่ม TT efficiency
- [ ] ทดสอบเล่นจริง + ปรับ weight ตามความรู้สึกผู้เล่น
