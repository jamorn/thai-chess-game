// src/domain/models/pieces/King.ts
import { Piece } from "./Piece";
import { Side } from "../../enums/Side";
import { PieceType } from "../../enums/PieceType";
import { Position } from "../Position";
import { Board } from "../../Board";

export class King extends Piece {
  constructor(side: Side) {
    super(side, PieceType.KING);
  }

  public getPossibleMoves(position: Position, board: Board): Position[] {
    const moves: Position[] = [];
    const directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];

    const [r, c] = position;
    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;

      // หมากรุกไทย: ขุนเดินทั่วกระดานได้ (ไม่มีกฎพระราชฐานแบบหมากรุกจีน)
      if (!this.isWithinBoard(nr, nc)) continue;

      const target = board.getPieceAt(nr, nc);
      if (!target || target.side !== this.side) {
        moves.push([nr, nc]);
      }
    }
    return moves;
  }

  public clone(): Piece {
    return new King(this.side);
  }
}
