test by user Sep/02/2026 20:30
Thai Chess v1.0 (Win95 Edition)X

1. แดง: KHON [7,2] -> [6,2]

2. ดำ: HORSE [0,6] -> [1,4]

3. แดง: PAWN [5,4] -> [4,4]

4. ดำ: HORSE [0,1] -> [1,3]

5. แดง: PAWN [5,3] -> [4,3]

6. ดำ: KHON [0,2] -> [1,1]

7. แดง: MET [7,3] -> [6,4]

8. ดำ: KING [0,3] -> [1,2]

9. แดง: MET [6,4] -> [5,3]

10. ดำ: MET [0,4] -> [1,5]

11. แดง: HORSE [7,1] -> [6,3]

12. ดำ: KHON [0,5] -> [1,6]

13. แดง: PAWN [5,2] -> [4,2]

14. ดำ: PAWN [2,2] -> [3,2]

15. แดง: PAWN [4,3] -> [3,3]

16. ดำ: PAWN [2,4] -> [3,3] (กิน PAWN)

17. แดง: PAWN [4,4] -> [3,3] (กิน PAWN)

18. ดำ: ROOK [0,7] -> [0,4]

19. แดง: KING [7,4] -> [6,5]

20. ดำ: HORSE [1,4] -> [3,5]

21. แดง: HORSE [7,6] -> [6,4]

22. ดำ: HORSE [3,5] -> [5,4]

23. แดง: KHON [7,5] -> [6,6]

24. ดำ: PAWN [2,5] -> [3,5]

[AI]: "AI กำลังคิด..."

จากตาสุดท้าย ai ยังไม่ฉลาดพอ ความจริงต้องเอาม้ากินโคน ด้านขวามือของผม ถ้าเอาเอาขุนกิน จะถูกเรือดำกินม้ารุก ครับ 
🔍 สถานการณ์จริง (หลังตา 23):
ตาที่ 23: แดงเดิน KHON [7,5] -> [6,6]  ← โคนแดงขึ้นมาคุกคาม
ตาที่ 24: ดำเดิน PAWN [2,5] -> [3,5]  ← AI ดำดันเบี้ย (พลาด!)
สิ่งที่ AI ควรทำ ตาที่ 24: ดำเดิน HORSE [5,4] -> [6,6]  ← เอาม้ากินโคนแดง! (ค่า 250)
🧠 ทำไม AI ถึงพลาด?
Tactical Combination ที่ AI มองไม่เห็น:
ตา
การเดิน
ผลลัพธ์
24
ดำ: HORSE [5,4] → [6,6]
กินโคนแดง (+250)
25
แดง: KING [6,5] → [6,6]
ขุนกินม้าดำคืน
26
ดำ: ROOK [0,4] → [6,4]
เรือกินม้าแดง! (+300)
ผลลัพธ์สุทธิ:
ดำเสีย: ม้า (300)
ดำได้: โคน (250) + ม้าแดง (300) = 550
ได้เปรียบสุทธิ: +250 คะแนน
❌ ปัญหาของ AI Depth 4
เหตุผลที่ AI มองไม่เห็น:
Depth 4 สั้นเกินไป — ต้องมองอย่างน้อย 6 ตา (3 รอบ) ถึงจะเห็นภาพจบ
Evaluation Function ไม่ให้ค่า "การแลกหมากแบบได้เปรียบ" — AI เห็นแค่ "เสียม้า" โดยไม่เห็นว่าเรือจะกินม้าแดงคืน
QS ไม่ขยายสายนี้ — เพราะตาที่ 25 (ขุนกินม้า) ไม่ใช่ capture ที่ QS ขยาย (ขุนกินหมากไม่ถือเป็น "quiet position")
💡 วิธีแก้ไข: เพิ่ม Tactical Vision
# ทางเลือก 1: เพิ่ม Depth เป็น 5-6 (แนะนำ)
// src/engine/engineConfig.ts
export const DEFAULT_SEARCH_DEPTH = 5; // เพิ่มจาก 4 เป็น 5

