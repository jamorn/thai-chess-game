# ♟️ Thai Chess Engine (TypeScript + Win95 Nostalgia AI)

โปรแกรมหมากรุกไทยจำลองสไตล์ **Windows 95 Classic** ที่พัฒนาขึ้นด้วย **TypeScript (TS)** และแนวคิด **Object-Oriented Programming (OOP)** ตัวเกมเน้นความเก่ง ดุดัน และประมวลผลได้อย่างรวดเร็วบน Web Browser โดยผสานลอจิกคลาสสิกเข้ากับเทคนิค **Modern Mini AI** เพื่อให้คิดลึกได้ถึง 6–8 ชั้นโดยที่หน้าจอ UI ไม่กระตุก

---

## 🎯 ฟีเจอร์หลัก (Key Features)

- **Pure TypeScript & Strict OOP Architecture:** สถาปัตยกรรมแบบแยกส่วน (Decoupled Domain, Engine, and UI) ดูแลรักษาง่าย และขยายต่อสะดวก
- **Win95 Nostalgia Trash Talker:** ระบบสุ่มข้อความปั่นประสาทผู้เล่นระดับตำนาน เช่น _"อย่าคิดสั้น!"_, _"เปิดหน้าขุนเฉยเลย"_ เมื่อผู้เล่นเดินพลาด
- **Non-blocking Multi-threaded AI:** ประมวลผล Minimax Search บน **Web Worker** แยกต่างหาก ทำให้ UI ลื่นไหลตลอดเวลาแม้ AI กำลังคิดลึก
- **Undo & Replay System:** บันทึก Move History เพื่อย้อนดูสายการเดินแบบย้อนกลับ (Reverse Engineering) สำหรับศึกษาเกม
- **Game State Detection:** ตรวจจับสถานะจบเกมอัตโนมัติ (รุกจน / เสมอตาย / เสมอหมากไม่พอ) พร้อมแสดงชัยชนะ
- **Unit-Tested Domain Logic:** กติกาและ AI ครอบคลุมด้วย **Vitest** และมี **GitHub Actions CI** อัตโนมัติ

---

## ♟️ กฎการเดินหมากรุกไทย (Makruk Rules)

เกมนี้จำลองกฎหมากรุกไทยมาตรฐานบนกระดาน 8×8 อย่างครบถ้วน (รายละเอียดใน `Docs/makruk-rule.md`):

| หมาก                            | เส้นทางเดิน                                                      | หมายเหตุ                                                |
| ------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------- |
| **ขุน** (King/Khun)             | เดิน 1 ช่องในทิศใดก็ได้ (ตามแถว/หลัก/ทแยง)                       | ไม่มี Castling เหมือนหมากรุกสากล                        |
| **เรือ** (Rook/Ruea)            | เดินตรงตามแถว/หลักกี่ช่องก็ได้                                   | หยุดเมื่อมีหมากขวาง; กินหมากฝั่งตรงข้ามได้ช่องแรกที่เจอ |
| **ม้า** (Horse/Ma)              | เดินรูปตัว L (2 ช่องทางตรง + 1 ช่องทางขวาง)                      | ข้ามหมากอื่นได้ เหมือน Knight หมากรุกสากล               |
| **โคน** (Khon)                  | เดินเฉียง 1 ช่อง (4 ทิศ) **หรือ** เดินหน้าตรง 1 ช่อง (รวม 5 ทิศ) | เดินได้ทั่วกระดาน (ไม่มีพระราชฐานแบบหมากรุกจีน)         |
| **เม็ด** (Met)                  | เดินเฉียง 1 ช่อง (4 ทิศ)                                         |                                                         |
| **เบี้ย** (Bia)                 | เดินหน้าตรง 1 ช่อง, กินเฉียงหน้า 1 ช่อง                          | ไม่มี step แรก 2 ช่อง, ไม่มี En Passant, เดินถอยไม่ได้  |
| **เบี้ยหงาย** (Bia Ngai / เม็ด) | เมื่อเบี้ยถึงแถวที่ 3 ของฝั่งตรงข้ามจะโปรโมต                     | สโคปการเดินใหม่ = เหมือนเม็ด (เฉียง 4 ทิศ)              |

> **หมายเหตุ:** หมากรุกไทย **ไม่มี** กฎพระราชฐาน (Palace) แบบหมากรุกจีน ขุนและโคนจึงเดินไปทั่วทั้งกระดาน 8×8 ได้

