// main.ts
import "./style.css";

import { UI } from "@peasy-lib/peasy-ui";
import { Engine, DisplayMode, vec } from "excalibur";
import { model, template } from "./UI/UI";
import {
  drawComparison,
  drawComparisonSimple,
  fullDebugSession,
  LevelGenerator,
  printValidationReport,
  solvePuzzle,
  testGeneration,
  validateLevel,
} from "./Lib/LevelGen";
import { GridTile } from "./Actors/GridTile";

await UI.create(document.body, model, template).attached;

const game = new Engine({
  width: 500, // the width of the canvas
  height: 750, // the height of the canvas
  canvasElementId: "cnv", // the DOM canvas element ID, if you are providing your own
  displayMode: DisplayMode.Fixed, // the display mode
  pixelArt: true,
});

await game.start();

// const generator = new LevelGenerator();
/*
// Test a single level with full debug info
fullDebugSession("medium", 12345);

// Test multiple generations
testGeneration("easy", 20);

// Quick validation
const level = generator.generateLevel("hard");
const validation = validateLevel(level);
console.log(printValidationReport(validation));
console.log(drawComparison(level));
console.log(drawComparisonSimple(level));

// Check if specific level is solvable
const solveResult = solvePuzzle(level);
console.log(solveResult.message);
*/
let tile = new GridTile(game.screen.center, vec(300, 300));
game.add(tile);
