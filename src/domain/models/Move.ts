// src/domain/models/Move.ts
import { Position } from "./Position";
import { Piece } from "./pieces/Piece";

export class Move {
  constructor(
    public readonly from: Position,
    public readonly to: Position,
    public readonly piece: Piece,
    public readonly capturedPiece: Piece | null = null,
    public readonly isPromotion: boolean = false,
  ) {}

  public equals(other: Move): boolean {
    return (
      this.from[0] === other.from[0] &&
      this.from[1] === other.from[1] &&
      this.to[0] === other.to[0] &&
      this.to[1] === other.to[1]
    );
  }
}
