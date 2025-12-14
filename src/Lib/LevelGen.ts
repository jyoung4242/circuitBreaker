/* eslint-disable no-unused-vars */

import { Random } from "excalibur";

// ============================================================================
// TYPES AND ENUMS
// ============================================================================

/**
 * Cardinal directions represented as bit flags for efficient connection storage
 */
export enum Direction {
  North = 1 << 0, // 0001
  East = 1 << 1, // 0010
  South = 1 << 2, // 0100
  West = 1 << 3, // 1000
  error = 0,
}

/**
 * Tile types available in the game
 */
export enum TileType {
  Straight = "straight", // Two opposite sides connected
  Corner = "corner", // Two adjacent sides connected (L-shape)
  TJunction = "t-junction", // Three sides connected
  FourWay = "four-way", // All four sides connected
  CrissCross = "criss-cross", // Two separate connections (N-S and E-W)
  ColorChanger = "color-changer", // Changes signal color
  Empty = "empty", // No connections
}

/**
 * Difficulty levels affecting path length and complexity
 */
export type Difficulty = "easy" | "medium" | "hard" | "superHard";

/**
 * Signal color for multi-color puzzles
 */
export type SignalColor = "red" | "blue" | "green" | "yellow" | "white";

export type SolutionPath = { x: number; y: number; dir: Direction }[];
export type SolutionPathSegment = { x: number; y: number; dir: Direction };

// ============================================================================
// TILE DEFINITIONS
// ============================================================================

/**
 * Defines a tile's connectivity pattern and behavior
 */
export interface TileDefinition {
  type: TileType;
  /** Bitmask of connected directions in base (0°) rotation */
  baseConnections: number;
  /** Whether this tile can be rotated by the player */
  rotatable: boolean;
  /** For criss-cross tiles: separate connection groups */
  connectionGroups?: number[][];
  /** If this tile changes signal color */
  colorChange?: { from: SignalColor; to: SignalColor };
}

/**
 * A tile instance in the grid with its current rotation
 */
export interface Tile {
  definition: TileDefinition;
  /** Rotation in degrees (0, 90, 180, 270) */
  rotation: number;
  /** Whether this specific tile instance is fixed (can override definition) */
  fixed: boolean;
  /** Position in grid for reference */
  x: number;
  y: number;
}

// ============================================================================
// TILE LIBRARY
// ============================================================================

/**
 * Pre-defined tile types with their connection patterns
 */
export const TILE_DEFINITIONS: Record<TileType, TileDefinition> = {
  [TileType.Straight]: {
    type: TileType.Straight,
    baseConnections: Direction.North | Direction.South,
    rotatable: true,
  },
  [TileType.Corner]: {
    type: TileType.Corner,
    baseConnections: Direction.North | Direction.East,
    rotatable: true,
  },
  [TileType.TJunction]: {
    type: TileType.TJunction,
    baseConnections: Direction.North | Direction.East | Direction.West,
    rotatable: true,
  },
  [TileType.FourWay]: {
    type: TileType.FourWay,
    baseConnections: Direction.North | Direction.East | Direction.South | Direction.West,
    rotatable: false, // No point rotating a 4-way junction
  },
  [TileType.CrissCross]: {
    type: TileType.CrissCross,
    baseConnections: Direction.North | Direction.East | Direction.South | Direction.West,
    rotatable: false,
    // Two separate groups: North-South and East-West
    connectionGroups: [
      [Direction.North, Direction.South],
      [Direction.East, Direction.West],
    ],
  },
  [TileType.ColorChanger]: {
    type: TileType.ColorChanger,
    baseConnections: Direction.North | Direction.South,
    rotatable: true,
    colorChange: { from: "white", to: "blue" },
  },
  [TileType.Empty]: {
    type: TileType.Empty,
    baseConnections: 0,
    rotatable: false,
  },
};

// ============================================================================
// LEVEL OPTIONS AND OUTPUT
// ============================================================================

export interface LevelOptions {
  gridWidth?: number;
  gridHeight?: number;
  allowedTileTypes?: TileType[];
  requiredTileTypes?: TileType[];
  minPathLength?: number;
  maxPathLength?: number;
  allowFixedTiles?: boolean;
  seed?: number;
}

export interface GeneratedLevel {
  grid: Tile[][];
  startPos: { x: number; y: number };
  endPos: { x: number; y: number };
  solvedPathLength: number;
  metadata: {
    difficulty: Difficulty;
    gridWidth: number;
    gridHeight: number;
    tileTypes: TileType[];
    fixedTileCount: number;
    generationAttempts: number;
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Rotate a direction bitmask by 90° clockwise
 */
function rotateConnections(connections: number, rotations: number): number {
  let result = connections;
  for (let i = 0; i < rotations; i++) {
    const north = !!(result & Direction.North);
    const east = !!(result & Direction.East);
    const south = !!(result & Direction.South);
    const west = !!(result & Direction.West);

    result = 0;
    if (north) result |= Direction.East;
    if (east) result |= Direction.South;
    if (south) result |= Direction.West;
    if (west) result |= Direction.North;
  }
  return result;
}

/**
 * Get connections for a tile at its current rotation
 */
function getTileConnections(tile: Tile): number {
  const rotations = tile.rotation / 90;
  return rotateConnections(tile.definition.baseConnections, rotations);
}

/**
 * Get the opposite direction
 */
function oppositeDirection(dir: Direction): Direction | -1 {
  switch (dir) {
    case Direction.North:
      return Direction.South;
    case Direction.South:
      return Direction.North;
    case Direction.East:
      return Direction.West;
    case Direction.West:
      return Direction.East;
    default:
      return -1;
  }
}

/**
 * Simple seeded random number generator (LCG)
 */
class SeededRandom {
  private seed: number;
  rng: Random;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
    this.rng = new Random(this.seed);
  }

  next(): number {
    return this.rng.next();
  }

  nextInt(min: number, max: number): number {
    return this.rng.integer(min, max);
  }

  shuffle<T>(array: T[]): T[] {
    return this.rng.shuffle(array);
  }

  float(min: number, max: number): number {
    return this.rng.floating(min, max);
  }
}

// ============================================================================
// DIFFICULTY CONFIGURATION
// ============================================================================

interface DifficultyConfig {
  gridWidth: number;
  gridHeight: number;
  minPathLength: number;
  maxPathLength: number;
  decoyBranches: number;
  fixedTilePercentage: number;
  allowedTileTypes: TileType[];
}

const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    gridWidth: 5,
    gridHeight: 5,
    minPathLength: 6,
    maxPathLength: 10,
    decoyBranches: 1,
    fixedTilePercentage: 0.2,
    allowedTileTypes: [TileType.Straight, TileType.Corner],
  },
  medium: {
    gridWidth: 6,
    gridHeight: 6,
    minPathLength: 12,
    maxPathLength: 18,
    decoyBranches: 2,
    fixedTilePercentage: 0.3,
    allowedTileTypes: [TileType.Straight, TileType.Corner, TileType.TJunction],
  },
  hard: {
    gridWidth: 8,
    gridHeight: 8,
    minPathLength: 24,
    maxPathLength: 35,
    decoyBranches: 3,
    fixedTilePercentage: 0.25,
    allowedTileTypes: [TileType.Straight, TileType.Corner, TileType.TJunction, TileType.FourWay],
  },
  superHard: {
    gridWidth: 10,
    gridHeight: 10,
    minPathLength: 45,
    maxPathLength: 70,
    decoyBranches: 5,
    fixedTilePercentage: 0.2,
    allowedTileTypes: [
      TileType.Straight,
      TileType.Corner,
      TileType.TJunction,
      TileType.FourWay,
      TileType.CrissCross,
      TileType.ColorChanger,
    ],
  },
};

