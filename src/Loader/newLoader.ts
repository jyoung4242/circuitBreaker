import { DefaultLoader, Engine, LoaderOptions, Screen, Util } from "excalibur";
import { I18n } from "../Lib/I18n";

export class NewLoader extends DefaultLoader {
  _backgroundColor1: string = ` hsla(235, 35%, 29%, 1)`;
  _backgroundColor2: string = `hsla(231, 56%, 14%, 1)`;
  fadeProgressBar: boolean = false;
  progressBarOpacity: number = 1.0;
  isShowingStartingState: boolean = true;

  _playbutton: HTMLButtonElement | undefined;
  _titleImage: HTMLImageElement | undefined;
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
  }

  override async onUserAction(): Promise<void> {
    console.trace();

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
    this._gameRootDiv.appendChild(this._playbutton);

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

  private _createTitleImage(rootDiv: HTMLDivElement): HTMLImageElement {
    const titleImage = document.createElement("img");
    titleImage.id = "title-image";
    titleImage.classList.add("title-image");
    titleImage.src = "./src/Assets/Title.png";
    rootDiv.appendChild(titleImage);
    return titleImage;
  }

  //  ***************  CLEANUP  *************** //
  dispose() {
    this._gameRootDiv.remove();
  }

  //  ***************  UI utilities  *************** //

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
    this._titleImage = this._createTitleImage(this._gameRootDiv);
  };
}
