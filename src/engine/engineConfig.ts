// src/engine/engineConfig.ts
// ค่าคงที่สำหรับ AI Search Engine (Minimax + Alpha-Beta)
// แยก magic numbers ออกจากลอจิก เพื่อให้ปรับจูนง่ายและอ่านเข้าใจ

/** ความลึกการค้นหาเริ่มต้น (Iterative Deepening เต็ม)
 *
 * การตั้งค่า:
 * - 4    : กลางเกม ~1.4s (สมดุลดีที่สุด ฉลาด + เล่นได้ลื่น)  << ปัจจุบัน
 * - 5    : กลางเกม ~9s (ลึกไปสำหรับเกม casual บนเบราว์เซอร์)
 * - 3    : กลางเกม ~0.9s (เร็วมาก แต่เห็นลึกน้อยกว่า)
 *
 * หลัง optimize mobility (pseudo-legal + lazy eval) depth 4 เล่นได้สบาย
 */
export const DEFAULT_SEARCH_DEPTH = 4;

/**
 * คะแนน Checkmate
 * สูงเกินกว่าผลรวมค่าหมากทั้งหมด (ขุน 20000 * 2 + หมากอื่น) เสมอ
 * เพื่อให้ AI เลือกทางที่ชนะ/หนีรอดเป็นอันดับแรกเสมอ
 */
export const MATE_SCORE = 100000;

/** คะแนนเสมอ (Stalemate / ไม่มีหมากเดินถูกกฎหมายแบบไม่ถูกหมาก) */
export const DRAW_SCORE = 0;
