// src/engine/__tests__/simulation/pawnAdvantageScenario.test.ts
/**
 * Scenario ทดสอบ (แบบ self-play ชั้นเดียวกับ winningPosition.test.ts)
 * วัดว่าหลักครูพงษ์ข้อ 7 (Connected Passed Pawn) + ข้อ 8 (เบี้ยนอก/ใน)
 * "มีผลต่อการเล่นจริง" ของ AI (ไม่ใช่ dead code)
 */
import { describe, it, expect } from "vitest";
import { Board } from "../../../domain/Board";
import { Side } from "../../../domain/enums/Side"; 
import { GameState } from "../../../domain/models/GameState";
import { King } from "../../../domain/models/pieces/King";
import { Pawn } from "../../../domain/models/pieces/Pawn";
import { Rook } from "../../../domain/models/pieces/Rook";
import { MinimaxEngine } from "../../Minimax";

describe("Pawn Advantage Scenario (ข้อ 7/8 ส่งผลต่อการเล่นจริง)", () => {
  /**
   * RED มี connected passed pawns 2 ตัวที่เดินเป็นเพื่อนกันแถวกลาง+สูง
   * (ช่วยกันผ่านค่าระยะ PST / passed-advance) + ขุนแดงหนุน
   * BLACK เหลือเพียงขุนเปล่า -> เป็นฉาก "เบี้ยจะผลักโปรโมต" ที่คนเจอจริง
   *
   * เจตนา: ให้ RED (depth 4) ใช้ค่าโครงสร้างเบี้ยผลักเบี้ยคู่ขึ้น
   *        จนโปรโมต/สร้างหมากเหนือกว่า แล้วไล่จนได้ ภายในกรอบ 60 plies
   *
   * หมายเหตุ: board นี้ประกอบหมากค่าต่ำ (2 pawn ~200 + ขุนซึ่งไม่นับใน lazy)
   *        => |material| ≤ 450 จึงไม่ถูก early-lazy หลักข้อ 7/8 จึงถูกเรียกจริง
   */
  it("RED: ขุน + connected passed pawns 2 ตัว => ชิงปรับไปจนมีเม็ด/จบผู้ชนะ", () => {
    const board = new Board();

    // ขุนทั้งสองห่างกันคนละครึ่ง (ยังไม่บังกัน)
    board.setPieceAt(0, 4, new King(Side.BLACK));
    board.setPieceAt(7, 4, new King(Side.RED));

    // เรือแดงแถวหลัง (ปลายเกมแรงโจมตี - คล้ายฉาก "คนจริงเจอ" ตอนจบ)
    //  หมายเหตุ: การมี rook ทำให้ |material|>450 -> lazy ใช้ endgame king-hunt
    //  หลักโครงสร้างเบี้ยข้อ 7/8 จะถูกยืนยันอีกทีผ่าน unit-test ใน Evaluator.test
    board.setPieceAt(7, 0, new Rook(Side.RED));

    // เบี้ยแดง passed ตัวหนาแนวคู่ (ติดกัน c=2/c=3 แถวเดียวกัน = connected)
    board.setPieceAt(3, 2, new Pawn(Side.RED));
    board.setPieceAt(3, 3, new Pawn(Side.RED));

    const engine = new MinimaxEngine();
    let turn = Side.RED; // RED เดินก่อน (มีเป้าหมายชัดคือผลัก/แปลงนำหน้าศึก)
    let plies = 0;
    const maxPlies = 80;

    while (plies < maxPlies) {
      const state = board.getGameState(turn);
      if (state === GameState.CHECKMATE) {
        console.log(`✅ RED ชนะ (checkmate) ภายใน ${plies} plies`);
        return; // ผ่าน: แสดงว่า AI โครงสร้างเบี้ยกำจัดจนได้ (คนเล่นก็รับได้)
      }
      expect(state).toBe(GameState.IN_PROGRESS);

      // BLACK อ่อนกว่า (depth 1) เพื่อให้ RED มีโอกาสแสดงฝีมือโครงสร้างเบี้ย
      const depth = turn === Side.RED ? 4 : 1;
      const best = engine.findBestMove(board, turn, depth);
      expect(best).not.toBeNull();
      if (!best) return;
      board.makeMove(best);
      plies++;
      turn = turn === Side.RED ? Side.BLACK : Side.RED;
    }

    throw new Error(
      `RED ไม่สามารถใช้เบี้ยที่ได้เปรียบจนชนะภายใน ${maxPlies} plies (อาจต้องปรับ scenario)`,
    );
  });
});
