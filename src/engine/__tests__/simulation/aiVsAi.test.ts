// src/engine/__tests__/simulation/aiVsAi.test.ts
import { describe, it } from "vitest";
import { Board } from "../../../domain/Board";
import { Side } from "../../../domain/enums/Side";
import { GameState } from "../../../domain/models/GameState";
import { Move } from "../../../domain/models/Move"; // ✅ เพิ่ม import
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

const envGames = Number(import.meta.env.VITE_SIM_GAMES || "20");
const envDepth = Number(import.meta.env.VITE_SIM_DEPTH || "3");
const envMaxMoves = Number(import.meta.env.VITE_SIM_MAX_MOVES || "100");

const envRedDepth = Number(import.meta.env.VITE_RED_DEPTH || String(envDepth));
const envBlackDepth = Number(
  import.meta.env.VITE_BLACK_DEPTH || String(envDepth),
);

const VERBOSE_MOVES = import.meta.env.VITE_VERBOSE_MOVES === "1";

const MINIMAX_DEPTH = Number.isFinite(envDepth) ? envDepth : 3;
const RED_DEPTH =
  Number.isFinite(envRedDepth) && envRedDepth > 0 ? envRedDepth : MINIMAX_DEPTH;
const BLACK_DEPTH =
  Number.isFinite(envBlackDepth) && envBlackDepth > 0
    ? envBlackDepth
    : MINIMAX_DEPTH;

const TEST_TIMEOUT_MS = 45 * 60_000;

function moveNotation(move: Move, moveIndex: number): string {
  const side = move.piece.side === Side.RED ? "R" : "B";
  const p = String(move.piece.type).padEnd(5, " ");
  const capture = move.capturedPiece ? "x" : " ";
  const from = move.from.join("");
  const to = move.to.join("");
  return `${String(moveIndex + 1).padStart(4)} ${side} ${p} ${from}${capture}${to}`;
}

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
  const moveHistory: Move[] = []; // ✅ ใหม่: เก็บ Move objects สำหรับตรวจ repetition

  const depthOf = (s: Side) => (s === Side.RED ? redDepth : blackDepth);

  while (moveCount < maxMoves) {
    // ✅ แก้ไข: ส่ง moveHistory เข้าไปตรวจ repetition
    const state = board.getGameState(currentTurn, moveHistory);

    if (state !== GameState.IN_PROGRESS) {
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

    const bookMove = getBookBestMove(board, currentTurn);
    if (bookMove) {
      move = bookMove;
    } else {
      const best = engine.findBestMove(
        board,
        currentTurn,
        depthOf(currentTurn),
      );
      if (!best) break;
      move = best;
    }

    history.push(moveNotation(move, moveCount));
    board.makeMove(move);
    moveHistory.push(move); // ✅ ใหม่: เก็บ move object
    moveCount++;
    currentTurn = currentTurn === Side.RED ? Side.BLACK : Side.RED;
  }

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
  const showHead = 30;
  const showTail = 30;
  console.log("   ...opening (first 30 plies):");
  history.slice(0, showHead).forEach((h) => console.log(`${h}`));
  if (history.length > showHead + showTail) {
    console.log("   ...(middle omitted)...");
    console.log("   ...ending (last 30 plies):");
    history.slice(-showTail).forEach((h) => console.log(`${h}`));
  } else {
    console.log("   ...rest:");
    history.slice(showHead).forEach((h) => console.log(`${h}`));
  }
}

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
      console.log(`Progress: ${i}/${totalGames}`);
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
    `(RED d${redDepth} vs BLACK d${blackDepth}) ${(durationMs / 1000).toFixed(1)}s`,
  );
  console.log(
    `RED Wins     : ${summary.redWins} (${((summary.redWins / totalGames) * 100).toFixed(1)}%)`,
  );
  console.log(
    `BLACK Wins   : ${summary.blackWins} (${((summary.blackWins / totalGames) * 100).toFixed(1)}%)`,
  );
  console.log(
    `Draws        : ${summary.draws} (${((summary.draws / totalGames) * 100).toFixed(1)}%)`,
  );
  console.log(`Avg Moves    : ${summary.avgMoves}/game`);
  return summary;
}

describe("AI vs AI Simulation", () => {
  it(
    "รายงานสถิติ AI vs AI (ปรับ depth ผ่าน VITE_SIM_DEPTH, และแยกสีได้ VITE_RED_DEPTH/VITE_BLACK_DEPTH)",
    () => {
      runSimulation(envGames, RED_DEPTH, BLACK_DEPTH, envMaxMoves);
    },
    TEST_TIMEOUT_MS,
  );
});
