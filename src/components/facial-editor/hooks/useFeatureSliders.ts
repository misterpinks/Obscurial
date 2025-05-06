
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
  // Updated slider ranges from -75 to 75 to prevent glitching at extreme values
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
      // Use a higher probability of more extreme values to make changes more noticeable
      const randomValue = () => {
        const range = slider.max - slider.min;
        const randomFactor = Math.random();
        // Apply a bias toward the extremes (more likely to be close to min or max)
        const biasedRandom = Math.pow(randomFactor * 2 - 1, 3) / 2 + 0.5; 
        return Math.round(slider.min + biasedRandom * range);
      };
      
      acc[slider.id] = randomValue();
      return acc;
    }, {} as Record<string, number>);
    
    setSliderValues(randomValues);
  };

  return { featureSliders, sliderValues, handleSliderChange, resetSliders, randomizeSliders };
};
