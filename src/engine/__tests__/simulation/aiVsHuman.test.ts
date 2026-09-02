// src/engine/__tests__/simulation/aiVsHuman.test.ts
// ===========================================================================
//  AI vs Human Simulation — ทดสอบ AI กับ "มนุษย์" ที่เดินแปลกๆ
//  ----------------------------------------------------------------
//  จำลองสถานการณ์ที่มนุษย์เปิดเกมด้วยตาเดินที่ไม่อยู่ใน Opening Book
//  แล้วให้ AI ตอบสนองและเล่นจนจบเกม เพื่อดูว่า AI ฉลาดพอที่จะรับมือได้ไหม
// ===========================================================================
import { describe, it } from "vitest";
import { Board } from "../../../domain/Board";
import { Side } from "../../../domain/enums/Side";
import { GameState } from "../../../domain/models/GameState";
import { Move } from "../../../domain/models/Move";
import { MinimaxEngine } from "../../Minimax";
import { getBookBestMove } from "../../openingBookService";

export interface GameResult {
  winner: Side | "DRAW";
  totalMoves: number;
  reason: string;
}

const envMaxMoves = Number(import.meta.env.VITE_SIM_MAX_MOVES || "100");
const envAiDepth = Number(import.meta.env.VITE_AI_DEPTH || "4");
const VERBOSE_MOVES = import.meta.env.VITE_VERBOSE_MOVES === "1";

// ✅ ใช้ TEST_TIMEOUT_MS ในทุก it() callback
const TEST_TIMEOUT_MS = 10 * 60_000; // 10 นาที

function setupWeirdOpening(
  weirdMoves: Array<{ from: [number, number]; to: [number, number] }>,
): Board {
  const board = new Board();
  board.setupDefaultBoard();

  for (const move of weirdMoves) {
    const legalMove = board
      .getLegalMovesForSide(Side.RED)
      .find(
        (m) =>
          m.from[0] === move.from[0] &&
          m.from[1] === move.from[1] &&
          m.to[0] === move.to[0] &&
          m.to[1] === move.to[1],
      );

    if (!legalMove) {
      throw new Error(`ตาเดิน ${move.from} -> ${move.to} ไม่ถูกกฎหมาย`);
    }

    board.makeMove(legalMove);

    // ให้ AI ดำตอบด้วย Book (ถ้ามี) หรือ Minimax
    const blackMove = getBookBestMove(board, Side.BLACK);
    if (blackMove) {
      board.makeMove(blackMove);
    } else {
      const engine = new MinimaxEngine();
      const aiMove = engine.findBestMove(board, Side.BLACK, envAiDepth);
      if (aiMove) {
        board.makeMove(aiMove);
      }
    }
  }

  return board;
}

function playToEnd(
  board: Board,
  startTurn: Side,
  maxMoves: number = envMaxMoves,
): GameResult {
  const engine = new MinimaxEngine();
  let currentTurn = startTurn;
  let moveCount = 0;
  const history: string[] = [];
  const moveHistory: Move[] = [];

  while (moveCount < maxMoves) {
    const state = board.getGameState(currentTurn, moveHistory);

    if (state !== GameState.IN_PROGRESS) {
      const winner =
        state === GameState.CHECKMATE
          ? currentTurn === Side.RED
            ? Side.BLACK
            : Side.RED
          : "DRAW";
      const reason =
        state === GameState.CHECKMATE
          ? "checkmate"
          : state === GameState.STALEMATE
            ? "stalemate"
            : state === GameState.DRAW
              ? "draw (repetition/insufficient material)"
              : "unknown";

      if (VERBOSE_MOVES) {
        console.log(
          `\n─── Game End: ${winner} wins (${moveCount} plies); ${reason} ───`,
        );
        console.log("Last 10 moves:");
        history.slice(-10).forEach((h) => console.log(`  ${h}`));
      }

      return { winner, totalMoves: moveCount, reason };
    }

    let move: Move | null = getBookBestMove(board, currentTurn);
    if (!move) {
      move = engine.findBestMove(board, currentTurn, envAiDepth);
    }

    if (!move) break;

    const notation = moveNotation(move, moveCount);
    history.push(notation);
    board.makeMove(move);
    moveHistory.push(move);
    moveCount++;
    currentTurn = currentTurn === Side.RED ? Side.BLACK : Side.RED;
  }

  if (VERBOSE_MOVES) {
    console.log(
      `\n─── Game End: DRAW (${moveCount} plies); maxMoves limit ───`,
    );
  }

  return { winner: "DRAW", totalMoves: moveCount, reason: "maxMoves limit" };
}

function moveNotation(move: Move, moveIndex: number): string {
  const side = move.piece.side === Side.RED ? "R" : "B";
  const p = String(move.piece.type).padEnd(5, " ");
  const capture = move.capturedPiece ? "x" : " ";
  const from = move.from.join("");
  const to = move.to.join("");
  return `${String(moveIndex + 1).padStart(4)} ${side} ${p} ${from}${capture}${to}`;
}

