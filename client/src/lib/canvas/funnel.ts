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
  nextHoleSize?: number;
}

export class Funnel {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  stageWidth: number;
  walls: Wall[];
  dpr: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.dpr = Math.max(1, window.devicePixelRatio || 1);

    const rect = canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.stageWidth = this.width / STAGES.length;
    this.walls = [];

    this.setupWalls();
  }

  setupWalls() {
    const maxNarrowing = 0.15;

    for (let i = 0; i < STAGES.length; i++) {
      const x = i * this.stageWidth;
      const nextX = (i + 1) * this.stageWidth;
      const narrowing = Math.sin((i / (STAGES.length - 1)) * Math.PI) * maxNarrowing;
      const nextNarrowing = Math.sin(((i + 1) / (STAGES.length - 1)) * Math.PI) * maxNarrowing;

      const topY = this.height * narrowing;
      const bottomY = this.height * (1 - narrowing);
      const nextTopY = this.height * nextNarrowing;
      const nextBottomY = this.height * (1 - nextNarrowing);

      if (i < STAGES.length - 1 || i === STAGES.length - 1) {
        const verticalWall: Wall = {
          x: nextX,
          startY: nextTopY,
          endY: nextBottomY,
          horizontal: false,
          holes: [],
          holeCount: 0,
          nextHoleSize: this.height * 0.1 // Initial hole size is 10% of height
        };
        this.walls.push(verticalWall);

        if (i < STAGES.length - 1) {
          this.openHolesInWall(verticalWall, 1);
        }

        if (Math.abs(topY - nextTopY) > this.height * 0.01) {
          this.walls.push({
            x: nextX,
            startY: Math.min(topY, nextTopY),
            endY: Math.max(topY, nextTopY),
            horizontal: false,
            holes: [],
            holeCount: 0,
            nextHoleSize: this.height * 0.1
          });
        }

        if (Math.abs(bottomY - nextBottomY) > this.height * 0.01) {
          this.walls.push({
            x: nextX,
            startY: Math.min(bottomY, nextBottomY),
            endY: Math.max(bottomY, nextBottomY),
            horizontal: false,
            holes: [],
            holeCount: 0,
            nextHoleSize: this.height * 0.1
          });
        }
      }

      this.walls.push({
        y: topY,
        startX: x,
        endX: nextX,
        horizontal: true,
        holes: [],
        holeCount: 0,
        nextHoleSize: this.width * 0.1
      });

      this.walls.push({
        y: bottomY,
        startX: x,
        endX: nextX,
        horizontal: true,
        holes: [],
        holeCount: 0,
        nextHoleSize: this.width * 0.1
      });
    }
  }

  redistributeHoles(wall: Wall) {
    if (!wall.holeCount || wall.holeCount === 0) return;

    if (wall.horizontal) {
      const availableWidth = wall.endX! - wall.startX!;
      const segmentWidth = availableWidth / (wall.holeCount + 1);
      wall.holes = Array.from({ length: wall.holeCount }, (_, i) => {
        const holeSize = this.height * 0.1 * Math.pow(0.9, i); // Each hole is 90% the size of the previous
        return {
          x: wall.startX! + segmentWidth * (i + 1) - (holeSize / 2),
          width: holeSize
        };
      });
    } else {
      const availableHeight = wall.endY! - wall.startY!;
      const segmentHeight = availableHeight / (wall.holeCount + 1);
      wall.holes = Array.from({ length: wall.holeCount }, (_, i) => {
        const holeSize = this.height * 0.1 * Math.pow(0.9, i); // Each hole is 90% the size of the previous
        return {
          y: wall.startY! + segmentHeight * (i + 1) - (holeSize / 2),
          height: holeSize
        };
      });
    }
  }

  openHolesInWall(wall: Wall, count: number) {
    if (!wall.holeCount) wall.holeCount = 0;
    wall.holeCount += count;
    this.redistributeHoles(wall);
  }

  getWallsBetweenStages(fromStage: string, toStage: string): Wall[] {
    const fromIndex = STAGES.findIndex(s => s.name === fromStage);
    const toIndex = STAGES.findIndex(s => s.name === toStage);

    if (fromIndex === -1 || toIndex === -1) return [];

    const wallIndex = Math.min(fromIndex, toIndex);
    const verticalWallIndex = wallIndex * 5;

    return this.walls.filter((wall, index) => {
      return wall.horizontal === false && 
             index === verticalWallIndex;
    });
  }

  getStageHorizontalWalls(stageName: string): Wall[] {
    const stageIndex = STAGES.findIndex(s => s.name === stageName);
    if (stageIndex === -1) return [];

    return this.walls.filter((_, index) => 
      Math.floor(index / 5) === stageIndex && 
      (index % 5 === 1 || index % 5 === 2)
    );
  }

  closeHoles(walls: Wall[]) {
    walls.forEach(wall => {
      wall.holes = [];
      wall.holeCount = 0;
    });
  }

  draw() {
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.width, this.height);

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

    const lineWidth = Math.max(1, this.height * 0.002);
    this.ctx.lineWidth = lineWidth;

    this.walls.forEach(wall => {
      if (wall.horizontal) {
        this.ctx.beginPath();
        this.ctx.moveTo(wall.startX!, wall.y!);
        this.ctx.lineTo(wall.endX!, wall.y!);
        this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        this.ctx.stroke();

        wall.holes.forEach(hole => {
          this.ctx.beginPath();
          this.ctx.moveTo(hole.x!, wall.y! - lineWidth);
          this.ctx.lineTo(hole.x! + hole.width!, wall.y! - lineWidth);
          this.ctx.lineTo(hole.x! + hole.width!, wall.y! + lineWidth);
          this.ctx.lineTo(hole.x!, wall.y! + lineWidth);
          this.ctx.closePath();
          this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
          this.ctx.fill();
        });
      } else {
        this.ctx.beginPath();
        this.ctx.moveTo(wall.x!, wall.startY!);
        this.ctx.lineTo(wall.x!, wall.endY!);
        this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        this.ctx.stroke();

        wall.holes.forEach(hole => {
          this.ctx.beginPath();
          this.ctx.moveTo(wall.x! - lineWidth, hole.y!);
          this.ctx.lineTo(wall.x! + lineWidth, hole.y!);
          this.ctx.lineTo(wall.x! + lineWidth, hole.y! + hole.height!);
          this.ctx.lineTo(wall.x! - lineWidth, hole.y! + hole.height!);
          this.ctx.closePath();
          this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
          this.ctx.fill();
        });
      }
    });

    this.ctx.restore();
  }
}