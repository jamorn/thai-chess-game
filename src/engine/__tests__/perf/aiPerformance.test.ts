import { describe, it } from "vitest";
import { Board } from "../../../domain/Board";
import { MinimaxEngine } from "../../Minimax";
import { Side } from "../../../domain/enums/Side";

// ===========================================================================
//  Benchmark เพื่อเทียบเวลาคิดของ AI บนกระดานกลางเกมจริง
// ---------------------------------------------------------------------------
//  วิธีรัน (แยกจาก CI หลัก มิให้ชะลอ vitest run):
//    npm run test:perf
//
//  กรณ๊ต้องการเปรียบเทียบ depth ต่างกัน แก้ค่าใน it.each([...]) ข้างล่าง
// ===========================================================================

// จำลองเกมจริง (สอดคล้องกับเกมทดลองเล่น):
// 1. แดง: KHON [7,2]->[6,2]
// 2. ดำ: HORSE [0,1]->[1,3]
// 3. แดง: PAWN [5,3]->[4,3]
// แล้วให้ AI คิดตาต่อไป (ดำ)

function buildBoard(): Board {
  const b = new Board();
  b.setupDefaultBoard();
  const m1 = b
    .getLegalMovesForSide(Side.RED)
    .find(
      (m) =>
        m.piece.type === "KHON" &&
        m.from[0] === 7 &&
        m.from[1] === 2 &&
        m.to[0] === 6 &&
        m.to[1] === 2,
    );
  if (m1) b.makeMove(m1);
  const m2 = b
    .getLegalMovesForSide(Side.BLACK)
    .find(
      (m) =>
        m.piece.type === "HORSE" &&
        m.from[0] === 0 &&
        m.from[1] === 1 &&
        m.to[0] === 1 &&
        m.to[1] === 3,
    );
  if (m2) b.makeMove(m2);
  const m3 = b
    .getLegalMovesForSide(Side.RED)
    .find(
      (m) =>
        m.piece.type === "PAWN" &&
        m.from[0] === 5 &&
        m.from[1] === 3 &&
        m.to[0] === 4 &&
        m.to[1] === 3,
    );
  if (m3) b.makeMove(m3);
  return b;
}

// ไม่ใช้ describe.skip เพราะ run ผ่าน npm run test:perf โดยตรง (target โฟลเดอร์นี้)
describe("performance (AI) - midgame timing", () => {
  it.each([4])("findBestMove depth %i", (depth) => {
    const board = buildBoard();
    const engine = new MinimaxEngine();
    const t = Date.now();
    const m = engine.findBestMove(board, Side.BLACK, depth);
    console.log(
      `[depth ${depth}] time=${Date.now() - t}ms best=${JSON.stringify(
        m?.from,
      )}->${JSON.stringify(m?.to)}`,
    );
  });
});
