/* eslint-disable no-unused-vars */

/*
TODO - make this responsive to different screen sizes
*/

import { Color, DefaultLoader, Engine, Loadable, LoaderOptions, Screen, Util } from "excalibur";
import { I18n } from "../Lib/I18n";
export class CustomLoader extends DefaultLoader {
  isLocalizationInitialized: boolean = false;
  fadeProgressBar: boolean = false;
  progressBarOpacity: number = 1.0;
  isShowingStartingState: boolean = true;

  public backgroundColor: string = "#222222";
  public loadingBarColor: Color = Color.fromHex("#FFFFFFFF");
  public screen: Screen | undefined = undefined;
  private static _DEFAULT_LOADER_OPTIONS: LoaderOptions = {
    loadables: [],
    fullscreenAfterLoad: false,
    fullscreenContainer: undefined,
  };

  //DOM Elements
  _playbutton: HTMLButtonElement;
  _gameTitleDiv: HTMLDivElement | undefined;
  _gameAttributeDiv: HTMLDivElement;
  _gameRootDiv: HTMLDivElement = document.createElement("div");
  _backgroundDiv: HTMLDivElement;
  _loadingBarDiv: HTMLDivElement;
  _dudeImageDiv: HTMLDivElement | undefined;
  _panelImageDiv: HTMLDivElement | undefined;
  _i18nWidgetDiv: HTMLDivElement | undefined;

  _locale: I18n;

  constructor(i18n: I18n, loadables?: Loadable<any>[]) {
    super(CustomLoader._DEFAULT_LOADER_OPTIONS);
    this._locale = i18n;
    //add all dom elements here
    this._positionAndSizeRoot(this._gameRootDiv);
    this._backgroundDiv = this._createBackground(this._gameRootDiv);
    this._playbutton = this._createPlayButton();
    this._gameAttributeDiv = this._createExcaliburAttribute();
    this._loadingBarDiv = this._createLoadingBar(this._gameRootDiv);

    //localization
  }

  public override onInitialize(engine: Engine): void {
    this.engine = engine;
    this.screen = engine.screen as Screen;
    this.canvas.width = this.engine.canvas.width;
    this.canvas.height = this.engine.canvas.height;
    this.screen.events.on("resize", () => {
      this.canvas.width = this.engine.canvas.width;
      this.canvas.height = this.engine.canvas.height;
    });
    if (this.engine?.browser) {
      this.engine.browser.window.on("resize", this._positionAndSizeRoot.bind(this, this._gameRootDiv));
    }
    this._positionAndSizeRoot(this._gameRootDiv);
    this.isLocalizationInitialized = true;
    this.updateLocaleText("us");
  }

  public override onDraw(ctx: CanvasRenderingContext2D) {
    if (this.isShowingStartingState) {
      //call progress bar code
      setProgress(this.progress * 100);
      if (this.progress >= 1.0) {
        setTimeout(this.hideProgressBar, 1000);
      }
    }
  }

  onUpdate(engine: Engine, elapsedMilliseconds: number): void {
    //runs before onDraw
  }

  override async onUserAction(): Promise<void> {
    await Util.delay(200, this.engine?.clock);
    this.canvas.flagDirty();
    // show play button
    await this._showPlayButton();
  }

  //***********************  */
  // These are the methods that create the DOM elements
  //***********************  */

  _createInstructions(): HTMLDivElement {
    const instructions = document.createElement("div");
    instructions.id = "excalibur-instructions";
    instructions.style.position = "absolute";
    instructions.style.width = "600px";
    instructions.style.height = "50px";
    instructions.style.bottom = "5px";
    instructions.style.left = "50%";
    instructions.style.textAlign = "center";
    instructions.style.transform = "translateX(-50%)";
    instructions.style.display = "block";
    instructions.style.fontFamily = "Black Ops One";
    instructions.style.fontSize = "15px";
    instructions.style.zIndex = "1001";

    const instructionStrings: string[] = [
      "USE EITHER YOUR GAMEPAD, KEYBOARD, MOUSE, OR TOUCH TO START",
      "PRESS START ON GAMEPAD",
      "PRESS ENTER ON KEYBOARD",
      "CLICK PLAY BUTTON WITH MOUSE",
      "TOUCH PLAY BUTTON WITH TOUCHSCREEN",
    ];
    let instructionIndex = 0;

    setInterval(() => {
      //cycle through instrucitonStrings and update innerText
      instructionIndex = (instructionIndex + 1) % instructionStrings.length;
      instructions.innerText = instructionStrings[instructionIndex];
    }, 2500);

    return instructions;
  }

