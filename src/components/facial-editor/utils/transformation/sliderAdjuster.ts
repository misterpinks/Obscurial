
/**
 * Handles adjustments to slider values for safer transformations
 */

// Safely adjust slider values to prevent extreme transformations
export const adjustSliderValues = (sliderValues: Record<string, number>): Record<string, number> => {
  if (!sliderValues) return {};
  
  const clampedSliderValues = { ...sliderValues };
  
  // Apply gradual dampening to extreme values
  Object.keys(clampedSliderValues).forEach(key => {
    const value = clampedSliderValues[key];
    if (Math.abs(value) > 60) {
      const excess = Math.abs(value) - 60;
      // Apply logarithmic dampening to excess values
      const dampened = 60 + Math.log10(1 + excess) * 5;
      clampedSliderValues[key] = value > 0 ? dampened : -dampened;
    }
  });
  
  return clampedSliderValues;
};

// Check if any transformations are needed
export const hasTransformations = (sliderValues: Record<string, number> | undefined): boolean => {
  if (!sliderValues) return false;
  
  return Object.values(sliderValues).some(value => Math.abs(value) > 0.1);
};

// Check if effects are needed
export const hasEffects = (faceEffectOptions?: {
  effectType: 'blur' | 'pixelate' | 'mask' | 'none';
  effectIntensity: number;
  maskImage?: HTMLImageElement | null;
}): boolean => {
  if (!faceEffectOptions) return false;
  
  const { effectType, effectIntensity, maskImage } = faceEffectOptions;
  
  // For mask type, we also need a valid mask image
  if (effectType === 'mask') {
    return maskImage !== null && maskImage !== undefined && effectIntensity > 0;
  }
  
  return effectType !== 'none' && effectIntensity > 0;
};
