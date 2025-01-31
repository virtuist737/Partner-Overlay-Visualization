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

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visualization, setVisualization] = useState<Visualization | null>(null);
  const [showingCustomers, setShowingCustomers] = useState(false);
  const [showingPartners, setShowingPartners] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      const viz = new Visualization(canvasRef.current);
      setVisualization(viz);

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

  const handlePartnersToggle = () => {
    if (visualization) {
      visualization.togglePartners();
      setShowingPartners(!showingPartners);
    }
  };

  return (
    <div className="min-h-screen w-full p-4 bg-background">
      <Card className="mx-auto max-w-6xl">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold mb-4">Customer Journey Visualization</h1>

          <div className="flex gap-4 mb-4">
            <div className="flex gap-2">
              <Button 
                onClick={handleCustomersToggle} 
                variant={showingCustomers ? "secondary" : "default"}
              >
                {showingCustomers ? 'Hide Customers' : 'Show Customers'}
              </Button>
              <Button 
                onClick={handlePartnersToggle} 
                variant={showingPartners ? "secondary" : "default"}
              >
                {showingPartners ? 'Hide Partners' : 'Show Partners'}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => visualization?.zoomOut()} variant="outline">-</Button>
              <Button onClick={() => visualization?.resetZoom()} variant="outline">Reset</Button>
              <Button onClick={() => visualization?.zoomIn()} variant="outline">+</Button>
            </div>
          </div>

          <div className="relative w-full h-[60vh] min-h-[400px] bg-black/5 rounded-lg overflow-hidden">
            <canvas 
              ref={canvasRef}
              className="w-full h-full"
            />
          </div>

          <div className="mt-4 flex justify-between text-sm text-muted-foreground">
            {STAGES.map((stage) => (
              <span key={stage.name}>{stage.name}</span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}