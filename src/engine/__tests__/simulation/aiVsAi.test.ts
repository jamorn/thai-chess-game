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
// ความลึกแยกสี — ใช้ทดสอบ "AI เก่งไม่เท่ากัน" จะได้เห็นแพ้/ชนะชัดเจน
// (default: ใช้ envDepth เท่ากันทั้งสองฝั่ง -> เสมอกันธรรมชาติ เจอ Draw มาก)
const envRedDepth = Number(import.meta.env.VITE_RED_DEPTH || String(envDepth));
const envBlackDepth = Number(
  import.meta.env.VITE_BLACK_DEPTH || String(envDepth),
);
// ถ้า VITE_VERBOSE_MOVES=1 -> dump history ของทุกตาเดิน (ช่วงเปิด/ปลาย) เพื่อวิเคราะห์
// ว่า AI ติดตรงไหน ทำไมเกมไม่จบ (ใช้กับ depth2/3 รันสั้น ๆ เพื่อวินิจฉัย)
const VERBOSE_MOVES = import.meta.env.VITE_VERBOSE_MOVES === "1";

const MINIMAX_DEPTH = Number.isFinite(envDepth) ? envDepth : 3;
const RED_DEPTH =
  Number.isFinite(envRedDepth) && envRedDepth > 0 ? envRedDepth : MINIMAX_DEPTH;
const BLACK_DEPTH =
  Number.isFinite(envBlackDepth) && envBlackDepth > 0
    ? envBlackDepth
    : MINIMAX_DEPTH;

// Simulation ใช้เวลานานหลายนาทีขึ้นไป -> ครอบ test timeout ไว้ไกล (45 นาที)
const TEST_TIMEOUT_MS = 45 * 60_000;

/** สร้าง notation สั้นต่อ 1 ply เช่น "R:Pawn 35->34" (side,piece,from->to) สำหรับ log */
function moveNotation(move: any, moveIndex: number): string {
  const side = move.piece.side === Side.RED ? "R" : "B";
  const p = String(move.piece.type).padEnd(5, " ");
  const capture = move.capturedPiece ? "x" : " ";
  const from = move.from.join("");
  const to = move.to.join("");
  return `${String(moveIndex + 1).padStart(4)} ${side} ${p} ${from}${capture}${to}`;
}

/** รัน AI สู้กันเอง 1 เกม โดยพึ่ง Opening Book ช่วงเปิด แล้ว Minimax ต่อ
 *  depth ของ RED/BLACK แยกกันได้ — ถ้าตั้งไม่เท่ากันจะเห็นแพ้/ชนะ (AI เก่งกว่ารันชนะมากกว่า)
 *  ถ้า VERBOSE_MOVES=1 จะ dump ประวัติทุกตาเดินเมื่อจบ (เปิดหัว/ท้ายเกม) เพื่อวินิจฉัย
 */
export function runSingleGame(
  redDepth: number = RED_DEPTH,
  blackDepth: number = BLACK_DEPTH,
  maxMoves = envMaxMoves,
): GameResult {
  const board = new Board();
  board.setupDefaultBoard();
  const engine = new MinimaxEngine();

  let currentTurn: Side = Side.RED;
  let moveCount = 0;
  const history: string[] = [];
  const depthOf = (s: Side) => (s === Side.RED ? redDepth : blackDepth);

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
      dumpHistory({
        history,
        winner,
        moveCount,
        reason: "game-over (state)",
        redDepth,
        blackDepth,
      });
      return { winner, totalMoves: moveCount };
    }

    let move: NonNullable<ReturnType<typeof getBookBestMove>> | null = null;

    // ช่วงเปิด (มีใน Book) -> ใช้ Weighted Random เพื่อความหลากหลาย
    const bookMove = getBookBestMove(board, currentTurn);
    if (bookMove) {
      move = bookMove;
    } else {
      const best = engine.findBestMove(
        board,
        currentTurn,
        depthOf(currentTurn),
      );
      if (!best) break; // ไร้ตาเดิน -> จบเกม (จับเป็น draw ด้านล่าง)
      move = best;
    }

    history.push(moveNotation(move, moveCount));
    board.makeMove(move);
    moveCount++;
    currentTurn = currentTurn === Side.RED ? Side.BLACK : Side.RED;
  }

  // เกิน maxMoves (หรือ AI คืน null) -> เสมอ
  dumpHistory({
    history,
    winner: "DRAW",
    moveCount,
    reason: "maxMoves-limit / no-move-null",
    redDepth,
    blackDepth,
  });
  return { winner: "DRAW", totalMoves: moveCount };
}

/** พิมพ์ประวัติเฉพาะช่วงหัว + ท้ายเกมให้เห็น pattern โดยไม่ท่วม console */
function dumpHistory(p: {
  history: string[];
  winner: string | Side;
  moveCount: number;
  reason: string;
  redDepth: number;
  blackDepth: number;
}): void {
  if (!VERBOSE_MOVES) return;

  const { history, winner, moveCount, reason, redDepth, blackDepth } = p;
  console.log(
    `\n─── Game: RED d${redDepth} vs BLACK d${blackDepth} → ${winner} (${moveCount} plies); ${reason} ───`,
  );
  if (history.length === 0) {
    console.log("   (no moves)");
    return;
  }
  const showHead = 30; // 30 พลายแรก
  const showTail = 30; // 30 พลายท้าย
  console.log("   ...opening (first 30 plies):");
  history.slice(0, showHead).forEach((h) => console.log(`   ${h}`));
  if (history.length > showHead + showTail) {
    console.log("   ...(middle omitted)...");
    console.log("   ...ending (last 30 plies):");
    history.slice(-showTail).forEach((h) => console.log(`   ${h}`));
  } else {
    console.log("   ...rest:");
    history.slice(showHead).forEach((h) => console.log(`   ${h}`));
  }
}

/** รัน simulation หลายเกม แล้วสรุปสถิติ (depth แยกสีได้: ตั้งไม่เท่ากันจะเห็นแพ้/ชนะ) */
export function runSimulation(
  totalGames = envGames,
  redDepth = RED_DEPTH,
  blackDepth = BLACK_DEPTH,
  maxMoves = envMaxMoves,
): SimulationSummary {
  let redWins = 0;
  let blackWins = 0;
  let draws = 0;
  let totalMoves = 0;
  const start = Date.now();

  console.log(
    `🚀 AI vs AI Simulation (${totalGames} games, RED d${redDepth} vs BLACK d${blackDepth})...`,
  );
  for (let i = 1; i <= totalGames; i++) {
    const r = runSingleGame(redDepth, blackDepth, maxMoves);
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
    `   (RED d${redDepth} vs BLACK d${blackDepth})  ${(durationMs / 1000).toFixed(1)}s`,
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
    "รายงานสถิติ AI vs AI (ปรับ depth ผ่าน VITE_SIM_DEPTH, และแยกสีได้ VITE_RED_DEPTH/VITE_BLACK_DEPTH)",
    () => {
      runSimulation(envGames, RED_DEPTH, BLACK_DEPTH, envMaxMoves);
    },
    TEST_TIMEOUT_MS,
  );
});
