// src/engine/Minimax.ts
import { Board } from "../domain/Board";
import { Side } from "../domain/enums/Side";
import { Move } from "../domain/models/Move";
import { PieceType } from "../domain/enums/PieceType";
import { Evaluator } from "./Evaluator";
import { DEFAULT_SEARCH_DEPTH, DRAW_SCORE, MATE_SCORE } from "./engineConfig";

/**
 * สุดความลึกของ Quiescence Search (จำกัดเส้นสาย capture ต่อเนื่อง)
 * เพื่อกันไม่ให้ QS วิ่งลึกเกินไปจนกินเวลา (ไม่มีวันจบ)
 */
const QS_EXTENSION_LIMIT = 3;

/** Margin ส่วนต่ำสำหรับ Delta Pruning (กันตัดผิดกรณี eval ใกล้กัน) */
const DELTA_MARGIN = 200;

/** ขนาดสูงสุดของ Transposition Table (จำนวน entry) จำกัด memory */
const TT_SIZE = 1 << 20; // ~1M entries

/** จำนวน killer moves ต่อ depth */
const KILLER_SLOTS = 2;

type TTFlag = "exact" | "lower" | "upper";

interface TTEntry {
  depth: number;
  score: number;
  flag: TTFlag;
  move: Move | null;
}

/* ----------------------------- Zobrist Hashing ----------------------------- */
// Deterministic PRNG (mulberry32) เพื่อสร้าง random แบบ reproducible ในทุก run
function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let z = state;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return (z ^ (z >>> 14)) >>> 0;
  };
}

function buildZobristTable(): {
  piece: number[][]; // [64 squares][12 = side*6+typeIndex]
  sideToMove: number;
} {
  const rng = createSeededRng(0x1234abcd);
  const piece = Array.from({ length: 64 }, () =>
    Array.from({ length: 12 }, () => rng()),
  );
  const sideToMove = rng();
  return { piece, sideToMove };
}

/** แปลง piece เป็น index 0..11 (side*6 + typeCode) สำหรับ hash */
function pieceIndex(side: Side, type: PieceType): number {
  const typeCode: Record<PieceType, number> = {
    [PieceType.KING]: 0,
    [PieceType.ROOK]: 1,
    [PieceType.HORSE]: 2,
    [PieceType.KHON]: 3,
    [PieceType.MET]: 4,
    [PieceType.PAWN]: 5,
  };
  const base = side === Side.RED ? 0 : 6;
  return base + typeCode[type];
}

/* --------------------------- Transposition Table --------------------------- */
class TranspositionTable {
  private table = new Map<number, TTEntry>();

  public probe(hash: number, depth: number, alpha: number, beta: number) {
    const entry = this.table.get(hash);
    if (!entry || entry.depth < depth) return null;

    if (entry.flag === "exact") return entry.score;
    if (entry.flag === "lower" && entry.score >= beta) return entry.score;
    if (entry.flag === "upper" && entry.score <= alpha) return entry.score;
    return null;
  }

  public store(
    hash: number,
    depth: number,
    score: number,
    flag: TTFlag,
    move: Move | null,
  ): void {
    if (this.table.size >= TT_SIZE) this.table.clear(); // ป้องกันความจำไม่อั้น (simple)
    // เก็บบันทึก depth ที่ลึกกว่า (ไม่ overwrite ของเดิมที่ลึกกว่า)
    const existing = this.table.get(hash);
    if (existing && existing.depth > depth) return;
    this.table.set(hash, { depth, score, flag, move });
  }

  /** คืน move ที่เซฟไว้กับ hash นี้ (ใช้บอก best move เมื่อ probe hit) */
  public getStoredMove(hash: number): Move | null {
    return this.table.get(hash)?.move ?? null;
  }

  public clear(): void {
    this.table.clear();
  }
}

/* ================================= Engine ================================= */
export class MinimaxEngine {
  private tt = new TranspositionTable();
  private zobrist = buildZobristTable();
  private killerMoves: (Move | null)[][] = [];

  public findBestMove(
    board: Board,
    aiSide: Side,
    maxDepth: number = DEFAULT_SEARCH_DEPTH,
  ): Move | null {
    this.tt = new TranspositionTable();
    this.killerMoves = Array.from(
      { length: maxDepth + QS_EXTENSION_LIMIT + 2 },
      () => Array(KILLER_SLOTS).fill(null),
    );

    // คำนวณ Zobrist hash เริ่มต้นจากบอร์ดปัจจุบัน
    let hash = this.hashBoard(board, aiSide);

    let bestMove: Move | null = null;

    for (let depth = 1; depth <= maxDepth; depth++) {
      const result = this.minimax(
        board,
        hash,
        depth,
        -Infinity,
        Infinity,
        true,
        aiSide,
      );
      if (result.move) {
        bestMove = result.move;
      }
    }

    return bestMove;
  }

