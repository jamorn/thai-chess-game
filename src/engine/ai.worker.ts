// src/engine/ai.worker.ts
import { Board } from "../domain/Board";
import { Side } from "../domain/enums/Side";
import { MinimaxEngine } from "./Minimax";
import { getBookBestMove } from "./openingBookService";
import { BestMoveData } from "./AiEngine";
import { SerializedBoard } from "../domain/types";

interface WorkerRequest {
  boardData: SerializedBoard;
  aiSide: Side;
  depth: number;
}

interface WorkerResponse {
  bestMove: BestMoveData | null;
}

const minimax = new MinimaxEngine();

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { boardData, aiSide, depth } = e.data;
  const board = Board.deserialize(boardData);

  // 1) ตรวจ Opening Book ก่อน (ตอบ ~0ms, weighted random) — ถ้าใช่ใช้เลย
  const bookMove = getBookBestMove(board, aiSide);

  // 2) ถ้าไม่มีใน Book (หรือเกินช่วงเปิด) -> ใช้ Minimax ตามปกติ
  const bestMove = bookMove ?? minimax.findBestMove(board, aiSide, depth);

  const response: WorkerResponse = bestMove
    ? { bestMove: { from: bestMove.from, to: bestMove.to } }
    : { bestMove: null };

  self.postMessage(response);
};
