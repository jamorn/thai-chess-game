// src/main.ts
import { Board } from "./domain/Board";
import { Side } from "./domain/enums/Side";
import { Move } from "./domain/models/Move";
import { GameState } from "./domain/models/GameState";
import { AiEngine, BestMoveData } from "./engine/AiEngine";
import { DEFAULT_SEARCH_DEPTH } from "./engine/engineConfig";
import { BoardView } from "./ui/BoardView";
import { MoveHistoryView } from "./ui/MoveHistoryView";
import { TrashTalker } from "./ui/TrashTalker";

class ThaiChessApp {
  private board: Board;
  private boardView: BoardView;
  private historyView: MoveHistoryView;
  private aiEngine: AiEngine;
  private currentTurn: Side = Side.RED;
  private history: Move[] = [];

  constructor() {
    this.board = new Board();
    this.board.setupDefaultBoard();
    this.boardView = new BoardView("board-container");
    this.historyView = new MoveHistoryView("history-list");
    this.aiEngine = new AiEngine((bestMoveData) => {
      this.handleAiBestMove(bestMoveData);
    });
    this.init();
  }

  private init(): void {
    this.boardView.setOnMove((move) => this.handlePlayerMove(move));
    this.boardView.render(this.board, this.currentTurn);
  }

  private handlePlayerMove(move: Move): void {
    if (this.currentTurn !== Side.RED) return;
    if (this.isGameOver()) return;

    this.executeMove(move);

    const nextSide = move.piece.side === Side.RED ? Side.BLACK : Side.RED;
    if (this.currentTurn === nextSide && !this.isGameOver()) {
      TrashTalker.showStatus("status-bar", "AI กำลังคิด...");
      this.aiEngine.requestMove(this.board, nextSide, DEFAULT_SEARCH_DEPTH);
    }
  }

  private isGameOver(): boolean {
    // ✅ แก้ไข: ส่ง history เข้าไปตรวจ repetition
    return (
      this.board.getGameState(this.currentTurn, this.history) !==
      GameState.IN_PROGRESS
    );
  }

  private handleAiBestMove(bestMoveData: BestMoveData | null): void {
    if (!bestMoveData) return;
    const moves = this.board.getLegalMovesForSide(Side.BLACK);
    const selected = moves.find(
      (m) =>
        m.from[0] === bestMoveData.from[0] &&
        m.from[1] === bestMoveData.from[1] &&
        m.to[0] === bestMoveData.to[0] &&
        m.to[1] === bestMoveData.to[1],
    );
    if (selected && this.currentTurn === Side.BLACK) {
      this.executeMove(selected);
    }
  }

  private executeMove(move: Move): void {
    this.board.makeMove(move);
    this.history.push(move);
    this.historyView.addMove(move, this.history.length);

    this.currentTurn = this.currentTurn === Side.RED ? Side.BLACK : Side.RED;
    this.boardView.render(this.board, this.currentTurn);

    // ✅ แก้ไข: ส่ง history เข้าไปตรวจ repetition
    const state = this.board.getGameState(this.currentTurn, this.history);

    if (state === GameState.CHECKMATE) {
      const winner = this.currentTurn === Side.RED ? "ดำ" : "แดง";
      TrashTalker.showStatus("status-bar", `รุกจน! ${winner} ชนะ`);
    } else if (state === GameState.STALEMATE) {
      TrashTalker.showStatus("status-bar", "เสมอ (เดินไม่ได้)");
    } else if (state === GameState.DRAW) {
      TrashTalker.showStatus("status-bar", "เสมอ (หมากไม่พอ หรือ เดินซ้ำ)");
    } else if (this.board.isKingInCheck(this.currentTurn)) {
      TrashTalker.showStatus("status-bar", "รุก!");
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new ThaiChessApp();
});
