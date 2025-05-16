
import { useCallback } from 'react';
import { useFeatureSliders, type FeatureSlider } from './useFeatureSliders';
import { useHistory } from './useHistory';

export function useSlidersWithHistory() {
  // Feature sliders with history/undo support
  const { 
    featureSliders, 
    sliderValues: currentSliderValues, 
    handleSliderChange: baseHandleSliderChange, 
    resetSliders: baseResetSliders, 
    randomizeSliders 
  } = useFeatureSliders();
  
  // Add history tracking for slider values
  const { 
    state: sliderValues, 
    pushState: pushSliderState, 
    undo, 
    redo, 
    canUndo, 
    canRedo 
  } = useHistory<Record<string, number>>(currentSliderValues);
  
  // Handle slider changes with history
  const handleSliderChange = useCallback((id: string, value: number) => {
    baseHandleSliderChange(id, value);
  }, [baseHandleSliderChange]);
  
  // After slider changes finish (e.g., on slider release), push to history
  const handleSliderChangeComplete = useCallback(() => {
    pushSliderState(currentSliderValues);
  }, [pushSliderState, currentSliderValues]);
  
  // Reset sliders with history
  const resetSliders = useCallback(() => {
    baseResetSliders();
    pushSliderState(currentSliderValues);
  }, [baseResetSliders, pushSliderState, currentSliderValues]);
  
  // Apply a randomized preset with history
  const handleRandomize = useCallback(() => {
    randomizeSliders();
    pushSliderState(currentSliderValues);
  }, [randomizeSliders, pushSliderState, currentSliderValues]);

  return {
    featureSliders,
    sliderValues,
    currentSliderValues,
    handleSliderChange,
    handleSliderChangeComplete,
    resetSliders,
    handleRandomize,
    undo,
    redo,
    canUndo,
    canRedo,
    pushSliderState
  };
}
