
import React from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { type FeatureSlider } from './hooks';
import RandomizeButton from './RandomizeButton';

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
  // Group sliders by category
  const slidersByCategory = featureSliders.reduce((acc, slider) => {
    if (!acc[slider.category]) {
      acc[slider.category] = [];
    }
    acc[slider.category].push(slider);
    return acc;
  }, {} as Record<string, FeatureSlider[]>);

  const handleSliderChange = (id: string, values: number[]) => {
    if (values.length > 0) {
      onSliderChange(id, values[0]);
    }
  };

  return (
    <Card className="h-[600px] overflow-y-auto">
      <CardContent className="p-4">
        <div className="flex justify-between mb-4">
          <h3 className="text-lg font-medium">Adjustments</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onReset}
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
                  <div className="relative z-20">
                    <Slider
                      id={slider.id}
                      min={slider.min}
                      max={slider.max}
                      step={slider.step}
                      value={[sliderValues[slider.id]]}
                      onValueChange={(values) => handleSliderChange(slider.id, values)}
                      onValueCommit={onSliderChangeComplete}
                      aria-label={`${slider.name} slider`}
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
