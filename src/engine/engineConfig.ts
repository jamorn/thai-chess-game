// src/engine/engineConfig.ts
// ค่าคงที่สำหรับ AI Search Engine (Minimax + Alpha-Beta)
// แยก magic numbers ออกจากลอจิก เพื่อให้ปรับจูนง่ายและอ่านเข้าใจ

/** ความลึกการค้นหาเริ่มต้น (Iterative Deepening เต็ม)
 * ตั้ง = 3 เพื่อให้ AI ตัดใจใน ~3 วิ บนเบราว์เซอร์กลางเกมจริง
 * (สูงกว่านี้ เช่น 5 = ~30 วิ เกินไปสำหรับเกม casual)
 */
export const DEFAULT_SEARCH_DEPTH = 3;

/**
 * คะแนน Checkmate
 * สูงเกินกว่าผลรวมค่าหมากทั้งหมด (ขุน 20000 * 2 + หมากอื่น) เสมอ
 * เพื่อให้ AI เลือกทางที่ชนะ/หนีรอดเป็นอันดับแรกเสมอ
 */
export const MATE_SCORE = 100000;

/** คะแนนเสมอ (Stalemate / ไม่มีหมากเดินถูกกฎหมายแบบไม่ถูกหมาก) */
export const DRAW_SCORE = 0;
