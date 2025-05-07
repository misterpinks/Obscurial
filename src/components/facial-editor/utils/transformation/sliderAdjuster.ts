
/**
 * Utilities for slider value adjustment and validation
 */

import { FaceEffectOptions } from '../transformationTypes';

// Check if any transformations are needed based on slider values
export const hasTransformations = (sliderValues: Record<string, number> | undefined): boolean => {
  if (!sliderValues) return false;
  
  // Check each slider value - if any non-zero values are found, transformations are needed
  return Object.values(sliderValues).some(value => value !== 0);
};

// Check if any face effects are needed
export const hasEffects = (faceEffectOptions: FaceEffectOptions | undefined): boolean => {
  if (!faceEffectOptions) return false;
  
  // If effect type is not 'none' and intensity is > 0, effects are needed
  return faceEffectOptions.effectType !== 'none' && faceEffectOptions.effectIntensity > 0;
};

// Adjust slider values to prevent extreme transformations
export const adjustSliderValues = (sliderValues: Record<string, number>): Record<string, number> => {
  if (!sliderValues) return {};
  
  // Create a copy to avoid modifying the original
  const adjusted = { ...sliderValues };
  
  // Define maximum safe values for different slider categories
  const maxValues = {
    // Eyes and eyebrows - more sensitive, use lower max values
    eyeSize: 75,
    eyeSpacing: 50,
    eyebrowHeight: 50,
    
    // Nose - moderate sensitivity
    noseWidth: 75,
    noseLength: 60,
    
    // Mouth - moderate sensitivity
    mouthWidth: 75,
    mouthHeight: 60,
    
    // Face shape - less sensitive, can have higher values
    faceWidth: 80,
    chinShape: 70,
    jawline: 70,
    
    // Default for any other sliders
    default: 75
  };
  
  // Apply clamping to each slider value
  Object.keys(adjusted).forEach(key => {
    // Get the max value for this slider, or use default
    const maxValue = maxValues[key as keyof typeof maxValues] || maxValues.default;
    
    // Clamp the value between -maxValue and +maxValue
    adjusted[key] = Math.max(-maxValue, Math.min(maxValue, adjusted[key]));
  });
  
  return adjusted;
};
