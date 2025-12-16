/* eslint-disable no-unused-vars */
import { Engine, Scene, SceneActivationContext } from "excalibur";
import { Background } from "../Actors/Background";

export class GameScene extends Scene {
  constructor() {
    super();
  }

  onActivate(context: SceneActivationContext<unknown, undefined>): void {
    this.add(new Background());
  }

  onPreUpdate(engine: Engine, elapsed: number): void {}
}
