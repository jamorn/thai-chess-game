~/thai-chess-game | feature/ai-refactor !1 ?7  VITE_VERBOSE_MOVES=1 npx vitest run src/engine/__tests__/simulation/aiVsHuman.test.ts
npm notice run thai-chess-game@1.0.0 npx
npm notice run 'vitest' run src/engine/__tests__/simulation/aiVsHuman.test.ts

 RUN  v4.1.11 /Users/jamorn/thai-chess-game

stdout | src/engine/__tests__/simulation/aiVsHuman.test.ts > AI vs Human — Weird Openings > Scenario 1: มนุษย์เปิดด้วยเบี้ย ข3-ข4 (ไม่อยู่ใน Book)

─── Game End: DRAW (100 plies); maxMoves limit ───

📊 Scenario 1 (เบี้ย ข3-ข4):
   Winner: DRAW
   Moves: 100
   Reason: maxMoves limit

stdout | src/engine/__tests__/simulation/aiVsHuman.test.ts > AI vs Human — Weird Openings > Scenario 2: มนุษย์เปิดด้วยเบี้ย จ3-จ4 (ไม่อยู่ใน Book)

─── Game End: DRAW (100 plies); maxMoves limit ───

📊 Scenario 2 (เบี้ย จ3-จ4):
   Winner: DRAW
   Moves: 100
   Reason: maxMoves limit

stdout | src/engine/__tests__/simulation/aiVsHuman.test.ts > AI vs Human — Weird Openings > Scenario 3: มนุษย์เปิดด้วยเบี้ย ก3-ก4 (ขอบกระดาน)

─── Game End: DRAW wins (91 plies); draw (repetition/insufficient material) ───
Last 10 moves:
    82 R HORSE 23x15
    83 B ROOK  53x54
    84 R KING  56 45
    85 B ROOK  54 44
    86 R KING  45 56
    87 B ROOK  44 54
    88 R KING  56 45
    89 B ROOK  54 44
    90 R KING  45 56
    91 B ROOK  44 54

📊 Scenario 3 (เบี้ย ก3-ก4):
   Winner: DRAW
   Moves: 91
   Reason: draw (repetition/insufficient material)

stdout | src/engine/__tests__/simulation/aiVsHuman.test.ts > AI vs Human — Weird Openings > Scenario 4: มนุษย์เปิดด้วยเบี้ย 2 ตัวติดกัน (ข3-ข4 + ค3-ค4)

─── Game End: DRAW (100 plies); maxMoves limit ───

📊 Scenario 4 (เบี้ย 2 ตัวติดกัน):
   Winner: DRAW
   Moves: 100
   Reason: maxMoves limit

stdout | src/engine/__tests__/simulation/aiVsHuman.test.ts > AI vs Human — Weird Openings > Scenario 5: มนุษย์เปิดด้วยม้า 2 ตัว

─── Game End: DRAW (100 plies); maxMoves limit ───

📊 Scenario 5 (ม้า 2 ตัว):
   Winner: DRAW
   Moves: 100
   Reason: maxMoves limit

stdout | src/engine/__tests__/simulation/aiVsHuman.test.ts > AI vs Human — Weird Openings > Scenario 6: มนุษย์เปิดด้วยโคน (โคน ค2)

─── Game End: DRAW (100 plies); maxMoves limit ───

📊 Scenario 6 (โคน ค2):
   Winner: DRAW
   Moves: 100
   Reason: maxMoves limit

stdout | src/engine/__tests__/simulation/aiVsHuman.test.ts > AI vs Human — Weird Openings > Scenario 7: มนุษย์เปิดด้วยเม็ด (เม็ด ฉ2)

─── Game End: RED wins (52 plies); checkmate ───
Last 10 moves:
    43 B KING  12 03
    44 R ROOK  72x22
    45 B MET   13x22
    46 R HORSE 43x22
    47 B KING  03 02
    48 R HORSE 63 42
    49 B ROOK  04x64
    50 R KHON  75x64
    51 B ROOK  01x51
    52 R HORSE 42x23

