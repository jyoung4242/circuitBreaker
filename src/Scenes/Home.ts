/* eslint-disable no-unused-vars */
import {
  Engine,
  Scene,
  SceneActivationContext,
  vec,
  Font,
  Color,
  NineSlice,
  NineSliceStretch,
  NineSliceConfig,
  easeInCubic,
  easeInOutElastic,
  easeOutCubic,
} from "excalibur";
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
import { HomeScreenPlay } from "../UI/HomeScreenPlay";
import { SettingsIcon } from "../UI/SettingsIcon";
import { ExFSM, ExState } from "../Lib/ExFSM";
import { HomeScreenPoker } from "../UI/HomeScreenPoker";
import { HomeScreenShop } from "../UI/HomeScreenShop";
import { HomeScreenSettings } from "../UI/HomeScreenSettings";
import { Signal } from "../Lib/Signals";

type HomeScreenPanel = HomeScreenPlay | HomeScreenPoker | HomeScreenShop | HomeScreenSettings;

export class HomeScene extends Scene {
  titlePanel: TitlePanel | null = null;
  barsPanel: BarsPanel | null = null;

  showHomeSignal = new Signal("showHome");
  showPokerSignal = new Signal("showPoker");
  showShopSignal = new Signal("showShop");
  showSettingsSignal = new Signal("showSettings");

  //panel screens
  homePanel: HomeScreenPanel | null = null;
  pokerPanel: HomeScreenPoker | null = null;
  settingPanel: HomeScreenSettings | null = null;
  shopPanel: HomeScreenShop | null = null;

  locale: I18n;
  fsm: ExFSM | null = null;
  constructor(locale: I18n) {
    super();
    this.locale = locale;
  }

  onInitialize(engine: Engine): void {
    this.add(new Background());
    this.fsm = new ExFSM();
    this._createLayout();
    console.log(this.fsm);
  }

  onPreUpdate(engine: Engine, elapsed: number): void {
    if (!this.fsm) return;
    this.fsm.update();
  }

  _createLayout() {
    let screenSize = this.engine.screen.viewport;

    // cosmetic panel
    this.barsPanel = new BarsPanel(vec(250 - 240, 300 - 175), vec(480, 520));

    // home panel
    this.homePanel = new HomeScreenPlay(this.locale);
    this.fsm?.register(new FSMStateHome(this.homePanel));

    this.barsPanel.addChild(this.homePanel);

    // poker panel
    this.pokerPanel = new HomeScreenPoker();
    this.fsm?.register(new FSMStatePoker(this.pokerPanel));
    this.barsPanel.addChild(this.pokerPanel);

    // shop panel
    this.shopPanel = new HomeScreenShop();
    this.fsm?.register(new FSMStateShop(this.shopPanel));
    this.barsPanel.addChild(this.shopPanel);

    // settings panel
    this.settingPanel = new HomeScreenSettings();
    this.fsm?.register(new FSMStateSettings(this.settingPanel));
    this.barsPanel.addChild(this.settingPanel);

    this.fsm?.set("home");

    this.add(this.barsPanel);
    this.add(new TitlePanel(vec(250 - 103, 5), vec(206.5, 97), vec(0.5, 0.5)));
    this.add(new EnergyMeter(vec(5, 10)));
    this.add(new TimerMeter(vec(5, 40), vec(100, 32)));
    this.add(new CoinMeter(vec(425, 10), vec(100, 32)));

    this.add(new HomeIcon(vec(146 + 45, 655 + 45), vec(90, 90)));
    this.add(new PokerIcon(vec(264 + 45, 655 + 45), vec(90, 90)));
    this.add(new ShopIcon(vec(28 + 45, 655 + 45), vec(90, 90)));
    this.add(new SettingsIcon(vec(382 + 45, 655 + 45), vec(90, 90)));

    // setup Signal Listener
    this.showHomeSignal.listen(() => this.switchPanel("home"));
    this.showPokerSignal.listen(() => this.switchPanel("poker"));
    this.showShopSignal.listen(() => this.switchPanel("shop"));
    this.showSettingsSignal.listen(() => this.switchPanel("settings"));
  }

  switchPanel(panel: "home" | "poker" | "shop" | "settings") {
    //don't switch if you're in correct panel
    if (!this.fsm || !this.fsm.current) return;
    if (this.fsm.current.name === panel) return;
    this.fsm.set(panel);
  }
}

// #region screen states

class ScreenStates extends ExState {
  name: string;
  owner: HomeScreenPanel;
  constructor(name: string, owner: HomeScreenPanel) {
    super(name);
    this.owner = owner;
    this.name = name;
  }
  enter(_previous: ExState | null, ..._params: any): void | Promise<void> {
    this.owner.actions.moveTo({
      pos: vec(0, 0),
      duration: 425,
      easing: easeOutCubic,
    });
  }

  async exit(_next: ExState | null, ..._params: any): Promise<void> {
    this.owner.actions
      .moveTo({
        pos: vec(525, 0),
        duration: 425,
        easing: easeInCubic,
      })
      .toPromise()
      .then(() => (this.owner.pos = vec(-525, 0)));
  }
}

class FSMStateHome extends ScreenStates {
  constructor(owner: HomeScreenPanel) {
    super("home", owner);
  }
}
class FSMStatePoker extends ScreenStates {
  constructor(owner: HomeScreenPanel) {
    super("poker", owner);
  }
}
class FSMStateShop extends ScreenStates {
  constructor(owner: HomeScreenPanel) {
    super("shop", owner);
  }
}
class FSMStateSettings extends ScreenStates {
  constructor(owner: HomeScreenPanel) {
    super("settings", owner);
  }
}

// #endregion screen states
