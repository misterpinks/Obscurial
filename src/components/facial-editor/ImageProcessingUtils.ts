
import { createImageFromCanvas } from './utils/canvasUtils';
import { applyFeatureTransformations } from './utils/transformationEngine';
import { drawFaceLandmarks } from './utils/landmarkVisualization';
import type { TransformationParams } from './utils/transformationTypes';

// Export transformation utilities
import { calculateTransitionFactor, bilinearInterpolation } from './utils/transformation/transformCore';
import { processRow } from './utils/transformation/pixelProcessor';
import { processImageInChunks } from './utils/transformation/chunkedProcessor';
import { adjustSliderValues, hasTransformations, hasEffects } from './utils/transformation/sliderAdjuster';

// Re-export all functions that were originally available
export {
  createImageFromCanvas,
  applyFeatureTransformations,
  drawFaceLandmarks,
  TransformationParams,
  
  // Also export new modular transformation functions
  calculateTransitionFactor,
  bilinearInterpolation,
  processRow,
  processImageInChunks,
  adjustSliderValues,
  hasTransformations,
  hasEffects
};
