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
  private static readonly CONNECTED_PASSED_PAWN_BONUS = 15;
  private static readonly PAWN_OVER_EXTENSION_PENALTY = 14;
  // ✅ ใหม่ (ข้อ 8): ค่าถ่วงน้ำหนัก เบี้ยนอก/เบี้ยใน
  private static readonly OUTSIDE_PAWN_WEIGHT = 8;
  private static readonly INSIDE_PAWN_MISSING_PENALTY = 5;
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
  // ✅ ใหม่: จำกัด "การเดินขุนเข้าประชิด (Opposition)" ให้เกิดขึ้นก็ต่อเมื่อเราไม่ได้เสียเปรียบมหาศาล
  // (ถ้า score ต่ำกว่า -150 เช่น เสียเรือไปแล้ว การเดินขุนเข้าใกล้คือ "เดินเข้าหาตาย" จึงไม่ให้โบนัส)
  private static readonly PROXIMITY_BONUS_MIN_SCORE = -150;

  // ✅ ใหม่ (Tactical Heuristics - "มองเกมทะลุ" แบบมนุษย์)
  // ให้ AI ให้ค่ากับ "การที่หมากถูกคุกคามโดยไม่มีเพื่อนป้องกัน" ราวกับมันเห็น
  // โดยไม่ต้องรอให้ Minimax คำนวณลึก (ประหยัดเวลา + กล้าเสี่ยงสายที่เสียหมากก่อนเพื่อกินแพงกว่า)
  // - ทีฐานแห่ง one pass สแกน pseudo-legal attacks เท่านั้น (ไม่ไป makeMove เต็ม) => เร็วพอใช้ทุก leaf
  private static readonly HANG_PENALTY_PCT_OWN = 0.45; // % ของค่าหมากที่หักเมื่อชิ้นของเรา "ลอย" (โดนคุกคามแบบไม่ defend)
  private static readonly HANG_DISCOUNT_ENEMY_PCT = 0.5; // ใช้กับชิ้นศัตรู (ไม่หักเต็ม เพราะเป็น approximate เมื่อไม่มี defender)
  private static readonly EXCHANGE_GAIN_BONUS = 12; // โบนัสเมื่อเราชี้ชิ้น "แพงกว่า" ของศัตรูแบบ not-defended (เห็นความกินคืนเชิงบวก)

  private static readonly TACTICAL_MIN_PIECES = 4; // ถ้าเหลือหมากน้อยเกิน (จบเกมไกล deep) ให้เลือกใช้ทำ full search แทน heuristic

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
    score += this.connectedPawnScore(board, aiSide);
    score += this.outsidePawnScore(board, aiSide);
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
        // ✅ แก้ไข: จะให้โบนัส Proximity ก็ต่อเมื่อ "เราไม่ได้เสียเปรียบมหาศาล"
        // เพราะถ้า score ติดลบมาก (เสียเรือ/หมากแพงไป) การเดินขุนเข้าใกล้คือ "เดินเข้าหาตาย"
        // ไม่ใช่การไล่บีบ สภาพเช่นนี้ให้เหลียวไปขอเสมอ (กันไว้) ไม่ควรเดินขุนเสี่ยง
        if (score >= this.PROXIMITY_BONUS_MIN_SCORE) {
          const kingDist = Math.max(
            Math.abs(enemyKingPos[0] - myKingPos[0]),
            Math.abs(enemyKingPos[1] - myKingPos[1]),
          );
          // ยิ่งใกล้กัน (kingDist ต่ำ) ยิ่งได้คะแนนสูง (สูงสุด 180 คะแนน)
          // kingDist จะไม่ต่ำกว่า 1 เพราะขุนห้ามเดินชนกัน
          score += (7 - kingDist) * this.KING_PROXIMITY_WEIGHT;
        }
      }
    }

    // ✅ ใหม่ (Tactical Heuristics): เพิ่มกลไก "มองชิ้นลอย / โอกาสกินแพงกว่า"
    // ใส่ตรงนี้เพราะถูกเรียกทั้งใน evaluate และ evaluateStatic/QS อย่างสม่ำเสมอ
    score += this.tacticalSafetyScore(board, aiSide);

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

  /**
   * ✅ ใหม่ (ข้อ 7): Connected Passed Pawn bonus
   * -----------------------------------------------------------
   * หลักครูพงษ์ข้อ 7 (ชิงความได้เปรียบเบี้ยสูง): ไม่ผูกกับตัวเลขเดี่ยว ๆ
   * แต่เบี้ยที่ดันสูงเป็น "แนว/คู่" (มีเพื่อนสีเดียวกันยืนติดกัน แถวเดียวกัน col ±1)
   * จะได้เปรียบอย่างแท้จริง เพราะศัตรูจัดการทีละตัวไม่ได้โดยไม่ถูกชดใช้
   * = Connected Passed Pawns => แข็งแกร่งกว่า passed pawn ตัวเดี่ยวโดดเดี่ยว
   *
   * วิธีนับ (หลีกเลี่ยง double count เช่น เดียวกับ rook/pawn):
   *   - รอบแรก เช็คทีละเบี้ยของฝั่งที่ถูกถาม หากเป็น PASSED (ไม่มี enemy pawn ใน col)
   *     และมีเพื่อน passed pawn ติดกันขวา (c+1) เท่านั้น = นับเป็น 1 คู่
   *     (เชื่อมซ้ายถูกนับจากเพื่อนทางขวาของอีกตัว ทำให้ไม่นับซ้ำ 2 รอบ)
   *
   * @returns คะแนน (บวก = ฝั่งนั้นมี connected passed pawns เด่นกว่า)
   */
  public static connectedPawnScore(board: Board, aiSide: Side): number {
    const totalPieces = this.countPieces(board);
    if (totalPieces < 14) return 0; // ช่วงที่ยังไม่เข้าจบเกม (ที่นับเบี้ยแบบรุก)

    let myPairs = 0;
    let enemyPairs = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board.getPieceAt(r, c);
        if (
          !piece ||
          piece.type !== PieceType.PAWN ||
          this.hasEnemyPawnInColumn(board, c, piece.side)
        ) {
          continue; // ไม่ใช่เบี้ย หรือมี enemy pawn ใน col -> ไม่ใช่ passed
        }
        // เป็น passed pawn: ดูคู่ทางขวา (c+1) ในแถวเดียวกัน
        const nc = c + 1;
        if (nc > 7) continue;
        const rightPiece = board.getPieceAt(r, nc);
        const isConnectedRight =
          rightPiece &&
          rightPiece.type === PieceType.PAWN &&
          rightPiece.side === piece.side &&
          !this.hasEnemyPawnInColumn(board, nc, piece.side);

        if (isConnectedRight) {
          if (piece.side === aiSide) myPairs++;
          else enemyPairs++;
        }
      }
    }

    return (myPairs - enemyPairs) * this.CONNECTED_PASSED_PAWN_BONUS;
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

  /**
   * ✅ ใหม่ (ข้อ 8): ชิงความได้เปรียบ เบี้ยนอก / เบี้ยใน (Outside / Inside Pawn)
   * -------------------------------------------------------------
   * อ้างอิงตามหลักครูพงษ์ข้อ 8 (ดู Docs/OPENING_BOOK.MD):
   *  "การเดินเบี้ยด้านนอก กินตัดเบี้ยในของคู่ต่อสู้
   *   เมื่อเบี้ยในของคู่ต่อสู้หายไป เขาจะเสียเปรียบทางให้เรา
   *   นอกนั้นฝั่งตรงข้ามจะเหลือแต่เบี้ยนอก ซึ่งเป็นจุดอ่อนให้เราโจมตีจับกิน"
   *
   * สูตร (ตามที่ /Docs/ststus.md แนะนำ สำหรับเริ่มต้นแล้วจึง sim tune ต่อ):
   *   - เบี้ย "นอก" (นอก / edges คอลัมน์ 0,1 / 6,7) ที่ถือได้มากกว่า = เราเปิดเส้นกว้างได้ -> โบนัส
   *   - หาก "เบี้ยใน" (กลาง 2,3,4,5) ของเราน้อยกว่าศัตรูมาก = ถูกตัดเบี้ยหลัก -> หัก
   *
   * หมายเหตุ: weight เหล่านี้ยังเป็นค่าตั้งต้น นำไป validate / tune ด้วย AI-vs-AI sim ได้
   * @returns คะแนน (บวก = เรามีโครงสร้างเบี้ยได้เปรียบกว่า)
   */
  public static outsidePawnScore(board: Board, aiSide: Side): number {
    const totalPieces = this.countPieces(board);
    // จำกัดให้ทำงานแค่ช่วงกลางเกม (หมากยังครบแรง) ไม่รบกวนการไล่จน endgame
    if (totalPieces < 14) return 0;

    let myInside = 0;
    let myOutside = 0;
    let enemyInside = 0;
    let enemyOutside = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board.getPieceAt(r, c);
        if (!piece || piece.type !== PieceType.PAWN) continue;
        // คอลัมน์ปลาย (0,1 / 6,7) = เบี้ยนอก (ขอบ) · กลาง (2..5) = เบี้ยใน
        const isOutside = c <= 1 || c >= 6;
        if (piece.side === aiSide) {
          if (isOutside) myOutside++;
          else myInside++;
        } else {
          if (isOutside) enemyOutside++;
          else enemyInside++;
        }
      }
    }

    // เบี้ยนอกที่ถือได้มากกว่าศัตรู เปิดเส้น/จังหวะรุกทางปีกกว้างได้
    const outsideAdvantage =
      (myOutside - enemyOutside) * this.OUTSIDE_PAWN_WEIGHT;

    // เมื่อเราสูญเสีย "เบี้ยใน" (แนวกลาง) ไปจนน้อยกว่าศัตรูไปมาก ถูกตัดแกนหลัก
    const insidePenalty =
      Math.max(0, enemyInside - myInside) * this.INSIDE_PAWN_MISSING_PENALTY;

    return outsideAdvantage - insidePenalty;
  }

  /**
   * ✅ ใหม่ (Tactical Heuristics): ให้ค่าแก่ "ความเสี่ยงชิ้นลอย / การได้โอกาสกินที่แพงกว่า"
   * -------------------------------------------------------------------------------
   * หลักการ (เลียนแบบการที่มนุษย์ "มองเกมทะลุ"):
   *    1. หา "attack map" (pseudo-legal) ของทั้งสองฝั่ง — ชิ้นใด (r,c) ถูก enemy มองถึงไหม
   *    2. ชิ้นของ "เรา" ที่กำลังถูกศัตรูมองถึง แต่เราไม่มีเพื่อนสีเดียวกัน "มองย้อนกลับ/ป้องกัน"
   *       = เรียกว่า hanging/loose -> ต้องหัก value ส่วนหนึ่งออก (ดูก่อนว่าศัตรูจะหยิบได้จริง)
   *    3. สมมาตรกันฝั่งศัตรู: ถ้าชิ้นศัตรู hanging -> เป็นโอกาสให้เราเก็บกำไรจาก "จดหมาย" แบบเดิมพัน
   *
   * แปลงเป็นคะแนนอย่างง่ายโดย non-destructive (ไม่หลอก makeMove) เพื่อใช้ได้เร็วในทุก leaf+QS
   * method คืนค่าบวก = aiSide ได้เปรียบ / ค่าเป็นลบ = aiSide เสียเปรียบ (ตรงกับสัญญาณที่เหลือทั้งคลาส)
   *
   * @param aiSide ฝั่งที่ถือเป็น "เรา"
   */
  private static tacticalSafetyScore(board: Board, aiSide: Side): number {
    // ถ้าเกมเหลือหมากน้อยมาก (เข้าสู่ endgame deep) -> ปล่อยให้ Minimax/QS ไล่จัดการเอง (ไม่มี noise)
    const totalPieces = this.countPieces(board);
    if (totalPieces < this.TACTICAL_MIN_PIECES) return 0;

    // ---- build attack map: attackedByMyTeam[r][c], attackedByEnemy[r][c] ----
    const myAttacks: boolean[][] = Array.from({ length: 8 }, () =>
      Array(8).fill(false),
    );
    const enemyAttacks: boolean[][] = Array.from({ length: 8 }, () =>
      Array(8).fill(false),
    );

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board.getPieceAt(r, c);
        if (!piece || piece.type === PieceType.KING) continue; // ไม่นับมุมขุนในนี้ (จัดการโดย King-Safe/QS)
        const targets = piece.getPossibleMoves([r, c], board);
        const table = piece.side === aiSide ? myAttacks : enemyAttacks;
        for (const [tr, tc] of targets) {
          table[tr][tc] = true;
        }
      }
    }

    // ---- นับ "โอกาส" ต่อหมาก ----
    let myLooseValue = 0; // มูลค่ารวมของชิ้นเราที่ศัตรูมองถึง โดยเรามองย้อนกลับไม่ถึง (loose)
    let oppLooseValue = 0; // ค่าของชิ้นศัตรูที่เป็นเป้าให้เราดักได้ (loose)

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board.getPieceAt(r, c);
        if (!piece || piece.type === PieceType.KING) continue;

        const isMine = piece.side === aiSide;
        const myOffense = isMine ? myAttacks : enemyAttacks; // เพื่อดูว่าเพื่อนในทีมมองถึงมันไหม
        const attackedByEnemy = isMine
          ? enemyAttacks[r][c]
          : myAttacks[r][c];
        const protectedByFriend = myOffense[r][c]; // เพื่อนสีเดียวกัน "มองถึง" ช่องนี้=defend

        if (isMine) {
          // ชิ้นของเรา -> ถ้าอยู่ในสายตาศัตรู และเราไม่มีเพื่อน protect = hanging
          if (attackedByEnemy && !protectedByFriend) {
            myLooseValue +=
              this.PIECE_VALUES[piece.type] * this.HANG_PENALTY_PCT_OWN;
          }
        } else {
          // ชิ้นศัตรู -> ถ้าศัตรูมองถึง (โฆษณา) แต่ฝ่ายเขาป้องกันไม่ได้ ก็เป็นเป้าให้เราเก็บ
          if (attackedByEnemy && !protectedByFriend) {
            oppLooseValue +=
              this.PIECE_VALUES[piece.type] * this.HANG_DISCOUNT_ENEMY_PCT;
          }
        }
      }
    }

    // ---- รวมผล: โดน - (loose ของเรา) + (โอกาสจากชิ้นศัตรู) + bonus เมื่อได้ "ของแพง" ซึ่งถูกปล่อย unprotected
    //         (bonus EXCHANGE_GAIN คิดเป็น count เพื่อไม่ให้ใหญ่เกินในจังหวะเยอะหมาก)
    let oppLooseCount = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board.getPieceAt(r, c);
        if (
          !piece ||
          piece.type === PieceType.KING ||
          piece.side === aiSide
        ) {
          continue;
        }
        const isAttacked = myAttacks[r][c];
        const isProtected = enemyAttacks[r][c]; // ศัตรูป้องกัน (มองถึงจากเพื่อน)
        if (isAttacked && !isProtected) oppLooseCount++;
      }
    }

    return (
      -myLooseValue +
      oppLooseValue +
      oppLooseCount * this.EXCHANGE_GAIN_BONUS
    );
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
