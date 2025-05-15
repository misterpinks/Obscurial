
/**
 * Optimized face effects module that re-exports functionality
 * from the modular face effects system.
 */

// We're exporting exactly what we need for better tree-shaking
export { 
  applyFaceEffect,
  applyBlur,
  applyFaceMask,
  applyPixelation 
} from './faceEffects/index';
