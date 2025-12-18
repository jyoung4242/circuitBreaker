import { NineSlice, NineSliceConfig, NineSliceStretch, ScreenElement, Vector } from "excalibur";
import { Resources } from "../resources";

export class BarsPanel extends ScreenElement {
  constructor(pos: Vector, size: Vector) {
    super({
      name: "BarsPanel",
      pos,
      width: size.x,
      height: size.y,
    });

    let nineSlConfig: NineSliceConfig = {
      width: size.x,
      height: size.y,
      source: Resources.barsPanel,
      sourceConfig: {
        width: 96,
        height: 96,
        topMargin: 8,
        leftMargin: 5,
        rightMargin: 5,
        bottomMargin: 8,
      },
      destinationConfig: {
        drawCenter: false,
        horizontalStretch: NineSliceStretch.Stretch,
        verticalStretch: NineSliceStretch.Stretch,
      },
    };
    this.graphics.use(new NineSlice(nineSlConfig));
  }
}
