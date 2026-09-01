# 🤖 ทบทวนความเก่งของ AI หมากรุกไทย (AI Strength Review & Refactor Plan)

> สรุปจุดแข็ง / จุดอ่อน / แนวทางเพิ่มความฉลาดของ AI Engine ปัจจุบัน
> เขียนเพื่อใช้เป็นแนวทางใน **refactor ครั้งถัดไป** (ยังไม่ได้ลงมือปรับในไฟล์นี้)

---

## 1. สถาปัตยกรรมปัจจุบัน (ถูกแล้วทั้งคู่)

| ชิ้นส่วน    | ไฟล์                         | บทบาท                                                            |
| ----------- | ---------------------------- | ---------------------------------------------------------------- |
| Core Search | `src/engine/Minimax.ts`      | Minimax + Alpha-Beta Pruning + Iterative Deepening               |
| การประเมิน  | `src/engine/Evaluator.ts`    | Material + Piece-Square Table (เฉพาะม้า) + MVV-LVA move ordering |
| ควบคุม AI   | `src/engine/AiEngine.ts`     | Async controller ส่งเบสไปยัง Web Worker                          |
| Web Worker  | `src/engine/ai.worker.ts`    | ประมวลผลแบบ non-blocking ให้ UI ลื่น                             |
| Config      | `src/engine/engineConfig.ts` | `DEFAULT_SEARCH_DEPTH=5`, `MATE_SCORE=100000`, `DRAW_SCORE=0`    |

---

## 2. จุดแข็ง (ทำดีแล้ว — เก็บรักษาไว้)

- ✅ **Minimax + Alpha-Beta Pruning**: คิดแบบ tree จริง (ไม่ random) + pruning ลดโหนด
- ✅ **Iterative Deepening**: `findBestMove` ไล่ depth 1→N เอา best ของ depth สุดท้าย
- ✅ **MVV-LVA Move Ordering** ผ่าน `scoreMove = 10×value(victim) − value(attacker)`: กินตัวคุ้มค่าก่อน ช่วยให้ pruning ตัดกิ่งได้เร็ว
- ✅ **จัดการจุดจบถูกต้อง**: จับ Checkmate / Stalemate / Draw (`moves.length===0`)
- ✅ **น้ำหนักหมากสมเหตุสมผล**: ขุน=20000, เรือ=500, ม้า=300, โคน=250, เม็ด=150, เบี้ย=100
  - เรียงลำดับตรงจริงตามหมากรุกไทย (เม็ด < โคน < ม้า < เรือ)
- ✅ **Non-blocking**: แยก Web Worker ทำให้ UI ไม่กระตุกแม้คิดลึก
- ✅ **ผ่าน Unit Test 20 cases** + CI (GitHub Actions) รันเป็นจริง

---

## 3. จุดอ่อน (ที่ควรพัฒนาต่อใน refactor)

### 3.1 Quiescence Search — **ผลตอบแทนสูงสุด ควรทำก่อน**

- ปัญหา: ตอน `depth===0` **ตัดการประเมินทันที** จึงพลาดสาย "สลับกินต่อเนื่อง" ใน depth แคบ
- แนวทาง: เมื่อถึง leaf ให้ทำ **"quiet" search** — ขยายเฉพาะ capture moves ต่อจนไม่มี capture เพื่อมองสายถึงปลายและกัน horizon effect

### 3.2 Evaluator ตำแหน่งยังเรียบง่าย

ปัจจุบันคิดแค่ **Material + Horse PST** ยังขาด:

- **Mobility**: จำนวนช่องเดินได้รวมของแต่ละฝั่ง (หมากอยู่เฉย ๆ ที่เดินได้เยอะ = ควบคุมพื้นที่)
- **King Safety**: ปกป้องขุน / หลบมุมแคบสู้ / ช่องว่างรอบขุน
- **Rook on open file**: เปิดเส้นให้เรือ
- **Khon/Met center control**: คุมกลาง / ประกบคุม
- **Pawn (Bia) progress**: เบี้ยใกล้โปรโมต (ถึงแถวที่ 3 ฝั่งตรงข้าม)
- **Pawn structure / ไม่ให้เบี้ยแตก**

### 3.3 Piece-Square Tables (PST) — มีแค่ของม้า

- เพิ่ม PST ให้หมากอื่น (เรือ, โคน, เบี้ย, ขุนช่วง endgame) เพื่อให้หมากวางตำแหน่งดีได้คะแนน

### 3.4 Depth ต่ำ (default = 5)

- depth 5 + ไม่มี quiescence → เล่น "ตามน้ำหนักหมาก" เป็นหลัก ยังไม่ "หักมุมลึก"
- หลังมี PSQ/ordering ดีแล้ว ค่อยเพิ่ม depth (ด้วย Web Worker ที่มีอยู่) พร้อม tune

### 3.5 ไม่มี Opening / Endgame knowledge

- ไม่มีหนังสือเปิด (opening book) และไม่มี endgame tablebase helper

---

## 4. แผน refactor (ลำดับแนะนำ)

