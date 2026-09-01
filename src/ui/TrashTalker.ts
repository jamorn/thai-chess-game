//
export class TrashTalker {
  private static readonly PHRASES = [
    "อย่าคิดสั้น!",
    "เดินแบบนี้ก็สวยสิครับ!",
    "เปิดหน้าขุนให้ยิงฟรีเฉยเลย",
    "จะฆาตกรรมขุนตัวเองหรือยังไง?",
    "คิดนานขนาดนี้ ยังเดินตานี้อีกเหรอ?",
    "เข้าทางผมล่ะ!",
    "ถอยตอนนี้ยังทันนะครับ",
  ];

  public static getRandomPhrase(): string {
    const idx = Math.floor(Math.random() * this.PHRASES.length);
    return this.PHRASES[idx];
  }

  public static showStatus(elementId: string, message: string): void {
    const el = document.getElementById(elementId);
    if (el) {
      el.textContent = `[AI]: "${message}"`;
      el.classList.add("flash-text");
      setTimeout(() => el.classList.remove("flash-text"), 2000);
    }
  }
}
