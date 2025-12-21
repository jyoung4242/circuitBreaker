import { DefaultLoader, Engine, LoaderOptions, Screen, Util } from "excalibur";
import { I18n } from "../Lib/I18n";
// import { CACHE_VERSION } from "../../sw";

export class NewLoader extends DefaultLoader {
  _backgroundColor1: string = ` hsla(235, 35%, 29%, 1)`;
  _backgroundColor2: string = `hsla(231, 56%, 14%, 1)`;
  fadeProgressBar: boolean = false;
  progressBarOpacity: number = 1.0;
  isShowingStartingState: boolean = true;
  _locale: I18n;
  version: string = "";

  _titleFlex: HTMLDivElement | undefined;
  _UIFlex: HTMLDivElement | undefined;
  _playbutton: HTMLButtonElement | undefined;
  _titleImage: HTMLImageElement | undefined;
  _i18nWidgetDiv: HTMLDivElement | undefined;
  _attributionDiv: HTMLDivElement | undefined;
  _versionTextDiv: HTMLDivElement | undefined;
  public screen: Screen | undefined = undefined;
  _gameRootDiv: HTMLDivElement = document.createElement("div");
  _progressBarDiv: HTMLDivElement = document.createElement("div");

  i18n: I18n;

  private static _DEFAULT_LOADER_OPTIONS: LoaderOptions = {
    loadables: [],
    fullscreenAfterLoad: false,
    fullscreenContainer: undefined,
  };

  constructor(i18n: I18n) {
    super(NewLoader._DEFAULT_LOADER_OPTIONS);
    this.i18n = i18n;
    this._positionAndSizeRoot(this._gameRootDiv);
    this._createProgressBar(this._gameRootDiv);
    this._locale = i18n;
  }

  override async onUserAction(): Promise<void> {
    await Util.delay(200, this.engine?.clock);
    this.canvas.flagDirty();
    // show play button
    await this._showPlayButton();
  }

  _positionAndSizeRoot(rootDiv: HTMLDivElement) {
    //first time pass through
    if (!document.getElementById("excalibur-play-root")) {
      document.body.appendChild(rootDiv);
      rootDiv.id = "excalibur-play-root";
      rootDiv.style.position = "absolute";
      rootDiv.style.zIndex = "1000";
      rootDiv.style.background = `radial-gradient(circle,${this._backgroundColor1} 17%, ${this._backgroundColor2} 100%)`;
      this._UIFlex = this._createFlexUIContainer(rootDiv);
    }

    if (this.engine) {
      const { x: left, y: top, width: screenWidth, height: screenHeight } = this.engine.canvas.getBoundingClientRect();
      rootDiv.style.left = `${left}px`;
      rootDiv.style.top = `${top}px`;
      rootDiv.style.width = `${screenWidth}px`;
      rootDiv.style.height = `${screenHeight}px`;
    }
  }