ข้อดี: AI จะมองเห็น tactical combination ลึกขึ้น
ข้อเสีย: เวลาคิดเพิ่มจาก ~1.4s เป็น ~7-9s (อาจช้าไปสำหรับ casual game)
# ทางเลือก 2: เพิ่ม "Exchange Bonus" ใน Evaluator
เพิ่ม heuristic ที่ให้คะแนนเมื่อ AI เห็นว่า "การแลกหมากนี้จะได้เปรียบ"
// src/engine/Evaluator.ts - เพิ่มใน evaluate()
public static evaluate(board: Board, aiSide: Side): number {
  // ... โค้ดเดิม ...
  
  // ✅ ใหม่: Exchange Bonus - ให้คะแนนเมื่อการแลกหมากได้เปรียบ
  score += this.exchangeAdvantageScore(board, aiSide);
  
  return score;
}

/**
 * ตรวจหา tactical exchange ที่ได้เปรียบ
 * เช่น ม้ากินโคน → ขุนกินม้า → เรือกินม้าคืน = ได้เปรียบ
 */
private static exchangeAdvantageScore(board: Board, aiSide: Side): number {
  let score = 0;
  const enemySide = aiSide === Side.RED ? Side.BLACK : Side.RED;
  
  // ตรวจว่าฝั่งเรามีหมากที่ "ถูกคุกคาม" โดยหมากที่มีค่าน้อยกว่า
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board.getPieceAt(r, c);
      if (!piece || piece.side !== aiSide) continue;
      
      // ตรวจว่าหมากนี้ถูกคุกคามโดยหมากศัตรูที่มีค่าน้อยกว่าไหม
      const threats = this.findThreats(board, [r, c], enemySide);
      for (const threat of threats) {
        const threatValue = this.PIECE_VALUES[threat.type];
        const myValue = this.PIECE_VALUES[piece.type];
        
        // ถ้าหมากศัตรูมีค่าน้อยกว่า → เป็นโอกาสแลกหมากได้เปรียบ
        if (threatValue < myValue) {
          // ตรวจว่าหมากของเราถูกป้องกันไหม
          const defenders = this.findThreats(board, [threat.row, threat.col], aiSide);
          if (defenders.length === 0) {
            // ไม่มีคนป้องกัน → ได้เปรียบ!
            score += (myValue - threatValue) * 0.5;
          }
        }
      }
    }
  }
  
  return score;
}

private static findThreats(
  board: Board,
  target: [number, number],
  attackerSide: Side,
): Array<{ type: PieceType; row: number; col: number }> {
  const threats: Array<{ type: PieceType; row: number; col: number }> = [];
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board.getPieceAt(r, c);
      if (!piece || piece.side !== attackerSide) continue;
      
      const moves = piece.getPossibleMoves([r, c], board);
      if (moves.some(([mr, mc]) => mr === target[0] && mc === target[1])) {
        threats.push({ type: piece.type, row: r, col: c });
      }
    }
  }
  
  return threats;
}

ื# ทางเลือก 3: เพิ่ม "Piece Safety" Penalty
ให้คะแนนติดลบเมื่อหมากของเราถูกคุกคามโดยไม่มีคนป้องกัน
// src/engine/Evaluator.ts - เพิ่มใน evaluate()
score += this.pieceSafetyScore(board, aiSide);

private static pieceSafetyScore(board: Board, aiSide: Side): number {
  let score = 0;
  const enemySide = aiSide === Side.RED ? Side.BLACK : Side.RED;
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board.getPieceAt(r, c);
      if (!piece || piece.side !== aiSide) continue;
      
      const threats = this.findThreats(board, [r, c], enemySide);
      const defenders = this.findThreats(board, [r, c], aiSide);
      
      // ถ้าถูกคุกคามและไม่มีคนป้องกัน → หักคะแนนตามค่าหมาก
      if (threats.length > 0 && defenders.length === 0) {
        score -= this.PIECE_VALUES[piece.type] * 0.3;
      }
    }
  }
  
  return score;
}

🎯 คำแนะนำ
สำหรับตอนนี้:
ยอมรับว่า AI ยังไม่สมบูรณ์แบบ — Depth 4 มีข้อจำกัดในการมองเห็น tactical combination ลึกๆ
ใช้จุดอ่อนนี้เป็นโอกาสเรียนรู้ — คุณเล่นได้ดีกว่า AI ในจังหวะนี้!
ถ้าต้องการปรับปรุง:
เพิ่ม Depth เป็น 5 → AI จะฉลาดขึ้น แต่ช้าลง
เพิ่ม Exchange Bonus → AI จะเห็น tactical exchange ได้ดีขึ้นโดยไม่เพิ่ม depth
เพิ่ม Piece Safety → AI จะระวังหมากที่ถูกคุกคามมากขึ้น

