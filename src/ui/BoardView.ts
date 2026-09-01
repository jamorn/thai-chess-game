// src/ui/BoardView.ts
import { Board } from "../domain/Board";
import { Side } from "../domain/enums/Side";
import { Move } from "../domain/models/Move";
import { Position } from "../domain/models/Position";
import { TrashTalker } from "./TrashTalker";

export class BoardView {
  private container: HTMLElement;
  private selectedPos: Position | null = null;
  private onMoveCallback: ((move: Move) => void) | null = null;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Element #${containerId} not found`);
    this.container = el;
  }

  public setOnMove(callback: (move: Move) => void): void {
    this.onMoveCallback = callback;
  }

  public render(board: Board, currentTurn: Side): void {
    this.container.innerHTML = "";
    const table = document.createElement("table");
    table.className = "chess-board-win95";

    for (let r = 0; r < 8; r++) {
      const tr = document.createElement("tr");
      for (let c = 0; c < 8; c++) {
        const td = document.createElement("td");
        td.className = (r + c) % 2 === 0 ? "cell-light" : "cell-dark";

        const piece = board.getPieceAt(r, c);
        if (piece) {
          const pieceEl = document.createElement("div");
          pieceEl.className = `piece-${piece.side.toLowerCase()}`;
          pieceEl.textContent = this.getSymbol(piece.type);
          td.appendChild(pieceEl);
        }

        if (
          this.selectedPos &&
          this.selectedPos[0] === r &&
          this.selectedPos[1] === c
        ) {
          td.classList.add("selected");
        }

        td.addEventListener("click", () =>
          this.handleClick(r, c, board, currentTurn),
        );
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }

    this.container.appendChild(table);
  }

  private handleClick(
    r: number,
    c: number,
    board: Board,
    currentTurn: Side,
  ): void {
    const clickedPiece = board.getPieceAt(r, c);

    if (clickedPiece && clickedPiece.side === currentTurn) {
      this.selectedPos = [r, c];
      this.render(board, currentTurn);
      return;
    }

    if (this.selectedPos) {
      const legalMoves = board.getLegalMovesForSide(currentTurn);
      const targetMove = legalMoves.find(
        (m) =>
          m.from[0] === this.selectedPos![0] &&
          m.from[1] === this.selectedPos![1] &&
          m.to[0] === r &&
          m.to[1] === c,
      );

      if (targetMove && this.onMoveCallback) {
        this.selectedPos = null;
        this.onMoveCallback(targetMove);
      } else {
        TrashTalker.showStatus("status-bar", TrashTalker.getRandomPhrase());
        this.selectedPos = null;
        this.render(board, currentTurn);
      }
    }
  }

  private getSymbol(type: string): string {
    const map: Record<string, string> = {
      KING: "ขุน",
      ROOK: "เรือ",
      HORSE: "ม้า",
      KHON: "โคน",
      MET: "เม็ด",
      PAWN: "เบี้ย",
    };
    return map[type] || "";
  }
}