  async _showPlayButton(): Promise<void> {
    if (!this._playbutton) this._playbutton = this._createPlayButton();
    this._playbutton.style.display = "block";
    this._playbutton.style.visibility = "hidden";
    this._playbutton.classList.add("start_button");
    await Util.delay(200, this.engine?.clock);
    // this._gameRootDiv.appendChild(this._playbutton);
    this._UIFlex?.appendChild(this._playbutton);

    let playButtonClicked: Promise<void> = new Promise<void>(resolve => {
      if (!this._playbutton) return;
      const startButtonHandler = (e: Event) => {
        if (!this._playbutton) return;
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

  onInitialize(engine: Engine): void {
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
    // this.isLocalizationInitialized = true;
  }

  onDraw(): void {
    if (this.isShowingStartingState) {
      //call progress bar code
      this._setProgress(this.progress * 100);
      if (this.progress >= 1.0) {
        this.isShowingStartingState = false;
        setTimeout(this._hideProgressBar, 1000);
      }
    }
  }

  //  ***************  DOM ELEMENT CREATION  *************** //

  private _createFlexUIContainer(rootDiv: HTMLDivElement): HTMLDivElement {
    let flexContainer = document.createElement("div");

    flexContainer.id = "flex-container";
    flexContainer.classList.add("padTop10");
    flexContainer.classList.add("padBottom10");
    flexContainer.style.height = "100%";
    flexContainer.style.width = "100%";
    flexContainer.style.display = "flex";
    flexContainer.style.alignItems = "center";
    flexContainer.style.justifyContent = "space-between";
    flexContainer.style.flexDirection = "column";

    this._createTitleFlex(flexContainer);

    rootDiv.appendChild(flexContainer);
    return flexContainer;
  }

  private _createTitleFlex(flexContainer: HTMLDivElement) {
    let titleFlex = document.createElement("div");
    titleFlex.id = "title-flex";
    titleFlex.style.display = "flex";
    titleFlex.style.flexDirection = "column";
    titleFlex.style.alignItems = "center";
    titleFlex.style.justifyContent = "flex-start";
    titleFlex.style.gap = "10px";
    titleFlex.style.width = "100%";
    titleFlex.style.height = "100%";

    this._titleFlex = titleFlex;
    flexContainer.appendChild(titleFlex);
  }

  private _createPlayButton(): HTMLButtonElement {
    const playButton = document.createElement("button");
    playButton.classList.add("play-button");
    playButton.textContent = "Play";
    return playButton;
  }

  private _createProgressBar(rootDiv: HTMLDivElement): HTMLDivElement {
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

  private _createTitleImage(titleRootDiv: HTMLDivElement): HTMLImageElement {
    const titleImage = document.createElement("img");
    titleImage.id = "title-image";
    titleImage.classList.add("title-image");
    titleImage.src = "./src/Assets/Title.png";
    titleRootDiv.appendChild(titleImage);
    return titleImage;
  }

  private _createVersionText(rootDiv: HTMLDivElement): HTMLDivElement {
    const versionText = document.createElement("div");
    versionText.id = "version-text";
    versionText.textContent = "Version: " + this.version;
    versionText.style.position = "fixed";
    versionText.style.bottom = "5px";
    versionText.style.left = "2px";

    rootDiv.appendChild(versionText);
    return versionText;
  }

  private _createI18nWidget(rootDiv: HTMLDivElement): HTMLDivElement {
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
        this._updateLocaleText(locale.country);
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

  private _createAttributeText(titleRootDiv: HTMLDivElement) {
    const extitle = document.createElement("div");
    extitle.style.width = "100%";
    extitle.style.height = "30px";
    extitle.style.textAlign = "center";
    extitle.style.display = "block";
    extitle.style.fontFamily = "BagelFat";
    extitle.style.fontSize = "18px";
    extitle.style.zIndex = "1001";
    extitle.innerText = this._locale.t("loader.attribution");
    extitle.innerText = "Created with ExcaliburJS";
    titleRootDiv.appendChild(extitle);

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

  //  ***************  CLEANUP  *************** //
  dispose() {
    this._gameRootDiv.remove();
  }

  //  ***************  UI utilities  *************** //

  initVersion() {
    if (!("serviceWorker" in navigator)) return;

    // Already controlling
    if (navigator.serviceWorker.controller) {
      this._fetchVersion();
      return;
    }

    // Wait once for control
    navigator.serviceWorker.addEventListener("controllerchange", () => this._fetchVersion(), { once: true });
  }

  private async _fetchVersion() {
    console.log("version getting fetched");

    const version = await getAppVersion();
    this.version = version ?? "";
    this._updateVersionText();
  }

  private _updateLocaleText(code: string) {
    let button = this._playbutton;
    let attribute = this._attributionDiv;

    this._locale.setLocale(code);

    if (button) button.innerText = this._locale.t("loader.button");
    if (attribute) attribute.innerText = this._locale.t("loader.attribution");

    const exIcon = document.createElement("img");
    exIcon.src = "./ex-logo.png";
    exIcon.style.position = "relative";
    exIcon.style.width = "20px";
    exIcon.style.height = "20px";
    exIcon.style.top = "4px";
    exIcon.style.left = "4px";
    if (attribute) attribute.appendChild(exIcon);
  }

  private _updateVersionText() {
    const versionText = this._versionTextDiv;
    if (versionText) versionText.textContent = "Version: " + this.version;
  }

  private _setProgress(value: number) {
    const bar = document.getElementById("loading-bar");
    const label = document.getElementById("loading-text");
    const clampedValue = Math.max(0, Math.min(100, value));
    if (!bar || !label) return;
    bar.style.width = clampedValue + "%";
    label.textContent = `LOADING... ${Math.round(clampedValue)}%`;
  }

  private _hideProgressBar = () => {
    const bar = document.getElementById("loading-container");
    bar?.classList.add("is-complete");
    setTimeout(() => {
      bar?.remove();
      this._showAllUI();
    }, 1500);
  };

  private _showAllUI = () => {
    this._playbutton!.style.visibility = "visible";
    this._attributionDiv = this._createAttributeText(this._titleFlex as HTMLDivElement);
    this._titleImage = this._createTitleImage(this._titleFlex as HTMLDivElement);
    this._i18nWidgetDiv = this._createI18nWidget(this._gameRootDiv);
    this._versionTextDiv = this._createVersionText(this._gameRootDiv);
  };
}

export function getAppVersion(): Promise<string | null> {
  return new Promise(resolve => {
    console.log("here");

    if (!navigator.serviceWorker?.controller) {
      resolve(null);
      return;
    }

    const channel = new MessageChannel();

    channel.port1.onmessage = event => {
      resolve(event.data?.version ?? null);
    };

    navigator.serviceWorker.controller.postMessage({ type: "GET_VERSION" }, [channel.port2]);
  });
}
async function getAppVersionSafe(): Promise<string | null> {
  if (!("serviceWorker" in navigator)) return null;

  // Wait until a service worker is ready
  await navigator.serviceWorker.ready;

  // If still no controller, force a reload ONCE
  if (!navigator.serviceWorker.controller) {
    console.warn("SW installed but not controlling yet, reload required");
    window.location.reload();
    return null;
  }

  return new Promise(resolve => {
    const channel = new MessageChannel();

    channel.port1.onmessage = event => {
      resolve(event.data?.version ?? null);
    };

    navigator.serviceWorker.controller!.postMessage({ type: "GET_VERSION" }, [channel.port2]);
  });
}
