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
  navigator.serviceWorker
    .register("/sw.js")
    .then(reg => {
      alert("SW registered!");

      // Wait for SW to be ready
      navigator.serviceWorker.ready.then(async () => {
        alert("SW is ready");

        // Check if we have a controller
        if (!navigator.serviceWorker.controller) {
          alert("No controller - will work after refresh");
          return;
        }

        // Try to get version
        const messageChannel = new MessageChannel();

        messageChannel.port1.onmessage = event => {
          if (event.data && event.data.version) {
            alert("SW Version: " + event.data.version);
          } else {
            alert("Got message but no version: " + JSON.stringify(event.data));
          }
        };

        // Send message
        navigator.serviceWorker.controller.postMessage({ type: "GET_VERSION" }, [messageChannel.port2]);

        // Timeout
        setTimeout(() => {
          alert("Version fetch timed out - no response from SW");
        }, 3000);
      });
    })
    .catch(err => {
      alert("SW registration failed: " + err.message);
    });
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
