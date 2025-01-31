import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Visualization } from '@/lib/canvas/visualization';
import { ZoomIn, ZoomOut } from 'lucide-react';

const STAGES = [
  { name: 'Awareness' },
  { name: 'Education' },
  { name: 'Selection' },
  { name: 'Commit' },
  { name: 'Onboarding' },
  { name: 'Adoption' },
  { name: 'Expansion' },
];

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visualization, setVisualization] = useState<Visualization | null>(null);
  const [showingCustomers, setShowingCustomers] = useState(false);
  const [stats, setStats] = useState<any[]>([]);
  const [conversionRates, setConversionRates] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any>({
    totalRevenue: 0,
    commitRevenue: 0,
    expansionRevenue: 0
  });
  const [zoom, setZoom] = useState(2); // Start with 2x zoom

  useEffect(() => {
    if (canvasRef.current) {
      const viz = new Visualization(canvasRef.current, zoom);
      setVisualization(viz);

      const updateStats = () => {
        if (viz) {
          setStats(viz.getStageStats());
          setConversionRates(viz.getConversionRates());
          setRevenue(viz.getRevenueStats());
        }
        requestAnimationFrame(updateStats);
      };
      updateStats();

      return () => {
        viz.destroy();
      };
    }
  }, []);

  const handleZoom = (delta: number) => {
    const newZoom = Math.max(0.5, Math.min(4, zoom + delta));
    setZoom(newZoom);
    if (visualization) {
      visualization.setZoom(newZoom);
    }
  };

  const handleCustomersToggle = () => {
    if (visualization) {
      visualization.toggleCustomers();
      setShowingCustomers(!showingCustomers);
    }
  };

  const handlePartnerAction = (action: string) => {
    if (!visualization) return;
    visualization.executePartnerAction(action);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="min-h-screen w-full p-4 bg-background">
      <Card className="mx-auto max-w-6xl">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold mb-4">Customer Journey Visualization</h1>

          <div className="flex flex-col gap-4 mb-4">
            <div className="flex gap-2">
              <Button 
                onClick={handleCustomersToggle} 
                variant={showingCustomers ? "secondary" : "default"}
              >
                {showingCustomers ? 'Stop Journey' : 'Start Customer Journey'}
              </Button>
              <Button 
                onClick={() => {
                  visualization?.reset();
                  setShowingCustomers(false);
                }}
                variant="destructive"
              >
                Reset
              </Button>
              <div className="flex gap-2 ml-auto">
                <Button
                  onClick={() => handleZoom(-0.25)}
                  variant="outline"
                  size="icon"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => handleZoom(0.25)}
                  variant="outline"
                  size="icon"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Partner Actions</h2>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => handlePartnerAction('seo_listicle')}
                  variant="outline"
                  className="flex-grow"
                >
                  Publish SEO Listicle
                </Button>
                <Button
                  onClick={() => handlePartnerAction('youtube_walkthrough')}
                  variant="outline"
                  className="flex-grow"
                >
                  Create YouTube Walkthrough
                </Button>
                <Button
                  onClick={() => handlePartnerAction('onboarding_services')}
                  variant="outline"
                  className="flex-grow"
                >
                  Sell Onboarding Services
                </Button>
                <Button
                  onClick={() => handlePartnerAction('reference_call')}
                  variant="outline"
                  className="flex-grow"
                >
                  Customer Reference Call
                </Button>
                <Button
                  onClick={() => handlePartnerAction('solution_management')}
                  variant="outline"
                  className="flex-grow"
                >
                  Solution Management Services
                </Button>
              </div>
            </div>
          </div>

          <div className="relative w-full aspect-[16/9] max-h-[70vh] bg-black/5 rounded-lg overflow-hidden flex items-center justify-center">
            <canvas 
              ref={canvasRef}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          <div className="mt-4 grid grid-cols-7 gap-4">
            {STAGES.map((stage) => (
              <div key={stage.name} className="text-center">
                <h3 className="text-lg font-semibold">{stage.name}</h3>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Stage Statistics</h2>
              <div className="space-y-2">
                {stats.map((stat: any) => (
                  <div key={stat.name} className="flex justify-between items-center">
                    <span>{stat.name}</span>
                    <span className="text-muted-foreground">
                      Current: {stat.current} | Total: {stat.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Conversion Rates</h2>
              <div className="space-y-2">
                {conversionRates.map((rate: any) => (
                  <div key={`${rate.from}-${rate.to}`} className="flex justify-between items-center">
                    <span>{rate.from} → {rate.to}</span>
                    <span className="text-muted-foreground">{rate.rate}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Revenue Statistics</h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Total Revenue</span>
                  <span className="text-muted-foreground">{formatCurrency(revenue.totalRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>From Commits</span>
                  <span className="text-muted-foreground">{formatCurrency(revenue.commitRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>From Expansions</span>
                  <span className="text-muted-foreground">{formatCurrency(revenue.expansionRevenue)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}