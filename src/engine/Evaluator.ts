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

  private static readonly KHON_PST: number[][] = [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 10, 10, 5, 0, -10],
    [-10, 5, 5, 10, 10, 5, 5, -10],
    [-10, 0, 10, 10, 10, 10, 0, -10],
    [-10, 10, 10, 10, 10, 10, 10, -10],
    [-10, 5, 0, 0, 0, 0, 5, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20],
  ];

  private static readonly MET_PST: number[][] = [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 5, 5, 5, 0, -10],
    [-10, 0, 5, 10, 10, 5, 0, -10],
    [-10, 0, 5, 10, 10, 5, 0, -10],
    [-10, 0, 5, 5, 5, 5, 0, -10],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20],
  ];

  private static readonly ROOK_PST: number[][] = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [5, 10, 10, 10, 10, 10, 10, 5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [0, 0, 0, 5, 5, 0, 0, 0],
  ];

  private static readonly PAWN_PST: number[][] = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [30, 30, 30, 40, 40, 30, 30, 30],
    [20, 20, 20, 30, 30, 20, 20, 20],
    [10, 10, 10, 20, 20, 10, 10, 10],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ];

  private static readonly KING_PST: number[][] = [
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [20, 20, 0, 0, 0, 0, 20, 20],
    [20, 30, 10, 0, 0, 10, 30, 20],
  ];

  private static readonly KING_PST_ENDGAME: number[][] = [
    [-50, -40, -30, -20, -20, -30, -40, -50],
    [-30, -20, -10, 0, 0, -10, -20, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -30, 0, 0, 0, 0, -30, -30],
    [-50, -30, -30, -30, -30, -30, -30, -50],
  ];

  private static readonly ENDGAME_PIECE_THRESHOLD = 12;
  private static readonly MOBILITY_WEIGHT = 6;
  private static readonly KING_SHELL_BONUS = 20;
  private static readonly PASSED_PAWN_BONUS = 25;
  private static readonly PAWN_OVER_EXTENSION_PENALTY = 14;
  private static readonly ROOK_OPEN_FILE_BONUS = 25;
  private static readonly ROOK_SEMI_OPEN_FILE_BONUS = 12;
  private static readonly CENTER_SQUARES: [number, number][] = [
    [3, 3],
    [3, 4],
    [4, 3],
    [4, 4],
  ];
  private static readonly CENTER_CONTROL_WEIGHT = 8;
  private static readonly LAZY_EVAL_THRESHOLD = 450;

  // ✅ ใหม่: Endgame King Hunt Weights
  private static readonly EDGE_DISTANCE_WEIGHT = 50; // บีบขุนศัตรูติดขอบ
  private static readonly KING_PROXIMITY_WEIGHT = 30; // เดินขุนเราเข้าใกล้ขุนศัตรู

  public static evaluate(board: Board, aiSide: Side): number {
    const material = this.evaluateStatic(board, aiSide);
    if (Math.abs(material) > this.LAZY_EVAL_THRESHOLD) {
      return material;
    }
    let score = material;
    score += this.mobilityScore(board, aiSide);
    score += this.pawnStructureScore(board, aiSide);
    score += this.rookOpenFileScore(board, aiSide);
    score += this.centerControlScore(board, aiSide);
    score += this.pawnOverExtensionScore(board, aiSide);
    return score;
  }

  /**
   * Static evaluation: Material + PST + Endgame King Hunt
   * ✅ เพิ่ม Endgame King Hunt ที่นี่เพื่อให้ทำงานเสมอ แม้ใน QS หรือ Lazy Eval
   */
  public static evaluateStatic(board: Board, aiSide: Side): number {
    const totalPieces = this.countPieces(board);
    const isEndgame = totalPieces <= this.ENDGAME_PIECE_THRESHOLD;
    let score = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board.getPieceAt(r, c);
        if (!piece) continue;
        const rowIndex = piece.side === Side.RED ? r : 7 - r;
        let pieceScore = this.PIECE_VALUES[piece.type];
        pieceScore += this.pstBonus(piece.type, rowIndex, c, isEndgame);
        if (piece.side === aiSide) {
          score += pieceScore;
        } else {
          score -= pieceScore;
        }
      }
    }

    // ✅ ใหม่: Endgame King Hunt Heuristic
    // ช่วยให้ AI รู้วิธี "บีบขุนศัตรูให้ติดขอบ" และ "เดินขุนเราเข้าประชิด"
    // สำคัญมากสำหรับฉากจบเกม เช่น เรือ+ขุน vs ขุนตัวเดียว
    if (isEndgame) {
      const enemySide = aiSide === Side.RED ? Side.BLACK : Side.RED;
      const enemyKingPos = this.findKing(board, enemySide);
      const myKingPos = this.findKing(board, aiSide);

      if (enemyKingPos && myKingPos) {
        // 1. ให้คะแนนเมื่อผลักขุนศัตรูไปติดขอบกระดาน (Edge Distance)
        // edgeDistance = 0 (ติดขอบ) → 3 (กลางกระดาน)
        const edgeDistance = Math.min(
          enemyKingPos[0],
          7 - enemyKingPos[0],
          enemyKingPos[1],
          7 - enemyKingPos[1],
        );
        // ยิ่งติดขอบ (edgeDistance ต่ำ) ยิ่งได้คะแนนสูง (สูงสุด 150 คะแนน)
        score += (3 - edgeDistance) * this.EDGE_DISTANCE_WEIGHT;

        // 2. ให้คะแนนเมื่อขุนเราเข้าใกล้ขุนศัตรู (King Proximity / Opposition)
        // ใช้ Chebyshev distance (ระยะสูงสุดระหว่างแกน X และ Y)
        const kingDist = Math.max(
          Math.abs(enemyKingPos[0] - myKingPos[0]),
          Math.abs(enemyKingPos[1] - myKingPos[1]),
        );
        // ยิ่งใกล้กัน (kingDist ต่ำ) ยิ่งได้คะแนนสูง (สูงสุด 180 คะแนน)
        // kingDist จะไม่ต่ำกว่า 1 เพราะขุนห้ามเดินชนกัน
        score += (7 - kingDist) * this.KING_PROXIMITY_WEIGHT;
      }
    }

    return score;
  }

  private static mobilityScore(board: Board, aiSide: Side): number {
    const enemySide = aiSide === Side.RED ? Side.BLACK : Side.RED;
    const myMoves = board.countPseudoLegalMovesForSide(aiSide);
    const oppMoves = board.countPseudoLegalMovesForSide(enemySide);
    return (myMoves - oppMoves) * this.MOBILITY_WEIGHT;
  }

  private static pawnStructureScore(board: Board, aiSide: Side): number {
    let pawnScore = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board.getPieceAt(r, c);
        if (!piece || piece.type !== PieceType.PAWN) continue;
        const isMine = piece.side === aiSide;
        const sign = isMine ? 1 : -1;
        if (!this.hasEnemyPawnInColumn(board, c, piece.side)) {
          const rowIndex = piece.side === Side.RED ? r : 7 - r;
          const progress = Math.max(0, 6 - rowIndex);
          pawnScore += sign * (this.PASSED_PAWN_BONUS + progress * 4);
        }
        const king = this.findKing(board, piece.side);
        if (king) {
          const [kr] = king;
          const kingBack = piece.side === Side.RED ? kr - 1 : kr + 1;
          if (r === kingBack) {
            pawnScore += sign * this.KING_SHELL_BONUS;
          }
        }
      }
    }
    return pawnScore;
  }

  private static hasEnemyPawnInColumn(
    board: Board,
    col: number,
    side: Side,
  ): boolean {
    const enemySide = side === Side.RED ? Side.BLACK : Side.RED;
    for (let r = 0; r < 8; r++) {
      const piece = board.getPieceAt(r, col);
      if (piece && piece.side === enemySide && piece.type === PieceType.PAWN) {
        return true;
      }
    }
    return false;
  }

  public static pawnOverExtensionScore(board: Board, aiSide: Side): number {
    const totalPieces = this.countPieces(board);
    if (totalPieces < 16) return 0;
    let score = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board.getPieceAt(r, c);
        if (!piece || piece.type !== PieceType.PAWN) continue;
        const overExtended = piece.side === Side.RED ? r <= 3 : r >= 4;
        if (!overExtended) continue;
        const sign = piece.side === aiSide ? 1 : -1;
        score -= sign * this.PAWN_OVER_EXTENSION_PENALTY;
      }
    }
    return score;
  }

  public static rookOpenFileScore(board: Board, aiSide: Side): number {
    let score = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board.getPieceAt(r, c);
        if (!piece || piece.type !== PieceType.ROOK) continue;
        const isMine = piece.side === aiSide;
        const file = this.openFileBonus(board, c, piece.side);
        score += isMine ? file : -file;
      }
    }
    return score;
  }

  private static openFileBonus(board: Board, col: number, side: Side): number {
    let friendlyPawn = false;
    let enemyPawn = false;
    for (let r = 0; r < 8; r++) {
      const piece = board.getPieceAt(r, col);
      if (piece && piece.type === PieceType.PAWN) {
        if (piece.side === side) friendlyPawn = true;
        else enemyPawn = true;
      }
    }
    if (!friendlyPawn && !enemyPawn) return this.ROOK_OPEN_FILE_BONUS;
    if (!friendlyPawn && enemyPawn) return this.ROOK_SEMI_OPEN_FILE_BONUS;
    return 0;
  }

  public static centerControlScore(board: Board, aiSide: Side): number {
    const enemySide = aiSide === Side.RED ? Side.BLACK : Side.RED;
    const mine = this.countCenterReachers(board, aiSide);
    const enemy = this.countCenterReachers(board, enemySide);
    return (mine - enemy) * this.CENTER_CONTROL_WEIGHT;
  }

  private static countCenterReachers(board: Board, side: Side): number {
    let count = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board.getPieceAt(r, c);
        if (!piece || piece.side !== side) continue;
        const targets = piece.getPossibleMoves([r, c], board);
        const reachesCenter = targets.some(([tr, tc]) =>
          this.CENTER_SQUARES.some(([cr, cc]) => cr === tr && cc === tc),
        );
        if (reachesCenter) count++;
      }
    }
    return count;
  }

  private static findKing(board: Board, side: Side): [number, number] | null {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board.getPieceAt(r, c);
        if (piece && piece.type === PieceType.KING && piece.side === side) {
          return [r, c];
        }
      }
    }
    return null;
  }

  private static countPieces(board: Board): number {
    let count = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board.getPieceAt(r, c)) count++;
      }
    }
    return count;
  }

  private static pstBonus(
    type: PieceType,
    rowIndex: number,
    col: number,
    isEndgame: boolean,
  ): number {
    switch (type) {
      case PieceType.HORSE:
        return this.HORSE_PST[rowIndex][col];
      case PieceType.KHON:
        return this.KHON_PST[rowIndex][col];
      case PieceType.MET:
        return this.MET_PST[rowIndex][col];
      case PieceType.ROOK:
        return this.ROOK_PST[rowIndex][col];
      case PieceType.PAWN:
        return this.PAWN_PST[rowIndex][col];
      case PieceType.KING:
        return isEndgame
          ? this.KING_PST_ENDGAME[rowIndex][col]
          : this.KING_PST[rowIndex][col];
      default:
        return 0;
    }
  }

  public static getPieceValue(type: PieceType): number {
    return this.PIECE_VALUES[type] ?? 0;
  }

  public static getMaxCapturableValue(board: Board, side: Side): number {
    const enemySide = side === Side.RED ? Side.BLACK : Side.RED;
    let max = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board.getPieceAt(r, c);
        if (piece && piece.side === enemySide) {
          const v = this.PIECE_VALUES[piece.type];
          if (v > max) max = v;
        }
      }
    }
    return max;
  }

  public static scoreMove(move: Move): number {
    if (!move.capturedPiece) return 0;
    const victimValue = this.PIECE_VALUES[move.capturedPiece.type];
    const attackerValue = this.PIECE_VALUES[move.piece.type];
    return 10 * victimValue - attackerValue;
  }
}
