# Decision — ทำไมถึงหยุด ไม่แก้ Business Logic (AI / Engine) ต่อ

> บันทึกเพื่อใจความของการคุย "จะไปต่อ AI (ได้เปรียบแล้วบุก/ Aggression / Endgame conversion) หรือเปล่า"
> สรุปว่า **รอบนี้หยุด ไม่ refactor business** เพราะหลายเหตุผล evidence/scope/risk — โดยจบ session ด้วยงาน UI ให้เสร็จก่อน
> คู่: ไฟล์ UI อีกฉบับดู `Docs/ui-board-history-session.md`

---

## 🎯 จุดมุ่งหมายโปรเจกต์ (Product Goal) — "AI ไม่เก่งเกินไป"

**จุดยืนอย่างเป็นทางการของโปรเจกต์นี้:**
**AI ไม่อยากเก่งเกินไป** — ต้องการให้ **มนุษย์มีโอกาสชนะได้บ้าง เพื่อความสนุกของเกม**

นั่นแปลว่า:
- ไม่ไล่ให้ search/AI "optimal ทุกตา" จน deterministic-win เสมอ
- ระดับที่ตั้งเป้า ≈ "แข็งพอที่น่าเคารพ/ท้าทาย แต่มี path ให้คนชนะ"
- ถ้าเพิ่ม strength ควรเป็น **layered / difficulty (depth & aggression gate)** เล่นเองได้ ไม่ใช่ force-strong กับ casual ทุกโหมด

> ผลต่อทุก decision ต่อไป: ถ้า Scenario ที่วิเคราะห์ (เช่น K+R "เห็นแต่ไม่จบ/เล่นแผ่") **ไม่ทำให้เกมสูญความสนุกหรือชนะไมได้** ประเด็นนั้นถือรับได้ในกรอบโปรเจกต์

---

## 1. บริบทที่ตั้งคำถาม

ผู้ใช้เล่นเกม รู้สึกว่า "AI เก่งพอแล้ว" แต่สนใจจุดที่ "พอ AI ได้เปรียบแล้ว ควรบุกต่อเนื่อง/ปิดเกม" ซึ่งถูกตั้งคำถามเชิง Evidence จาก simulation `aiVsHuman.test.ts`
- Scenario 3 (K+R end) แสดงแนว **rook perpetual ไม่จบ** บางลองที่ depth4 — AI ได้เปรียบแต่ไม่ "convert" ให้จน
- มีเอกสาร `Docs/unit-user-test.md` + วิเคราะห์ test file ที่สร้างใหม่ เพื่อสรุปจริง

**ประเด็นที่วิเคราะห์จริง (จากโค้ด/หลักฐานไม่ใช่แต่ด็อก):**
- `aiVsHuman.test.ts` เป็น **Minimax(AI) vs Minimax(AI)** ที่มนุษย์ "เปิด" แค่ 1-2 ply หลังนั้นทุก ply = book/engine
- ผล "6/7 เสมอ" จึงเป็นคุณสมบัติการแลกเสมอของ 2 shallow-AI **ไม่ใช่หลักฐานตรงว่า "AI ขี้กลัว vs คน"**
- K+R perpetual เกิดจาก **depth 4 เห็นไม่ถึง mate sequence** (จำกัดของ search) มิใช่แค่ "aggression น้อย"

---

## 2. เหตุผลหลักที่หยุด ไม่ทุ่ม refactor Business AI ต่อ

### 2.1 ขอบเขตงานหันเป็น UI (lock scope)
- ตกลงว่ายังอยาก "เล่น AI หลายรอบก่อน" ใช้ตัวเองดูจริง ก่อนตั้งค่า
- งานที่นำมาทำรอบนั้นกลับเป็น **UI/หน้าต่าง (History แยก div + portrait-lock)** ซึ่งทำแยก และไม่แตะ domain — Business ถูกขัดจังหวะ/พัก ไม่ใช่ทิ้งโค้ดเสีย

