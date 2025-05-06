
import React, { useCallback } from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { type FeatureSlider } from './hooks';
import RandomizeButton from './RandomizeButton';
import { useToast } from "@/components/ui/use-toast";

interface AdjustmentSlidersProps {
  featureSliders: FeatureSlider[];
  sliderValues: Record<string, number>;
  onSliderChange: (id: string, value: number) => void;
  onSliderChangeComplete?: () => void;
  onReset: () => void;
  onRandomize?: () => void;
  faceMaskSelector?: React.ReactNode;
}

const AdjustmentSliders: React.FC<AdjustmentSlidersProps> = ({
  featureSliders,
  sliderValues,
  onSliderChange,
  onSliderChangeComplete,
  onReset,
  onRandomize,
  faceMaskSelector
}) => {
  const { toast } = useToast();
  
  // Group sliders by category
  const slidersByCategory = featureSliders.reduce((acc, slider) => {
    if (!acc[slider.category]) {
      acc[slider.category] = [];
    }
    acc[slider.category].push(slider);
    return acc;
  }, {} as Record<string, FeatureSlider[]>);

  // Handle slider value change with proper logging
  const handleSliderValueChange = useCallback((id: string, values: number[]) => {
    if (values && values.length > 0) {
      console.log(`Slider ${id} changed to:`, values[0]);
      onSliderChange(id, values[0]);
    }
  }, [onSliderChange]);

  // Handle slider value commit when user finishes dragging
  const handleSliderValueCommit = useCallback(() => {
    console.log("Slider value committed, processing image");
    if (onSliderChangeComplete) {
      onSliderChangeComplete();
    }
  }, [onSliderChangeComplete]);

  // Handle reset with feedback
  const handleReset = useCallback(() => {
    console.log("Resetting all sliders");
    onReset();
    toast({
      title: "Reset Complete",
      description: "All sliders have been reset to default values"
    });
  }, [onReset, toast]);

  return (
    <Card className="h-[600px] overflow-y-auto relative">
      <CardContent className="p-4">
        <div className="flex justify-between mb-4">
          <h3 className="text-lg font-medium">Adjustments</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleReset}
          >
            Reset All
          </Button>
        </div>

        {/* Face Mask Selector Component if provided */}
        {faceMaskSelector && (
          <div className="mb-6">
            {faceMaskSelector}
          </div>
        )}

        {/* Randomize Button */}
        {onRandomize && (
          <div className="mb-4">
            <RandomizeButton onRandomize={onRandomize} />
          </div>
        )}

        {/* Render sliders by category */}
        {Object.entries(slidersByCategory).map(([category, sliders]) => (
          <div key={category} className="mb-6">
            <h4 className="font-medium text-sm text-muted-foreground mb-2">{category}</h4>
            <Separator className="mb-4" />
            <div className="space-y-6">
              {sliders.map((slider) => (
                <div key={slider.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span style={{color: slider.color}}>{slider.name}</span>
                    <span className="text-muted-foreground">{sliderValues[slider.id]}</span>
                  </div>
                  <div className="pt-2 pb-2" data-testid={`slider-container-${slider.id}`}>
                    <Slider
                      id={slider.id}
                      min={slider.min}
                      max={slider.max}
                      step={slider.step}
                      value={[sliderValues[slider.id]]}
                      onValueChange={(values) => handleSliderValueChange(slider.id, values)}
                      onValueCommit={handleSliderValueCommit}
                      aria-label={slider.name}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AdjustmentSliders;
