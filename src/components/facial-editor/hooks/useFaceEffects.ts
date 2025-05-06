
import { useState, useCallback } from 'react';
import type { FaceEffectType } from '../FaceMaskSelector';

export const useFaceEffects = () => {
  const [effectType, setEffectType] = useState<FaceEffectType>('none');
  const [effectIntensity, setEffectIntensity] = useState(15);
  const [selectedMaskId, setSelectedMaskId] = useState<string | null>(null);
  const [maskImage, setMaskImage] = useState<HTMLImageElement | null>(null);
  
  // New state for mask positioning and sizing
  const [maskPosition, setMaskPosition] = useState({ x: 0, y: 0 });
  const [maskScale, setMaskScale] = useState(1);

  const handleLoadMaskImage = useCallback((img: HTMLImageElement | null) => {
    setMaskImage(img);
  }, []);

  const resetEffects = useCallback(() => {
    setEffectType('none');
    setEffectIntensity(15);
    setSelectedMaskId(null);
    setMaskImage(null);
    setMaskPosition({ x: 0, y: 0 });
    setMaskScale(1);
  }, []);

  return {
    effectType,
    setEffectType,
    effectIntensity,
    setEffectIntensity,
    selectedMaskId,
    setSelectedMaskId,
    maskImage,
    handleLoadMaskImage,
    resetEffects,
    
    // Mask positioning and scaling
    maskPosition,
    setMaskPosition,
    maskScale,
    setMaskScale,
    
    // Combined options for transformation engine
    faceEffectOptions: {
      effectType,
      effectIntensity,
      maskImage,
      maskPosition,
      maskScale
    }
  };
};
