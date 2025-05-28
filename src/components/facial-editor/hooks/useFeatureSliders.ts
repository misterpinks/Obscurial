
import { useState } from 'react';

export interface FeatureSlider {
  id: string;
  name: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  category: string;
  color?: string;
}

export const useFeatureSliders = () => {
  // Define sliders with their properties
  const featureSliders: FeatureSlider[] = [
    { id: 'eyeSize', name: 'Eye Size', min: -75, max: 75, step: 1, defaultValue: 0, category: 'Eyes', color: '#1EAEDB' },
    { id: 'eyeSpacing', name: 'Eye Spacing', min: -75, max: 75, step: 1, defaultValue: 0, category: 'Eyes', color: '#1EAEDB' },
    { id: 'eyebrowHeight', name: 'Eyebrow Height', min: -75, max: 75, step: 1, defaultValue: 0, category: 'Eyes', color: '#1EAEDB' },
    { id: 'noseWidth', name: 'Nose Width', min: -75, max: 75, step: 1, defaultValue: 0, category: 'Nose', color: '#222222' },
    { id: 'noseLength', name: 'Nose Length', min: -75, max: 75, step: 1, defaultValue: 0, category: 'Nose', color: '#222222' },
    { id: 'mouthWidth', name: 'Mouth Width', min: -75, max: 75, step: 1, defaultValue: 0, category: 'Mouth', color: '#ea384c' },
    { id: 'mouthHeight', name: 'Mouth Height', min: -75, max: 75, step: 1, defaultValue: 0, category: 'Mouth', color: '#ea384c' },
    { id: 'faceWidth', name: 'Face Width', min: -75, max: 75, step: 1, defaultValue: 0, category: 'Face', color: '#F97316' },
    { id: 'chinShape', name: 'Chin Shape', min: -75, max: 75, step: 1, defaultValue: 0, category: 'Face', color: '#F97316' },
    { id: 'jawline', name: 'Jawline', min: -75, max: 75, step: 1, defaultValue: 0, category: 'Face', color: '#F97316' },
  ];

  // Initialize slider values with default values
  const [sliderValues, setSliderValues] = useState<Record<string, number>>(() => {
    return featureSliders.reduce((acc, slider) => {
      acc[slider.id] = slider.defaultValue;
      return acc;
    }, {} as Record<string, number>);
  });

  const handleSliderChange = (id: string, value: number | Record<string, number>) => {
    if (typeof value === 'number') {
      // Handle single slider change
      console.log(`Slider ${id} changed to ${value}`);
      setSliderValues((prev) => ({
        ...prev,
        [id]: value
      }));
    } else if (id === 'batch' && typeof value === 'object') {
      // Handle batch update of all slider values
      console.log("Batch updating sliders", value);
      setSliderValues({...value});
    }
  };

  const resetSliders = () => {
    console.log("Resetting all sliders to default values");
    const resetValues = featureSliders.reduce((acc, slider) => {
      acc[slider.id] = slider.defaultValue;
      return acc;
    }, {} as Record<string, number>);
    
    setSliderValues(resetValues);
  };

  const randomizeSliders = () => {
    console.log("Randomizing slider values");
    // Generate new random values for each slider
    const randomValues = featureSliders.reduce((acc, slider) => {
      // Use more moderate random values to avoid extremes
      const safeMin = Math.max(slider.min, -35);
      const safeMax = Math.min(slider.max, 35);
      
      // Generate random value within the range
      const range = safeMax - safeMin;
      acc[slider.id] = Math.round(safeMin + Math.random() * range);
      return acc;
    }, {} as Record<string, number>);
    
    console.log("New random values:", randomValues);
    setSliderValues({...randomValues});
  };

  return { featureSliders, sliderValues, handleSliderChange, resetSliders, randomizeSliders };
};
