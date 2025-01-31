export interface ParticleOptions {
  x: number;
  y: number;
  radius: number;
  speed: number;
  color: string;
  type: 'customer' | 'partner';
}

interface Wall {
  x?: number;
  y?: number;
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
  hasCreatedHole: boolean;

  constructor(options: ParticleOptions) {
    this.x = options.x;
    this.y = options.y;
    this.radius = options.radius;
    this.speed = options.speed;
    this.color = options.color;
    this.type = options.type;
    this.verticalSpeed = this.type === 'partner' ? options.speed : (Math.random() - 0.5) * 2;
    this.active = true;
    this.hasCreatedHole = false;
  }

  update(canvasHeight: number, walls: Wall[]) {
    if (!this.active) return;

    // Update position
    this.x += this.speed;
    this.y += this.verticalSpeed;

    // Check canvas bounds
    if (this.x < 0 || this.x > canvasHeight * 2) {
      this.active = false;
    }

    // Check wall collisions
    walls.forEach(wall => {
      if (wall.horizontal) {
        // Horizontal wall collision
        if (Math.abs(this.y - wall.y!) < this.radius) {
          let canPass = false;
          wall.holes.forEach(hole => {
            if (this.x > hole.x! && this.x < hole.x! + hole.width!) {
              canPass = true;
            }
          });

          if (!canPass) {
            if (this.type === 'partner') {
              // Create a new hole when partner hits wall
              wall.holes.push({
                x: Math.max(0, this.x - 15),
                width: 30
              });
              this.verticalSpeed *= -0.5; // Bounce with reduced speed
            } else {
              // Regular bounce for customers
              this.y = wall.y! - (this.verticalSpeed > 0 ? this.radius + 1 : -this.radius - 1);
              this.verticalSpeed *= -0.5; // Bounce with reduced speed
            }
          }
        }
      } else {
        // Vertical wall collision
        if (Math.abs(this.x - wall.x!) < this.radius) {
          let canPass = false;
          wall.holes.forEach(hole => {
            if (this.y > hole.y! && this.y < hole.y! + hole.height!) {
              canPass = true;
            }
          });

          if (!canPass) {
            if (this.type === 'partner') {
              // Create a new hole when partner hits wall
              wall.holes.push({
                y: Math.max(0, this.y - 15),
                height: 30
              });
              this.speed *= -0.5; // Bounce with reduced speed
            } else {
              // Regular bounce for customers
              this.x = wall.x! - (this.speed > 0 ? this.radius + 1 : -this.radius - 1);
              this.speed *= -0.5; // Bounce with reduced speed
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