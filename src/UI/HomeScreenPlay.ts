import { Color, Font, ScreenElement, vec } from "excalibur";
import { UIButton } from "./UIButton";
import { I18n } from "../Lib/I18n";

export class HomeScreenPlay extends ScreenElement {
  locale: I18n;
  button: UIButton;
  constructor(locale: I18n) {
    //(vec(250 - 240, 300 - 175), vec(480, 520));
    super({
      pos: vec(0, 0),
      width: 480,
      height: 520,
      color: Color.Transparent,
    });
    this.locale = locale;
    this.button = new UIButton("mytestButton", vec(240 - 175, 520 / 2 - 50), vec(350, 100), {
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
    this.addChild(this.button);
  }
}