describe("AI vs Human — Weird Openings", () => {
  it(
    "Scenario 1: มนุษย์เปิดด้วยเบี้ย ข3-ข4 (ไม่อยู่ใน Book)",
    () => {
      const board = setupWeirdOpening([{ from: [5, 1], to: [4, 1] }]);
      const result = playToEnd(board, Side.BLACK);
      console.log(`\n📊 Scenario 1 (เบี้ย ข3-ข4):`);
      console.log(`   Winner: ${result.winner}`);
      console.log(`   Moves: ${result.totalMoves}`);
      console.log(`   Reason: ${result.reason}`);
    },
    TEST_TIMEOUT_MS, // ✅ เพิ่ม timeout
  );

  it(
    "Scenario 2: มนุษย์เปิดด้วยเบี้ย จ3-จ4 (ไม่อยู่ใน Book)",
    () => {
      const board = setupWeirdOpening([{ from: [5, 4], to: [4, 4] }]);
      const result = playToEnd(board, Side.BLACK);
      console.log(`\n📊 Scenario 2 (เบี้ย จ3-จ4):`);
      console.log(`   Winner: ${result.winner}`);
      console.log(`   Moves: ${result.totalMoves}`);
      console.log(`   Reason: ${result.reason}`);
    },
    TEST_TIMEOUT_MS, // ✅ เพิ่ม timeout
  );

  it(
    "Scenario 3: มนุษย์เปิดด้วยเบี้ย ก3-ก4 (ขอบกระดาน)",
    () => {
      const board = setupWeirdOpening([{ from: [5, 0], to: [4, 0] }]);
      const result = playToEnd(board, Side.BLACK);
      console.log(`\n📊 Scenario 3 (เบี้ย ก3-ก4):`);
      console.log(`   Winner: ${result.winner}`);
      console.log(`   Moves: ${result.totalMoves}`);
      console.log(`   Reason: ${result.reason}`);
    },
    TEST_TIMEOUT_MS, // ✅ เพิ่ม timeout
  );

  it(
    "Scenario 4: มนุษย์เปิดด้วยเบี้ย 2 ตัวติดกัน (ข3-ข4 + ค3-ค4)",
    () => {
      const board = setupWeirdOpening([
        { from: [5, 1], to: [4, 1] },
        { from: [5, 2], to: [4, 2] },
      ]);
      const result = playToEnd(board, Side.BLACK);
      console.log(`\n📊 Scenario 4 (เบี้ย 2 ตัวติดกัน):`);
      console.log(`   Winner: ${result.winner}`);
      console.log(`   Moves: ${result.totalMoves}`);
      console.log(`   Reason: ${result.reason}`);
    },
    TEST_TIMEOUT_MS, // ✅ เพิ่ม timeout
  );

  it(
    "Scenario 5: มนุษย์เปิดด้วยม้า 2 ตัว",
    () => {
      const board = setupWeirdOpening([
        { from: [7, 1], to: [6, 3] },
        { from: [7, 6], to: [6, 4] },
      ]);
      const result = playToEnd(board, Side.BLACK);
      console.log(`\n📊 Scenario 5 (ม้า 2 ตัว):`);
      console.log(`   Winner: ${result.winner}`);
      console.log(`   Moves: ${result.totalMoves}`);
      console.log(`   Reason: ${result.reason}`);
    },
    TEST_TIMEOUT_MS, // ✅ เพิ่ม timeout
  );

  it(
    "Scenario 6: มนุษย์เปิดด้วยโคน (โคน ค2)",
    () => {
      const board = setupWeirdOpening([{ from: [7, 2], to: [6, 2] }]);
      const result = playToEnd(board, Side.BLACK);
      console.log(`\n📊 Scenario 6 (โคน ค2):`);
      console.log(`   Winner: ${result.winner}`);
      console.log(`   Moves: ${result.totalMoves}`);
      console.log(`   Reason: ${result.reason}`);
    },
    TEST_TIMEOUT_MS, // ✅ เพิ่ม timeout
  );

  it(
    "Scenario 7: มนุษย์เปิดด้วยเม็ด (เม็ด ฉ2)",
    () => {
      const board = setupWeirdOpening([{ from: [7, 3], to: [6, 4] }]);
      const result = playToEnd(board, Side.BLACK);
      console.log(`\n📊 Scenario 7 (เม็ด ฉ2):`);
      console.log(`   Winner: ${result.winner}`);
      console.log(`   Moves: ${result.totalMoves}`);
      console.log(`   Reason: ${result.reason}`);
    },
    TEST_TIMEOUT_MS, // ✅ เพิ่ม timeout
  );
});