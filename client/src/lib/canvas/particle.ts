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
  scale: number;

  constructor(options: ParticleOptions) {
    this.x = options.x;
    this.y = options.y;
    this.radius = options.radius;
    this.speed = options.speed;
    this.color = options.color;
    this.type = options.type;
    this.verticalSpeed = this.type === 'partner' ? options.speed : (Math.random() - 0.5);
    this.active = true;
    this.currentStage = options.currentStage;
    const canvasWidth = options.canvasWidth || 1000;
    const canvasHeight = options.canvasHeight || 600;
    this.scale = Math.min(canvasWidth / 1000, canvasHeight / 600);
  }

  update(canvasHeight: number, walls: Wall[]) {
    if (!this.active) return;

    const scaledSpeed = this.speed * this.scale;
    const scaledVerticalSpeed = this.verticalSpeed * this.scale;

    // Calculate funnel boundaries based on x position
    const progress = this.x / (canvasHeight * 2);
    const narrowing = Math.sin(progress * Math.PI) * 0.15;
    const minY = canvasHeight * narrowing;
    const maxY = canvasHeight * (1 - narrowing);

    // Update horizontal position
    this.x += scaledSpeed;

    // For customer particles, strictly enforce funnel boundaries and prevent downward movement at bottom
    if (this.type === 'customer') {
      // Update vertical position with strict boundary enforcement
      const newY = this.y + scaledVerticalSpeed;

      // If particle hits bottom boundary, force it upward
      if (newY > maxY - this.radius) {
        this.y = maxY - this.radius;
        this.verticalSpeed = -Math.abs(this.verticalSpeed); // Force upward movement
      }
      // If particle hits top boundary, bounce
      else if (newY < minY + this.radius) {
        this.y = minY + this.radius;
        this.verticalSpeed *= -0.9;
      }
      else {
        this.y = newY;
      }
    } else {
      // Partner particles retain original behavior
      const newY = this.y + scaledVerticalSpeed;
      if (newY < minY || newY > maxY) {
        this.verticalSpeed *= -0.9;
        this.y = newY < minY ? minY : maxY;
      } else {
        this.y = newY;
      }
    }

    // Check canvas bounds
    if (this.x < 0 || this.x > canvasHeight * 2) {
      this.active = false;
      return;
    }

    // Handle wall collisions
    walls.forEach(wall => {
      const scaledRadius = this.radius * this.scale;

      if (wall.horizontal) {
        if (this.x >= wall.startX! && this.x <= wall.endX! && Math.abs(this.y - wall.y!) < scaledRadius) {
          let canPass = false;
          wall.holes.forEach(hole => {
            if (this.x > hole.x! && this.x < hole.x! + hole.width!) {
              canPass = true;
            }
          });

          if (!canPass) {
            if (this.type === 'partner') {
              wall.holes.push({
                x: Math.max(wall.startX!, Math.min(wall.endX! - 30 * this.scale, this.x - 15 * this.scale)),
                width: 30 * this.scale
              });
              this.verticalSpeed *= -0.9;
            } else {
              // For customers, ensure they bounce away from walls
              const isTopWall = wall.y! < this.canvas.height / 2;
              if (isTopWall) {
                this.verticalSpeed = Math.abs(this.verticalSpeed);
                this.y = wall.y! + scaledRadius;
              } else {
                this.verticalSpeed = -Math.abs(this.verticalSpeed);
                this.y = wall.y! - scaledRadius;
              }
            }
          }
        }
      } else {
        if (this.y >= wall.startY! && this.y <= wall.endY! && Math.abs(this.x - wall.x!) < scaledRadius) {
          let canPass = false;
          wall.holes.forEach(hole => {
            if (this.y > hole.y! && this.y < hole.y! + hole.height!) {
              if (this.type === 'customer') {
                canPass = this.speed > 0;
              } else {
                canPass = true;
              }
            }
          });

          if (!canPass) {
            if (this.type === 'partner') {
              wall.holes.push({
                y: Math.max(wall.startY!, Math.min(wall.endY! - 30 * this.scale, this.y - 15 * this.scale)),
                height: 30 * this.scale
              });
              this.speed *= -0.9;
            } else {
              this.x = wall.x! - (this.speed > 0 ? scaledRadius + 1 : -scaledRadius - 1);
              this.speed *= -0.9;
            }
          }
        }
      }
    });
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.active) return;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * this.scale, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

export interface ParticleOptions {
  x: number;
  y: number;
  radius: number;
  speed: number;
  color: string;
  type: 'customer' | 'partner';
  currentStage?: string;
  canvasWidth?: number;
  canvasHeight?: number;
}