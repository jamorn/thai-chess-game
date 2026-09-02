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

  // MST orientation: มุมมองของฝั่ง RED โดย row 0 = แถวไกลสุดของ RED (ด้านฝ่ายตรงข้าม)
  // ฝั่ง BLACK จะใช้ mirror แกนตั้ง (7 - row)
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
    [0, 0, 0, 0, 0, 0, 0, 0], // แถวโปรโมต (จัดการเป็น Met แล้ว)
    [50, 50, 50, 50, 50, 50, 50, 50], // ใกล้โปรโมตมากที่สุด -> ค่าสูงสุด
    [30, 30, 30, 40, 40, 30, 30, 30],
    [20, 20, 20, 30, 30, 20, 20, 20],
    [10, 10, 10, 20, 20, 10, 10, 10],
    [0, 0, 0, 0, 0, 0, 0, 0], // แถวเริ่มต้น (ก้าวแรก)
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

  /** จำนวนหมากบนบอร์ดที่ถือว่าเข้าสู่ช่วง Endgame (ให้ขุนเข้ากลาง) */
  private static readonly ENDGAME_PIECE_THRESHOLD = 12;

  /** น้ำหนัก Mobility (คะแนนต่อช่องเดินได้ที่มากกว่าฝั่งตรงข้าม) */
  private static readonly MOBILITY_WEIGHT = 6;

  /** โบนัสต่อเบี้ยตัวที่คุมขุนอยู่ (Pawn Shield) */
  private static readonly KING_SHELL_BONUS = 20;

  /** ค่า Passed Pawn ต่อแถวที่เข้าใกล้โปรโมต (rowIndex เล็ก = ใกล้โปรโมต) */
  private static readonly PASSED_PAWN_BONUS = 25;

  /**
   * Lazy Evaluation Threshold
   * ถ้าผลต่าง Material+PST ระหว่างสองฝั่งห่างกันมากเกินไปกว่าค่านี้
   * จะถือว่า "นำ/ตามชัด" แล้ว - ข้ามการคำนวณ Mobility (ราคาแพง) เพราะไม่กี่แต้ม
   * ของ Mobility ไม่สามารถชดเชยแต้มต่างของหมากได้
   * ตั้ง ~แค่เรื่องเรือเดียว (500) เป็นหลัก
   */
  private static readonly LAZY_EVAL_THRESHOLD = 450;

  /**
   * Full evaluation (Material + PST + Mobility + Pawn structure)
   * ใช้ที่ minimax leaf เท่านั้น ราคาแพงกว่า evaluateStatic เล็กน้อย
   */
  public static evaluate(board: Board, aiSide: Side): number {
    const material = this.evaluateStatic(board, aiSide);

    // Lazy Evaluation: ต่างกันเกิน threshold -> ตัดสินด้วย material+PST อย่างเดียว
    // ประหยัดการ generate pseudo-legal moves (ray-cast) ที่ leaf จำนวนมหาศาล
    if (Math.abs(material) > this.LAZY_EVAL_THRESHOLD) {
      return material;
    }

    let score = material;

    // Positional features (Mobility / King Safety / Passed Pawn)
    score += this.mobilityScore(board, aiSide);
    score += this.pawnStructureScore(board, aiSide);

    return score;
  }

  /**
   * Static evaluation แบบเบา: แค่ Material + PST (ไม่มี Mobility/Pawn structure)
   * ใช้ใน Quiescence Search ซึ่งต้องประเมิน leaf จำนวนมหาศาล
   * เพื่อประหยัดการ generate legal moves ซ้ำ ๆ
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

    return score;
  }

  /**
   * Mobility: ฝั่งที่หมาก "แตะถึง" ช่องได้มากกว่า ถือว่าครองพื้นที่ / มีตัวเลือกดีกว่า
   * ใช้ Pseudo-Legal moves (countPseudoLegalMovesForSide) ซึ่งไม่ต้องตรวจ isKingInCheck
   * + ไม่ต้อง makeMove/undoMove -> ประหยัด overhead มากเมื่อเทียบกับ getLegalMovesForSide
   */
  private static mobilityScore(board: Board, aiSide: Side): number {
    const enemySide = aiSide === Side.RED ? Side.BLACK : Side.RED;
    const myMoves = board.countPseudoLegalMovesForSide(aiSide);
    const oppMoves = board.countPseudoLegalMovesForSide(enemySide);
    return (myMoves - oppMoves) * this.MOBILITY_WEIGHT;
  }

  /**
   * Pawn Structure (Passed Pawn + Pawn Shield)
   * - Passed Pawn: เบี้ยที่ไม่มีเบี้ยฝั่งตรงข้ามขวางในคอลัมน์เดียวกัน -> มีค่าเพิ่มตามระยะใกล้โปรโมต
   * - Pawn Shield: เบี้ยด้านหน้าขุนช่วยป้องกันขุน -> โบนัสในเกมช่วงต้น/กลาง
   */
  private static pawnStructureScore(board: Board, aiSide: Side): number {
    let pawnScore = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board.getPieceAt(r, c);
        if (!piece || piece.type !== PieceType.PAWN) continue;

        const isMine = piece.side === aiSide;
        const sign = isMine ? 1 : -1;

        // Passed Pawn: ไม่มีเบี้ยฝั่งตรงข้ามในคอลัมน์เดียวกัน
        if (!this.hasEnemyPawnInColumn(board, c, piece.side)) {
          // rowIndex: 0 = ใกล้โปรโมตของฝั่งนั้น -> แล้วยิ่งใกล้ ยิ่งได้เยอะ
          const rowIndex = piece.side === Side.RED ? r : 7 - r;
          const progress = Math.max(0, 6 - rowIndex); // rowIndex 0..5 ใกล้โปรโมต
          pawnScore += sign * (this.PASSED_PAWN_BONUS + progress * 4);
        }

        // Pawn Shield: เบี้ยฝั่งของเราอยู่ด้านหน้าขุน (ช่วยกันแนว)
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

  /** ตรวจว่าคอลัมน์นี้มีเบี้ยของฝั่งตรงข้าม กับตัว `side` อยู่หรือไม่ */
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

  /** คำนวณโบนัสตำแหน่งของหมากตาม PST (mirror แกนตั้งสำหรับ BLACK) */
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

  /** ค่าหมากตามชนิด (public ให้ QS/ภายนอกเข้าถึง เช่น Delta Pruning) */
  public static getPieceValue(type: PieceType): number {
    return this.PIECE_VALUES[type] ?? 0;
  }

  /**
   * ค่าหมากฝั่งตรงข้ามที่สูงที่สุดที่ยังอยู่บนบอร์ด
   * ใช้เป็น upper bound ของ "การได้จากการ capture หนึ่งครั้ง" สำหรับ Delta Pruning ใน QS
   */
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
