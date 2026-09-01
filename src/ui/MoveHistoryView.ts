// src/ui/MoveHistoryView.ts
import { Move } from "../domain/models/Move";

export class MoveHistoryView {
  private container: HTMLElement;

  constructor(elementId: string) {
    const el = document.getElementById(elementId);
    if (!el) throw new Error(`Element #${elementId} not found`);
    this.container = el;
  }

  public addMove(move: Move, step: number): void {
    const li = document.createElement("li");
    const sideName = move.piece.side === "RED" ? "แดง" : "ดำ";
    const captureText = move.capturedPiece
      ? ` (กิน ${move.capturedPiece.type})`
      : "";

    li.textContent = `${step}. ${sideName}: ${move.piece.type} [${move.from[0]},${move.from[1]}] -> [${move.to[0]},${move.to[1]}]${captureText}`;
    this.container.appendChild(li);
    this.container.scrollTop = this.container.scrollHeight;
  }
}
