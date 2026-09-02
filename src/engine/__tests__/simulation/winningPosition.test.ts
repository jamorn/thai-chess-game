// src/engine/__tests__/simulation/winningPosition.test.ts
import { describe, it, expect } from "vitest";
import { Board } from "../../../domain/Board";
import { Side } from "../../../domain/enums/Side";
import { GameState } from "../../../domain/models/GameState";
import { King } from "../../../domain/models/pieces/King";
import { Rook } from "../../../domain/models/pieces/Rook";
import { MinimaxEngine } from "../../Minimax";

describe("Winning Position Test", () => {
  it("แดงมีเรือ+ขุน vs ดำมีขุนตัวเดียว -> แดง (Depth 4) ควรชนะได้ภายใน 20 ตา", () => {
    const board = new Board();
    
    // ตั้งค่ากระดาน: แดงได้เปรียบมหาศาล (มีเรือ), ดำเสียเปรียบ (มีแค่ขุน)
    board.setPieceAt(0, 4, new King(Side.BLACK)); // ขุนดำ
    board.setPieceAt(7, 4, new King(Side.RED));   // ขุนแดง
    board.setPieceAt(7, 0, new Rook(Side.RED));   // เรือแดง

    const engine = new MinimaxEngine();
    let currentTurn = Side.RED;
    let moveCount = 0;
    const maxMoves = 40; // ควรชนะภายใน 20 ตา (40 plies)

    while (moveCount < maxMoves) {
      const state = board.getGameState(currentTurn);
      if (state === GameState.CHECKMATE) {
        // ถ้าจบด้วย Checkmate และตาต่อไปเป็นของดำ แสดงว่าแดงชนะ
        expect(currentTurn).toBe(Side.BLACK); 
        console.log(`✅ แดงชนะ! ใช้เวลา ${moveCount} plies`);
        return;
      }
      if (state !== GameState.IN_PROGRESS) {
        throw new Error(`เกมจบด้วยสถานะ ${state} ซึ่งไม่ถูกต้อง`);
      }

      // ให้แดง (Depth 4) เดิน
      const bestMove = engine.findBestMove(board, currentTurn, 4);
      if (!bestMove) throw new Error("AI ไม่พบตาเดิน");

      board.makeMove(bestMove);
      moveCount++;
      currentTurn = currentTurn === Side.RED ? Side.BLACK : Side.RED;
      
      // จำลองว่าดำเดินสุ่มๆ เพื่อหนี (หรือให้ AI ดำ Depth 1 เดินก็ได้)
      const blackMoves = board.getLegalMovesForSide(Side.BLACK);
      if (blackMoves.length > 0) {
        board.makeMove(blackMoves[0]); // ดำเดินตาแรกที่มี (เพื่อทดสอบความทนทานของแดง)
        moveCount++;
        currentTurn = Side.RED;
      }
    }

    throw new Error(`AI แดงไม่สามารถรุกจนได้ภายใน ${maxMoves} plies (อาจมี Bug ในการประเมินค่า)`);
  });
});