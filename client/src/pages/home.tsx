import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Visualization } from '@/lib/canvas/visualization';

const STAGES = [
  { name: 'Awareness' },
  { name: 'Education' },
  { name: 'Selection' },
  { name: 'Commit' },
  { name: 'Onboarding' },
  { name: 'Adoption' },
  { name: 'Expansion' },
];

const PARTNER_ACTIONS = [
  { name: 'SEO Listicle', action: 'seo_listicle', cost: 100 },
  { name: 'YouTube Video', action: 'youtube_walkthrough', cost: 100 },
  { name: 'Customer Reference Call', action: 'reference_call', cost: 200 },
  { name: 'Onboarding Services', action: 'onboarding_services', cost: 200 },
  { name: 'Management Services', action: 'solution_management', cost: 300 },
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
    expansionRevenue: 0,
    adoptionRevenue: 0,
    partnerCosts: 0,
    netRevenue: 0,
  });

  useEffect(() => {
    if (canvasRef.current) {
      const viz = new Visualization(canvasRef.current);
      setVisualization(viz);

      const updateStats = () => {
        if (viz) {
          setStats(viz.getStageStats());
          setConversionRates(viz.getConversionRates());
          const revStats = viz.getRevenueStats();
          setRevenue(revStats);
        }
        requestAnimationFrame(updateStats);
      };
      updateStats();

      return () => {
        viz.destroy();
      };
    }
  }, []);

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

  useEffect(() => {
    if (stats.length > 0 && stats[0].total >= 100 && visualization && showingCustomers) {
      visualization.pause();
      setShowingCustomers(false);
    }
  }, [stats, visualization, showingCustomers]);

  return (
    <div className="flex-1 flex p-4 h-full">
      <Card className="w-full flex flex-col p-4 bg-card/50 backdrop-blur-sm border-none shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-primary">Customer Journey Visualization</h1>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (!showingCustomers) {
                  visualization?.toggleCustomers();
                  setShowingCustomers(true);
                }
              }}
              variant={showingCustomers ? "secondary" : "default"}
              disabled={showingCustomers}
              size="sm"
            >
              Start
            </Button>
            <Button
              onClick={() => {
                if (visualization) {
                  if (showingCustomers) {
                    visualization.pause();
                  } else {
                    visualization.resume();
                  }
                  setShowingCustomers(!showingCustomers);
                }
              }}
              variant="outline"
              size="sm"
            >
              Resume
            </Button>
            <Button
              onClick={() => {
                window.location.reload();
              }}
              variant="destructive"
              size="sm"
            >
              Reset
            </Button>
          </div>
        </div>

        <div className="flex gap-4 flex-1 min-h-0">
          <div className="flex-1 flex flex-col gap-3">
            <Card className="border-none shadow-lg bg-card/80">
              <CardContent className="p-3">
                <h2 className="text-sm font-semibold mb-2 text-primary">Partner Actions</h2>
                <div className="grid grid-cols-5 gap-2">
                  {PARTNER_ACTIONS.map((action) => (
                    <Button
                      key={action.action}
                      onClick={() => handlePartnerAction(action.action)}
                      variant="outline"
                      size="sm"
                      className="h-14"
                    >
                      <div className="flex flex-col items-center text-sm gap-1">
                        <span className="text-center">{action.name}</span>
                        <span className="text-muted-foreground">
                          ${action.cost}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-card/80 flex-1">
              <CardContent className="p-3 h-full flex flex-col">
                <div className="relative flex-1 bg-black/10 rounded-lg overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full"
                  />
                </div>
                <div className="mt-2 grid grid-cols-7 gap-2">
                  {STAGES.map((stage) => (
                    <div key={stage.name} className="text-center">
                      <h3 className="text-sm font-medium text-primary/80">
                        {stage.name}
                      </h3>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="w-72 border-none shadow-lg bg-card/80">
            <CardContent className="p-3 space-y-4">
              <div>
                <h2 className="text-sm font-semibold mb-2 text-primary">Statistics</h2>
                <div className="space-y-1.5">
                  {stats.map((stat: any) => (
                    <div key={stat.name} className="flex justify-between items-center text-sm">
                      <span className="text-primary/90">{stat.name}</span>
                      <span className="text-muted-foreground font-mono">
                        {stat.current} / {stat.total}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold mb-2 text-primary">Conversion</h2>
                <div className="space-y-1.5">
                  {conversionRates.map((rate: any) => (
                    <div key={`${rate.from}-${rate.to}`} className="flex justify-between items-center text-sm">
                      <span className="text-primary/90">{rate.from} → {rate.to}</span>
                      <span className="text-muted-foreground font-mono">{rate.rate}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold mb-2 text-primary">Revenue</h2>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-primary/90">Total Revenue</span>
                    <span className="text-muted-foreground font-mono">{formatCurrency(revenue.totalRevenue)}</span>
                  </div>
                  <div className="pl-3 space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-primary/80">From Commits</span>
                      <span className="text-muted-foreground font-mono">{formatCurrency(revenue.commitRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-primary/80">From Adoptions</span>
                      <span className="text-muted-foreground font-mono">{formatCurrency(revenue.adoptionRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-primary/80">From Expansions</span>
                      <span className="text-muted-foreground font-mono">{formatCurrency(revenue.expansionRevenue)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-primary/90">Partner Costs</span>
                    <span className="text-red-500 font-mono">{formatCurrency(revenue.partnerCosts)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium pt-1">
                    <span className="text-primary">Net Revenue</span>
                    <span className={`font-mono ${revenue.netRevenue >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {formatCurrency(revenue.netRevenue)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 bg-primary/5 p-3 rounded-lg">
                  <h2 className="text-sm font-semibold text-center mb-1 text-primary">Average Revenue per Customer</h2>
                  <p className="text-xl text-center font-bold"
                     style={{ color: revenue.netRevenue >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }}>
                    {stats.length > 0 && stats[0].total > 0
                      ? formatCurrency(revenue.netRevenue / stats[0].total)
                      : '$0.00'}
                  </p>
                  <p className="text-xs text-center text-muted-foreground mt-1">
                    Based on {stats.length > 0 ? stats[0].total : 0}/100 total potential customers
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Card>
    </div>
  );
}