### 2.2 EvidENce ไม่ครบพอจะตัดสินใจ aggression ได้อย่างปลอดภัย
- Aggression ที่มีคนแนะนำแบบ "เมื่อได้เปรียบ → บุกเข้าหา" ยังไม่มี data แมป Scenario แยก precise
- การเอา AggressionScore global เข้า `evaluate()` = loop 8×8 ทุก node + เปลี่ยน personality โดย Depth ที่ยังตื้นอาจเปิดช่องเสียหมาก — tradeoff ไม่ใช่ free win
- ฉะนั้น "บุกเปล่า" อาจแค่เพิ่ม noise ไม่เปลี่ยน Endgame conversion

### 2.3 Endgame conversion ≠ แค่ aggression
- การปิด K+R end ต้องสอน "นำ → กัก/ลดชิ้นศัตรู/ช่วยปิด" หรือ pruning แยก (rule-based/endgame helper) ซึ่งเป็น **implementation ใหญ่แยกต่างหาก**
- depth4 search reach mate บางสายไม่ได้ → ต้อง flag เป็น solved-ish มากกว่าจะ "ปรับค่านิดเดียวก็จบ"

### 2.4 รักษาคุณภาพเกม Casual และ test-green
- `npm test`/`tsc` ครอบ 35 AI cases — การเพิ่ม heuristics ใหม่โดยไม่ bound ลึกอาจทำให้ทั้งสองฝั่ง wild และ regression
- **สอดคล้อง Product Goal:** โปรเจกต์นี้ตั้งใจให้มนุษย์ชนะได้บ้าง (ดูหัวข้อด้านบน) — จึงไม่ควรโค้ด aim "ชนะเสมอ/optimal ทุกตา" แต่ละทิ้งให้ casual ปรับ difficulty
- Bonus/Aggression ถ้าจะใส่ ควรเป็น **gate ที่ทดสอบ** และ default ให้ human-fun อยู่ก่อน

---

## 3. สิ่งที่เลือกทำ (แทนที่จะ tackle business)
- **หยุด** การลง aggressive/Endgame helper ออกไปจนกว่าจะได้ simulation mapping ที่ละเอียด
- **หัน** มา finish งาน UI ฝั่งหน้าจอ (history + portrait-lock) ที่เสี่ยงต่ำ — ทำและตรวจ `tsc` ผ่าน

> สรุปใจความสั้น: หยุดเพราะ (ก) scope เปลี่ยนเป็น UI, (ข) evidence/justification ยังไม่แน่นพอที่จะรัน aggression โดยไม่ทำให้เกมwild/regression, (ค) ตัว Endgame conversion เป็นงานใหญ่แยกจริง มิใช่ tweak ย่อ — การผลักไปก่อนรับ user เป็นแบบที่เสี่ยงกับ casual

---

## 4. Roadmap ที่เปิดไว้ (ถ้าตัดสินใจกลับไปต่อ Business)
เรียงจาก low-risk → high-value (อิงข้อสรุปในแชท):

- [ ] **(Priority 3)** เพิ่มเบี้ยเปิด ข3/จ3/ก3 ใน `OPENING_BOOK` — เร็ว ลดการหลุด book แล้วต้องคิดเอง depth4
- [ ] **(Priority 2)** `PROXIMITY_BONUS_MIN_SCORE` -150 → -100 (กล้าเดินขุนช่วย step) — กันขี้กลัวมากเกิน โดยไม่ wild
- [ ] rerun Scenario 3/7 แบบละเอียด (log ครบ/แยก) ก่อนทุ่ม Aggression — เพื่อดูว่า rook perpetual เปลี่ยนจริงไหม
- [ ] แล้วจึงประเมิน "Endgame conversion helper" แยก (ไม่ได้ผูก aggressive raw) หาก evidence หนุน

> ⚠️ ข้อควรจำตอนกลับมา: aggressive แบบ unbounded จะแทรกไปใน evaluate()/ทุก node ส่งผลกับทั้ง Minimax test — ควรทำเป็น layered/toggle (difficulty) ให้ casual รอดค่าปลอดภัยก่อน
> 
> 🔎 **เกณฑ์รับก่อนรีบทำให้ AI แข็ง**: โปรเจกต์เน้นความสนุกที่มนุษย์ชนะได้ — ถ้าราคา (regression/wild/loss of fun) สูงกว่ gain ปิดเกม ก็ยอมที่จะไม่กด strength เพิ่มในโหมดปกติ
