export interface ParticleOptions {
  x: number;
  y: number;
  radius: number;
  speed: number;
  color: string;
  type: 'customer' | 'partner';
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

  update(canvasHeight: number, walls: {x: number, holes: {y: number, height: number}[]}[]) {
    if (!this.active) return;

    // Update position
    this.x += this.speed;
    this.y += this.verticalSpeed;

    // Check vertical bounds
    if (this.y - this.radius < 0 || this.y + this.radius > canvasHeight) {
      if (this.type === 'customer') {
        this.active = false; // Customer leaked
      } else {
        this.verticalSpeed *= -1; // Partner bounces
      }
    }

    // Check horizontal bounds
    if (this.x < 0 || this.x > canvasHeight * 2) {
      this.active = false;
    }

    // Check wall collisions
    walls.forEach((wall, index) => {
      if (Math.abs(this.x - wall.x) < this.radius) {
        let canPass = false;
        wall.holes.forEach(hole => {
          if (this.y > hole.y && this.y < hole.y + hole.height) {
            canPass = true;
          }
        });

        if (!canPass) {
          if (this.type === 'partner' && !this.hasCreatedHole) {
            // Create a new hole when partner hits wall
            wall.holes.push({
              y: Math.max(0, this.y - 15),
              height: 30
            });
            this.hasCreatedHole = true;
            this.speed *= -0.5; // Bounce with reduced speed
          } else {
            // Regular bounce for customers or partners that already created a hole
            this.x = wall.x - (this.speed > 0 ? this.radius + 1 : -this.radius - 1);
            this.speed *= -0.5; // Bounce with reduced speed
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