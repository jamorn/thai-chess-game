// src/ui/portraitLock.ts
//
// ล็อก UI ให้เล่นในแนวตั้งเท่านั้น (ไม่แตะ business logic เลย)
// -------------------------------------------------------------
// - เมื่อผู้ใช้หมุนจอเป็นแนวนอน (landscape) บนอุปกรณ์พกพา/จอแคบ
//   จะเด้ง modal เตือน "กรุณาหมุนเป็นแนวตั้ง" ขึ้นบังจอ
// - หมุนกลับเป็นแนวตั้งอีกที > modal ปิดเอง เล่นต่อได้ทันที
// - ใช้ helper deviceInfo.ts เป็นตัว "ถามเบราว์เซอร์" ว่าขนาด/orientation จริง
//   (ไม่มี touching กับกติกา/การเดินหมาก — ไป toggle CSS กลับบน/ล่างเท่านั้น)

import { bindDeviceChanges, readDeviceInfo, type DeviceInfo } from "./deviceInfo";

// ขอบเขต: ใช้กับอุปกรณ์แบบ touch ที่ portrait/landscape น่าจะจัด UI ยากจริง
// ถ้า viewport กว้างกว่า 1280 (เดสก์ท็อปจอใหญ่) ไม่บังคับ
const LOCK_MAX_WIDTH = 1280;

export function initPortraitLock(): void {
  const modal = document.getElementById("rotate-modal");
  if (!modal) return;

  const apply = (info: DeviceInfo): void => {
    const shouldLock =
      info.isLandscape &&
      info.touch &&
      info.width <= LOCK_MAX_WIDTH;

    // กันพื้นหลังเลื่อนไปมา และเปิด/ปิด modal เองซ้ำได้ทันที
    document.body.classList.toggle("rotation-locked", shouldLock);
    modal.classList.toggle("open", shouldLock);
  };

  // ตรวจ state ครั้งแรกตอน init (เผื่อมือถือเปิดมาวางแนวนอนแล้ว)
  apply(readDeviceInfo());

  // ติดตาม resize / orientationchange -> modal ทำงานอัตโนมัติ
  bindDeviceChanges(apply);
}
