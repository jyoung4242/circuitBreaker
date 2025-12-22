/* eslint-disable no-unused-vars */

import { ExcaliburGraphicsContext, Graphic, ScreenElement, vec, Vector } from "excalibur";
import { drawText } from "canvas-txt";
import { Resources } from "../resources";

export class TimerMeter extends ScreenElement {
  constructor(pos: Vector, size: Vector) {
    super({ pos, width: size.x, height: size.y });
    this.addChild(new TimerSprite());
    this.addChild(new TimerClock());
  }
}

class TimerSprite extends ScreenElement {
  constructor() {
    super({ scale: vec(0.6, 0.6) });
    this.graphics.use(Resources.clock.toSprite());
  }
}

class TimerClock extends ScreenElement {
  constructor() {
    super({ pos: vec(0, 8), width: 300, height: 20, scale: vec(0.4, 0.4) });
    this.graphics.use(new digitalTime());
  }
}

class digitalTime extends Graphic {
  cnv: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | null;
  constructor() {
    super({
      width: 300,
      height: 40,
    });
    this.cnv = document.createElement("canvas");
    this.cnv.width = 300;
    this.cnv.height = 40;
    this.ctx = this.cnv.getContext("2d");
  }

  clone(): Graphic {
    return new digitalTime();
  }

  protected _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void {
    let cnv = this.cnv;
    let ctx = this.ctx;
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, 300, 40);

    // Get current time
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const timeString = `${hours}:${minutes}:${seconds}`;

    ctx.fillStyle = "#FFFFFF";

    // Draw time text
    drawText(ctx, timeString, {
      x: 0,
      y: 0,
      width: this.width,
      height: this.height,
      align: "center",
      font: "BagelFat",
      fontSize: 32,
    });
    // Transfer canvas to Excalibur context
    this.cnv.setAttribute("forceUpload", "true");
    ex.drawImage(cnv, 0, 0, this.width, this.height, x, y, this.width, this.height);
  }
}
