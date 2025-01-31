export interface Stage {
  name: string;
  color: string;
  gradient: [string, string];
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
  canvas?: HTMLCanvasElement;
}