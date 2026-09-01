// src/domain/models/pieces/Piece.ts
import { Side } from "../../enums/Side";
import { PieceType } from "../../enums/PieceType";
import { Position } from "../Position";
import { Board } from "../../Board";
import { PALACE_COLS, PALACE_ROWS } from "../../constants";

export abstract class Piece {
  constructor(
    public readonly side: Side,
    public readonly type: PieceType,
  ) {}

  public abstract getPossibleMoves(
    position: Position,
    board: Board,
  ): Position[];

  public abstract clone(): Piece;

  protected isWithinBoard(row: number, col: number): boolean {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }

  /** เช็คว่าช่อง (row, col) อยู่ในพระราชฐานของฝั่งนี้หรือไม่ */
  protected isWithinPalace(row: number, col: number): boolean {
    const rows = PALACE_ROWS[this.side];
    return (
      row >= rows.min &&
      row <= rows.max &&
      col >= PALACE_COLS.min &&
      col <= PALACE_COLS.max
    );
  }
}
