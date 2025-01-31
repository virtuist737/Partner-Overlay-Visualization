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
  horizontal: boolean;
  holes: { x?: number; y?: number; width?: number; height?: number; }[];
}

export class Funnel {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  stageWidth: number;
  walls: Wall[];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;
    this.stageWidth = this.width / STAGES.length;
    this.walls = [];
    this.setupWalls();
  }

  setupWalls() {
    // Create vertical walls between stages
    for (let i = 1; i < STAGES.length; i++) {
      this.walls.push({
        x: i * this.stageWidth,
        horizontal: false,
        holes: [
          { y: this.height * 0.4, height: this.height * 0.2 }
        ]
      });
    }

    // Create horizontal walls for each stage
    for (let i = 0; i < STAGES.length; i++) {
      const x = i * this.stageWidth;
      const narrowing = Math.sin((i / (STAGES.length - 1)) * Math.PI) * 0.15;

      // Top wall
      this.walls.push({
        y: this.height * narrowing,
        horizontal: true,
        holes: [
          { x: x + this.stageWidth * 0.4, width: this.stageWidth * 0.2 }
        ]
      });

      // Bottom wall
      this.walls.push({
        y: this.height * (1 - narrowing),
        horizontal: true,
        holes: [
          { x: x + this.stageWidth * 0.4, width: this.stageWidth * 0.2 }
        ]
      });
    }
  }

  addHole(wallIndex: number, position: number, size: number) {
    if (wallIndex >= 0 && wallIndex < this.walls.length) {
      const wall = this.walls[wallIndex];
      if (wall.horizontal) {
        wall.holes.push({ x: position, width: size });
      } else {
        wall.holes.push({ y: position, height: size });
      }
    }
  }

  draw() {
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

    // Draw walls and holes
    this.walls.forEach(wall => {
      if (wall.horizontal) {
        // Draw horizontal wall
        this.ctx.beginPath();
        this.ctx.moveTo(0, wall.y!);
        this.ctx.lineTo(this.width, wall.y!);
        this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw holes
        wall.holes.forEach(hole => {
          this.ctx.beginPath();
          this.ctx.moveTo(hole.x!, wall.y! - 2);
          this.ctx.lineTo(hole.x! + hole.width!, wall.y! - 2);
          this.ctx.lineTo(hole.x! + hole.width!, wall.y! + 2);
          this.ctx.lineTo(hole.x!, wall.y! + 2);
          this.ctx.closePath();
          this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
          this.ctx.fill();
        });
      } else {
        // Draw vertical wall
        this.ctx.beginPath();
        this.ctx.moveTo(wall.x!, 0);
        this.ctx.lineTo(wall.x!, this.height);
        this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw holes
        wall.holes.forEach(hole => {
          this.ctx.beginPath();
          this.ctx.moveTo(wall.x! - 2, hole.y!);
          this.ctx.lineTo(wall.x! + 2, hole.y!);
          this.ctx.lineTo(wall.x! + 2, hole.y! + hole.height!);
          this.ctx.lineTo(wall.x! - 2, hole.y! + hole.height!);
          this.ctx.closePath();
          this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
          this.ctx.fill();
        });
      }
    });
  }
}