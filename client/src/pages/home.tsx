import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Visualization } from '@/lib/canvas/visualization';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  { name: 'SEO Listicle', action: 'seo_listicle', cost: 500 },
  { name: 'YouTube Video', action: 'youtube_walkthrough', cost: 750 },
  { name: 'Customer Reference Call', action: 'reference_call', cost: 500 },
  { name: 'Onboarding Services', action: 'onboarding_services', cost: 1000 },
  { name: 'Management Services', action: 'solution_management', cost: 2500 },
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
    <div className="flex-1 flex p-4 h-full overflow-hidden">
      <Card className="w-full flex flex-col p-4 bg-card/50 backdrop-blur-sm border-none shadow-2xl overflow-hidden">
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <h1 className="text-lg md:text-xl font-bold text-primary whitespace-nowrap">Partner Overlay Visualization</h1>
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
              className="min-w-[60px]"
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
              disabled={!showingCustomers}
              className="min-w-[60px]"
            >
              Pause
            </Button>
            <Button
              onClick={() => {
                window.location.reload();
              }}
              variant="destructive"
              size="sm"
              className="min-w-[60px]"
            >
              Reset
            </Button>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            <Card className="border-none shadow-lg bg-card/80">
              <CardContent className="p-3">
                <h2 className="text-sm md:text-base font-semibold mb-2 text-primary">Partner Actions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {PARTNER_ACTIONS.map((action) => (
                    <Button
                      key={action.action}
                      onClick={() => handlePartnerAction(action.action)}
                      variant="outline"
                      size="sm"
                      className="h-14 relative text-xs sm:text-sm"
                      disabled={!showingCustomers || !visualization?.canExecutePartnerAction(action.action)}
                    >
                      <span className="absolute top-1 right-1.5 text-xs font-mono text-muted-foreground">
                        ${action.cost}
                      </span>
<<<<<<< HEAD
<span className="text-xs sm:text-sm md:text-base font-medium text-primary mt-2">
=======
                      <span className="text-xs sm:text-sm md:text-base font-bold text-primary mt-2">
>>>>>>> dev
                        {action.name}
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg bg-card/80 flex-1 min-h-0">
              <CardContent className="p-3 h-full flex flex-col">
                <div className="relative flex-1 bg-black/10 rounded-lg overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full"
                    style={{
                      touchAction: 'none',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                </div>
                <div className="mt-2 grid grid-cols-7 gap-1 text-center">
                  {STAGES.map((stage) => (
                    <div key={stage.name} className="text-center px-1">
<<<<<<< HEAD
<h3 className="text-xs sm:text-sm md:text-base font-medium text-primary truncate pt-1">
=======
                      <h3 className="text-sm sm:text-base md:text-lg font-bold text-primary truncate pt-1">
>>>>>>> dev
                        {stage.name}
                      </h3>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="lg:w-72 xl:w-80 border-none shadow-lg bg-card/80 flex-shrink-0">
            <CardContent className="p-3">
              <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
                <div className="space-y-4">
                  <div className="bg-primary/5 p-3 rounded-lg mb-4">
                    <h2 className="text-base md:text-lg font-semibold text-center mb-1 text-primary">Potential Customers</h2>
                    <p className="text-xl text-center font-bold text-primary/90">
                      {stats[0]?.total || 0}/100
                    </p>
                  </div>
                  <div>
                    <h2 className="text-sm md:text-base font-semibold mb-2 text-primary">Statistics</h2>
                    <div className="space-y-1.5">
                      {stats.map((stat: any) => (
                        <div key={stat.name} className="flex justify-between items-center text-xs sm:text-sm">
                          <span className="text-primary/90">{stat.name}</span>
                          <span className="text-muted-foreground font-mono">
                            {stat.current} / {stat.total}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-sm md:text-base font-semibold mb-2 text-primary">Conversion</h2>
                    <div className="space-y-1.5">
                      {conversionRates.map((rate: any) => (
                        <div key={`${rate.from}-${rate.to}`} className="flex justify-between items-center text-xs sm:text-sm">
                          <span className="text-primary/90">{rate.from} → {rate.to}</span>
                          <span className="text-muted-foreground font-mono">{rate.rate}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-sm md:text-base font-semibold mb-2 text-primary">Revenue</h2>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs sm:text-sm">
                        <span className="text-primary/90">Total Revenue</span>
                        <span className="text-muted-foreground font-mono">{formatCurrency(revenue.totalRevenue)}</span>
                      </div>
                      <div className="pl-3 space-y-1">
                        <div className="flex justify-between items-center text-xs sm:text-sm">
                          <span className="text-primary/80">From Commits</span>
                          <span className="text-muted-foreground font-mono">{formatCurrency(revenue.commitRevenue)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs sm:text-sm">
                          <span className="text-primary/80">From Adoptions</span>
                          <span className="text-muted-foreground font-mono">{formatCurrency(revenue.adoptionRevenue)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs sm:text-sm">
                          <span className="text-primary/80">From Expansions</span>
                          <span className="text-muted-foreground font-mono">{formatCurrency(revenue.expansionRevenue)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs sm:text-sm">
                        <span className="text-primary/90">Partner Costs</span>
                        <span className="text-red-500 font-mono">{formatCurrency(revenue.partnerCosts)}</span>
                      </div>
                      </div>
                    <div className="mt-4 bg-primary/5 p-3 rounded-lg">
                      <h2 className="text-base md:text-lg font-semibold text-center mb-1 text-primary">Net Revenue</h2>
                      <p className="text-xl text-center font-bold"
                         style={{ color: revenue.netRevenue >= 0 ? '#22c55e' : '#ef4444' }}>
                        {formatCurrency(revenue.netRevenue)}
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </Card>
    </div>
  );
}