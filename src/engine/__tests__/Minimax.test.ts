// src/engine/__tests__/Minimax.test.ts
import { describe, it, expect } from "vitest";
import { Board } from "../../domain/Board";
import { Side } from "../../domain/enums/Side";
import { PieceType } from "../../domain/enums/PieceType";
import { GameState } from "../../domain/models/GameState";
import { Move } from "../../domain/models/Move";
import { MinimaxEngine } from "../Minimax";
import { Rook } from "../../domain/models/pieces/Rook";
import { King } from "../../domain/models/pieces/King";
import { Horse } from "../../domain/models/pieces/Horse";
import { Pawn } from "../../domain/models/pieces/Pawn";
import { Khon } from "../../domain/models/pieces/Khon";
import { Met } from "../../domain/models/pieces/Met";

describe("MinimaxEngine", () => {
  const engine = new MinimaxEngine();

  it("เริ่มต้นกระดานมาตรฐาน AI ควรคืนตาเดินที่ถูกกฎหมาย (ไม่ใช่ null)", () => {
    const board = new Board();
    board.setupDefaultBoard();

    const bestMove = engine.findBestMove(board, Side.BLACK, 1);

    expect(bestMove).not.toBeNull();
    // ตาต้องมาจากหมากของฝั่งดำเท่านั้น
    const piece = bestMove
      ? board.getPieceAt(bestMove.from[0], bestMove.from[1])
      : null;
    expect(piece?.side).toBe(Side.BLACK);
  });

  it("AI ควรจับหมากตัวที่มีค่าที่สุดเมื่อมีโอกาส (ม้าจับเรือฝั่งแดง)", () => {
    const board = new Board();
    // ฝั่งดำ: ขุน + ม้า / ฝั่งแดง: ขุน + เรือ
    // ม้าดำที่ (2,1) กินเรือแดงที่ (0,0) ได้ (รูปแบบการเดินม้าแบบ L)
    board.setPieceAt(4, 4, new King(Side.BLACK));
    board.setPieceAt(2, 1, new Horse(Side.BLACK));
    board.setPieceAt(0, 4, new King(Side.RED));
    board.setPieceAt(0, 0, new Rook(Side.RED));

    // ให้ดำได้เดินก่อน (มองหาตากินเรือ)
    const bestMove = engine.findBestMove(board, Side.BLACK, 1);

    expect(bestMove).not.toBeNull();
    expect(bestMove!.piece.type).toBe(PieceType.HORSE);
    // ตรวจสอบตัวหมากที่ถูกกินจากข้อมูลการเดิน (Move) โดยตรง
    expect(bestMove!.capturedPiece?.type).toBe(PieceType.ROOK);
  });

  it("AI ฝั่งที่ถูกโคนจน (checkmate) ควรคืน null เพราะไม่มีหมากเดินที่เหลือ", () => {
    const board = new Board();
    // ฉากโคนจนขุนดำที่มุม (0,0) โดยขุนแดง+เรือแดงโอบปิดทุกช่องหนี:
    //  - ขุนแดง (1,1) คุม (0,1),(1,0),(1,1)
    //  - เรือแดง (1,0) อยู่ใต้ขุนดำ คุมคอลัมน์ 0 ทั้งเส้น (รวม (0,0))
    board.setPieceAt(0, 0, new King(Side.BLACK));
    board.setPieceAt(1, 1, new King(Side.RED));
    board.setPieceAt(1, 0, new Rook(Side.RED));

    const bestMove = engine.findBestMove(board, Side.BLACK, 1);
    expect(bestMove).toBeNull();
  });
});

describe("Board.getGameState", () => {
  it("เมื่อไม่มีหมากเดินและขุนถูกคุม -> คืน CHECKMATE", () => {
    const board = new Board();
    // ฉากโคนจนขุนดำที่มุม (0,0)
    board.setPieceAt(0, 0, new King(Side.BLACK));
    board.setPieceAt(1, 1, new King(Side.RED));
    board.setPieceAt(1, 0, new Rook(Side.RED));

    expect(board.getGameState(Side.BLACK)).toBe(GameState.CHECKMATE);
  });

  it("เมื่อเกมยังดำเนินต่อ -> คืน IN_PROGRESS", () => {
    const board = new Board();
    board.setupDefaultBoard();
    expect(board.getGameState(Side.RED)).toBe(GameState.IN_PROGRESS);
  });
});