// ============================================================================
// LEVEL GENERATOR
// ============================================================================

export class LevelGenerator {
  private random: SeededRandom | null = null;

  /**
   * Generate a solvable puzzle level
   */
  /**
   * Generate a solvable puzzle level
   */
  generateLevel(difficulty: Difficulty, options: LevelOptions = {}): GeneratedLevel {
    const config = DIFFICULTY_CONFIGS[difficulty];

    // Step 0: Merge configuration
    const finalConfig = this.mergeConfiguration(config, options);

    this.random = new SeededRandom(options.seed);

    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      attempts++;

      try {
        // Step 1: Create empty grid
        const grid = this.createEmptyGrid(finalConfig.gridWidth, finalConfig.gridHeight);
        console.log(`\n[Attempt ${attempts}] Step 1: Created ${finalConfig.gridWidth}x${finalConfig.gridHeight} grid`);

        // Step 2: Choose start and end positions
        const { startPos, endPos } = this.chooseStartAndEndPositions(finalConfig.gridWidth, finalConfig.gridHeight);
        console.log(`[Attempt ${attempts}] Step 2: Start=${JSON.stringify(startPos)}, End=${JSON.stringify(endPos)}`);

        // Step 3: Generate solution path
        const path = this.generatePath(grid, startPos, endPos, finalConfig.minPathLength, finalConfig.maxPathLength);

        if (!path || path.length < finalConfig.minPathLength) {
          console.log(
            `[Attempt ${attempts}] Step 3: Path too short (${path?.length ?? 0} < ${finalConfig.minPathLength}), retrying...`
          );
          continue;
        }
        console.log(`[Attempt ${attempts}] Step 3: Generated path of length ${path.length}`);

        // Step 4: Place tiles along solution path
        const placementSuccess = this.placeTilesAlongPath(grid, path, finalConfig.allowedTileTypes);
        if (!placementSuccess) {
          console.log(`[Attempt ${attempts}] Step 4: Failed to place tiles, retrying...`);
          continue;
        }
        console.log(`[Attempt ${attempts}] Step 4: Placed tiles along solution path`);

        // VALIDATION CHECKPOINT 1: Verify path is solvable
        if (!this.validateSolutionPath(grid, path, startPos, endPos)) {
          console.log(`[Attempt ${attempts}] VALIDATION FAILED: Solution path is not valid after placement!`);
          continue;
        }
        console.log(`[Attempt ${attempts}] ✓ Validation: Solution path is valid`);

        // Step 5: Add decoy branches
        this.addDecoyBranches(grid, path, finalConfig.decoyBranches, finalConfig.allowedTileTypes);
        console.log(`[Attempt ${attempts}] Step 5: Added ${finalConfig.decoyBranches} decoy branches`);

        // Step 6: Fill empty spaces
        this.fillEmptySpaces(grid, finalConfig.allowedTileTypes);
        console.log(`[Attempt ${attempts}] Step 6: Filled empty spaces`);

        // VALIDATION CHECKPOINT 2: Verify still solvable after filling
        if (!this.validateSolutionPath(grid, path, startPos, endPos)) {
          console.log(`[Attempt ${attempts}] VALIDATION FAILED: Solution broken after filling spaces!`);
          continue;
        }
        console.log(`[Attempt ${attempts}] ✓ Validation: Still solvable after filling`);

        // Step 7: Mark fixed tiles
        const fixedTileCount = this.markFixedTiles(grid, finalConfig.allowFixedTiles ? finalConfig.fixedTilePercentage : 0);
        console.log(`[Attempt ${attempts}] Step 7: Marked ${fixedTileCount} tiles as fixed`);

        // Step 8: Scramble non-solution tiles
        const scrambledCount = this.scrambleTiles(grid, path);
        console.log(`[Attempt ${attempts}] Step 8: Scrambled ${scrambledCount} tiles (preserving solution path)`);

        // VALIDATION CHECKPOINT 3: Final validation
        if (!this.validateSolutionPath(grid, path, startPos, endPos)) {
          console.log(`[Attempt ${attempts}] VALIDATION FAILED: Solution broken after scrambling!`);
          continue;
        }
        console.log(`[Attempt ${attempts}] ✓ Validation: Solution intact after scrambling`);

        // SUCCESS!
        console.log(`[Attempt ${attempts}] ✓✓✓ LEVEL GENERATION SUCCESSFUL ✓✓✓\n`);

        return {
          grid,
          startPos,
          endPos,
          solvedPathLength: path.length,
          metadata: {
            difficulty,
            gridWidth: finalConfig.gridWidth,
            gridHeight: finalConfig.gridHeight,
            tileTypes: [...new Set(grid.flat().map(t => t.definition.type))],
            fixedTileCount,
            generationAttempts: attempts,
          },
        };
      } catch (error) {
        console.log(`[Attempt ${attempts}] ERROR: ${error}`);
        continue;
      }
    }

