// src/engine/AiEngine.ts
import { Board } from "../domain/Board";
import { Side } from "../domain/enums/Side";
import { Position } from "../domain/models/Position";
import { DEFAULT_SEARCH_DEPTH } from "./engineConfig";

/** ผลลัพธ์ตำแหน่งหมากที่ดีที่สุดที่ Web Worker ตอบกลับมา (เฉพาะพิกัดเพื่อลด payload) */
export interface BestMoveData {
  from: Position;
  to: Position;
}

/** ข้อมูลที่ AiEngine ส่งให้ Web Worker */
interface MoveRequest {
  boardData: ReturnType<Board["serialize"]>;
  aiSide: Side;
  depth: number;
}

export class AiEngine {
  private worker: Worker;

  constructor(onBestMoveFound: (moveData: BestMoveData | null) => void) {
    this.worker = new Worker(new URL("./ai.worker.ts", import.meta.url), {
      type: "module",
    });

    this.worker.onmessage = (
      e: MessageEvent<{ bestMove: BestMoveData | null }>,
    ) => {
      onBestMoveFound(e.data.bestMove);
    };
  }

  public requestMove(
    board: Board,
    aiSide: Side,
    depth: number = DEFAULT_SEARCH_DEPTH,
  ): void {
    const payload: MoveRequest = {
      boardData: board.serialize(),
      aiSide,
      depth,
    };
    this.worker.postMessage(payload);
  }
}