  /** สร้าง hash เริ่มต้นจาก board (เฉพาะตอน root; ตอนลึกใช้ incremental) */
  private hashBoard(board: Board, sideToMove: Side): number {
    let hash = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board.getPieceAt(r, c);
        if (piece) {
          hash ^=
            this.zobrist.piece[r * 8 + c][pieceIndex(piece.side, piece.type)];
        }
      }
    }
    if (sideToMove === Side.BLACK) hash ^= this.zobrist.sideToMove;
    return hash;
  }

  /**
   * อัปเดต hash แบบ incremental หลัง makeMove (และ undoMove ใช้ค่าเดียวกัน
   * เพราะ XOR เป็น self-inverse -> ใส่กลับก็ลบด้วยค่าเดิม)
   */
  private applyHashMove(hash: number, move: Move): number {
    let h = hash;
    const fromIdx = move.from[0] * 8 + move.from[1];
    const toIdx = move.to[0] * 8 + move.to[1];

    // ลบหมากที่ย้ายออกจากช่องเดิม (หรือใส่กลับถ้า undo)
    h ^=
      this.zobrist.piece[fromIdx][pieceIndex(move.piece.side, move.piece.type)];

    // capture: ลบหมากที่ถูกกินจากช่องปลาย (หรือใส่กลับถ้า undo)
    if (move.capturedPiece) {
      h ^=
        this.zobrist.piece[toIdx][
          pieceIndex(move.capturedPiece.side, move.capturedPiece.type)
        ];
    }

    const placedType = move.isPromotion ? PieceType.MET : move.piece.type;
    h ^= this.zobrist.piece[toIdx][pieceIndex(move.piece.side, placedType)];

    // flip side-to-move ทุกครั้ง (undo ก็ flip กลับเท่ากัน)
    h ^= this.zobrist.sideToMove;

    return h;
  }

  private minimax(
    board: Board,
    hash: number,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    aiSide: Side,
  ): { score: number; move: Move | null } {
    // TT probe
    const ttResult = this.tt.probe(hash, depth, alpha, beta);
    if (ttResult !== null) {
      return { score: ttResult, move: this.ttEntryMove(hash) };
    }

    if (depth === 0) {
      // ถึงสุดความลึก -> ขยายสาย capture ต่อด้วย Quiescence Search
      return {
        score: this.quiescence(board, alpha, beta, isMaximizing, aiSide),
        move: null,
      };
    }

    const currentSide = this.currentSide(isMaximizing, aiSide);
    const moves = board.getLegalMovesForSide(currentSide);

    // ไม่มีหมากเดินถูกกฎหมาย = แพ้ (ถูกโคนจนเข้าตาจน) หรือ เสมอ (stale)
    if (moves.length === 0) {
      if (board.isKingInCheck(currentSide)) {
        return { score: isMaximizing ? -MATE_SCORE : MATE_SCORE, move: null };
      }
      return { score: DRAW_SCORE, move: null };
    }

    // Sort: capture (MVV-LVA) ก่อน ตามด้วย killer moves แล้วค่อย quiet
    const killerMoves = this.killerMoves[depth] ?? [];
    const scored = moves
      .map((m) => ({
        move: m,
        score: this.orderScore(m, killerMoves),
      }))
      .sort((a, b) => b.score - a.score);

    let bestMove: Move | null = scored[0]?.move ?? null;
    let bestScore = isMaximizing ? -Infinity : Infinity;
    let flag: TTFlag = isMaximizing ? "upper" : "lower";

    for (const { move } of scored) {
      board.makeMove(move);
      const nextHash = this.applyHashMove(hash, move);
      const evalScore = this.minimax(
        board,
        nextHash,
        depth - 1,
        alpha,
        beta,
        !isMaximizing,
        aiSide,
      ).score;
      board.undoMove(move);

      if (isMaximizing) {
        if (evalScore > bestScore) {
          bestScore = evalScore;
          bestMove = move;
        }
        if (evalScore > alpha) alpha = evalScore;
        if (alpha >= beta) {
          flag = "lower"; // fail-high -> บันทึกเป็น lower bound ที่ root-ish
          this.storeKiller(move, depth, false);
          break;
        }
      } else {
        if (evalScore < bestScore) {
          bestScore = evalScore;
          bestMove = move;
        }
        if (evalScore < beta) beta = evalScore;
        if (beta <= alpha) {
          flag = "upper"; // fail-low ที่ minimizing == upper bound ฝั่งบน
          this.storeKiller(move, depth, true);
          break;
        }
      }
    }

    if (bestScore >= beta) {
      flag = "lower";
    } else if (bestScore <= alpha) {
      flag = "upper";
    } else {
      flag = "exact";
    }

    this.tt.store(hash, depth, bestScore, flag, bestMove);

    return { score: bestScore, move: bestMove };
  }

  /** จัดลำดับตาเดิน: capture (MVV-LVA) > killer > quiet */
  private orderScore(move: Move, killerMoves: (Move | null)[]): number {
    let score = 0;
    if (move.capturedPiece) {
      // MVV-LVA
      score =
        1_000_000 +
        10 * Evaluator.getPieceValue(move.capturedPiece.type) -
        Evaluator.getPieceValue(move.piece.type);
    } else if (killerMoves.some((k) => k && k.equals(move))) {
      score = 900_000; // quiet ที่เคยทำให้เกิด cutoff -> พิจารณาก่อน quiet อื่นเยอะ
    }
    // quiet ปกติได้ score 0
    return score;
  }

  /** บันทึก killer move (เฉพาะ quiet move ที่ทำให้ beta cutoff) */
  private storeKiller(move: Move, depth: number, isMinimizing: boolean): void {
    if (move.capturedPiece) return; // ไม่ใช่ quiet
    const row = this.killerMoves[depth] ?? [];
    if (!row.some((k) => k && k.equals(move))) {
      row.unshift(move);
      row.length = KILLER_SLOTS;
      this.killerMoves[depth] = row;
      void isMinimizing;
    }
  }

  private ttEntryMove(hash: number): Move | null {
    return this.tt.getStoredMove(hash);
  }

  /**
   * Quiescence Search (QS)
   * ------------------------
   * ปกติ minimax หยุดที่ leaf แล้วประเมินทันที จึงพลาดสาย "สลับกิน/โปรโมต" ต่อเนื่อง
   * QS ขยายเฉพาะ capture (+ promotion) ต่อในแนวเดียว เพื่อประเมินตำแหน่ง "นิ่ง" (quiet)
   * มองถึงปลายสายป้องกัน horizon effect (เห็นว่าหมากกำลังจะเสียโดยไม่รู้ตัว)
   *
   * เทคนิค:
   * - Standing Pat: ที่ node ก่อนขยาย ให้ static eval ก่อน ถ้า "นิ่งเฉย" ตรงกับ
   *   alpha/beta แล้วก็ยอมรับได้ทันที -> ไม่ต้องขยายต่อ
   * - Delta Pruning: เห็นว่าสาย capture นี้ ต่อให้ได้หมากมีค่าสูงสุดจากบนบอร์ด
   *   ก็ยังสู้ bound (alpha/beta) ไม่ได้ -> ตัดกิ่งไม่วนลึก
   */
  private quiescence(
    board: Board,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    aiSide: Side,
    ply: number = 0,
  ): number {
    const side = this.currentSide(isMaximizing, aiSide);
    // ที่ ply 0 (leaf ของ main search) ใช้ full evaluation มี mobility/pawn structure
    // ที่ recursion ลึกลงไป (สาย capture ต่อ) ใช้ evaluateStatic แบบเบาเพื่อเร็ว
    const staticEval =
      ply === 0
        ? Evaluator.evaluate(board, aiSide)
        : Evaluator.evaluateStatic(board, aiSide);

    // Standing Pat
    if (isMaximizing) {
      if (staticEval >= beta) return beta;
      alpha = Math.max(alpha, staticEval);
    } else {
      if (staticEval <= alpha) return alpha;
      beta = Math.min(beta, staticEval);
    }

    if (ply >= QS_EXTENSION_LIMIT) return staticEval;

    // สำรวจเฉพาะ capture (+ promotion) ไม่ขยาย quiet moves
    const captures = board
      .getLegalMovesForSide(side)
      .filter((m) => m.capturedPiece !== undefined || m.isPromotion);

    let bestValue = staticEval;

    if (isMaximizing) {
      for (const move of captures) {
        // Delta Pruning (maximizing): static + ค่ากินได้สูงสุดก็ยังสู้ alpha ไม่ได้
        if (
          move.capturedPiece &&
          staticEval +
            Evaluator.getMaxCapturableValue(board, side) +
            DELTA_MARGIN <=
            alpha
        ) {
          continue;
        }

        board.makeMove(move);
        const score = this.quiescence(
          board,
          alpha,
          beta,
          false,
          aiSide,
          ply + 1,
        );
        board.undoMove(move);

        if (score > bestValue) bestValue = score;
        if (score > alpha) alpha = score;
        if (beta <= alpha) break;
      }
    } else {
      for (const move of captures) {
        // Delta Pruning (minimizing): static - ค่าเสียสูงสุดยังสู้ beta ไม่ได้
        if (
          move.capturedPiece &&
          staticEval -
            Evaluator.getMaxCapturableValue(board, side) -
            DELTA_MARGIN >=
            beta
        ) {
          continue;
        }

        board.makeMove(move);
        const score = this.quiescence(
          board,
          alpha,
          beta,
          true,
          aiSide,
          ply + 1,
        );
        board.undoMove(move);

        if (score < bestValue) bestValue = score;
        if (score < beta) beta = score;
        if (beta <= alpha) break;
      }
    }

    return bestValue;
  }

  /** กำหนดว่าฝั่งที่ถึงตาเดินกับฝั่ง Maximizer หรือ Vice versa */
  private currentSide(isMaximizing: boolean, aiSide: Side): Side {
    return isMaximizing ? aiSide : aiSide === Side.RED ? Side.BLACK : Side.RED;
  }
}
