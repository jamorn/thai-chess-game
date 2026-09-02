// src/engine/__tests__/simulation/aiVsAi.test.ts
// ===========================================================================
//  AI vs AI Simulation — สรุปสถิติ Win/Draw/เวลา (เครื่องมือ tuning)
//  ----------------------------------------------------------------
//  ให้ AI ฝั่งแดง/ดำ สู้กันเองหลายเกม แล้วเก็บสถิติ Win rate ของแต่ละฝั่ง,
//  Draw rate, จำนวนตาเฉลี่ยต่อเกม, และเวลา.
//
//  - ใช้ Opening Book (weighted random) ช่วงเปิดเพื่อให้เกมหลากหลาย
//    (กัน deterministic ซ้ำกัน ตามคำแนะนำใน Docs/aiVsAi.md ข้อ 1)
//  - ใช้ Board.getGameState ตรวจจบเกม (Checkmate/Stalemate/Draw)
//  - กำหนด maxMoves เพื่อตัดจบเป็น Draw (กัน infinite loop ข้อ 2)
//  - Depth/จำนวนเกม ปรับได้ผ่าน env ของ Vite (default สำหรับการ tune หลักครูพงษ์):
//       VITE_SIM_DEPTH=3 VITE_SIM_GAMES=20  (default — เห็น win/loss จริง)
//       VITE_SIM_DEPTH=2 VITE_SIM_GAMES=10  (เครื่องช้า เร็ว แต่ draw เยอะ)
//       VITE_SIM_DEPTH=4 VITE_SIM_GAMES=60  (เครื่องแรง)
//
//  ⚠️ ไฟล์นี้เป็น unit-test แต่ "ไม่ assert ค่า" (เป็น benchmark/report tool)
//  รันแยกจาก `npm test` ผ่าน `npm run sim`
// ===========================================================================

import { describe, it } from "vitest";
import { Board } from "../../../domain/Board";
import { Side } from "../../../domain/enums/Side";
import { GameState } from "../../../domain/models/GameState";
import { MinimaxEngine } from "../../Minimax";
import { getBookBestMove } from "../../openingBookService";

export interface GameResult {
  winner: Side | "DRAW";
  totalMoves: number;
}

export interface SimulationSummary {
  totalGames: number;
  redWins: number;
  blackWins: number;
  draws: number;
  avgMoves: number;
  durationMs: number;
}

// อ่านค่าจาก import.meta.env (มาตรฐาน Vite/Vitest) เพื่อยืดหยุ่นกับเครื่องที่ช้า/เร็ว
// ค่า default (depth=3, เกม=20) ตั้งไว้สำหรับการ tune หลักครูพงษ์ (จะได้ win/loss จริง
// ไม่ใช่ draw หมดแบบ depth2) — เหมาะรันทิ้งบนเครื่องแรง (Mac 32GB) หรือเครื่อง 1CPU ระหว่าง 45 นาที
// ตัวอย่าง:
//   VITE_SIM_DEPTH=3 VITE_SIM_GAMES=20 npm run sim   (default)
//   VITE_SIM_DEPTH=4 VITE_SIM_GAMES=60  npm run sim   (เครื่องแรงมาก)
const envGames = Number(import.meta.env.VITE_SIM_GAMES || "20");
const envDepth = Number(import.meta.env.VITE_SIM_DEPTH || "3");
const envMaxMoves = Number(import.meta.env.VITE_SIM_MAX_MOVES || "100");

const MINIMAX_DEPTH = Number.isFinite(envDepth) ? envDepth : 3;

// Simulation ใช้เวลานานหลายนาทีขึ้นไป -> ครอบ test timeout ไว้ไกล (45 นาที)
const TEST_TIMEOUT_MS = 45 * 60_000;