📊 Scenario 7 (เม็ด ฉ2):
   Winner: RED
   Moves: 52
   Reason: checkmate

 ✓ src/engine/__tests__/simulation/aiVsHuman.test.ts (7 tests) 459234ms
   ✓ AI vs Human — Weird Openings (7)
     ✓ Scenario 1: มนุษย์เปิดด้วยเบี้ย ข3-ข4 (ไม่อยู่ใน Book)  128861ms
     ✓ Scenario 2: มนุษย์เปิดด้วยเบี้ย จ3-จ4 (ไม่อยู่ใน Book)  51644ms
     ✓ Scenario 3: มนุษย์เปิดด้วยเบี้ย ก3-ก4 (ขอบกระดาน)  46669ms
     ✓ Scenario 4: มนุษย์เปิดด้วยเบี้ย 2 ตัวติดกัน (ข3-ข4 + ค3-ค4)  64970ms
     ✓ Scenario 5: มนุษย์เปิดด้วยม้า 2 ตัว  44206ms
     ✓ Scenario 6: มนุษย์เปิดด้วยโคน (โคน ค2)  101232ms
     ✓ Scenario 7: มนุษย์เปิดด้วยเม็ด (เม็ด ฉ2)  21650ms

 Test Files  1 passed (1)
      Tests  7 passed (7)
   Start at  21:53:25
   Duration  459.38s (transform 50ms, setup 0ms, import 62ms, tests 459.23s, environment 0ms)

   📊 วิเคราะห์ผลการทดสอบ AI vs Weird Openings
🎯 สรุปผลลัพธ์
Scenario
การเปิด
ผลลัพธ์
เวลา
สถานะ
1
เบี้ย ข3-ข4
DRAW
128s
⚠️ maxMoves limit
2
เบี้ย จ3-จ4
DRAW
51s
⚠️ maxMoves limit
3
เบี้ย ก3-ก4
DRAW
46s
⚠️ repetition (เรือรุกลาก)
4
เบี้ย 2 ตัว
DRAW
64s
⚠️ maxMoves limit
5
ม้า 2 ตัว
DRAW
44s
⚠️ maxMoves limit
6
โคน ค2
DRAW
101s
⚠️ maxMoves limit
7
เม็ด ฉ2
RED wins
21s
✅ checkmate!
สถิติ: 6/7 เสมอ (86%), 1/7 ชนะ (14%)
🔍 จุดอ่อนที่พบ
1. AI "ขี้กลัว" เมื่อหลุดจาก Opening Book ⚠️
เมื่อ AI ไม่เจอตาเดินใน Book มันจะเลือกเดินแบบ "ปลอดภัย" แทนที่จะหาทางรุก
หลักฐาน: 6 จาก 7 เกมจบด้วย DRAW ทั้งที่ AI มีโอกาสบุก
สาเหตุ: ไม่มี heuristic ที่กระตุ้นให้ AI "กล้าเสี่ยง" หรือ "บุก"
2. Scenario 3: เรือรุกลาก (Perpetual Check) 🚢
ดูจาก log:
82 R HORSE 23x15
83 B ROOK  53x54
84 R KING  56 45  ← ขุนแดงหนี
85 B ROOK  54 44  ← เรือดำรุก
86 R KING  45 56  ← ขุนแดงหนี
87 B ROOK  44 54  ← เรือดำรุกลาก
... (วนไปมาจนจบเกม)

ปัญหา: AI ดำเห็นว่ามีโอกาสชนะ (ได้เปรียบเรือ) แต่เลือก "รุกลาก" แทนที่จะหาทางรุกจน
สาเหตุ: PROXIMITY_BONUS_MIN_SCORE = -150 อาจทำให้ AI "ขี้กลัว" เกินไป
3. Scenario 7: ชนะได้เร็วที่สุด! 🏆
43 B KING  12 03
44 R ROOK  72x22  ← เรือแดงกิน
45 B MET   13x22
46 R HORSE 43x22  ← ม้าแดงกิน
47 B KING  03 02
48 R HORSE 63 42
49 B ROOK  04x64
50 R KHON  75x64
51 B ROOK  01x51
52 R HORSE 42x23  ← รุกจน!

ทำไมชนะ? เพราะการเปิดด้วยเม็ด ฉ2 ทำให้ AI ดำ "เสียจังหวะ" และ AI แดงใช้โอกาสบุกได้สำเร็จ
💡 คำแนะนำในการปรับปรุง
Priority 1: เพิ่ม "Aggression Heuristic" 🎯
เพิ่ม heuristic ที่กระตุ้นให้ AI "กล้าบุก" เมื่อได้เปรียบ:
// src/engine/Evaluator.ts - เพิ่มใน evaluate()
public static evaluate(board: Board, aiSide: Side): number {
  const material = this.evaluateStatic(board, aiSide);
  if (Math.abs(material) > this.LAZY_EVAL_THRESHOLD) {
    return material;
  }
  let score = material;
  score += this.mobilityScore(board, aiSide);
  score += this.pawnStructureScore(board, aiSide);
  score += this.rookOpenFileScore(board, aiSide);
  score += this.centerControlScore(board, aiSide);
  score += this.pawnOverExtensionScore(board, aiSide);
  
  // ✅ ใหม่: Aggression Bonus - กระตุ้นให้ AI บุกเมื่อได้เปรียบ
  score += this.aggressionScore(board, aiSide);
  
  return score;
}

