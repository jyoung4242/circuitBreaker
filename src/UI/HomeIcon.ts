import { Engine, ScreenElement, Shader, Vector, vec } from "excalibur";
import { Resources } from "../resources";
import { Signal } from "../Lib/Signals";
import { createGleamMaterial } from "../Shaders/gleamMaterial";
import { TestScaleToWithOptions } from "../Lib/testScaleTo";

export class HomeIcon extends ScreenElement {
  showHomeSignal = new Signal("showHome");
  isHovered = false;
  lastGlintTime = 0;
  glintInterval = 2500;
  constructor(pos: Vector, size: Vector) {
    super({ pos, width: size.x, height: size.y, anchor: Vector.Half });
    this.graphics.use(Resources.homeIcon.toSprite());
  }
  onInitialize(engine: Engine): void {
    this.on("pointerup", this.showHome);
    this.on("pointerenter", this.hover);
    this.on("pointerleave", this.leave);
    this.graphics.material = createGleamMaterial(engine);
    this.graphics.material?.update((s: Shader) => {
      s.trySetUniformFloat("u_glint_speed", 2.0); // Normal speed
      s.trySetUniformFloat("u_glint_trigger", -999.0); // No glint initially
    });
  }

  hover = (): void => {
    this.isHovered = true;
  };
  leave = (): void => {
    this.isHovered = false;
  };

  showHome = (): void => {
    this.actions
      .runAction(new TestScaleToWithOptions(this, { scale: vec(1.2, 1.2), duration: 350 }))
      .toPromise()
      .then(() => {
        this.actions.runAction(new TestScaleToWithOptions(this, { scale: vec(1, 1), duration: 100 }));
      });
    this.showHomeSignal.send();
  };

  onPreUpdate(engine: Engine): void {
    const currentTime = engine.clock.now();

    // Automatically trigger glints at intervals

    if (this.isHovered && currentTime - this.lastGlintTime > this.glintInterval) {
      this.lastGlintTime = currentTime;
      this.graphics.material?.update((s: Shader) => {
        s.trySetUniformFloat("u_glint_trigger", currentTime / 1000.0);
      });
    }
  }
}
