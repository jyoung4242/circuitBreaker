import { Color, Engine, ExcaliburGraphicsContext, Graphic, Material, ScreenElement, vec, Vector } from "excalibur";
import { harmony, lightness, triad } from "simpler-color";
import { electrified } from "../Shaders/electrified";

type PanelColors = {
  border: string; // outer border
  highlight: string; // top/left bevel
  shadow: string; // bottom/right bevel
  center: string; // panel face
  accent: string;
};

export class GridTile extends ScreenElement {
  electMat: Material | null = null;
  tilesize: number;
  constructor(pos: Vector, size: Vector) {
    let startingpos = pos.sub(size.scale(vec(0.5, 0.5)));
    super({ pos: startingpos, anchor: Vector.Zero, width: size.x, height: size.y });
    this.tilesize = size.x;
  }
  onInitialize(eng: Engine): void {
    this.electMat = eng.graphicsContext.createMaterial({
      fragmentSource: electrified,
    });

    let baseColors = harmony(Color.random().toString());
    console.log(baseColors);

    this.graphics.use(
      new TileGraphic(this.tilesize, [
        baseColors.secondary,
        baseColors.accent,
        baseColors.accent,
        baseColors.primary,
        baseColors.accent,
      ])
    );
    // this.graphics.material = this.electMat;
  }
}

export class TileGraphic extends Graphic {
  size: number;
  colors: string[];

  offscreenCanvas: HTMLCanvasElement;
  wireCanvas: HTMLCanvasElement;

  constructor(size: number, colors: string[]) {
    super();
    let pnlColor: PanelColors = {
      border: colors[0],
      highlight: colors[1],
      shadow: colors[2],
      center: colors[3],
      accent: colors[4],
    };
    this.offscreenCanvas = generatePanelTile(size, pnlColor, size / 18);
    this.wireCanvas = generateStraightWire(size, size / 15, triad(pnlColor.accent, 1));

    this.size = size;
    this.colors = colors;
  }

  clone(): Graphic {
    return new TileGraphic(this.size, this.colors);
  }

  protected _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void {
    ex.drawImage(this.offscreenCanvas, x, y);
    ex.drawImage(this.wireCanvas, x, y);
  }
}

export function generatePanelTile(size: number, colors: PanelColors, borderSize = 1): HTMLCanvasElement {
  if (size < 4) {
    throw new Error("Tile size too small for panel styling");
  }

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get 2D context");
  }

  ctx.imageSmoothingEnabled = false;

  // === Randomized bevel thickness ===
  const maxBevel = Math.max(1, Math.floor(size / 15));
  const bevelSize = Math.floor(Math.random() * maxBevel) + 1;

  // === Outer border ===
  ctx.fillStyle = colors.border.toString();
  ctx.fillRect(0, 0, size, size);

  // === Center panel ===
  const inner = borderSize;
  const innerSize = size - inner * 2;

  ctx.fillStyle = colors.center.toString();
  ctx.fillRect(inner, inner, innerSize, innerSize);

  // === Bevel highlight (top + left) ===
  ctx.fillStyle = colors.highlight.toString();

  // Top
  ctx.fillRect(inner, inner, innerSize, bevelSize);

  // Left
  ctx.fillRect(inner, inner, bevelSize, innerSize);

  // === Bevel shadow (bottom + right) ===
  ctx.fillStyle = colors.shadow.toString();

  // Bottom
  ctx.fillRect(inner, size - inner - bevelSize, innerSize, bevelSize);

  // Right
  ctx.fillRect(size - inner - bevelSize, inner, bevelSize, innerSize);

  return canvas;
}

