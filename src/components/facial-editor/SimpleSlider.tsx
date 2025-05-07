
import React from 'react';
import { Slider } from "@/components/ui/slider";

export interface SimpleSliderProps {
  label: string;
  initialValue: number;
  onChange: (value: number) => void;
  onChangeComplete?: () => void;
  min?: number;
  max?: number;
  step?: number;
  color?: string;
}

const SimpleSlider: React.FC<SimpleSliderProps> = ({
  label,
  initialValue = 0,
  onChange,
  onChangeComplete,
  min = 0,
  max = 100,
  step = 1,
  color
}) => {
  // Handle value change from the slider component
  const handleValueChange = (values: number[]) => {
    onChange(values[0]);
  };

  // Handle completion of slider movement with correct typing
  const handleValueCommit = () => {
    if (onChangeComplete) {
      onChangeComplete();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span style={color ? { color } : undefined}>{label}</span>
        <span className="text-muted-foreground">{initialValue}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[initialValue]}
        onValueChange={handleValueChange}
        onValueCommit={handleValueCommit}
        className="mt-1"
      />
    </div>
  );
};

export default SimpleSlider;
