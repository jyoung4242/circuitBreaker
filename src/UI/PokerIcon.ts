import { ScreenElement, Vector } from "excalibur";
import { Resources } from "../resources";

export class PokerIcon extends ScreenElement {
  constructor(pos: Vector, size: Vector) {
    super({ pos, width: size.x, height: size.y });
    this.graphics.use(Resources.pokerIcon.toSprite());
  }
}