export function generateStraightWire(tilesize: number, bordersize: number, color: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = tilesize;
  canvas.height = tilesize;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get 2D context");
  }

  ctx.imageSmoothingEnabled = false;
  let wiresize = tilesize / 8;

  let lighterColor = lightness(color, 60);
  let lighterColor2 = lightness(color, 70);
  let darkerColor = lightness(color, 40);
  let darkerColor2 = lightness(color, 30);

  ctx.fillStyle = lighterColor;
  ctx.fillRect(tilesize / 2 - wiresize / 2, bordersize, wiresize / 2, tilesize - bordersize * 2);
  ctx.fillStyle = darkerColor;
  ctx.fillRect(tilesize / 2 + wiresize / 2, bordersize, wiresize / 2, tilesize - bordersize * 2);
  wiresize = wiresize / 2;
  ctx.fillStyle = color;
  ctx.fillRect(tilesize / 2 - wiresize / 2, bordersize, wiresize, tilesize - bordersize * 2);
  ctx.fillStyle = lighterColor2;
  ctx.fillRect(tilesize / 2 - wiresize / 2, bordersize, wiresize / 2, tilesize - bordersize * 2);
  ctx.fillStyle = darkerColor2;
  ctx.fillRect(tilesize / 2 + wiresize / 2, bordersize, wiresize / 2, tilesize - bordersize * 2);

  return canvas;
}

export function generateLWire(tilesize: number, bordersize: number, color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = tilesize;
  canvas.height = tilesize;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get 2D context");
  }

  ctx.imageSmoothingEnabled = false;

  let wiresize = tilesize / 8;
  const half = tilesize / 2;

  let lighterColor = lightness(color, 60);
  let lighterColor2 = lightness(color, 70);
  let darkerColor = lightness(color, 40);
  let darkerColor2 = lightness(color, 30);

  // First layer - full wiresize width
  // Vertical segment (down) - lighter LEFT, darker RIGHT
  ctx.fillStyle = lighterColor;
  ctx.fillRect(half - wiresize / 2, half, wiresize / 2, half - bordersize);
  ctx.fillStyle = darkerColor;
  ctx.fillRect(half, half, wiresize / 2, half - bordersize);

  // Horizontal segment (right) - lighter TOP, darker BOTTOM
  ctx.fillStyle = lighterColor;
  ctx.fillRect(half, half - wiresize / 2, half - bordersize, wiresize / 2);
  ctx.fillStyle = darkerColor;
  ctx.fillRect(half, half, half - bordersize, wiresize / 2);

  // Corner - top-left is lighter, bottom-right is darker
  ctx.fillStyle = lighterColor;
  ctx.fillRect(half - wiresize / 2, half - wiresize / 2, wiresize / 2, wiresize / 2);
  ctx.fillStyle = darkerColor;
  ctx.fillRect(half, half, wiresize / 2, wiresize / 2);

  // Second layer - half wiresize width
  wiresize = wiresize / 2;

  // Vertical segment
  ctx.fillStyle = color;
  ctx.fillRect(half - wiresize / 2, half, wiresize, half - bordersize);
  ctx.fillStyle = lighterColor2;
  ctx.fillRect(half - wiresize / 2, half - wiresize / 2, wiresize / 2, half - bordersize + wiresize / 2);
  ctx.fillStyle = darkerColor2;
  ctx.fillRect(half, half, wiresize / 2, half - bordersize);

  // Horizontal segment
  ctx.fillStyle = color;
  ctx.fillRect(half, half - wiresize / 2, half - bordersize, wiresize);
  ctx.fillStyle = lighterColor2;
  ctx.fillRect(half, half - wiresize / 2, half - bordersize, wiresize / 2);
  ctx.fillStyle = darkerColor2;
  ctx.fillRect(half, half, half - bordersize, wiresize / 2);
  return canvas;
}

