// src/ui/Slide.ts
export interface SlideConfig {
  containerId: string;
  imageUrls: string[];
  autoPlayInterval?: number;
}

export class Slide {
  private container: HTMLElement;
  private imageUrls: string[];
  private currentIndex: number = 0;
  private autoPlayTimer: number | null = null;
  private intervalMs: number;

  constructor(config: SlideConfig) {
    const el = document.getElementById(config.containerId);
    if (!el) {
      throw new Error(`Element #${config.containerId} not found for Slide UI.`);
    }
    this.container = el;
    this.imageUrls = config.imageUrls;
    this.intervalMs = config.autoPlayInterval || 3000;

    this.init();
  }

  private init(): void {
    if (this.imageUrls.length === 0) return;

    this.container.classList.add("slide-window-container");
    this.render();
  }

  public render(): void {
    if (this.imageUrls.length === 0) return;

    const currentUrl = this.imageUrls[this.currentIndex];
    this.container.innerHTML = `
      <div class="slide-frame" style="position: relative; overflow: hidden; width: 100%; height: 100%;">
        <img 
          src="${currentUrl}" 
          alt="Slide Image ${this.currentIndex + 1}" 
          style="width: 100%; height: 100%; object-fit: contain; display: block;" 
        />
        <div class="slide-controls" style="position: absolute; bottom: 5px; right: 5px; display: flex; gap: 4px;">
          <button id="btn-prev-slide" style="font-size: 10px; cursor: pointer;">&lt;</button>
          <button id="btn-next-slide" style="font-size: 10px; cursor: pointer;">&gt;</button>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const prevBtn = this.container.querySelector("#btn-prev-slide");
    const nextBtn = this.container.querySelector("#btn-next-slide");

    if (prevBtn) {
      prevBtn.addEventListener("click", () => this.prev());
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", () => this.next());
    }
  }

  public next(): void {
    if (this.imageUrls.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.imageUrls.length;
    this.render();
  }

  public prev(): void {
    if (this.imageUrls.length === 0) return;
    this.currentIndex =
      (this.currentIndex - 1 + this.imageUrls.length) % this.imageUrls.length;
    this.render();
  }

  public startAutoPlay(): void {
    this.stopAutoPlay();
    this.autoPlayTimer = window.setInterval(() => {
      this.next();
    }, this.intervalMs);
  }

  public stopAutoPlay(): void {
    if (this.autoPlayTimer !== null) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  }
}
