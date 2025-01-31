import { Stage } from './types';

export const STAGES: Stage[] = [
  { 
    name: 'Awareness',
    color: '#ef4444',
    gradient: ['#fee2e2', '#ef4444']
  },
  {
    name: 'Education',
    color: '#f97316',
    gradient: ['#ffedd5', '#f97316']
  },
  {
    name: 'Selection',
    color: '#22c55e',
    gradient: ['#dcfce7', '#22c55e']
  },
  {
    name: 'Commit',
    color: '#38bdf8',
    gradient: ['#e0f2fe', '#38bdf8']
  },
  {
    name: 'Onboarding',
    color: '#3b82f6',
    gradient: ['#dbeafe', '#3b82f6']
  },
  {
    name: 'Adoption',
    color: '#1d4ed8',
    gradient: ['#dbeafe', '#1d4ed8']
  },
  {
    name: 'Expansion',
    color: '#14b8a6',
    gradient: ['#ccfbf1', '#14b8a6']
  }
];

interface Wall {
  x?: number;
  y?: number;
  startX?: number;
  endX?: number;
  startY?: number;
  endY?: number;
  horizontal: boolean;
  holes: { x?: number; y?: number; width?: number; height?: number; }[];
  holeCount?: number;
}

export class Funnel {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  stageWidth: number;
  walls: Wall[];
  scale: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;

