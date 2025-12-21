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
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").then(reg => {
    console.log("SW registered");
  });

  // Just reload manually the first time
  if (!navigator.serviceWorker.controller) {
    console.log("No controller - refresh the page once manually");
  }
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
