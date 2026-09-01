// src/domain/constants.ts
// รวมค่าคงที่ของหมากรุกไทย ทั้งboard size, palace, promotion row ไว้ในที่เดียว
import { Side } from "./enums/Side";

export const BOARD_SIZE = 8;

/** แถวโปรโมต (Promotion Row) สำหรับเบี้ยแต่ละฝั่ง */
export const PROMOTION_ROW: Record<Side, number> = {
  [Side.RED]: 2,
  [Side.BLACK]: 5,
};

/**
 * เขตพระราชฐาน (Palace) ของขุน/โคน
 * RED: แถว 5-7, คอลัมน์ 3-5 (มุมขวาล่างของกระดาน มุมมองด้านRED)
 * BLACK: แถว 0-2, คอลัมน์ 3-5 (มุมซ้ายบนของกระดาน มุมมองด้านRED)
 */
export const PALACE_ROWS = {
  /** แถวต่ำสุดของบ้าน RED (ล่างของกระดาน) */
  [Side.RED]: { min: BOARD_SIZE - 3, max: BOARD_SIZE - 1 },
  [Side.BLACK]: { min: 0, max: 2 },
} as const;

export const PALACE_COLS = { min: 3, max: 5 } as const;
