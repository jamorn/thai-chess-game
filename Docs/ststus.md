📊 สรุปสถานะการนำไปใช้ในปัจจุบัน
จากการตรวจสอบโค้ดของคุณ (Evaluator.ts, openingBook.ts) ผมพบว่า หลักการส่วนใหญ่ถูกนำไปใช้แล้ว ดังนี้:
✅ ถูกนำไปใช้แล้ว (7/10 ข้อ):
หลักการ
ไฟล์ที่นำไปใช้
วิธีการ
ข้อ 1: ม้า ง2 (ม้าขโมย)
openingBook.ts
START: ม้า [7,1]→[6,3] weight 0.5
ข้อ 2: โคน ฉ7 (ต้านม้าขโมย)
openingBook.ts
"1r": โคน [0,5]→[1,5] weight 0.6
ข้อ 3: พัฒนาโคน-ม้า-เม็ด
openingBook.ts
"1b": โคน/เม็ด weight 0.5
ข้อ 4: เดินเบี้ยจำเป็น
openingBook.ts
START: เบี้ย [5,3]→[4,3] weight 0.3
ข้อ 5: อย่าเดินเบี้ยเยอะ
Evaluator.ts
pawnOverExtensionScore (-14 ต่อเบี้ยที่ดันลึก)
ข้อ 6: เก็บขุนให้ปลอดภัย
Evaluator.ts
KING_SHELL_BONUS (+20 ถ้ามีเบี้ยกันหน้าขุน)
ข้อ 9: เปิดคลองเรือ
Evaluator.ts
rookOpenFileScore (+25 Open File, +12 Semi-Open)
ข้อ 10: ควบคุมกลางกระดาน
Evaluator.ts
centerControlScore (+8 ต่อหมากที่คุมช่องกลาง)
⚠️ ยังไม่ได้ถูกนำไปใช้โดยตรง (2/10 ข้อ):
ข้อ 7: ชิงความได้เปรียบเบี้ยสูง (Passed Pawn)
สถานะ: มี PASSED_PAWN_BONUS ใน Evaluator.ts แล้ว แต่ ยังไม่สมบูรณ์
โค้ดปัจจุบัน
// Evaluator.ts - pawnStructureScore
if (!this.hasEnemyPawnInColumn(board, c, piece.side)) {
  const rowIndex = piece.side === Side.RED ? r : 7 - r;
  const progress = Math.max(0, 6 - rowIndex);
  pawnScore += sign * (this.PASSED_PAWN_BONUS + progress * 4);
  สิ่งที่ขาด:
ยังไม่ได้ให้โบนัสพิเศษสำหรับเบี้ยที่ "มีหมากตัวอื่นผูกอยู่" (Connected Passed Pawns)
ยังไม่ได้ให้โบนัสสำหรับเบี้ยที่ "ใกล้โปรโมตมาก" (row 1-2)
คำแนะนำ: เพิ่ม Connected Passed Pawn Bonus:

}

สิ่งที่ขาด:
ยังไม่ได้ให้โบนัสพิเศษสำหรับเบี้ยที่ "มีหมากตัวอื่นผูกอยู่" (Connected Passed Pawns)
ยังไม่ได้ให้โบนัสสำหรับเบี้ยที่ "ใกล้โปรโมตมาก" (row 1-2)
คำแนะนำ: เพิ่ม Connected Passed Pawn Bonus:
// เพิ่มใน pawnStructureScore
if (this.hasFriendlyPawnAdjacent(board, r, c, piece.side)) {
  pawnScore += sign * 15; // Connected Passed Pawns
}
ข้อ 8: ชิงความได้เปรียบเบี้ยนอก/เบี้ยใน
สถานะ: ยังไม่ถูกนำไปใช้เลย
หลักการ: การเดินเบี้ยด้านนอก กินตัดเบี้ยในของคู่ต่อสู้ ทำให้เขาเหลือแต่เบี้ยนอก (จุดอ่อน)
คำแนะนำ: เพิ่มฟังก์ชัน outsidePawnAdvantage ใน Evaluator.ts:
/**
 * หลักครูพงษ์ ข้อ 8: เบี้ยนอก/เบี้ยใน
 * ให้โบนัสถ้าฝั่งเรามีเบี้ยที่คอลัมน์ขอบ (0,1,6,7) มากกว่าฝั่งตรงข้าม
 * และหักคะแนนถ้าเบี้ยใน (คอลัมน์กลาง 2,3,4,5) น้อยกว่า
 */
private static outsidePawnAdvantage(board: Board, aiSide: Side): number {
  const enemySide = aiSide === Side.RED ? Side.BLACK : Side.RED;
  let myOutside = 0, myInside = 0;
  let enemyOutside = 0, enemyInside = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board.getPieceAt(r, c);
      if (!piece || piece.type !== PieceType.PAWN) continue;
      
      const isOutside = c <= 1 || c >= 6;
      if (piece.side === aiSide) {
        if (isOutside) myOutside++;
        else myInside++;
      } else {
        if (isOutside) enemyOutside++;
        else enemyInside++;
      }
    }
  }

  // ให้โบนัสถ้าเบี้ยนอกเราเยอะกว่า และเบี้ยในเรายังเยอะพอ
  const outsideAdvantage = (myOutside - enemyOutside) * 8;
  const insidePenalty = Math.max(0, enemyInside - myInside) * 5;
  
  return outsideAdvantage - insidePenalty;
}
จากนั้นเรียกใช้ใน evaluate():
score += this.outsidePawnAdvantage(board, aiSide);
🎯 สรุป
AI ของคุณครอบคลุมหลักการครูพงษ์ถึง 80% แล้ว! (8/10 ข้อ)
สิ่งที่ขาด:
Connected Passed Pawns (ข้อ 7) - เพิ่มโบนัสสำหรับเบี้ยที่ติดกัน
Outside/Inside Pawn Advantage (ข้อ 8) - ให้โบนัสเบี้ยนอก หักคะแนนเบี้ยในน้อย
คำแนะนำ: ถ้าต้องการให้ AI เล่นได้ "เนียน" ยิ่งขึ้นตามหลักครูพงษ์ ผมแนะนำให้เพิ่ม 2 ฟังก์ชันด้านบนครับ แต่ ไม่จำเป็นเร่งด่วน เพราะ AI ปัจจุบันทำงานได้ดีมากแล้ว (พิสูจน์จากที่คุณบอกว่า "AI เล่นกับคนดีแล้ว")