export function generateTWire(tilesize: number, bordersize: number, color: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = tilesize;
  canvas.height = tilesize;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get 2D context");
  }

  ctx.imageSmoothingEnabled = false;

  let wiresize = tilesize / 8;
  const half = tilesize / 2;

  let lighterColor = lightness(color, 60);
  let lighterColor2 = lightness(color, 70);
  let darkerColor = lightness(color, 40);
  let darkerColor2 = lightness(color, 30);

  // First layer - full wiresize width
  // Vertical segment (down from center) - lighter LEFT, darker RIGHT
  ctx.fillStyle = lighterColor;
  ctx.fillRect(half - wiresize / 2, half, wiresize / 2, half - bordersize);
  ctx.fillStyle = darkerColor;
  ctx.fillRect(half, half, wiresize / 2, half - bordersize);

  // Horizontal segment (left from center) - lighter TOP, darker BOTTOM
  ctx.fillStyle = lighterColor;
  ctx.fillRect(bordersize, half - wiresize / 2, half - bordersize, wiresize / 2);
  ctx.fillStyle = darkerColor;
  ctx.fillRect(bordersize, half, half - bordersize, wiresize / 2);

  // Horizontal segment (right from center) - lighter TOP, darker BOTTOM
  ctx.fillStyle = lighterColor;
  ctx.fillRect(half, half - wiresize / 2, half - bordersize, wiresize / 2);
  ctx.fillStyle = darkerColor;
  ctx.fillRect(half, half, half - bordersize, wiresize / 2);

  // Center junction - split diagonally
  ctx.fillStyle = lighterColor;
  ctx.fillRect(half - wiresize / 2, half - wiresize / 2, wiresize / 2, wiresize / 2);
  ctx.fillStyle = darkerColor;
  ctx.fillRect(half, half, wiresize / 2, wiresize / 2);

  // Second layer - half wiresize width
  wiresize = wiresize / 2;

  // Vertical segment
  ctx.fillStyle = color;
  ctx.fillRect(half - wiresize / 2, half, wiresize, half - bordersize);
  ctx.fillStyle = lighterColor2;
  ctx.fillRect(half - wiresize / 2, half, wiresize / 2, half - bordersize);
  ctx.fillStyle = darkerColor2;
  ctx.fillRect(half, half, wiresize / 2, half - bordersize);

  // Horizontal segment (left)
  ctx.fillStyle = color;
  ctx.fillRect(bordersize, half - wiresize / 2, half - bordersize, wiresize);
  ctx.fillStyle = lighterColor2;
  ctx.fillRect(bordersize, half - wiresize / 2, half - bordersize, wiresize / 2);
  ctx.fillStyle = darkerColor2;
  ctx.fillRect(bordersize, half, half - bordersize, wiresize / 2);

  // Horizontal segment (right)
  ctx.fillStyle = color;
  ctx.fillRect(half, half - wiresize / 2, half - bordersize, wiresize);
  ctx.fillStyle = lighterColor2;
  ctx.fillRect(half, half - wiresize / 2, half - bordersize, wiresize / 2);
  ctx.fillStyle = darkerColor2;
  ctx.fillRect(half, half, half - bordersize, wiresize / 2);

  // Center junction refinement
  ctx.fillStyle = lighterColor2;
  ctx.fillRect(half - wiresize / 2, half - wiresize / 2, wiresize / 2, wiresize / 2);
  ctx.fillStyle = darkerColor2;
  ctx.fillRect(half, half, wiresize / 2, wiresize / 2);

  return canvas;
}

