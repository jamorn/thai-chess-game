// src/engine/__tests__/Evaluator.test.ts
import { describe, it, expect } from "vitest";
import { Board } from "../../domain/Board";
import { Side } from "../../domain/enums/Side";
import { Evaluator } from "../Evaluator";
import { King } from "../../domain/models/pieces/King";
import { Rook } from "../../domain/models/pieces/Rook";
import { Pawn } from "../../domain/models/pieces/Pawn";
import { Horse } from "../../domain/models/pieces/Horse";
import { Khon } from "../../domain/models/pieces/Khon";

/**
 * Unit tests สำหรับหลักครูพงษ์ข้อ 5, 9, 10 ที่เพิ่มใน Evaluator
 * ตรวจค่าจาก method โดยตรง (public hook สำหรับ test)
 */

describe("Evaluator — ข้อ 9: Rook on Open File", () => {
  it("เรือบน Open File (ไม่มีเบี้ยในคอลัมน์) ได้โบนัส ROOK_OPEN_FILE_BONUS", () => {
    const board = new Board();
    board.setPieceAt(7, 4, new King(Side.RED));
    board.setPieceAt(7, 7, new Rook(Side.RED));
    board.setPieceAt(0, 4, new King(Side.BLACK));

    // col 7 โล่ง -> Open File -> +25/ตัวเรือ
    const score = Evaluator.rookOpenFileScore(board, Side.RED);
    expect(score).toBe(25);
  });

  it("เรือที่ถูกเบี้ยของตัวเองขวาง (file ปิด) ไม่ได้โบนัส", () => {
    const board = new Board();
    board.setPieceAt(7, 4, new King(Side.RED));
    board.setPieceAt(7, 7, new Rook(Side.RED));
    board.setPieceAt(6, 7, new Pawn(Side.RED)); // เบี้ยแดงขวาง col7
    board.setPieceAt(0, 4, new King(Side.BLACK));

    const score = Evaluator.rookOpenFileScore(board, Side.RED);
    expect(score).toBe(0);
  });

  it("เรือบน Semi-Open File (มีเบี้ยฝั่งตรงข้ามเท่านั้น) ได้โบนัสครึ่ง", () => {
    const board = new Board();
    board.setPieceAt(7, 4, new King(Side.RED));
    board.setPieceAt(7, 7, new Rook(Side.RED));
    board.setPieceAt(0, 4, new King(Side.BLACK));
    board.setPieceAt(2, 7, new Pawn(Side.BLACK)); // เบี้ยดำใน col7

    const score = Evaluator.rookOpenFileScore(board, Side.RED);
    expect(score).toBe(12); // ROOK_SEMI_OPEN_FILE_BONUS
  });
});

describe("Evaluator — ข้อ 10: Center Control", () => {
  it("หมากที่คุมช่องกลางได้มากขึ้น ทำให้ centerControlScore เป็นบวก (RED เหนือกว่า)", () => {
    // RED มีม้าที่ (5,4) ซึ่ง L-move ไปถึงช่องกลาง (3,3) ส่วน BLACK ไม่มีหมากคุมกลาง
    const board = new Board();
    board.setPieceAt(7, 4, new King(Side.RED));
    board.setPieceAt(5, 4, new Horse(Side.RED)); // reach center (3,3)
    board.setPieceAt(0, 4, new King(Side.BLACK));

    const score = Evaluator.centerControlScore(board, Side.RED);
    // RED คุมกลาง 1 ช่องขึ้นไป เผชิญศูนย์ของ BLACK -> ควรเป็นบวก
    expect(score).toBeGreaterThan(0);
  });

  it("โคนที่ยืนแถวกลางคุม center มากกว่าอยู่ขอบ", () => {
    const boardCenter = new Board();
    boardCenter.setPieceAt(7, 4, new King(Side.RED));
    boardCenter.setPieceAt(4, 3, new Khon(Side.RED)); // กลาง คุม center
    boardCenter.setPieceAt(0, 4, new King(Side.BLACK));

    const boardEdge = new Board();
    boardEdge.setPieceAt(7, 4, new King(Side.RED));
    boardEdge.setPieceAt(7, 0, new Khon(Side.RED)); // ขอบมุม ไม่แตะ center
    boardEdge.setPieceAt(0, 4, new King(Side.BLACK));

    const scoreCenter = Evaluator.centerControlScore(boardCenter, Side.RED);
    const scoreEdge = Evaluator.centerControlScore(boardEdge, Side.RED);

    expect(scoreCenter).toBeGreaterThan(scoreEdge);
  });
});

describe("Evaluator — ข้อ 5: Penalty เบี้ยดันลึกเกินจำเป็น", () => {
  /**
   * สร้าง board ที่มีหมาก >=16 ตัว (เพื่อให้ penalty ทำงาน ไม่ถูก early-return)
   * โดย RED/ BLACK สมดุล - ใช้สำหรับ isolate penalty
   */
  function buildBoard(redDeep: boolean): Board {
    const b = new Board();
    b.setPieceAt(7, 4, new King(Side.RED));
    b.setPieceAt(0, 4, new King(Side.BLACK));

    // วางเบี้ย RED ทุกคอลัมน์ + กำลังทำนาย "ลึก" หรือ "ตั้งต้น"
    for (let c = 0; c < 8; c++) {
      const row = redDeep ? 3 : 5;
      b.setPieceAt(row, c, new Pawn(Side.RED));
    }
    // เบี้ย BLACK ตั้งต้น (row 2)
    for (let c = 0; c < 8; c++) {
      b.setPieceAt(2, c, new Pawn(Side.BLACK));
    }
    // เพิ่มหมากให้ครบ 16
    b.setPieceAt(7, 0, new Rook(Side.RED));
    b.setPieceAt(0, 0, new Rook(Side.BLACK));
    b.setPieceAt(7, 1, new Horse(Side.RED));
    b.setPieceAt(0, 1, new Horse(Side.BLACK));
    return b;
  }

  it("board ที่ RED มีเบี้ยดันลึกเกิน (row3) ถูกหัก penalty มากกว่า board ที่เบี้ยยังอยู่ตั้งต้น (row5)", () => {
    const boardStart = buildBoard(false); // เบี้ยแดง row5 (ตั้งต้น)
    const boardDeep = buildBoard(true); // เบี้ยแดง row3 (ลึกเกิน)

    const scoreStart = Evaluator.pawnOverExtensionScore(boardStart, Side.RED);
    const scoreDeep = Evaluator.pawnOverExtensionScore(boardDeep, Side.RED);

    // row5 (RED, ไม่ลึก) -> ไม่หัก หรือ 0
    expect(scoreStart).toBe(0);
    // row3 (RED, ลึกเกิน) -> หัก -14 ต่อเบี้ย 8 ตัว (แต่มีเกณฑ์ cap? ตรวจว่าเป็นค่าลบ)
    expect(scoreDeep).toBeLessThan(0);
    expect(scoreDeep).toBe(-8 * 14);
  });
});
