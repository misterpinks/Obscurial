
/**
 * Utilities for adjusting and validating slider values
 */

// Clamp slider values to reasonable ranges
// Prevents transformations from going beyond displayable limits
export const adjustSliderValues = (sliderValues: Record<string, number>) => {
  const clampedValues: Record<string, number> = {};
  
  // Process each slider value
  Object.entries(sliderValues).forEach(([key, value]) => {
    // Ensure values are within safe range (-60 to +60)
    // This prevents visual artifacts while allowing UI to show wider range
    clampedValues[key] = Math.max(-60, Math.min(60, value));
    
    // Ensure values are numbers (protection against NaN)
    if (isNaN(clampedValues[key])) {
      console.warn(`Slider value for ${key} was NaN, resetting to 0`);
      clampedValues[key] = 0;
    }
  });
  
  return clampedValues;
};

// Check if any transformations are needed - optimized for performance
export const hasTransformations = (sliderValues: Record<string, number>) => {
  if (!sliderValues) return false;
  
  // Check if any slider has a non-zero value
  for (const key in sliderValues) {
    // Use a tiny threshold to account for floating point precision
    if (Math.abs(sliderValues[key]) > 0.01) return true;
  }
  return false;
};

// Check if any effects need to be applied - simplified for performance
export const hasEffects = (faceEffectOptions?: {
  effectType: 'blur' | 'pixelate' | 'mask' | 'none';
  effectIntensity: number;
  maskImage?: HTMLImageElement | null;
  maskPosition?: { x: number, y: number };
  maskScale?: number;
}) => {
  return !!(faceEffectOptions && 
    faceEffectOptions.effectType !== 'none' && 
    faceEffectOptions.effectIntensity > 0);
};
