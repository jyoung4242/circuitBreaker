/* eslint-disable no-unused-vars */
import { drawText } from "canvas-txt";
import { Canvas, ExcaliburGraphicsContext, Graphic, ScreenElement, vec, Vector } from "excalibur";
import { Resources } from "../resources";

export class CoinMeter extends ScreenElement {
  constructor(pos: Vector, size: Vector) {
    super({
      pos,
      width: size.x,
      height: size.y,
    });
    this.addChild(new CoinSprite());
    this.addChild(new CoinText());
  }
}

class CoinSprite extends ScreenElement {
  constructor() {
    super({
      pos: vec(0, 5),
      width: 32,
      height: 32,
      scale: vec(0.6, 0.6),
    });
    this.graphics.use(Resources.coin.toSprite());
  }
}

class CoinText extends ScreenElement {
  constructor() {
    super({
      pos: vec(24, -2),
      width: 100,
      height: 32,
    });
    this.graphics.use(new CoinTextGraphic());
  }
}

class CoinTextGraphic extends Graphic {
  cnv: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | null;
  constructor() {
    super({
      width: 100,
      height: 32,
    });
    this.cnv = document.createElement("canvas");
    this.cnv.width = 100;
    this.cnv.height = 32;
    this.ctx = this.cnv.getContext("2d");
  }

  clone(): Graphic {
    return new CoinTextGraphic();
  }

  protected _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void {
    let cnv = this.cnv;
    if (this.ctx === null) return;
    let ctx = this.ctx;
    ctx?.clearRect(0, 0, 100, 32);
    ctx.fillStyle = "#FFFFFF";
    drawText(ctx, "100", {
      x: 0,
      y: 0,
      width: 32,
      height: 32,
      align: "center",
      font: "BagelFat",
      fontSize: 16,
    });
    ex.drawImage(cnv, x, y);
  }
}
