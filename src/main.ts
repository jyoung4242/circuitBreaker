// main.ts
import "./style.css";

import { UI } from "@peasy-lib/peasy-ui";
import { Engine, DisplayMode, Color } from "excalibur";
import { model, template } from "./UI/UI";
// import {
//   drawComparison,
//   drawComparisonSimple,
//   fullDebugSession,
//   LevelGenerator,
//   printValidationReport,
//   solvePuzzle,
//   testGeneration,
//   validateLevel,
// } from "./Lib/LevelGen";

import { i18n, loader } from "./resources";
import { HomeScene } from "./Scenes/Home";
import { GameScene } from "./Scenes/Game";

await UI.create(document.body, model, template).attached;
// In your main.ts or wherever you register the SW
if ("serviceWorker" in navigator) {
  // navigator.serviceWorker
  //   .register("/sw.js")
  //   .then(reg => {
  //     // Wait for SW to be ready
  //     navigator.serviceWorker.ready.then(async () => {
  //       // Check if we have a controller
  //       if (!navigator.serviceWorker.controller) {
  //         return;
  //       }
  //       // Try to get version
  //       const messageChannel = new MessageChannel();
  //       messageChannel.port1.onmessage = () => {};
  //       // Send message
  //       navigator.serviceWorker.controller.postMessage({ type: "GET_VERSION" }, [messageChannel.port2]);
  //       // Timeout
  //       setTimeout(() => {}, 3000);
  //     });
  //   })
  //   .catch(err => {});
}

const game = new Engine({
  width: 500, // the width of the canvas
  height: 750, // the height of the canvas
  canvasElementId: "cnv", // the DOM canvas element ID, if you are providing your own
  displayMode: DisplayMode.FitScreen, // the display mode
  pixelArt: true,
  scenes: {
    home: new HomeScene(i18n),
    game: new GameScene(),
  },
  backgroundColor: Color.fromHex("#21264e"),
});

await game.start(loader);
game.goToScene("home");
