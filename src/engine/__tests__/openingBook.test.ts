// src/engine/__tests__/openingBook.test.ts
import { describe, it, expect } from "vitest";
import { Board } from "../../domain/Board";
import { Side } from "../../domain/enums/Side";
import { PieceType } from "../../domain/enums/PieceType";
import { detectOpeningKey, getBookBestMove } from "../openingBookService";
import { OPENING_BOOK } from "../data/openingBook";

describe("OpeningBookService — detectOpeningKey", () => {
  it("board ตอนเริ่มเกม (ยังไม่มีหมากขยับ) -> RED ได้ key 'START'", () => {
    const board = new Board();
    board.setupDefaultBoard();
    expect(detectOpeningKey(board, Side.RED)).toBe("START");
  });

  it("board ตอนเริ่มเกม แต่ถึงตาดำ -> ไม่มี book key (null)", () => {
    const board = new Board();
    board.setupDefaultBoard();
    expect(detectOpeningKey(board, Side.BLACK)).toBe(null);
  });

  it("หลัง RED เดินม้า ง2 แล้ว -> ถึงตาดำ ได้ key '1r'", () => {
    const board = new Board();
    board.setupDefaultBoard();
    // เล่นม้าแดงขวา [7,1] -> [5,2] (รูปแบบ L)
    const m = board
      .getLegalMovesForSide(Side.RED)
      .find(
        (mv) =>
          mv.piece.type === "HORSE" && mv.from[0] === 7 && mv.from[1] === 1,
      );
    expect(m).toBeDefined();
    board.makeMove(m!);
    expect(detectOpeningKey(board, Side.BLACK)).toBe("1r");
  });
});

describe("OpeningBookService — getBookBestMove", () => {
  it("ตอนเริ่มเกม RED -> คืน move จาก book ที่ถูกกฎหมาย (ม้า/เบี้ย)", () => {
    const board = new Board();
    board.setupDefaultBoard();
    const move = getBookBestMove(board, Side.RED);
    expect(move).not.toBeNull();
    // ต้องเป็น move ของฝั่งแดง
    const piece = board.getPieceAt(move!.from[0], move!.from[1]);
    expect(piece?.side).toBe(Side.RED);
  });

  it("book move ทุกตำแหน่งใน OPENING_BOOK ตรงกับพิกัดจริง (ไม่หลุด board)", () => {
    // ตรวจว่าพิกัด from/to ทุกตัวอยู่ในช่วง 0..7
    for (const key of Object.keys(OPENING_BOOK)) {
      for (const mv of OPENING_BOOK[key].moves) {
        for (const coord of [...mv.from, ...mv.to]) {
          expect(coord).toBeGreaterThanOrEqual(0);
          expect(coord).toBeLessThan(8);
        }
      }
    }
  });

  it("ตอนเริ่มเกม RED book START ต้องมีข้อแรกเป็นม้า (เปิดม้าขวา [7,1]->[6,3]) ที่ถูกกฎหมาย", () => {
    const board = new Board();
    board.setupDefaultBoard();
    const startMove = OPENING_BOOK["START"].moves.find(
      (m) =>
        m.from[0] === 7 && m.from[1] === 1 && m.to[0] === 6 && m.to[1] === 3,
    );
    expect(startMove).toBeDefined();
    // ตรวจว่า move นี้ถูกกฎหมายจริง
    const legal = board
      .getLegalMovesForSide(Side.RED)
      .find(
        (m) =>
          m.from[0] === 7 && m.from[1] === 1 && m.to[0] === 6 && m.to[1] === 3,
      );
    expect(legal?.piece.type).toBe(PieceType.HORSE);
  });

  it("getBestMove กับ board นอกช่วงเปิด (หมากกินกันไปแล้ว) -> null (ใช้ Minimax)", () => {
    const board = new Board();
    board.setupDefaultBoard();
    // กัด: เอาเบี้ยบางตัวออกไปเยอะเพื่อให้ < 30 ชิ้น -> ไม่ใช้ book
    board.setPieceAt(2, 0, null);
    board.setPieceAt(2, 1, null);
    board.setPieceAt(2, 2, null);
    expect(getBookBestMove(board, Side.RED)).toBe(null);
  });

  it("หลัง RED เปิดม้า [7,1]->[6,3] แล้ว BLACK ใช้ book '1r' -> คืน move ที่ถูกกฎหมาย (โคนดำ/ม้าดำ)", () => {
    const board = new Board();
    board.setupDefaultBoard();
    // RED เดินม้าตาม book START
    const redHorse = board
      .getLegalMovesForSide(Side.RED)
      .find((m) => m.from[0] === 7 && m.from[1] === 1 && m.to[0] === 6 && m.to[1] === 3);
    expect(redHorse).toBeDefined();
    board.makeMove(redHorse!);

    expect(detectOpeningKey(board, Side.BLACK)).toBe("1r");
    const blackMove = getBookBestMove(board, Side.BLACK);
    expect(blackMove).not.toBeNull();
    expect(board.getPieceAt(blackMove!.from[0], blackMove!.from[1])?.side).toBe(
      Side.BLACK,
    );
  });

  it("ทุก move ใน OPENING_BOOK ต้องเป็น move ที่ถูกกฎหมายเมื่อ simulation ถึงสถานะนั้น", () => {
    // START
    const board = new Board();
    board.setupDefaultBoard();
    for (const mv of OPENING_BOOK["START"].moves) {
      const legal = board
        .getLegalMovesForSide(Side.RED)
        .find(
          (m) =>
            m.from[0] === mv.from[0] &&
            m.from[1] === mv.from[1] &&
            m.to[0] === mv.to[0] &&
            m.to[1] === mv.to[1],
        );
      expect(legal).toBeDefined();
    }

    // 1r: ให้ RED เดินม้าตาม START ตัวแรก แล้วเช็คทุก move ของ BLACK
    const b1 = new Board();
    b1.setupDefaultBoard();
    b1.makeMove(
      b1
        .getLegalMovesForSide(Side.RED)
        .find(
          (m) =>
            m.from[0] === 7 && m.from[1] === 1 && m.to[0] === 6 && m.to[1] === 3,
        )!,
    );
    for (const mv of OPENING_BOOK["1r"].moves) {
      const legal = b1
        .getLegalMovesForSide(Side.BLACK)
        .find(
          (m) =>
            m.from[0] === mv.from[0] &&
            m.from[1] === mv.from[1] &&
            m.to[0] === mv.to[0] &&
            m.to[1] === mv.to[1],
        );
      expect(legal).toBeDefined();
    }
  });
});