/**
 * Aggression Heuristic: ให้โบนัสเมื่อ AI ได้เปรียบและควรบุก
 * หลักการ: ถ้า AI มีหมากมากกว่า/ได้เปรียบ → กระตุ้นให้ดันเบี้ย/รุกเข้าหาขุนศัตรู
 */
private static aggressionScore(board: Board, aiSide: Side): number {
  const material = this.materialScore(board, aiSide);
  
  // ถ้าได้เปรียบมาก (> 200 คะแนน) → กระตุ้นให้บุก
  if (material > 200) {
    const enemyKingPos = this.findKing(board, aiSide === Side.RED ? Side.BLACK : Side.RED);
    if (!enemyKingPos) return 0;
    
    // นับจำนวนหมากที่ "เข้าใกล้" ขุนศัตรู (ภายใน 3 ช่อง)
    let attackers = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board.getPieceAt(r, c);
        if (!piece || piece.side !== aiSide) continue;
        
        const dist = Math.max(
          Math.abs(r - enemyKingPos[0]),
          Math.abs(c - enemyKingPos[1])
        );
        
        if (dist <= 3) attackers++;
      }
    }
    
    // โบนัสตามจำนวนหมากที่เข้าใกล้ขุนศัตรู
    return attackers * 15;
  }
  
  return 0;
}

private static materialScore(board: Board, aiSide: Side): number {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board.getPieceAt(r, c);
      if (!piece) continue;
      const value = this.PIECE_VALUES[piece.type];
      score += piece.side === aiSide ? value : -value;
    }
  }
  return score;
}
Priority 2: ปรับ PROXIMITY_BONUS_MIN_SCORE ⚖️
ค่า -150 อาจ "ขี้กลัว" เกินไป ลองปรับเป็น -100 หรือ -50:
// src/engine/Evaluator.ts
private static readonly PROXIMITY_BONUS_MIN_SCORE = -100; // จาก -150

เหตุผล: ถ้า AI เสียเปรียบไม่มาก (เช่น เสียเบี้ย 1 ตัว = -100) มันควรยัง "กล้า" เดินขุนเข้าประชิดเพื่อหาทางเสมอ/ชนะ
Priority 3: เพิ่ม Opening Book ให้ครอบคลุม 📚
เพิ่มตาเดินแปลกๆ เข้าไปใน Book:
// src/engine/data/openingBook.ts
START: {
  moves: [
    { from: [7, 1], to: [6, 3], weight: 0.4 }, // ม้า ง3
    { from: [5, 3], to: [4, 3], weight: 0.2 }, // เบี้ย ง3
    { from: [5, 2], to: [4, 2], weight: 0.15 }, // เบี้ย ค3
    { from: [5, 1], to: [4, 1], weight: 0.1 }, // เบี้ย ข3 ✅ เพิ่ม
    { from: [5, 4], to: [4, 4], weight: 0.1 }, // เบี้ย จ3 ✅ เพิ่ม
    { from: [5, 0], to: [4, 0], weight: 0.05 }, // เบี้ย ก3 ✅ เพิ่ม
  ]
}
🚀 ขั้นตอนทดสอบ
เพิ่ม Aggression Heuristic (โค้ดด้านบน)
ปรับ PROXIMITY_BONUS_MIN_SCORE เป็น -100
รัน test อีกครั้ง:

   VITE_VERBOSE_MOVES=1 npx vitest run src/engine/__tests__/simulation/aiVsHuman.test.ts

   สิ่งที่คาดหวัง:
Scenario 1-6 ควรจบด้วย checkmate หรือ ชนะ แทนที่จะ DRAW
AI จะ "กล้าบุก" มากขึ้นเมื่อได้เปรียบ
📈 สรุป
AI ของคุณ "ฉลาด" แล้ว แต่ "ขี้กลัว" เกินไป 🐔
เมื่อหลุดจาก Opening Book มันจะเลือกเดินแบบ "ปลอดภัย" แทนที่จะหาทางรุก การเพิ่ม Aggression Heuristic จะช่วยให้ AI "กล้าเสี่ยง" และ "บุก" ได้เหมือนมนุษย์มากขึ้น
