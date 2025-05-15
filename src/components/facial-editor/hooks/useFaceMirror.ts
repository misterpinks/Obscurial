
import { useState, useCallback } from 'react';

export interface MirrorOptions {
  enabled: boolean;
  side: number; // 0 = left to right, 1 = right to left
  offsetX: number; // -1 to 1 range for line position (-1 = far left, 0 = center, 1 = far right)
  angle: number; // -45 to 45 degrees
  cutoffY: number; // 0 to 1 range (0 = top, 1 = bottom)
}

export const useFaceMirror = (
  sliderValues: Record<string, number>,
  handleSliderChange: (id: string, value: number) => void,
  pushSliderState: () => void,
  currentSliderValues: Record<string, number>
) => {
  const [mirrorEnabled, setMirrorEnabled] = useState(Boolean(sliderValues.mirrorFace) && sliderValues.mirrorFace > 0);
  const [mirrorSide, setMirrorSide] = useState(sliderValues.mirrorSide || 0); // 0 = left, 1 = right
  const [mirrorOffsetX, setMirrorOffsetX] = useState(sliderValues.mirrorOffsetX || 0); // -1 to 1
  const [mirrorAngle, setMirrorAngle] = useState(sliderValues.mirrorAngle || 0); // -45 to 45 degrees
  const [mirrorCutoffY, setMirrorCutoffY] = useState(sliderValues.mirrorCutoffY || 1); // 0 to 1
  
  const handleToggleMirror = useCallback(() => {
    const newMirrorEnabled = !mirrorEnabled;
    setMirrorEnabled(newMirrorEnabled);
    
    // Update slider values
    const newValue = newMirrorEnabled ? 1 : 0;
    handleSliderChange('mirrorFace', newValue);
    
    // Update state after all changes
    pushSliderState();
  }, [mirrorEnabled, handleSliderChange, pushSliderState]);
  
  const handleToggleMirrorSide = useCallback(() => {
    const newSide = mirrorSide === 0 ? 1 : 0;
    setMirrorSide(newSide);
    
    // Update slider values
    handleSliderChange('mirrorSide', newSide);
    
    // Update state after all changes
    pushSliderState();
  }, [mirrorSide, handleSliderChange, pushSliderState]);
  
  const handleMirrorOffsetChange = useCallback((value: number) => {
    setMirrorOffsetX(value);
    handleSliderChange('mirrorOffsetX', value);
    
    // Don't push state immediately to avoid too many history entries while dragging
  }, [handleSliderChange]);
  
  const handleMirrorOffsetChangeComplete = useCallback(() => {
    // Only push to history when user finishes changing
    pushSliderState();
  }, [pushSliderState]);
  
  const handleMirrorAngleChange = useCallback((value: number) => {
    setMirrorAngle(value);
    handleSliderChange('mirrorAngle', value);
    
    // Don't push state immediately
  }, [handleSliderChange]);
  
  const handleMirrorAngleChangeComplete = useCallback(() => {
    // Only push to history when user finishes changing
    pushSliderState();
  }, [pushSliderState]);
  
  const handleMirrorCutoffChange = useCallback((value: number) => {
    setMirrorCutoffY(value);
    handleSliderChange('mirrorCutoffY', value);
    
    // Don't push state immediately
  }, [handleSliderChange]);
  
  const handleMirrorCutoffChangeComplete = useCallback(() => {
    // Only push to history when user finishes changing
    pushSliderState();
  }, [pushSliderState]);
  
  const getMirrorOptions = useCallback((): MirrorOptions => {
    return {
      enabled: mirrorEnabled,
      side: mirrorSide,
      offsetX: mirrorOffsetX,
      angle: mirrorAngle,
      cutoffY: mirrorCutoffY
    };
  }, [mirrorEnabled, mirrorSide, mirrorOffsetX, mirrorAngle, mirrorCutoffY]);

  return {
    mirrorEnabled,
    mirrorSide,
    mirrorOffsetX,
    mirrorAngle,
    mirrorCutoffY,
    handleToggleMirror,
    handleToggleMirrorSide,
    handleMirrorOffsetChange,
    handleMirrorOffsetChangeComplete,
    handleMirrorAngleChange,
    handleMirrorAngleChangeComplete,
    handleMirrorCutoffChange,
    handleMirrorCutoffChangeComplete,
    getMirrorOptions
  };
};
