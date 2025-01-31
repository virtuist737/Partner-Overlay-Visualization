import { Particle } from './particle';
import { Funnel, STAGES } from './funnel';

interface StageStats {
  total: number;
  current: number;
}

interface ConversionStats {
  from: string;
  to: string;
  rate: number;
}

interface RevenueStats {
  totalRevenue: number;
  commitRevenue: number;
  expansionRevenue: number;
  adoptionRevenue: number;
}

export class Visualization {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  funnel: Funnel;
  particles: Particle[];
  animationFrame: number;
  showingCustomers: boolean;
  showingPartners: boolean;
  particleGenerators: { customer?: NodeJS.Timeout; partner?: NodeJS.Timeout };
  stageStats: Map<string, StageStats>;
  revenue: RevenueStats;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.setupCanvas();

    this.funnel = new Funnel(canvas);
    this.particles = [];
    this.showingCustomers = false;
    this.showingPartners = false;
    this.particleGenerators = {};
    this.stageStats = new Map(
      STAGES.map(stage => [stage.name, { total: 0, current: 0 }])
    );
    this.revenue = {
      totalRevenue: 0,
      commitRevenue: 0,
      expansionRevenue: 0,
      adoptionRevenue: 0
    };

    this.animate = this.animate.bind(this);
    this.animationFrame = requestAnimationFrame(this.animate);

    window.addEventListener('resize', this.handleResize);
  }

  setupCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Set the canvas dimensions to match the container size
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    // Scale the canvas context
    this.ctx.scale(dpr, dpr);

    // Set the display dimensions of the canvas via CSS
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
  }

  handleResize = () => {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;

    // Use the container dimensions directly
    const width = rect.width;
    const height = rect.height;

    // Update canvas style dimensions
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    // Update actual canvas dimensions
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;

    // Reset scale and update funnel
    this.ctx.scale(dpr, dpr);
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
      color: 'rgba(0, 0, 0, 0.8)',
      type: 'partner'
    });

    this.particles.push(particle);

    const wallIndex = Math.floor(x / (this.canvas.width / STAGES.length));
    if (wallIndex > 0 && wallIndex < STAGES.length) {
      const holeY = y < this.canvas.height / 2 ?
        this.canvas.height * 0.2 + Math.random() * 0.2 :
        this.canvas.height * 0.6 + Math.random() * 0.2;
      this.funnel.addHole(wallIndex - 1, holeY, this.canvas.height * 0.03);
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
    this.stageStats = new Map(
      STAGES.map(stage => [stage.name, { total: 0, current: 0 }])
    );
    this.revenue = {
      totalRevenue: 0,
      commitRevenue: 0,
      expansionRevenue: 0,
      adoptionRevenue: 0
    };
  }

  startCustomerParticles() {
    const createParticle = () => {
      if (!this.showingCustomers) return;

      // Update Awareness stage count when creating new particle
      const awarenessStats = this.stageStats.get('Awareness')!;
      awarenessStats.total++;
      awarenessStats.current++;
      this.stageStats.set('Awareness', awarenessStats);

      this.particles.push(new Particle({
        x: 0,
        y: this.canvas.height * (0.3 + Math.random() * 0.4),
        radius: 4,
        speed: 2,
        color: 'rgba(0, 0, 0, 0.8)',
        type: 'customer',
        currentStage: 'Awareness'
      }));

      this.particleGenerators.customer = setTimeout(createParticle, 200);
    };

    createParticle();
  }

  updateParticleStage(particle: Particle, newStage: string) {
    if (particle.type !== 'customer' || particle.currentStage === newStage) return;

    // Decrease count in old stage
    const oldStageStats = this.stageStats.get(particle.currentStage!)!;
    oldStageStats.current--;
    this.stageStats.set(particle.currentStage!, oldStageStats);

    // Increase count in new stage
    const newStageStats = this.stageStats.get(newStage)!;
    newStageStats.total++;
    newStageStats.current++;
    this.stageStats.set(newStage, newStageStats);

    // Update revenue when reaching Commit, Expansion, or Adoption stages
    if (newStage === 'Commit') {
      this.revenue.commitRevenue += 1000;
      this.revenue.totalRevenue += 1000;
    } else if (newStage === 'Expansion') {
      this.revenue.expansionRevenue += 1000;
      this.revenue.totalRevenue += 1000;
    } else if (newStage === 'Adoption') {
      this.revenue.adoptionRevenue += 1000;
      this.revenue.totalRevenue += 1000;
    }

    particle.currentStage = newStage;
  }

  getStageStats(): StageStats[] {
    return STAGES.map(stage => ({
      name: stage.name,
      ...this.stageStats.get(stage.name)!
    }));
  }

  getConversionRates(): ConversionStats[] {
    const rates: ConversionStats[] = [];

    for (let i = 0; i < STAGES.length - 1; i++) {
      const fromStage = STAGES[i].name;
      const toStage = STAGES[i + 1].name;
      const fromStats = this.stageStats.get(fromStage)!;
      const toStats = this.stageStats.get(toStage)!;

      const rate = fromStats.total === 0 ? 0 : (toStats.total / fromStats.total) * 100;

      rates.push({
        from: fromStage,
        to: toStage,
        rate: Math.round(rate * 10) / 10
      });
    }

    return rates;
  }

  getRevenueStats(): RevenueStats {
    return { ...this.revenue };
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
        color: 'rgba(0, 0, 0, 0.8)',
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

    // Draw partition
    const partitionWidth = this.canvas.width * 0.1;
    this.ctx.fillStyle = 'rgba(20, 184, 166, 0.1)';
    this.ctx.fillRect(this.canvas.width - partitionWidth, 0, partitionWidth, this.canvas.height);
    this.ctx.strokeStyle = 'rgba(20, 184, 166, 0.3)';
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width - partitionWidth, 0);
    this.ctx.lineTo(this.canvas.width - partitionWidth, this.canvas.height);
    this.ctx.stroke();

    // Update and draw particles
    this.particles = this.particles.filter(p => p.active);
    this.particles.forEach(particle => {
      if (particle.type === 'customer') {
        const stageIndex = Math.floor((particle.x / this.canvas.width) * STAGES.length);
        if (stageIndex >= 0 && stageIndex < STAGES.length) {
          this.updateParticleStage(particle, STAGES[stageIndex].name);
        }
        // Store particles that reach the end in the partition
        if (particle.x >= this.canvas.width - partitionWidth) {
          particle.x = this.canvas.width - partitionWidth + (Math.random() * partitionWidth * 0.8);
          particle.y = Math.random() * this.canvas.height;
          particle.speed = 0;
          particle.verticalSpeed = 0;
        }
      }
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

  executePartnerAction(action: string) {
    switch (action) {
      case 'seo_listicle':
      case 'youtube_walkthrough':
        this.funnel.createEducationSelectionHoles();
        break;
      case 'onboarding_services':
        this.funnel.createCommitOnboardingHoles();
        break;
      case 'reference_call':
        this.funnel.patchSelectionStageHoles();
        break;
      case 'solution_management':
        this.funnel.manageAdoptionExpansionHoles();
        break;
    }
  }
}