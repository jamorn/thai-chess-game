// src/ui/AiChallengeModal.ts
//
// Modal "คำท้าจาก AI" — สไตล์เทอร์มินัล (พื้นดำ / ตัวเขียว) แยก UI เท่านั้น
// - ปุ่ม 🤖 วางไว้ในแถวเดียวกับปุ่ม "ประวัติการเดิน" (ฝั่งขวา)
// - เปิด/ปิดได้ด้วยคลิก, Tab+Enter (native <button>), Esc หรือคลิกพื้นหลัง
// ข้อความ: ชุด A (ท้าแบบไม่ดูหมิ่น) สอดรับ Product Goal ว่ามนุษย์ควรชนะได้
// ไม่แตะ business/AI logic

const CHALLENGES: string[] = [
  "ผมเล่นเก่งนะครับ ลองเอาชนะผมดูไหม?",
  "ผมคิดได้ 4 ตาล่วงหน้า ถ้าอยากชนะ คุณต้องคิดให้มากกว่านั้นครับ",
  "จะเดินเบี้ยกลางหรือโคนก่อนดี? ผมเตรียมตัวรับคุณอยู่แล้วครับ 555",
  "อย่าเพิ่งถอดใจ ถ้าคุณคิดลึก ๆ มีทางชนะผมได้เสมอ",
];

const GREEN = "#3aff7a";
const DIM = "#35b06a";

export function initAiChallengeModal(): void {
  const historySection = document.querySelector(".history-section");
  const toggleBtn = document.getElementById("toggle-history-btn");
  if (!historySection || !toggleBtn) return;
  if (toggleBtn.parentElement?.id === "ai-challenge-toolbar") return; // มีแล้ว

  // ---------- สร้าง toolbar แถวเดียวกับปุ่มประวัติ ----------
  const toolbar = document.createElement("div");
  toolbar.id = "ai-challenge-toolbar";
  Object.assign(toolbar.style, {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  });

  // ย้ายปุ่มประวัติลงไป left ของ toolbar
  toggleBtn.parentElement!.insertBefore(toolbar, toggleBtn);
  toolbar.appendChild(toggleBtn);
  historySection.insertBefore(toolbar, historySection.firstChild);

  // ---------- ปุ่ม AI (native <button> → คลิก/Tab+Enter) ----------
  const btn = document.createElement("button");
  btn.id = "ai-challenge-btn";
  btn.type = "button";
  btn.setAttribute("aria-haspopup", "dialog");
  btn.setAttribute("aria-label", "คำท้าจาก AI");
  btn.textContent = "🤖 AI";
  btn.className = "win95-btn"; // reuse ปุ่มแนว Win95
  btn.setAttribute("title", "AI อยากชวนเล่น ลองเอาชนะดูไหม?");
  btn.style.alignSelf = "center";
  btn.style.marginLeft = "auto";
  btn.style.verticalAlign = "top";
  btn.style.lineHeight = "normal";
  btn.style.height = "auto";
  toolbar.appendChild(btn);

  // ---------- overlay modal เทอร์มินัล (พื้นดำ/เขียว) ----------
  const overlay = document.createElement("div");
  overlay.id = "ai-challenge-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "10000",
    background: "rgba(0,12,0,0.88)",
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px",
    fontFamily: "'Menlo','Consolas','Courier New',monospace",
  });

  const box = document.createElement("div");
  Object.assign(box.style, {
    width: "min(580px, 94vw)",
    background: "#020803",
    border: `1px solid ${GREEN}`,
    boxShadow: `inset 0 0 22px rgba(58,255,122,0.12), 0 0 18px rgba(0,0,0,.9)`,
    padding: "16px 18px 12px",
    borderRadius: "8px",
    maxHeight: "86vh",
    overflow: "auto",
    color: GREEN,
  });

  // header
  const head = document.createElement("div");
  Object.assign(head.style, {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    borderBottom: `1px dashed ${GREEN}`,
    paddingBottom: "6px",
    fontWeight: "bold",
    fontSize: "13px",
    whiteSpace: "nowrap",
  });
  head.innerHTML =
    '<span style="color:#a6ffc8">🤖 AI อยากชวนเล่น</span>' +
    '<span style="opacity:.85;font-size:11px;font-weight:normal;margin-left:8px;white-space:normal">ลองเอาชนะผมดูไหมครับ</span>';

  const close = document.createElement("button");
  close.type = "button";
  close.setAttribute("aria-label", "ปิด");
  close.textContent = "✕ ปิด";
  Object.assign(close.style, {
    background: "none",
    border: "none",
    color: GREEN,
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    padding: "0 2px",
  });
  head.appendChild(close);
  box.appendChild(head);

  const bodyEl = document.createElement("div");
  bodyEl.style.paddingTop = "12px";

  const intro = document.createElement("div");
  intro.style.cssText = `color:${DIM};font-size:11px;white-space:pre-line;line-height:1.5;padding:0 0 10px;`;
  intro.textContent =
    "// ระดับปัจจุบัน AI: คิดลึก 4 ตา (difficulty เริ่มต้น)\n// หมายเหตุ Product Goal: มนุษย์ควรมีทางชนะเสมอครับ";
  bodyEl.appendChild(intro);

  const list = document.createElement("ul");
  Object.assign(list.style, {
    listStyle: "none",
    margin: "0",
    padding: "0",
  });
  CHALLENGES.forEach((text, i) => {
    const li = document.createElement("li");
    li.style.cssText = `line-height:1.8;font-size:13px;padding:3px 0;opacity:${1 - i * 0.05};`;
    li.textContent = `\u203A ${text}`;
    list.appendChild(li);
  });
  bodyEl.appendChild(list);

  const foot = document.createElement("div");
  foot.style.cssText = `color:${DIM};font-size:11px;margin-top:12px;border-top:1px solid rgba(58,255,122,.2);padding-top:8px;line-height:1.6;`;
  foot.textContent =
    "หมายเหตุจากผม: แม้ผมจะคิดลึก 4 ตา แต่คนที่รู้กลยุทธ์หมากรุกไทยและคิดรอบคอบ ยังมีทางชนะผมได้เสมอครับ";
  bodyEl.appendChild(foot);

  box.appendChild(bodyEl);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  const show = (on: boolean): void => {
    overlay.style.display = on ? "flex" : "none";
  };

  btn.addEventListener("click", () => show(true));
  close.addEventListener("click", () => show(false));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) show(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") show(false);
  });
}

// ---------------------------------------------------------------
// Self-host: ไม่อนุญาตให้ pollute main.ts — ไฟล์นี้รันเอง (เปิดผ่าน
// <script type="module" src="/src/ui/AiChallengeModal.ts"> ใน index)
// โดยไม่ต้องให้ controller หลัก/board เป็นผู้เรียก
// ---------------------------------------------------------------
if (
  typeof document !== "undefined" &&
  typeof window !== "undefined"
) {
  document.addEventListener("DOMContentLoaded", initAiChallengeModal);
}

