// src/domain/models/pieces/Khon.ts
import { Piece } from "./Piece";
import { Side } from "../../enums/Side";
import { PieceType } from "../../enums/PieceType";
import { Position } from "../Position";
import { Board } from "../../Board";

export class Khon extends Piece {
  constructor(side: Side) {
    super(side, PieceType.KHON);
  }

  public getPossibleMoves(position: Position, board: Board): Position[] {
    const moves: Position[] = [];
    const forward = this.side === Side.RED ? -1 : 1;
    // ตามกฎหมากรุกไทย โคนเดินได้ 5 ช่อง:
    //  - เดินเฉียง 1 ช่องในทิศใดก็ได้ (4 ทิศ)
    //  - หรือไปข้างหน้า 1 ช่องแบบตั้งตรง (1 ทิศ)
    const directions: Array<[number, number]> = [
      // เฉียง 4 ทิศ
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
      // ไปข้างหน้าตรง 1 ช่อง
      [forward, 0],
    ];

    const [r, c] = position;
    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;

      // หมากรุกไทย: โคนเดินทั่วกระดานได้ (ไม่มีกฎพระราชฐานแบบหมากรุกจีน)
      if (!this.isWithinBoard(nr, nc)) continue;

      const target = board.getPieceAt(nr, nc);
      if (!target || target.side !== this.side) {
        moves.push([nr, nc]);
      }
    }
    return moves;
  }

  public clone(): Piece {
    return new Khon(this.side);
  }
}