describe("การโปรโมตเบี้ย (Pawn Promotion)", () => {
  it("เบี้ยแดงที่เดินถึงแถวโปรโมต (แถว <= 2) จะกลายเป็นเม็ด (Met)", () => {
    const board = new Board();
    // เบี้ยแดงที่ (3,4) เดินขึ้น 1 ช่อง ไปที่ (2,4) ซึ่งเป็นแถวโปรโมตของแดง
    board.setPieceAt(3, 4, new Pawn(Side.RED));
    board.setPieceAt(7, 4, new King(Side.RED));
    board.setPieceAt(0, 4, new King(Side.BLACK));

    const pawn = board.getPieceAt(3, 4)!;
    const move = new Move([3, 4], [2, 4], pawn, null, true);

    // ก่อนเดินยังเป็นเบี้ย
    expect(board.getPieceAt(3, 4)!.type).toBe(PieceType.PAWN);
    board.makeMove(move);

    // หลังเดินที่ (2,4) ต้องกลายเป็นเม็ด
    const promoted = board.getPieceAt(2, 4);
    expect(promoted).not.toBeNull();
    expect(promoted!.type).toBe(PieceType.MET);
    expect(promoted!.side).toBe(Side.RED);
    // ช่องเดิมถูกปล่อยว่าง
    expect(board.getPieceAt(3, 4)).toBeNull();
  });

  it("เบี้ยดำที่เดินถึงแถวโปรโมต (แถว >= 5) จะกลายเป็นเม็ด (Met)", () => {
    const board = new Board();
    // เบี้ยดำที่ (4,4) เดินลง 1 ช่อง ไปที่ (5,4) ซึ่งเป็นแถวโปรโมตของดำ
    board.setPieceAt(4, 4, new Pawn(Side.BLACK));
    board.setPieceAt(7, 4, new King(Side.RED));
    board.setPieceAt(0, 4, new King(Side.BLACK));

    const pawn = board.getPieceAt(4, 4)!;
    const move = new Move([4, 4], [5, 4], pawn, null, true);
    board.makeMove(move);

    expect(board.getPieceAt(5, 4)!.type).toBe(PieceType.MET);
    expect(board.getPieceAt(5, 4)!.side).toBe(Side.BLACK);
    expect(board.getPieceAt(4, 4)).toBeNull();
  });

  it("getLegalMovesForSide ทำเครื่องหมาย isPromotion ให้ตาที่ถึงแถวโปรโมต", () => {
    const board = new Board();
    // เบี้ยดำที่ (4,4) ไกลพอจะโปรโมตได้ที่แถว 5
    board.setPieceAt(4, 4, new Pawn(Side.BLACK));
    board.setPieceAt(0, 4, new King(Side.BLACK));
    board.setPieceAt(7, 4, new King(Side.RED));

    const legalMoves = board.getLegalMovesForSide(Side.BLACK);
    const promotionMove = legalMoves.find(
      (m) => m.to[0] === 5 && m.to[1] === 4,
    );
    expect(promotionMove).toBeDefined();
    expect(promotionMove!.isPromotion).toBe(true);
  });

  it("เบี้ยไม่สามารถเดินถอยหลังได้ (เคลื่อนที่ไปข้างหน้าเท่านั้น)", () => {
    const board = new Board();
    // เบี้ยแดงที่ (4,4) เดินขึ้น (-1) ไปยัง (3,4) แต่ถอยหลัง (+1) ไป (5,4) ไม่ได้
    board.setPieceAt(4, 4, new Pawn(Side.RED));
    board.setPieceAt(7, 4, new King(Side.RED));
    board.setPieceAt(0, 4, new King(Side.BLACK));

    const moves = board.getPieceAt(4, 4)!.getPossibleMoves([4, 4], board);

    // เดินไปข้างหน้า (3,4) ได้
    expect(moves.some(([r, c]) => r === 3 && c === 4)).toBe(true);
    // เดินถอยหลัง (5,4) ไม่ได้
    expect(moves.some(([r, c]) => r === 5 && c === 4)).toBe(false);
  });

  it("หลังโปรโมตเป็นเม็ด (Met) แล้ว เดินเฉียงถอยหลังได้ในตาถัดไป", () => {
    const board = new Board();
    // เบี้ยแดงที่ (3,4) โปรโมตที่ (2,4) -> กลายเป็นเม็ด
    board.setPieceAt(3, 4, new Pawn(Side.RED));
    board.setPieceAt(7, 4, new King(Side.RED));
    board.setPieceAt(0, 4, new King(Side.BLACK));

    board.makeMove(
      new Move([3, 4], [2, 4], board.getPieceAt(3, 4)!, null, true),
    );
    const met = board.getPieceAt(2, 4)!;
    expect(met.type).toBe(PieceType.MET);

    // เม็ดที่ (2,4) เดินเฉียงทั้ง 4 ทิศ (รวมถอยหลัง ทิศ +1 คอลัมน์ ±1) ได้
    const moves = met.getPossibleMoves([2, 4], board);
    // เฉียงขึ้นหน้า (-0?) -> (-1,-1)= (1,3) และ (-1,+1)=(1,5) (ถอยหลังของแดงคือแถว +1)
    // เม็ดเดินทั้ง 4 เฉียงตาม row/col ±1
    expect(moves.some(([r, c]) => r === 1 && c === 3)).toBe(true);
    expect(moves.some(([r, c]) => r === 1 && c === 5)).toBe(true);
    // เดินเฉียงไป "ด้านหลัง" จากมุมมองเดิมของเบี้ย (แถว +1) ก็ได้เช่นกัน
    expect(moves.some(([r, c]) => r === 3 && c === 3)).toBe(true);
    expect(moves.some(([r, c]) => r === 3 && c === 5)).toBe(true);
  });
});

