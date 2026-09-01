//
import { Piece } from "./Piece";
import { Side } from "../../enums/Side";
import { PieceType } from "../../enums/PieceType";
import { Position } from "../Position";
import { Board } from "../../Board";

export class Rook extends Piece {
  constructor(side: Side) {
    super(side, PieceType.ROOK);
  }

  public getPossibleMoves(position: Position, board: Board): Position[] {
    const moves: Position[] = [];
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    const [r, c] = position;

    for (const [dr, dc] of directions) {
      let nr = r + dr;
      let nc = c + dc;
      while (this.isWithinBoard(nr, nc)) {
        const target = board.getPieceAt(nr, nc);
        if (!target) {
          moves.push([nr, nc]);
        } else {
          if (target.side !== this.side) {
            moves.push([nr, nc]);
          }
          break;
        }
        nr += dr;
        nc += dc;
      }
    }
    return moves;
  }

  public clone(): Piece {
    return new Rook(this.side);
  }
}