    throw new Error(`Failed to generate valid level after ${maxAttempts} attempts`);
  }

  /**
   * Step 0: Merge configuration with defaults
   */
  private mergeConfiguration(config: DifficultyConfig, options: LevelOptions) {
    return {
      gridWidth: options.gridWidth ?? config.gridWidth,
      gridHeight: options.gridHeight ?? config.gridHeight,
      minPathLength: options.minPathLength ?? config.minPathLength,
      maxPathLength: options.maxPathLength ?? config.maxPathLength,
      allowedTileTypes: options.allowedTileTypes ?? config.allowedTileTypes,
      allowFixedTiles: options.allowFixedTiles ?? true,
      fixedTilePercentage: config.fixedTilePercentage,
      decoyBranches: config.decoyBranches,
    };
  }

  /**
   * Step 2: Choose start and end positions together
   */
  private chooseStartAndEndPositions(width: number, height: number) {
    const startPos = this.chooseStartPosition(width, height);
    const endPos = this.chooseEndPosition(width, height, startPos);
    return { startPos, endPos };
  }

  /**
   * Step 4: Place tiles (returns success/failure)
   */
  private placeTilesAlongPath(grid: Tile[][], path: SolutionPath, allowedTileTypes: TileType[]): boolean {
    for (let i = 0; i < path.length; i++) {
      const { x, y } = path[i];

      let requiredConnections = 0;

      // Connection from previous tile
      if (i > 0) {
        const prev = path[i - 1];
        if (prev.x < x) requiredConnections |= Direction.West;
        if (prev.x > x) requiredConnections |= Direction.East;
        if (prev.y < y) requiredConnections |= Direction.North;
        if (prev.y > y) requiredConnections |= Direction.South;
      }

      // Connection to next tile
      if (i < path.length - 1) {
        const next = path[i + 1];
        if (next.x < x) requiredConnections |= Direction.West;
        if (next.x > x) requiredConnections |= Direction.East;
        if (next.y < y) requiredConnections |= Direction.North;
        if (next.y > y) requiredConnections |= Direction.South;
      }

      const tile = this.findTileForConnections(requiredConnections, allowedTileTypes);
      if (!tile) {
        console.log(`  ✗ Could not find tile for position (${x},${y}) with connections ${requiredConnections}`);
        return false;
      }

      grid[y][x] = { ...tile, x, y };
    }

    return true;
  }

  /**
   * Step 7: Mark fixed tiles (returns count)
   */
  private markFixedTiles(grid: Tile[][], percentage: number): number {
    if (!this.random || percentage === 0) return 0;

    const allTiles = grid.flat().filter(t => t.definition.rotatable);
    const fixCount = Math.floor(allTiles.length * percentage);

    const shuffled = this.random.shuffle(allTiles);
    for (let i = 0; i < fixCount && i < shuffled.length; i++) {
      shuffled[i].fixed = true;
    }

    return fixCount;
  }

  /**
   * Step 8: Scramble tiles NOT on solution path (returns count scrambled)
   */
  private scrambleTiles(grid: Tile[][], solutionPath: SolutionPath): number {
    if (!this.random) return 0;

    const solutionSet = new Set(solutionPath.map(p => `${p.x},${p.y}`));
    let scrambledCount = 0;

    for (const row of grid) {
      for (const tile of row) {
        const posKey = `${tile.x},${tile.y}`;

        // Only scramble tiles NOT on the solution path
        if (tile.definition.rotatable && !tile.fixed && !solutionSet.has(posKey)) {
          tile.rotation = this.random.nextInt(0, 3) * 90;
          scrambledCount++;
        }
      }
    }

    return scrambledCount;
  }

  /**
   * VALIDATION: Check if solution path is actually solvable
   */
  private validateSolutionPath(
    grid: Tile[][],
    path: SolutionPath,
    startPos: { x: number; y: number },
    endPos: { x: number; y: number }
  ): boolean {
    // Walk the path and verify each connection
    for (let i = 0; i < path.length - 1; i++) {
      const current = path[i];
      const next = path[i + 1];

      const currentTile = grid[current.y][current.x];
      const nextTile = grid[next.y][next.x];

      // Determine direction from current to next
      let direction: Direction = Direction.error;
      if (next.x > current.x) direction = Direction.East;
      else if (next.x < current.x) direction = Direction.West;
      else if (next.y > current.y) direction = Direction.South;
      else if (next.y < current.y) direction = Direction.North;

      // Check if current tile has connection in that direction
      const currentConnections = getTileConnections(currentTile);
      if (!(currentConnections & direction)) {
        console.log(`  ✗ Tile at (${current.x},${current.y}) missing ${direction} connection`);
        return false;
      }

      // Check if next tile has connection back
      const oppositeDir = oppositeDirection(direction);
      if (oppositeDir === -1) return false;

      const nextConnections = getTileConnections(nextTile);
      if (!(nextConnections & oppositeDir)) {
        console.log(`  ✗ Tile at (${next.x},${next.y}) missing ${oppositeDir} connection back`);
        return false;
      }
    }

    return true;
  }

  /**
   * Create an empty grid filled with empty tiles
   */
  private createEmptyGrid(width: number, height: number): Tile[][] {
    const grid: Tile[][] = [];
    for (let y = 0; y < height; y++) {
      grid[y] = [];
      for (let x = 0; x < width; x++) {
        grid[y][x] = {
          definition: TILE_DEFINITIONS[TileType.Empty],
          rotation: 0,
          fixed: false,
          x,
          y,
        };
      }
    }
    return grid;
  }

  /**
   * Choose a random start position (typically on edge)
   */
  private chooseStartPosition(width: number, height: number): { x: number; y: number } {
    if (!this.random) return { x: -1, y: -1 };
    const edge = this.random.nextInt(0, 3);
    switch (edge) {
      case 0:
        return { x: this.random.nextInt(0, width - 1), y: 0 }; // Top
      case 1:
        return { x: width - 1, y: this.random.nextInt(0, height - 1) }; // Right
      case 2:
        return { x: this.random.nextInt(0, width - 1), y: height - 1 }; // Bottom
      default:
        return { x: 0, y: this.random.nextInt(0, height - 1) }; // Left
    }
  }

  /**
   * Choose end position far from start
   */
  private chooseEndPosition(width: number, height: number, start: { x: number; y: number }): { x: number; y: number } {
    if (!this.random) return { x: -1, y: -1 };
    // Try to place end on opposite side/corner
    const distance = (x: number, y: number) => Math.abs(x - start.x) + Math.abs(y - start.y);

    const candidates: { x: number; y: number }[] = [];

    // Edges
    for (let x = 0; x < width; x++) {
      candidates.push({ x, y: 0 });
      candidates.push({ x, y: height - 1 });
    }
    for (let y = 0; y < height; y++) {
      candidates.push({ x: 0, y });
      candidates.push({ x: width - 1, y });
    }

    // Sort by distance and take top candidates
    candidates.sort((a, b) => distance(b.x, b.y) - distance(a.x, a.y));

    // Pick from top 25% most distant
    const topCandidates = candidates.slice(0, Math.max(1, Math.floor(candidates.length * 0.25)));
    return topCandidates[this.random.nextInt(0, topCandidates.length - 1)];
  }

  /**
   * Generate a path using recursive backtracking with minimum length constraint
   */
  private generatePath(
    grid: Tile[][],
    start: { x: number; y: number },
    end: { x: number; y: number },
    minLength: number,
    maxLength: number
  ): { x: number; y: number; dir: Direction }[] | null {
    const width = grid[0].length;
    const height = grid.length;
    const visited = new Set<string>();

    const key = (x: number, y: number) => `${x},${y}`;

    const directions = [
      { dir: Direction.North, dx: 0, dy: -1 },
      { dir: Direction.East, dx: 1, dy: 0 },
      { dir: Direction.South, dx: 0, dy: 1 },
      { dir: Direction.West, dx: -1, dy: 0 },
    ];

    const search = (x: number, y: number, path: { x: number; y: number; dir: Direction }[]): SolutionPath | null => {
      //gaurd random
      if (!this.random) return null;
      // Check if we reached the end
      if (x === end.x && y === end.y) {
        // Only accept if path meets minimum length
        return path.length >= minLength ? path : null;
      }

      // Don't exceed maximum length
      if (path.length >= maxLength) {
        return null;
      }

      visited.add(key(x, y));

      // Try directions in random order
      const shuffledDirs = this.random.shuffle(directions);

      for (const { dir, dx, dy } of shuffledDirs) {
        const nx = x + dx;
        const ny = y + dy;

        // Check bounds
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
          continue;
        }

        // Check if already visited
        if (visited.has(key(nx, ny))) {
          continue;
        }

        // Add to path and recurse
        const newPath = [...path, { x: nx, y: ny, dir }];
        const result = search(nx, ny, newPath);

        if (result) {
          return result;
        }
      }

      visited.delete(key(x, y));
      return null;
    };

    return search(start.x, start.y, [{ x: start.x, y: start.y, dir: 0 }]);
  }

  /**
   * Place appropriate tiles along the solution path
   */
  //   private placeTilesAlongPath(grid: Tile[][], path: SolutionPath, allowedTileTypes: TileType[]): void {
  //     console.log("\n=== PLACING TILES ALONG PATH ===");
  //     console.log(`Path length: ${path.length}`);

  //     for (let i = 0; i < path.length; i++) {
  //       const { x, y } = path[i];

  //       // Determine required connections
  //       let requiredConnections = 0;

  //       console.log(`\nStep ${i}: (${x}, ${y})`);

  //       // Connection from previous tile
  //       if (i > 0) {
  //         const prev = path[i - 1];
  //         console.log(`  Previous: (${prev.x}, ${prev.y})`);

  //         if (prev.x < x) {
  //           requiredConnections |= Direction.West;
  //           console.log(`    Need West (prev is to the left)`);
  //         }
  //         if (prev.x > x) {
  //           requiredConnections |= Direction.East;
  //           console.log(`    Need East (prev is to the right)`);
  //         }
  //         if (prev.y < y) {
  //           requiredConnections |= Direction.North;
  //           console.log(`    Need North (prev is above)`);
  //         }
  //         if (prev.y > y) {
  //           requiredConnections |= Direction.South;
  //           console.log(`    Need South (prev is below)`);
  //         }
  //       }

  //       // Connection to next tile
  //       if (i < path.length - 1) {
  //         const next = path[i + 1];
  //         console.log(`  Next: (${next.x}, ${next.y})`);

  //         if (next.x < x) {
  //           requiredConnections |= Direction.West;
  //           console.log(`    Need West (next is to the left)`);
  //         }
  //         if (next.x > x) {
  //           requiredConnections |= Direction.East;
  //           console.log(`    Need East (next is to the right)`);
  //         }
  //         if (next.y < y) {
  //           requiredConnections |= Direction.North;
  //           console.log(`    Need North (next is above)`);
  //         }
  //         if (next.y > y) {
  //           requiredConnections |= Direction.South;
  //           console.log(`    Need South (next is below)`);
  //         }
  //       }

  //       console.log(`  Required connections bitmask: ${requiredConnections}`);

  //       // Find a suitable tile
  //       const tile = this.findTileForConnections(requiredConnections, allowedTileTypes);
  //       if (tile) {
  //         console.log(`  Placed: ${tile.definition.type} at rotation ${tile.rotation}°`);
  //         grid[y][x] = {
  //           ...tile,
  //           x,
  //           y,
  //         };
  //       } else {
  //         console.log(`  ERROR: Could not find tile for connections!`);
  //       }
  //     }
  //   }

  /**
   * Find a tile that can provide the required connections
   */
  /**
   * Find a tile that can provide the required connections
   */
  private findTileForConnections(requiredConnections: number, allowedTileTypes: TileType[]): Tile | null {
    if (!this.random) return null;

    // Try each allowed tile type
    const candidates: { definition: TileDefinition; rotation: number }[] = [];

    for (const type of allowedTileTypes) {
      const definition = TILE_DEFINITIONS[type];

      // Try all rotations to see if this tile can provide the required connections
      for (let rotation = 0; rotation < 360; rotation += 90) {
        const rotated = rotateConnections(definition.baseConnections, rotation / 90);

        // Check if this rotation provides AT LEAST the required connections
        // (it can have extra connections, like T-junction for a corner need)
        if ((rotated & requiredConnections) === requiredConnections) {
          candidates.push({ definition, rotation });
        }
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    // Pick a random candidate that works
    const chosen = candidates[this.random.nextInt(0, candidates.length - 1)];

    return {
      definition: chosen.definition,
      rotation: chosen.rotation,
      fixed: false,
      x: 0,
      y: 0,
    };
  }
  /**
   * Count set bits in a number
   */
  private countBits(n: number): number {
    let count = 0;
    while (n) {
      count += n & 1;
      n >>= 1;
    }
    return count;
  }

  /**
   * Add decoy branches that don't lead to the solution
   */
  private addDecoyBranches(grid: Tile[][], solutionPath: SolutionPath, count: number, allowedTileTypes: TileType[]): void {
    if (!this.random) return;
    const width = grid[0].length;
    const height = grid.length;
    const pathSet = new Set(solutionPath.map(p => `${p.x},${p.y}`));

    for (let i = 0; i < count; i++) {
      // Pick a random tile on the solution path
      const branchPoint: SolutionPathSegment = solutionPath[this.random.nextInt(0, solutionPath.length - 1)];

      // Try to extend in a direction not used by solution
      const directions = [
        { dx: 0, dy: -1 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
      ];

      for (const { dx, dy } of this.random.shuffle(directions)) {
        const nx = branchPoint.x + dx;
        const ny = branchPoint.y + dy;

        if (nx >= 0 && nx < width && ny >= 0 && ny < height && !pathSet.has(`${nx},${ny}`)) {
          // Place a random tile
          const tileType = allowedTileTypes[this.random.nextInt(0, allowedTileTypes.length - 1)];
          const definition = TILE_DEFINITIONS[tileType];

          grid[ny][nx] = {
            definition,
            rotation: this.random.nextInt(0, 3) * 90,
            fixed: false,
            x: nx,
            y: ny,
          };

          break;
        }
      }
    }
  }

  /**
   * Fill empty spaces with random tiles
   */
  private fillEmptySpaces(grid: Tile[][], allowedTileTypes: TileType[]): void {
    if (!this.random) return;
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (grid[y][x].definition.type === TileType.Empty) {
          // 70% chance to place a tile, 30% to leave empty
          if (this.random.next() < 0.7) {
            const tileType = allowedTileTypes[this.random.nextInt(0, allowedTileTypes.length - 1)];
            const definition = TILE_DEFINITIONS[tileType];

            grid[y][x] = {
              definition,
              rotation: this.random.nextInt(0, 3) * 90,
              fixed: false,
              x,
              y,
            };
          }
        }
      }
    }
  }

  /**
   * Mark a percentage of tiles as fixed (non-rotatable)
   */
  //   private markFixedTiles(grid: Tile[][], percentage: number): void {
  //     if (!this.random) return;
  //     const allTiles = grid.flat().filter(t => t.definition.rotatable);
  //     const fixCount = Math.floor(allTiles.length * percentage);

  //     const shuffled = this.random.shuffle(allTiles);
  //     for (let i = 0; i < fixCount && i < shuffled.length; i++) {
  //       shuffled[i].fixed = true;
  //     }
  //   }

  /**
   * Randomly rotate all rotatable tiles to scramble the puzzle
   */
  //   private scrambleTiles(grid: Tile[][]): void {
  //     if (!this.random) return;
  //     for (const row of grid) {
  //       for (const tile of row) {
  //         if (tile.definition.rotatable && !tile.fixed) {
  //           tile.rotation = this.random.nextInt(0, 3) * 90;
  //         }
  //       }
  //     }
  //   }
}

