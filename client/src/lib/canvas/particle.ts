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

  constructor(options: ParticleOptions) {
    this.x = options.x;
    this.y = options.y;
    this.radius = options.radius;
    this.speed = options.speed;
    this.color = options.color;
    this.type = options.type;
    this.verticalSpeed = (Math.random() - 0.5) * 2;
    this.active = true;
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

    // Check wall collisions
    walls.forEach(wall => {
      if (Math.abs(this.x - wall.x) < this.radius) {
        let canPass = false;
        wall.holes.forEach(hole => {
          if (this.y > hole.y && this.y < hole.y + hole.height) {
            canPass = true;
          }
        });

        if (!canPass) {
          this.x = wall.x - (this.speed > 0 ? this.radius + 1 : -this.radius - 1);
          this.speed *= -0.5; // Bounce with reduced speed
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
