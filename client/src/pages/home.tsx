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
    // Pause visualization if total customers reach 100
    if (stats.length > 0 && stats[0].total >= 100 && visualization && showingCustomers) {
      visualization.pause();
      setShowingCustomers(false);
    }
  }, [stats, visualization, showingCustomers]);

  return (
    <div className="flex-1 flex p-4 h-full">
      <Card className="w-full flex flex-col p-6 overflow-auto bg-card/50 backdrop-blur-sm border-none shadow-2xl">
        <h1 className="text-2xl font-bold mb-4 text-primary">Customer Journey Visualization</h1>
        <div className="flex gap-2 mb-4 flex-wrap">
          <Button
            onClick={() => {
              if (!showingCustomers) {
                visualization?.toggleCustomers();
                setShowingCustomers(true);
              }
            }}
            variant={showingCustomers ? "secondary" : "default"}
            disabled={showingCustomers}
            className="min-w-[100px]"
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
            className="min-w-[100px]"
          >
            {showingCustomers ? 'Pause' : 'Resume'}
          </Button>
          <Button
            onClick={() => {
              window.location.reload();
            }}
            variant="destructive"
            className="min-w-[100px]"
          >
            Reset
          </Button>
        </div>
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
          <div className="flex-1 flex flex-col gap-6 min-h-0 overflow-auto">
            <Card className="border-none shadow-lg bg-card/80">
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold mb-3 text-primary">Partner Actions</h2>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  {PARTNER_ACTIONS.map((action) => (
                    <Button
                      key={action.action}
                      onClick={() => handlePartnerAction(action.action)}
                      variant="outline"
                      className="w-full h-full py-2 hover:bg-primary/10"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span>{action.name}</span>
                        <span className="text-sm text-muted-foreground">
                          ${action.cost}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-card/80 flex-1">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="relative flex-1 bg-black/10 rounded-lg overflow-hidden flex items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full"
                  />
                </div>

                <div className="mt-6 grid grid-cols-7 gap-4">
                  {STAGES.map((stage) => (
                    <div key={stage.name} className="text-center cursor-pointer group">
                      <h3 className="text-sm font-medium text-primary/80 group-hover:text-primary transition-colors">
                        {stage.name}
                      </h3>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="w-full lg:w-96 border-none shadow-lg bg-card/80 flex-shrink-0">
            <CardContent className="p-6 h-full overflow-auto">
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-primary">Statistics</h2>
                  <div className="space-y-4">
                    {stats.map((stat: any) => (
                      <div key={stat.name} className="flex justify-between items-center">
                        <span className="text-primary/90">{stat.name}</span>
                        <span className="text-muted-foreground font-mono">
                          {stat.current} / {stat.total}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4 text-primary">Conversion</h2>
                  <div className="space-y-4">
                    {conversionRates.map((rate: any) => (
                      <div key={`${rate.from}-${rate.to}`} className="flex justify-between items-center">
                        <span className="text-primary/90">{rate.from} → {rate.to}</span>
                        <span className="text-muted-foreground font-mono">{rate.rate}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4 text-primary">Revenue</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-primary/90">Total Revenue</span>
                      <span className="text-muted-foreground font-mono">{formatCurrency(revenue.totalRevenue)}</span>
                    </div>
                    <div className="pl-4 space-y-2">
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
                    <div className="flex justify-between items-center">
                      <span className="text-primary/90">Partner Costs</span>
                      <span className="text-red-500 font-mono">{formatCurrency(revenue.partnerCosts)}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-primary">Net Revenue</span>
                      <span className={`font-mono ${revenue.netRevenue >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {formatCurrency(revenue.netRevenue)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 bg-primary/5 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-center mb-2 text-primary">Average Revenue per Customer</h2>
                    <p className="text-3xl text-center font-bold"
                       style={{ color: revenue.netRevenue >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }}>
                      {stats.length > 0 && stats[0].total > 0
                        ? formatCurrency(revenue.netRevenue / stats[0].total)
                        : '$0.00'}
                    </p>
                    <p className="text-sm text-center text-muted-foreground mt-2">
                      Based on {stats.length > 0 ? stats[0].total : 0}/100 total potential customers
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Card>
    </div>
  );
}