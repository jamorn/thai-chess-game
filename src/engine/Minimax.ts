// src/engine/Minimax.ts
import { Board } from "../domain/Board";
import { Side } from "../domain/enums/Side";
import { Move } from "../domain/models/Move";
import { Evaluator } from "./Evaluator";
import { DEFAULT_SEARCH_DEPTH, DRAW_SCORE, MATE_SCORE } from "./engineConfig";

export class MinimaxEngine {
  public findBestMove(
    board: Board,
    aiSide: Side,
    maxDepth: number = DEFAULT_SEARCH_DEPTH,
  ): Move | null {
    let bestMove: Move | null = null;

    for (let depth = 1; depth <= maxDepth; depth++) {
      const result = this.minimax(
        board,
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

  private minimax(
    board: Board,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    aiSide: Side,
  ): { score: number; move: Move | null } {
    if (depth === 0) {
      return { score: Evaluator.evaluate(board, aiSide), move: null };
    }

    const currentSide = isMaximizing
      ? aiSide
      : aiSide === Side.RED
        ? Side.BLACK
        : Side.RED;
    const moves = board.getLegalMovesForSide(currentSide);

    // ไม่มีหมากเดินถูกกฎหมาย = แพ้ (ถูกโคนจนเข้าตาจน) หรือ เสมอ (stale)
    if (moves.length === 0) {
      if (board.isKingInCheck(currentSide)) {
        // ฝั่งที่เดินไม่ได้และถูกกาจจะแพ้: ถ้าเป็นฝั่ง Maximizer ต้องได้คะแนนต่ำสุด
        return { score: isMaximizing ? -MATE_SCORE : MATE_SCORE, move: null };
      }
      return { score: DRAW_SCORE, move: null };
    }

    moves.sort((a, b) => Evaluator.scoreMove(b) - Evaluator.scoreMove(a));
    let bestMove: Move | null = moves[0];

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        board.makeMove(move);
        const evalScore = this.minimax(
          board,
          depth - 1,
          alpha,
          beta,
          false,
          aiSide,
        ).score;
        board.undoMove(move);

        if (evalScore > maxEval) {
          maxEval = evalScore;
          bestMove = move;
        }

        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break;
      }
      return { score: maxEval, move: bestMove };
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        board.makeMove(move);
        const evalScore = this.minimax(
          board,
          depth - 1,
          alpha,
          beta,
          true,
          aiSide,
        ).score;
        board.undoMove(move);

        if (evalScore < minEval) {
          minEval = evalScore;
          bestMove = move;
        }

        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break;
      }
      return { score: minEval, move: bestMove };
    }
  }
}