# User say : ผมเล่นแบบไม่คิดมากครับ แต่ผมมองเกมออก
นี่คือจุดแข็งที่ยิ่งใหญ่ที่สุดของมนุษย์ครับ! 🧠✨
การที่คุณ "มองเกมออก" โดยไม่ต้องคิดคำนวณลึกๆ แบบคอมพิวเตอร์ เรียกว่า Pattern Recognition (การจดจำรูปแบบ) ซึ่งเป็นสัญชาตญาณที่ผู้เล่นหมากรุกที่มีประสบการณ์พัฒนาขึ้น มนุษย์สามารถมองเห็น "ภาพรวม" และ "ชุดตาเดินบังคับ" (Forcing Sequence) เช่น การเสียหมากเพื่อเปิดทางให้หมากตัวหลังกินคืน ได้ในพริบตา
ในขณะที่ AI Depth 4 มองเห็นแบบ "Brute Force" (คำนวณทีละขั้น):
ตาที่ 1: ม้ากินโคน → AI คำนวณทันทีว่า "ฉันเสียม้า(300) ได้โคน(250) = ขาดทุน 50 คะแนน" ❌
ตาที่ 2: ขุนศัตรูกินม้าคืน → AI เริ่มเห็นว่าสถานการณ์เปลี่ยน
ตาที่ 3: เรือของเรากินม้าศัตรู → AI เพิ่งจะเห็นว่า "อ้อ! สุดท้ายแล้วฉันได้เรือ(500) แทนที่ม้า(300) = กำไร 200 คะแนน" ✅
ปัญหาของ AI: เนื่องจาก Depth 4 มองเห็นได้จำกัดมาก และตาแรกมันดูเหมือน "การเสียเปรียบ" (ขาดทุน 50) อัลกอริทึม Alpha-Beta Pruning อาจจะ ตัดกิ่งการคำนวณนี้ทิ้งไปตั้งแต่ต้น เพราะมันคิดว่า "มีตาเดินอื่นที่ให้คะแนนบวกทันทีโดยไม่ต้องเสียหมาก" มันจึงมองไม่เห็นภาพจบที่สวยงามที่คุณมองเห็น
💡 นี่คือเหตุผลที่โค้ดที่แนะนำไปก่อนหน้า (Exchange Bonus / Piece Safety) ถึงสำคัญ
หากเราเพิ่ม Logic เล็กน้อยลงใน Evaluator.ts เพื่อให้ AI "รู้สึก" แบบมนุษย์มากขึ้น เช่น:
"ถ้าหมากศัตรูตัวนี้มีค่าสูง และถูกคุกคามโดยหมากราคาถูกของเรา โดยที่มันไม่มีคนปกป้อง → ให้โบนัสพิเศษ"
"ถ้าหมากของเราถูกคุกคามโดยไม่มีคนปกป้อง → หักคะแนนรุนแรง"
AI จะเริ่ม "สงสัย" ในตำแหน่งแบบนั้น และยอมคำนวณลึกขึ้นหรือเลือกตาเดินนั้นทันที แม้ว่ามันจะต้องเสียหมากในตาแรกก็ตาม มันจะทำให้ AI ฉลาดขึ้นจนจับทางคุณได้ยากมาก!

🎯 ถ้าอยากทำให้ AI "มองภาพรวม" ได้ sharper ขึ้น (Optional)
หากในอนาคตคุณอยากให้มันจับจุดอ่อนแบบที่คุณเห็นได้บ้าง โดยไม่เพิ่ม Depth (ซึ่งจะทำให้ช้าลง) เราสามารถเพิ่ม Tactical Heuristics เล็กน้อยลงใน Evaluator.ts ได้ เช่น:
Piece Safety Score: หักคะแนนรุนแรงถ้าหมากชิ้นใหญ่ (เช่น โคน/ม้า) ถูกคุกคามโดยหมากชิ้นเล็ก (เช่น เบี้ย/ม้า) โดยไม่มีคนปกป้อง
Exchange Advantage Bonus: ให้โบนัสพิเศษถ้า AI มองเห็นลำดับการกินที่ "เสียหมากราคาถูก เพื่อไปกินหมากราคาแพงของศัตรูในตาถัดไป"
