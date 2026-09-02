// src/engine/utils/random.ts
import { BookMove } from "../data/openingBook";

/**
 * สุ่มเลือกตาเดินจากรายการ BookMove แบบ Weighted Random
 * ---
 * แต่ละ move มี `weight` กำกับความถี่ ยิ่ง weight สูงยิ่งมีโอกาสถูกเลือกมาก
 * (เทียบสัดส่วนกับ totalWeight ของทุก move ใน list)
 */
export function selectRandomBookMove(moves: BookMove[]): BookMove {
  const totalWeight = moves.reduce((sum, m) => sum + m.weight, 0);

  // ป้องกัน list ว่าง / weight รวมเป็น 0
  if (totalWeight <= 0 || moves.length === 0) {
    return moves[0];
  }

  let randomValue = Math.random() * totalWeight;

  for (const move of moves) {
    if (randomValue < move.weight) {
      return move;
    }
    randomValue -= move.weight;
  }

  // Fallback เผื่อเลขสุ่มตกหลุดเพราะ floating point
  return moves[moves.length - 1];
}
