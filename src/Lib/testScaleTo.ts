import { Action, clamp, Entity, lerpVector, MotionComponent, nextActionId, remap, TransformComponent, vec, Vector } from "excalibur";

export interface TestScaleToOptions {
  /**
   * Absolute scale to change to
   */
  scale: Vector;
  /**
   * Duration to take in milliseconds
   */
  duration: number;
}

/**
 *
 */
export function isScaleToOptions(x: any): x is TestScaleToOptions {
  return typeof x.scale === "object" && typeof x.duration === "number";
}

export class TestScaleToWithOptions implements Action {
  id = nextActionId();
  private _durationMs: number;
  private _tx: TransformComponent;
  private _started: boolean = false;
  private _currentMs: number;
  private _stopped: boolean = false;
  private _motion: MotionComponent;
  private _endScale: Vector = vec(1, 1);
  private _startScale: Vector = vec(1, 1);
  constructor(public entity: Entity, options: TestScaleToOptions) {
    this._endScale = options.scale;
    this._tx = entity.get(TransformComponent);
    this._motion = entity.get(MotionComponent);
    if (!this._tx) {
      throw new Error(`Entity ${entity.name} has no TransformComponent, can only ScaleTo on Entities with TransformComponents.`);
    }
    this._durationMs = options.duration;
    this._currentMs = this._durationMs;
  }
  update(elapsed: number): void {
    if (!this._started) {
      this._startScale = this._tx.scale;
      this._started = true;
    }
    this._currentMs -= elapsed;
    const t = clamp(remap(0, this._durationMs, 0, 1, this._durationMs - this._currentMs), 0, 1);
    console.log(this._durationMs, this._currentMs);

    console.log(t);

    const newScale = lerpVector(this._startScale, this._endScale, t);
    const currentScale = this._tx.scale;

    const seconds = elapsed / 1000;
    const sx = newScale.sub(currentScale).scale(seconds === 0 ? 0 : 1 / seconds);
    this._motion.scaleFactor = sx;

    if (this.isComplete()) {
      this.stop();
      this._tx.scale = this._endScale;
      this._motion.angularVelocity = 0;
    }
  }
  public isComplete(): boolean {
    return this._stopped || this._currentMs < 0;
  }

  public stop(): void {
    this._motion.scaleFactor = Vector.Zero;
    this._stopped = true;
    this._currentMs = 0;
  }

  public reset(): void {
    this._currentMs = this._durationMs;
    this._started = false;
    this._stopped = false;
  }
}
