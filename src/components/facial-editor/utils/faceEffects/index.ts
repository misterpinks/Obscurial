
import { applyBlur } from './blurEffect';
import { applyFaceMask } from './maskEffect';
import { applyPixelation } from './pixelateEffect';

/**
 * Apply selected face effect based on provided parameters
 * with comprehensive error handling
 */
export const applyFaceEffect = ({
  ctx,
  originalImage,
  faceDetection,
  effectType,
  effectIntensity,
  maskImage,
  maskPosition = { x: 0, y: 0 },
  maskScale = 1
}: {
  ctx: CanvasRenderingContext2D;
  originalImage: HTMLImageElement;
  faceDetection: any | null;
  effectType: 'blur' | 'pixelate' | 'mask' | 'none';
  effectIntensity: number;
  maskImage?: HTMLImageElement | null;
  maskPosition?: { x: number, y: number };
  maskScale?: number;
}) => {
  if (!faceDetection || effectType === 'none' || effectIntensity <= 0) return;
  
  try {
    // Get face bounding box
    const box = faceDetection.detection.box;
    
    // Additional validation of face box values
    if (!box || typeof box.x !== 'number' || typeof box.y !== 'number' || 
        typeof box.width !== 'number' || typeof box.height !== 'number' ||
        box.width <= 0 || box.height <= 0) {
      console.warn("Invalid face detection box data");
      return;
    }
    
    // Apply effect based on type
    switch (effectType) {
      case 'blur':
        applyBlur(ctx, box.x, box.y, box.width, box.height, effectIntensity * 0.5);
        break;
      case 'pixelate':
        // Increase the intensity impact for pixelation to make it more visible
        // Cap the max pixel size to prevent crashes with very high values
        const maxSafePixelSize = Math.min(20, Math.floor(effectIntensity * 0.3));
        applyPixelation(ctx, box.x, box.y, box.width, box.height, Math.max(2, maxSafePixelSize));
        break;
      case 'mask':
        if (maskImage) {
          applyFaceMask(
            ctx, 
            maskImage, 
            box.x, 
            box.y, 
            box.width, 
            box.height,
            maskPosition,
            maskScale
          );
        }
        break;
      default:
        break;
    }
  } catch (error) {
    console.error("Error applying face effect:", error);
    // Gracefully fail without crashing the application
  }
};

// Re-export the individual functions for direct usage
export { applyBlur, applyFaceMask, applyPixelation };