//NOTE
// ============================================================================
// ASCII VISUALIZATION
// ============================================================================

/**
 * ASCII characters for drawing tiles based on their connections
 */
const ASCII_TILES: Record<string, string> = {
  // No connections
  "0": "·",

  // Single connections (dead ends)
  "1": "╵", // North only
  "2": "╶", // East only
  "4": "╷", // South only
  "8": "╴", // West only

  // Straight connections
  "5": "│", // North-South
  "10": "─", // East-West

  // Corner connections
  "3": "└", // North-East
  "6": "┌", // East-South
  "12": "┐", // South-West
  "9": "┘", // West-North

  // T-junctions
  "7": "├", // North-East-South
  "11": "┴", // North-East-West
  "14": "┤", // East-South-West
  "13": "┬", // North-South-West

  // Four-way
  "15": "┼", // All directions
};

/**
 * Get color code for ANSI terminal colors
 */
function getColorCode(color: string): string {
  const colors: Record<string, string> = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    gray: "\x1b[90m",
    brightRed: "\x1b[91m",
    brightGreen: "\x1b[92m",
    brightYellow: "\x1b[93m",
    brightBlue: "\x1b[94m",
    brightMagenta: "\x1b[95m",
    brightCyan: "\x1b[96m",
    bg_red: "\x1b[41m",
    bg_green: "\x1b[42m",
    bg_yellow: "\x1b[43m",
    bg_blue: "\x1b[44m",
  };
  return colors[color] || colors.reset;
}

/**
 * Visualization options for ASCII output
 */
export interface VisualizationOptions {
  /** Show tile rotations as numbers */
  showRotations?: boolean;
  /** Highlight the solution path */
  highlightSolution?: boolean;
  /** Show fixed tiles differently */
  showFixed?: boolean;
  /** Use colors (ANSI codes) */
  useColors?: boolean;
  /** Show grid coordinates */
  showCoordinates?: boolean;
  /** Show tile types instead of connections */
  showTileTypes?: boolean;
}