export function generateCrossWire(tilesize: number, bordersize: number, color: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = tilesize;
  canvas.height = tilesize;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get 2D context");
  }

  ctx.imageSmoothingEnabled = false;

  let wiresize = tilesize / 8;
  const half = tilesize / 2;

  let lighterColor = lightness(color, 60);
  let lighterColor2 = lightness(color, 70);
  let darkerColor = lightness(color, 40);
  let darkerColor2 = lightness(color, 30);

  // First layer - full wiresize width
  // Vertical segment (up from center) - lighter LEFT, darker RIGHT
  ctx.fillStyle = lighterColor;
  ctx.fillRect(half - wiresize / 2, bordersize, wiresize / 2, half - bordersize);
  ctx.fillStyle = darkerColor;
  ctx.fillRect(half, bordersize, wiresize / 2, half - bordersize);

  // Vertical segment (down from center) - lighter LEFT, darker RIGHT
  ctx.fillStyle = lighterColor;
  ctx.fillRect(half - wiresize / 2, half, wiresize / 2, half - bordersize);
  ctx.fillStyle = darkerColor;
  ctx.fillRect(half, half, wiresize / 2, half - bordersize);

  // Horizontal segment (left from center) - lighter TOP, darker BOTTOM
  ctx.fillStyle = lighterColor;
  ctx.fillRect(bordersize, half - wiresize / 2, half - bordersize, wiresize / 2);
  ctx.fillStyle = darkerColor;
  ctx.fillRect(bordersize, half, half - bordersize, wiresize / 2);

  // Horizontal segment (right from center) - lighter TOP, darker BOTTOM
  ctx.fillStyle = lighterColor;
  ctx.fillRect(half, half - wiresize / 2, half - bordersize, wiresize / 2);
  ctx.fillStyle = darkerColor;
  ctx.fillRect(half, half, half - bordersize, wiresize / 2);

  // Center junction - split diagonally
  ctx.fillStyle = lighterColor;
  ctx.fillRect(half - wiresize / 2, half - wiresize / 2, wiresize / 2, wiresize / 2);
  ctx.fillStyle = darkerColor;
  ctx.fillRect(half, half, wiresize / 2, wiresize / 2);

  // Second layer - half wiresize width
  wiresize = wiresize / 2;

  // Vertical segment (up)
  ctx.fillStyle = color;
  ctx.fillRect(half - wiresize / 2, bordersize, wiresize, half - bordersize);
  ctx.fillStyle = lighterColor2;
  ctx.fillRect(half - wiresize / 2, bordersize, wiresize / 2, half - bordersize);
  ctx.fillStyle = darkerColor2;
  ctx.fillRect(half, bordersize, wiresize / 2, half - bordersize);

  // Vertical segment (down)
  ctx.fillStyle = color;
  ctx.fillRect(half - wiresize / 2, half, wiresize, half - bordersize);
  ctx.fillStyle = lighterColor2;
  ctx.fillRect(half - wiresize / 2, half, wiresize / 2, half - bordersize);
  ctx.fillStyle = darkerColor2;
  ctx.fillRect(half, half, wiresize / 2, half - bordersize);

  // Horizontal segment (left)
  ctx.fillStyle = color;
  ctx.fillRect(bordersize, half - wiresize / 2, half - bordersize, wiresize);
  ctx.fillStyle = lighterColor2;
  ctx.fillRect(bordersize, half - wiresize / 2, half - bordersize, wiresize / 2);
  ctx.fillStyle = darkerColor2;
  ctx.fillRect(bordersize, half, half - bordersize, wiresize / 2);

  // Horizontal segment (right)
  ctx.fillStyle = color;
  ctx.fillRect(half, half - wiresize / 2, half - bordersize, wiresize);
  ctx.fillStyle = lighterColor2;
  ctx.fillRect(half, half - wiresize / 2, half - bordersize, wiresize / 2);
  ctx.fillStyle = darkerColor2;
  ctx.fillRect(half, half, half - bordersize, wiresize / 2);

  // Center junction refinement
  ctx.fillStyle = lighterColor2;
  ctx.fillRect(half - wiresize / 2, half - wiresize / 2, wiresize / 2, wiresize / 2);
  ctx.fillStyle = darkerColor2;
  ctx.fillRect(half, half, wiresize / 2, wiresize / 2);

  return canvas;
}

