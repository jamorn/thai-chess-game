// src/ui/BoardView.ts
import { Board } from "../domain/Board";
import { Side } from "../domain/enums/Side";
import { Move } from "../domain/models/Move";
import { Position } from "../domain/models/Position";
import { TrashTalker } from "./TrashTalker";

// Import ภาพหมาก (ชุดเดียว สีดำ) จาก src/assets
import biaImg from "../assets/Bia.webp";
import khonImg from "../assets/Khon.webp";
import khunImg from "../assets/Khun.webp";
import maImg from "../assets/Ma.webp";
import metImg from "../assets/Met.webp";
import rueaImg from "../assets/Ruea.webp";

const PIECE_IMAGE_MAP: Record<string, string> = {
  PAWN: biaImg,
  KHON: khonImg,
  KING: khunImg,
  HORSE: maImg,
  MET: metImg,
  ROOK: rueaImg,
};

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
          const img = document.createElement("img");
          img.src = PIECE_IMAGE_MAP[piece.type] || "";
          img.alt = this.getSymbol(piece.type);
          img.classList.add("piece-img");
          // ขนาดภาพควบคุมด้วย CSS (responsive) ไม่กำหนด fix ที่นี่
          // ใช้ภาพสีดำชุดเดียว: ฝั่ง RED ย้อมเป็นแดงเข้ม + ขอบดำ เพื่อตัออกจาก cell
          if (piece.side === Side.RED) {
            img.style.filter =
              "invert(1) sepia(1) saturate(8) hue-rotate(-5deg) brightness(0.8) contrast(1.6) drop-shadow(1px 1px 0 rgba(0,0,0,0.9)) drop-shadow(-1px -1px 0 rgba(0,0,0,0.9))";
          } else {
            // ฝั่ง BLACK: เพิ่ม drop-shadow สีขาวเพื่อแยกจากพื้นหลังกระดาน
            img.style.filter = "drop-shadow(0 0 1px rgba(255,255,255,0.6))";
          }
          pieceEl.appendChild(img);
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
