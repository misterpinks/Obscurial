
/**
 * Central export point for all image processing utilities
 */

import { createImageFromCanvas } from './utils/canvasUtils';
import { applyFeatureTransformations } from './utils/transformationEngine';
import { drawFaceLandmarks } from './utils/landmarkVisualization';
import type { TransformationParams } from './utils/transformationTypes';

// Export transformation utilities
import { 
  calculateTransitionFactor, 
  bilinearInterpolation,
  copyPixel 
} from './utils/transformation/transformCore';
import { processRow } from './utils/transformation/pixelProcessor';
import { processImageInChunks } from './utils/transformation/chunkedProcessor';
import { adjustSliderValues, hasTransformations, hasEffects } from './utils/transformation/sliderAdjuster';

// Export face effects
import { 
  applyFaceEffect,
  applyBlur,
  applyFaceMask,
  applyPixelation 
} from './utils/faceEffects';

// Re-export all functions that were originally available
export {
  createImageFromCanvas,
  applyFeatureTransformations,
  drawFaceLandmarks,
  TransformationParams,
  
  // Also export modular transformation functions
  calculateTransitionFactor,
  bilinearInterpolation,
  copyPixel,
  processRow,
  processImageInChunks,
  adjustSliderValues,
  hasTransformations,
  hasEffects,
  
  // Face effects
  applyFaceEffect,
  applyBlur,
  applyFaceMask,
  applyPixelation
};
