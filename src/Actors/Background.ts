/* eslint-disable no-unused-vars */
import { ExcaliburGraphicsContext, Graphic, ScreenElement, vec } from "excalibur";

export class Background extends ScreenElement {
  constructor() {
    super({ pos: vec(0, 0), width: 500, height: 750 });

    this.graphics.use(new bgGraphic());
  }
}

class bgGraphic extends Graphic {
  cnv: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | null;

  constructor() {
    super();
    this.cnv = document.createElement("canvas");
    this.cnv.width = 500;
    this.cnv.height = 750;
    this.ctx = this.cnv.getContext("2d");
  }

  clone(): Graphic {
    return new bgGraphic();
  }

  _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.cnv.width, this.cnv.height);

    // Centered radial gradient (matches CSS "circle")
    const gradient = this.ctx.createRadialGradient(
      this.cnv.width / 2,
      this.cnv.height / 2,
      0,
      this.cnv.width / 2,
      this.cnv.height / 2,
      Math.max(this.cnv.width, this.cnv.height)
    );

    gradient.addColorStop(0.17, "hsla(235, 35%, 29%, 1)");
    gradient.addColorStop(1.0, "hsla(231, 56%, 14%, 1)");

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.cnv.width, this.cnv.height);
    ex.drawImage(this.cnv, x, y);
  }
}