/**
 * Draw a level in ASCII format
 */
export function drawLevel(level: GeneratedLevel, options: VisualizationOptions = {}): string {
  const {
    showRotations = false,
    highlightSolution = true,
    showFixed = true,
    useColors = true,
    showCoordinates = true,
    showTileTypes = false,
  } = options;

  const { grid, startPos, endPos, solvedPathLength } = level;
  const height = grid.length;
  const width = grid[0]?.length || 0;

  // Build solution path set for highlighting
  const solutionSet = new Set<string>();
  if (highlightSolution) {
    // We don't have the actual path stored, so we'll just highlight start/end
    solutionSet.add(`${startPos.x},${startPos.y}`);
    solutionSet.add(`${endPos.x},${endPos.y}`);
  }

  let output = "\n";

  // Header
  output += "═".repeat(width * 4 + 2) + "\n";
  output += `  Level: ${level.metadata.difficulty.toUpperCase()} | `;
  output += `Grid: ${width}x${height} | `;
  output += `Path Length: ${solvedPathLength}\n`;
  output += "═".repeat(width * 4 + 2) + "\n";

  // Column coordinates
  if (showCoordinates) {
    output += "  ";
    for (let x = 0; x < width; x++) {
      output += ` ${x.toString().padStart(2)} `;
    }
    output += "\n";
    output += "  " + "─".repeat(width * 4) + "\n";
  }

  // Draw grid
  for (let y = 0; y < height; y++) {
    let row = showCoordinates ? `${y.toString().padStart(2)}│` : "";

    for (let x = 0; x < width; x++) {
      const tile = grid[y][x];
      const isStart = x === startPos.x && y === startPos.y;
      const isEnd = x === endPos.x && y === endPos.y;
      const isOnSolution = solutionSet.has(`${x},${y}`);

      let cellContent = "";

      if (showTileTypes) {
        // Show tile type abbreviation
        const typeMap: Record<TileType, string> = {
          [TileType.Straight]: "ST",
          [TileType.Corner]: "CR",
          [TileType.TJunction]: "TJ",
          [TileType.FourWay]: "4W",
          [TileType.CrissCross]: "XX",
          [TileType.ColorChanger]: "CC",
          [TileType.Empty]: "  ",
        };
        cellContent = typeMap[tile.definition.type];
      } else {
        // Show connections as ASCII art
        const connections = getTileConnections(tile);
        cellContent = ASCII_TILES[connections.toString()] || "?";

        if (showRotations && tile.definition.rotatable) {
          cellContent += `${tile.rotation / 90}`;
        } else {
          cellContent += " ";
        }
      }

      // Apply colors
      if (useColors) {
        if (isStart) {
          cellContent = getColorCode("bg_green") + getColorCode("white") + "S " + getColorCode("reset");
        } else if (isEnd) {
          cellContent = getColorCode("bg_red") + getColorCode("white") + "E " + getColorCode("reset");
        } else if (isOnSolution && highlightSolution) {
          cellContent = getColorCode("brightYellow") + cellContent + getColorCode("reset");
        } else if (tile.fixed && showFixed) {
          cellContent = getColorCode("brightCyan") + cellContent + getColorCode("reset");
        } else if (tile.definition.type === TileType.Empty) {
          cellContent = getColorCode("gray") + cellContent + getColorCode("reset");
        }
      } else {
        // No colors - use markers
        if (isStart) cellContent = "S ";
        else if (isEnd) cellContent = "E ";
      }

      row += ` ${cellContent}`;
    }

    output += row + (showCoordinates ? "│" : "") + "\n";
  }

  // Footer with legend
  if (showCoordinates) {
    output += "  " + "─".repeat(width * 4) + "\n";
  }

  output += "\nLegend:\n";
  output += "  S = Start, E = End\n";
  if (showFixed && useColors) {
    output += `  ${getColorCode("brightCyan")}Cyan${getColorCode("reset")} = Fixed tiles (cannot rotate)\n`;
  }
  if (highlightSolution && useColors) {
    output += `  ${getColorCode("brightYellow")}Yellow${getColorCode("reset")} = Solution path\n`;
  }
  if (showRotations) {
    output += "  Numbers = Rotation (0=0°, 1=90°, 2=180°, 3=270°)\n";
  }

  output += "\nTile Types:\n";
  output += `  ${ASCII_TILES["5"]} = Straight  ${ASCII_TILES["3"]} = Corner  `;
  output += `${ASCII_TILES["7"]} = T-junction  ${ASCII_TILES["15"]} = 4-way\n`;

  output += "\nMetadata:\n";
  output += `  Fixed Tiles: ${level.metadata.fixedTileCount}\n`;
  output += `  Tile Types: ${level.metadata.tileTypes.join(", ")}\n`;
  output += `  Generation Attempts: ${level.metadata.generationAttempts}\n`;

  output += "═".repeat(width * 4 + 2) + "\n";

  return output;
}

/**
 * Draw the solution state (how it should look when solved)
 */
export function drawSolution(level: GeneratedLevel, solutionPath?: SolutionPath): string {
  const { grid, startPos, endPos } = level;
  const height = grid.length;
  const width = grid[0]?.length || 0;

  // Create a solved grid by rotating tiles to correct positions
  const solvedGrid = grid.map(row => row.map(tile => ({ ...tile })));

  // Build path set
  const pathSet = new Set<string>();
  if (solutionPath) {
    solutionPath.forEach(p => pathSet.add(`${p.x},${p.y}`));
  }

  let output = "\n";
  output += "═".repeat(width * 4 + 2) + "\n";
  output += "  SOLUTION VIEW (Correct Rotations)\n";
  output += "═".repeat(width * 4 + 2) + "\n\n";

  // Column numbers
  output += "  ";
  for (let x = 0; x < width; x++) {
    output += ` ${x.toString().padStart(2)} `;
  }
  output += "\n";
  output += "  " + "─".repeat(width * 4) + "\n";

  for (let y = 0; y < height; y++) {
    let row = `${y.toString().padStart(2)}│`;

    for (let x = 0; x < width; x++) {
      const tile = solvedGrid[y][x];
      const isStart = x === startPos.x && y === startPos.y;
      const isEnd = x === endPos.x && y === endPos.y;
      const isOnPath = pathSet.has(`${x},${y}`);

      // For solution, show tiles in their correct rotation
      // This would need the actual solution path to properly set rotations
      const connections = getTileConnections(tile);
      let cellContent = ASCII_TILES[connections.toString()] || "?";
      cellContent += " ";

      // Color coding
      if (isStart) {
        cellContent = getColorCode("bg_green") + getColorCode("white") + "S " + getColorCode("reset");
      } else if (isEnd) {
        cellContent = getColorCode("bg_red") + getColorCode("white") + "E " + getColorCode("reset");
      } else if (isOnPath) {
        cellContent = getColorCode("brightGreen") + cellContent + getColorCode("reset");
      } else if (tile.definition.type === TileType.Empty) {
        cellContent = getColorCode("gray") + cellContent + getColorCode("reset");
      }

      row += ` ${cellContent}`;
    }

    output += row + "│\n";
  }

  output += "  " + "─".repeat(width * 4) + "\n";
  output += `\n${getColorCode("brightGreen")}Green${getColorCode("reset")} = Solution path\n`;
  output += "═".repeat(width * 4 + 2) + "\n";

  return output;
}

/**
 * Draw a side-by-side comparison of scrambled vs solution
 */
/**
 * Draw a side-by-side comparison of scrambled vs solution
 */
