import { ScreenElement, Vector } from "excalibur";
import { Resources } from "../resources";

export class TitlePanel extends ScreenElement {
  constructor(pos: Vector, size: Vector, scale: Vector) {
    super({ pos, width: size.x, height: size.y, scale });
    this.graphics.use(Resources.title.toSprite());
  }
}
