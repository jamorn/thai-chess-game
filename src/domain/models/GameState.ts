// src/domain/models/GameState.ts
// สถานะของเกมหมากรุกไทย ณ ขณะใดขณะหนึ่ง

export enum GameState {
  /** เกมยังดำเนินต่อไป มีหมากเดินได้ */
  IN_PROGRESS = "IN_PROGRESS",
  /** ฝั่งที่ถึงตาเดินถูกโคนจน (checkmate) -> แพ้ */
  CHECKMATE = "CHECKMATE",
  /** ฝั่งที่ถึงตาเดินไม่ได้ถูกโคน แต่เดินไม่ได้ -> เสมอ */
  STALEMATE = "STALEMATE",
  /** หมากไม่พอที่จะโคน (insufficient material) -> เสมอ */
  DRAW = "DRAW",
}
