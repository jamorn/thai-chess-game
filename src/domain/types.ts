// src/domain/types.ts
// Type กลางสำหรับ Serialize/Deserialize กระดานหมากรุก
// แทนการใช้ `any` ใน Board.serialize() / Board.deserialize()
import { Side } from "./enums/Side";
import { PieceType } from "./enums/PieceType";

/** ข้อมูลหมากหนึ่งตัวในรูปแบบที่ถ่ายโอนระหว่าง thread / worker ได้ (plain object) */
export interface SerializedPiece {
  side: Side;
  type: PieceType;
}

/**
 * ข้อมูลทั้งกระดาน 8x8
 * แต่ละช่องเป็น null (ว่าง) หรือ SerializedPiece (มีหมาก)
 */
export type SerializedBoard = (SerializedPiece | null)[][];
