
/**
 * Utilities for adjusting and validating slider values
 */

// Clamp slider values to reasonable ranges
// Prevents transformations from going beyond displayable limits
export const adjustSliderValues = (sliderValues: Record<string, number>) => {
  const clampedValues: Record<string, number> = {};
  
  // Process each slider value
  Object.entries(sliderValues).forEach(([key, value]) => {
    // Normal range is -60 to +60, with strict clamping
    clampedValues[key] = Math.max(-60, Math.min(60, value));
  });
  
  return clampedValues;
};

// Check if any transformations are needed
export const hasTransformations = (sliderValues: Record<string, number>) => {
  // Check if any slider has a non-zero value (with a small epsilon to handle floating point comparisons)
  return Object.values(sliderValues).some(value => Math.abs(value) > 0.01);
};

// Check if any effects need to be applied
export const hasEffects = (faceEffectOptions?: {
  effectType: 'blur' | 'pixelate' | 'mask' | 'none';
  effectIntensity: number;
  maskImage?: HTMLImageElement | null;
  maskPosition?: { x: number, y: number };
  maskScale?: number;
}) => {
  if (!faceEffectOptions) return false;
  
  // Check if there's an active effect with non-zero intensity
  return faceEffectOptions.effectType !== 'none' && faceEffectOptions.effectIntensity > 0;
};
