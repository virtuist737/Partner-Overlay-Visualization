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
    <div className="flex-1 flex items-stretch p-4 max-h-[100vh]">
      <Card className="w-full h-full flex flex-col p-6 overflow-hidden">
        <h1 className="text-2xl font-bold mb-4">Partner Overlay Visualization</h1>
        <div className="flex gap-2 mb-4">
          <Button
            onClick={() => {
              if (!showingCustomers) {
                visualization?.toggleCustomers();
                setShowingCustomers(true);
              }
            }}
            variant={showingCustomers ? "secondary" : "default"}
            disabled={showingCustomers}
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
          >
            {showingCustomers ? 'Pause' : 'Resume'}
          </Button>
          <Button
            onClick={() => {
              window.location.reload();
            }}
            variant="destructive"
          >
            Reset
          </Button>
        </div>
        <div className="flex gap-4 mb-4">
          <div className="flex-1 space-y-4">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-2">Partner Actions</h2>
                <div className="flex flex-wrap gap-2">
                  {PARTNER_ACTIONS.map((action) => (
                    <Button
                      key={action.action}
                      onClick={() => handlePartnerAction(action.action)}
                      variant="outline"
                      className="flex-grow"
                    >
                      {action.name}
                      <span className="ml-2 text-sm text-muted-foreground">
                        (${action.cost})
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="relative w-full flex-1 bg-black/5 rounded-lg overflow-hidden flex items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full"
                  />
                </div>

                <div className="mt-4 grid grid-cols-7 gap-4">
                  {STAGES.map((stage) => (
                    <div key={stage.name} className="text-center cursor-pointer">
                      <h3 className="text-lg font-semibold">{stage.name}</h3>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="w-80">
            <CardContent className="p-6 space-y-8">
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
                  <div className="pl-4 space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span>From Commits</span>
                      <span className="text-muted-foreground">{formatCurrency(revenue.commitRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>From Adoptions</span>
                      <span className="text-muted-foreground">{formatCurrency(revenue.adoptionRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>From Expansions</span>
                      <span className="text-muted-foreground">{formatCurrency(revenue.expansionRevenue)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Partner Costs</span>
                    <span className="text-muted-foreground text-red-500">-{formatCurrency(revenue.partnerCosts)}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold">
                    <span>Net Revenue</span>
                    <span className={revenue.netRevenue >= 0 ? "text-green-600" : "text-red-600"}>
                      {formatCurrency(revenue.netRevenue)}
                    </span>
                  </div>
                </div>

                <div className="mt-8 bg-blue-50 p-6 rounded-lg">
                  <h2 className="text-2xl font-bold text-center mb-2">Average Net Revenue per Customer</h2>
                  <p className="text-3xl text-center font-bold text-blue-600"
                     style={{ color: revenue.netRevenue >= 0 ? '#2563eb' : '#dc2626' }}>
                    {stats.length > 0 && stats[0].total > 0
                      ? formatCurrency(revenue.netRevenue / stats[0].total)
                      : '$0.00'}
                  </p>
                  <p className="text-sm text-center text-gray-600 mt-1">
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