# UI Session — กระดาน + หน้าต่างประวัติการเดิน (Board & Move-History UI)

> บันทึกสรุปใจความของงานฝั่ง UI ที่คุยกันรอบนี้ — **UI-only** (ไม่แตะ business logic / AI)
> จุดสำคัญ: ทำไม work นี้แยกเลเยอร์ และจบตรงไหน / ยังไม่ได้ไปต่อที่ business

---

## 🎯 เป้าหมายรอบนี้ (สิ่งที่ผู้ใช้ขอ)

ผู้ใช้ขอ "แก้ไขเล็กน้อย" ในฝั่งหน้าจอ (ตู้เกม) **โดยไม่ปรับกติกา/ไม่ปรับเอนจิน**:

1. เอาหน้าต่าง **Move History** ออกจากบริเวณติดกับ board → ย้ายไปเป็น **บล็อกแยกต่างหาก**
2. ทำ **toggle (expand/collapse)** — ค่าเริ่มต้น **ซ่อน (hidden)** แล้วให้ **ผู้เล่นกดปุ่มเปิดเอง** ถ้าอยากดู

> Google: ใจความคือ ทำให้เกมบนมือถือ/จอเล็กไปง่าย ลดอะไรที่แย่งพื้นที่ board — ไม่ได้เปลี่ยนว่าหมากเดินอย่างไร

---

## ✅ สิ่งที่ทำไปจริง (UI layer)

### 1. History แยกออกจาก board
- เดิมหน้าต่างประวัติอยู่ข้าง board (`sidebar`/`history-box`)
- ย้ายไปเป็น section อิสระใหม่ `#history-section` (อยู่ใต้ board ในโครง HTML เดียวกับ window Win95)
- ตัวเก็บข้อมูลจริงยังเป็น `MoveHistoryView` (`src/ui/MoveHistoryView.ts`) ที่รับ `Move` → เพิ่ม `<li>` ต่อเนื่อง — **ไม่เกี่ยวกับ domain/AI**

### 2. Toggle + เริ่ม hidden
- `index.html`:
  - ปุ่ม `#toggle-history-btn` (Win95 style)
  - กล่อง `#history-box` มี class **`hidden`** เป็นค่าเริ่มต้น
- เมื่อกดปุ่ม → สลับ `.hidden` → text ปุ่มผลับ "▶ …(เปิดดู)" / "▼ …(ซ่อน)"

### 3. (ปิดท้าย session) Portrait-lock UI
ภายหลังคุยกันสรุปว่า แทนที่จะไล่ fix CSS ให้ถูกทุก orientation (ซึ่งทำให้ต้องไปยุ่ง board coordinate หลายรอบ) —
- สร้าง `src/ui/deviceInfo.ts` (helper ถาม device: width/height/orientation/DPR/touch)
- สร้าง `src/ui/portraitLock.ts` → ถ้าอุปกรณ์พกพาหมุนเป็น **แนวนอน** ให้ขึ้น **modal "กรุณาหมุนเป็นแนวตั้ง"** และล็อก scroll; กลับแนวตั้งคือปิดเอง
- ทั้งหมดยัง **UI-only** (แตะแค่ `<div>`/CSS/Math มือถือ ไม่ใช่ domain `Board`/`Move`/AI)

---

## 🔒 เพราะอะไร Session UI นี้จึง "ไม่ไต่ลงไปแตะ business logic"

- **ขอบเขตงานถูกล็อกว่า UI** — ผู้ใช้ชี้ชัดว่าขอ "แก้ไขเล็กน้อย" ฝั่งหน้าต่าง ไม่ใช่ปรับกฎ/พฤติกรรมเอนจิน
- **Domain (`Board` / `Move` / Minimax / Book) เป็นเลเยอร์เสถียร** แต่เดี๋ยวนี้ถูกแยก + test 35 cases ครอบ
- UI ทั้งหมดที่ทำทำงาน **แยก DOM/CSS แทนการส่งสายเข้า domain** => เดิน row cell/ประวัติยังถูกต้องทุกกรณี
- การแก้ business ต่อ (เช่น aggression / Endgame conversion) ต้องการ validation/log analysis กับ test simulation ที่ยังไม่ทำ (ดูไฟล์ที่ 2) — **จึงเลือกปิดงานตรง UI นี้สะอาดก่อน**

---

## 📁 ไฟล์ที่touch รอบนี้ (เฉพาะ UI ชั้น)

| ไฟล์                                        | บทบาท                                        |
| ------------------------------------------- | -------------------------------------------- |
| `index.html`                                | โครงหน้า + ปุ่ม toggle + CSS เริ่มต้น + modal portrait |
| `src/ui/MoveHistoryView.ts`                 | แสดงรายการเดิน (คงเดิม ไม่แตะ business)       |
| `src/ui/deviceInfo.ts` (ใหม่)               | helper อ่านขนาด/orientation ของ device        |
| `src/ui/portraitLock.ts` (ใหม่)             | modal ล็อกแนวตั้ง                             |
| `src/main.ts`                               | import `initPortraitLock` + DOMContentLoaded  |

> ตรวจ: `npx tsc --noEmit` ✅ ผ่าน ไม่มี regression ใน domain

---

## 🗺️ เส้นที่เปิดไว้ (ถ้าจะกลับไปทำต่อ เน้น UI/leicht)
- [ ] ปรับ `MoveHistoryView` ให้อ่านง่ายขึ้น (รูป/หมาก ไม่ใช่แค่คู่อันดับ) — UI-only ได้
- [ ] ปุ่มเปิด board coords (1-8/ก-ญ) แบบ user-toggle อนาคต
- [ ] (ไม่ใช่ UI) ถ้าเปลี่ยนใจกลับไปทำ AI ต่อ → ดูไฟล์คู่ที่ 2
