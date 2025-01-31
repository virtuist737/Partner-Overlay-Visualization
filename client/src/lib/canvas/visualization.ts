import { Particle } from './particle';
import { Funnel, STAGES } from './funnel';

export class Visualization {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  funnel: Funnel;
  particles: Particle[];
  animationFrame: number;
  showingCustomers: boolean;
  showingPartners: boolean;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.setupCanvas();
    
    this.funnel = new Funnel(canvas);
    this.particles = [];
    this.showingCustomers = false;
    this.showingPartners = false;
    
    this.animate = this.animate.bind(this);
    this.animationFrame = requestAnimationFrame(this.animate);

    window.addEventListener('resize', this.handleResize);
  }

  setupCanvas() {
    // Set canvas size with device pixel ratio
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
  }

  handleResize = () => {
    this.setupCanvas();
    this.funnel = new Funnel(this.canvas);
  };

  toggleCustomers() {
    this.showingCustomers = !this.showingCustomers;
    if (this.showingCustomers) {
      this.startCustomerParticles();
    }
  }

  togglePartners() {
    this.showingPartners = !this.showingPartners;
    if (this.showingPartners) {
      this.startPartnerParticles();
    }
  }

  startCustomerParticles() {
    const createParticle = () => {
      if (!this.showingCustomers) return;

      this.particles.push(new Particle({
        x: 0,
        y: this.canvas.height * (0.3 + Math.random() * 0.4),
        radius: 4,
        speed: 2,
        color: 'rgba(59, 130, 246, 0.5)',
        type: 'customer'
      }));

      setTimeout(createParticle, 200);
    };

    createParticle();
  }

  startPartnerParticles() {
    const createPartner = () => {
      if (!this.showingPartners) return;

      // Create partners at the edges
      const y = Math.random() < 0.5 ? 0 : this.canvas.height;
      const x = Math.random() * this.canvas.width;

      this.particles.push(new Particle({
        x,
        y,
        radius: 6,
        speed: 0,
        color: 'rgba(34, 197, 94, 0.5)',
        type: 'partner'
      }));

      setTimeout(createPartner, 500);
    };

    createPartner();
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw funnel
    this.funnel.draw();

    // Update and draw particles
    this.particles = this.particles.filter(p => p.active);
    this.particles.forEach(particle => {
      particle.update(this.canvas.height, this.funnel.walls);
      particle.draw(this.ctx);
    });

    this.animationFrame = requestAnimationFrame(this.animate);
  }

  destroy() {
    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener('resize', this.handleResize);
  }
}
