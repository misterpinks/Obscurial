
import React, { useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { type FeatureSlider } from './hooks';
import RandomizeButton from './RandomizeButton';
import { useToast } from "@/components/ui/use-toast";
import SimpleSlider from './SimpleSlider';
import FacialRecognitionResources from './FacialRecognitionResources';

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
  const handleSliderValueChange = useCallback((id: string, value: number) => {
    console.log(`Slider ${id} changed to:`, value);
    onSliderChange(id, value);
  }, [onSliderChange]);

  // Handle slider change complete event
  const handleSliderChangeComplete = useCallback(() => {
    console.log(`Slider change completed`);
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
            <div className="space-y-4">
              {sliders.map((slider) => (
                <SimpleSlider
                  key={slider.id}
                  label={slider.name}
                  initialValue={sliderValues[slider.id]}
                  onChange={(value) => handleSliderValueChange(slider.id, value)}
                  onChangeComplete={handleSliderChangeComplete}
                  min={slider.min}
                  max={slider.max}
                  step={slider.step}
                  color={slider.color}
                />
              ))}
            </div>
          </div>
        ))}
        
        {/* Add the Facial Recognition Resources component */}
        <div className="mt-8">
          <h4 className="font-medium text-sm text-muted-foreground mb-2">Resources</h4>
          <Separator className="mb-4" />
          <FacialRecognitionResources />
        </div>
      </CardContent>
    </Card>
  );
};

export default AdjustmentSliders;