export function generateCrossoverWire(tilesize: number, bordersize: number, color: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = tilesize;
  canvas.height = tilesize;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get 2D context");
  }

  ctx.imageSmoothingEnabled = false;

  let wiresize = tilesize / 8;
  const half = tilesize / 2;

  let lighterColor3 = lightness(color, 45);
  let lighterColor5 = lightness(color, 30);
  let darkerColor3 = lightness(color, 20);
  let darkerColor4 = lightness(color, 10);

  // Horizontal wire (left-right) - drawn first (goes "under")
  // First layer - full wiresize
  ctx.fillStyle = lighterColor5;
  ctx.fillRect(bordersize, half - wiresize / 2, tilesize - bordersize * 2, wiresize / 2);
  ctx.fillStyle = darkerColor3;
  ctx.fillRect(bordersize, half, tilesize - bordersize * 2, wiresize / 2);

  // Second layer - half wiresize
  let halfWire = wiresize / 2;
  ctx.fillStyle = lighterColor5;
  ctx.fillRect(bordersize, half - halfWire / 2, tilesize - bordersize * 2, halfWire);
  ctx.fillStyle = lighterColor3;
  ctx.fillRect(bordersize, half - halfWire / 2, tilesize - bordersize * 2, halfWire / 2);
  ctx.fillStyle = darkerColor4;
  ctx.fillRect(bordersize, half, tilesize - bordersize * 2, halfWire / 2);

  // Small gap in the middle of horizontal wire
  const gapSize = halfWire * 0.8;
  ctx.clearRect(half - gapSize / 2, half - halfWire / 2, gapSize, halfWire);

  // Vertical wire (top-bottom) - drawn second (goes "over")
  // Use slightly brighter colors for the top wire
  let vLighterColor = lightness(color, 70);
  let vLighterColor2 = lightness(color, 80);
  let vDarkerColor = lightness(color, 40);
  let vDarkerColor2 = lightness(color, 32);

  // First layer - full wiresize
  ctx.fillStyle = vLighterColor;
  ctx.fillRect(half - wiresize / 2, bordersize, wiresize / 2, tilesize - bordersize * 2);
  ctx.fillStyle = vDarkerColor;
  ctx.fillRect(half, bordersize, wiresize / 2, tilesize - bordersize * 2);

  // Second layer - half wiresize
  ctx.fillStyle = color;
  ctx.fillRect(half - halfWire / 2, bordersize, halfWire, tilesize - bordersize * 2);
  ctx.fillStyle = vLighterColor2;
  ctx.fillRect(half - halfWire / 2, bordersize, halfWire / 2, tilesize - bordersize * 2);
  ctx.fillStyle = vDarkerColor2;
  ctx.fillRect(half, bordersize, halfWire / 2, tilesize - bordersize * 2);

  // Add subtle shadow on the horizontal wire where vertical crosses
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  ctx.fillRect(half - gapSize / 2, half - halfWire / 2 - 1, gapSize, 1);

  return canvas;
}

export function generateDeadEndWire(tilesize: number, bordersize: number, color: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = tilesize;
  canvas.height = tilesize;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get 2D context");
  }

  ctx.imageSmoothingEnabled = false;
  let wiresize = tilesize / 8;
  const half = tilesize / 2;

  let lighterColor = lightness(color, 60);
  let lighterColor2 = lightness(color, 70);
  let darkerColor = lightness(color, 40);
  let darkerColor2 = lightness(color, 30);

  // Draw wire from bottom to middle
  // First layer
  ctx.fillStyle = lighterColor;
  ctx.fillRect(half - wiresize / 2, half, wiresize / 2, half - bordersize);
  ctx.fillStyle = darkerColor;
  ctx.fillRect(half, half, wiresize / 2, half - bordersize);

  // Second layer
  let halfWire = wiresize / 2;
  ctx.fillStyle = color;
  ctx.fillRect(half - halfWire / 2, half, halfWire, half - bordersize);
  ctx.fillStyle = lighterColor2;
  ctx.fillRect(half - halfWire / 2, half, halfWire / 2, half - bordersize);
  ctx.fillStyle = darkerColor2;
  ctx.fillRect(half, half, halfWire / 2, half - bordersize);

  // --- Endcap ---
  const wireTopY = half;
  const capRadiusOuter = wiresize / 2;
  const capRadiusInner = halfWire / 2;

  // Outer cap (light / dark split)
  ctx.beginPath();
  ctx.arc(half, wireTopY, capRadiusOuter, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = lighterColor;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(half, wireTopY, capRadiusOuter, 0, Math.PI);
  ctx.closePath();
  ctx.fillStyle = darkerColor;
  ctx.fill();

  // Inner cap
  ctx.beginPath();
  ctx.arc(half, wireTopY, capRadiusInner, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  // Highlight
  ctx.beginPath();
  ctx.arc(half, wireTopY, capRadiusInner, Math.PI, Math.PI * 1.5);
  ctx.strokeStyle = lighterColor2;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Shadow
  ctx.beginPath();
  ctx.arc(half, wireTopY, capRadiusInner, Math.PI * 1.5, Math.PI * 2);
  ctx.strokeStyle = darkerColor2;
  ctx.lineWidth = 1;
  ctx.stroke();

  return canvas;
}
