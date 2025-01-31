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
  baseRadius: number;
  canvas: HTMLCanvasElement;

  constructor(options: ParticleOptions) {
    this.x = options.x;
    this.y = options.y;
    this.baseRadius = options.radius;
    this.speed = options.speed;
    this.color = options.color;
    this.type = options.type;
    this.verticalSpeed = options.verticalSpeed || 
      (this.type === 'partner' ? options.speed : (Math.random() - 0.5) * 1.2);
    this.active = true;
    this.currentStage = options.currentStage;
    this.canvas = options.canvas!;

    // Calculate initial scale
    const canvasWidth = options.canvasWidth || 1000;
    const canvasHeight = options.canvasHeight || 600;
    this.scale = Math.min(canvasWidth / 1000, canvasHeight / 600);
    this.radius = this.baseRadius * this.scale;
  }

  updateScale(canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const baseWidth = 1000; // Reference width
    const baseHeight = 600; // Reference height

    // Calculate scale based on both dimensions
    const widthScale = rect.width / baseWidth;
    const heightScale = rect.height / baseHeight;

    // Use the smaller scale to maintain proportions
    this.scale = Math.min(widthScale, heightScale);

    // Update radius with new scale
    this.radius = this.baseRadius * this.scale;
  }

  update(canvasHeight: number, walls: Wall[]) {
    if (!this.active) return;

    const scaledSpeed = this.speed * this.scale;
    const scaledVerticalSpeed = this.verticalSpeed * this.scale;
    const scaledRadius = this.radius;

    // Calculate funnel boundaries based on x position with tighter constraints
    const progress = this.x / this.canvas.width;
    const narrowing = Math.sin(progress * Math.PI) * 0.15;
    const minY = canvasHeight * narrowing + (scaledRadius * 2);
    const maxY = canvasHeight * (1 - narrowing) - (scaledRadius * 2);

    // Update positions
    this.x += scaledSpeed;
    const newY = this.y + scaledVerticalSpeed;

    // Enforce funnel boundaries with elastic collisions
    if (newY > maxY - scaledRadius || newY < minY + scaledRadius) {
      this.verticalSpeed *= -0.8; // Elastic collision with slight energy loss
      this.y = newY > maxY - scaledRadius ? maxY - scaledRadius : minY + scaledRadius;
    } else {
      this.y = newY;
    }

    // Check canvas bounds
    if (this.x < 0 || this.x > this.canvas.width) {
      this.active = false;
      return;
    }

    // Handle wall collisions
    walls.forEach(wall => {
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
              this.verticalSpeed *= -0.8;
            } else {
              // Elastic collision for customers
              this.verticalSpeed *= -0.8;
              this.y = wall.y! + (this.verticalSpeed > 0 ? scaledRadius : -scaledRadius);
            }
          }
        }
      } else {
        if (this.y >= wall.startY! && this.y <= wall.endY! && Math.abs(this.x - wall.x!) < scaledRadius) {
          let canPass = false;
          wall.holes.forEach(hole => {
            if (this.y > hole.y! && this.y < hole.y! + hole.height!) {
              canPass = this.type === 'customer' ? this.speed > 0 : true;
            }
          });

          if (!canPass) {
            if (this.type === 'partner') {
              wall.holes.push({
                y: Math.max(wall.startY!, Math.min(wall.endY! - 30 * this.scale, this.y - 15 * this.scale)),
                height: 30 * this.scale
              });
              this.speed *= -0.8;
            } else {
              this.x = wall.x! - (this.speed > 0 ? scaledRadius : -scaledRadius);
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