> **หมายเหตุเรื่องแถวโปรโมต:** บนระบบพิกัดของโค้ด (row 0 = แถวบนสุดฝั่งดำ, row 7 = แถวล่างสุดฝั่งแดง) เบี้ยแดงจะโปรโมตที่ **row 2** และเบี้ยดำที่ **row 5** ซึ่งตรงกับกติกา "แถวที่ 3 ของฝั่งตรงข้าม"

---

## 🧠 สถาปัตยกรรมความฉลาดของ AI (Hybrid Engine)

AI ของโปรแกรมนี้ถอดแบบลอจิกมาจากโปรแกรมหมากรุกไทยภาษา C ยุค Win95 แต่เสริมความแม่นยำและความเร็วด้วยเทคนิค Mini AI สมัยใหม่:

### 1. Core Logic (Win95 Classic)

- **Minimax Algorithm:** จำลองการเดินหมากแบบต้นไม้การตัดสินใจ (Decision Tree) สลับฝั่งบุก/รับ
- **Alpha-Beta Pruning:** ตัดกิ่งการเดินที่ไม่จำเป็นทิ้ง เพื่อลดจำนวนโหนดคำนวณจาก $O(b^d)$ เหลือ $O(b^{d/2})$
- **Piece-Square Tables (PST):** ประเมินคะแนนชัยภูมิของหมากแต่ละประเภท เช่น ม้าคุมกลางกระดานได้คะแนนเพิ่ม, เรือเปิดหน้าช่องสว่างได้โบนัส

### 2. Modern Mini AI Enhancements

- **Iterative Deepening Search (IDS):** ค่อยๆ ค้นหาความลึกทีละระดับ ($1 \rightarrow 2 \rightarrow ... \rightarrow N$) ช่วยให้ได้รับตาเดินที่ดีเบื้องต้นเอาไปตัดสาย Alpha-Beta ในชั้นลึกๆ ได้เร็วขึ้นทวีคูณ
- **MVV-LVA Move Ordering:** เรียงลำดับคิวการคำนวณจากตาจับกิน _Most Valuable Victim - Least Valuable Attacker_ (เอาตัวเล็กกินตัวใหญ่ก่อน) ทำให้เกิดการตัดกิ่ง (Cutoff) ได้ตั้งแต่ต้นกิ่งก้าน

---

## 🧪 การทดสอบ (Testing with Vitest)

โปรเจกต์มี **Unit Test** ทั้งสิ้น 20+ test cases ครอบคลุม:

- **Minimax Engine:** ตรวจสอบตาเดินของ AI, การเลือกกินหมากคุ้มค่า (capture) ผ่าน `capturedPiece` โดยตรง, และคืน `null` เมื่อถูกโคนจน
- **Game State:** ตรวจจับ `CHECKMATE`, `STALEMATE`, `DRAW` (insufficient material) และ `IN_PROGRESS`
- **Movement Rules:** ตรวจการเดินของทุกหมากตามกฎ
  - **Rook blocking:** เดินจนกว่าจะเจอหมากขวาง, กินแล้วหยุด, เดินถึงขอบกระดานได้เมื่อว่าง
  - **Met capture:** กินหมากฝั่งตรงข้ามในช่องเฉียง, ไม่เดินไกลเกิน 1 ช่อง
  - **Khon:** เดินเฉียง 4 ทิศ + ไปหน้าตรง 1 ช่อง (5 ทิศ), ไม่ถอยหลังตรง
  - **Pawn promotion:** โปรโมตเป็นเม็ดเมื่อถึงแถวที่ 3 ของฝั่งตรงข้าม, เดินถอยไม่ได้, เม็ดเดินเฉียงถอยหลังหลังโปรโมต
  - **No Palace Rule:** ยืนยันว่าหมากเดินทั่วกระดานได้ตามหมากรุกไทย

```bash
# รันเทสครั้งเดียว
npm test

# รันแบบ Watch (รีรันทุกครั้งที่แก้ไฟล์)
npm run test:watch
```

---

## ⚙️ CI/CD (GitHub Actions)

โปรเจกต์มาพร้อม workflow อัตโนมัติ `.github/workflows/ci.yml` ซึ่งทำงานทุกครั้งที่ push/PR ไปยัง branch `main` หรือ `master` โดย:

