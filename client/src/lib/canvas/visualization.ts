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
  dpr: number;
  resizeObserver: ResizeObserver;
  visualViewportHandler: (event: Event) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.dpr = Math.max(1, window.devicePixelRatio || 1);

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
    this.handleResize = this.handleResize.bind(this);
    this.animationFrame = requestAnimationFrame(this.animate);

    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });

    if (this.canvas.parentElement) {
      this.resizeObserver.observe(this.canvas.parentElement);
    }

    this.visualViewportHandler = () => {
      this.handleResize();
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this.visualViewportHandler);
      window.visualViewport.addEventListener('scale', this.visualViewportHandler);
    }
  }

  setupCanvas() {
    const updateDimensions = () => {
      this.dpr = Math.max(1, window.devicePixelRatio || 1);
      const rect = this.canvas.parentElement?.getBoundingClientRect() || { width: 800, height: 600 };

      const displayWidth = rect.width;
      const displayHeight = rect.height;

      this.canvas.style.width = `${displayWidth}px`;
      this.canvas.style.height = `${displayHeight}px`;

      this.canvas.width = Math.floor(displayWidth * this.dpr);
      this.canvas.height = Math.floor(displayHeight * this.dpr);

      this.ctx.scale(this.dpr, this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    };

    updateDimensions();
  }

  handleResize() {
    const oldWidth = this.canvas.width / this.dpr;
    const oldHeight = this.canvas.height / this.dpr;

    this.setupCanvas();

    const newWidth = this.canvas.width / this.dpr;
    const newHeight = this.canvas.height / this.dpr;

    const scaleX = newWidth / oldWidth;
    const scaleY = newHeight / oldHeight;

    this.particles.forEach(particle => {
      particle.x *= scaleX;
      particle.y *= scaleY;
      particle.updateScale(this.canvas);
    });

    this.funnel = new Funnel(this.canvas);
  }

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

  startCustomerParticles() {
    const createParticle = () => {
      if (!this.showingCustomers) return;

      const awarenessStats = this.stageStats.get('Awareness')!;
      awarenessStats.total++;
      awarenessStats.current++;
      this.stageStats.set('Awareness', awarenessStats);

      const rect = this.canvas.getBoundingClientRect();
      const startNarrowing = Math.sin(0) * 0.15;
      const minY = rect.height * startNarrowing + (rect.height * 0.05);
      const maxY = rect.height * (1 - startNarrowing) - (rect.height * 0.05);

      // Adjust starting X position to be more visible
      const startX = rect.width * 0.02;
      const y = minY + Math.random() * (maxY - minY);

      // Reduce particle size to 1/3 of previous size
      const baseRadius = Math.min(rect.width, rect.height) * 0.001; // Reduced from 0.003
      const baseSpeed = rect.width * 0.002;
      const verticalVariation = (Math.random() - 0.5) * baseSpeed * 0.5;

      this.particles.push(new Particle({
        x: startX,
        y,
        radius: baseRadius,
        speed: baseSpeed,
        color: 'rgba(0, 0, 0, 0.9)',
        type: 'customer',
        currentStage: 'Awareness',
        canvas: this.canvas,
        verticalSpeed: verticalVariation
      }));

      this.particleGenerators.customer = setTimeout(createParticle, 200);
    };

    createParticle();
  }

  updateParticleStage(particle: Particle, newStage: string) {
    if (particle.type !== 'customer' || particle.currentStage === newStage) return;

    const oldStageStats = this.stageStats.get(particle.currentStage!)!;
    oldStageStats.current--;
    this.stageStats.set(particle.currentStage!, oldStageStats);

    const newStageStats = this.stageStats.get(newStage)!;
    newStageStats.total++;
    newStageStats.current++;
    this.stageStats.set(newStage, newStageStats);

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

    this.revenue.netRevenue = this.revenue.totalRevenue - this.revenue.partnerCosts;

    particle.currentStage = newStage;
  }

  addPartner() {
    const rect = this.canvas.getBoundingClientRect();
    const stageWidth = rect.width / STAGES.length;
    const randomStage = Math.floor(Math.random() * STAGES.length);
    const x = (randomStage * stageWidth) + (Math.random() * stageWidth);

    const progress = randomStage / (STAGES.length - 1);
    const narrowing = Math.sin(progress * Math.PI) * 0.15;
    const minY = rect.height * narrowing;
    const maxY = rect.height * (1 - narrowing);
    const y = minY + (Math.random() * (maxY - minY));

    const baseScale = Math.min(rect.width / 1000, rect.height / 600);
    const baseRadius = 6 * baseScale;
    const baseSpeed = 2 * baseScale;

    const particle = new Particle({
      x,
      y,
      radius: baseRadius,
      speed: Math.random() < 0.5 ? baseSpeed : -baseSpeed,
      color: 'rgba(0, 0, 0, 0.8)',
      type: 'partner'
    });

    this.particles.push(particle);

    const wallIndex = Math.floor(x / (rect.width / STAGES.length));
    if (wallIndex > 0 && wallIndex < STAGES.length) {
      const holeY = y < rect.height / 2 ?
        rect.height * 0.2 + Math.random() * 0.2 :
        rect.height * 0.6 + Math.random() * 0.2;
      this.funnel.addHole(wallIndex - 1, holeY, rect.height * 0.03);
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

  startPartnerParticles() {
    const createPartner = () => {
      if (!this.showingPartners) return;

      const rect = this.canvas.getBoundingClientRect();
      const stageWidth = rect.width / STAGES.length;
      const randomStage = Math.floor(Math.random() * STAGES.length);
      const x = (randomStage * stageWidth) + (Math.random() * stageWidth);

      const progress = randomStage / (STAGES.length - 1);
      const narrowing = Math.sin(progress * Math.PI) * 0.15;
      const minY = rect.height * narrowing;
      const maxY = rect.height * (1 - narrowing);
      const y = minY + (Math.random() * (maxY - minY));

      const baseScale = Math.min(rect.width / 1000, rect.height / 600);
      const baseRadius = 6 * baseScale;
      const baseSpeed = 2 * baseScale;

      const particle = new Particle({
        x,
        y,
        radius: baseRadius,
        speed: Math.random() < 0.5 ? baseSpeed : -baseSpeed,
        color: 'rgba(0, 0, 0, 0.8)',
        type: 'partner'
      });

      this.particles.push(particle);

      const wallIndex = Math.floor(x / (rect.width / STAGES.length));
      if (wallIndex > 0 && wallIndex < STAGES.length) {
        const holeY = y < rect.height / 2 ?
          rect.height * 0.2 + Math.random() * 0.2 :
          rect.height * 0.6 + Math.random() * 0.2;
        this.funnel.addHole(wallIndex - 1, holeY, rect.height * 0.1);
      }

      this.particleGenerators.partner = setTimeout(createPartner, 500);
    };

    createPartner();
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.funnel.draw();

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
    this.resizeObserver.disconnect();

    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.visualViewportHandler);
      window.visualViewport.removeEventListener('scale', this.visualViewportHandler);
    }

    if (this.particleGenerators.customer) clearTimeout(this.particleGenerators.customer);
    if (this.particleGenerators.partner) clearTimeout(this.particleGenerators.partner);
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

  executePartnerAction(action: string) {
    const rect = this.canvas.getBoundingClientRect();
    const costs: Record<string, number> = {
      'seo_listicle': 100,
      'youtube_walkthrough': 100,
      'reference_call': 200,
      'onboarding_services': 300,
      'solution_management': 500
    };

    this.revenue.partnerCosts += costs[action] || 0;
    this.revenue.netRevenue = this.revenue.totalRevenue - this.revenue.partnerCosts;

    // Increased hole size for better particle flow
    const holeSize = rect.height * 0.1; // Increased from 0.05

    switch (action) {
      case 'seo_listicle': {
        const walls = this.funnel.getWallsBetweenStages('Awareness', 'Education');
        walls.forEach(wall => {
          wall.holes.push({
            y: rect.height * 0.3 + Math.random() * (rect.height * 0.4),
            height: holeSize
          });
        });
        break;
      }
      case 'youtube_walkthrough': {
        const walls = this.funnel.getWallsBetweenStages('Education', 'Selection');
        walls.forEach(wall => {
          wall.holes.push({
            y: rect.height * 0.3 + Math.random() * (rect.height * 0.4),
            height: holeSize
          });
        });
        break;
      }
      case 'reference_call': {
        const walls = this.funnel.getWallsBetweenStages('Selection', 'Commit');
        walls.forEach(wall => {
          wall.holes.push({
            y: rect.height * 0.3 + Math.random() * (rect.height * 0.4),
            height: holeSize
          });
        });
        break;
      }
      case 'onboarding_services': {
        const walls = this.funnel.getWallsBetweenStages('Commit', 'Onboarding');
        walls.forEach(wall => {
          wall.holes.push({
            y: rect.height * 0.3 + Math.random() * (rect.height * 0.4),
            height: holeSize
          });
        });
        break;
      }
      case 'solution_management': {
        const onboardingWalls = this.funnel.getWallsBetweenStages('Onboarding', 'Adoption');
        onboardingWalls.forEach(wall => {
          wall.holes.push({
            y: rect.height * 0.3 + Math.random() * (rect.height * 0.4),
            height: holeSize
          });
        });
        const expansionWalls = this.funnel.getWallsBetweenStages('Adoption', 'Expansion');
        expansionWalls.forEach(wall => {
          wall.holes.push({
            y: rect.height * 0.3 + Math.random() * (rect.height * 0.4),
            height: holeSize
          });
        });
        break;
      }
    }
  }
}