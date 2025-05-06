
import { useState, useCallback, useEffect } from 'react';
import type { FaceEffectType } from '../FaceMaskSelector';

export const useFaceEffects = () => {
  const [effectType, setEffectType] = useState<FaceEffectType>('none');
  const [effectIntensity, setEffectIntensity] = useState(15);
  const [selectedMaskId, setSelectedMaskId] = useState<string | null>(null);
  const [maskImage, setMaskImage] = useState<HTMLImageElement | null>(null);
  
  // State for mask positioning and sizing with better defaults
  const [maskPosition, setMaskPosition] = useState({ x: 0, y: 0 });
  const [maskScale, setMaskScale] = useState(1);

  // Set default position based on mask name/path
  const handleLoadMaskImage = useCallback((img: HTMLImageElement | null) => {
    setMaskImage(img);

    // When a new mask is loaded, set position based on the mask type
    if (img) {
      const imgSrc = img.src.toLowerCase();
      
      // Apply specific default positions based on mask type
      if (imgSrc.includes('mask1.png')) {
        // Mask 1 needs y: -19
        setMaskPosition({ x: 0, y: -0.19 });
      } else if (imgSrc.includes('mask2.png') || imgSrc.includes('mask3.png')) {
        // Masks 2 and 3 need y: -40
        setMaskPosition({ x: 0, y: -0.40 });
      } else if (imgSrc.includes('black-bar.png')) {
        // Black bar is already perfect at default position
        setMaskPosition({ x: 0, y: 0 });
      } else {
        // Default position for any other masks
        setMaskPosition({ x: 0, y: 0 });
      }
      
      setMaskScale(1);
    }
  }, []);

  // Reset all effects
  const resetEffects = useCallback(() => {
    setEffectType('none');
    setEffectIntensity(15);
    setSelectedMaskId(null);
    setMaskImage(null);
    setMaskPosition({ x: 0, y: 0 });
    setMaskScale(1);
  }, []);

  // Effect to ensure we have consistent mask position and scale values
  useEffect(() => {
    // If there's no mask but we have a position or scale, reset them
    if (!maskImage && (maskPosition.x !== 0 || maskPosition.y !== 0 || maskScale !== 1)) {
      setMaskPosition({ x: 0, y: 0 });
      setMaskScale(1);
    }
  }, [maskImage, maskPosition, maskScale]);

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