export function drawComparison(level: GeneratedLevel, solutionPath?: SolutionPath): string {
  const { grid, startPos, endPos } = level;
  const height = grid.length;
  const width = grid[0]?.length || 0;

  const pathSet = new Set<string>();
  if (solutionPath) {
    solutionPath.forEach(p => pathSet.add(`${p.x},${p.y}`));
  }

  let output = "\n";

  // Calculate column width (each cell is 2 chars wide + 1 space)
  const leftWidth = width * 3 + 2;
  const rightWidth = width * 3 + 2;

  // Top border
  output += "╔" + "═".repeat(leftWidth) + "╦" + "═".repeat(rightWidth) + "╗\n";

  // Headers
  output += "║ SCRAMBLED PUZZLE".padEnd(leftWidth + 1) + "║ SOLUTION".padEnd(rightWidth + 1) + "║\n";
  output += "╠" + "═".repeat(leftWidth) + "╬" + "═".repeat(rightWidth) + "╣\n";

  // Render each row
  for (let y = 0; y < height; y++) {
    let scrambledRow = "║ ";
    let solutionRow = "║ ";

    for (let x = 0; x < width; x++) {
      const tile = grid[y][x];
      const isStart = x === startPos.x && y === startPos.y;
      const isEnd = x === endPos.x && y === endPos.y;
      const isOnPath = pathSet.has(`${x},${y}`);

      // Get the ASCII representation of the tile
      const connections = getTileConnections(tile);
      let cellChar = ASCII_TILES[connections.toString()] || "?";

      // Scrambled view (left side)
      let scrambledCell = cellChar;
      if (isStart) {
        scrambledCell = getColorCode("bg_green") + "S" + getColorCode("reset");
      } else if (isEnd) {
        scrambledCell = getColorCode("bg_red") + "E" + getColorCode("reset");
      } else if (tile.fixed) {
        scrambledCell = getColorCode("brightCyan") + cellChar + getColorCode("reset");
      }
      scrambledRow += scrambledCell + " ";

      // Solution view (right side) - highlight the path
      let solutionCell = cellChar;
      if (isStart) {
        solutionCell = getColorCode("bg_green") + "S" + getColorCode("reset");
      } else if (isEnd) {
        solutionCell = getColorCode("bg_red") + "E" + getColorCode("reset");
      } else if (isOnPath) {
        solutionCell = getColorCode("brightGreen") + cellChar + getColorCode("reset");
      } else if (tile.definition.type === TileType.Empty) {
        solutionCell = getColorCode("gray") + cellChar + getColorCode("reset");
      }
      solutionRow += solutionCell + " ";
    }

    // Pad rows to proper width
    // Note: ANSI color codes don't count toward visible length, so we need to calculate actual visible length
    // eslint-disable-next-line no-control-regex
    const scrambledVisible = scrambledRow.replace(/\x1b\[[0-9;]*m/g, "").length;
    // eslint-disable-next-line no-control-regex
    const solutionVisible = solutionRow.replace(/\x1b\[[0-9;]*m/g, "").length;

    scrambledRow += " ".repeat(Math.max(0, leftWidth + 1 - scrambledVisible));
    solutionRow += " ".repeat(Math.max(0, rightWidth + 1 - solutionVisible));

    output += scrambledRow + solutionRow + "║\n";
  }

  // Bottom border
  output += "╚" + "═".repeat(leftWidth) + "╩" + "═".repeat(rightWidth) + "╝\n";

  // Legend
  output += "\n";
  output += "LEFT:  Scrambled puzzle (what player sees)\n";
  output += "RIGHT: Solution path highlighted in " + getColorCode("brightGreen") + "green" + getColorCode("reset") + "\n";
  output += "\n";
  output += getColorCode("brightCyan") + "Cyan tiles" + getColorCode("reset") + " = Fixed (cannot be rotated)\n";
  output +=
    getColorCode("bg_green") +
    "S" +
    getColorCode("reset") +
    " = Start, " +
    getColorCode("bg_red") +
    "E" +
    getColorCode("reset") +
    " = End\n";

  return output;
}

/**
 * Simpler side-by-side without fancy borders (more reliable)
 */
export function drawComparisonSimple(level: GeneratedLevel, solutionPath?: SolutionPath): string {
  const { grid, startPos, endPos } = level;
  const height = grid.length;
  const width = grid[0]?.length || 0;

  const pathSet = new Set<string>();
  if (solutionPath) {
    solutionPath.forEach(p => pathSet.add(`${p.x},${p.y}`));
  }

  let output = "\n";
  output += "=".repeat(width * 3 + 2) + "  " + "=".repeat(width * 3 + 2) + "\n";
  output += " SCRAMBLED PUZZLE".padEnd(width * 3 + 2) + "   SOLUTION PATH".padEnd(width * 3 + 2) + "\n";
  output += "=".repeat(width * 3 + 2) + "  " + "=".repeat(width * 3 + 2) + "\n";

  for (let y = 0; y < height; y++) {
    let leftRow = "";
    let rightRow = "";

    for (let x = 0; x < width; x++) {
      const tile = grid[y][x];
      const isStart = x === startPos.x && y === startPos.y;
      const isEnd = x === endPos.x && y === endPos.y;
      const isOnPath = pathSet.has(`${x},${y}`);

      const connections = getTileConnections(tile);
      let cellChar = ASCII_TILES[connections.toString()] || "?";

      // Left: Scrambled view
      let leftCell = cellChar;
      if (isStart) leftCell = getColorCode("bg_green") + "S" + getColorCode("reset");
      else if (isEnd) leftCell = getColorCode("bg_red") + "E" + getColorCode("reset");
      else if (tile.fixed) leftCell = getColorCode("brightCyan") + cellChar + getColorCode("reset");

      leftRow += " " + leftCell;

      // Right: Solution view
      let rightCell = cellChar;
      if (isStart) rightCell = getColorCode("bg_green") + "S" + getColorCode("reset");
      else if (isEnd) rightCell = getColorCode("bg_red") + "E" + getColorCode("reset");
      else if (isOnPath) rightCell = getColorCode("brightGreen") + cellChar + getColorCode("reset");
      else if (tile.definition.type === TileType.Empty) rightCell = getColorCode("gray") + "·" + getColorCode("reset");

      rightRow += " " + rightCell;
    }

    output += leftRow + "   " + rightRow + "\n";
  }

  output += "=".repeat(width * 3 + 2) + "  " + "=".repeat(width * 3 + 2) + "\n";
  output += "\n";
  output += "LEFT: Scrambled (player view)  |  RIGHT: Solution (";
  output += getColorCode("brightGreen") + "green" + getColorCode("reset") + " = path)\n";

  return output;
}

// ============================================================================
// SOLVER AND VALIDATION
// ============================================================================

/**
 * Result of attempting to solve a puzzle
 */
export interface SolveResult {
  solved: boolean;
  path: SolutionPath | null;
  pathLength: number;
  exploredNodes: number;
  message: string;
}

/**
 * Verify if two tiles are properly connected
 */
function tilesAreConnected(tile1: Tile, tile2: Tile, direction: Direction): boolean {
  const tile1Connections = getTileConnections(tile1);
  const tile2Connections = getTileConnections(tile2);

  // Check if tile1 has a connection in the given direction
  if (!(tile1Connections & direction)) {
    return false;
  }

  // Check if tile2 has a connection in the opposite direction
  const oppositeDir = oppositeDirection(direction);
  if (oppositeDir === -1) return false;

  return !!(tile2Connections & oppositeDir);
}

/**
 * Check if a tile has a connection in a specific direction
 */
function hasConnection(tile: Tile, direction: Direction): boolean {
  const connections = getTileConnections(tile);
  return !!(connections & direction);
}

/**
 * Solve the puzzle using BFS to find the shortest path
 */
export function solvePuzzle(level: GeneratedLevel): SolveResult {
  const { grid, startPos, endPos } = level;
  const width = grid[0].length;
  const height = grid.length;

  interface QueueNode {
    x: number;
    y: number;
    path: SolutionPath;
  }

  const queue: QueueNode[] = [];
  const visited = new Set<string>();
  const key = (x: number, y: number) => `${x},${y}`;

  let exploredNodes = 0;

  // Start BFS
  queue.push({
    x: startPos.x,
    y: startPos.y,
    path: [{ x: startPos.x, y: startPos.y, dir: Direction.error }],
  });
  visited.add(key(startPos.x, startPos.y));

  const directions = [
    { dir: Direction.North, dx: 0, dy: -1 },
    { dir: Direction.East, dx: 1, dy: 0 },
    { dir: Direction.South, dx: 0, dy: 1 },
    { dir: Direction.West, dx: -1, dy: 0 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    exploredNodes++;

    // Check if we reached the end
    if (current.x === endPos.x && current.y === endPos.y) {
      return {
        solved: true,
        path: current.path,
        pathLength: current.path.length,
        exploredNodes,
        message: `Puzzle solved! Path length: ${current.path.length}`,
      };
    }

    const currentTile = grid[current.y][current.x];

    // Try each direction
    for (const { dir, dx, dy } of directions) {
      const nx = current.x + dx;
      const ny = current.y + dy;

      // Check bounds
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
        continue;
      }

      // Check if already visited
      if (visited.has(key(nx, ny))) {
        continue;
      }

      const nextTile = grid[ny][nx];

      // Check if tiles are properly connected
      if (!tilesAreConnected(currentTile, nextTile, dir)) {
        continue;
      }

      // Add to queue
      visited.add(key(nx, ny));
      queue.push({
        x: nx,
        y: ny,
        path: [...current.path, { x: nx, y: ny, dir }],
      });
    }
  }

  return {
    solved: false,
    path: null,
    pathLength: 0,
    exploredNodes,
    message: "Puzzle is not solvable - no path found from start to end",
  };
}

/**
 * Validate the level and provide detailed diagnostics
 */
export interface ValidationResult {
  valid: boolean;
  issues: string[];
  warnings: string[];
  solveResult: SolveResult;
  gridAnalysis: {
    totalTiles: number;
    emptyTiles: number;
    rotatableTiles: number;
    fixedTiles: number;
    tileTypeCounts: Record<string, number>;
  };
}

export function validateLevel(level: GeneratedLevel): ValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  const { grid, startPos, endPos, solvedPathLength } = level;
  const width = grid[0].length;
  const height = grid.length;

  // Check start and end positions
  if (startPos.x < 0 || startPos.x >= width || startPos.y < 0 || startPos.y >= height) {
    issues.push(`Invalid start position: (${startPos.x}, ${startPos.y})`);
  }

  if (endPos.x < 0 || endPos.x >= width || endPos.y < 0 || endPos.y >= height) {
    issues.push(`Invalid end position: (${endPos.x}, ${endPos.y})`);
  }

  if (startPos.x === endPos.x && startPos.y === endPos.y) {
    issues.push("Start and end positions are the same");
  }

  // Analyze grid
  let totalTiles = 0;
  let emptyTiles = 0;
  let rotatableTiles = 0;
  let fixedTiles = 0;
  const tileTypeCounts: Record<string, number> = {};

  for (const row of grid) {
    for (const tile of row) {
      totalTiles++;

      const type = tile.definition.type;
      tileTypeCounts[type] = (tileTypeCounts[type] || 0) + 1;

      if (type === TileType.Empty) {
        emptyTiles++;
      }

      if (tile.definition.rotatable && !tile.fixed) {
        rotatableTiles++;
      }

      if (tile.fixed) {
        fixedTiles++;
      }

      // Check rotation values
      if (![0, 90, 180, 270].includes(tile.rotation)) {
        issues.push(`Invalid rotation ${tile.rotation} at (${tile.x}, ${tile.y})`);
      }
    }
  }

  // Check if there are any rotatable tiles
  if (rotatableTiles === 0) {
    warnings.push("No rotatable tiles - puzzle cannot be solved by player interaction");
  }

  // Check start/end tiles
  const startTile = grid[startPos.y][startPos.x];
  const endTile = grid[endPos.y][endPos.x];

  if (startTile.definition.type === TileType.Empty) {
    issues.push("Start position has an empty tile");
  }

  if (endTile.definition.type === TileType.Empty) {
    issues.push("End position has an empty tile");
  }

  // Try to solve the puzzle
  const solveResult = solvePuzzle(level);

  if (!solveResult.solved) {
    issues.push(solveResult.message);
  } else {
    // Compare claimed path length with actual
    if (solveResult.pathLength !== solvedPathLength) {
      warnings.push(`Claimed path length (${solvedPathLength}) doesn't match actual (${solveResult.pathLength})`);
    }
  }

  return {
    valid: issues.length === 0 && solveResult.solved,
    issues,
    warnings,
    solveResult,
    gridAnalysis: {
      totalTiles,
      emptyTiles,
      rotatableTiles,
      fixedTiles,
      tileTypeCounts,
    },
  };
}

/**
 * Print a detailed validation report
 */
export function printValidationReport(validation: ValidationResult): string {
  let output = "\n";
  output += "═".repeat(60) + "\n";
  output += "  LEVEL VALIDATION REPORT\n";
  output += "═".repeat(60) + "\n\n";

  // Overall status
  const statusColor = validation.valid ? "brightGreen" : "brightRed";
  const statusText = validation.valid ? "✓ VALID" : "✗ INVALID";
  output += `Status: ${getColorCode(statusColor)}${statusText}${getColorCode("reset")}\n\n`;

  // Issues
  if (validation.issues.length > 0) {
    output += `${getColorCode("brightRed")}ISSUES:${getColorCode("reset")}\n`;
    for (const issue of validation.issues) {
      output += `  ✗ ${issue}\n`;
    }
    output += "\n";
  }

  // Warnings
  if (validation.warnings.length > 0) {
    output += `${getColorCode("brightYellow")}WARNINGS:${getColorCode("reset")}\n`;
    for (const warning of validation.warnings) {
      output += `  ⚠ ${warning}\n`;
    }
    output += "\n";
  }

  // Solve result
  output += `${getColorCode("brightCyan")}SOLVE ATTEMPT:${getColorCode("reset")}\n`;
  if (validation.solveResult.solved) {
    output += `  ${getColorCode("brightGreen")}✓${getColorCode("reset")} ${validation.solveResult.message}\n`;
    output += `  Path length: ${validation.solveResult.pathLength}\n`;
    output += `  Nodes explored: ${validation.solveResult.exploredNodes}\n`;
  } else {
    output += `  ${getColorCode("brightRed")}✗${getColorCode("reset")} ${validation.solveResult.message}\n`;
    output += `  Nodes explored: ${validation.solveResult.exploredNodes}\n`;
  }
  output += "\n";

  // Grid analysis
  const { gridAnalysis } = validation;
  output += `${getColorCode("brightCyan")}GRID ANALYSIS:${getColorCode("reset")}\n`;
  output += `  Total tiles: ${gridAnalysis.totalTiles}\n`;
  output += `  Empty tiles: ${gridAnalysis.emptyTiles}\n`;
  output += `  Rotatable tiles: ${gridAnalysis.rotatableTiles}\n`;
  output += `  Fixed tiles: ${gridAnalysis.fixedTiles}\n`;
  output += `  Tile types:\n`;
  for (const [type, count] of Object.entries(gridAnalysis.tileTypeCounts)) {
    output += `    ${type}: ${count}\n`;
  }

  output += "\n" + "═".repeat(60) + "\n";

  return output;
}

/**
 * Debug function to show path step by step
 */
export function debugPath(level: GeneratedLevel, path: SolutionPath): string {
  let output = "\n";
  output += "═".repeat(60) + "\n";
  output += "  PATH DEBUG\n";
  output += "═".repeat(60) + "\n\n";

  const { grid } = level;

  for (let i = 0; i < path.length; i++) {
    const step = path[i];
    const tile = grid[step.y][step.x];
    const connections = getTileConnections(tile);

    output += `Step ${i}: (${step.x}, ${step.y})\n`;
    output += `  Tile: ${tile.definition.type}\n`;
    output += `  Rotation: ${tile.rotation}°\n`;
    output += `  Connections: `;

    const dirs = [];
    if (connections & Direction.North) dirs.push("North");
    if (connections & Direction.East) dirs.push("East");
    if (connections & Direction.South) dirs.push("South");
    if (connections & Direction.West) dirs.push("West");
    output += dirs.join(", ") + "\n";

    if (i < path.length - 1) {
      const next = path[i + 1];
      const direction =
        next.x > step.x ? "East" : next.x < step.x ? "West" : next.y > step.y ? "South" : next.y < step.y ? "North" : "ERROR";
      output += `  Moving: ${direction} to (${next.x}, ${next.y})\n`;
    }

    output += "\n";
  }

  output += "═".repeat(60) + "\n";

  return output;
}

/**
 * Enhanced level drawing that shows connection issues
 */
export function drawLevelWithConnectionDebug(level: GeneratedLevel): string {
  const { grid, startPos, endPos } = level;
  const height = grid.length;
  const width = grid[0].length;

  let output = "\n";
  output += "═".repeat(width * 5 + 2) + "\n";
  output += "  CONNECTION DEBUG VIEW\n";
  output += "═".repeat(width * 5 + 2) + "\n\n";

  for (let y = 0; y < height; y++) {
    let row = "";

    for (let x = 0; x < width; x++) {
      const tile = grid[y][x];
      const connections = getTileConnections(tile);
      const isStart = x === startPos.x && y === startPos.y;
      const isEnd = x === endPos.x && y === endPos.y;

      // Show connections as NESW
      let cell = "";
      cell += connections & Direction.North ? "N" : "·";
      cell += connections & Direction.East ? "E" : "·";
      cell += connections & Direction.South ? "S" : "·";
      cell += connections & Direction.West ? "W" : "·";

      if (isStart) {
        cell = getColorCode("bg_green") + cell + getColorCode("reset");
      } else if (isEnd) {
        cell = getColorCode("bg_red") + cell + getColorCode("reset");
      }

      row += ` ${cell}`;
    }

    output += row + "\n";
  }

  output += "\n";
  output += "Each cell shows: North, East, South, West connections\n";
  output += 'Example: "N·SW" = Connected North, South, and West\n';
  output += "═".repeat(width * 5 + 2) + "\n";

  return output;
}

/**
 * Test multiple generations and report statistics
 */
export interface GenerationStats {
  totalAttempts: number;
  successfulGenerations: number;
  failedGenerations: number;
  averagePathLength: number;
  averageGenerationAttempts: number;
  validLevels: number;
  invalidLevels: number;
}

export function testGeneration(difficulty: Difficulty, count: number = 10, options?: LevelOptions): GenerationStats {
  const generator = new LevelGenerator();

  let successfulGenerations = 0;
  let failedGenerations = 0;
  let totalPathLength = 0;
  let totalGenerationAttempts = 0;
  let validLevels = 0;
  let invalidLevels = 0;

  console.log(`\nTesting ${count} level generations for difficulty: ${difficulty}\n`);

  for (let i = 0; i < count; i++) {
    try {
      const level = generator.generateLevel(difficulty, options);
      successfulGenerations++;
      totalPathLength += level.solvedPathLength;
      totalGenerationAttempts += level.metadata.generationAttempts;

      // Validate the level
      const validation = validateLevel(level);
      if (validation.valid) {
        validLevels++;
        console.log(
          `${getColorCode("brightGreen")}✓${getColorCode("reset")} Level ${i + 1}: Valid (Path: ${level.solvedPathLength}, Attempts: ${
            level.metadata.generationAttempts
          })`
        );
      } else {
        invalidLevels++;
        console.log(`${getColorCode("brightRed")}✗${getColorCode("reset")} Level ${i + 1}: Invalid`);
        console.log(`  Issues: ${validation.issues.join(", ")}`);
      }
    } catch (error) {
      failedGenerations++;
      console.log(`${getColorCode("brightRed")}✗${getColorCode("reset")} Level ${i + 1}: Generation failed - ${error}`);
    }
  }

  const stats: GenerationStats = {
    totalAttempts: count,
    successfulGenerations,
    failedGenerations,
    averagePathLength: successfulGenerations > 0 ? totalPathLength / successfulGenerations : 0,
    averageGenerationAttempts: successfulGenerations > 0 ? totalGenerationAttempts / successfulGenerations : 0,
    validLevels,
    invalidLevels,
  };

  console.log("\n" + "═".repeat(60));
  console.log("GENERATION STATISTICS");
  console.log("═".repeat(60));
  console.log(`Total attempts: ${stats.totalAttempts}`);
  console.log(`Successful: ${getColorCode("brightGreen")}${stats.successfulGenerations}${getColorCode("reset")}`);
  console.log(`Failed: ${getColorCode("brightRed")}${stats.failedGenerations}${getColorCode("reset")}`);
  console.log(`Valid levels: ${getColorCode("brightGreen")}${stats.validLevels}${getColorCode("reset")}`);
  console.log(`Invalid levels: ${getColorCode("brightRed")}${stats.invalidLevels}${getColorCode("reset")}`);
  console.log(`Average path length: ${stats.averagePathLength.toFixed(2)}`);
  console.log(`Average generation attempts: ${stats.averageGenerationAttempts.toFixed(2)}`);
  console.log("═".repeat(60) + "\n");

  return stats;
}

/**
 * Full debug session for a single level
 */
export function fullDebugSession(difficulty: Difficulty = "easy", seed?: number): void {
  console.log("\n" + "█".repeat(70));
  console.log("  FULL LEVEL DEBUG SESSION");
  console.log("█".repeat(70) + "\n");

  const generator = new LevelGenerator();

  console.log(`Generating ${difficulty} level${seed ? ` with seed ${seed}` : ""}...\n`);

  try {
    const level = generator.generateLevel(difficulty, { seed });

    // 1. Show the generated level
    console.log(
      drawLevel(level, {
        showRotations: true,
        highlightSolution: true,
        showFixed: true,
        useColors: true,
      })
    );

    // 2. Show connection debug
    console.log(drawLevelWithConnectionDebug(level));

    // 3. Validate
    const validation = validateLevel(level);
    console.log(printValidationReport(validation));

    // 4. If solvable, show the solution path
    if (validation.solveResult.solved && validation.solveResult.path) {
      console.log(drawSolution(level, validation.solveResult.path));
      console.log(debugPath(level, validation.solveResult.path));
    }

    // 5. Show comparison
    if (validation.solveResult.solved && validation.solveResult.path) {
      console.log(drawComparison(level, validation.solveResult.path));
    }
  } catch (error) {
    console.log(`${getColorCode("brightRed")}ERROR: ${error}${getColorCode("reset")}\n`);
  }
}