/** รัน AI สู้กันเอง 1 เกม โดยพึ่ง Opening Book ช่วงเปิด แล้ว Minimax ต่อ */
export function runSingleGame(
  depth: number = MINIMAX_DEPTH,
  maxMoves = envMaxMoves,
): GameResult {
  const board = new Board();
  board.setupDefaultBoard();
  const engine = new MinimaxEngine();

  let currentTurn: Side = Side.RED;
  let moveCount = 0;

  while (moveCount < maxMoves) {
    // ตรวจจบเกมด้วย Board.getGameState (ครอบคลุม Checkmate/Stalemate/Draw)
    const state = board.getGameState(currentTurn);
    if (state !== GameState.IN_PROGRESS) {
      // ถ้าเป็น CHECKMATE -> ขุนที่ถึงตาแพ้ (อีกฝั่งชนะ), นอกนั้นเสมอ
      const winner =
        state === GameState.CHECKMATE
          ? currentTurn === Side.RED
            ? Side.BLACK
            : Side.RED
          : "DRAW";
      return { winner, totalMoves: moveCount };
    }

    let move: NonNullable<ReturnType<typeof getBookBestMove>> | null = null;

    // ช่วงเปิด (มีใน Book) -> ใช้ Weighted Random เพื่อความหลากหลาย
    const bookMove = getBookBestMove(board, currentTurn);
    if (bookMove) {
      move = bookMove;
    } else {
      const best = engine.findBestMove(board, currentTurn, depth);
      if (!best) break; // ไร้ตาเดิน -> จบเกม (จับเป็น draw ด้านล่าง)
      move = best;
    }

    board.makeMove(move);
    moveCount++;
    currentTurn = currentTurn === Side.RED ? Side.BLACK : Side.RED;
  }

  // เกิน maxMoves (หรือ AI คืน null) -> เสมอ
  return { winner: "DRAW", totalMoves: moveCount };
}

/** รัน simulation หลายเกม แล้วสรุปสถิติ */
export function runSimulation(
  totalGames = envGames,
  depth = MINIMAX_DEPTH,
  maxMoves = envMaxMoves,
): SimulationSummary {
  let redWins = 0;
  let blackWins = 0;
  let draws = 0;
  let totalMoves = 0;
  const start = Date.now();

  console.log(
    `🚀 AI vs AI Simulation (${totalGames} games, depth ${depth})...`,
  );
  for (let i = 1; i <= totalGames; i++) {
    const r = runSingleGame(depth, maxMoves);
    if (r.winner === Side.RED) redWins++;
    else if (r.winner === Side.BLACK) blackWins++;
    else draws++;
    totalMoves += r.totalMoves;
    if (i % 5 === 0 || i === totalGames) {
      console.log(`   Progress: ${i}/${totalGames}`);
    }
  }
  const durationMs = Date.now() - start;

  const summary: SimulationSummary = {
    totalGames,
    redWins,
    blackWins,
    draws,
    avgMoves: Math.round((totalMoves / totalGames) * 10) / 10,
    durationMs,
  };

  console.log("\n📊 === SIMULATION RESULTS ===");
  console.log(
    `Total Games  : ${summary.totalGames}  (${(durationMs / 1000).toFixed(1)}s)`,
  );
  console.log(
    `RED Wins     : ${summary.redWins}   (${((summary.redWins / totalGames) * 100).toFixed(1)}%)`,
  );
  console.log(
    `BLACK Wins   : ${summary.blackWins}   (${((summary.blackWins / totalGames) * 100).toFixed(1)}%)`,
  );
  console.log(
    `Draws        : ${summary.draws}   (${((summary.draws / totalGames) * 100).toFixed(1)}%)`,
  );
  console.log(`Avg Moves    : ${summary.avgMoves}/game`);
  return summary;
}

// -- (test wrapper): ไม่ assert ค่า (เป็น benchmark/report tool) ---------------
describe("AI vs AI Simulation", () => {
  it(
    "รัน 10 เกม depth2 เพื่อรายงานสถิติ (ปรับ VITE_SIM_DEPTH/VITE_SIM_GAMES ได้)",
    () => {
      runSimulation(envGames, MINIMAX_DEPTH, envMaxMoves);
    },
    TEST_TIMEOUT_MS,
  );
});
