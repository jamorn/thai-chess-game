// src/ui/deviceInfo.ts
//
// Helper เล็ก ๆ "ถามเบราว์เซอร์/device จริง" ก่อนจะจัด UI ให้ตรงอุปกรณ์
// -------------------------------------------------------------
// ใช้ DOM API ขนาดเล็ก (ไม่พึ่ง Tailwind) เพื่อ:
//   - วัดขนาด viewport จริง (window.innerWidth / innerHeight)
//   - อ่าน orientation และ DPR
//   - เขียนลง documentElement เป็น CSS custom property/data-* ให้ CSS
//     จัด reactive ตาม device ได้ (และ re-run เวลา rotate/resize)
//
// หมายเหตุ: ข้างไฟล์นี้ไม่มี side effect ตอน import (ต้องเรียกใช้เองใน app)
// เพื่อไม่ไปขัดกับพวก test/import อิสระของ Vite

export interface DeviceInfo {
  /** viewport กว้างที่เป็นจริง (px) */
  width: number;
  /** viewport สูงจริง (px) */
  height: number;
  /** devicePixelRatio (จอ hiDPI) */
  dpr: number;
  /** จอแนวนอนจริงหรือไม่ */
  isLandscape: boolean;
  /** จอแนวนอน + สูง ≤ 620 (โทรถือแนวตั้งบรรยาย = จอ "เตี้ย") */
  shortHeight: boolean;
  /** อุปกรณ์สัมผัสนิ้วได้ไหม */
  touch: boolean;
}

type Listener = (info: DeviceInfo) => void;

/** อ่านค่าจากเบราว์เซอร์ (สามารถ inject win/doc เพื่อเทสต์ได้) */
export function readDeviceInfo(
  win: Window = window,
  doc: Document = win.document,
): DeviceInfo {
  void doc; // เหลือสองพารามิเตอร์เผื่อเทสต์ แต่เรียกส่วนใหญ่แบบ default (win)
  const width = win.innerWidth;
  const height = win.innerHeight;
  const orientationType =
    typeof win.screen?.orientation?.type === "string"
      ? win.screen.orientation.type
      : "";

  // เผื่อ browser เก่าที่ screen.orientation ไม่รองรับ -> เทียบ width/height แทน
  const isLandscape =
    orientationType.indexOf("landscape") === 0 || width > height;
  const shortHeight = isLandscape && height <= 620;
  const dpr = win.devicePixelRatio || 1;
  const touch =
    "ontouchstart" in win || (win.navigator.maxTouchPoints ?? 0) > 0;

  return { width, height, dpr, isLandscape, shortHeight, touch };
}

/**
 * เขียน device state ลงที่ CSS เพื่อให้ CSS ตาม layout ที่จุดเดียวถูกต้อง
 * โดยเขียนทั้งลง <html>(documentElement) และ <body> classes
 */
export function applyDeviceClasses(
  root: HTMLElement = document.documentElement,
  body: HTMLElement = document.body,
): DeviceInfo {
  const info = readDeviceInfo();

  // data-* บน <html> เพื่อ CSS var / selector (เช่น html[data-orient="landscape"])
  root.dataset.deviceW = String(info.width);
  root.dataset.deviceH = String(info.height);
  root.dataset.deviceDpr = String(info.dpr);
  root.dataset.orientation = info.isLandscape ? "landscape" : "portrait";
  root.dataset.short = String(info.shortHeight);

  // class บน <body>
  body.classList.toggle("use-landscape", info.isLandscape);
  body.classList.toggle("use-short", info.shortHeight);

  return info;
}

/**
 * ฟัง resize/rotate แล้วเรียก handler ซ้ำ ๆ (device-aware; ส่ง selector เดิม)
 * คืน function ไว้ unpatch/cleanup เมื่อปิด
 */
export function bindDeviceChanges(
  handler: Listener,
  win: Window = window,
): () => void {
  const run = (): void => {
    applyDeviceClasses();
    handler(readDeviceInfo(win));
  };
  win.addEventListener("resize", run);
  win.addEventListener("orientationchange", run);
  return () => {
    win.removeEventListener("resize", run);
    win.removeEventListener("orientationchange", run);
  };
}
