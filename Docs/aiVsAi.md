## Q : ถ้าเขียนเสร็จแล้ว ให้ ai เล่นกันเอง 100 ตา สู้กันเอง ทำได้ไหมครับด้วย logic ที่เขียนไว้

## A : ทำได้แน่นอนครับ! โครงสร้างโค้ดที่คุณเขียนแบบมี Separation of Concerns ชัดเจน (แยก Domain, Engine, UI ออกจากกัน) ทำให้การเขียน Automated AI vs AI Simulation Script สามารถทำได้ง่ายมาก และเป็นเทคนิคมาตรฐานที่นักพัฒนาใช้ในกระบวนการ Engine Tuning ครับ

การรัน AI สู้กันเอง 100 ตา จะช่วยให้คุณเห็นผลลัพธ์แบบสถิติชัดเจน เช่น:

ฝั่งเดินก่อน (แดง) vs ฝั่งเดินหลัง (ดำ) ใครได้เปรียบกว่า? (Win Rate)

มีเกมที่เสมอกันกี่ % (Draw Rate)

เกิดเกมอับ หรือเดินวนซ้ำ (Threefold Repetition) หรือไม่

Average Moves ต่อเกมอยู่ที่กี่ตา

แนวทางการเขียน Simulation Script
คุณสามารถสร้างไฟล์ทดสอบใหม่ เช่น src/engine/**tests**/simulation/aiVsAi.test.ts หรือสร้างเป็น Node Script รันแยกได้โดย ไม่ต้องเปิดหน้าจอ UI/Web Worker เลยครับ รันตรงผ่าน Node/TypeScript CLI ได้ทันที
TypeScript

import { Board } from "../../domain/Board";
import { MinimaxEngine } from "../Minimax";
import { Side } from "../../domain/enums/Side";

// ฟังก์ชันจำลองการแข่ง 1 เกม
function runSingleGame(maxMoves = 200): { winner: Side | 'DRAW'; totalMoves: number } {
const board = new Board();
board.setupDefaultBoard();
const engine = new MinimaxEngine();

let currentTurn = Side.RED;
let moveCount = 0;

while (moveCount < maxMoves) {
// 1. เช็ก Legal Moves ของฝั่งปัจจุบัน
const legalMoves = board.getLegalMovesForSide(currentTurn);
if (legalMoves.length === 0) {
// ไม่มีตาเดิน -> โดนรุกจน (Checkmate) หรือ ส Stalemate
const winner = currentTurn === Side.RED ? Side.BLACK : Side.RED;
return { winner, totalMoves: moveCount };
}

    // 2. ให้ AI หา Best Move (กำหนด depth = 3 หรือ 4 เพื่อความเร็วในการจำลอง)
    const bestMove = engine.findBestMove(board, currentTurn, 3);
    if (!bestMove) {
      return { winner: 'DRAW', totalMoves: moveCount };
    }

    // 3. เดินหมากบนกระดาน
    board.makeMove(bestMove);
    moveCount++;
    currentTurn = currentTurn === Side.RED ? Side.BLACK : Side.RED;

}

// เกิน maxMoves ถือว่าเสมอ (Draw)
return { winner: 'DRAW', totalMoves: moveCount };
}

// ฟังก์ชันรันจำลอง 100 ตาและสรุปผล
export function runSimulation(totalGames = 100) {
let redWins = 0;
let blackWins = 0;
let draws = 0;
const startTime = Date.now();

console.log(`🚀 Starting AI vs AI Simulation (${totalGames} games)...`);

for (let i = 1; i <= totalGames; i++) {
const result = runSingleGame(150);
if (result.winner === Side.RED) redWins++;
else if (result.winner === Side.BLACK) blackWins++;
else draws++;

    if (i % 10 === 0) {
      console.log(`Progress: ${i}/${totalGames} games finished.`);
    }

}

const duration = ((Date.now() - startTime) / 1000).toFixed(2);
console.log("\n📊 === SIMULATION RESULTS ===");
console.log(`Total Games: ${totalGames} (${duration}s)`);
console.log(`RED Wins   : ${redWins} (${((redWins / totalGames) * 100).toFixed(1)}%)`);
console.log(`BLACK Wins : ${blackWins} (${((blackWins / totalGames) * 100).toFixed(1)}%)`);
console.log(`Draws      : ${draws} (${((draws / totalGames) * 100).toFixed(1)}%)`);
}

# สิ่งที่ต้องระวังเมื่อรัน AI สู้กันเอง

1. Deterministic behavior (ถ้าไม่มีการสุ่ม):

- หากไม่ได้ใส่ Weighted Randomness ใน Opening Book หรือในตาเดินที่มีคะแนนประเมินเท่ากัน AI ทั้งสองฝั่งจะเดิน "หมากชุดเดิมเป๊ะ" ทั้ง 100 เกม!

- วิธีแก้: ควรเพิ่ม Weighted Random ใน Opening Book หรือสุ่มเลือกตาเดินหากคะแนน Evaluation เท่ากัน เพื่อให้กระดานหลากรูปแบบ

2. Infinite Loop (เกมเดินซ้ำไม่จบ):

- ต้องกำหนด maxMoves (เช่น 150-200 ตา) เพื่อตัดจบเป็น Draw หาก AI ทั้งคู่เอาแต่วิ่งขุนหลบกันไปมาโดยไม่มีการกินหมาก

3. Depth สำหรับการทดสอบ:

แนะนำให้รัน simulation ด้วย Depth 3 (หรือใช้ Depth 4 ถ้ารันเครื่องแรง) เพื่อให้ 100 เกมประมวลผลเสร็จภายใน 1-3 นาทีครับ