describe("Board Stalemate", () => {
  it("เมื่อขุนไม่ถูกคุมแต่เดินไม่ได้ -> คืน STALEMATE", () => {
    const board = new Board();
    // ขุนดำที่มุม (0,0) ปลอดภัย แต่ทุกช่องที่หนีถูกคุม (ไม่โดนคุมที่ (0,0)):
    //  - เรือ R1(2,1) คุมคอลัมน์ 1 -> (0,1),(1,1) แต่ไม่แตะคอลัมน์ 0
    //  - เรือ R2(1,4) คุมแถว 1 ทั้งแถว -> (1,0),(1,1)
    //  - ขุนแดง (7,4) อยู่ห่าง ๆ ไม่รบกวน
    board.setPieceAt(0, 0, new King(Side.BLACK));
    board.setPieceAt(7, 4, new King(Side.RED));
    board.setPieceAt(2, 1, new Rook(Side.RED));
    board.setPieceAt(1, 4, new Rook(Side.RED));

    expect(board.isKingInCheck(Side.BLACK)).toBe(false);
    expect(board.getLegalMovesForSide(Side.BLACK).length).toBe(0);
    expect(board.getGameState(Side.BLACK)).toBe(GameState.STALEMATE);
    expect(board.isStalemate(Side.BLACK)).toBe(true);
  });
});

