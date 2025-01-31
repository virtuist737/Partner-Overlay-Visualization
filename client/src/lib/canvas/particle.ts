import { ParticleOptions } from './types';

interface Wall {
  x?: number;
  y?: number;
  startX?: number;
  endX?: number;
  startY?: number;
  endY?: number;
  horizontal: boolean;
  holes: { x?: number; y?: number; width?: number; height?: number; }[];
}

export class Particle {
  x: number;
  y: number;
  radius: number;
  speed: number;
  color: string;
  type: 'customer' | 'partner';
  verticalSpeed: number;
  active: boolean;
  currentStage?: string;
  canvas: HTMLCanvasElement;

  constructor(options: ParticleOptions) {
    this.x = options.x;
    this.y = options.y;
    this.radius = this.calculateRelativeRadius(options.radius, options.canvas!);
    this.speed = this.calculateRelativeSpeed(options.speed, options.canvas!);
    this.color = options.color;
    this.type = options.type;
    this.verticalSpeed = options.verticalSpeed ? 
      this.calculateRelativeSpeed(options.verticalSpeed, options.canvas!) : 
      (this.type === 'partner' ? this.speed : (Math.random() - 0.5) * this.speed);
    this.active = true;
    this.currentStage = options.currentStage;
    this.canvas = options.canvas!;
  }

  calculateRelativeRadius(baseRadius: number, canvas: HTMLCanvasElement): number {
    const rect = canvas.getBoundingClientRect();
    const viewportDimension = Math.min(rect.width, rect.height);
    return (baseRadius * viewportDimension) / 100;
  }

  calculateRelativeSpeed(baseSpeed: number, canvas: HTMLCanvasElement): number {
    const rect = canvas.getBoundingClientRect();
    const viewportDimension = Math.min(rect.width, rect.height);
    return (baseSpeed / 100) * viewportDimension;
  }

  updateScale(canvas: HTMLCanvasElement) {
    this.radius = this.calculateRelativeRadius(this.radius, canvas);
    this.speed = this.calculateRelativeSpeed(this.speed, canvas);
    this.verticalSpeed = this.calculateRelativeSpeed(this.verticalSpeed, canvas);
  }

  update(canvasHeight: number, walls: Wall[]) {
    if (!this.active) return;

    const rect = this.canvas.getBoundingClientRect();
    const progress = this.x / rect.width;
    const narrowing = Math.sin(progress * Math.PI) * 0.15;

    // Calculate boundaries relative to viewport
    const minY = canvasHeight * narrowing + (this.radius * 2);
    const maxY = canvasHeight * (1 - narrowing) - (this.radius * 2);

    this.x += this.speed;
    const newY = this.y + this.verticalSpeed;

    if (newY > maxY - this.radius || newY < minY + this.radius) {
      this.verticalSpeed *= -0.8;
      this.y = newY > maxY - this.radius ? maxY - this.radius : minY + this.radius;
    } else {
      this.y = newY;
    }

    if (this.x < 0 || this.x > rect.width) {
      this.active = false;
      return;
    }

    walls.forEach(wall => {
      if (wall.horizontal) {
        if (this.x >= wall.startX! && this.x <= wall.endX! && Math.abs(this.y - wall.y!) < this.radius) {
          let canPass = false;
          wall.holes.forEach(hole => {
            if (this.x > hole.x! && this.x < hole.x! + hole.width!) {
              canPass = true;
            }
          });

          if (!canPass) {
            if (this.type === 'partner') {
              const holeWidth = rect.width * 0.03;
              wall.holes.push({
                x: Math.max(wall.startX!, Math.min(wall.endX! - holeWidth, this.x - holeWidth/2)),
                width: holeWidth
              });
              this.verticalSpeed *= -0.8;
            } else {
              this.verticalSpeed *= -0.8;
              this.y = wall.y! + (this.verticalSpeed > 0 ? this.radius : -this.radius);
            }
          }
        }
      } else {
        if (this.y >= wall.startY! && this.y <= wall.endY! && Math.abs(this.x - wall.x!) < this.radius) {
          let canPass = false;
          wall.holes.forEach(hole => {
            if (this.y > hole.y! && this.y < hole.y! + hole.height!) {
              canPass = this.type === 'customer' ? this.speed > 0 : true;
            }
          });

          if (!canPass) {
            if (this.type === 'partner') {
              const holeHeight = rect.height * 0.03;
              wall.holes.push({
                y: Math.max(wall.startY!, Math.min(wall.endY! - holeHeight, this.y - holeHeight/2)),
                height: holeHeight
              });
              this.speed *= -0.8;
            } else {
              this.x = wall.x! - (this.speed > 0 ? this.radius : -this.radius);
              this.speed *= -0.8;
            }
          }
        }
      }
    });
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.active) return;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}