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
  particleGenerators: { customer?: NodeJS.Timeout; partner?: NodeJS.Timeout };
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.setupCanvas();

    this.funnel = new Funnel(canvas);
    this.particles = [];
    this.showingCustomers = false;
    this.showingPartners = false;
    this.particleGenerators = {};

    this.animate = this.animate.bind(this);
    this.animationFrame = requestAnimationFrame(this.animate);

    window.addEventListener('resize', this.handleResize);
  }

  setupCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const height = rect.height;

    this.canvas.width = rect.width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.scale(dpr, dpr);

    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${height}px`;
  }

  handleResize = () => {
    this.setupCanvas();
    this.funnel = new Funnel(this.canvas);
  };

  toggleCustomers() {
    this.showingCustomers = !this.showingCustomers;
    // Clear existing customer particles
    this.particles = this.particles.filter(p => p.type !== 'customer');

    if (this.showingCustomers) {
      this.startCustomerParticles();
    } else {
      if (this.particleGenerators.customer) {
        clearTimeout(this.particleGenerators.customer);
      }
    }
  }

  addPartner() {
    const stageWidth = this.canvas.width / STAGES.length;
    const randomStage = Math.floor(Math.random() * STAGES.length);
    const x = (randomStage * stageWidth) + (Math.random() * stageWidth);
    
    const progress = randomStage / (STAGES.length - 1);
    const narrowing = Math.sin(progress * Math.PI) * 0.15;
    const minY = this.canvas.height * narrowing;
    const maxY = this.canvas.height * (1 - narrowing);
    const y = minY + (Math.random() * (maxY - minY));

    const particle = new Particle({
      x,
      y,
      radius: 6,
      speed: Math.random() < 0.5 ? 2 : -2,
      color: 'rgba(34, 197, 94, 0.5)',
      type: 'partner'
    });

    this.particles.push(particle);

    const wallIndex = Math.floor(x / (this.canvas.width / STAGES.length));
    if (wallIndex > 0 && wallIndex < STAGES.length) {
      const holeY = y < this.canvas.height / 2 ? 
        this.canvas.height * 0.2 + Math.random() * 0.2 : 
        this.canvas.height * 0.6 + Math.random() * 0.2;
      this.funnel.addHole(wallIndex - 1, holeY, this.canvas.height * 0.1);
    }
  }

  removePartner() {
    const partnerIndex = this.particles.findIndex(p => p.type === 'partner');
    if (partnerIndex !== -1) {
      this.particles.splice(partnerIndex, 1);
    }
  }

  reset() {
    this.particles = [];
    this.showingCustomers = false;
    this.showingPartners = false;
    if (this.particleGenerators.customer) clearTimeout(this.particleGenerators.customer);
    if (this.particleGenerators.partner) clearTimeout(this.particleGenerators.partner);
    this.funnel = new Funnel(this.canvas);
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

      this.particleGenerators.customer = setTimeout(createParticle, 200);
    };

    createParticle();
  }

  startPartnerParticles() {
    const createPartner = () => {
      if (!this.showingPartners) return;

      // Create partners at random positions inside the funnel
      const stageWidth = this.canvas.width / STAGES.length;
      const randomStage = Math.floor(Math.random() * STAGES.length);
      const x = (randomStage * stageWidth) + (Math.random() * stageWidth);

      // Calculate y position within the funnel's narrowing shape
      const progress = randomStage / (STAGES.length - 1);
      const narrowing = Math.sin(progress * Math.PI) * 0.15;
      const minY = this.canvas.height * narrowing;
      const maxY = this.canvas.height * (1 - narrowing);
      const y = minY + (Math.random() * (maxY - minY));

      const particle = new Particle({
        x,
        y,
        radius: 6,
        speed: Math.random() < 0.5 ? 2 : -2,
        color: 'rgba(34, 197, 94, 0.5)',
        type: 'partner'
      });

      this.particles.push(particle);

      // Create new holes in nearby walls when partners are added
      const wallIndex = Math.floor(x / (this.canvas.width / STAGES.length));
      if (wallIndex > 0 && wallIndex < STAGES.length) {
        // Use particle's y position to determine hole position
        const holeY = y < this.canvas.height / 2 ? 
          this.canvas.height * 0.2 + Math.random() * 0.2 : 
          this.canvas.height * 0.6 + Math.random() * 0.2;
        this.funnel.addHole(wallIndex - 1, holeY, this.canvas.height * 0.1);
      }

      this.particleGenerators.partner = setTimeout(createPartner, 500);
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
    if (this.particleGenerators.customer) clearTimeout(this.particleGenerators.customer);
    if (this.particleGenerators.partner) clearTimeout(this.particleGenerators.partner);
  }
}