1. ติดตั้ง Node.js เวอร์ชัน LTS
2. แคชพึ่งพา (dependencies) เพื่อความเร็ว
3. รัน `npm install`
4. ตรวจสอบ TypeScript ด้วย `tsc --noEmit`
5. รันชุดทดสอบทั้งหมดด้วย `npm test`
6. Build production bundle ด้วย `npm run build`

ทุกขั้นตอนต้องผ่านหมด (สีเขียว) ถึงจะถือว่า merge ได้ — ดูผลที่แท็บ **Actions**

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
thai-chess-game/
├── README.md                     # เอกสารโครงการ
├── index.html                    # Entry point ของ HTML
├── package.json                  # Dependencies (TypeScript, Vite, Vitest, Prettier)
├── tsconfig.json                 # TypeScript Compiler Config (Strict Mode)
├── vite.config.ts                # Vite Config
├── .github/
│   └── workflows/
│       └── ci.yml                # GitHub Actions CI อัตโนมัติ
├── Docs/
│   ├── fix.md                     # บันทึกการแก้บั๊ก / คำแนะนำ
│   └── makruk-rule.md             # กติกาการเดินหมากรุกไทย
└── src/
  ├── main.ts                   # Entry point ตั้งค่า UI และ Events
  ├── domain/                   # Domain Model & Game Rules
  │   ├── enums/
  │   │   ├── Side.ts           # RED | BLACK
  │   │   └── PieceType.ts      # KING, ROOK, HORSE, KHON, MET, PAWN
  │   ├── models/
  │   │   ├── Position.ts       # Coordinates [row, col]
  │   │   ├── Move.ts           # Move history record
  │   │   ├── GameState.ts      # IN_PROGRESS | CHECKMATE | STALEMATE | DRAW
  │   │   ├── constants.ts      # ค่าคงที่ (Board Size, Promotion Row, ...)
  │   │   └── pieces/
  │   │       ├── Piece.ts      # Abstract Base Piece
  │   │       ├── King.ts
  │   │       ├── Rook.ts
  │   │       ├── Horse.ts
  │   │       ├── Khon.ts
  │   │       ├── Met.ts
  │   │       └── Pawn.ts
  │   └── Board.ts              # Game Board State & Legal Move Engine
  ├── engine/                   # AI Engine Logic
  │   ├── Evaluator.ts          # Positional & Material Scoring
  │   ├── Minimax.ts            # Core Search Engine
  │   ├── AiEngine.ts           # AI Controller
  │   ├── ai.worker.ts          # Web Worker Thread
  │   └── __tests__/
  │       └── Minimax.test.ts   # Unit Tests (Vitest)
  ├── ui/                       # Presentation Layer
  │   ├── BoardView.ts          # DOM/Canvas Renderer
  │   ├── MoveHistoryView.ts    # History & Undo UI
  │   └── TrashTalker.ts        # Win95 Trash Talker Manager
      └── Slide.ts
  └── assets/                   # Images and sound effects
```

ไฟล์ `src/ui/Slide.ts` ที่เพิ่มเข้ามาเป็นเพียง Component เสริมในส่วนของ UI (Presentation Layer) หากไม่ได้ถูก import ไปใช้งานใน `src/main.ts` หรือไฟล์อื่น ตัว TypeScript Compiler และ Vite จะมองเป็น Module อิสระ และในการสั่ง `npm run build` Vite จะทำการ Tree-shaking ตัดโค้ดส่วนที่ไม่ถูกใช้งานออกให้อัตโนมัติครับ

กรณีต้องการจัดการกับไฟล์นี้ ทำได้ 2 ทาง:

- **ปล่อยไว้ใน Project:** หากในอนาคตต้องการทำ Slide แสดงวิธีเล่น หรือ Banner หน้าจอ Win95
- **ลบออก:** หากต้องการให้โครงสร้างไฟล์ตรงตาม Project Tree แบบ 100% สามารถลบไฟล์ `src/ui/Slide.ts` ทิ้งได้ทันทีโดยไม่กระทบกับการทำงานของส่วนอื่นครับ

---

## 🚀 วิธีรันโปรเจกต์

```bash
# ติดตั้ง dependencies
npm install

# รัน dev server (โหมดพัฒนา)
npm run dev

# สร้าง production build
npm run build

# พรีวิว build
npm run preview
```

> **สุดท้าย:** ให้ใช้เครื่องมือสาย Solar (PowerShell) แทน CMD โดยแทนที่ `&&` ด้วย `;` เช่น `npm run dev; npm run build`
