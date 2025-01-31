import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Visualization } from '@/lib/canvas/visualization';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visualization, setVisualization] = useState<Visualization | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const viz = new Visualization(canvasRef.current);
      setVisualization(viz);
      
      return () => {
        viz.destroy();
      };
    }
  }, []);

  const handleShowCustomers = () => {
    visualization?.toggleCustomers();
  };

  const handleShowPartners = () => {
    visualization?.togglePartners();
  };

  return (
    <div className="min-h-screen w-full p-4 bg-background">
      <Card className="mx-auto max-w-6xl">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold mb-4">Customer Journey Visualization</h1>
          
          <div className="flex gap-4 mb-4">
            <Button onClick={handleShowCustomers} variant="default">
              Show Customers
            </Button>
            <Button onClick={handleShowPartners} variant="secondary">
              Show Partners
            </Button>
          </div>

          <div className="relative w-full aspect-[2/1] bg-black/5 rounded-lg overflow-hidden">
            <canvas 
              ref={canvasRef}
              className="w-full h-full"
            />
          </div>

          <div className="mt-4 flex justify-between text-sm text-muted-foreground">
            <span>Awareness</span>
            <span>Education</span>
            <span>Selection</span>
            <span>Commit</span>
            <span>Onboarding</span>
            <span>Adoption</span>
            <span>Expansion</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