describe("Board Draw (Insufficient Material)", () => {
  it("เมื่อทั้งสองฝั่งเหลือเพียงขุน -> คืน DRAW", () => {
    const board = new Board();
    board.setPieceAt(0, 4, new King(Side.BLACK));
    board.setPieceAt(5, 4, new King(Side.RED));

    expect(board.getGameState(Side.BLACK)).toBe(GameState.DRAW);
  });

  it("เมื่อฝ่ายใดฝ่ายหนึ่งเหลือเพียงขุน (มีหมากหนัก) จะยังเล่นต่อได้ (ไม่ DRAW)", () => {
    const board = new Board();
    // แดงเหลือขุนตัวเดียว + เรือ -> ยังแก้บุกจบได้ (มีหมากหนัก)
    board.setPieceAt(0, 4, new King(Side.BLACK));
    board.setPieceAt(5, 4, new King(Side.RED));
    board.setPieceAt(5, 0, new Rook(Side.RED));

    // มีเรือ => hasInsufficientMaterial เป็น false
    expect(board.getGameState(Side.BLACK)).not.toBe(GameState.DRAW);
  });
});

describe("การเดินของโคน (Khon Movement)", () => {
  it("โคนเดินเฉียง 4 ทิศ + ไปข้างหน้าตรง 1 ช่อง (รวม 5 ช่อง)", () => {
    const board = new Board();
    // โคนแดงกลางกระดาน (4,4) : forward = -1
    board.setPieceAt(4, 4, new Khon(Side.RED));
    board.setPieceAt(7, 4, new King(Side.RED));
    board.setPieceAt(0, 4, new King(Side.BLACK));

    const moves = board.getPieceAt(4, 4)!.getPossibleMoves([4, 4], board);

    const expected = [
      [3, 3],
      [3, 5], // เฉียงบน
      [5, 3],
      [5, 5], // เฉียงล่าง
      [3, 4], // ไปข้างหน้าตรง (RED forward = -1)
    ];

    expect(moves.length).toBe(5);
    for (const [er, ec] of expected) {
      expect(moves.some(([r, c]) => r === er && c === ec)).toBe(true);
    }
  });

  it("โคนไม่สามารถเดินถอยหลังตรงได้ (มีแต่เดินหน้า/เฉียง)", () => {
    const board = new Board();
    // โคนแดงที่ (4,4) -> ถอยหลังตรงคือ (5,4) ไม่ควรมีในตัวเลือก
    board.setPieceAt(4, 4, new Khon(Side.RED));
    board.setPieceAt(7, 4, new King(Side.RED));
    board.setPieceAt(0, 4, new King(Side.BLACK));

    const moves = board.getPieceAt(4, 4)!.getPossibleMoves([4, 4], board);

    // ถอยหลังตรง (5,4) ไม่ควรมี
    expect(moves.some(([r, c]) => r === 5 && c === 4)).toBe(false);
    // เดินหน้าเฉียง (3,3)/(3,5) ควรมี
    expect(moves.some(([r, c]) => r === 3 && c === 3)).toBe(true);
    expect(moves.some(([r, c]) => r === 3 && c === 5)).toBe(true);
  });
});

