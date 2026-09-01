// src/domain/models/pieces/Pawn.ts
import { Piece } from "./Piece";
import { Side } from "../../enums/Side";
import { PieceType } from "../../enums/PieceType";
import { Position } from "../Position";
import { Board } from "../../Board";

export class Pawn extends Piece {
  constructor(side: Side) {
    super(side, PieceType.PAWN);
  }

  public getPossibleMoves(position: Position, board: Board): Position[] {
    const moves: Position[] = [];
    const forward = this.side === Side.RED ? -1 : 1;
    const [r, c] = position;

    const nr = r + forward;
    if (this.isWithinBoard(nr, c) && !board.getPieceAt(nr, c)) {
      moves.push([nr, c]);
    }

    for (const capCol of [c - 1, c + 1]) {
      if (this.isWithinBoard(nr, capCol)) {
        const target = board.getPieceAt(nr, capCol);
        if (target && target.side !== this.side) {
          moves.push([nr, capCol]);
        }
      }
    }

    return moves;
  }

  public clone(): Piece {
    return new Pawn(this.side);
  }
}
