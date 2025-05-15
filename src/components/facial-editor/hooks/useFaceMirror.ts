
import { useState, useCallback } from 'react';

export const useFaceMirror = (
  sliderValues: Record<string, number>,
  handleSliderChange: (id: string, value: number) => void,
  pushSliderState: (state: Record<string, number>) => void,
  currentSliderValues: Record<string, number>
) => {
  const [mirrorEnabled, setMirrorEnabled] = useState(Boolean(sliderValues.mirrorFace) && sliderValues.mirrorFace > 0);
  const [mirrorSide, setMirrorSide] = useState(sliderValues.mirrorSide || 0); // 0 = left, 1 = right
  
  const handleToggleMirror = useCallback(() => {
    const newMirrorEnabled = !mirrorEnabled;
    setMirrorEnabled(newMirrorEnabled);
    
    // Update slider values
    const newValue = newMirrorEnabled ? 1 : 0;
    handleSliderChange('mirrorFace', newValue);
    pushSliderState({...currentSliderValues, mirrorFace: newValue});
  }, [mirrorEnabled, handleSliderChange, pushSliderState, currentSliderValues]);
  
  const handleToggleMirrorSide = useCallback(() => {
    const newSide = mirrorSide === 0 ? 1 : 0;
    setMirrorSide(newSide);
    
    // Update slider values
    handleSliderChange('mirrorSide', newSide);
    pushSliderState({...currentSliderValues, mirrorSide: newSide});
  }, [mirrorSide, handleSliderChange, pushSliderState, currentSliderValues]);

  return {
    mirrorEnabled,
    mirrorSide,
    handleToggleMirror,
    handleToggleMirrorSide
  };
};
