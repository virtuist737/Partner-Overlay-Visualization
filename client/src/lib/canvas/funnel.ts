export interface Stage {
  name: string;
  color: string;
  gradient: string[];
}

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

export class Funnel {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  stageWidth: number;
  walls: { x: number; holes: { y: number; height: number; }[]; }[];

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
    // Create walls between stages
    for (let i = 1; i < STAGES.length; i++) {
      this.walls.push({
        x: i * this.stageWidth,
        holes: [
          { y: this.height * 0.4, height: this.height * 0.2 }
        ]
      });
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw funnel segments
    STAGES.forEach((stage, i) => {
      const x = i * this.stageWidth;
      const narrowing = Math.sin((i / (STAGES.length - 1)) * Math.PI) * 0.2;
      
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

      // Draw partition lines
      if (i > 0) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.height);
        this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }
    });
  }
}
