
import { FaceEffectOptions } from './transformationTypes';
import { processImageInChunks } from './transformation/chunkedProcessor';
import { adjustSliderValues, hasTransformations, hasEffects } from './transformation/sliderAdjuster';
import { applyFaceEffect } from './faceEffects';

interface TransformEngineProps {
  ctx: CanvasRenderingContext2D;
  originalImage: HTMLImageElement;
  width: number;
  height: number;
  faceDetection: any;
  sliderValues: Record<string, number>;
  faceEffectOptions?: FaceEffectOptions;
  worker?: Worker;
}

// Function to mirror face - will be called directly in applyFeatureTransformations
export function mirrorFace(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rightToLeft: boolean = false
): void {
  // Create a temporary canvas to hold the original image
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  
  if (!tempCtx) return;
  
  // Copy the current content to the temporary canvas
  tempCtx.drawImage(ctx.canvas, 0, 0);
  
  // Clear the original canvas
  ctx.clearRect(0, 0, width, height);
  
  // Calculate the center line for mirroring
  const centerX = width / 2;
  
  // Redraw the original image
  ctx.drawImage(tempCanvas, 0, 0);
  
  // Mirror the appropriate half of the face
  ctx.save();
  
  if (rightToLeft) {
    // Right to left: Copy right side to left side
    ctx.translate(centerX, 0);
    ctx.scale(-1, 1);
    ctx.translate(-centerX, 0);
    ctx.drawImage(tempCanvas, centerX, 0, centerX, height, centerX, 0, centerX, height);
  } else {
    // Left to right: Copy left side to right side
    ctx.translate(centerX, 0);
    ctx.scale(-1, 1);
    ctx.translate(-centerX, 0);
    ctx.drawImage(tempCanvas, 0, 0, centerX, height, 0, 0, centerX, height);
  }
  
  ctx.restore();
}

export const applyFeatureTransformations = async ({
  ctx,
  originalImage,
  width,
  height,
  faceDetection,
  sliderValues,
  faceEffectOptions,
  worker
}: TransformEngineProps): Promise<void> => {
  // Apply face mirroring first if enabled
  if (sliderValues.mirrorFace && sliderValues.mirrorFace > 0) {
    // Draw the original image first (important!)
    ctx.drawImage(originalImage, 0, 0);
    // Then apply mirroring
    const mirrorSide = sliderValues.mirrorSide || 0; // 0 = left to right, 1 = right to left
    mirrorFace(ctx, width, height, mirrorSide === 1);
    // Return early if no other transformations are needed
    if (!hasTransformations(sliderValues) && !hasEffects(faceEffectOptions)) {
      return;
    }
  } else {
    // If no mirroring, draw the original image
    ctx.drawImage(originalImage, 0, 0);
  }
  
  // If mirroring is the only transformation, we're already done
  if (sliderValues.mirrorFace && sliderValues.mirrorFace > 0 && 
      !hasTransformations(sliderValues) && !hasEffects(faceEffectOptions)) {
    return;
  }
  
  // Otherwise, continue with normal transformations
  const startTime = performance.now();

  try {
    // Adjust slider values for processing
    const adjustedSliderValues = adjustSliderValues(sliderValues);
    
    // For small images, process directly
    if (width * height < 500000) {
      console.log('Processing small image directly');
      if (worker) {
        // Process using Web Worker
        await processImageInChunks({
          ctx,
          originalImage,
          width,
          height,
          faceDetection,
          sliderValues: adjustedSliderValues,
          worker
        });
      } else {
        // Fallback to direct processing
        await processImageInChunks({
          ctx,
          originalImage,
          width,
          height,
          faceDetection,
          sliderValues: adjustedSliderValues
        });
      }
    } else {
      // Process large images in chunks
      console.log('Processing large image in chunks');
      await processImageInChunks({
        ctx, 
        originalImage,
        width,
        height,
        faceDetection,
        sliderValues: adjustedSliderValues,
        worker
      });
    }

    // Apply any additional face effects
    if (faceEffectOptions && faceEffectOptions.effectType !== 'none') {
      applyFaceEffect({
        ctx,
        originalImage,
        faceDetection,
        effectType: faceEffectOptions.effectType,
        effectIntensity: faceEffectOptions.effectIntensity,
        maskImage: faceEffectOptions.maskImage,
        maskPosition: faceEffectOptions.maskPosition,
        maskScale: faceEffectOptions.maskScale
      });
    }

    console.log(`Image transformations completed in ${Math.round(performance.now() - startTime)}ms`);
  } catch (error) {
    console.error('Error in transformation engine:', error);
    // Fallback: just show the original image if transformations fail
    ctx.drawImage(originalImage, 0, 0);
  }
};
