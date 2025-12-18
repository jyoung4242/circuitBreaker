/* eslint-disable no-unused-vars */
import { ExcaliburGraphicsContext, Graphic, ScreenElement, vec, Vector } from "excalibur";
import { drawText } from "canvas-txt";
import { Resources } from "../resources";

export class EnergyMeter extends ScreenElement {
  constructor(pos: Vector) {
    super({ pos });
    this.addChild(new EnergyIcon());
    this.addChild(new EnergyText());
  }
}

class EnergyIcon extends ScreenElement {
  constructor() {
    super({
      pos: vec(0, 0),
      width: 32,
      height: 32,
    });
    this.graphics.use(Resources.bolt.toSprite());
  }
}

class EnergyText extends ScreenElement {
  constructor() {
    super({
      pos: vec(18, 6),
      width: 100,
      height: 20,
      scale: vec(0.75, 0.75),
    });
    this.graphics.use(new EnergyTextGraphic());
  }
}

class EnergyTextGraphic extends Graphic {
  cnv: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | null;
  constructor() {
    super({
      width: 100,
      height: 20,
    });
    this.cnv = document.createElement("canvas");
    this.cnv.width = 100;
    this.cnv.height = 20;
    this.ctx = this.cnv.getContext("2d");
  }

  clone(): Graphic {
    return new EnergyTextGraphic();
  }

  protected _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void {
    let cnv = this.cnv;
    if (this.ctx === null) return;
    let ctx = this.ctx;
    ctx?.clearRect(0, 0, 100, 20);
    ctx.fillStyle = "#FFFFFF";

    drawText(ctx, "5/5", {
      x: 0,
      y: 0,
      width: 100,
      height: 20,
      align: "center",
      font: "BagelFat",
      fontSize: 32,
    });

    ex.drawImage(cnv, x, y);
  }
}
