// src/domain/models/pieces/Horse.ts
import { Piece } from "./Piece";
import { Side } from "../../enums/Side";
import { PieceType } from "../../enums/PieceType";
import { Position } from "../Position";
import { Board } from "../../Board";

export class Horse extends Piece {
  constructor(side: Side) {
    super(side, PieceType.HORSE);
  }

  public getPossibleMoves(position: Position, board: Board): Position[] {
    const moves: Position[] = [];
    const offsets = [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1],
    ];

    const [r, c] = position;
    for (const [dr, dc] of offsets) {
      const nr = r + dr;
      const nc = c + dc;
      if (this.isWithinBoard(nr, nc)) {
        const target = board.getPieceAt(nr, nc);
        if (!target || target.side !== this.side) {
          moves.push([nr, nc]);
        }
      }
    }
    return moves;
  }

  public clone(): Piece {
    return new Horse(this.side);
  }
}