  async _showPlayButton(): Promise<void> {
    this._playbutton.style.display = "block";
    await Util.delay(200, this.engine?.clock);
    this._gameRootDiv.appendChild(this._playbutton);

    let playButtonClicked: Promise<void> = new Promise<void>(resolve => {
      const startButtonHandler = (e: Event) => {
        // We want to stop propagation to keep bubbling to the engine pointer handlers
        e.stopPropagation();
        e.preventDefault();
        this._playbutton.removeEventListener("click", startButtonHandler);
        resolve();
      };
      this._playbutton.addEventListener("click", startButtonHandler);
    });

    await playButtonClicked;
    this.dispose();
    this._playbutton.style.display = "none";
  }

  _createPlayButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.id = "excalibur-play";
    button.classList.add("start_button");
    button.classList.add("hidden");
    button.innerText = this._locale.t("loader.button");
    button.style.fontSize = "48px";

    return button;
  }

  _createGameTitle(rootDiv: HTMLDivElement): HTMLDivElement {
    const title = document.createElement("div");
    const titleImage = document.createElement("img");

    title.id = "title-div";
    titleImage.id = "title-image";

    title.classList.add("title");
    title.classList.add("hidden");
    titleImage.classList.add("title-image");

    titleImage.width = 500;
    titleImage.height = 750;
    titleImage.src = "./src/Assets/Title.png";
    title.appendChild(titleImage);

    rootDiv.appendChild(title);
    return title;
  }

  _createExcaliburAttribute(): HTMLDivElement {
    //document.getElementById('excalibur-play') as HTMLButtonElement;
    const extitle = (document.getElementById("excalibur-play ") as HTMLDivElement) || document.createElement("div");
    extitle.style.position = "absolute";
    extitle.style.width = "500px";
    extitle.style.height = "100px";
    extitle.style.top = "10px";
    extitle.style.left = "50%";
    extitle.style.textAlign = "center";
    extitle.style.transform = "translateX(-50%)";
    extitle.style.display = "block";
    extitle.style.fontFamily = "BagelFat";
    extitle.style.fontSize = "18px";
    extitle.style.zIndex = "1001";
    extitle.innerText = this._locale.t("loader.attribution");
    this._gameRootDiv.appendChild(extitle);

    const exIcon = document.createElement("img");
    exIcon.src = "./ex-logo.png";
    exIcon.style.position = "relative";
    exIcon.style.width = "20px";
    exIcon.style.height = "20px";
    exIcon.style.top = "4px";
    exIcon.style.left = "4px";
    extitle.appendChild(exIcon);
    return extitle;
  }

  _positionAndSizeRoot(rootDiv: HTMLDivElement) {
    //first time pass through
    if (!document.getElementById("excalibur-play-root")) {
      document.body.appendChild(rootDiv);
      rootDiv.id = "excalibur-play-root";
      rootDiv.style.position = "absolute";
    }

    if (this.engine) {
      const { x: left, y: top, width: screenWidth, height: screenHeight } = this.engine.canvas.getBoundingClientRect();
      rootDiv.style.left = `${left}px`;
      rootDiv.style.top = `${top}px`;
      rootDiv.style.width = `${screenWidth}px`;
      rootDiv.style.height = `${screenHeight}px`;
    }
  }

  _createBackground(rootDiv: HTMLDivElement): HTMLDivElement {
    const bg = document.createElement("div");
    bg.style.position = "absolute";
    bg.style.width = "100%";
    bg.style.height = "100%";
    bg.style.top = "0px";
    bg.style.left = "0px";
    bg.style.background = `radial-gradient(circle,
    hsla(235, 35%, 29%, 1) 17%,
    hsla(231, 56%, 14%, 1) 100%)`;
    bg.style.zIndex = "1000";
    rootDiv.appendChild(bg);
    return bg;
  }

  _createLoadingBar(rootDiv: HTMLDivElement): HTMLDivElement {
    const loadingContainer = document.createElement("div");
    const loadingWrapper = document.createElement("div");
    const loadingBar = document.createElement("div");
    const loadingText = document.createElement("div");

    loadingContainer.id = "loading-container";
    loadingWrapper.id = "loading-wrapper";
    loadingBar.id = "loading-bar";
    loadingText.id = "loading-text";

    loadingContainer.classList.add("loading-container");
    loadingWrapper.classList.add("loading-wrapper");
    loadingBar.classList.add("loading-bar");
    loadingText.classList.add("loading-text");

    loadingContainer.appendChild(loadingWrapper);
    loadingWrapper.appendChild(loadingBar);
    loadingContainer.appendChild(loadingText);

    rootDiv.appendChild(loadingContainer);

    return loadingContainer;
  }

  _createDudeImagePanel(rootDiv: HTMLDivElement): HTMLDivElement {
    const dudeImagePanel = document.createElement("div");
    const dudeImage = document.createElement("img");

    dudeImagePanel.id = "dude-image-panel";
    dudeImage.id = "dude-image";

    dudeImagePanel.classList.add("dude-image-panel");
    dudeImage.classList.add("dude-image");

    dudeImage.width = 500;
    dudeImage.height = 750;
    dudeImage.src = "./src/Assets/electrician.png";

    dudeImagePanel.appendChild(dudeImage);
    rootDiv.appendChild(dudeImagePanel);
    return dudeImagePanel;
  }

  _createi18nWidget(rootDiv: HTMLDivElement): HTMLDivElement {
    const widget = document.createElement("div");
    widget.id = "i18n-widget";
    widget.classList.add("i18n-widget");
    widget.setAttribute("role", "listbox");
    widget.setAttribute("aria-label", "Select language");
    widget.tabIndex = 0;

    // Define supported locales with ISO 3166-1-alpha-2 codes
    const locales = [
      { code: "en-US", country: "us" },
      { code: "es-ES", country: "es" },
      { code: "fr-FR", country: "fr" },
      { code: "de-DE", country: "de" },
      //   { code: "ja-JP", country: "jp" },
    ];

    // Current selected flag
    const selectedFlag = document.createElement("span");
    selectedFlag.classList.add("fi", "fi-us"); // default
    widget.appendChild(selectedFlag);

    // Dropdown container
    const dropdown = document.createElement("div");
    dropdown.classList.add("i18n-dropdown");
    dropdown.style.display = "none";

    locales.forEach(locale => {
      const option = document.createElement("div");
      option.classList.add("i18n-option");
      option.dataset.locale = locale.code;
      option.setAttribute("role", "option");

      const flag = document.createElement("span");
      flag.classList.add("fi", `fi-${locale.country}`);
      option.appendChild(flag);

      option.addEventListener("click", () => {
        selectedFlag.className = `fi fi-${locale.country}`;
        dropdown.style.display = "none";
        // change language here
        this.updateLocaleText(locale.country);
      });

      dropdown.appendChild(option);
    });

    widget.appendChild(dropdown);

    // Toggle dropdown
    widget.addEventListener("click", e => {
      if (e.target === widget || e.target === selectedFlag) {
        dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
      }
    });

    // Close on outside click
    document.addEventListener("click", e => {
      if (!widget.contains(e.target as Node)) {
        dropdown.style.display = "none";
      }
    });

    rootDiv.appendChild(widget);
    return widget;
  }

  _createPanelImagePanel(rootDiv: HTMLDivElement): HTMLDivElement {
    const panelImagePanel = document.createElement("div");
    const panelImage = document.createElement("img");

    panelImagePanel.id = "panel-image-panel";
    panelImage.id = "panel-image";

    panelImagePanel.classList.add("panel-image-panel");
    panelImage.classList.add("panel-image");

    panelImage.width = 500;
    panelImage.height = 750;
    panelImage.src = "./src/Assets/electrical panel.png";

    panelImagePanel.appendChild(panelImage);
    rootDiv.appendChild(panelImagePanel);
    return panelImagePanel;
  }

  dispose() {
    this._gameRootDiv.remove();
  }

  hideProgressBar = () => {
    if (!this.isShowingStartingState) return;
    const bar = document.getElementById("loading-container");
    const startButton = document.getElementById("excalibur-play");
    bar?.classList.add("is-complete");
    startButton?.classList.remove("hidden");
    this._createGameTitle(this._gameRootDiv);
    this._dudeImageDiv = this._createDudeImagePanel(this._gameRootDiv);
    this._panelImageDiv = this._createPanelImagePanel(this._gameRootDiv);
    this._i18nWidgetDiv = this._createi18nWidget(this._gameRootDiv);
    this.isShowingStartingState = false;
  };

  updateLocaleText(code: string) {
    let button = this._playbutton;
    let attribute = this._gameAttributeDiv;

    this._locale.setLocale(code);

    button.innerText = this._locale.t("loader.button");
    attribute.innerText = this._locale.t("loader.attribution");

    const exIcon = document.createElement("img");
    exIcon.src = "./ex-logo.png";
    exIcon.style.position = "relative";
    exIcon.style.width = "20px";
    exIcon.style.height = "20px";
    exIcon.style.top = "4px";
    exIcon.style.left = "4px";
    attribute.appendChild(exIcon);
  }
}

function setProgress(value: number) {
  const bar = document.getElementById("loading-bar");
  const label = document.getElementById("loading-text");
  const clampedValue = Math.max(0, Math.min(100, value));
  if (!bar || !label) return;
  bar.style.width = clampedValue + "%";
  label.textContent = `LOADING... ${Math.round(clampedValue)}%`;
}

function setLoaderLocale(locale: string) {
  const loader = document.getElementById("loader");
  if (!loader) return;
  loader.dataset.locale = locale;
}