    // Get the actual drawing dimensions (accounting for device pixel ratio)
    const rect = canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    // Calculate stage width based on actual dimensions
    this.stageWidth = this.width / STAGES.length;
    this.walls = [];
    this.scale = Math.min(this.width / 1000, this.height / 600); // Base scale on a reference size
    this.setupWalls();
  }

  setupWalls() {
    // Create walls for each stage
    for (let i = 0; i < STAGES.length; i++) {
      const x = i * this.stageWidth;
      const nextX = (i + 1) * this.stageWidth;
      const narrowing = Math.sin((i / (STAGES.length - 1)) * Math.PI) * 0.15;
      const nextNarrowing = Math.sin(((i + 1) / (STAGES.length - 1)) * Math.PI) * 0.15;

      const topY = this.height * narrowing;
      const bottomY = this.height * (1 - narrowing);
      const nextTopY = this.height * nextNarrowing;
      const nextBottomY = this.height * (1 - nextNarrowing);

      // Add vertical wall at the end of each segment (except last)
      if (i < STAGES.length - 1) {
        // Add two vertical walls to ensure no gaps
        // First wall: from current top to next top
        const topVerticalWall: Wall = {
          x: nextX,
          startY: topY,
          endY: nextTopY,
          horizontal: false,
          holes: [],
          holeCount: 0
        };
        this.walls.push(topVerticalWall);

        // Second wall: from next top to next bottom
        const middleVerticalWall: Wall = {
          x: nextX,
          startY: nextTopY,
          endY: nextBottomY,
          horizontal: false,
          holes: [],
          holeCount: 0
        };
        this.walls.push(middleVerticalWall);
        this.openHolesInWall(middleVerticalWall, 1);

        // Third wall: from next bottom to current bottom
        const bottomVerticalWall: Wall = {
          x: nextX,
          startY: nextBottomY,
          endY: bottomY,
          horizontal: false,
          holes: [],
          holeCount: 0
        };
        this.walls.push(bottomVerticalWall);
      }

      // Add horizontal walls for each segment
      // Top wall
      this.walls.push({
        y: topY,
        startX: x,
        endX: nextX,
        horizontal: true,
        holes: [],
        holeCount: 0
      });

      // Bottom wall
      this.walls.push({
        y: bottomY,
        startX: x,
        endX: nextX,
        horizontal: true,
        holes: [],
        holeCount: 0
      });
    }
  }

  getHoleSize(count: number): number {
    const baseSize = Math.min(this.width, this.height) * 0.08;
    return baseSize * Math.pow(0.95, count - 1); // Reduce by 5% for each additional hole
  }

  openHolesInWall(wall: Wall, count: number) {
    if (!wall.holeCount) wall.holeCount = 0;
    wall.holeCount += count;
    const holeSize = this.getHoleSize(wall.holeCount);

    if (wall.horizontal) {
      const segmentWidth = (wall.endX! - wall.startX!) / (wall.holeCount + 1);
      wall.holes = Array.from({ length: wall.holeCount }, (_, i) => ({
        x: wall.startX! + segmentWidth * (i + 1) - (holeSize / 2),
        width: holeSize
      }));
    } else {
      const segmentHeight = (wall.endY! - wall.startY!) / (wall.holeCount + 1);
      wall.holes = Array.from({ length: wall.holeCount }, (_, i) => ({
        y: wall.startY! + segmentHeight * (i + 1) - (holeSize / 2),
        height: holeSize
      }));
    }
  }

  draw() {
    // Save the current transformation state
    this.ctx.save();

    // Clear the entire canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw funnel segments
    STAGES.forEach((stage, i) => {
      const x = i * this.stageWidth;
      const narrowing = Math.sin((i / (STAGES.length - 1)) * Math.PI) * 0.15;

      const gradient = this.ctx.createLinearGradient(x, 0, x, this.height);
      gradient.addColorStop(0, stage.gradient[0]);
      gradient.addColorStop(1, stage.gradient[1]);

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.height * narrowing);
      this.ctx.lineTo(x + this.stageWidth, this.height * narrowing);
      this.ctx.lineTo(x + this.stageWidth, this.height * (1 - narrowing));
      this.ctx.lineTo(x, this.height * (1 - narrowing));
      this.ctx.closePath();
      this.ctx.fill();
    });

    // Draw walls and holes with proper scaling
    this.ctx.lineWidth = 2 * this.scale;

    this.walls.forEach(wall => {
      if (wall.horizontal) {
        // Draw horizontal wall
        this.ctx.beginPath();
        this.ctx.moveTo(wall.startX!, wall.y!);
        this.ctx.lineTo(wall.endX!, wall.y!);
        this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        this.ctx.stroke();

        // Draw holes
        wall.holes.forEach(hole => {
          this.ctx.beginPath();
          this.ctx.moveTo(hole.x!, wall.y! - 2 * this.scale);
          this.ctx.lineTo(hole.x! + hole.width!, wall.y! - 2 * this.scale);
          this.ctx.lineTo(hole.x! + hole.width!, wall.y! + 2 * this.scale);
          this.ctx.lineTo(hole.x!, wall.y! + 2 * this.scale);
          this.ctx.closePath();
          this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
          this.ctx.fill();
        });
      } else {
        // Draw vertical wall
        this.ctx.beginPath();
        this.ctx.moveTo(wall.x!, wall.startY!);
        this.ctx.lineTo(wall.x!, wall.endY!);
        this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        this.ctx.stroke();

        // Draw holes
        wall.holes.forEach(hole => {
          this.ctx.beginPath();
          this.ctx.moveTo(wall.x! - 2 * this.scale, hole.y!);
          this.ctx.lineTo(wall.x! + 2 * this.scale, hole.y!);
          this.ctx.lineTo(wall.x! + 2 * this.scale, hole.y! + hole.height!);
          this.ctx.lineTo(wall.x! - 2 * this.scale, hole.y! + hole.height!);
          this.ctx.closePath();
          this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
          this.ctx.fill();
        });
      }
    });

    // Restore the transformation state
    this.ctx.restore();
  }

  getWallsBetweenStages(fromStage: string, toStage: string): Wall[] {
    const fromIndex = STAGES.findIndex(s => s.name === fromStage);
    const toIndex = STAGES.findIndex(s => s.name === toStage);

    if (fromIndex === -1 || toIndex === -1) return [];

    const wallIndex = Math.min(fromIndex, toIndex);
    // Return middle vertical wall only (every third wall after horizontal walls)
    return this.walls.filter((wall, index) => {
      const stageWallGroup = Math.floor(index / 5); // 5 walls per stage (3 vertical + 2 horizontal)
      const wallTypeInGroup = index % 5;
      return stageWallGroup === wallIndex && wallTypeInGroup === 1; // middle vertical wall
    });
  }

  getStageHorizontalWalls(stageName: string): Wall[] {
    const stageIndex = STAGES.findIndex(s => s.name === stageName);
    if (stageIndex === -1) return [];

    return this.walls.filter((_, index) => {
      const stageWallGroup = Math.floor(index / 5);
      const wallTypeInGroup = index % 5;
      return stageWallGroup === stageIndex && (wallTypeInGroup === 3 || wallTypeInGroup === 4);
    });
  }

  closeHoles(walls: Wall[]) {
    walls.forEach(wall => {
      wall.holes = [];
      wall.holeCount = 0;
    });
  }

  createEducationSelectionHoles() {
    const verticalWalls = this.getWallsBetweenStages('Education', 'Selection');
    verticalWalls.forEach(wall => this.openHolesInWall(wall, 1)); // Add one more hole each time
  }

  createCommitOnboardingHoles() {
    const verticalWalls = this.getWallsBetweenStages('Commit', 'Onboarding');
    verticalWalls.forEach(wall => this.openHolesInWall(wall, 1));
  }

  patchSelectionStageHoles() {
    const horizontalWalls = this.getStageHorizontalWalls('Selection');
    this.closeHoles(horizontalWalls);
  }

  manageAdoptionExpansionHoles() {
    const verticalWalls = this.getWallsBetweenStages('Adoption', 'Expansion');
    verticalWalls.forEach(wall => this.openHolesInWall(wall, 1));
  }
}