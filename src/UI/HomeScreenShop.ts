import { ScreenElement, vec } from "excalibur";

export class HomeScreenShop extends ScreenElement {
  constructor() {
    super({
      pos: vec(-500, 0), //starts offscreen
      width: 480,
      height: 520,
    });
  }
}
