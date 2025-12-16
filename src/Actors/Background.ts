/* eslint-disable no-unused-vars */
import { ExcaliburGraphicsContext, Graphic, ScreenElement, vec } from "excalibur";

export class Background extends ScreenElement {
  constructor() {
    super({ pos: vec(0, 0), width: 500, height: 750 });

    this.graphics.use(new bgGraphic());
  }
}

class bgGraphic extends Graphic {
  constructor() {
    super();
  }

  clone(): Graphic {
    return new bgGraphic();
  }

  _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void {
    const cnv = document.createElement("canvas");
    cnv.width = 500;
    cnv.height = 750;

    const ctx = cnv.getContext("2d");
    if (!ctx) return;

    // Centered radial gradient (matches CSS "circle")
    const gradient = ctx.createRadialGradient(
      cnv.width / 2,
      cnv.height / 2,
      0,
      cnv.width / 2,
      cnv.height / 2,
      Math.max(cnv.width, cnv.height)
    );

    gradient.addColorStop(0.17, "hsla(235, 35%, 29%, 1)");
    gradient.addColorStop(1.0, "hsla(231, 56%, 14%, 1)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, cnv.width, cnv.height);

    ex.drawImage(cnv, x, y);
  }
}
