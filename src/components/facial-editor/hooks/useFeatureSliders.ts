
import { useState, useCallback } from 'react';

export type FeatureSlider = {
  id: string;
  name: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  category: string;
  color?: string;
};

export const useFeatureSliders = () => {
  // Feature adjustment sliders configuration
  const featureSliders: FeatureSlider[] = [
    { id: 'eyeSize', name: 'Eye Size', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Eyes', color: '#1EAEDB' },
    { id: 'eyeSpacing', name: 'Eye Spacing', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Eyes', color: '#1EAEDB' },
    { id: 'eyebrowHeight', name: 'Eyebrow Height', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Eyes', color: '#1EAEDB' },
    { id: 'noseWidth', name: 'Nose Width', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Nose', color: '#FEF7CD' },
    { id: 'noseLength', name: 'Nose Length', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Nose', color: '#FEF7CD' },
    { id: 'mouthWidth', name: 'Mouth Width', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Mouth', color: '#ea384c' },
    { id: 'mouthHeight', name: 'Mouth Height', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Mouth', color: '#ea384c' },
    { id: 'faceWidth', name: 'Face Width', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Face', color: '#F97316' },
    { id: 'chinShape', name: 'Chin Shape', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Face', color: '#F97316' },
    { id: 'jawline', name: 'Jawline', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Face', color: '#F97316' },
    { id: 'noiseLevel', name: 'Noise Level', min: 0, max: 30, step: 1, defaultValue: 10, category: 'Privacy' },
    // New face symmetry options
    { id: 'mirrorFace', name: 'Face Symmetry', min: 0, max: 1, step: 1, defaultValue: 0, category: 'Symmetry' },
    { id: 'mirrorSide', name: 'Mirror Side', min: 0, max: 1, step: 1, defaultValue: 0, category: 'Symmetry' },
  ];

  const [sliderValues, setSliderValues] = useState<Record<string, number>>(() => {
    // Initialize all sliders with their default values
    return featureSliders.reduce((acc, slider) => {
      acc[slider.id] = slider.defaultValue;
      return acc;
    }, {} as Record<string, number>);
  });

  const handleSliderChange = useCallback((id: string, value: number) => {
    setSliderValues((prev) => ({
      ...prev,
      [id]: value
    }));
  }, []);

  const resetSliders = useCallback(() => {
    const resetValues = featureSliders.reduce((acc, slider) => {
      acc[slider.id] = slider.defaultValue;
      return acc;
    }, {} as Record<string, number>);
    
    setSliderValues(resetValues);
  }, [featureSliders]);

  const randomizeSliders = useCallback((excludeCategories: string[] = []) => {
    setSliderValues((prev) => {
      const newValues = { ...prev };
      featureSliders.forEach(slider => {
        if (!excludeCategories.includes(slider.category)) {
          const range = slider.max - slider.min;
          newValues[slider.id] = Math.floor(Math.random() * range) + slider.min;
        }
      });
      return newValues;
    });
  }, [featureSliders]);

  // Toggle the mirrorFace value between 0 and 1
  const toggleMirrorFace = useCallback(() => {
    setSliderValues(prev => ({
      ...prev,
      mirrorFace: prev.mirrorFace === 1 ? 0 : 1
    }));
  }, []);

  // Toggle the mirror side value between 0 and 1
  const toggleMirrorSide = useCallback(() => {
    setSliderValues(prev => ({
      ...prev,
      mirrorSide: prev.mirrorSide === 1 ? 0 : 1
    }));
  }, []);

  return {
    featureSliders,
    sliderValues,
    handleSliderChange,
    resetSliders,
    randomizeSliders,
    toggleMirrorFace,
    toggleMirrorSide
  };
};
