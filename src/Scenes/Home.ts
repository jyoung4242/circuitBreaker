/* eslint-disable no-unused-vars */
import { Engine, Scene, SceneActivationContext, vec, Font, Color, NineSlice, NineSliceStretch, NineSliceConfig } from "excalibur";
import { Background } from "../Actors/Background";
import { UIButton } from "../UI/UIButton";
import { I18n } from "../Lib/I18n";
import { BarsPanel } from "../UI/Bars9slice";
import { TitlePanel } from "../UI/titlePanel";
import { EnergyMeter } from "../UI/EnergyMeter";
import { TimerMeter } from "../UI/TimerMeter";
import { CoinMeter } from "../UI/coinMeter";
import { HomeIcon } from "../UI/HomeIcon";
import { PokerIcon } from "../UI/PokerIcon";
import { ShopIcon } from "../UI/ShopIcon";

export class HomeScene extends Scene {
  locale: I18n;
  constructor(locale: I18n) {
    super();
    this.locale = locale;
  }

  onInitialize(engine: Engine): void {
    this.add(new Background());
    this._createLayout();
  }

  onPreUpdate(engine: Engine, elapsed: number): void {}

  _createLayout() {
    let screenSize = this.engine.screen.viewport;
    let myButton = new UIButton("mytestButton", vec(240 - 175, 520 / 2 - 50), vec(350, 100), {
      idleText: this.locale.t("home.button"),
      activeText: this.locale.t("home.click"),
      hoveredText: this.locale.t("home.hover"),
      textOptions: {
        font: new Font({ family: "BagelFat", size: 24 }),
        color: Color.White,
        text: "",
      },
      colors: {
        mainStarting: Color.fromHex("#e57504"),
        mainEnding: Color.fromHex("#e1690a"),
        bottomStarting: Color.fromHex("#e7a23c"),
        bottomEnding: Color.fromHex("#96320b"),
        hoverStarting: Color.fromHex("#fa9e41ff"),
        hoverEnding: Color.fromHex("#eb7e26ff"),
      },
    });
    let myBarsPanel = new BarsPanel(vec(250 - 240, 300 - 175), vec(480, 520));

    this.add(myBarsPanel);
    myBarsPanel.addChild(myButton);
    this.add(new TitlePanel(vec(250 - 103, 5), vec(206.5, 97), vec(0.5, 0.5)));
    this.add(new EnergyMeter(vec(5, 10)));
    this.add(new TimerMeter(vec(5, 40), vec(100, 32)));
    this.add(new CoinMeter(vec(425, 10), vec(100, 32)));
    this.add(new HomeIcon(vec(250 - 48, 750 - 95), vec(90, 90)));
    this.add(new PokerIcon(vec(500 - 100, 750 - 95), vec(90, 90)));
    this.add(new ShopIcon(vec(5, 750 - 95), vec(90, 90)));
  }
}
