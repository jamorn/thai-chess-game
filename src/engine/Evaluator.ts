// src/engine/Evaluator.ts
import { Board } from "../domain/Board";
import { Side } from "../domain/enums/Side";
import { PieceType } from "../domain/enums/PieceType";
import { Move } from "../domain/models/Move";

export class Evaluator {
  private static readonly PIECE_VALUES: Record<PieceType, number> = {
    [PieceType.KING]: 20000,
    [PieceType.ROOK]: 500,
    [PieceType.HORSE]: 300,
    [PieceType.KHON]: 250,
    [PieceType.MET]: 150,
    [PieceType.PAWN]: 100,
  };

  private static readonly HORSE_PST: number[][] = [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0, 0, 0, 0, -20, -40],
    [-30, 0, 10, 15, 15, 10, 0, -30],
    [-30, 5, 15, 20, 20, 15, 5, -30],
    [-30, 0, 15, 20, 20, 15, 0, -30],
    [-30, 5, 10, 15, 15, 10, 5, -30],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50],
  ];

  public static evaluate(board: Board, aiSide: Side): number {
    let score = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board.getPieceAt(r, c);
        if (!piece) continue;

        let pieceScore = this.PIECE_VALUES[piece.type];
        if (piece.type === PieceType.HORSE) {
          pieceScore += this.HORSE_PST[r][c];
        }

        if (piece.side === aiSide) {
          score += pieceScore;
        } else {
          score -= pieceScore;
        }
      }
    }

    return score;
  }

  public static scoreMove(move: Move): number {
    if (!move.capturedPiece) return 0;
    const victimValue = this.PIECE_VALUES[move.capturedPiece.type];
    const attackerValue = this.PIECE_VALUES[move.piece.type];
    return 10 * victimValue - attackerValue;
  }
}
