// src/domain/Board.ts
import { Piece } from "./models/pieces/Piece";
import { Side } from "./enums/Side";
import { PieceType } from "./enums/PieceType";
import { Move } from "./models/Move";
import { Position } from "./models/Position";
import { King } from "./models/pieces/King";
import { Rook } from "./models/pieces/Rook";
import { Horse } from "./models/pieces/Horse";
import { Khon } from "./models/pieces/Khon";
import { Met } from "./models/pieces/Met";
import { Pawn } from "./models/pieces/Pawn";
import { BOARD_SIZE, PROMOTION_ROW } from "./constants";
import { SerializedBoard, SerializedPiece } from "./types";
import { GameState } from "./models/GameState";

export class Board {
  private grid: (Piece | null)[][];

  constructor() {
    this.grid = Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(null));
  }

  public getPieceAt(row: number, col: number): Piece | null {
    return this.grid[row][col];
  }

  public setPieceAt(row: number, col: number, piece: Piece | null): void {
    this.grid[row][col] = piece;
  }

  public setupDefaultBoard(): void {
    // เรือ -> ม้า -> โคน -> ขุน -> เม็ด -> โคน -> ม้า -> เรือ
    // (จากซ้าย: col3 ขุน(King), col4 เม็ด(Met)) — ทั้ง 2 ฝั่ง
    this.grid[0][0] = new Rook(Side.BLACK);
    this.grid[0][1] = new Horse(Side.BLACK);
    this.grid[0][2] = new Khon(Side.BLACK);
    this.grid[0][3] = new King(Side.BLACK);
    this.grid[0][4] = new Met(Side.BLACK);
    this.grid[0][5] = new Khon(Side.BLACK);
    this.grid[0][6] = new Horse(Side.BLACK);
    this.grid[0][7] = new Rook(Side.BLACK);

    for (let col = 0; col < BOARD_SIZE; col++) {
      this.grid[2][col] = new Pawn(Side.BLACK);
      this.grid[5][col] = new Pawn(Side.RED);
    }

    // RED (row 7) mirror สมมาตรกับ BLACK (col3 ขุน / col4 เม็ด)
    this.grid[7][0] = new Rook(Side.RED);
    this.grid[7][1] = new Horse(Side.RED);
    this.grid[7][2] = new Khon(Side.RED);
    this.grid[7][3] = new King(Side.RED);
    this.grid[7][4] = new Met(Side.RED);
    this.grid[7][5] = new Khon(Side.RED);
    this.grid[7][6] = new Horse(Side.RED);
    this.grid[7][7] = new Rook(Side.RED);
  }

  /** เช็คว่าช่องปลายทางเป็นแถวโปรโมตสำหรับเบี้ยของฝั่งนั้นหรือไม่ */
  private static isPromotionRank(side: Side, toRow: number): boolean {
    return side === Side.RED
      ? toRow <= PROMOTION_ROW[Side.RED]
      : toRow >= PROMOTION_ROW[Side.BLACK];
  }

  public makeMove(move: Move): void {
    const [fromR, fromC] = move.from;
    const [toR, toC] = move.to;

    // เบี้ยที่เดินถึงแถวโปรโมตจะกลายเป็นเม็ด
    let pieceToPlace = move.piece;
    if (
      move.piece.type === PieceType.PAWN &&
      Board.isPromotionRank(move.piece.side, toR)
    ) {
      pieceToPlace = new Met(move.piece.side);
    }

    this.grid[toR][toC] = pieceToPlace;
    this.grid[fromR][fromC] = null;
  }

  public undoMove(move: Move): void {
    const [fromR, fromC] = move.from;
    const [toR, toC] = move.to;

    this.grid[fromR][fromC] = move.piece;
    this.grid[toR][toC] = move.capturedPiece;
  }

  public getLegalMovesForSide(side: Side): Move[] {
    const legalMoves: Move[] = [];

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = this.grid[r][c];
        if (piece && piece.side === side) {
          const possiblePositions = piece.getPossibleMoves([r, c], this);
          for (const pos of possiblePositions) {
            const captured = this.grid[pos[0]][pos[1]];
            // ไม่สามารถกินขุนของฝั่งตรงข้ามได้ (ขุนจะถูกโคนจนแทน)
            if (captured && captured.type === PieceType.KING) continue;

            const isPromotion =
              piece.type === PieceType.PAWN &&
              Board.isPromotionRank(side, pos[0]);

            const move = new Move([r, c], pos, piece, captured, isPromotion);
            this.makeMove(move);
            if (!this.isKingInCheck(side)) {
              legalMoves.push(move);
            }
            this.undoMove(move);
          }
        }
      }
    }

    return legalMoves;
  }

  /**
   * นับจำนวน "Pseudo-Legal" moves ของฝั่งที่กำหนด (ค่า Mobility แบบหลวม ๆ)
   * การหา Legal Moves เต็มรูปแบบมี overhead สูงเพราะต้องเรียก makeMove + isKingInCheck
   * ซึ่งต้องทำ Ray-casting + ตรวจ In-Check ซ้ำทุกช่อง ทุก leaf node ของ search tree
   * ในทางปฏิบัติค่าจำนวนช่องที่หมาก "แตะถึงได้" (ไม่ข้ามหมาก แต่ไม่ตรวจว่าขุนจะโดนรุก)
   * ก็เพียงพอจะใช้ประเมิน "การควบคุมพื้นที่/โอกาส" (Space Advantage/Mobility) แล้ว
   * และลด overhead ลงได้มาก เพราะไม่ต้อง make/undo + isKingInCheck ทุกครั้ง
   */
  public countPseudoLegalMovesForSide(side: Side): number {
    let count = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = this.grid[r][c];
        if (piece && piece.side === side) {
          const possiblePositions = piece.getPossibleMoves([r, c], this);
          for (const pos of possiblePositions) {
            const captured = this.grid[pos[0]][pos[1]];
            // ไม่นับการ "กินขุน" (ขุนถูกโคนจนแทน มิใช่ถูกกินตรง ๆ)
            if (captured && captured.type === PieceType.KING) continue;
            count++;
          }
        }
      }
    }

    return count;
  }

  /**
   * ✅ ใหม่: ตรวจจับ Threefold Repetition (เดินซ้ำ 3 ครั้ง = เสมอ)
   * ตรวจสอบว่าตำแหน่งปัจจุบันเกิดขึ้นอย่างน้อย 3 ครั้งใน history
   */
  public isThreefoldRepetition(history: Move[]): boolean {
    if (history.length < 6) return false; // ต้องมีอย่างน้อย 3 ตาของแต่ละฝั่ง

    // สร้าง fingerprint ของตำแหน่งปัจจุบัน
    const currentFingerprint = this.getPositionFingerprint();

    // นับจำนวนครั้งที่ตำแหน่งนี้เกิดขึ้นใน history
    let count = 0;
    const tempBoard = new Board();
    tempBoard.setupDefaultBoard();

    // ตรวจตำแหน่งเริ่มต้น
    if (tempBoard.getPositionFingerprint() === currentFingerprint) {
      count++;
    }

    // ตรวจทุกตำแหน่งใน history
    for (const move of history) {
      tempBoard.makeMove(move);
      if (tempBoard.getPositionFingerprint() === currentFingerprint) {
        count++;
        if (count >= 3) return true;
      }
    }

    return false;
  }

  /**
   * ✅ ใหม่: สร้าง fingerprint ของตำแหน่งกระดาน (สำหรับตรวจจับ repetition)
   * ใช้ string representation ของกระดาน
   */
  private getPositionFingerprint(): string {
    const parts: string[] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = this.grid[r][c];
        if (piece) {
          parts.push(`${r}${c}${piece.side[0]}${piece.type[0]}`);
        }
      }
    }
    return parts.sort().join("|");
  }

  /**
   * ✅ แก้ไข: เพิ่มการตรวจ repetition ใน getGameState
   */
  public getGameState(sideToMove: Side, history: Move[] = []): GameState {
    if (this.hasInsufficientMaterial()) return GameState.DRAW;

    // ✅ ใหม่: ตรวจ Threefold Repetition
    if (this.isThreefoldRepetition(history)) return GameState.DRAW;

    const hasAnyMove = this.getLegalMovesForSide(sideToMove).length > 0;
    if (hasAnyMove) return GameState.IN_PROGRESS;

    // ฝั่งที่ถึงตาเดินไม่มีหมากเดินถูกกฎหมาย
    return this.isKingInCheck(sideToMove)
      ? GameState.CHECKMATE // รุกจน -> แพ้
      : GameState.STALEMATE; // ไม่อยู่ในรุกแต่เดินไม่ได้ -> เสมอ
  }

  /** เช็คว่าเป็นถูกโคนจน (checkmate) สำหรับฝั่งที่กำหนดหรือไม่ */
  public isCheckmate(side: Side): boolean {
    return this.getGameState(side) === GameState.CHECKMATE;
  }

  /** เช็คว่าเป็นตำแหน่งเสมอแบบเดินไม่ได้ (stalemate) หรือไม่ */
  public isStalemate(side: Side): boolean {
    return this.getGameState(side) === GameState.STALEMATE;
  }

  /**
   * เช็คว่าหมากบนกระดานเหลือน้อยเกินกว่าจะโคนขุนได้ (insufficient material)
   * ในหมากรุกไทย การมีเพียงขุน/โคน/เม็ด (ที่เข้าไม่ถึงขุนฝั่งตรงข้าม) ฝ่ายเดียว
   * หรือเหลือหมากไม่พอที่จะรุกจน จะถือว่าเสมอโดยหลักการ
   */
  private hasInsufficientMaterial(): boolean {
    const pieces: Piece[] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = this.grid[r][c];
        if (piece) pieces.push(piece);
      }
    }

    // ยังมีหมากหนัก (เรือ/ม้า) หรือหมากทั้งสองฝั่งมากพอ ก็ยังเล่นต่อได้
    const hasHeavyPiece = pieces.some(
      (p) => p.type === PieceType.ROOK || p.type === PieceType.HORSE,
    );
    if (hasHeavyPiece) return false;

    // เหลือแต่ ขุน/โคน/เม็ด/เบี้ย เท่านั้น
    // ถ้ามีผู้เล่นฝั่งหนึ่งเป็นฝ่ายรุกแต่ฝั่งตรงข้ามพอเพียงป้องกัน ก็นับว่าเล่นได้
    const redCount = this.countPiecesForSide(Side.RED);
    const blackCount = this.countPiecesForSide(Side.BLACK);

    // ฝ่ายใดฝ่ายหนึ่งเหลือแต่ขุนเท่านั้น -> เสมอ (โคน/เม็ดเดียวไม่อาจรุกจนได้ตามหลัก)
    return redCount === 1 || blackCount === 1;
  }

  private countPiecesForSide(side: Side): number {
    let count = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = this.grid[r][c];
        if (piece && piece.side === side) count++;
      }
    }
    return count;
  }

  public isKingInCheck(side: Side): boolean {
    let kingPos = this.findKing(side);
    if (!kingPos) return false;

    const [kr, kc] = kingPos;
    const enemySide = side === Side.RED ? Side.BLACK : Side.RED;

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = this.grid[r][c];
        if (piece && piece.side === enemySide) {
          const targets = piece.getPossibleMoves([r, c], this);
          if (targets.some(([tr, tc]) => tr === kr && tc === kc)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /** หาตำแหน่งของขุน (King) ของฝั่งที่กำหนด ว่าไม่อยู่บนกระดานแล้วจะ return null */
  private findKing(side: Side): Position | null {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = this.grid[r][c];
        if (piece && piece.type === PieceType.KING && piece.side === side) {
          return [r, c];
        }
      }
    }
    return null;
  }

  public serialize(): SerializedBoard {
    return this.grid.map((row) =>
      row.map((piece): SerializedPiece | null =>
        piece ? { side: piece.side, type: piece.type } : null,
      ),
    );
  }

  public static deserialize(data: SerializedBoard): Board {
    const board = new Board();
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const item = data[r][c];
        if (item) {
          board.setPieceAt(r, c, Board.createPiece(item.side, item.type));
        }
      }
    }
    return board;
  }

  private static createPiece(side: Side, type: PieceType): Piece {
    switch (type) {
      case PieceType.KING:
        return new King(side);
      case PieceType.ROOK:
        return new Rook(side);
      case PieceType.HORSE:
        return new Horse(side);
      case PieceType.KHON:
        return new Khon(side);
      case PieceType.MET:
        return new Met(side);
      case PieceType.PAWN:
        return new Pawn(side);
    }
  }
}
