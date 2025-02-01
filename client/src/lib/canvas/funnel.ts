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

    this.initWalls();
  }

  initWalls() {
    this.walls = [];

    // Add walls for the Awareness section
    const firstNarrowing = Math.sin(0) * 0.15;

    // Left wall
    this.walls.push({
      horizontal: false,
      x: 0,
      startY: this.height * firstNarrowing,
      endY: this.height * (1 - firstNarrowing),
      holes: []
    });

    // Top wall
    this.walls.push({
      horizontal: true,
      y: this.height * firstNarrowing,
      startX: 0,
      endX: this.stageWidth,
      holes: []
    });

    // Bottom wall
    this.walls.push({
      horizontal: true,
      y: this.height * (1 - firstNarrowing),
      startX: 0,
      endX: this.stageWidth,
      holes: []
    });

    // Add walls between stages
    STAGES.forEach((_, i) => {
      if (i === STAGES.length - 1) return;

      const x = (i + 1) * this.stageWidth;
      const narrowing = Math.sin((i / (STAGES.length - 1)) * Math.PI) * 0.15;
      const nextNarrowing = Math.sin(((i + 1) / (STAGES.length - 1)) * Math.PI) * 0.15;

      // Vertical wall between stages
      this.walls.push({
        horizontal: false,
        x,
        startY: this.height * Math.min(narrowing, nextNarrowing),
        endY: this.height * (1 - Math.min(narrowing, nextNarrowing)),
        holes: []
      });
    });

    // Add walls for the Expansion section (last stage)
    const lastNarrowing = Math.sin(1) * 0.15;
    const lastX = (STAGES.length - 1) * this.stageWidth;

    // Right wall
    this.walls.push({
      horizontal: false,
      x: this.width,
      startY: this.height * lastNarrowing,
      endY: this.height * (1 - lastNarrowing),
      holes: []
    });

    // Top wall
    this.walls.push({
      horizontal: true,
      y: this.height * lastNarrowing,
      startX: lastX,
      endX: this.width,
      holes: []
    });

    // Bottom wall
    this.walls.push({
      horizontal: true,
      y: this.height * (1 - lastNarrowing),
      startX: lastX,
      endX: this.width,
      holes: []
    });
  }

  redistributeHoles(wall: Wall) {
    if (!wall.holeCount || wall.holeCount === 0) return;

    if (wall.horizontal) {
      const availableWidth = wall.endX! - wall.startX!;
      // Calculate hole sizes first (15% smaller each time)
      const holeSizes = Array.from({ length: wall.holeCount }, (_, i) => 
        this.width * 0.1 * Math.pow(0.85, i)
      );

      // Calculate total holes width
      const totalHolesWidth = holeSizes.reduce((sum, size) => sum + size, 0);

      // Calculate equal spacing between holes and edges
      const remainingSpace = availableWidth - totalHolesWidth;
      const spacing = remainingSpace / (wall.holeCount + 1);

      // Position holes with equal un-holed wall lengths
      let currentX = wall.startX! + spacing;
      wall.holes = holeSizes.map(holeSize => {
        const hole = {
          x: currentX,
          width: holeSize
        };
        currentX += holeSize + spacing;
        return hole;
      });
    } else {
      const availableHeight = wall.endY! - wall.startY!;
      // Calculate hole sizes first (15% smaller each time)
      const holeSizes = Array.from({ length: wall.holeCount }, (_, i) => 
        this.height * 0.1 * Math.pow(0.85, i)
      );

      // Calculate total holes height
      const totalHolesHeight = holeSizes.reduce((sum, size) => sum + size, 0);

      // Calculate equal spacing between holes and edges
      const remainingSpace = availableHeight - totalHolesHeight;
      const spacing = remainingSpace / (wall.holeCount + 1);

      // Position holes with equal un-holed wall lengths
      let currentY = wall.startY! + spacing;
      wall.holes = holeSizes.map(holeSize => {
        const hole = {
          y: currentY,
          height: holeSize
        };
        currentY += holeSize + spacing;
        return hole;
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
    // Account for 3 initial walls + 3 end walls
    const verticalWallIndex = wallIndex + 3;

    return this.walls.filter((wall, index) => {
      return wall.horizontal === false && 
             index === verticalWallIndex;
    });
  }

  getStageHorizontalWalls(stageName: string): Wall[] {
    const stageIndex = STAGES.findIndex(s => s.name === stageName);
    if (stageIndex === -1) return [];

    const startIndex = stageIndex * 5;
    return this.walls.filter((_, index) => index >= startIndex && index < startIndex + 5 && index !== startIndex + 3);
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