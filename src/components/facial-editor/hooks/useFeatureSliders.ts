
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
  // Updated slider ranges to match UI expectations 
  // but with internal safeguards against extreme values
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

  const [sliderValues, setSliderValues] = useState<Record<string, number>>(() => {
    // Initialize all sliders with their default values
    return featureSliders.reduce((acc, slider) => {
      acc[slider.id] = slider.defaultValue;
      return acc;
    }, {} as Record<string, number>);
  });

  const handleSliderChange = (id: string, value: number | Record<string, number>) => {
    if (typeof value === 'number') {
      // Handle single slider change
      setSliderValues((prev) => ({
        ...prev,
        [id]: value
      }));
    } else if (id === 'batch' && typeof value === 'object') {
      // Handle batch update of all slider values
      setSliderValues(value);
    }
  };

  const resetSliders = () => {
    const resetValues = featureSliders.reduce((acc, slider) => {
      acc[slider.id] = slider.defaultValue;
      return acc;
    }, {} as Record<string, number>);
    
    setSliderValues(resetValues);
  };

  const randomizeSliders = () => {
    const randomValues = featureSliders.reduce((acc, slider) => {
      // Generate random values within each slider's range
      // Use a more controlled range to avoid extreme values (-60 to 60 instead of full -75 to 75)
      const safeMin = Math.max(slider.min, -60);
      const safeMax = Math.min(slider.max, 60);
      const range = safeMax - safeMin;
      
      // Apply a bias toward reasonable values (closer to center than extremes)
      const randomFactor = Math.random();
      // This creates a bell curve effect for more natural results
      const biasedRandom = Math.pow(randomFactor * 2 - 1, 3) / 2 + 0.5;
      
      acc[slider.id] = Math.round(safeMin + biasedRandom * range);
      return acc;
    }, {} as Record<string, number>);
    
    // Apply the randomized values
    setSliderValues(randomValues);
  };

  return { featureSliders, sliderValues, handleSliderChange, resetSliders, randomizeSliders };
};
