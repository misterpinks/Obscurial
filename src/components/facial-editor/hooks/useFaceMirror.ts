
import { useState, useCallback } from 'react';

export interface MirrorOptions {
  offsetX?: number; // -1 to 1 range for line position
  angle?: number; // -45 to 45 degrees
  cutoffY?: number; // 0 to 1 range (0 = top, 1 = bottom of image)
}

export const useFaceMirror = (
  sliderValues: Record<string, number>,
  onSliderChange: (id: string, value: number) => void,
  onSliderChangeComplete: () => void,
  currentSliderValues: Record<string, number>
) => {
  // Add null checks with default values to prevent accessing properties of undefined
  const mirrorFaceValue = sliderValues?.mirrorFace || 0;
  const [mirrorEnabled, setMirrorEnabled] = useState(Boolean(mirrorFaceValue) && mirrorFaceValue > 0);
  const [mirrorSide, setMirrorSide] = useState(sliderValues?.mirrorSide || 0); // 0 = left, 1 = right
  const [mirrorOffsetX, setMirrorOffsetX] = useState(sliderValues?.mirrorOffsetX || 0); // -1 to 1
  const [mirrorAngle, setMirrorAngle] = useState(sliderValues?.mirrorAngle || 0); // -45 to 45 degrees
  const [mirrorCutoffY, setMirrorCutoffY] = useState(sliderValues?.mirrorCutoffY !== undefined ? sliderValues.mirrorCutoffY : 1); // 0 to 1
  
  const handleToggleMirror = useCallback(() => {
    const newMirrorEnabled = !mirrorEnabled;
    setMirrorEnabled(newMirrorEnabled);
    onSliderChange('mirrorFace', newMirrorEnabled ? 1 : 0);
    onSliderChangeComplete();
  }, [mirrorEnabled, onSliderChange, onSliderChangeComplete]);
  
  const handleToggleMirrorSide = useCallback(() => {
    const newMirrorSide = mirrorSide === 0 ? 1 : 0;
    setMirrorSide(newMirrorSide);
    onSliderChange('mirrorSide', newMirrorSide);
    onSliderChangeComplete();
  }, [mirrorSide, onSliderChange, onSliderChangeComplete]);
  
  const handleMirrorOffsetChange = useCallback((value: number) => {
    setMirrorOffsetX(value);
    onSliderChange('mirrorOffsetX', value);
  }, [onSliderChange]);
  
  const handleMirrorOffsetChangeComplete = useCallback(() => {
    onSliderChangeComplete();
  }, [onSliderChangeComplete]);
  
  const handleMirrorAngleChange = useCallback((value: number) => {
    setMirrorAngle(value);
    onSliderChange('mirrorAngle', value);
  }, [onSliderChange]);
  
  const handleMirrorAngleChangeComplete = useCallback(() => {
    onSliderChangeComplete();
  }, [onSliderChangeComplete]);
  
  const handleMirrorCutoffChange = useCallback((value: number) => {
    setMirrorCutoffY(value);
    onSliderChange('mirrorCutoffY', value);
  }, [onSliderChange]);
  
  const handleMirrorCutoffChangeComplete = useCallback(() => {
    onSliderChangeComplete();
  }, [onSliderChangeComplete]);
  
  const getMirrorOptions = useCallback((): MirrorOptions => {
    return {
      offsetX: mirrorOffsetX,
      angle: mirrorAngle,
      cutoffY: mirrorCutoffY
    };
  }, [mirrorOffsetX, mirrorAngle, mirrorCutoffY]);

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
