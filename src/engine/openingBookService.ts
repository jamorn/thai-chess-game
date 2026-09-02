// src/engine/openingBookService.ts
// ===========================================================================
//  บริการจัดการ Opening Book — เชื่อมตาราง OPENING_BOOK เข้ากับเอนจิน
//  ----------------------------------------------------------------
//  - ตรวจจับ "ช่วงเปิดเกม" จากตำแหน่งหมากบนกระดาน (ไม่ต้อง track history)
//  - เลือกตาเดินจาก Book แบบ Weighted Random แล้วตรวจว่า "ยังถูกกฎหมาย" ก่อนใช้
//  - ถ้าไม่มี Book / ไม่ตรงกฎ -> คืน null ให้ caller ไปใช้ Minimax ตามปกติ
// ===========================================================================

import { Board } from "../domain/Board";
import { Side } from "../domain/enums/Side";
import { Move } from "../domain/models/Move";
import { OPENING_BOOK } from "./data/openingBook";

/**
 * ระบุ "Key" ของ Opening Book ที่ board ปัจจุบันตรงกับ
 * ---
 * ยึดจากขั้นเปิดตามหลักครูพงษ์ (ดู OPENING_BOOK.MD):
 *  - "START" : ยังไม่มีหมากขยับเลย (ทุกคนอยู่ตำแหน่งตั้งต้น) -> RED เดินก่อน
 *  - "1r"    : RED ขยับแล้ว (เปิดม้า ง2 หรือเบี้ย) BLACK ยังครบ -> ให้ BLACK ตอบ
 *
 * @returns key ที่ใช้ค้น OPENING_BOOK หรือ null หากพ้นช่วงเปิด (ให้ใช้ Minimax)
 */
export function detectOpeningKey(
  board: Board,
  currentSide: Side,
): string | null {
  // พ้นช่วงเปิดเร็วเกินไป (หมากขาดหมาย) -> ใช้ Minimax
  if (!hasEnoughPiecesForOpening(board)) return null;

  const redMoved = hasMovedOffStartZone(board, Side.RED);
  const blackMoved = hasMovedOffStartZone(board, Side.BLACK);

  // ยังไม่มีใครขยับ -> เกมใหม่ -> ฝั่งแดง (เดินก่อน) ใช้ "START"
  if (!redMoved && !blackMoved) {
    return currentSide === Side.RED ? "START" : null;
  }

  // แดงขยับแล้ว แต่ดำยังไม่ขยับ -> ถึงตาดำ ตอบด้วย "1r"
  if (redMoved && !blackMoved) {
    return currentSide === Side.BLACK ? "1r" : null;
  }

  return null;
}

/**
 * ดึงตาเดินจาก Book แบบ Weighted (สุ่ม) โดยตรวจว่า move ยังถูกกฎหมาย ณ board นั้น
 * @returns Move ที่ถูกกฎหมาย หรือ null ถ้าไม่มี Book/เลยช่วงเปิด (ให้โฟลวไป Minimax)
 */
export function getBookBestMove(board: Board, side: Side): Move | null {
  const key = detectOpeningKey(board, side);
  if (!key) return null;

  const node = OPENING_BOOK[key];
  if (!node || node.moves.length === 0) return null;

  // ลองสุ่มเลือก move หลายรอบเท่าจำนวนตัวเลือก ถ้าตัวแรกใช้ไม่ได้ก็ลองตัวอื่น
  const tried = new Set<number>();
  let attempts = 0;
  while (attempts < node.moves.length && tried.size < node.moves.length) {
    const idx = weightedPickIndex(node.moves, tried);
    if (idx < 0) break;
    tried.add(idx);
    attempts++;
    const candidate = node.moves[idx];
    const legal = isLegalMove(board, side, candidate.from, candidate.to);
    if (legal) return legal;
  }
  return null;
}

// ----------------------------------------------------------------
//  Internal helpers
// ----------------------------------------------------------------

/** ช่วงเปิดต้องยังมีหมากพอ (>=30 ตัว) ถ้าหายมาก -> ขึ้นกลาง/จบแล้ว ใช้ Minimax */
function hasEnoughPiecesForOpening(board: Board): boolean {
  let count = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board.getPieceAt(r, c)) count++;
    }
  }
  return count >= 30;
}

/** ฝั่งที่กำหนดมีหมากอย่างน้อย 1 ตัวขยับออกจาก "แถวฐาน + แถวเบี้ยตั้งต้น" แล้วหรือยัง */
function hasMovedOffStartZone(board: Board, side: Side): boolean {
  const startRank = side === Side.RED ? 7 : 0;
  const pawnRank = side === Side.RED ? 5 : 2;

  // ✅ เพิ่ม: ตรวจจำนวนหมาก (ถ้าถูกกินไป -> ขยับแล้วแน่นอน)
  const expectedPieceCount = 16; // หมากรุกไทยมี 16 ตัวต่อฝั่ง
  let actualPieceCount = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board.getPieceAt(r, c);
      if (p && p.side === side) {
        actualPieceCount++;

        // ตรวจว่าหมากอยู่นอกแถวตั้งต้นไหม
        const isDefaultZone = r === startRank || r === pawnRank;
        if (!isDefaultZone) return true; // หมากไปอยู่นอกแถวตั้งต้น -> ขยับแล้ว
      }
    }
  }

  // ✅ ถ้าจำนวนหมากน้อยกว่าค่าตั้งต้น -> แสดงว่าถูกกินไป -> ขยับแล้ว
  if (actualPieceCount < expectedPieceCount) return true;

  return false;
}

/** สุ่ม select index แบบ Weighted โดยไม่ซ้ำกับ index ใน `avoid` */
function weightedPickIndex(
  moves: { weight: number }[],
  avoid: Set<number>,
): number {
  const available = moves
    .map((m, i) => ({ m, i }))
    .filter(({ i }) => !avoid.has(i));
  if (available.length === 0) return -1;

  const total = available.reduce((s, { m }) => s + m.weight, 0);
  if (total <= 0) return available[0].i;

  let rand = Math.random() * total;
  for (const { m, i } of available) {
    if (rand < m.weight) return i;
    rand -= m.weight;
  }
  return available[available.length - 1].i;
}

/** หา Move ที่ถูกกฎหมาย (ตรงจาก/to) จาก getLegalMovesForSide */
function isLegalMove(
  board: Board,
  side: Side,
  from: [number, number],
  to: [number, number],
): Move | null {
  return (
    board
      .getLegalMovesForSide(side)
      .find(
        (m) =>
          m.from[0] === from[0] &&
          m.from[1] === from[1] &&
          m.to[0] === to[0] &&
          m.to[1] === to[1],
      ) ?? null
  );
}