| ลำดับ | งาน                                             | ผู้คนผลัก                                    | ความเสี่ยง                    |
| ----- | ----------------------------------------------- | -------------------------------------------- | ----------------------------- |
| 1     | **Quiescence Search**                           | เก่งขึ้นชัดแบบทันที (มองสาย capture ถึงปลาย) | ต่ำ ใช้ tree เดิม             |
| 2     | เพิ่ม **PST ให้หมากอื่น** (เรือ/โคน/เบี้ย/ขุน)  | วางหมากดีขึ้น                                | ต่ำ ข้อมูล static             |
| 3     | เพิ่ม **Mobility + King Safety** เข้า Evaluator | เลือกตากลางเกม/นิ่งได้ดี                     | ปานกลางต้อง tune น้ำหนัก      |
| 4     | tune **Move Ordering** (จัดกลุ่ม capture/quiet) | pruning มีประสิทธิภาพ → เพิ่ม depth ได้      | ต่ำ                           |
| 5     | เพิ่ม **DEFAULT_SEARCH_DEPTH** (เช่น 6–7)       | คู่แข่งแรงขึ้น                               | ต้องเวคเวลากับความเร็ว worker |
| 6     | (optional) **Opening book / Endgame helper**    | เปิดตัวดี + closing ชนะ                      | สูง                           |

### Validation หลัง refactor

- รัน `npm test` (ต้องยังผ่าน 20 tests เดิม + เพิ่ม test ใหม่)
- ท้าทาย AI กับตาที่รู้ผล (mate in 1/2, เห็นสายสลับกิน, หลบหมาก)
- วัดความหน่วงใน Web Worker (ต้องไม่กระตุก UI)

---

## 5. ข้อเสนอแนะเสริมรายหัวข้อ (Refinement Suggestions)

### 5.1 Quiescence Search (QS) — ข้อควรระวังในการ Implement

- **Standing Pat**: ในฟังก์ชัน QS ต้องมีเทคนิค Standing Pat (ประเมินค่า static evaluation ปัจจุบันก่อน) เพื่อให้มโนทัศน์ว่า _"ถ้าฝ่ายเราไม่กินต่อ แล้วแต้มปัจจุบันดีพออยู่แล้ว ก็กดยอมรับค่านั้นและตัดกิ่งได้เลย"_
- **Delta Pruning**: ป้องกันไม่ให้ QS รันลึกเกินไป ด้วยการเช็กว่า ถ้ารูปเกมปัจจุบัน + ค่าตัวหมากสูงสุดที่กินได้ ยังไม่ช่วยให้คะแนนดีกว่า Alpha ได้ ก็ตัดกิ่งนั้นทิ้งทันที

### 5.2 Piece-Square Tables (PST) ของหมากรุกไทย

- **โคน (Khon)**: ควรให้คะแนนสูงขึ้นเมื่อเดินขึ้นไปกระจายตัวแถวกลางกระดาน (คุมช่องเปิด)
- **เบี้ย (Bia)**: เมื่อก้าวเข้าสู่แถวที่ 4 และ 5 (เตรียมโปรโมตเป็นเบี้ยหงายในแถว 6 ของฝั่งดำ / แถว 3 ของฝั่งแดง) คะแนน Position ต้องเพิ่มขึ้นอย่างมีนัยสำคัญ
- **ขุนช่วง Endgame**: เมื่อตัวหมากบนกระดานเหลือน้อย PST ของขุนควรปรับพฤติกรรมจากการ _"หลบมุม"_ ไปเป็น _"เดินเข้าหากลางกระดาน"_ เพื่อช่วยรุกคุมพื้นที่

### 5.3 Evaluator: King Safety & Pawn Structure

- **Pawn Shield**: ให้คะแนนโบนัสถ้ายังมีเบี้ย 3 ตัวด้านหน้าขุนคงอยู่ (ช่วงเปิด/กลางเกม)
- **Passed Pawn (เบี้ยผ่าน)**: เบี้ยที่ไม่มีเบี้ยฝ่ายตรงข้ามขวางในคอลัมน์เดียวกัน ควรได้คะแนนประเมินสูงขึ้นตามความลึกที่ดันขึ้นไป

### 5.4 Move Ordering (หัวใจสำคัญในการดัน Depth 6–7)

นอกจาก MVV-LVA แล้ว สามารถเพิ่ม 2 เทคนิคนี้ลงใน `Minimax.ts` โดยใช้ Memory น้อยมาก:

- **Killer Move Heuristic**: เก็บตาเดินที่ไม่ใช่การกินหมาก (Quiet Move) แต่เคยทำให้เกิดการตัดกิ้ง (Beta Cutoff) ใน Depth เดียวกัน นำมาพิจารณาก่อนตา quiet อื่นๆ
  - ใช้ตัวแปร `killerMoves[depth]` อาเรย์เก็บ 1–2 move ต่อ depth
- **TT (Transposition Table)**: หากอนาคตต้องการดัน Depth เกิน 6 การใส่ Hash Table (**Zobrist Hashing**) จะช่วยจำรูปแบบกระดานที่เคยคำนวณไปแล้ว ไม่ให้คิดซ้ำซ้อน
  - ใช้ memory มากกว่า killer ควร design size (เช่น 1–4M entries) + replace strategy

---

## 6. หมายเหตุ

- เอกสารนี้เขียนจากจุด **snapshot ก่อน refactor** เพื่อเก็บความเก่งเดิมเป็น baseline
- ค่าปรับใน `engineConfig.ts` (depth, MATE_SCORE, DRAW_SCORE) เป็น magic numbers กลางที่ปรับจูนได้โดยไม่แตะลอจิก
- อย่าทำลาย **non-blocking worker** และ **test** ระหว่าง refactor
- ข้อเสนอแนะใน section 5 เป็นแนวทางที่แนะนำแบบ **ทีละขั้น (incremental)** จูนทีละ factor แล้ว validate ด้วย test + การเทียบฝีมือก่อนลอยกระโจม