describe("การเดินของเรือ (Rook)", () => {
  it("เรือถูกหมากของฝั่งเดียวกันขวาง -> เดินถึงแค่ก่อนช่องนั้น (ข้ามไม่ได้)", () => {
    const board = new Board();
    // เรือแดงที่ (4,4) มีหมากของฝั่งเดียวกัน (เรือแดง) คั่นที่ (4,6) ทางขวา
    board.setPieceAt(4, 4, new Rook(Side.RED));
    board.setPieceAt(4, 6, new Rook(Side.RED));
    board.setPieceAt(7, 4, new King(Side.RED));
    board.setPieceAt(0, 4, new King(Side.BLACK));

    const moves = board.getPieceAt(4, 4)!.getPossibleMoves([4, 4], board);

    // เดินไปขวาได้ถึง (4,5) เพราะ (4,6) มีหมากฝั่งเดียวกันคั่น -> (4,5) ว่าง
    expect(moves.some(([r, c]) => r === 4 && c === 5)).toBe(true);
    // ไม่สามารถเดินข้ามไป (4,6) ได้ (มีหมากฝั่งเดียวกัน)
    expect(moves.some(([r, c]) => r === 4 && c === 6)).toBe(false);
    // และไม่เดินเลยไป (4,7)
    expect(moves.some(([r, c]) => r === 4 && c === 7)).toBe(false);
  });

  it("เรือกินหมากฝั่งตรงข้ามแล้วหยุด (ไม่เดินข้ามช่องที่ถูกกิน)", () => {
    const board = new Board();
    // เรือแดงที่ (4,4) มีหมากฝั่งตรงข้าม (เรือดำ) ที่ (4,6)
    board.setPieceAt(4, 4, new Rook(Side.RED));
    board.setPieceAt(4, 6, new Rook(Side.BLACK));
    board.setPieceAt(7, 4, new King(Side.RED));
    board.setPieceAt(0, 4, new King(Side.BLACK));

    const moves = board.getPieceAt(4, 4)!.getPossibleMoves([4, 4], board);

    // กินเรือดำที่ (4,6) ได้
    expect(moves.some(([r, c]) => r === 4 && c === 6)).toBe(true);
    // แต่ไม่เดินข้ามไป (4,7) เพราะช่องถูกกินแล้วหยุด (ต้องไม่ pushes เกิน)
    expect(moves.some(([r, c]) => r === 4 && c === 7)).toBe(false);
  });

  it("เรือเดินไปถึงขอบกระดานได้ถ้าไม่มีหมากขวาง", () => {
    const board = new Board();
    // เรือแดงกลางกระดาน (4,4) โล่งทั้งแถว/หลัก
    // วางขุนแดง/ดำที่มุม (ห่างจาก col 4) เพื่อไม่ให้ขวางเส้นทางของเรือ
    board.setPieceAt(4, 4, new Rook(Side.RED));
    board.setPieceAt(6, 0, new King(Side.RED));
    board.setPieceAt(0, 0, new King(Side.BLACK));

    const moves = board.getPieceAt(4, 4)!.getPossibleMoves([4, 4], board);

    // ถึงขอบทั้ง 4 ทิศ
    expect(moves.some(([r, c]) => r === 0 && c === 4)).toBe(true); // บนสุด
    expect(moves.some(([r, c]) => r === 7 && c === 4)).toBe(true); // ล่างสุด
    expect(moves.some(([r, c]) => r === 4 && c === 0)).toBe(true); // ซ้ายสุด
    expect(moves.some(([r, c]) => r === 4 && c === 7)).toBe(true); // ขวาสุด
  });
});

describe("การเดินของเม็ด (Met)", () => {
  it("เม็ดเดินเฉียง 4 ทิศได้ตามกติกา", () => {
    const board = new Board();
    board.setPieceAt(4, 4, new Met(Side.RED));
    board.setPieceAt(7, 4, new King(Side.RED));
    board.setPieceAt(0, 4, new King(Side.BLACK));

    const moves = board.getPieceAt(4, 4)!.getPossibleMoves([4, 4], board);

    expect(moves.length).toBe(4);
    expect(moves.some(([r, c]) => r === 3 && c === 3)).toBe(true);
    expect(moves.some(([r, c]) => r === 3 && c === 5)).toBe(true);
    expect(moves.some(([r, c]) => r === 5 && c === 3)).toBe(true);
    expect(moves.some(([r, c]) => r === 5 && c === 5)).toBe(true);
  });

  it("เม็ดกินหมากฝั่งตรงข้ามในช่องเฉียงได้ แต่ไม่สามารถเดินแบบไกล (มากกว่า 1 ช่อง)", () => {
    const board = new Board();
    board.setPieceAt(4, 4, new Met(Side.RED));
    board.setPieceAt(3, 3, new Rook(Side.BLACK)); // เป้าเฉียงบนซ้าย
    board.setPieceAt(7, 4, new King(Side.RED));
    board.setPieceAt(0, 4, new King(Side.BLACK));

    const moves = board.getPieceAt(4, 4)!.getPossibleMoves([4, 4], board);

    // กินเป้าที่ (3,3) ได้
    expect(moves.some(([r, c]) => r === 3 && c === 3)).toBe(true);
    // ไม่เดินเกินไปถึง (2,2) เพราะเม็ดเดินแค่ 1 ช่อง
    expect(moves.some(([r, c]) => r === 2 && c === 2)).toBe(false);
  });
});
