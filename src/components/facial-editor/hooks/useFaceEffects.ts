
import { useState, useCallback } from 'react';
import type { FaceEffectType } from '../FaceMaskSelector';

export const useFaceEffects = () => {
  const [effectType, setEffectType] = useState<FaceEffectType>('none');
  const [effectIntensity, setEffectIntensity] = useState(15);
  const [selectedMaskId, setSelectedMaskId] = useState<string | null>(null);
  const [maskImage, setMaskImage] = useState<HTMLImageElement | null>(null);

  const handleLoadMaskImage = useCallback((img: HTMLImageElement | null) => {
    setMaskImage(img);
  }, []);

  const resetEffects = useCallback(() => {
    setEffectType('none');
    setEffectIntensity(15);
    setSelectedMaskId(null);
    setMaskImage(null);
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
    
    // Combined options for transformation engine
    faceEffectOptions: {
      effectType,
      effectIntensity,
      maskImage
    }
  };
};
