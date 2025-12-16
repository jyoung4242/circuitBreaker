/* eslint-disable no-unused-vars */
import { Engine, Scene, SceneActivationContext, vec, Font, Color } from "excalibur";
import { Background } from "../Actors/Background";
import { UIButton } from "../UI/UIButton";
import { I18n } from "../Lib/I18n";
import { UIContainer, UILayout } from "../UI/UILayout";

export class HomeScene extends Scene {
  locale: I18n;
  layout: UILayout;
  button: UIButton;
  constructor(locale: I18n) {
    super();
    this.locale = locale;
  }

  onInitialize(engine: Engine): void {
    this.layout = new UILayout(this);
    this.add(new Background());
    this._createLayout();
  }

  onPreUpdate(engine: Engine, elapsed: number): void {
    this.layout?.update();
  }

  _createLayout() {
    const mainContainer = new UIContainer({
      name: "mainContainer",
      width: 500,
      height: 750,
      padding: 0,
      gap: 0,
      layoutDirection: "vertical",
      positionContentStrategy: "center",
      alignmentContentStrategy: "center",
      color: Color.Transparent,
    });
    this.layout.root.addChildContainer(mainContainer);

    const buttonContainer = new UIContainer({
      name: "buttonContainer",
      width: 250,
      height: 100,
      layoutDirection: "vertical",
      positionContentStrategy: "center",
      alignmentContentStrategy: "center",
      color: Color.Transparent,
    });

    let myButton = new UIButton("mytestButton", vec(250, 80), {
      idleText: this.locale.t("home.button"),
      activeText: this.locale.t("home.click"),
      hoveredText: this.locale.t("home.hover"),
      textOptions: {
        font: new Font({ family: "BagelFat", size: 20 }),
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
    this.button = myButton;
    mainContainer.addChildContainer(buttonContainer);
    buttonContainer.addChild(myButton);
  }
}
