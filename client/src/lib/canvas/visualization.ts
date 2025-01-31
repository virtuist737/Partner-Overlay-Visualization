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
  partnerCosts: number;
  netRevenue: number;
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
      adoptionRevenue: 0,
      partnerCosts: 0,
      netRevenue: 0
    };

    this.animate = this.animate.bind(this);
    this.animationFrame = requestAnimationFrame(this.animate);

    window.addEventListener('resize', this.handleResize);
  }

  setupCanvas() {
    const updateDimensions = () => {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.ctx.scale(dpr, dpr);
      
      this.canvas.style.width = `${rect.width}px`;
      this.canvas.style.height = `${rect.height}px`;
    };

    updateDimensions();

    // Listen for zoom changes
    window.visualViewport?.addEventListener('resize', updateDimensions);
    window.visualViewport?.addEventListener('scale', updateDimensions);

    // Add regular resize listener as fallback
    window.addEventListener('resize', updateDimensions);
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
    if (this.showingCustomers) {
      this.startCustomerParticles();
    } else {
      if (this.particleGenerators.customer) {
        clearTimeout(this.particleGenerators.customer);
      }
    }
  }

  pause() {
    if (this.particleGenerators.customer) {
      clearTimeout(this.particleGenerators.customer);
    }
    cancelAnimationFrame(this.animationFrame);
  }

  resume() {
    if (this.showingCustomers) {
      this.startCustomerParticles();
    }
    this.animate();
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
      adoptionRevenue: 0,
      partnerCosts: 0,
      netRevenue: 0
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

      // Calculate the funnel height at the start (Awareness stage)
      const startNarrowing = Math.sin(0) * 0.15; // At x = 0, progress = 0
      const minY = this.canvas.height * startNarrowing + 20; // Add offset to avoid top edge
      const maxY = this.canvas.height * (1 - startNarrowing) - 20; // Subtract offset to avoid bottom edge

      // Randomize starting position within the first 10% of the canvas width
      const startX = Math.random() * (this.canvas.width * 0.1);
      const y = minY + Math.random() * (maxY - minY);

      // Randomize initial speed and direction
      // Slower base speed with more randomness in direction
      const baseSpeed = 1.5 + Math.random() * 2; // Speed between 1.5 and 3.5
      const verticalVariation = (Math.random() - 0.5) * 2; // More vertical variation
      
      // Use wider initial area (first 20% of canvas)
      const startX = Math.random() * (this.canvas.width * 0.2);
      
      this.particles.push(new Particle({
        x: startX,
        y,
        radius: 3,
        speed: Math.random() < 0.2 ? -baseSpeed : baseSpeed, // Sometimes start moving left
        color: 'rgba(0, 0, 0, 0.8)',
        type: 'customer',
        currentStage: 'Awareness',
        canvasWidth: this.canvas.width,
        canvasHeight: this.canvas.height,
        canvas: this.canvas,
        verticalSpeed: verticalVariation
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

    // Update net revenue after any revenue changes
    this.revenue.netRevenue = this.revenue.totalRevenue - this.revenue.partnerCosts;

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

    // Update and draw particles
    this.particles = this.particles.filter(p => p.active);
    this.particles.forEach(particle => {
      if (particle.type === 'customer') {
        const stageIndex = Math.floor((particle.x / this.canvas.width) * STAGES.length);
        if (stageIndex >= 0 && stageIndex < STAGES.length) {
          this.updateParticleStage(particle, STAGES[stageIndex].name);
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
    const costs: Record<string, number> = {
      'seo_listicle': 100,
      'youtube_walkthrough': 100,
      'reference_call': 200,
      'onboarding_services': 300,
      'solution_management': 500
    };

    // Add cost to partner costs
    this.revenue.partnerCosts += costs[action] || 0;
    // Update net revenue
    this.revenue.netRevenue = this.revenue.totalRevenue - this.revenue.partnerCosts;

    switch (action) {
      case 'seo_listicle': {
        const walls = this.funnel.getWallsBetweenStages('Awareness', 'Education');
        walls.forEach(wall => this.funnel.openHolesInWall(wall, 1));
        break;
      }
      case 'youtube_walkthrough': {
        const walls = this.funnel.getWallsBetweenStages('Education', 'Selection');
        walls.forEach(wall => this.funnel.openHolesInWall(wall, 1));
        break;
      }
      case 'reference_call': {
        const walls = this.funnel.getWallsBetweenStages('Selection', 'Commit');
        walls.forEach(wall => this.funnel.openHolesInWall(wall, 1));
        break;
      }
      case 'onboarding_services': {
        const walls = this.funnel.getWallsBetweenStages('Commit', 'Onboarding');
        walls.forEach(wall => this.funnel.openHolesInWall(wall, 1));
        break;
      }
      case 'solution_management': {
        const onboardingWalls = this.funnel.getWallsBetweenStages('Onboarding', 'Adoption');
        onboardingWalls.forEach(wall => this.funnel.openHolesInWall(wall, 1));
        const expansionWalls = this.funnel.getWallsBetweenStages('Adoption', 'Expansion');
        expansionWalls.forEach(wall => this.funnel.openHolesInWall(wall, 1));
        break;
      }
    }
  }
}