
import { useMemo } from 'react';
import { useFaceMirror } from './useFaceMirror';
import { useFaceEffects } from './useFaceEffects';
import FaceMaskSelector from '../FaceMaskSelector';
import FaceMirrorControls from '../FaceMirrorControls';

export function useMirroringAndEffects(
  sliderValues: Record<string, number>,
  handleSliderChange: (id: string, value: number) => void,
  handleSliderChangeComplete: () => void,
  currentSliderValues: Record<string, number>
) {
  // Extract face effects
  const {
    effectType,
    setEffectType,
    effectIntensity,
    setEffectIntensity,
    selectedMaskId,
    setSelectedMaskId,
    maskImage,
    handleLoadMaskImage,
    resetEffects,
    maskPosition,
    setMaskPosition,
    maskScale,
    setMaskScale,
    faceEffectOptions
  } = useFaceEffects();

  // Extract mirror controls
  const {
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
  } = useFaceMirror(
    sliderValues || {},
    handleSliderChange,
    handleSliderChangeComplete,
    currentSliderValues || {}
  );
  
  // Create component instances for easy reuse
  const faceMaskSelector = useMemo(() => (
    <FaceMaskSelector
      effectType={effectType}
      setEffectType={setEffectType}
      effectIntensity={effectIntensity}
      setEffectIntensity={setEffectIntensity}
      selectedMaskId={selectedMaskId}
      setSelectedMaskId={setSelectedMaskId}
      onLoadMaskImage={handleLoadMaskImage}
      maskPosition={maskPosition}
      setMaskPosition={setMaskPosition}
      maskScale={maskScale}
      setMaskScale={setMaskScale}
    />
  ), [
    effectType, setEffectType, effectIntensity, setEffectIntensity,
    selectedMaskId, setSelectedMaskId, handleLoadMaskImage,
    maskPosition, setMaskPosition, maskScale, setMaskScale
  ]);

  const mirrorControlsElement = useMemo(() => (
    <FaceMirrorControls
      mirrorEnabled={mirrorEnabled}
      mirrorSide={mirrorSide}
      mirrorOffsetX={mirrorOffsetX}
      mirrorAngle={mirrorAngle}
      mirrorCutoffY={mirrorCutoffY}
      onToggleMirror={handleToggleMirror}
      onToggleSide={handleToggleMirrorSide}
      onOffsetChange={handleMirrorOffsetChange}
      onOffsetChangeComplete={handleMirrorOffsetChangeComplete}
      onAngleChange={handleMirrorAngleChange}
      onAngleChangeComplete={handleMirrorAngleChangeComplete}
      onCutoffChange={handleMirrorCutoffChange}
      onCutoffChangeComplete={handleMirrorCutoffChangeComplete}
    />
  ), [
    mirrorEnabled, mirrorSide, mirrorOffsetX, mirrorAngle, mirrorCutoffY,
    handleToggleMirror, handleToggleMirrorSide, 
    handleMirrorOffsetChange, handleMirrorOffsetChangeComplete,
    handleMirrorAngleChange, handleMirrorAngleChangeComplete,
    handleMirrorCutoffChange, handleMirrorCutoffChangeComplete
  ]);

  return {
    // Face effects
    effectType,
    setEffectType,
    effectIntensity,
    setEffectIntensity,
    selectedMaskId,
    setSelectedMaskId,
    maskImage,
    handleLoadMaskImage,
    resetEffects,
    maskPosition,
    setMaskPosition,
    maskScale,
    setMaskScale,
    faceEffectOptions,
    
    // Mirroring
    mirrorEnabled,
    mirrorSide,
    handleToggleMirror,
    handleToggleMirrorSide,
    getMirrorOptions,
    
    // Components
    faceMaskSelector,
    mirrorControlsElement
  };
}
